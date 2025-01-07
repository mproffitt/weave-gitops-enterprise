import { ImageOutlined } from '@mui/icons-material';
import React, { FC } from 'react';
/*import {
  HelmRelease,
  HelmReleaseDetail,
  Kind,
  useGetObject,
} from '../../gitops.d';*/
import { Routes } from '../../utils/nav';
import HelmReleaseDetail from '../../weave/components/HelmReleaseDetail';
import { useGetObject } from '../../weave/hooks/objects';
import { Kind } from '../../weave/lib/api/core/types.pb';
import { HelmRelease } from '../../weave/lib/objects';
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
            customActions={helmRelease ? [<EditButton resource={helmRelease} />] : []}
            {...props}
          />
        )}
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsHelmRelease;
