import {
  Kind,
  ProviderDetail,
  useGetObject,
  V2Routes,
} from '@choclab/weave-gitops';
import { Provider } from '@choclab/weave-gitops/ui/lib/objects';
import { FC } from 'react';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

type Props = {
  className?: string;
  name: string;
  namespace: string;
  clusterName: string;
};

const WGNotificationsProvider: FC<Props> = ({
  name,
  namespace,
  clusterName,
}) => {
  const { data, isLoading, error } = useGetObject<Provider>(
    name,
    namespace,
    Kind.Provider,
    clusterName,
  );

  return (
    <Page
      loading={isLoading}
      path={[
        {
          label: 'Notifications',
          url: V2Routes.Notifications,
        },
        {
          label: name,
        },
      ]}
    >
      <NotificationsWrapper errors={error ? [{ message: error?.message }] : []}>
        <ProviderDetail provider={data} />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGNotificationsProvider;
