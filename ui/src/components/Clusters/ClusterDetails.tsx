import { CircularProgress } from '@material-ui/core';
import {
  Button as WeaveButton,
  Flex,
  Icon,
  IconType,
  RouterTab,
  SubRouterTabs,
  useListSources,
} from '@choclab/weave-gitops';
import { useEffect, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { EnabledComponent } from '../../api/query/query.pb';
import useClusters from '../../hooks/clusters';
import { useIsEnabledForComponent } from '../../hooks/query';
import { GitopsClusterEnriched } from '../../types/custom';
import { toFilterQueryString } from '../../utils/FilterQueryString';
import { Routes } from '../../utils/nav';
import { useIsClusterWithSources } from '../Applications/utils';
import { QueryState } from '../Explorer/hooks';
import { linkToExplorer } from '../Explorer/utils';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { Tooltip } from '../Shared';
import ClusterDashboard from './ClusterDashboard';

type Props = {
  className?: string;
  name: string;
  namespace: string;
  clusterName: string;
};

const ClusterDetails = ({ clusterName, namespace }: Props) => {
  const { path } = useRouteMatch();
  const history = useHistory();
  const { isLoading, getCluster, getDashboardAnnotations } = useClusters();
  const [currentCluster, setCurrentCluster] =
    useState<GitopsClusterEnriched | null>(null);
  const isClusterWithSources = useIsClusterWithSources(clusterName);
  const { isLoading: loading } = useListSources('', '', { retry: false });

  const isExplorerEnabled = useIsEnabledForComponent(
    EnabledComponent.applications,
  );

  useEffect(
    () => setCurrentCluster(getCluster(clusterName, namespace)),
    [clusterName, namespace, getCluster],
  );

  return (
    <Page
      loading={isLoading}
      path={[
        { label: 'Clusters', url: Routes.Clusters },
        { label: clusterName },
      ]}
    >
      <NotificationsWrapper>
        {currentCluster && (
          <Flex column gap="8" style={{ overflowX: 'auto' }}>
            <Flex gap="12">
              <WeaveButton
                id="cluster-application"
                startIcon={<Icon type={IconType.FilterIcon} size="base" />}
                onClick={() => {
                  const clusterName = `${currentCluster?.namespace}/${currentCluster?.name}`;
                  if (isExplorerEnabled) {
                    const s = linkToExplorer(`/applications`, {
                      filters: [`Cluster:${clusterName}`],
                    } as QueryState);

                    history.push(s);
                  } else {
                    const filtersValues = toFilterQueryString([
                      {
                        key: 'clusterName',
                        value: `${currentCluster?.namespace}/${currentCluster?.name}`,
                      },
                    ]);
                    history.push(`/applications?filters=${filtersValues}`);
                  }
                }}
              >
                GO TO APPLICATIONS
              </WeaveButton>
              {loading ? (
                <CircularProgress size={30} />
              ) : (
                <Tooltip
                  title="No sources available for this cluster"
                  placement="top"
                  disabled={isClusterWithSources === true}
                >
                  <div>
                    <WeaveButton
                      id="cluster-add-application"
                      startIcon={<Icon type={IconType.AddIcon} size="base" />}
                      onClick={() => {
                        const filtersValues = encodeURIComponent(
                          `${currentCluster?.name}`,
                        );
                        history.push(
                          `/applications/create?clusterName=${filtersValues}`,
                        );
                      }}
                      disabled={!isClusterWithSources}
                    >
                      ADD APPLICATION TO THIS CLUSTER
                    </WeaveButton>
                  </div>
                </Tooltip>
              )}
            </Flex>
            <SubRouterTabs rootPath={`${path}/details`}>
              <RouterTab name="Details" path={`${path}/details`}>
                <ClusterDashboard
                  currentCluster={currentCluster}
                  getDashboardAnnotations={getDashboardAnnotations}
                />
              </RouterTab>
            </SubRouterTabs>
          </Flex>
        )}
      </NotificationsWrapper>
    </Page>
  );
};

export default ClusterDetails;
