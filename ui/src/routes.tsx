import {
  ImageAutomationRepoDetails,
  ImageAutomationUpdatesDetails,
  ImagePolicyDetails,
  V2Routes,
} from '@choclab/weave-gitops';
import qs from 'query-string';
import Lottie from 'react-lottie-player';
import { Redirect, Route, Switch } from 'react-router-dom';
import { GitProvider } from './api/gitauth/gitauth.pb';
import error404 from './assets/img/error404.json';
import WGApplicationsDashboard from './components/Applications';
import AddApplication from './components/Applications/Add';
import WGApplicationsBucket from './components/Applications/Bucket';
import WGApplicationsFluxRuntime from './components/Applications/FluxRuntime';
import WGApplicationsGitRepository from './components/Applications/GitRepository';
import WGApplicationsHelmChart from './components/Applications/HelmChart';
import WGApplicationsHelmRelease from './components/Applications/HelmRelease';
import WGApplicationsHelmRepository from './components/Applications/HelmRepository';
import WGApplicationsKustomization from './components/Applications/Kustomization';
import WGNotifications from './components/Applications/Notifications';
import WGNotificationsProvider from './components/Applications/NotificationsProvider';
import WGApplicationsOCIRepository from './components/Applications/OCIRepository';
import WGApplicationsRuntime from './components/Applications/Runtime';
import WGApplicationsSources from './components/Applications/Sources';
import ClusterDiscovery from './components/ClusterDiscovery';
import ClusterDiscoveryDetails from './components/ClusterDiscovery/ClusterDiscoveryDetails';
import MCCP from './components/Clusters';
import ClusterDetails from './components/Clusters/ClusterDetails';
import Explorer from './components/Explorer';
import ObjectViewerPage from './components/Explorer/ObjectViewerPage';
import OAuthCallback from './components/GitAuth/OAuthCallback';

import GitOpsSets from './components/GitOpsSets';
import GitOpsSetDetail from './components/GitOpsSets/GitOpsSetDetail';
import ImageAutomationPage from './components/ImageAutomation';
import { Page } from './components/Layout/App';
import { NotificationsWrapper } from './components/Layout/NotificationsWrapper';
import Pipelines from './components/Pipelines';
import PipelineDetails from './components/Pipelines/PipelineDetails';
import Policies from './components/Policies/PoliciesListPage';
import PolicyDetailsPage from './components/Policies/PolicyDetailsPage';
import PolicyViolationPage from './components/Policies/PolicyViolationPage';
import PolicyConfigsList from './components/PolicyConfigs';
import CreatePolicyConfig from './components/PolicyConfigs/create';
import PolicyConfigsDetails from './components/PolicyConfigs/PolicyConfigDetails';
import ProgressiveDelivery from './components/ProgressiveDelivery';
import CanaryDetails from './components/ProgressiveDelivery/CanaryDetails';
import SecretsList from './components/Secrets';
import CreateExternalSecret from './components/Secrets/ExternalSecrets';
import SecretDetails from './components/Secrets/SecretDetails';
import CreateSOPS from './components/Secrets/SOPS';
import TemplatesDashboard from './components/Templates';
import AddClusterWithCredentials from './components/Templates/Create';
import EditResourcePage from './components/Templates/Edit';
import TerraformObjectDetail from './components/Terraform/TerraformObjectDetail';
import TerraformObjectList from './components/Terraform/TerraformObjectList';
import WGUserInfo from './components/UserInfo';
import Workspaces from './components/Workspaces';
import WorkspaceDetails from './components/Workspaces/WorkspaceDetails';
import { Routes } from './utils/nav';

function withSearchParams(Cmp: React.FC<any>) {
  const ComponentWithParams = ({ location: { search }, ...rest }: any) => {
    const params = qs.parse(search);
    return <Cmp {...rest} {...params} />;
  };
  ComponentWithParams.displayName = Cmp.displayName + 'WithParams';
  return ComponentWithParams;
}

const Page404 = () => (
  <Page path={[{ label: 'Error' }]}>
    <NotificationsWrapper>
      <Lottie
        loop
        animationData={error404}
        play
        style={{ width: '100%', height: 650 }}
      />
    </NotificationsWrapper>
  </Page>
);

const AppRoutes = () => {
  return (
    <Switch>
      <Route exact path="/">
        <Redirect to={Routes.Clusters} />
      </Route>
      <Route component={MCCP} path={Routes.Clusters} />
      <Route component={MCCP} exact path={Routes.DeleteCluster} />
      <Route
        component={withSearchParams((props: any) => (
          <ClusterDetails {...props} />
        ))}
        path={Routes.ClusterDashboard}
      />
      <Route
        component={withSearchParams((props: any) => (
          <EditResourcePage {...props} />
        ))}
        path={Routes.EditResource}
      />
      <Route
        component={AddClusterWithCredentials}
        exact
        path={Routes.AddCluster}
      />
      <Route
        component={withSearchParams(PolicyViolationPage)}
        exact
        path={V2Routes.PolicyViolationDetails}
      />
      <Route
        component={(props: any) => <WGApplicationsDashboard {...props} />}
        exact
        path={V2Routes.Automations}
      />
      <Route
        component={withSearchParams(AddApplication)}
        exact
        path={Routes.AddApplication}
      />
      <Route
        component={(props: any) => <WGApplicationsSources {...props} />}
        exact
        path={V2Routes.Sources}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGApplicationsKustomization {...props} />
        ))}
        path={V2Routes.Kustomization}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGApplicationsGitRepository {...props} />
        ))}
        path={V2Routes.GitRepo}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGApplicationsHelmRepository {...props} />
        ))}
        path={V2Routes.HelmRepo}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGApplicationsBucket {...props} />
        ))}
        path={V2Routes.Bucket}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGApplicationsHelmRelease {...props} />
        ))}
        path={V2Routes.HelmRelease}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGApplicationsHelmChart {...props} />
        ))}
        path={V2Routes.HelmChart}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGApplicationsOCIRepository {...props} />
        ))}
        path={V2Routes.OCIRepository}
      />
      <Route
        component={() => <WGApplicationsFluxRuntime />}
        path={V2Routes.FluxRuntime}
      />
      <Route
        component={() => <WGApplicationsRuntime />}
        path={V2Routes.Runtime}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGNotifications {...props} />
        ))}
        path={V2Routes.Notifications}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGUserInfo {...props} />
        ))}
        path={V2Routes.UserInfo}
      />
      <Route
        component={withSearchParams(PolicyViolationPage)}
        exact
        path={V2Routes.PolicyViolationDetails}
      />
      <Route
        component={withSearchParams((props: any) => (
          <WGNotificationsProvider {...props} />
        ))}
        path={V2Routes.Provider}
      />
      <Route exact path={Routes.Canaries} component={ProgressiveDelivery} />
      <Route
        path={Routes.CanaryDetails}
        component={withSearchParams(CanaryDetails)}
      />
      <Route exact path={Routes.Pipelines} component={Pipelines} />
      <Route
        path={Routes.PipelineDetails}
        component={withSearchParams(PipelineDetails)}
      />
      <Route path={Routes.ImageAutomation} component={ImageAutomationPage} />
      <Route
        path={V2Routes.ImageAutomationUpdatesDetails}
        component={withSearchParams(ImageAutomationUpdatesDetails)}
      />
      <Route
        path={V2Routes.ImageAutomationRepositoryDetails}
        component={withSearchParams(ImageAutomationRepoDetails)}
      />
      <Route
        path={V2Routes.ImagePolicyDetails}
        component={withSearchParams(ImagePolicyDetails)}
      />
      <Route path={V2Routes.Policies} component={Policies} />
      <Route
        component={withSearchParams(PolicyDetailsPage)}
        path={V2Routes.PolicyDetailsPage}
      />
      <Route component={TemplatesDashboard} exact path={Routes.Templates} />
      <Route
        exact
        path={Routes.TerraformObjects}
        component={withSearchParams(TerraformObjectList)}
      />
      <Route exact path={Routes.Workspaces} component={Workspaces} />
      <Route
        path={Routes.WorkspaceDetails}
        component={withSearchParams(WorkspaceDetails)}
      />
      <Route exact path={Routes.Secrets} component={SecretsList} />
      <Route
        exact
        path={Routes.ClusterDiscovery}
        component={ClusterDiscovery}
      />
      <Route
        path={Routes.ClusterDiscoveryDetails}
        component={withSearchParams(ClusterDiscoveryDetails)}
      />
      <Route
        path={Routes.SecretDetails}
        component={withSearchParams(SecretDetails)}
      />
      <Route
        exact
        path={Routes.CreateSecret}
        component={CreateExternalSecret}
      />
      <Route exact path={Routes.CreateSopsSecret} component={CreateSOPS} />
      <Route exact path={Routes.PolicyConfigs} component={PolicyConfigsList} />
      <Route
        exact
        path={Routes.PolicyConfigsDetails}
        component={withSearchParams(PolicyConfigsDetails)}
      />
      <Route
        exact
        path={Routes.CreatePolicyConfig}
        component={CreatePolicyConfig}
      />

      <Route
        path={Routes.TerraformDetail}
        component={withSearchParams(TerraformObjectDetail)}
      />
      <Route
        path={Routes.ExplorerView}
        component={withSearchParams(ObjectViewerPage)}
      />
      <Route path={Routes.Explorer} component={withSearchParams(Explorer)} />

      <Route
        exact
        path={Routes.GitOpsSets}
        component={withSearchParams(GitOpsSets)}
      />
      <Route
        path={Routes.GitOpsSetDetail}
        component={withSearchParams(GitOpsSetDetail)}
      />
      <Route
        exact
        path={Routes.GitlabOauthCallback}
        component={({ location }: any) => {
          const params = qs.parse(location.search);
          return (
            <OAuthCallback
              provider={'GitLab' as GitProvider}
              code={params.code as string}
              state=""
            />
          );
        }}
      />
      <Route
        exact
        path={Routes.BitBucketOauthCallback}
        component={({ location }: any) => {
          const params = qs.parse(location.search);

          const error = Array.isArray(params?.error)
            ? params?.error.join(', ')
            : params?.error;

          const desc = Array.isArray(params.error_description)
            ? params.error_description?.join('\n')
            : params?.error_description;

          return (
            <OAuthCallback
              provider={GitProvider.BitBucketServer}
              code={params.code as string}
              state={params.state as string}
              error={error}
              errorDescription={desc}
            />
          );
        }}
      />
      <Route
        exact
        path={Routes.AzureDevOpsOauthCallback}
        component={({ location }: any) => {
          const params = qs.parse(location.search);

          const error = Array.isArray(params?.error)
            ? params?.error.join(', ')
            : params?.error;

          const desc = Array.isArray(params.error_description)
            ? params.error_description?.join('\n')
            : params?.error_description;

          return (
            <OAuthCallback
              provider={GitProvider.AzureDevOps}
              code={params.code as string}
              state={params.state as string}
              error={error}
              errorDescription={desc}
            />
          );
        }}
      />
      <Route exact render={Page404} />
    </Switch>
  );
};

export default AppRoutes;
