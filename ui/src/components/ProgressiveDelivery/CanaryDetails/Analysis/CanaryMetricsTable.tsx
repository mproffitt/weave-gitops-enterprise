import { CanaryMetric } from '@choclab/progressive-delivery/api/prog/types.pb';
import React, { useContext } from 'react';
//import { AppContext, DataTable, Text } from '../../../../gitops.d';
import DataTable from '../../../../weave/components/DataTable';
import Text from '../../../../weave/components/Text';
import { AppContext } from '../../../../weave/contexts/AppContext';

import { TableWrapper } from '../../../Shared';

export const CanaryMetricsTable = ({
  metrics,
}: {
  metrics: CanaryMetric[];
}) => {
  const { setDetailModal } = useContext(AppContext);
  return (
    <TableWrapper id="canary-analysis-metrics">
      <DataTable
        rows={metrics}
        fields={[
          {
            label: 'Name',
            value: 'name',
          },
          {
            label: 'Metric Template',
            value: (c: CanaryMetric) =>
              c.metricTemplate ? (
                <Text
                  onClick={() => {
                    const metricObj: any = {
                      ...c.metricTemplate,
                      type: 'MetricTemplate',
                    };
                    setDetailModal({
                      object: metricObj,
                    });
                  }}
                  color="primary10"
                  pointer
                >
                  {c.metricTemplate?.name}
                </Text>
              ) : (
                ''
              ),
          },
          {
            label: 'Threshold Min',
            value: (c: CanaryMetric) =>
              c.thresholdRange?.min ? '' + c.thresholdRange?.min : '-',
          },
          {
            label: 'Threshold Max',
            value: (c: CanaryMetric) =>
              c.thresholdRange?.max ? '' + c.thresholdRange?.max : '-',
          },
          {
            label: 'Interval',
            value: 'interval',
          },
        ]}
      />
    </TableWrapper>
  );
};
