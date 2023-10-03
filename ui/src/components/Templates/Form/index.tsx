import { Divider, useMediaQuery } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import {
  Button,
  Flex,
  GitRepository,
  Link,
  useFeatureFlags,
  useListSources,
} from '@weaveworks/weave-gitops';
import { Automation, Source } from '@weaveworks/weave-gitops/ui/lib/objects';
import { PageRoute } from '@weaveworks/weave-gitops/ui/lib/types';
import _ from 'lodash';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { Redirect, useHistory } from 'react-router-dom';
import remarkGfm from 'remark-gfm';
import styled from 'styled-components';
import { Pipeline } from '../../../api/pipelines/types.pb';
import { GetTerraformObjectResponse } from '../../../api/terraform/terraform.pb';
import {
  CreatePullRequestRequest,
  Kustomization,
  ProfileValues,
  RenderTemplateResponse,
} from '../../../cluster-services/cluster_services.pb';
import CallbackStateContextProvider from '../../../contexts/GitAuth/CallbackStateContext';
import {
  expiredTokenNotification,
  useIsAuthenticated,
} from '../../../hooks/gitprovider';
import useProfiles from '../../../hooks/profiles';
import useTemplates from '../../../hooks/templates';
import {
  Credential,
  GitopsClusterEnriched,
  ProfilesIndex,
  TemplateEnriched,
} from '../../../types/custom';
import { utf8_to_b64 } from '../../../utils/base64';
import { useCallbackState } from '../../../utils/callback-state';
import {
  DEFAULT_PROFILE_REPO,
  FLUX_BOOSTRAP_KUSTOMIZATION_NAME,
  FLUX_BOOSTRAP_KUSTOMIZATION_NAMESPACE,
} from '../../../utils/config';
import { validateFormData } from '../../../utils/form';
import { getFormattedCostEstimate } from '../../../utils/formatters';
import { Routes } from '../../../utils/nav';
import { removeToken } from '../../../utils/request';
import { getGitRepos } from '../../Clusters';
import { clearCallbackState, getProviderToken } from '../../GitAuth/utils';
import { Editor } from '../../Shared';
import { getLink } from '../Edit/EditButton';
import useNotifications from './../../../contexts/Notifications';
import { ApplicationsWrapper } from './Partials/ApplicationsWrapper';
import CostEstimation from './Partials/CostEstimation';
import Credentials from './Partials/Credentials';
import GitOps from './Partials/GitOps';
import Preview from './Partials/Preview';
import Profiles from './Partials/Profiles';
import TemplateFields from './Partials/TemplateFields';
import {
  FormWrapper,
  getCreateRequestAnnotation,
  getRepositoryUrl,
  useGetInitialGitRepo,
} from './utils';

export interface GitRepositoryEnriched extends GitRepository {
  createPRRepo: boolean;
}

const CredentialsWrapper = styled(Flex)`
  & .template-title {
    margin-right: ${props => props.theme.spacing.medium};
  }
  & .credentials {
    span {
      margin-right: ${props => props.theme.spacing.xs};
    }
  }
  & .dropdown-toggle {
    border: 1px solid ${props => props.theme.colors.neutral10};
  }
  & .dropdown-popover {
    width: auto;
    flex-basis: content;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: left;
    & .template-title {
      padding-bottom: ${props => props.theme.spacing.base};
    }
  }
`;

const useStyles = makeStyles(theme =>
  createStyles({
    divider: {
      marginTop: '24px',
      marginBottom: '16px',
    },
    largeDivider: {
      margin: `32px 0`,
    },
  }),
);

function getInitialData(
  resource:
    | GitopsClusterEnriched
    | Automation
    | Source
    | GetTerraformObjectResponse
    | Pipeline
    | undefined,
  callbackState: any,
  random: string,
  templateName: string,
) {
  const resourceData = resource && getCreateRequestAnnotation(resource);

  const resourceName =
    (resource as GitopsClusterEnriched | Automation | Source | Pipeline)
      ?.name ||
    (resource as GetTerraformObjectResponse)?.object?.name ||
    resourceData?.objects?.[0].name;

  const defaultFormData = {
    repo: null,
    provider: '',
    branchName: resourceData
      ? `edit-${resourceName}-branch-${random}`
      : `wge-create-branch-${random}`,
    pullRequestTitle: resourceData
      ? `Edit ${resourceName}`
      : `Create ${templateName} instance`,
    commitMessage: resourceData
      ? `Edit ${resourceName}`
      : `Create ${templateName} instance`,
    pullRequestDescription: resourceData
      ? `This PR edits the resource ${resourceName}`
      : `This PR creates a ${templateName} instance`,
    parameterValues: resourceData?.parameter_values || {},
    clusterAutomations:
      resourceData?.kustomizations?.map((k: any) => ({
        name: k.metadata?.name,
        namespace: k.metadata?.namespace,
        path: k.spec?.path,
        target_namespace: k.spec?.target_namespace,
      })) || [],
  };

  const initialInfraCredentials = {
    ...resourceData?.infraCredential,
    ...callbackState?.state?.infraCredential,
  };

  const initialFormData = {
    ...defaultFormData,
    ...callbackState?.state?.formData,
  };

  return { initialFormData, initialInfraCredentials };
}

const getKustomizations = (formData: any) => {
  const { clusterAutomations } = formData;
  // filter out empty kustomization
  const filteredKustomizations = clusterAutomations.filter(
    (kustomization: any) => Object.values(kustomization).join('').trim() !== '',
  );
  return filteredKustomizations.map((kustomization: any): Kustomization => {
    return {
      metadata: {
        name: kustomization.name,
        namespace: kustomization.namespace,
      },
      spec: {
        path: kustomization.path,
        sourceRef: {
          name: FLUX_BOOSTRAP_KUSTOMIZATION_NAME,
          namespace: FLUX_BOOSTRAP_KUSTOMIZATION_NAMESPACE,
        },
        targetNamespace: kustomization.target_namespace,
        createNamespace: kustomization.createNamespace,
      },
    };
  });
};

const encodedProfiles = (profiles: ProfilesIndex): ProfileValues[] =>
  _.sortBy(Object.values(profiles), 'name')
    .filter(p => p.selected)
    .map(p => {
      // FIXME: handle this somehow..
      const v = p.values.find(v => v.selected)!;
      return {
        name: p.name,
        version: v?.version,
        values: utf8_to_b64(v?.yaml),
        layer: p.layer,
        namespace: p.namespace,
      };
    });

const toPayload = (
  formData: any,
  infraCredential: any,
  templateName: string,
  templateNamespace: string,
  templateKind: string,
  updatedProfiles: ProfilesIndex,
  createRequestAnnotation: any,
  repositoryUrl: string,
): CreatePullRequestRequest => {
  const { parameterValues } = formData;
  const createReqAnnot = createRequestAnnotation;
  return {
    headBranch: formData.branchName,
    title: formData.pullRequestTitle,
    description: formData.pullRequestDescription,
    commitMessage: formData.commitMessage,
    credentials: infraCredential,
    templateName,
    templateNamespace,
    parameterValues,
    kustomizations: getKustomizations(formData),
    values: encodedProfiles(updatedProfiles),
    templateKind,
    previousValues: createReqAnnot,
    repositoryUrl,
    baseBranch: formData.repo.obj.spec.ref.branch,
  };
};

interface ResourceFormProps {
  resource?: any;
  template: TemplateEnriched;
  type?: string;
}

const ResourceForm: FC<ResourceFormProps> = ({ template, resource }) => {
  const callbackState = useCallbackState();
  const classes = useStyles();
  const { renderTemplate, addResource } = useTemplates();
  const random = useMemo(() => Math.random().toString(36).substring(7), []);
  const { annotations } = template;
  const { setNotifications } = useNotifications();
  const { data } = useListSources();
  const gitRepos = React.useMemo(
    () => getGitRepos(data?.result),
    [data?.result],
  );
  const resourceData = resource && getCreateRequestAnnotation(resource);
  const initialUrl = resourceData?.repository_url;
  const initialGitRepo = useGetInitialGitRepo(initialUrl, gitRepos);

  const { initialFormData, initialInfraCredentials } = getInitialData(
    resource,
    callbackState,
    random,
    template.name,
  );
  const [formData, setFormData] = useState<any>(initialFormData);
  const [infraCredential, setInfraCredential] = useState<Credential | null>(
    initialInfraCredentials,
  );

  // get the cost estimate feature flag
  const { isFlagEnabled } = useFeatureFlags();

  const isCredentialEnabled =
    annotations?.['templates.weave.works/credentials-enabled'] === 'true';
  const isProfilesEnabled =
    annotations?.['templates.weave.works/profiles-enabled'] === 'true';
  const isKustomizationsEnabled =
    annotations?.['templates.weave.works/kustomizations-enabled'] === 'true';
  const isCostEstimationEnabled =
    isFlagEnabled('WEAVE_GITOPS_FEATURE_COST_ESTIMATION') &&
    annotations?.['templates.weave.works/cost-estimation-enabled'] !== 'false';

  const { profiles, isLoading: profilesIsLoading } = useProfiles(
    isProfilesEnabled,
    template,
    resource || undefined,
    DEFAULT_PROFILE_REPO,
  );
  const [updatedProfiles, setUpdatedProfiles] = useState<ProfilesIndex>({});

  useEffect(() => clearCallbackState(), []);

  useEffect(() => {
    setUpdatedProfiles({
      ..._.keyBy(profiles, 'name'),
      ...callbackState?.state?.updatedProfiles,
    });
  }, [callbackState?.state?.updatedProfiles, profiles]);

  const [openPreview, setOpenPreview] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const history = useHistory();
  const isLargeScreen = useMediaQuery('(min-width:1632px)');
  const editLink = resource && getLink(resource);
  const authRedirectPage = resource
    ? editLink
    : `/templates/create?name=${template.name}&namespace=${template.namespace}`;
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [prPreview, setPRPreview] = useState<RenderTemplateResponse | null>(
    null,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [costEstimationLoading, setCostEstimationLoading] =
    useState<boolean>(false);
  const [costEstimate, setCostEstimate] = useState<string>('00.00 USD');
  const [costEstimateMessage, setCostEstimateMessage] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  const handlePRPreview = useCallback(() => {
    const { parameterValues } = formData;
    setPreviewLoading(true);
    return renderTemplate({
      templateName: template.name,
      templateNamespace: template.namespace,
      values: parameterValues,
      profiles: encodedProfiles(updatedProfiles),
      credentials: infraCredential || undefined,
      kustomizations: getKustomizations(formData),
      templateKind: template.templateKind,
    })
      .then(data => {
        setOpenPreview(true);
        setPRPreview(data);
      })
      .catch(err =>
        setNotifications([
          {
            message: { text: err.message },
            severity: 'error',
            display: 'bottom',
          },
        ]),
      )
      .finally(() => setPreviewLoading(false));
  }, [
    formData,
    setOpenPreview,
    renderTemplate,
    infraCredential,
    template.name,
    template.namespace,
    template.templateKind,
    updatedProfiles,
    setNotifications,
  ]);

  const handleCostEstimation = useCallback(() => {
    const { parameterValues } = formData;
    setCostEstimationLoading(true);
    return renderTemplate({
      templateName: template.name,
      templateNamespace: template.namespace,
      values: parameterValues,
      profiles: encodedProfiles(updatedProfiles),
      credentials: infraCredential || undefined,
      kustomizations: getKustomizations(formData),
      templateKind: template.templateKind,
    })
      .then(data => {
        const { costEstimate } = data;
        setCostEstimate(getFormattedCostEstimate(costEstimate));
        setCostEstimateMessage(costEstimate?.message || '');
      })
      .catch(err =>
        setNotifications([
          {
            message: { text: err.message },
            severity: 'error',
            display: 'bottom',
          },
        ]),
      )
      .finally(() => setCostEstimationLoading(false));
  }, [
    formData,
    renderTemplate,
    infraCredential,
    template.name,
    template.templateKind,
    template.namespace,
    updatedProfiles,
    setNotifications,
  ]);

  const token = getProviderToken(formData.provider);

  const { isAuthenticated, validateToken } = useIsAuthenticated(
    formData.provider,
    token,
  );

  const handleAddResource = useCallback(() => {
    let createReqAnnot;
    if (resource !== undefined) {
      createReqAnnot = getCreateRequestAnnotation(resource);
    }
    const payload = toPayload(
      formData,
      infraCredential,
      template.name,
      template.namespace!,
      template.templateKind,
      updatedProfiles,
      createReqAnnot,
      getRepositoryUrl(formData.repo),
    );
    setLoading(true);
    return validateToken()
      .then(() =>
        addResource(payload, getProviderToken(formData.provider))
          .then(response => {
            setPRPreview(null);
            history.push(Routes.Templates);
            setNotifications([
              {
                message: {
                  component: (
                    <Link href={response.webUrl} newTab>
                      PR created successfully, please review and merge the pull
                      request to apply the changes to the cluster.
                    </Link>
                  ),
                },
                severity: 'success',
              },
            ]);
          })
          .catch(error =>
            setNotifications([
              {
                message: { text: error.message },
                severity: 'error',
                display: 'bottom',
              },
            ]),
          )
          .finally(() => setLoading(false)),
      )
      .catch(() => {
        removeToken(formData.provider);
        setNotifications([expiredTokenNotification]);
      })
      .finally(() => setLoading(false));
  }, [
    updatedProfiles,
    addResource,
    formData,
    infraCredential,
    setPRPreview,
    template.name,
    template.namespace,
    template.templateKind,
    setNotifications,
    history,
    resource,
    validateToken,
  ]);

  useEffect(() => {
    if (!resource) {
      setFormData((prevState: any) => ({
        ...prevState,
        pullRequestTitle: `Create resource ${
          Object.values(formData.parameterValues)?.[0] || ''
        }`,
      }));
    }
  }, [resource, formData.parameterValues, setFormData]);

  useEffect(() => {
    if (!formData.repo) {
      setFormData((prevState: any) => ({
        ...prevState,
        repo: initialGitRepo,
      }));
    }
  }, [initialGitRepo, formData.repo]);

  useEffect(() => {
    setCostEstimate('00.00 USD');
  }, [formData.parameterValues]);

  const [submitType, setSubmitType] = useState<string>('');

  const getSubmitFunction = useCallback(
    (submitType?: string) => {
      switch (submitType) {
        case 'PR Preview':
          return handlePRPreview;
        case 'Create resource':
          return handleAddResource;
        case 'Get cost estimation':
          return handleCostEstimation;
        default:
          return;
      }
    },
    [handleAddResource, handleCostEstimation, handlePRPreview],
  );

  return useMemo(() => {
    return (
      <CallbackStateContextProvider
        callbackState={{
          page: authRedirectPage as PageRoute,
          state: {
            infraCredential,
            formData,
            updatedProfiles,
          },
        }}
      >
        <FormWrapper
          noValidate
          onSubmit={event =>
            validateFormData(
              event,
              getSubmitFunction(submitType),
              setFormError,
              setSubmitType,
            )
          }
        >
          <CredentialsWrapper align>
            <div className="template-title">
              Template: <span>{template.name}</span>
            </div>
            {isCredentialEnabled ? (
              <Credentials
                infraCredential={infraCredential}
                setInfraCredential={setInfraCredential}
              />
            ) : null}
          </CredentialsWrapper>
          {template.description ? (
            <Flex column>
              <div>Description:</div>
              <Editor
                children={template.description || ''}
                remarkPlugins={[remarkGfm]}
              />
            </Flex>
          ) : null}
          <Divider
            className={!isLargeScreen ? classes.divider : classes.largeDivider}
          />
          <TemplateFields
            template={template}
            formData={formData}
            setFormData={setFormData}
            formError={formError}
          />
          {isProfilesEnabled ? (
            <Profiles
              isLoading={profilesIsLoading}
              updatedProfiles={updatedProfiles}
              setUpdatedProfiles={setUpdatedProfiles}
              helmRepo={DEFAULT_PROFILE_REPO}
            />
          ) : null}
          {isKustomizationsEnabled ? (
            <ApplicationsWrapper
              formData={formData}
              setFormData={setFormData}
              formError={formError}
            />
          ) : null}
          {isCostEstimationEnabled ? (
            <CostEstimation
              handleCostEstimation={handleCostEstimation}
              costEstimate={costEstimate}
              isCostEstimationLoading={costEstimationLoading}
              costEstimateMessage={costEstimateMessage}
              setFormError={setFormError}
              setSubmitType={setSubmitType}
            />
          ) : null}
          <GitOps
            formData={formData}
            setFormData={setFormData}
            showAuthDialog={showAuthDialog}
            setShowAuthDialog={setShowAuthDialog}
            formError={formError}
            enableGitRepoSelection={
              !(
                resource &&
                (initialGitRepo as GitRepositoryEnriched)?.createPRRepo
              )
            }
          />
          <Flex end className="gitops-cta">
            <Button
              loading={loading}
              type="submit"
              onClick={() => setSubmitType('Create resource')}
              disabled={!isAuthenticated || loading}
            >
              CREATE PULL REQUEST
            </Button>
            <Button
              loading={previewLoading}
              disabled={previewLoading}
              type="submit"
              onClick={() => setSubmitType('PR Preview')}
            >
              PREVIEW PR
            </Button>
            {openPreview && prPreview ? (
              <Preview
                openPreview={openPreview}
                setOpenPreview={setOpenPreview}
                prPreview={prPreview}
              />
            ) : null}
          </Flex>
        </FormWrapper>
      </CallbackStateContextProvider>
    );
  }, [
    authRedirectPage,
    template,
    formData,
    infraCredential,
    classes,
    openPreview,
    prPreview,
    profilesIsLoading,
    isLargeScreen,
    showAuthDialog,
    setUpdatedProfiles,
    updatedProfiles,
    previewLoading,
    loading,
    costEstimationLoading,
    handleCostEstimation,
    costEstimate,
    costEstimateMessage,
    isCredentialEnabled,
    isCostEstimationEnabled,
    isKustomizationsEnabled,
    isProfilesEnabled,
    formError,
    submitType,
    getSubmitFunction,
    resource,
    initialGitRepo,
    isAuthenticated,
  ]);
};

interface Props {
  template?: TemplateEnriched | null;
  resource?: any | null;
  type?: string;
}

const ResourceFormWrapper: FC<Props> = ({ template, resource }) => {
  if (!template) {
    return (
      <Redirect
        to={{
          pathname: '/templates',
          state: {
            notification: [
              {
                message: {
                  text: 'No template information is available to create a resource.',
                },
                severity: 'error',
              },
            ],
          },
        }}
      />
    );
  }

  return <ResourceForm template={template} resource={resource || undefined} />;
};

export default ResourceFormWrapper;