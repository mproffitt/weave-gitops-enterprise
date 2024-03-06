import _ from 'lodash';
import React, { FC } from 'react';
/*import {
  FluxRuntime,
  useListRuntimeCrds,
  useListRuntimeObjects,
} from '../../gitops.d';*/
import FluxRuntime from '../../weave/components/FluxRuntime';
import { useListRuntimeCrds } from '../../weave/hooks/flux';
import { useListRuntimeObjects } from '../../weave/hooks/flux';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

const WGApplicationsRuntime: FC = () => {
  const { data, isLoading, error } = useListRuntimeObjects();
  const {
    data: crds,
    isLoading: crdsLoading,
    error: crdsError,
  } = useListRuntimeCrds();

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
          label: 'Runtime',
        },
      ]}
    >
      <NotificationsWrapper errors={errors}>
        <FluxRuntime deployments={data?.deployments} crds={crds?.crds} />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsRuntime;
