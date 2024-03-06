import React, { FC } from 'react';
/*import {
  Kind,
  ProviderDetail,
  useGetObject,
  V2Routes,
  Provider,
} from '../../gitops.d';*/
import { Kind } from '../../weave/lib/api/core/types.pb';
import ProviderDetail from '../../weave/components/ProviderDetail';
import { useGetObject } from '../../weave/hooks/objects';
import { V2Routes } from '../../weave/lib/types';
import { Provider } from '../../weave/lib/objects';
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
