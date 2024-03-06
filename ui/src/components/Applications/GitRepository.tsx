import React, { FC } from 'react';
/*import {
  GitRepository,
  GitRepositoryDetail,
  Kind,
  useGetObject,
  V2Routes,
} from '../../gitops.d';*/
import { GitRepository } from '../../weave/lib/objects';
import GitRepositoryDetail from '../../weave/components/GitRepositoryDetail';
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

const WGApplicationsGitRepository: FC<Props> = props => {
  const { name, namespace, clusterName } = props;
  const {
    data: gitRepository = {} as GitRepository,
    isLoading,
    error,
  } = useGetObject<GitRepository>(
    name,
    namespace,
    Kind.GitRepository,
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
        <GitRepositoryDetail
          gitRepository={gitRepository}
          customActions={[<EditButton resource={gitRepository} />]}
          {...props}
        />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsGitRepository;
