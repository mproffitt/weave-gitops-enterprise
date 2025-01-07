import moment from 'moment';
import React, { useState } from 'react';
import useNotifications from '../../../contexts/Notifications';
import { useGetSecretDetails } from '../../../contexts/Secrets';
//import { Button, Flex, SyncControls } from '../../../gitops.d';
import { Routes } from '../../../utils/nav';
import Button from '../../../weave/components/Button';
import Flex from '../../../weave/components/Flex';
import SyncControls from '../../../weave/components/Sync/SyncControls';
import { Page } from '../../Layout/App';
import { NotificationsWrapper } from '../../Layout/NotificationsWrapper';
import { RowHeaders, SectionRowHeader } from '../../RowHeader';
import SecretDetailsTabs from './SecretDetailsTabs';
import { useSyncSecret } from './SyncSecret';

const SecretDetails = ({
  externalSecretName,
  clusterName,
  namespace,
}: {
  externalSecretName: string;
  clusterName: string;
  namespace: string;
}) => {
  const { data: secretDetails, isLoading: isSecretDetailsLoading } =
    useGetSecretDetails({
      externalSecretName,
      clusterName,
      namespace,
    });
  const defaultHeaders: Array<SectionRowHeader> = [
    {
      rowkey: 'Status',
      value:
        secretDetails?.status === 'NotReady'
          ? 'Not Ready'
          : secretDetails?.status,
    },
    {
      rowkey: 'Last Updated',
      value: moment(secretDetails?.timestamp).fromNow(),
    },
  ];
  const [syncing, setSyncing] = useState(false);
  const { setNotifications } = useNotifications();

  const sync = useSyncSecret({
    clusterName,
    namespace,
    externalSecretName,
  });

  const handleSyncClick = () => {
    setSyncing(true);
    setNotifications([]);
    return sync()
      .catch(err => {
        setNotifications([
          {
            message: { text: err?.message },
            severity: 'error',
          },
        ]);
      })
      .finally(() => setSyncing(false));
  };

  return (
    <Page
      loading={isSecretDetailsLoading}
      path={[
        { label: 'Secrets', url: Routes.Secrets },
        { label: secretDetails?.externalSecretName || '' },
      ]}
    >
      <NotificationsWrapper>
        <Flex column gap="16">
          <SyncControls
            hideSyncOptions
            hideSuspend
            syncLoading={syncing}
            onSyncClick={handleSyncClick}
          />
          <Flex column gap="8">
            <RowHeaders rows={defaultHeaders} />
          </Flex>
          <SecretDetailsTabs
            externalSecretName={externalSecretName}
            clusterName={clusterName}
            namespace={namespace}
            secretDetails={secretDetails || {}}
          />
        </Flex>
      </NotificationsWrapper>
    </Page>
  );
};

export default SecretDetails;
