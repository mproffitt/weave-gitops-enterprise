import {
  HelmReleaseDetail,
  Kind,
  useGetObject,
} from '@choclab/weave-gitops';
import { HelmRelease } from '@choclab/weave-gitops/ui/lib/objects';
import { FC } from 'react';
import { Routes } from '../../utils/nav';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { EditButton } from '../Templates/Edit/EditButton';

type Props = {
  name: string;
  clusterName: string;
  namespace: string;
};

const WGApplicationsHelmRelease: FC<Props> = props => {
  const { name, namespace, clusterName } = props;
  const {
    data: helmRelease,
    isLoading,
    error,
  } = useGetObject<HelmRelease>(name, namespace, Kind.HelmRelease, clusterName);

  return (
    <Page
      loading={isLoading}
      path={[
        {
          label: 'Applications',
          url: Routes.Applications,
        },
        {
          label: `${name}`,
        },
      ]}
    >
      <NotificationsWrapper
        errors={
          error ? [{ clusterName, namespace, message: error?.message }] : []
        }
      >
        {!error && !isLoading && (
          <HelmReleaseDetail
            helmRelease={helmRelease}
            customActions={[<EditButton resource={helmRelease} />]}
            {...props}
          />
        )}
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsHelmRelease;
