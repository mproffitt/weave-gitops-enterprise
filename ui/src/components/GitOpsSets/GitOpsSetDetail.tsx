import { Box } from '@mui/material';
import * as React from 'react';
import { FC, useCallback, useContext } from 'react';
import { useResolvedPath } from 'react-router-dom';
import styled from 'styled-components';
import { Condition } from '../../api/gitopssets/types.pb';
import CallbackStateContextProvider from '../../contexts/GitAuth/CallbackStateContext';
import useNotifications from '../../contexts/Notifications';
/*import {
  AppContext,
  Button,
  createYamlCommand,
  filterByStatusCallback,
  filterConfig,
  Flex,
  FluxObjectsTable,
  Graph,
  InfoList,
  KubeStatusIndicator,
  Metadata,
  PageStatus,
  ReconciledObjectsAutomation,
  RequestStateHandler,
  RouterTab,
  SubRouterTabs,
  useGetInventory,
  SyncControls,
  YamlView,
  PageRoute,
} from '../../gitops.d';*/

import { AppContext } from '../../weave/contexts/AppContext';
import Button from '../../weave/components/Button';
import { createYamlCommand } from '../../weave/lib/utils';
import { filterByStatusCallback, filterConfig } from '../../weave/components/DataTable';
import Flex from '../../weave/components/Flex';
import FluxObjectsTable from '../../weave/components/FluxObjectsTable';
import { Graph } from '../../weave/components/ReconciliationGraph';
import { ReconciledObjectsAutomation } from "../../weave/components/AutomationDetail";

import InfoList from '../../weave/components/InfoList';
import KubeStatusIndicator from '../../weave/components/KubeStatusIndicator';
import Metadata from '../../weave/components/Metadata';
import PageStatus from '../../weave/components/PageStatus';
import RequestStateHandler from '../../weave/components/RequestStateHandler';
import SubRouterTabs, { RouterTab } from '../../weave/components/SubRouterTabs';
import { useGetInventory } from '../../weave/hooks/inventory';
import SyncControls from '../../weave/components/Sync/SyncControls';
import YamlView from '../../weave/components/YamlView';
import { PageRoute } from '../../weave/lib/types';

import {
  useGetGitOpsSet,
  useSyncGitOpsSet,
  useToggleSuspendGitOpsSet,
} from '../../hooks/gitopssets';
import { RequestError } from '../../types/custom';
import { useCallbackState } from '../../utils/callback-state';
import { Routes } from '../../utils/nav';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import ListEvents from '../ListEvents';
import { TableWrapper } from '../Shared';

type Props = {
  className?: string;
  name: string;
  namespace: string;
  clusterName: string;
};

const GitOpsDetail: FC<Props> = ({ className, name, namespace, clusterName }: Props) => {
  const [syncing, setSyncing] = React.useState(false);
  const [suspending, setSuspending] = React.useState(false);
  const { setNotifications } = useNotifications();
  const { setDetailModal } = useContext(AppContext);

  const sync = useSyncGitOpsSet({
    name,
    namespace,
    clusterName,
  });

  const toggleSuspend = useToggleSuspendGitOpsSet({
    name,
    namespace,
    clusterName,
  });

  const { data: gs, isLoading: gitOpsSetLoading } = useGetGitOpsSet({
    name,
    namespace,
    clusterName,
  });

  const handleSyncClick = useCallback(async () => {
    setSyncing(true);
    try {
      await sync();
      setNotifications([
        {
          message: { text: 'Sync successful' },
          severity: 'success',
        },
      ]);
    } catch (err) {
      setNotifications([
        {
          message: { text: (err as { message: string })?.message },
          severity: 'error',
        },
      ]);
    } finally {
      setSyncing(false);
    }
  }, [setNotifications, sync]);

  const handleSuspendClick = useCallback(async () => {
    setSuspending(true);
    const suspend = !gs?.suspended;

    try {
      await toggleSuspend(suspend);
      setNotifications([
        {
          message: {
            text: `Successfully ${suspend ? 'suspended' : 'resumed'} ${gs?.name}`,
          },
          severity: 'success',
        },
      ]);
    } catch (err) {
      setNotifications([
        { message: { text: (err as  {message: string})?.message },
          severity: 'error',
        },
      ]);
    } finally {
      setSuspending(false);
    }
  }, [gs, setNotifications, toggleSuspend]);

  const {
    data: invData,
    isLoading,
    error,
  } = useGetInventory('GitOpsSet', name, clusterName, namespace, true);

  const objects = invData?.objects ?? [];
  const initialFilterState = {
    ...filterConfig(objects, 'type'),
    ...filterConfig(objects, 'namespace'),
    ...filterConfig(objects, 'status', filterByStatusCallback),
  };

  if (!gs) {
    return null;
  }

  const reconciledObjectsAutomation: ReconciledObjectsAutomation = {
    source: { clusterName, name, namespace, kind: 'GitOpsSet' },
    name: gs.name || '',
    namespace: gs.namespace || '',
    suspended: gs.suspended || false,
    conditions: gs.conditions || ([] as Condition[]),
    type: gs.type || 'GitOpsSet',
    clusterName: gs.clusterName || '',
  };

  const suspended = gs?.suspended;

  return (
    <Page
      loading={gitOpsSetLoading || isLoading}
      path={[
        {
          label: 'GitOpsSet',
          url: Routes.GitOpsSets,
        },
        {
          label: gs?.name || '',
        },
      ]}
    >
      <NotificationsWrapper>
        <Box paddingBottom={3}>
          <KubeStatusIndicator
            conditions={gs?.conditions || []}
            suspended={gs?.suspended}
          />
        </Box>
        <Box paddingBottom={3}>
          <SyncControls
            hideSyncOptions
            syncLoading={syncing}
            syncDisabled={suspended}
            suspendDisabled={suspending || suspended}
            resumeDisabled={suspending || !suspended}
            onSyncClick={handleSyncClick}
            onSuspendClick={handleSuspendClick}
            onResumeClick={handleSuspendClick}
          />
        </Box>
        <SubRouterTabs rootPath={`details`}>
          <RouterTab name="Details" path={`details`}>
            <Box style={{ width: '100%' }}>
              <InfoList
                data-testid="info-list"
                items={[
                  ['Observed generation', gs?.obj?.status?.observedGeneration],
                  ['Cluster', gs?.clusterName],
                  ['Suspended', suspended ? 'True' : 'False'],
                ]}
              />
              <Metadata metadata={gs.metadata} labels={gs.labels} />
              <TableWrapper>
                <FluxObjectsTable
                  className={className}
                  objects={objects || []}
                  onClick={setDetailModal}
                  initialFilterState={initialFilterState}
                />
              </TableWrapper>
            </Box>
          </RouterTab>
          <RouterTab name="Events" path={`events`}>
            <ListEvents
              clusterName={gs?.clusterName}
              involvedObject={{
                kind: 'GitOpsSet',
                name: gs?.name,
                namespace: gs?.namespace,
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
                objects={objects || []}
              />
            </RequestStateHandler>
          </RouterTab>
          <RouterTab name="Yaml" path={`yaml`}>
            <YamlView
              yaml={gs.yaml}
              header={createYamlCommand(gs?.type, gs?.name, gs?.namespace)}
            />
          </RouterTab>
        </SubRouterTabs>
      </NotificationsWrapper>
    </Page>
  );
}

export default styled(GitOpsDetail).attrs({
  className: GitOpsDetail?.name,
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
