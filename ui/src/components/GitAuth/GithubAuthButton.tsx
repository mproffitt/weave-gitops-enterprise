import { ButtonProps } from '@mui/material';
import * as React from 'react';
import styled from 'styled-components';
//import { Button } from '../../gitops.d';
import Button from '../../weave/components/Button';

type Props = ButtonProps;

function GithubAuthButton(props: Props) {
  return <Button {...props}>AUTHENTICATE WITH GITHUB</Button>;
}

export default styled(GithubAuthButton).attrs({
  className: GithubAuthButton.name,
})`
  &.MuiButton-contained {
    background-color: black;
    color: white;
  }
`;
