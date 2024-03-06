import { Box, IconButton } from '@mui/material';
import React from 'react';
import styled from 'styled-components';
//import { Flex, Icon, IconType, ThemeTypes } from '../../gitops.d';
import Flex from '../../weave/components/Flex';
import Icon, { IconType } from '../../weave/components/Icon';
import { ThemeTypes } from '../../weave/contexts/AppContext';

import { QueryState } from './hooks';

type Props = {
  className?: string;
  queryState: QueryState;
  setQueryState: (state: QueryState) => void;
  count: number;
};

function PaginationControls({
  className,
  queryState,
  setQueryState,
  count,
}: Props) {
  const handlePageForward = () => {
    setQueryState({
      ...queryState,
      offset: queryState.offset + queryState.limit,
    });
  };

  const handlePageBack = () => {
    setQueryState({
      ...queryState,
      offset: Math.max(0, queryState.offset - queryState.limit),
    });
  };

  return (
    <Flex className={className} wide center>
      <Box p={2}>
        <IconButton disabled={queryState.offset === 0} onClick={handlePageBack} size="large">
          <Icon size="base" type={IconType.NavigateBeforeIcon} />
        </IconButton>
        <IconButton
          disabled={count < queryState.limit}
          onClick={handlePageForward}
          size="large">
          <Icon size="base" type={IconType.NavigateNextIcon} />
        </IconButton>
      </Box>
    </Flex>
  );
}

export default styled(PaginationControls).attrs({
  className: PaginationControls.name,
})`
  ${Icon} .MuiSvgIcon-root {
    color: ${(props) =>
      props.theme.mode === ThemeTypes.Dark
        ? props.theme.colors.white
        : 'unset'};
  }
`;
