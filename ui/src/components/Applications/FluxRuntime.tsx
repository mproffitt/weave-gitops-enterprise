import _ from 'lodash';
import React, { FC } from 'react';
/*import {
  FluxRuntime,
  useListFluxCrds,
  useListFluxRuntimeObjects,
} from '../../gitops.d';*/
import FluxRuntime from '../../weave/components/FluxRuntime';
import { useListFluxCrds, useListFluxRuntimeObjects } from '../../weave/hooks/flux';
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
