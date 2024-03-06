import * as React from 'react';
import styled from 'styled-components';
import { useEnterpriseClient } from '../../contexts/API';
import { CallbackStateContext, CallbackStateContextType } from '../../contexts/GitAuth/CallbackStateContext';
//import { Button } from '../../gitops.d';
import Button from '../../weave/components/Button';
import { bitbucketServerOAuthRedirectURI } from '../../utils/formatters';
import { navigate, storeCallbackState } from './utils';

type Props = {
  className?: string;
  onClick: () => void;
};

function BitBucketAuthButton({ onClick, ...props }: Props) {
  const { callbackState } = React.useContext<CallbackStateContextType>(
    CallbackStateContext as any,
  );
  const { gitAuth } = useEnterpriseClient();

  const handleClick = (e: any) => {
    storeCallbackState(callbackState);

    gitAuth
      .GetBitbucketServerAuthURL({
        redirectUri: bitbucketServerOAuthRedirectURI(),
      })
      .then(res => {
        navigate(res?.url || '');
      });
    onClick();
  };
  return (
    <Button onClick={handleClick} {...props}>
      AUTHENTICATE WITH BITBUCKET
    </Button>
  );
}

export default styled(BitBucketAuthButton).attrs({
  className: BitBucketAuthButton.name,
})``;
