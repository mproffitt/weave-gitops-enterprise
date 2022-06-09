load('ext://restart_process', 'docker_build_with_restart')

if not os.path.exists("./charts/mccp/charts"):
   # Download chart deps on first run. This command is slow, so you'd have to
   # re-run it yourself if you upgrade the chart
   local("helm dep update charts/mccp")

if not os.path.exists("../cluster-bootstrap-controller"):
   fail("You need to git clone https://github.com/weaveworks/cluster-bootstrap-controller to a directory next to this")

if not os.path.exists("../cluster-controller"):
   fail("You need to git clone https://github.com/weaveworks/cluster-controller to a directory next to this")


# This is needed for javascript access
if not os.getenv('GITHUB_TOKEN'):
   fail("You need to set GITHUB_TOKEN in your terminal before running this")

# Install resources I couldn't find elsewhere
k8s_yaml('tools/dev-resources.yaml')

k8s_yaml('test/utils/scripts/entitlement-secret.yaml')

helm_values = ['tools/dev-values.yaml']
if os.path.exists('tools/dev-values-local.yaml'):
   helm_values.append('tools/dev-values-local.yaml')

k8s_yaml(helm(
    "charts/mccp",
    namespace='flux-system',
    values=helm_values,
))

k8s_yaml(kustomize('../cluster-controller/config/crd'))
k8s_yaml(kustomize('../cluster-bootstrap-controller/config/crd'))

docker_build('weaveworks/cluster-controller', '../cluster-controller/')
docker_build('weaveworks/cluster-bootstrap-controller', '../cluster-bootstrap-controller/',
   build_args={'GITHUB_BUILD_USERNAME': 'wge-build-bot', 'GITHUB_BUILD_TOKEN': os.getenv('GITHUB_TOKEN')}
)

native_build = os.getenv('NATIVE_BUILD', False)

if native_build:
   local_resource(
      'clusters-service',
      'GOOS=linux GOARCH=amd64 make build',
      deps=[
         './cmd/clusters-service',
      ],
      ignore=[
         './cmd/clusters-service/bin'
      ],
      dir='cmd/clusters-service',
   )

   local_resource(
      'ui',
      'make build',
      deps=[
         './ui-cra/src',
      ],
      dir='ui-cra',
   )

   docker_build_with_restart(
      'weaveworks/weave-gitops-enterprise-clusters-service',
      '.',
      dockerfile="cmd/clusters-service/dev.dockerfile",
      entrypoint='/app/clusters-service',
      build_args={'GITHUB_BUILD_TOKEN': os.getenv('GITHUB_TOKEN'), 'image_tag': 'tilt'},
      live_update=[
         sync('cmd/clusters-service/bin', '/app'),
      ],
      ignore=[
         'cmd/clusters-service/clusters-service'
      ]
   )

   docker_build(
      'weaveworks/weave-gitops-enterprise-ui-server',
      'ui-cra',
      dockerfile="ui-cra/dev.dockerfile",
      build_args={'GITHUB_TOKEN': os.getenv('GITHUB_TOKEN')},
   )
else:
   docker_build(
      'weaveworks/weave-gitops-enterprise-clusters-service',
      '.',
      dockerfile='cmd/clusters-service/Dockerfile',
      build_args={'GITHUB_BUILD_TOKEN': os.getenv('GITHUB_TOKEN'), 'image_tag': 'tilt'}
   )
   docker_build(
      'weaveworks/weave-gitops-enterprise-ui-server',
      'ui-cra',
      build_args={'GITHUB_TOKEN': os.getenv('GITHUB_TOKEN')}
   )

k8s_resource('chart-mccp-cluster-service', port_forwards='8000')