package terraform_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/go-logr/logr"
	"github.com/stretchr/testify/assert"
	tfctrl "github.com/weaveworks/tf-controller/api/v1alpha1"
	"github.com/weaveworks/weave-gitops-enterprise/internal/grpctesting"
	pb "github.com/weaveworks/weave-gitops-enterprise/pkg/api/terraform"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/terraform"
	"github.com/weaveworks/weave-gitops-enterprise/pkg/terraform/internal/adapter"
	fc "github.com/weaveworks/weave-gitops-enterprise/pkg/terraform/internal/clustersmngrfakes"
	"github.com/weaveworks/weave-gitops/core/clustersmngr"
	"github.com/weaveworks/weave-gitops/core/clustersmngr/clustersmngrfakes"
	"google.golang.org/grpc"
	"k8s.io/apimachinery/pkg/types"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

func TestListTerraformObjects(t *testing.T) {
	ctx := context.Background()

	client, k8s, _, _ := setup(t)

	obj := &tfctrl.Terraform{}
	obj.Name = "my-obj"
	obj.Namespace = "default"

	assert.NoError(t, k8s.Create(context.Background(), obj))

	res, err := client.ListTerraformObjects(ctx, &pb.ListTerraformObjectsRequest{})
	assert.NoError(t, err)

	assert.Len(t, res.Objects, 1)

	o := res.Objects[0]

	assert.Equal(t, o.ClusterName, "Default")
	assert.Equal(t, o.Name, obj.Name)
	assert.Equal(t, o.Namespace, obj.Namespace)
}

func TestListTerraformObjects_NoTFCRD(t *testing.T) {
	ctx := context.Background()

	client, k8s, fc, crd := setup(t)

	crd.IsAvailableReturns = false

	fc.ClusteredListReturns(clustersmngr.ClusteredListError{Errors: []clustersmngr.ListError{{
		Cluster: "some-cluster",
		Err:     errors.New("some error"),
	}}})

	obj := &tfctrl.Terraform{}
	obj.Name = "my-obj"
	obj.Namespace = "default"

	assert.NoError(t, k8s.Create(context.Background(), obj))

	res, err := client.ListTerraformObjects(ctx, &pb.ListTerraformObjectsRequest{})
	assert.NoError(t, err)

	assert.Len(t, res.Errors, 0, "should not have had errors")
}

func TestGetTerraformObject(t *testing.T) {
	ctx := context.Background()
	client, k8s, _, _ := setup(t)

	obj := &tfctrl.Terraform{}
	obj.Name = "my-obj"
	obj.Namespace = "default"

	assert.NoError(t, k8s.Create(context.Background(), obj))

	res, err := client.GetTerraformObject(ctx, &pb.GetTerraformObjectRequest{
		ClusterName: "Default",
		Name:        obj.Name,
		Namespace:   obj.Namespace,
	})
	assert.NoError(t, err)

	expectedYaml :=
		`apiVersion: infra.contrib.fluxcd.io/v1alpha1
kind: Terraform
metadata:
  creationTimestamp: null
  name: my-obj
  namespace: default
  resourceVersion: "1"
spec:
  interval: 0s
  runnerPodTemplate:
    metadata: {}
    spec: {}
  sourceRef:
    kind: ""
    name: ""
status:
  lock: {}
  plan: {}
`

	assert.Equal(t, res.Object.ClusterName, "Default")
	assert.Equal(t, res.Yaml, expectedYaml)
}

func TestSyncTerraformObject(t *testing.T) {
	ctx := context.Background()
	client, k8s, _, _ := setup(t)

	obj := &tfctrl.Terraform{}
	obj.Name = "my-obj"
	obj.Namespace = "default"

	key := types.NamespacedName{Name: obj.Name, Namespace: obj.Namespace}

	assert.NoError(t, k8s.Create(context.Background(), obj))

	done := make(chan error)
	defer close(done)

	go func() {
		_, err := client.SyncTerraformObject(ctx, &pb.SyncTerraformObjectRequest{
			ClusterName: "Default",
			Name:        obj.Name,
			Namespace:   obj.Namespace,
		})
		done <- err
	}()

	ticker := time.NewTicker(500 * time.Millisecond)
	for {
		select {
		case <-ticker.C:

			r := adapter.TerraformObjectAdapter{Terraform: obj}

			if err := simulateReconcile(ctx, k8s, key, r.AsClientObject()); err != nil {
				t.Fatalf("simulating reconcile: %s", err.Error())
			}

		case err := <-done:
			if err != nil {
				t.Errorf(err.Error())
			}
			return
		}
	}
}

func TestSuspendTerraformObject(t *testing.T) {
	ctx := context.Background()
	client, k8s, _, _ := setup(t)

	obj := &tfctrl.Terraform{}
	obj.Name = "my-obj"
	obj.Namespace = "default"
	obj.Spec = tfctrl.TerraformSpec{
		Suspend: false,
	}

	assert.NoError(t, k8s.Create(ctx, obj))

	_, err := client.ToggleSuspendTerraformObject(ctx, &pb.ToggleSuspendTerraformObjectRequest{
		Name:        obj.Name,
		Namespace:   obj.Namespace,
		ClusterName: "Default",
		Suspend:     true,
	})
	assert.NoError(t, err)

	s := &tfctrl.Terraform{}
	key := types.NamespacedName{Name: obj.Name, Namespace: obj.Namespace}

	assert.NoError(t, k8s.Get(ctx, key, s))

	assert.True(t, s.Spec.Suspend, "expected Spec.Suspend to be true")

}

type fakeCRDFetcher struct {
	IsAvailableReturns           bool
	IsAvailableOnClustersReturns map[string]bool
}

func (f fakeCRDFetcher) IsAvailable(clusterName string, crdName string) bool {
	return f.IsAvailableReturns
}

func (f fakeCRDFetcher) IsAvailableOnClusters(crdName string) map[string]bool {
	if f.IsAvailableOnClustersReturns != nil {
		return f.IsAvailableOnClustersReturns
	}

	return map[string]bool{crdName: true}
}

func (f fakeCRDFetcher) UpdateCRDList() {

}

func setup(t *testing.T) (pb.TerraformClient, client.Client, *fc.FakeClient, *fakeCRDFetcher) {
	k8s, factory := grpctesting.MakeFactoryWithObjects()
	c := &fc.FakeClient{}

	pool := &clustersmngrfakes.FakeClientsPool{}
	pool.ClientsReturns(map[string]client.Client{"Default": k8s})
	c.ClientsPoolReturns(pool)

	factory.GetServerClientReturns(c, nil)

	cr := &fakeCRDFetcher{IsAvailableReturns: true}
	opts := terraform.ServerOpts{
		Logger:         logr.Discard(),
		ClientsFactory: factory,
		CRDFetcher:     cr,
	}
	srv := terraform.NewTerraformServer(opts)

	conn := grpctesting.Setup(t, func(s *grpc.Server) {
		pb.RegisterTerraformServer(s, srv)
	})

	return pb.NewTerraformClient(conn), k8s, c, cr
}

func simulateReconcile(ctx context.Context, k client.Client, name types.NamespacedName, o client.Object) error {
	switch obj := o.(type) {
	case *tfctrl.Terraform:
		if err := k.Get(ctx, name, obj); err != nil {
			return err
		}

		obj.Status.SetLastHandledReconcileRequest(time.Now().Format(time.RFC3339Nano))
		return k.Status().Update(ctx, obj)
	}

	return errors.New("simulating reconcile: unsupported type")
}
