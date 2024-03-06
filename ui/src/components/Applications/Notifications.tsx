import React, { FC } from 'react';
import { NotificationData } from '../../contexts/Notifications';
/*import {
  NotificationsTable,
  useListProviders,
  Provider
} from '../../gitops.d';*/
import NotificationsTable from '../../weave/components/NotificationsTable';
import { useListProviders } from '../../weave/hooks/notifications';
import { Provider } from '../../weave/lib/objects';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

type Props = {
  className?: string;
  location: { state: { notification: NotificationData[] } };
};

const WGNotifications: FC<Props> = ({ location, className }) => {
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
