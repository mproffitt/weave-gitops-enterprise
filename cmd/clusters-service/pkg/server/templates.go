package server

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"

	sourcev1 "github.com/fluxcd/source-controller/api/v1beta2"
	"github.com/go-logr/logr"
	"github.com/spf13/viper"
	capiv1 "github.com/weaveworks/templates-controller/apis/capi/v1alpha2"
	templatesv1 "github.com/weaveworks/templates-controller/apis/core"
	gapiv1 "github.com/weaveworks/templates-controller/apis/gitops/v1alpha2"
	"github.com/weaveworks/weave-gitops-enterprise/cmd/clusters-service/pkg/credentials"
	capiv1_proto "github.com/weaveworks/weave-gitops-enterprise/cmd/clusters-service/pkg/protos"
	"github.com/weaveworks/weave-gitops-enterprise/cmd/clusters-service/pkg/templates"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/estimation"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/git"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/helm"
	"k8s.io/apimachinery/pkg/api/meta"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/apis/meta/v1/unstructured"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type GetFilesRequest struct {
	ClusterNamespace string
	TemplateName     string
	ParameterValues  map[string]string
	Credentials      *capiv1_proto.Credential
	Profiles         []*capiv1_proto.ProfileValues
	Kustomizations   []*capiv1_proto.Kustomization
	ExternalSecrets  []*capiv1_proto.ExternalSecret
	HelmRepository   *sourcev1.HelmRepository
}

type GetFilesReturn struct {
	RenderedTemplate     []git.CommitFile
	ProfileFiles         []git.CommitFile
	KustomizationFiles   []git.CommitFile
	CostEstimate         *capiv1_proto.CostEstimate
	ExternalSecretsFiles []git.CommitFile
}

func (s *server) getTemplate(ctx context.Context, name, namespace, templateKind string) (templatesv1.Template, error) {
	if namespace == "" {
		return nil, errors.New("need to specify template namespace")
	}
	cl, err := s.clientGetter.Client(ctx)
	if err != nil {
		return nil, err
	}
	switch templateKind {
	case capiv1.Kind:
		var t capiv1.CAPITemplate
		err = cl.Get(ctx, client.ObjectKey{
			Namespace: namespace,
			Name:      name,
		}, &t)
		if err != nil {
			return nil, fmt.Errorf("error getting capitemplate %s/%s: %w", namespace, name, err)
		}
		// https://github.com/kubernetes-sigs/controller-runtime/issues/1517#issuecomment-844703142
		t.SetGroupVersionKind(capiv1.GroupVersion.WithKind(capiv1.Kind))
		return &t, nil

	case gapiv1.Kind:
		var t gapiv1.GitOpsTemplate
		err = cl.Get(ctx, client.ObjectKey{
			Namespace: namespace,
			Name:      name,
		}, &t)
		if err != nil {
			return nil, fmt.Errorf("error getting gitops template %s/%s: %w", namespace, name, err)
		}
		// https://github.com/kubernetes-sigs/controller-runtime/issues/1517#issuecomment-844703142
		t.SetGroupVersionKind(gapiv1.GroupVersion.WithKind(gapiv1.Kind))
		return &t, nil
	}

	return nil, nil
}

func (s *server) ListTemplates(ctx context.Context, msg *capiv1_proto.ListTemplatesRequest) (*capiv1_proto.ListTemplatesResponse, error) {
	templates := []*capiv1_proto.Template{}
	errors := []*capiv1_proto.ListError{}
	includeGitopsTemplates := msg.TemplateKind == "" || msg.TemplateKind == gapiv1.Kind
	includeCAPITemplates := msg.TemplateKind == "" || msg.TemplateKind == capiv1.Kind

	c, err := s.clientGetter.Client(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting client: %v", err)
	}

	if includeGitopsTemplates {
		namespacedLists, err := s.managementFetcher.Fetch(ctx, gapiv1.Kind, func() client.ObjectList {
			return &gapiv1.GitOpsTemplateList{}
		})
		if err != nil {
			return nil, fmt.Errorf("failed to query gitops templates: %w", err)
		}

		for _, namespacedList := range namespacedLists {
			if namespacedList.Error != nil {
				errors = append(errors, &capiv1_proto.ListError{
					Namespace: namespacedList.Namespace,
					Message:   namespacedList.Error.Error(),
				})
			}
			templatesList := namespacedList.List.(*gapiv1.GitOpsTemplateList)
			for _, t := range templatesList.Items {
				res := ToTemplateResponse(&t, c)
				templates = append(templates, res)
				if res.Error != "" {
					errors = append(errors, &capiv1_proto.ListError{
						Namespace: t.Namespace,
						Message:   res.Error,
					})
					s.log.Error(fmt.Errorf("error reading template %v, %v", t.Name, res.Error), "error reading template")
				}
			}
		}
	}

	if includeCAPITemplates {
		namespacedLists, err := s.managementFetcher.Fetch(ctx, capiv1.Kind, func() client.ObjectList {
			return &capiv1.CAPITemplateList{}
		})
		if err != nil {
			return nil, fmt.Errorf("failed to query capi templates: %w", err)
		}

		for _, namespacedList := range namespacedLists {
			if namespacedList.Error != nil {
				errors = append(errors, &capiv1_proto.ListError{
					Namespace: namespacedList.Namespace,
					Message:   namespacedList.Error.Error(),
				})
			}
			templatesList := namespacedList.List.(*capiv1.CAPITemplateList)
			for _, t := range templatesList.Items {
				res := ToTemplateResponse(&t, c)
				templates = append(templates, res)
				if res.Error != "" {
					errors = append(errors, &capiv1_proto.ListError{
						Namespace: t.Namespace,
						Message:   res.Error,
					})
					s.log.Error(fmt.Errorf("error reading template %v, %v", t.Name, res.Error), "error reading template")
				}
			}
		}
	}

	total := int32(len(templates))
	if msg.Provider != "" {
		if !isProviderRecognised(msg.Provider) {
			return nil, fmt.Errorf("provider %q is not recognised", msg.Provider)
		}

		templates = filterTemplatesByProvider(templates, msg.Provider)
	}

	sort.Slice(templates, func(i, j int) bool { return templates[i].Name < templates[j].Name })
	return &capiv1_proto.ListTemplatesResponse{
		Templates: templates,
		Total:     total,
		Errors:    errors,
	}, nil
}

func (s *server) GetTemplate(ctx context.Context, msg *capiv1_proto.GetTemplateRequest) (*capiv1_proto.GetTemplateResponse, error) {
	// Default to CAPI kind to ease transition
	if msg.TemplateKind == "" {
		msg.TemplateKind = capiv1.Kind
	}
	tm, err := s.getTemplate(ctx, msg.Name, msg.Namespace, msg.TemplateKind)
	if err != nil {
		return nil, fmt.Errorf("error looking up template %v: %v", msg.Name, err)
	}

	c, err := s.clientGetter.Client(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting client: %v", err)
	}

	t := ToTemplateResponse(tm, c)
	if t.Error != "" {
		return nil, fmt.Errorf("error reading template %v, %v", msg.Name, t.Error)
	}
	return &capiv1_proto.GetTemplateResponse{Template: t}, err
}

func (s *server) ListTemplateParams(ctx context.Context, msg *capiv1_proto.ListTemplateParamsRequest) (*capiv1_proto.ListTemplateParamsResponse, error) {
	// Default to CAPI kind to ease transition
	if msg.TemplateKind == "" {
		msg.TemplateKind = capiv1.Kind
	}
	tm, err := s.getTemplate(ctx, msg.Name, msg.Namespace, msg.TemplateKind)
	if err != nil {
		return nil, fmt.Errorf("error looking up template %v: %v", msg.Name, err)
	}

	c, err := s.clientGetter.Client(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting client: %v", err)
	}

	t := ToTemplateResponse(tm, c)
	if t.Error != "" {
		return nil, fmt.Errorf("error looking up template params for %v, %v", msg.Name, t.Error)
	}

	return &capiv1_proto.ListTemplateParamsResponse{Parameters: t.Parameters, Objects: t.Objects}, err
}

func (s *server) ListTemplateProfiles(ctx context.Context, msg *capiv1_proto.ListTemplateProfilesRequest) (*capiv1_proto.ListTemplateProfilesResponse, error) {
	// Default to CAPI kind to ease transition
	if msg.TemplateKind == "" {
		msg.TemplateKind = capiv1.Kind
	}
	tm, err := s.getTemplate(ctx, msg.Name, msg.Namespace, msg.TemplateKind)
	if err != nil {
		return nil, fmt.Errorf("error looking up template %v: %v", msg.Name, err)
	}

	c, err := s.clientGetter.Client(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting client: %v", err)
	}

	t := ToTemplateResponse(tm, c)
	if t.Error != "" {
		return nil, fmt.Errorf("error looking up template annotations for %v, %v", msg.Name, t.Error)
	}

	profiles, err := templates.GetProfilesFromTemplate(tm)
	if err != nil {
		return nil, fmt.Errorf("error getting profiles from template %v, %v", msg.Name, err)
	}

	return &capiv1_proto.ListTemplateProfilesResponse{Profiles: profiles, Objects: t.Objects}, err
}

func toCommitFileProtos(file []git.CommitFile) []*capiv1_proto.CommitFile {
	var files []*capiv1_proto.CommitFile
	for _, f := range file {
		files = append(files, &capiv1_proto.CommitFile{
			Path:    f.Path,
			Content: *f.Content,
		})
	}
	return files
}

// Similar the others list and get will right now only work with CAPI templates.
// tm, err := s.templatesLibrary.Get(ctx, msg.Name) -> this get is the key.
func (s *server) RenderTemplate(ctx context.Context, msg *capiv1_proto.RenderTemplateRequest) (*capiv1_proto.RenderTemplateResponse, error) {
	if msg.TemplateKind == "" {
		msg.TemplateKind = capiv1.Kind
	}

	s.log.WithValues("request_values", msg.Values, "request_credentials", msg.Credentials).Info("Received message")
	tm, err := s.getTemplate(ctx, msg.Name, msg.Namespace, msg.TemplateKind)
	if err != nil {
		return nil, fmt.Errorf("error looking up template %v: %v", msg.Name, err)
	}

	client, err := s.clientGetter.Client(ctx)
	if err != nil {
		return nil, fmt.Errorf("error getting client: %v", err)
	}

	files, err := GetFiles(
		ctx,
		client,
		client.RESTMapper(),
		s.log,
		s.estimator,
		s.chartsCache,
		types.NamespacedName{Name: s.cluster},
		s.profileHelmRepository,
		tm,
		GetFilesRequest{
			ClusterNamespace: msg.ClusterNamespace,
			TemplateName:     msg.Name,
			ParameterValues:  msg.Values,
			Credentials:      msg.Credentials,
			Profiles:         msg.Profiles,
			Kustomizations:   msg.Kustomizations,
			ExternalSecrets:  msg.ExternalSecrets,
		},
		nil,
	)
	if err != nil {
		return nil, err
	}

	profileFiles := toCommitFileProtos(files.ProfileFiles)
	kustomizationFiles := toCommitFileProtos(files.KustomizationFiles)
	renderedTemplateFiles := toCommitFileProtos(files.RenderedTemplate)
	externalSecretFiles := toCommitFileProtos(files.ExternalSecretsFiles)
	return &capiv1_proto.RenderTemplateResponse{RenderedTemplates: renderedTemplateFiles, ProfileFiles: profileFiles, KustomizationFiles: kustomizationFiles, CostEstimate: files.CostEstimate, ExternalSecretsFiles: externalSecretFiles}, err
}

// GetExtraFields is a helper function to get expand on the available parameter
// fields for use in templates.
//
// By default, it will include the following fields:
//
// - MANAGEMENT_CLUSTER
// - REPOSITORY_PATH
// - REPOSITORY_CLUSTERS_PATH
// - BASE_BRANCH
//
// It will also include any extra fields defined in the `capi-extra-replacement-fields`
// configuration option.
//
// The extra fields are expected to be in the format:
//
// - type:name[:field[:label-or-annotation]]
//
// In this format, type is expected to be a valid Kubernetes resource type,
// such as `ConfigMap`, `Secret`, `Service`, etc. The name is the name of the
// resource, and the field is the field to extract from the resource.
//
// If type is not in the `v1` api group, then you must specify the full GVK
// such as `kind.group/version`.
//
// for example : `deployment.apps/v1:my-deployment:name`
//
// Only the following fields are supported:
//
// - name
// - namespace
// - label(s)
// - annotation(s)
//
// To target a specific namespace, prefix the name with the namespace, such as
// `namespace/name`.
func GetExtraFields(client client.Client, log logr.Logger, msg *GetFilesRequest) error {
	log.Info("checking for extra fields")
	(*msg).ParameterValues["MANAGEMENT_CLUSTER"] = viper.GetString("cluster-name")
	(*msg).ParameterValues["REPOSITORY_PATH"] = viper.GetString("capi-repository-path")
	(*msg).ParameterValues["REPOSITORY_CLUSTERS_PATH"] = viper.GetString("capi-repository-clusters-path")
	(*msg).ParameterValues["BASE_BRANCH"] = viper.GetString("capi-base-branch")

	fields := viper.GetStringMapString("capi-extra-replacement-fields")
	for k, v := range fields {
		var (
			err            error
			object         unstructured.Unstructured
			namespacedName types.NamespacedName
		)

		v, err = renderTemplateStringWithValues(v, msg.ParameterValues)
		if err != nil {
			log.Error(err, "failed to render extra field", "field", k, "value", v)
			continue
		}

		values := strings.Split(v, ":")

		switch len(values) {
		case 1:
			(*msg).ParameterValues[k] = v
		// type:name
		// type:name:field[:label-or-annotation]
		// type:namespace/name:field[:label-or-annotation]
		default:
			gvk, err := parseGvk(values[0])
			if err != nil {
				return fmt.Errorf("failed to parse gvk: %w", err)
			}

			object.SetGroupVersionKind(*gvk)
			apiVersion := gvk.GroupVersion().String()
			object.SetAPIVersion(apiVersion)

			nsn := strings.Split(values[1], "/")
			if len(nsn) == 1 {
				namespacedName = types.NamespacedName{
					Namespace: msg.ClusterNamespace,
					Name:      nsn[0],
				}
			} else {
				namespacedName = types.NamespacedName{
					Namespace: nsn[0],
					Name:      nsn[1],
				}
			}
		}

		err = client.Get(context.Background(), namespacedName, &object)
		if err != nil {
			(*msg).ParameterValues[k] = ""
			// resource doesn't exist - continue
			continue
		}

		var ok bool
		switch values[2] {
		case "label", "labels":
			var label string
			if label, ok = object.GetLabels()[values[3]]; ok {
				(*msg).ParameterValues[k] = label
			}
		case "annotation", "annotations":
			var annotation string
			if annotation, ok = object.GetAnnotations()[values[3]]; ok {
				(*msg).ParameterValues[k] = annotation
			}
		default:
			if object.Object[values[2]] == "name" {
				(*msg).ParameterValues[k] = object.GetName()
			} else if object.Object[values[2]] == "namespace" {
				(*msg).ParameterValues[k] = object.GetNamespace()
			}
		}
	}
	return nil
}

func GetFiles(
	ctx context.Context,
	client client.Client,
	mapper meta.RESTMapper,
	log logr.Logger,
	estimator estimation.Estimator,
	chartsCache helm.ProfilesGeneratorCache,
	profileHelmRepositoryCluster types.NamespacedName,
	profileHelmRepository types.NamespacedName,
	tmpl templatesv1.Template,
	msg GetFilesRequest,
	createRequestMessage *capiv1_proto.CreatePullRequestRequest) (*GetFilesReturn, error) {

	resourcesNamespace := getClusterNamespace(msg.ParameterValues["NAMESPACE"])

	err := GetExtraFields(client, log, &msg)
	if err != nil {
		return nil, fmt.Errorf("failed to get extra fields: %w", err)
	}

	log.Info("rendering template", "template", msg.TemplateName, "values", msg.ParameterValues)
	renderedTemplates, err := renderTemplateWithValues(tmpl, msg.TemplateName, resourcesNamespace, msg.ParameterValues, mapper)
	if err != nil {
		return nil, fmt.Errorf("failed to render template with parameter values: %w", err)
	}

	var rendered []renderedItem
	for _, renderedTemplate := range renderedTemplates {
		tmplWithValues := renderedTemplate.Data
		if createRequestMessage != nil {
			tmplWithValues, err = templates.InjectJSONAnnotation(tmplWithValues, "templates.weave.works/create-request", createRequestMessage)
			if err != nil {
				return nil, fmt.Errorf("failed to annotate template with parameter values: %w", err)
			}
		}

		err = templates.ValidateRenderedTemplates(tmplWithValues)
		if err != nil {
			return nil, fmt.Errorf("validation error rendering template %v, %v", msg.TemplateName, err)
		}

		if client != nil {
			tmplWithValues, err = credentials.CheckAndInjectCredentials(log, client, tmplWithValues, msg.Credentials, msg.TemplateName)
			if err != nil {
				return nil, fmt.Errorf("failed to inject credentials: %w", err)
			}
		} else {
			log.Info("client is nil, skipping credentials injection")
		}

		path := renderedTemplate.Path
		if path == "" {
			path, err = getDefaultPath(resourcesNamespace, msg)
			if err != nil {
				return nil, fmt.Errorf("failed to get default path: %w", err)
			}

			path, err = renderTemplateStringWithValues(path, msg.ParameterValues)
			if err != nil {
				return nil, fmt.Errorf("failed to render default path: %w", err)
			}
		}

		rendered = append(rendered, renderedItem{filename: path, content: tmplWithValues})
	}

	filenames := func(f []renderedItem) []string {
		names := []string{}
		for _, v := range f {
			names = append(names, v.filename)
		}
		return names
	}(rendered)

	if len(rendered) > 0 {
		annotated, err := templates.InjectJSONAnnotation(rendered[0].content, "templates.weave.works/created-files", map[string]any{
			"files": filenames,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to annotate template with created files: %w", err)
		}

		rendered[0].content = annotated
	}

	var files []git.CommitFile
	for _, r := range rendered {
		content := string(bytes.Join(r.content, []byte("\n---\n")))
		files = append(files, git.CommitFile{
			Path:    r.filename,
			Content: &content,
		})
	}

	// if this feature is not enabled the Nil estimator will be invoked returning a nil estimate
	costEstimate := getCostEstimate(ctx, estimator, renderedTemplates)

	var profileFiles []git.CommitFile
	var kustomizationFiles []git.CommitFile
	var externalSecretFiles []git.CommitFile

	if shouldAddSopsKustomization(tmpl) {
		cluster, err := getCluster(resourcesNamespace, msg)
		if err != nil {
			return nil, fmt.Errorf("failed to get cluster for %s: %s", msg.ParameterValues, err)
		}
		sopsKustomization, err := getSopsKustomization(cluster, msg)
		if err != nil {
			return nil, fmt.Errorf("failed to get sops kustomization for %s: %s", msg.ParameterValues, err)
		}

		sopsKustomization.Path, err = renderTemplateStringWithValues(sopsKustomization.Path, msg.ParameterValues)
		if err != nil {
			return nil, fmt.Errorf("failed to render default path: %w", err)
		}

		kustomizationFiles = append(kustomizationFiles, *sopsKustomization)
	}

	if shouldAddCommonBases(tmpl) {
		cluster, err := getCluster(resourcesNamespace, msg)
		if err != nil {
			return nil, fmt.Errorf("failed to get cluster for %s: %s", msg.ParameterValues, err)
		}
		commonKustomization, err := getCommonKustomization(cluster)
		if err != nil {
			return nil, fmt.Errorf("failed to get common kustomization for %s: %s", msg.ParameterValues, err)
		}

		commonKustomization.Path, err = renderTemplateStringWithValues(commonKustomization.Path, msg.ParameterValues)
		if err != nil {
			return nil, fmt.Errorf("failed to render default path: %w", err)
		}

		kustomizationFiles = append(kustomizationFiles, *commonKustomization)
	}

	templateHasRequiredProfiles, err := templates.TemplateHasRequiredProfiles(tmpl)
	if err != nil {
		return nil, fmt.Errorf("failed to check if template has required profiles: %w", err)
	}

	if len(msg.Profiles) > 0 || templateHasRequiredProfiles {
		cluster, err := getCluster(resourcesNamespace, msg)
		if err != nil {
			return nil, fmt.Errorf("failed to get cluster for %s: %s", msg.ParameterValues, err)
		}

		helmRepo := msg.HelmRepository
		if helmRepo == nil {
			if client == nil {
				return nil, errors.New("client is nil, cannot get Helm repository")
			}
			helmRepo, err = copyHelmRepository(ctx, client, profileHelmRepository)
			if err != nil {
				return nil, fmt.Errorf("failed to copy Helm repository: %w", err)
			}
		}

		profilesFiles, err := generateProfileFiles(
			ctx,
			tmpl,
			cluster,
			helmRepo,
			generateProfileFilesParams{
				helmRepositoryCluster: profileHelmRepositoryCluster,
				helmRepository:        profileHelmRepository,
				chartsCache:           chartsCache,
				profileValues:         msg.Profiles,
				parameterValues:       msg.ParameterValues,
			},
		)
		if err != nil {
			return nil, err
		}
		for _, profile := range profilesFiles {
			profile.Path, err = renderTemplateStringWithValues(profile.Path, msg.ParameterValues)
			if err != nil {
				return nil, fmt.Errorf("failed to render default path: %w", err)
			}
			profileFiles = append(profileFiles, profile)
		}
	}

	if len(msg.Kustomizations) > 0 {
		cluster, err := getCluster(resourcesNamespace, msg)
		if err != nil {
			return nil, fmt.Errorf("failed to get cluster for %s: %s", msg.ParameterValues, err)
		}
		for _, k := range msg.Kustomizations {
			// FIXME: dedup this with the automations
			if k.Spec.CreateNamespace {
				namespace, err := generateNamespaceFile(ctx, false, cluster, k.Spec.TargetNamespace, "")
				if err != nil {
					return nil, err
				}

				path, err := renderTemplateStringWithValues(*namespace.Path, msg.ParameterValues)
				if err != nil {
					return nil, fmt.Errorf("failed to render default path: %w", err)
				}

				kustomizationFiles = append(kustomizationFiles, git.CommitFile{
					Path:    path,
					Content: namespace.Content,
				})
			}

			{
				var err error
				kustomization, err := generateKustomizationFile(ctx, false, cluster, k, "")
				if err != nil {
					return nil, err
				}

				kustomization.Path, err = renderTemplateStringWithValues(kustomization.Path, msg.ParameterValues)
				if err != nil {
					return nil, fmt.Errorf("failed to render default path: %w", err)
				}
				kustomizationFiles = append(kustomizationFiles, kustomization)
			}
		}
	}

	return &GetFilesReturn{RenderedTemplate: files, ProfileFiles: profileFiles, KustomizationFiles: kustomizationFiles, CostEstimate: costEstimate, ExternalSecretsFiles: externalSecretFiles}, err
}

// Make a copy of the Helm repository that we can save to git.
// Copy is just the name/namespace/spec.
// We don't need the status, annotations or labels etc.
func copyHelmRepository(ctx context.Context, client client.Client, profileHelmRepository types.NamespacedName) (*sourcev1.HelmRepository, error) {
	existingHelmRepo := &sourcev1.HelmRepository{}
	err := client.Get(ctx, profileHelmRepository, existingHelmRepo)
	if err != nil {
		return nil, fmt.Errorf("cannot find Helm repository %s/%s: %w", profileHelmRepository.Name, profileHelmRepository.Namespace, err)
	}
	return &sourcev1.HelmRepository{
		TypeMeta: metav1.TypeMeta{
			Kind:       sourcev1.HelmRepositoryKind,
			APIVersion: sourcev1.GroupVersion.Identifier(),
		},
		ObjectMeta: metav1.ObjectMeta{
			Name:      profileHelmRepository.Name,
			Namespace: profileHelmRepository.Namespace,
		},
		Spec: existingHelmRepo.Spec,
	}, nil
}

func getCluster(namespace string, msg GetFilesRequest) (types.NamespacedName, error) {
	clusterName := msg.ParameterValues["CLUSTER_NAME"]
	resourceName := msg.ParameterValues["RESOURCE_NAME"]
	if clusterName == "" && resourceName == "" {
		return types.NamespacedName{}, errors.New("unable to find 'CLUSTER_NAME' or 'RESOURCE_NAME' parameter in supplied values")
	}
	if resourceName == "" {
		resourceName = clusterName
	}
	return createNamespacedName(resourceName, namespace), nil
}

func getDefaultPath(namespace string, msg GetFilesRequest) (string, error) {
	cluster, err := getCluster(namespace, msg)
	if err != nil {
		return "", fmt.Errorf("failed to get cluster: %w", err)
	}
	defaultPath := getClusterManifestPath(cluster)
	return defaultPath, nil
}

func shouldAddCommonBases(t templatesv1.Template) bool {
	anno := t.GetAnnotations()[templates.AddCommonBasesAnnotation]
	if anno != "" {
		return anno == "true"
	}

	// FIXME: want to phase configuration option out. You can enable per template by adding the annotation
	return viper.GetString("add-bases-kustomization") != "disabled" && isCAPITemplate(t)
}

func shouldAddSopsKustomization(t templatesv1.Template) bool {
	anno := t.GetAnnotations()[templates.SopsKustomizationAnnotation]
	if anno != "" {
		return anno == "true"
	}
	return false
}

func getCostEstimate(ctx context.Context, estimator estimation.Estimator, renderedTemplates []templates.RenderedTemplate) *capiv1_proto.CostEstimate {
	var tmplWithValues [][]byte
	for _, tmpl := range renderedTemplates {
		tmplWithValues = append(tmplWithValues, tmpl.Data...)
	}

	unstructureds, err := templates.ConvertToUnstructured(tmplWithValues)
	if err != nil {
		return &capiv1_proto.CostEstimate{Message: fmt.Sprintf("failed to parse rendered templates: %s", err)}
	}

	estimate, err := estimator.Estimate(ctx, unstructureds)
	if err != nil {
		return &capiv1_proto.CostEstimate{Message: fmt.Sprintf("failed to calculate estimate for cluster costs: %s", err)}
	}
	if estimate == nil {
		return &capiv1_proto.CostEstimate{Message: "no estimate returned"}
	}

	return &capiv1_proto.CostEstimate{
		Currency: estimate.Currency,
		Range: &capiv1_proto.CostEstimate_Range{
			Low:  estimate.Low,
			High: estimate.High,
		},
	}
}

func isProviderRecognised(provider string) bool {
	for _, p := range providers {
		if strings.EqualFold(provider, p) {
			return true
		}
	}
	return false
}

func filterTemplatesByProvider(tl []*capiv1_proto.Template, provider string) []*capiv1_proto.Template {
	templates := []*capiv1_proto.Template{}

	for _, t := range tl {
		if strings.EqualFold(t.Provider, provider) {
			templates = append(templates, t)
		}
	}

	return templates
}

type renderedItem struct {
	filename string
	content  [][]byte
}
