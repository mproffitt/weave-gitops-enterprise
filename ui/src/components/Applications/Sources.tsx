import React, { FC, useEffect } from 'react';
import styled from 'styled-components';
import { EnabledComponent } from '../../api/query/query.pb';
import useNotifications from '../../contexts/Notifications';
//import { SourcesTable, useListSources } from '../../gitops.d';
import { useIsEnabledForComponent } from '../../hooks/query';
import { formatError } from '../../utils/formatters';
import SourcesTable from '../../weave/components/SourcesTable';
import { useListSources } from '../../weave/hooks/sources';
import Explorer from '../Explorer/Explorer';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

const WGApplicationsSources: FC = ({ className }: any) => {
  const isExplorerEnabled = useIsEnabledForComponent(EnabledComponent.sources);

  const {
    data: sources,
    isLoading,
    error,
  } = useListSources('', '', {
    enabled: !isExplorerEnabled,
    retry: false,
    refetchInterval: 5000,
  });

  const { setNotifications } = useNotifications();

  useEffect(() => {
    if (error) {
      setNotifications(formatError(error));
    }
  }, [error, setNotifications]);

  return (
    <Page
      loading={!isExplorerEnabled && isLoading}
      path={[
        {
          label: 'Sources',
        },
      ]}
    >
      <NotificationsWrapper errors={sources?.errors}>
        <div className={className}>
          <Explorer enableBatchSync category="source" />
        </div>
      </NotificationsWrapper>
    </Page>
  );
};

export default styled(WGApplicationsSources)``;
