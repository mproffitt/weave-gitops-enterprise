import { MenuItem } from '@material-ui/core';
import {
  Flex,
  GitRepository,
  Link,
  Text,
  useListSources,
  ThemeTypes,
} from '@choclab/weave-gitops';
import { PageRoute } from '@choclab/weave-gitops/ui/lib/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import {
  ClusterAutomation,
  CreateAutomationsPullRequestRequest,
  PolicyConfigApplicationMatch,
} from '../../../cluster-services/cluster_services.pb';
import { useEnterpriseClient } from '../../../contexts/API';
import CallbackStateContextProvider from '../../../contexts/GitAuth/CallbackStateContext';
import useNotifications from '../../../contexts/Notifications';
import { useGetClustersList } from '../../../contexts/PolicyConfigs';
import {
  expiredTokenNotification,
  useIsAuthenticated,
} from '../../../hooks/gitprovider';
import { useCallbackState } from '../../../utils/callback-state';
import { Input, Select, validateFormData } from '../../../utils/form';
import { Routes } from '../../../utils/nav';
import { removeToken } from '../../../utils/request';
import { getGitRepos } from '../../Clusters';
import { clearCallbackState, getProviderToken } from '../../GitAuth/utils';
import { Page } from '../../Layout/App';
import { NotificationsWrapper } from '../../Layout/NotificationsWrapper';
import GitOps from '../../Templates/Form/Partials/GitOps';
import {
  FormWrapper,
  getRepositoryUrl,
  useGetInitialGitRepo,
} from '../../Templates/Form/utils';
import { SelectedPolicies } from './Form/Partials/SelectedPolicies';
import { SelectMatchType } from './Form/Partials/SelectTargetList';
import { Preview } from './Preview';

const FormWrapperPolicyConfig = styled(FormWrapper)`
  .policyField {
    div[class*='MuiAutocomplete-root'] {
      width: calc(50% - 24px);
    }
    div[class*='MuiFormControl-root'] {
      width: 100%;
    }
    .policies-input {
      border: ${props =>
        props.theme.mode === ThemeTypes.Dark
          ? `1px solid ${props.theme.colors.neutral20}`
          : 'none'};
      div[class*='MuiInputBase-root MuiOutlinedInput-root'] {
        padding-right: 10px;
      }
    }
    label {
      margin-bottom: ${props => props.theme.spacing.small} !important;
    }
    div[class*='MuiAutocomplete-tag'] {
      display: none;
    }
  }
  .Mui-disabled {
    background: ${props => props.theme.colors.neutral10} !important;
    border-color: ${props => props.theme.colors.neutral20} !important;
  }
`;

interface FormData {
  repo: GitRepository | null;
  branchName: string;
  provider: string;
  pullRequestTitle: string;
  commitMessage: string;
  pullRequestDescription: string;
  policyConfigName: string;
  matchType: string;
  match: any;
  appMatch: any;
  wsMatch: any;
  policies: any;
  isControlPlane: boolean;
  clusterName: string;
  clusterNamespace: string;
  selectedCluster: any;
}

function getInitialData(
  callbackState: { state: { formData: FormData } } | null,
  random: string,
) {
  const defaultFormData = {
    repo: null,
    provider: '',
    branchName: `add-policyConfig-branch-${random}`,
    pullRequestTitle: 'Add PolicyConfig',
    commitMessage: 'Add PolicyConfig',
    pullRequestDescription: 'This PR adds a new PolicyConfig',
    clusterName: '',
    clusterNamespace: '',
    isControlPlane: false,
    policyConfigName: '',
    matchType: '',
    policies: {},
    wsMatch: [],
    appMatch: [],
  };

  const initialFormData = {
    ...defaultFormData,
    ...callbackState?.state?.formData,
  };

  return { initialFormData };
}
const CreatePolicyConfig = () => {
  const history = useHistory();

  const { data: allClusters } = useGetClustersList({});
  const clusters = allClusters?.gitopsClusters
    ?.filter(s => s.conditions![0].status === 'True')
    .sort();

  const { setNotifications } = useNotifications();
  const [selectedWorkspacesList, setSelectedWorkspacesList] = useState<any[]>();
  const [selectedAppsList, setSelectedAppsList] =
    useState<PolicyConfigApplicationMatch[]>();

  const callbackState = useCallbackState();
  const random = useMemo(() => Math.random().toString(36).substring(7), []);
  const { initialFormData } = getInitialData(callbackState, random);
  const authRedirectPage = `/policyConfigs/create`;

  const [loading, setLoading] = useState<boolean>(false);

  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<any>(initialFormData);

  const { data } = useListSources('', '', { retry: false });
  const gitRepos = useMemo(() => getGitRepos(data?.result), [data?.result]);
  const initialGitRepo = useGetInitialGitRepo(null, gitRepos);

  const [formError, setFormError] = useState<string>('');

  const {
    clusterName,
    policyConfigName,
    clusterNamespace,
    isControlPlane,
    matchType,
    selectedCluster,
    policies,
  } = formData;

  useEffect(() => clearCallbackState(), []);

  useEffect(() => {
    if (!formData.repo) {
      setFormData((prevState: any) => ({
        ...prevState,
        repo: initialGitRepo,
      }));
    }
  }, [initialGitRepo, formData.repo, clusterName]);

  const handleSelectCluster = (event: React.ChangeEvent<any>) => {
    const cluster = event.target.value;
    const value = JSON.parse(cluster);
    const clusterDetails = {
      clusterName: value.name,
      clusterNamespace: value.namespace,
      selectedCluster: cluster,
      isControlPlane: value.name === 'management' ? true : false,
    };
    setFormData(
      (f: any) =>
        (f = {
          ...f,
          ...clusterDetails,
        }),
    );
  };
  useEffect(() => {
    setFormData((prevState: any) => ({
      ...prevState,
      pullRequestTitle: `Add PolicyConfig ${formData.policyConfigName}`,
    }));
  }, [formData.policyConfigName]);

  const handleFormData = (fieldName?: string, value?: any) => {
    setFormData((f: any) => (f = { ...f, [fieldName as string]: value }));
  };
  const getTargetList = useCallback(() => {
    switch (matchType) {
      case 'workspaces':
        return selectedWorkspacesList;
      case 'apps':
        return selectedAppsList;
    }
  }, [selectedWorkspacesList, selectedAppsList, matchType]);

  const getClusterAutomations = useCallback(() => {
    const clusterAutomations: ClusterAutomation[] = [];
    clusterAutomations.push({
      cluster: {
        name: clusterName,
        namespace: clusterNamespace,
      },
      policyConfig: {
        metadata: {
          name: policyConfigName,
        },
        spec: {
          match: {
            [matchType]: getTargetList(),
          },
          config: policies,
        },
      },
      isControlPlane: isControlPlane,
    });
    return clusterAutomations;
  }, [
    clusterName,
    clusterNamespace,
    isControlPlane,
    policyConfigName,
    policies,
    getTargetList,
    matchType,
  ]);

  const token = getProviderToken(formData.provider);

  const { isAuthenticated, validateToken } = useIsAuthenticated(
    formData.provider,
    token,
  );

  const { clustersService } = useEnterpriseClient();

  const handleCreatePolicyConfig = useCallback(() => {
    const payload: CreateAutomationsPullRequestRequest = {
      headBranch: formData.branchName,
      title: formData.pullRequestTitle,
      description: formData.pullRequestDescription,
      commitMessage: formData.commitMessage,
      clusterAutomations: getClusterAutomations(),
      repositoryUrl: getRepositoryUrl(formData.repo),
      baseBranch: formData.repo.obj.spec.ref.branch,
    };
    setLoading(true);
    return validateToken()
      .then(() =>
        clustersService
          .CreateAutomationsPullRequest(payload, {
            headers: new Headers({
              'Git-Provider-Token': `token ${getProviderToken(
                formData.provider,
              )}`,
            }),
          })
          .then(response => {
            history.push(Routes.PolicyConfigs);
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
    clustersService,
    formData,
    getClusterAutomations,
    history,
    setNotifications,
    validateToken,
  ]);

  return (
    <Page
      path={[
        { label: 'PolicyConfigs', url: Routes.PolicyConfigs },
        { label: 'Create New PolicyConfig' },
      ]}
    >
      <CallbackStateContextProvider
        callbackState={{
          page: authRedirectPage as PageRoute,
          state: {
            formData,
          },
        }}
      >
        <NotificationsWrapper>
          <FormWrapperPolicyConfig
            noValidate
            onSubmit={event =>
              validateFormData(event, handleCreatePolicyConfig, setFormError)
            }
          >
            <Flex column>
              <Input
                name="policyConfigName"
                required
                description="The name of your policy config"
                label="NAME"
                value={policyConfigName}
                onChange={e =>
                  handleFormData('policyConfigName', e.target.value)
                }
                error={formError === 'policyConfigName' && !policyConfigName}
              />
              <Select
                name="clusterName"
                required
                label="CLUSTER"
                value={selectedCluster || ''}
                description="Select your cluster"
                onChange={handleSelectCluster}
                error={formError === 'clusterName' && !clusterName}
              >
                {!clusters?.length ? (
                  <MenuItem disabled={true}>Loading...</MenuItem>
                ) : (
                  clusters?.map((option, index: number) => {
                    return (
                      <MenuItem
                        key={option.name}
                        value={JSON.stringify(option)}
                      >
                        <Flex column>
                          <Text>{option.name}</Text>
                          <Text color="neutral30" size="small">
                            {option.namespace ? `ns: ${option.namespace}` : '-'}
                          </Text>
                        </Flex>
                      </MenuItem>
                    );
                  })
                )}
              </Select>
              <SelectMatchType
                formError={formError}
                formData={formData}
                cluster={clusterName}
                handleFormData={handleFormData}
                selectedWorkspacesList={selectedWorkspacesList || []}
                setSelectedWorkspacesList={setSelectedWorkspacesList}
                setFormData={setFormData}
                selectedAppsList={selectedAppsList || []}
                setSelectedAppsList={setSelectedAppsList}
              />
              <SelectedPolicies
                cluster={clusterName}
                setFormData={setFormData}
                formData={formData}
                formError={formError}
              />
            </Flex>
            <GitOps
              loading={loading}
              isAuthenticated={isAuthenticated}
              formData={formData}
              setFormData={setFormData}
              showAuthDialog={showAuthDialog}
              setShowAuthDialog={setShowAuthDialog}
              formError={formError}
              enableGitRepoSelection={true}
            >
              <Preview
                formData={formData}
                getClusterAutomations={getClusterAutomations}
                setFormError={setFormError}
              />
            </GitOps>
          </FormWrapperPolicyConfig>
        </NotificationsWrapper>
      </CallbackStateContextProvider>
    </Page>
  );
};

export default CreatePolicyConfig;
