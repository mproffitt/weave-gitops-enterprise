import React, { FC } from 'react';
/*import {
  OCIRepository,
  OCIRepositoryDetail,
  Kind,
  useGetObject,
  V2Routes,
} from '../../gitops.d';*/
import { OCIRepository } from '../../weave/lib/objects';
import OCIRepositoryDetail from '../../weave/components/OCIRepositoryDetail';
import { Kind } from '../../weave/lib/api/core/types.pb';
import { useGetObject } from '../../weave/hooks/objects';
import { V2Routes } from '../../weave/lib/types';

import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { EditButton } from '../Templates/Edit/EditButton';

type Props = {
  name: string;
  namespace: string;
  clusterName: string;
};

const WGApplicationsOCIRepository: FC<Props> = props => {
  const { name, namespace, clusterName } = props;
  const {
    data: ociRepository = {} as OCIRepository,
    isLoading,
    error,
  } = useGetObject<OCIRepository>(
    name,
    namespace,
    Kind.OCIRepository,
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
        <OCIRepositoryDetail
          ociRepository={ociRepository}
          customActions={[<EditButton resource={ociRepository} />]}
          {...props}
        />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsOCIRepository;
