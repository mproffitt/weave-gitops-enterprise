package server_test

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/go-logr/logr"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	pb "github.com/weaveworks/weave-gitops-enterprise/pkg/api/gitauth"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/gitauth/azure"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/gitauth/bitbucket"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/gitauth/server"
	"github.com/weaveworks/weave-gitops/pkg/gitproviders"
	"github.com/weaveworks/weave-gitops/pkg/kube"
	"github.com/weaveworks/weave-gitops/pkg/kube/kubefakes"
	"github.com/weaveworks/weave-gitops/pkg/server/middleware"
	"github.com/weaveworks/weave-gitops/pkg/services/auth"
	"github.com/weaveworks/weave-gitops/pkg/services/auth/authfakes"
	authtypes "github.com/weaveworks/weave-gitops/pkg/services/auth/types"
	"github.com/weaveworks/weave-gitops/pkg/testutils"
	"github.com/weaveworks/weave-gitops/pkg/vendorfakes/fakelogr"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/grpc/test/bufconn"
	"k8s.io/apimachinery/pkg/util/rand"
	"sigs.k8s.io/controller-runtime/pkg/client/fake"
)

var _ = Describe("ApplicationsServer", func() {
	var (
		ctx context.Context
	)

	BeforeEach(func() {
		ctx = context.Background()
	})

	Describe("Authenticate", func() {
		var (
			token    string
			provider string
		)

		BeforeEach(func() {
			token = "token"
			provider = "github"
		})

		It("succeeds on happy path", func() {
			jwtClient := auth.NewJwtClient(secretKey)
			expectedToken, err := jwtClient.GenerateJWT(auth.ExpirationTime, gitproviders.GitProviderGitHub, token)
			Expect(err).NotTo(HaveOccurred())

			res, err := appsClient.Authenticate(ctx, &pb.AuthenticateRequest{
				ProviderName: provider,
				AccessToken:  token,
			})
			Expect(err).NotTo(HaveOccurred())

			Expect(res.Token).To(Equal(expectedToken))
		})

		It("fails when given an unsupported provider", func() {
			provider := "wrong_provider"

			_, err := appsClient.Authenticate(ctx, &pb.AuthenticateRequest{
				ProviderName: provider,
				AccessToken:  token,
			})

			Expect(err.Error()).To(ContainSubstring(server.ErrBadProvider.Error()))
			Expect(err.Error()).To(ContainSubstring(codes.InvalidArgument.String()))
		})

		It("fails when the provider token is empty", func() {
			_, err := appsClient.Authenticate(ctx, &pb.AuthenticateRequest{
				ProviderName: provider,
				AccessToken:  "",
			})

			Expect(err).Should(testutils.MatchGRPCError(codes.InvalidArgument, server.ErrEmptyAccessToken))
		})
	})

	Describe("GetGithubDeviceCode", func() {
		It("returns a device code", func() {
			code := "123-456"
			ghAuthClient.GetDeviceCodeStub = func() (*auth.GithubDeviceCodeResponse, error) {
				return &auth.GithubDeviceCodeResponse{DeviceCode: code}, nil
			}

			res, err := appsClient.GetGithubDeviceCode(ctx, &pb.GetGithubDeviceCodeRequest{})
			Expect(err).NotTo(HaveOccurred())

			Expect(res.DeviceCode).To(Equal(code))
		})

		It("returns an error when github returns an error", func() {
			someError := errors.New("some gh error")
			ghAuthClient.GetDeviceCodeStub = func() (*auth.GithubDeviceCodeResponse, error) {
				return nil, someError
			}
			_, err := appsClient.GetGithubDeviceCode(ctx, &pb.GetGithubDeviceCodeRequest{})
			Expect(err).To(HaveOccurred())
			st, ok := status.FromError(err)
			Expect(ok).To(BeTrue(), "could not get grpc status from err")
			Expect(st.Message()).To(ContainSubstring(someError.Error()))
		})
	})

	Describe("GetGithubAuthStatus", func() {
		It("returns an ErrAuthPending when the user is not yet authenticated", func() {
			ghAuthClient.GetDeviceCodeAuthStatusStub = func(s string) (string, error) {
				return "", auth.ErrAuthPending
			}
			res, err := appsClient.GetGithubAuthStatus(ctx, &pb.GetGithubAuthStatusRequest{DeviceCode: "somedevicecode"})
			Expect(err).To(HaveOccurred())
			Expect(res).To(BeNil())

			st, ok := status.FromError(err)
			Expect(ok).To(BeTrue(), "could not get status from err")
			Expect(st.Message()).To(ContainSubstring(auth.ErrAuthPending.Error()))
		})

		It("returns a jwt if the user has authenticated", func() {
			token := "abc123def456"
			ghAuthClient.GetDeviceCodeAuthStatusStub = func(s string) (string, error) {
				return token, nil
			}
			res, err := appsClient.GetGithubAuthStatus(ctx, &pb.GetGithubAuthStatusRequest{DeviceCode: "somedevicecode"})
			Expect(err).NotTo(HaveOccurred())

			verified, err := auth.NewJwtClient(secretKey).VerifyJWT(res.AccessToken)
			Expect(err).NotTo(HaveOccurred())
			Expect(verified.ProviderToken).To(Equal(token))
		})

		It("returns an error other than ErrAuthPending", func() {
			someErr := errors.New("some other err")
			ghAuthClient.GetDeviceCodeAuthStatusStub = func(s string) (string, error) {
				return "", someErr
			}
			res, err := appsClient.GetGithubAuthStatus(ctx, &pb.GetGithubAuthStatusRequest{DeviceCode: "somedevicecode"})
			Expect(err).To(HaveOccurred())
			Expect(res).To(BeNil())

			st, ok := status.FromError(err)
			Expect(ok).To(BeTrue(), "could not get status from err")
			Expect(st.Message()).To(ContainSubstring(someErr.Error()))
		})
	})

	Describe("ParseRepoURL", func() {
		type expected struct {
			provider pb.GitProvider
			owner    string
			name     string
		}
		DescribeTable("parses a repo url", func(uri string, e expected) {
			res, err := appsClient.ParseRepoURL(context.Background(), &pb.ParseRepoURLRequest{
				Url: uri,
			})
			Expect(err).NotTo(HaveOccurred())
			Expect(res.Provider).To(Equal(e.provider))
			Expect(res.Owner).To(Equal(e.owner))
			Expect(res.Name).To(Equal(e.name))
		},
			Entry("github+ssh", "git@github.com:some-org/my-repo.git", expected{
				provider: pb.GitProvider_GitHub,
				owner:    "some-org",
				name:     "my-repo",
			}),
			Entry("gitlab+ssh", "git@gitlab.com:other-org/cool-repo.git", expected{
				provider: pb.GitProvider_GitLab,
				owner:    "other-org",
				name:     "cool-repo",
			}),
		)

		It("returns an error on an invalid URL", func() {
			_, err := appsClient.ParseRepoURL(context.Background(), &pb.ParseRepoURLRequest{
				Url: "not-a  -valid-url",
			})
			Expect(err).To(HaveOccurred(), "should have gotten an invalid arg error")

			s, ok := status.FromError(err)
			Expect(ok).To(BeTrue(), "could not get status from error")
			Expect(s.Code()).To(Equal(codes.InvalidArgument))
		})
	})

	Describe("GetGitlabAuthURL", func() {
		It("returns the gitlab url", func() {
			urlString := "http://gitlab.com/oauth/authorize"
			authURL, err := url.Parse(urlString)
			Expect(err).NotTo(HaveOccurred())

			glAuthClient.AuthURLReturns(*authURL, nil)

			res, err := appsClient.GetGitlabAuthURL(context.Background(), &pb.GetGitlabAuthURLRequest{
				RedirectUri: "http://example.com/oauth/fake",
			})
			Expect(err).NotTo(HaveOccurred())

			u, err := url.Parse(res.Url)
			Expect(err).NotTo(HaveOccurred())
			Expect(u.String()).To(Equal(urlString))
		})
	})

	Describe("AuthorizeGitlab", func() {
		It("exchanges a token", func() {
			token := "some-token"
			glAuthClient.ExchangeCodeReturns(&authtypes.TokenResponseState{AccessToken: token}, nil)

			res, err := appsClient.AuthorizeGitlab(context.Background(), &pb.AuthorizeGitlabRequest{
				RedirectUri: "http://example.com/oauth/callback",
				Code:        "some-challenge-code",
			})
			Expect(err).NotTo(HaveOccurred())

			claims, err := jwtClient.VerifyJWT(res.Token)
			Expect(err).NotTo(HaveOccurred())

			Expect(claims.ProviderToken).To(Equal(token))
		})

		It("returns an error if the exchange fails", func() {
			e := errors.New("some code exchange error")
			glAuthClient.ExchangeCodeReturns(nil, e)

			_, err := appsClient.AuthorizeGitlab(context.Background(), &pb.AuthorizeGitlabRequest{
				RedirectUri: "http://example.com/oauth/callback",
				Code:        "some-challenge-code",
			})
			status, ok := status.FromError(err)
			Expect(ok).To(BeTrue(), "could not get status from error response")
			Expect(status.Code()).To(Equal(codes.Unknown))
			Expect(err.Error()).To(ContainSubstring(e.Error()))
		})
	})

	DescribeTable("ValidateProviderToken", func(provider pb.GitProvider, ctx context.Context, errResponse error, expectedCode codes.Code) {
		glAuthClient.ValidateTokenReturns(errResponse)
		ghAuthClient.ValidateTokenReturns(errResponse)

		res, err := appsClient.ValidateProviderToken(ctx, &pb.ValidateProviderTokenRequest{
			Provider: provider,
		})

		if errResponse != nil {
			Expect(err).To(HaveOccurred())
			s, ok := status.FromError(err)
			Expect(ok).To(BeTrue(), "could not get status from error")
			Expect(s.Code()).To(Equal(expectedCode))
			return
		}

		Expect(err).NotTo(HaveOccurred())
		Expect(res.Valid).To(BeTrue())
	},
		Entry("bad gitlab token", pb.GitProvider_GitLab, contextWithAuth(context.Background()), errors.New("this token is bad"), codes.InvalidArgument),
		Entry("good gitlab token", pb.GitProvider_GitLab, contextWithAuth(context.Background()), nil, codes.OK),
		Entry("bad github token", pb.GitProvider_GitHub, contextWithAuth(context.Background()), errors.New("this token is bad"), codes.InvalidArgument),
		Entry("good github token", pb.GitProvider_GitHub, contextWithAuth(context.Background()), nil, codes.OK),
		Entry("no gitops jwt", pb.GitProvider_GitHub, context.Background(), errors.New("unauth error"), codes.Unauthenticated),
	)

	Describe("middleware", func() {
		Describe("logging", func() {
			var (
				sink      *fakelogr.LogSink
				mux       *runtime.ServeMux
				ts        *httptest.Server
				jwtClient auth.JWTClient
			)

			BeforeEach(func() {
				rand.Seed(time.Now().UnixNano())
				secretKey := rand.String(20)
				jwtClient = auth.NewJwtClient(secretKey)
			})

			JustBeforeEach(func() {
				var log logr.Logger

				log, sink = testutils.MakeFakeLogr()

				scheme, err := kube.CreateScheme()
				Expect(err).To(BeNil())

				k8s := fake.NewClientBuilder().WithScheme(scheme).Build()

				cfg := server.ApplicationsConfig{
					Logger:    log,
					JwtClient: jwtClient,
				}

				fakeClientGetter := kubefakes.NewFakeClientGetter(k8s)
				appsSrv := server.NewApplicationsServer(&cfg, server.WithClientGetter(fakeClientGetter))
				mux = runtime.NewServeMux(middleware.WithGrpcErrorLogging(log))
				httpHandler := middleware.WithLogging(log, mux)
				err = pb.RegisterGitAuthHandlerServer(context.Background(), mux, appsSrv)
				Expect(err).NotTo(HaveOccurred())

				ts = httptest.NewServer(httpHandler)
			})

			AfterEach(func() {
				ts.Close()
			})

			It("logs invalid requests", func() {
				// Test a 404 here
				path := "/foo"
				url := ts.URL + path

				res, err := http.Get(url)
				Expect(err).NotTo(HaveOccurred())
				Expect(res.StatusCode).To(Equal(http.StatusNotFound))

				Expect(sink.InfoCallCount()).To(BeNumerically(">", 0))
				vals := sink.WithValuesArgsForCall(0)

				expectedStatus := strconv.Itoa(res.StatusCode)

				list := formatLogVals(vals)
				Expect(list).To(ConsistOf("uri", path, "status", expectedStatus))
			})

			It("logs server errors", func() {
				err := pb.RegisterGitAuthHandlerServer(context.Background(), mux, pb.UnimplementedGitAuthServer{})
				Expect(err).NotTo(HaveOccurred())

				path := "/v1/gitauth/parse_repo_url"
				url := ts.URL + path

				res, err := http.Get(url)
				// err is still nil even if we get a 5XX.
				Expect(err).NotTo(HaveOccurred())
				Expect(res.StatusCode).To(Equal(http.StatusNotImplemented))

				Expect(sink.ErrorCallCount()).To(BeNumerically(">", 0))
				vals := sink.WithValuesArgsForCall(0)
				list := formatLogVals(vals)

				expectedStatus := strconv.Itoa(res.StatusCode)
				Expect(list).To(ConsistOf("uri", path, "status", expectedStatus))

				err, msg, _ := sink.ErrorArgsForCall(0)
				// This is the meat of this test case.
				// Check that the same error passed by kubeClient is logged.
				Expect(msg).To(Equal(middleware.ServerErrorText))
				Expect(err.Error()).To(ContainSubstring("ParseRepoURL not implemented"))
			})

			It("logs ok requests", func() {
				// A valid URL for our server
				path := "/v1/gitauth/parse_repo_url?url=https://github.com/user/repo.git"
				url := ts.URL + path

				res, err := http.Get(url)
				Expect(err).NotTo(HaveOccurred())
				Expect(res.StatusCode).To(Equal(http.StatusOK))

				Expect(sink.InfoCallCount()).To(BeNumerically(">", 0))
				_, msg, _ := sink.InfoArgsForCall(0)
				Expect(msg).To(ContainSubstring(middleware.RequestOkText))

				vals := sink.WithValuesArgsForCall(0)
				list := formatLogVals(vals)

				expectedStatus := strconv.Itoa(res.StatusCode)
				Expect(list).To(ConsistOf("uri", path, "status", expectedStatus))
			})

			When("when genertaing a JWT token fails", func() {
				BeforeEach(func() {
					fakeJWTToken := &authfakes.FakeJWTClient{}
					fakeJWTToken.GenerateJWTStub = func(duration time.Duration, name gitproviders.GitProviderName, s22 string) (string, error) {
						return "", fmt.Errorf("some error")
					}

					jwtClient = fakeJWTToken
				})

				It("cannot authorize", func() {
					// A valid URL for our server
					path := "/v1/authenticate/github"
					url := ts.URL + path

					res, err := http.Post(url, "application/json", strings.NewReader(`{"accessToken":"sometoken"}`))
					Expect(err).NotTo(HaveOccurred())
					Expect(res.StatusCode).To(Equal(http.StatusInternalServerError))

					bts, err := io.ReadAll(res.Body)
					Expect(err).NotTo(HaveOccurred())

					Expect(bts).To(MatchJSON(`{"code": 13,"message": "error generating jwt token. some error","details": []}`))

					Expect(sink.InfoCallCount()).To(BeNumerically(">", 0))
					_, msg, _ := sink.InfoArgsForCall(0)
					Expect(msg).To(ContainSubstring(middleware.ServerErrorText))

					vals := sink.WithValuesArgsForCall(0)
					list := formatLogVals(vals)

					expectedStatus := strconv.Itoa(res.StatusCode)
					Expect(list).To(ConsistOf("uri", path, "status", expectedStatus))
				})
			})
		})
	})
})

func formatLogVals(vals []interface{}) []string {
	list := []string{}

	for _, v := range vals {
		// vals is a slice of empty interfaces. convert them.
		s, ok := v.(string)
		if !ok {
			// Last value is a status code represented as an int
			n := v.(int)
			s = strconv.Itoa(n)
		}

		list = append(list, s)
	}

	return list
}

func contextWithAuth(ctx context.Context) context.Context {
	md := metadata.New(map[string]string{middleware.GRPCAuthMetadataKey: "mytoken"})
	ctx = metadata.NewOutgoingContext(ctx, md)

	return ctx
}

func TestGetBitbucketServerAuthURL(t *testing.T) {
	lis = bufconn.Listen(bufSize)
	s = grpc.NewServer()

	rand.Seed(time.Now().UnixNano())
	secretKey = rand.String(20)
	jwtClient = auth.NewJwtClient(secretKey)

	cfg := server.ApplicationsConfig{
		JwtClient:             jwtClient,
		BitBucketServerClient: bitbucket.NewAuthClient(http.DefaultClient),
		RandomTokenGenerator:  func() string { return "abc" },
	}
	apps = server.NewApplicationsServer(&cfg)
	pb.RegisterGitAuthServer(s, apps)

	go func() {
		if err := s.Serve(lis); err != nil {
			log.Fatalf(err.Error())
		}
	}()

	ctx := context.Background()
	conn, err := grpc.DialContext(ctx, "bufnet", grpc.WithContextDialer(bufDialer), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fail()
	}
	appsClient = pb.NewGitAuthClient(conn)

	t.Run("missing hostname env var", func(t *testing.T) {
		res, err := appsClient.GetBitbucketServerAuthURL(ctx, &pb.GetBitbucketServerAuthURLRequest{
			RedirectUri: "http://localhost/oauth/bitbucket",
		})

		if err == nil {
			t.Error("expected non-nil error")
		}
		if !strings.Contains(err.Error(), "environment variable BITBUCKET_SERVER_HOSTNAME is not set") {
			t.Errorf("expected error for hostname env var but got instead: %v", err)
		}
		if res != nil {
			t.Errorf("expected a nil response but got a non-nil response instead: %v", res)
		}
	})

	t.Run("missing client id env var", func(t *testing.T) {
		t.Setenv("BITBUCKET_SERVER_HOSTNAME", "stash.stashtestserver.link:7990")

		res, err := appsClient.GetBitbucketServerAuthURL(ctx, &pb.GetBitbucketServerAuthURLRequest{
			RedirectUri: "http://localhost/oauth/bitbucket",
		})

		if err == nil {
			t.Error("expected non-nil error")
		}
		if !strings.Contains(err.Error(), "environment variable BITBUCKET_SERVER_CLIENT_ID is not set") {
			t.Errorf("expected error for client id env var but got instead: %v", err)
		}
		if res != nil {
			t.Errorf("expected a nil response but got a non-nil response instead: %v", res)
		}

	})

	t.Run("success", func(t *testing.T) {
		t.Setenv("BITBUCKET_SERVER_HOSTNAME", "stash.stashtestserver.link:7990")
		t.Setenv("BITBUCKET_SERVER_CLIENT_ID", "74c9e0fb-b1d2-45c9-b5b8-624f3d96025c")

		redirectURI := "http://localhost/oauth/bitbucket"
		res, err := appsClient.GetBitbucketServerAuthURL(ctx, &pb.GetBitbucketServerAuthURLRequest{
			RedirectUri: redirectURI,
		})

		if err != nil {
			t.Errorf("expected no error but got an error instead: %v", err)
		}
		if res == nil {
			t.Errorf("expected a non-nil response but got a nil response instead")
		}
		expected := fmt.Sprintf("https://%s/rest/oauth2/latest/authorize?client_id=%s&redirect_uri=%s&response_type=code&scope=%s&state=%s",
			os.Getenv("BITBUCKET_SERVER_HOSTNAME"), os.Getenv("BITBUCKET_SERVER_CLIENT_ID"), url.QueryEscape(redirectURI), "REPO_WRITE+REPO_READ+PUBLIC_REPOS", "abc")
		if res != nil && res.Url != expected {
			t.Errorf("expected %q to be equal to %q", res.Url, expected)
		}
	})
}

func TestGetAzureDevopsAuthURL(t *testing.T) {
	lis = bufconn.Listen(bufSize)
	s = grpc.NewServer()

	rand.Seed(time.Now().UnixNano())
	secretKey = rand.String(20)
	jwtClient = auth.NewJwtClient(secretKey)

	cfg := server.ApplicationsConfig{
		JwtClient:            jwtClient,
		AzureDevOpsClient:    azure.NewAuthClient(http.DefaultClient),
		RandomTokenGenerator: func() string { return "abc" },
	}
	apps = server.NewApplicationsServer(&cfg)
	pb.RegisterGitAuthServer(s, apps)

	go func() {
		if err := s.Serve(lis); err != nil {
			log.Fatalf(err.Error())
		}
	}()

	ctx := context.Background()
	conn, err := grpc.DialContext(ctx, "bufnet", grpc.WithContextDialer(bufDialer), grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		t.Fail()
	}
	appsClient = pb.NewGitAuthClient(conn)

	t.Run("missing client id env var", func(t *testing.T) {

		res, err := appsClient.GetAzureDevOpsAuthURL(ctx, &pb.GetAzureDevOpsAuthURLRequest{
			RedirectUri: "http://localhost/oauth/azure",
		})

		if err == nil {
			t.Error("expected non-nil error")
		}
		if !strings.Contains(err.Error(), "environment variable AZURE_DEVOPS_CLIENT_ID is not set") {
			t.Errorf("expected error for client id env var but got instead: %v", err)
		}
		if res != nil {
			t.Errorf("expected a nil response but got a non-nil response instead: %v", res)
		}

	})

	t.Setenv("AZURE_DEVOPS_CLIENT_ID", "74c9e0fb-b1d2-45c9-b5b8-624f3d96025c")
	t.Run("success", func(t *testing.T) {
		redirectURI := "http://localhost/oauth/azure"
		res, err := appsClient.GetAzureDevOpsAuthURL(ctx, &pb.GetAzureDevOpsAuthURLRequest{
			RedirectUri: redirectURI,
		})

		if err != nil {
			t.Errorf("expected no error but got an error instead: %v", err)
		}
		if res == nil {
			t.Errorf("expected a non-nil response but got a nil response instead")
		}
		expected := fmt.Sprintf("https://app.vssps.visualstudio.com/oauth2/authorize?client_id=%s&redirect_uri=%s&response_type=Assertion&scope=%s&state=%s",
			os.Getenv("AZURE_DEVOPS_CLIENT_ID"), url.QueryEscape(redirectURI), "vso.code_write", "abc")
		if res != nil && res.Url != expected {
			t.Errorf("expected %q to be equal to %q", res.Url, expected)
		}
	})
}
