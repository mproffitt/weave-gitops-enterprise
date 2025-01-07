import React, { FC } from 'react';
/*import {
  Bucket,
  BucketDetail,
  Kind,
  useGetObject,
  V2Routes,
} from '../../gitops.d';*/
import BucketDetail from '../../weave/components/BucketDetail';
import { useGetObject } from '../../weave/hooks/objects';
import { Kind } from '../../weave/lib/api/core/types.pb';
import { Bucket } from '../../weave/lib/objects';
import { V2Routes } from '../../weave/lib/types';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { EditButton } from '../Templates/Edit/EditButton';

type Props = {
  name: string;
  namespace: string;
  clusterName: string;
};

const WGApplicationsBucket: FC<Props> = props => {
  const { name, namespace, clusterName } = props;
  const {
    data: bucket = {} as Bucket,
    isLoading,
    error,
  } = useGetObject<Bucket>(name, namespace, Kind.Bucket, clusterName);

  return (
    <Page
      loading={isLoading}
      path={[
        {
          label: 'Sources',
          url: V2Routes.Sources,
        },
        {
          label: `${props.name}`,
        },
      ]}
    >
      <NotificationsWrapper
        errors={
          error ? [{ clusterName, namespace, message: error?.message }] : []
        }
      >
        <BucketDetail
          bucket={bucket}
          customActions={[<EditButton resource={bucket} />]}
          {...props}
        />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsBucket;
