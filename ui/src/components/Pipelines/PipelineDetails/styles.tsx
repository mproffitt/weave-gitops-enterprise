import styled from 'styled-components';
//import { Flex, ThemeTypes } from '../../../gitops.d';
import Flex from '../../../weave/components/Flex';
import { ThemeTypes } from '../../../weave/contexts/AppContext';

export const cardHeight = '154px';

export const EnvironmentCard = styled(Flex)<{ background?: number }>`
  border-radius: 8px;
  padding: ${props => props.theme.spacing.small};
  width: 268px;
  height: ${cardHeight};
  color: ${props => props.theme.mode == ThemeTypes.Dark ? props.theme.colors.neutral20 : props.theme.colors.neutral40};
  background: ${props => props.theme.colors.white};
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  margin: ${props => props.theme.spacing.xs};
`;
