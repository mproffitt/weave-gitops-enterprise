import { Box, CircularProgress } from '@mui/material';
import React, { FC } from 'react';
import { ListError } from '../../../../weave/lib/api/core/core.pb';
import Flex from '../../../../weave/components/Flex';
import { AlertListErrors } from '../../../../weave/components/AlertListErrors';
//import { AlertListErrors, Flex, ListError } from '../../../../gitops.d';

interface Props {
  loading: boolean;
  errorMessage?: string;
  children: any;
  errors?: ListError[];
}
const LoadingWrapper: FC<Props> = ({
  children,
  errors,
  errorMessage,
  loading,
}) => {
  return (
    <Flex wide>
      {loading && (
        <Flex wide center>
          <Box margin={4}>
            <Flex wide center>
              <CircularProgress size={'2rem'} />
            </Flex>
          </Box>
        </Flex>
      )}
      {(errors?.length || errorMessage) && (
        <AlertListErrors errors={errors || [{ message: errorMessage }]} />
      )}
      {!loading && !errorMessage && children}
    </Flex>
  );
};

export default LoadingWrapper;
