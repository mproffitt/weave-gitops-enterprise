import { Flex } from '@choclab/weave-gitops';
import styled from 'styled-components';

export const cardHeight = '154px';

export const EnvironmentCard = styled(Flex)<{ background?: number }>`
  border-radius: 8px;
  padding: ${props => props.theme.spacing.small};
  width: 268px;
  height: ${cardHeight};
  color: black;
  background: ${props => props.theme.colors.white}};
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  overflow: hidden;
`;
