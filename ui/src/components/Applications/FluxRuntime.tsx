import {
  FluxRuntime,
  useListFluxCrds,
  useListFluxRuntimeObjects,
} from '@choclab/weave-gitops';
import _ from 'lodash';
import { FC } from 'react';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

const WGApplicationsFluxRuntime: FC = () => {
  const { data, isLoading, error } = useListFluxRuntimeObjects();
  const {
    data: crds,
    isLoading: crdsLoading,
    error: crdsError,
  } = useListFluxCrds();

  const errors = _.compact([
    ...(data?.errors || []),
    error,
    ...(crds?.errors || []),
    crdsError,
  ]);

  return (
    <Page
      loading={isLoading || crdsLoading}
      path={[
        {
          label: 'Flux Runtime',
        },
      ]}
    >
      <NotificationsWrapper errors={errors}>
        <FluxRuntime deployments={data?.deployments} crds={crds?.crds} />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsFluxRuntime;
