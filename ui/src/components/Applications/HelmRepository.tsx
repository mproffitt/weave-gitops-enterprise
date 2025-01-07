import React, { FC } from 'react';
/*import {
  HelmRepository,
  HelmRepositoryDetail,
  Kind,
  useGetObject,
  V2Routes,
} from '../../gitops.d';*/
import HelmRepositoryDetail from '../../weave/components/HelmRepositoryDetail';
import { useGetObject } from '../../weave/hooks/objects';
import { Kind } from '../../weave/lib/api/core/types.pb';
import { HelmRepository } from '../../weave/lib/objects';
import { V2Routes } from '../../weave/lib/types';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { EditButton } from '../Templates/Edit/EditButton';

type Props = {
  name: string;
  namespace: string;
  clusterName: string;
};

const WGApplicationsHelmRepository: FC<Props> = props => {
  const { name, namespace, clusterName } = props;
  const {
    data: helmRepository = {} as HelmRepository,
    isLoading,
    error,
  } = useGetObject<HelmRepository>(
    name,
    namespace,
    Kind.HelmRepository,
    clusterName,
  );

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
        <HelmRepositoryDetail
          helmRepository={helmRepository}
          customActions={[<EditButton resource={helmRepository} />]}
          {...props}
        />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsHelmRepository;
