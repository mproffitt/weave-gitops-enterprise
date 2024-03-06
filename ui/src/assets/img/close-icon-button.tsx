import { IconButton, IconButtonProps } from '@mui/material';
import { Close } from '@mui/icons-material';
import styled from 'styled-components';
import React from 'react';

const CloseIconButton = ({ onClick, className }: IconButtonProps) => (
  <IconButton onClick={onClick} className={className} size="large">
    <Close />
  </IconButton>
);

export default styled(CloseIconButton).attrs({
  className: CloseIconButton.name,
})`
  &.MuiIconButton-root {
    color: ${props => props.theme.colors.black};
  }
`;
