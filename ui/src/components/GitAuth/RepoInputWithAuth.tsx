import { MenuItem } from '@material-ui/core';
import {
  Button,
  Flex,
  Icon,
  IconType,
  useListSources,
} from '@choclab/weave-gitops';
import * as React from 'react';
import styled from 'styled-components';
import { GitProvider } from '../../api/gitauth/gitauth.pb';
import { useEnterpriseClient } from '../../contexts/API';
import { useParseRepoUrl } from '../../contexts/GitAuth';
import { Select, SelectProps } from '../../utils/form';
import { getGitRepos } from '../Clusters';
import { getRepositoryUrl } from '../Templates/Form/utils';
import AuthButton from './AuthButton';

const GitAuthForm = styled(Flex)`
  #SELECT_GIT_REPO-group {
    flex-grow: 1;
    padding-top: ${({ theme }) => theme.spacing.xs};
  }
`;

type Props = SelectProps & {
  onAuthClick: (provider: GitProvider) => void;
  onProviderChange?: (provider: GitProvider) => void;
  isAuthenticated?: boolean;
  disabled?: boolean;
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  enableGitRepoSelection?: boolean;
  value: string;
  loading: boolean;
};

export function RepoInputWithAuth({
  onAuthClick,
  onProviderChange,
  isAuthenticated,
  disabled,
  formData,
  setFormData,
  enableGitRepoSelection,
  value,
  loading,
  ...props
}: Props) {
  const parsedValue = value && JSON.parse(value);
  const { data: res, error: err } = useParseRepoUrl(parsedValue?.value);
  const { data, isLoading } = useListSources('', '', { retry: false });
  const gitRepos = getGitRepos(data?.result);

  const { gitAuth } = useEnterpriseClient();

  const [valueForSelect, setValueForSelect] = React.useState<string>('');

  React.useEffect(() => {
    if (!value) {
      return;
    }
    setValueForSelect(value);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gitAuth, value]);

  React.useEffect(() => {
    if (!res) {
      return;
    }
    if (res.provider && onProviderChange) {
      onProviderChange(res.provider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res]);

  const renderProviderAuthButton =
    valueForSelect && !!res?.provider && !isAuthenticated;

  const handleSelectSource = (event: React.ChangeEvent<any>) => {
    const { value } = event.target;

    const gitRepo = gitRepos.find(repo => {
      return repo?.obj?.spec?.url === JSON.parse(value).key;
    });
    setFormData((prevState: any) => {
      return {
        ...prevState,
        repo: gitRepo,
      };
    });
  };

  return (
    <GitAuthForm className={props.className} align between>
      {!isLoading ? (
        <Select
          error={
            !!parsedValue?.value && gitRepos.length > 0 && !!err?.message
              ? true
              : false
          }
          description={
            !formData.repo || !err ? props.description : err?.message
          }
          name="repo-select"
          required={true}
          label="SELECT_GIT_REPO"
          value={valueForSelect || ''}
          onChange={handleSelectSource}
          disabled={!enableGitRepoSelection}
        >
          {gitRepos
            ?.map(gitRepo => ({
              value: getRepositoryUrl(gitRepo),
              key: gitRepo.obj.spec.url,
            }))
            .map((option, index: number) => (
              <MenuItem key={index} value={JSON.stringify(option)}>
                {option.key}
              </MenuItem>
            ))}
        </Select>
      ) : null}
      <div className="auth-message">
        {isAuthenticated && (
          <Flex align>
            {!loading ? (
              <>
                <Icon
                  size="medium"
                  color="successOriginal"
                  type={IconType.CheckMark}
                />{' '}
                {res?.provider} credentials detected
              </>
            ) : (
              'Checking credentials ...'
            )}
          </Flex>
        )}
        {!isAuthenticated && !res && <Button disabled>AUTHENTICATE</Button>}
        {renderProviderAuthButton && (
          <AuthButton provider={res?.provider} onClick={onAuthClick} />
        )}
      </div>
    </GitAuthForm>
  );
}
