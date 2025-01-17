import { Button } from '@choclab/weave-gitops';
// @ts-ignore
import { CallbackStateContextType } from '@choclab/weave-gitops/ui/contexts/CallbackStateContext';
import * as React from 'react';
import styled from 'styled-components';
import { useEnterpriseClient } from '../../contexts/API';
import { CallbackStateContext } from '../../contexts/GitAuth/CallbackStateContext';
import { azureDevOpsOAuthRedirectURI } from '../../utils/formatters';
import { navigate, storeCallbackState } from './utils';

type Props = {
  className?: string;
  onClick: () => void;
};

function AzureDevOpsAuthButton({ onClick, ...props }: Props) {
  const { callbackState } = React.useContext<CallbackStateContextType>(
    CallbackStateContext as any,
  );
  const { gitAuth } = useEnterpriseClient();

  const handleClick = (e: any) => {
    storeCallbackState(callbackState);

    gitAuth
      .GetAzureDevOpsAuthURL({
        redirectUri: azureDevOpsOAuthRedirectURI(),
      })
      .then(res => {
        navigate(res?.url || '');
      });
    onClick();
  };
  return (
    <Button onClick={handleClick} {...props}>
      AUTHENTICATE WITH AZURE
    </Button>
  );
}

export default styled(AzureDevOpsAuthButton).attrs({
  className: AzureDevOpsAuthButton.name,
})``;
