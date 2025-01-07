import React, { FC } from 'react';
/*import {
  HelmChart,
  HelmChartDetail,
  Kind,
  useGetObject,
  V2Routes,
} from '../../gitops.d';*/
import HelmChartDetail from '../../weave/components/HelmChartDetail';
import { useGetObject } from '../../weave/hooks/objects';
import { Kind } from '../../weave/lib/api/core/types.pb';
import { HelmChart } from '../../weave/lib/objects';
import { V2Routes } from '../../weave/lib/types';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { EditButton } from '../Templates/Edit/EditButton';

type Props = {
  name: string;
  namespace: string;
  clusterName: string;
};

const WGApplicationsHelmChart: FC<Props> = props => {
  const { name, namespace, clusterName } = props;
  const {
    data: helmChart = {} as HelmChart,
    isLoading,
    error,
  } = useGetObject<HelmChart>(name, namespace, Kind.HelmChart, clusterName);

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
        <HelmChartDetail
          helmChart={helmChart}
          customActions={[<EditButton resource={helmChart} />]}
          {...props}
        />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGApplicationsHelmChart;
