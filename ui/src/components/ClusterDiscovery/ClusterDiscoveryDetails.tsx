import { Box } from '@mui/material';
import React, { FC } from 'react';
import { useResolvedPath } from 'react-router-dom';
import styled from 'styled-components';
import {
  Condition,
  ObjectRef,
} from '../../cluster-services/cluster_services.pb';
/*import {
  AppContext,
  Button,
  Flex,
  FluxObjectsTable,
  Graph,
  InfoList,
  Kind,
  Page,
  PageStatus,
  RequestStateHandler,
  RouterTab,
  SubRouterTabs,
  YamlView,
  filterByStatusCallback,
  filterConfig,
  useGetInventory,
  useGetObject,
  useToggleSuspend,
  ReconciledObjectsAutomation,
  useSyncFluxObject,
  KubeStatusIndicator,
  createYamlCommand,
  Metadata,
  FluxObject,
} from '../../gitops.d';*/
import { RequestError } from '../../types/custom';
import { Routes } from '../../utils/nav';
import { ReconciledObjectsAutomation } from '../../weave/components/AutomationDetail';
import Button from '../../weave/components/Button';
import { filterByStatusCallback, filterConfig } from '../../weave/components/DataTable';
import Flex from '../../weave/components/Flex';
import FluxObjectsTable from '../../weave/components/FluxObjectsTable';
import InfoList from '../../weave/components/InfoList';
import KubeStatusIndicator from '../../weave/components/KubeStatusIndicator';
import Metadata from '../../weave/components/Metadata';
import Page from '../../weave/components/Page';
import PageStatus from '../../weave/components/PageStatus';
import { Graph } from '../../weave/components/ReconciliationGraph';
import RequestStateHandler from '../../weave/components/RequestStateHandler';
import SubRouterTabs, { RouterTab } from '../../weave/components/SubRouterTabs';
import YamlView from '../../weave/components/YamlView';
import { AppContext } from '../../weave/contexts/AppContext';
import { useSyncFluxObject } from '../../weave/hooks/automations';
import { useToggleSuspend } from '../../weave/hooks/flux';
import { useGetInventory } from '../../weave/hooks/inventory';
import { useGetObject } from '../../weave/hooks/objects';
import { Kind } from '../../weave/lib/api/core/types.pb';
import { FluxObject } from '../../weave/lib/objects';
import { createYamlCommand } from '../../weave/lib/utils';




import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import ListEvents from '../ListEvents';
import { TableWrapper } from '../Shared';

type Props = {
  name: string;
  namespace: string;
  clusterName: string;
  className?: string;
};

function useGetAutomatedClusterDiscovery(
  name: string,
  namespace: string,
  clusterName: string,
) {
  return useGetObject(
    name,
    namespace,
    'AutomatedClusterDiscovery' as Kind,
    clusterName,
  );
}

const ClusterDiscoveryDetails: FC<Props> = ({
  className,
  name,
  namespace,
  clusterName,
}) => {
  const { data: acd, error } = useGetAutomatedClusterDiscovery(
    name,
    namespace,
    clusterName,
  );

  const path = useResolvedPath("").pathname;
  const {
    data: invData,
    error: invError,
    isLoading,
  } = useGetInventory(
    'AutomatedClusterDiscovery',
    name,
    clusterName,
    namespace,
  );

  const suspend = useToggleSuspend(
    {
      objects: [
        {
          name,
          namespace,
          clusterName,
          kind: 'AutomatedClusterDiscovery',
        },
      ],
      suspend: !acd?.suspended,
    },
    'object',
  );

  const initialFilterState = {
    ...filterConfig(invData?.objects ?? [], 'type'),
    ...filterConfig(invData?.objects ?? [], 'namespace'),
    ...filterConfig(invData?.objects ?? [], 'status', filterByStatusCallback),
  };
  const { setDetailModal } = React.useContext(AppContext);

  const { name: nameRef, namespace: namespaceRef } = acd || {} as FluxObject;
  const objectRef = {
    name: nameRef,
    namespace: namespaceRef,
    kind: 'AutomatedClusterDiscovery',
  };
  const reconciledObjectsAutomation: ReconciledObjectsAutomation = {
    source: objectRef || ({} as ObjectRef),
    name: acd?.name || '',
    namespace: acd?.namespace || '',
    suspended: acd?.suspended || false,
    conditions: acd?.conditions || ([] as Condition[]),
    type: acd?.type || 'AutomatedClusterDiscovery',
    clusterName: acd?.clusterName || '',
  };

  const sync = useSyncFluxObject([objectRef] as ObjectRef[]);
  if (!acd) {
    return null;
  }

  return (
    <Page
      loading={isLoading}
      path={[
        {
          label: 'Cluster Discovery',
          url: Routes.ClusterDiscovery,
        },
        {
          label: acd?.name || '',
        },
      ]}
    >
      <NotificationsWrapper>
        <Box paddingBottom={3}>
          <KubeStatusIndicator
            conditions={acd?.conditions || []}
            suspended={acd?.suspended}
          />
        </Box>
        <Box paddingBottom={3}>
          <Flex>
            <Button
              loading={sync.isLoading}
              variant="outlined"
              onClick={() => sync.mutateAsync({ withSource: false })}
              style={{ marginRight: 0, textTransform: 'uppercase' }}
            >
              Sync
            </Button>
            <Box paddingLeft={1}>
              <Button
                loading={suspend.isLoading}
                variant="outlined"
                onClick={() => suspend.mutateAsync()}
                style={{ marginRight: 0, textTransform: 'uppercase' }}
              >
                {acd?.suspended ? 'Resume' : 'Suspend'}
              </Button>
            </Box>
          </Flex>
        </Box>
        <SubRouterTabs rootPath={`details`}>
          <RouterTab name="Details" path={`details`}>
            <Box style={{ width: '100%' }}>
              <InfoList
                data-testid="info-list"
                items={[
                  ['Cluster', acd?.clusterName],
                  ['Suspended', acd?.suspended ? 'True' : 'False'],
                ]}
              />
              <Metadata metadata={acd.metadata} labels={acd.labels} />
              <TableWrapper>
                <RequestStateHandler
                  loading={isLoading}
                  error={error as RequestError}
                >
                  <FluxObjectsTable
                    className={className}
                    objects={invData?.objects || []}
                    onClick={setDetailModal}
                    initialFilterState={initialFilterState}
                  />
                </RequestStateHandler>
              </TableWrapper>
            </Box>
          </RouterTab>
          <RouterTab name="Events" path={`events`}>
            <ListEvents
              clusterName={acd?.clusterName}
              involvedObject={{
                kind: 'AutomatedClusterDiscovery',
                name: acd?.name,
                namespace: acd?.namespace,
              }}
            />
          </RouterTab>
          <RouterTab name="Graph" path={`graph`}>
            <RequestStateHandler
              loading={isLoading}
              error={error as RequestError}
            >
              <Graph
                className={className}
                reconciledObjectsAutomation={reconciledObjectsAutomation}
                objects={invData?.objects || []}
              />
            </RequestStateHandler>
          </RouterTab>
          <RouterTab name="Yaml" path={`yaml`}>
            <YamlView
              yaml={acd?.yaml}
              header={createYamlCommand(acd?.type, acd?.name, acd?.namespace)}
            />
          </RouterTab>
        </SubRouterTabs>
      </NotificationsWrapper>
    </Page>
  );
}

export default styled(ClusterDiscoveryDetails).attrs({
  className: ClusterDiscoveryDetails?.name,
})`
  ${PageStatus} {
    padding: ${props => props.theme.spacing.small} 0px;
  }
  ${SubRouterTabs} {
    margin-top: ${props => props.theme.spacing.medium};
  }
  .MuiSlider-vertical {
    min-height: 400px;
  }
`;
