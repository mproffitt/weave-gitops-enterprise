import {
  HelmRepositoryDetail,
  Kind,
  useGetObject,
  V2Routes,
} from '@choclab/weave-gitops';
import { HelmRepository } from '@choclab/weave-gitops/ui/lib/objects';
import { FC } from 'react';
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
    data: helmRepository,
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
