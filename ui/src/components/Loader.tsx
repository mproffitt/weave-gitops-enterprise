import React, { FC } from 'react';
import styled from 'styled-components';
import LoadingPage from '../weave/components/LoadingPage';
//import { LoadingPage } from '../gitops.d';

const LoaderWrapper = styled.div`
  padding: ${({ theme }) => theme.spacing.medium} 0;
`;

export const Loader: FC = () => {
  return (
    <LoaderWrapper>
      <LoadingPage />
    </LoaderWrapper>
  );
};
