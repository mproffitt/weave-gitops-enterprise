import { Dialog, DialogContent } from '@mui/material';
import React, { FC } from 'react';
import styled from 'styled-components';
//import { Link } from '../../gitops.d';
import Link from '../../weave/components/Link';
import { MuiDialogTitle } from '../Shared';

const DialogWrapper = styled(Dialog)`
  div[class*='MuiDialog-paper'] {
    padding: ${({ theme }) => theme.spacing.medium};
    border-radius: ${({ theme }) => theme.spacing.xs};
  }

  button {
    padding: 0;
  }
`;

interface Props {
  onFinish: () => void;
}

export const ConnectClusterDialog: FC<Props> = ({ onFinish }) => {
  return (
    <DialogWrapper
      id="connection-popup"
      fullWidth
      maxWidth="md"
      onClose={() => onFinish()}
      open
    >
      <MuiDialogTitle title="Connect a cluster" onFinish={onFinish} />
      <DialogContent>
        For instructions on how to connect and disconnect clusters, have a look
        at the&nbsp;
        <Link
          href=" https://docs.gitops.weave.works/docs/cluster-management/managing-existing-clusters/#how-to-connect-a-cluster"
          newTab
        >
          documentation.
        </Link>
      </DialogContent>
    </DialogWrapper>
  );
};
