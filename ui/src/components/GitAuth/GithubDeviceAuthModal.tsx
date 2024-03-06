import { CircularProgress } from '@mui/material';
import Alert from '@mui/material/Alert';
import React from 'react';
import { GitProvider } from '../../api/gitauth/gitauth.pb';
import { useGetGithubDeviceCode } from '../../contexts/GitAuth';
//import { Flex, Modal } from '../../gitops.d';
import Flex from '../../weave/components/Flex';
import Modal from '../../weave/components/Modal';
import ModalContent from './ModalContent';
import { storeProviderToken } from './utils';

type Props = {
  className?: string;
  open: boolean;
  onSuccess: (token: string) => void;
  onClose: () => void;
  repoName: string;
};

export function GithubDeviceAuthModal({
  className,
  open,
  onClose,
  repoName,
  onSuccess,
}: Props) {
  const { isLoading, error, data } = useGetGithubDeviceCode();
  return (
    <Modal
      className={className}
      title="Authenticate with Github"
      open={open}
      onClose={onClose}
      description={`Weave GitOps needs to authenticate with the Git Provider for the ${repoName} repo`}
    >
      <p>
        Paste this code into the Github Device Activation field to grant Weave
        GitOps temporary access:
      </p>
      {error && (
        <Alert severity="error" title="Error">
          {error.message}
        </Alert>
      )}
      <Flex wide center height="150px">
        {isLoading || !data ? (
          <CircularProgress />
        ) : (
          <ModalContent
            onSuccess={(token: string) => {
              storeProviderToken(GitProvider.GitHub, token);
              onSuccess(token);
              onClose();
            }}
            codeRes={data}
          />
        )}
      </Flex>
    </Modal>
  );
}
