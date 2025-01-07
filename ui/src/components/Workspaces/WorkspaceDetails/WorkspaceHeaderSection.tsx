import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Workspace } from '../../../cluster-services/cluster_services.pb';
//import { Button, Flex, Icon, IconType } from '../../../gitops.d';
import { toFilterQueryString } from '../../../utils/FilterQueryString';
import Button from '../../../weave/components/Button';
import Flex from '../../../weave/components/Flex';
import Icon, { IconType } from '../../../weave/components/Icon';
import RowHeader from '../../RowHeader';

const Header = styled(Flex)`
  margin-bottom: ${props => props.theme.spacing.medium};
`;

function WorkspaceHeaderSection({ name, namespaces, clusterName }: Workspace) {
  const navigate = useNavigate();

  return (
    <Flex column gap="16">
      <Button
        startIcon={<Icon type={IconType.FilterIcon} size="base" />}
        onClick={() => {
          const filtersValues = toFilterQueryString([
            { key: 'tenant', value: name || '' },
            { key: 'clusterName', value: clusterName || '' },
          ]);
          navigate(`/applications?filters=${filtersValues}`);
        }}
      >
        GO TO TENANT APPLICATIONS
      </Button>
      <Header column gap="8">
        <RowHeader rowkey="Workspace Name" value={name} />
        <RowHeader rowkey="Namespaces" value={namespaces?.join(', ')} />
      </Header>
    </Flex>
  );
}

export default WorkspaceHeaderSection;
