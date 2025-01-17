import { NotificationsTable, useListProviders } from '@choclab/weave-gitops';
import { Provider } from '@choclab/weave-gitops/ui/lib/objects';
import { FC } from 'react';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

const WGNotifications: FC = () => {
  const { data, isLoading, error } = useListProviders();

  return (
    <Page
      loading={isLoading}
      path={[
        {
          label: 'Notifications',
        },
      ]}
    >
      <NotificationsWrapper errors={error ? [{ message: error?.message }] : []}>
        <NotificationsTable rows={data?.objects as Provider[]} />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGNotifications;
