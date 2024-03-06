import qs from 'query-string';
import React from 'react';
import Lottie from 'react-lottie-player';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ReactTestRenderer } from 'react-test-renderer';
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
/*import {
  ImageAutomationRepoDetails,
  ImageAutomationUpdatesDetails,
  ImagePolicyDetails,
  V2Routes,
} from './gitops.d';*/
import { Routes as WRoutes } from './utils/nav';
import ImagePolicyDetails from './weave/components/ImageAutomation/policies/ImagePolicyDetails';
import ImageAutomationRepoDetails from './weave/components/ImageAutomation/repositories/ImageAutomationRepoDetails';
import ImageAutomationUpdatesDetails from './weave/components/ImageAutomation/updates/ImageAutomationUpdatesDetails';
import { V2Routes } from './weave/lib/types';

const WithSearchParams = ({
  component: Component,
  ...props
}: {
  component: React.FunctionComponent<any>;
}) => {
  const location = useLocation();
  const params = qs.parse(location.search);

  return <Component {...props} {...params} />
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
  const location = useLocation();
  return (
    <Routes>
      {/*Redirect root to clusters page */}
      <Route path="/" element={<Navigate to={WRoutes.Clusters} replace />} />

      {/* USER INFO */}
      <Route element={(
        <WithSearchParams component={WGUserInfo} />
      )} path={V2Routes.UserInfo} />

      {/* CLUSTERS MANAGEMENT*/}
      <Route Component={MCCP as React.ComponentType<any>} path={WRoutes.Clusters + "/*"} />
      <Route Component={MCCP as React.ComponentType<any>} path={WRoutes.DeleteCluster + "/*"} />

      <Route element={(
        <WithSearchParams component={ClusterDetails} />
      )} path={WRoutes.ClusterDashboard + "/*"} />

      {/*TEMPLATES MANAGEMENT*/}
      <Route element={(
        <WithSearchParams component={TemplatesDashboard} />
      )} path={WRoutes.Templates} />

      <Route element={(
        <WithSearchParams component={AddClusterWithCredentials} />
      )} path={WRoutes.AddCluster + "/*"}
      />

      {/* GITOPS SETS MANAGEMENT*/}
      <Route Component={GitOpsSets} path={WRoutes.GitOpsSets + "/*"} />
      <Route element={(
        <WithSearchParams component={GitOpsSetDetail} />
       )} path={WRoutes.GitOpsSetDetail + "/*"} />

      {/* TERRAFORM MANAGEMENT*/}
      <Route Component={TerraformObjectList} path={WRoutes.TerraformObjects + "/*"} />
      <Route element={(
        <WithSearchParams component={TerraformObjectDetail} />
      )} path={WRoutes.TerraformDetail + "/*"} />

      {/* SECRETS MANAGEMENT*/}
      <Route Component={SecretsList} path={WRoutes.Secrets} />
      <Route element={(
        <WithSearchParams component={SecretDetails} />
      )} path={WRoutes.SecretDetails + "/*"} />

      <Route Component={CreateExternalSecret} path={WRoutes.CreateSecret + "/*"} />
      <Route Component={CreateSOPS} path={WRoutes.CreateSopsSecret} />

      {/* APPLICATIONS MANAGEMENT*/}
      <Route Component={WGApplicationsDashboard} path={V2Routes.Automations + "/*"} />
      <Route element={(
        <WithSearchParams component={AddApplication} />
      )} path={WRoutes.AddApplication + "/*"} />

      <Route element={(
        <WithSearchParams component={WGApplicationsKustomization} />
      )} path={V2Routes.Kustomization + "/*"} />

      <Route element={(
        <WithSearchParams component={WGApplicationsGitRepository} />
      )} path={V2Routes.GitRepo + "/*"} />

      <Route element={(
          <WithSearchParams component={WGApplicationsHelmRepository} />
      )} path={V2Routes.HelmRepo + "/*"} />

      <Route element={(
        <WithSearchParams component={WGApplicationsBucket} />
      )} path={V2Routes.Bucket + "/*"} />

      <Route element={(
        <WithSearchParams component={WGApplicationsHelmRelease} />
        )} path={V2Routes.HelmRelease + "/*"} />

      <Route element={(
        <WithSearchParams component={WGApplicationsHelmChart} />
      )} path={V2Routes.HelmChart + "/*"} />

      <Route element={(
        <WithSearchParams component={WGApplicationsOCIRepository} />
      )} path={V2Routes.OCIRepository + "/*"} />

      <Route Component={WGApplicationsFluxRuntime}
        path={V2Routes.FluxRuntime + "/*"}
      />

      {/* APPLICATION SOURCES */}
      <Route Component={WGApplicationsSources} path={V2Routes.Sources + "/*"} />

      {/* IMAGE AUTOMATION ROUTES */}
      <Route Component={ImageAutomationPage} path={WRoutes.ImageAutomation + "/*"} />

      <Route element={(
        <WithSearchParams component={ImageAutomationUpdatesDetails} />
      )} path={V2Routes.ImageAutomationUpdatesDetails + "/*"} />

      <Route element={(
        <WithSearchParams component={ImageAutomationRepoDetails} />
      )} path={V2Routes.ImageAutomationRepositoryDetails + "/*"} />

      <Route element={(
        <WithSearchParams component={ImagePolicyDetails} />
      )} path={V2Routes.ImagePolicyDetails + "/*"} />

      {/* PIPELINE ROUTES */}
      <Route Component={Pipelines} path={WRoutes.Pipelines} />

      <Route element={(
        <WithSearchParams component={PipelineDetails} />
      )} path={WRoutes.PipelineDetails + "/*"} />

      {/* PROGRESSIVE DELIVERY ROUTES*/}
      <Route  path={WRoutes.Canaries} Component={ProgressiveDelivery} />

      <Route element={(
        <WithSearchParams component={CanaryDetails} />
      )} path={WRoutes.CanaryDetails + "/*"} />

      {/* RUNTIME ROUTE */}
      <Route Component={WGApplicationsRuntime} path={V2Routes.Runtime + "/*"} />

      {/* EXPLORER ROUTES */}
      <Route Component={Explorer} path={WRoutes.Explorer + "/*"} />
      <Route Component={ObjectViewerPage} path={WRoutes.ExplorerView + "/*"}/>

      {/* CLUSTER DISCOVERY ROUTES */}
      <Route Component={ClusterDiscovery} path={WRoutes.ClusterDiscovery + "/*"} />
      <Route element={(
        <WithSearchParams component={ClusterDiscoveryDetails} />
      )} path={WRoutes.ClusterDiscoveryDetails + "/*"} />

      {/***********************************************************************
        * GUARDRAILS
        **********************************************************************/}

      {/* WORKSPACE ROUTES */}
      <Route Component={Workspaces} path={WRoutes.Workspaces} />
      <Route element={(
        <WithSearchParams component={WorkspaceDetails} />
      )} path={WRoutes.WorkspaceDetails + "/*"} />

      {/* POLICY ROUTES */}
      <Route element={(
        <WithSearchParams component={PolicyViolationPage} />
        )} path={V2Routes.PolicyViolationDetails + "/*"} />

      <Route Component={Policies} path={V2Routes.Policies + "/*"} />

      <Route element={(
        <WithSearchParams component={PolicyDetailsPage} />
      )} path={V2Routes.PolicyDetailsPage + "/*"} />

      {/* POLICY CONFIGS ROUTES */}
      <Route Component={PolicyConfigsList} path={WRoutes.PolicyConfigs} />

      <Route element={(
        <WithSearchParams component={PolicyConfigsDetails} />
      )} path={WRoutes.PolicyConfigsDetails + "/*"} />

      <Route Component={CreatePolicyConfig}
        path={WRoutes.CreatePolicyConfig + "/*"}
      />

      {/***********************************************************************
        * DEVELOPER EXPERIENCE
        **********************************************************************/}

      {/* NOTIFICATION ROUTES */}
      <Route Component={WGNotifications as React.FunctionComponent<{}>} path={V2Routes.Notifications + "/*"} />
      <Route element={(
        <WithSearchParams component={WGNotificationsProvider} />
      )} path={V2Routes.Provider + "/*"} />

      {/***********************************************************************
        * CALLBACKS
        **********************************************************************/}

      {/* OAUTH CALLBACKS */}
      <Route Component={({ location }: any) => {
        const params = qs.parse(location.search);
        return (
          <OAuthCallback
            provider={'GitLab' as GitProvider}
            code={params.code as string}
            state=""
          />
        );
      }} path={WRoutes.GitlabOauthCallback + "/*"} />

      <Route Component={({ location }: any) => {
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
      }} path={WRoutes.BitBucketOauthCallback + "/*"} />

      <Route Component={({ location }: any) => {
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
      }} path={WRoutes.AzureDevOpsOauthCallback + "/*"} />

      {/* 404 */}
      <Route Component={Page404} path="*" />

      {/* EDIT RESOURCE */}
      <Route element={(
        <WithSearchParams component={EditResourcePage} />
      )} path={WRoutes.EditResource + "/*"} />
    </Routes>
  );
};

export default AppRoutes;
