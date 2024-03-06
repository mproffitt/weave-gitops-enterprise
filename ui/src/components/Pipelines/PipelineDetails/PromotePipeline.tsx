import React from 'react';
import styled from 'styled-components';
import { ApprovePromotionRequest } from '../../../api/pipelines/pipelines.pb';

//import { Button, Flex } from '../../../gitops.d';
import Button from '../../../weave/components/Button';
import Flex from '../../../weave/components/Flex';
import { useApprove } from '../../../hooks/pipelines';

const PromotionButton = styled(Button)`
  &.MuiButton-root {
    background: ${props => props.theme.colors.white};
    border-radius: 16px;
    &.MuiButton-outlined {
      border-color: ${props => props.theme.colors.neutral20};
    }
    &.Mui-disabled {
      color: ${props => props.theme.colors.neutral20};
    }
  }
`;

const PromotePipeline = ({
  className,
  req,
  promoteVersion,
}: {
  className?: string;
  req: ApprovePromotionRequest;
  promoteVersion: string;
}) => {
  const approve = useApprove();
  return (
    <Flex column gap="8" className={className}>
      <PromotionButton
        onClick={() => approve.mutateAsync(req)}
        disabled={approve.isLoading || !promoteVersion}
        loading={approve.isLoading}
      >
        Approve Promotion
      </PromotionButton>
    </Flex>
  );
};

export default styled(PromotePipeline)``;
