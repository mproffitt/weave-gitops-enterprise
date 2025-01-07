import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { TerraformObject } from '../../api/terraform/types.pb';
/*import {
  DataTable,
  filterByStatusCallback,
  filterConfig,
  formatURL,
  KubeStatusIndicator,
  Link,
  statusSortHelper,
  Timestamp,
  useFeatureFlags,
} from '../../gitops.d';*/
import { getKindRoute, Routes } from '../../utils/nav';
import DataTable, { filterConfig, filterByStatusCallback } from '../../weave/components/DataTable';
import KubeStatusIndicator from '../../weave/components/KubeStatusIndicator';
import Link from '../../weave/components/Link';
import Timestamp from '../../weave/components/Timestamp';
import { useFeatureFlags } from '../../weave/hooks/featureflags';
import { formatURL } from '../../weave/lib/nav';
import { statusSortHelper } from '../../weave/lib/utils';

type Props = {
  className?: string;
  rows?: TerraformObject[];
};

export const getLastApplied = (tf: TerraformObject) => {
  const timestamp = _.find(tf?.conditions, { type: 'Apply' })?.timestamp;
  if (!timestamp) {
    return '-';
  }

  try {
    return new Date(timestamp).toISOString();
  } catch (e) {
    return '-';
  }
};

function TerraformListTable({ className, rows }: Props) {
  const { isFlagEnabled } = useFeatureFlags();
  rows = rows || [];
  let filterState = {
    ...filterConfig(rows, 'namespace'),
    ...filterConfig(rows, 'Cluster', tf => tf.clusterName),
    ...filterConfig(rows, 'Source', tf => tf.sourceRef.name),
    ...filterConfig(rows, 'Status', filterByStatusCallback),
  };
  if (isFlagEnabled('WEAVE_GITOPS_FEATURE_TENANCY')) {
    filterState = {
      ...filterState,
      ...filterConfig(rows, 'tenant'),
    };
  }
  return (
    <DataTable
      hasCheckboxes
      className={className}
      fields={[
        {
          value: ({ name, namespace, clusterName }: TerraformObject) => (
            <Link
              to={formatURL(Routes.TerraformDetail, {
                name,
                namespace,
                clusterName,
              })}
            >
              {name}
            </Link>
          ),
          label: 'Name',
          sortValue: ({ name }: TerraformObject) => name,
          textSearchable: true,
        },
        { value: 'namespace', label: 'Namespace' },
        ...(isFlagEnabled('WEAVE_GITOPS_FEATURE_TENANCY')
          ? [{ label: 'Tenant', value: 'tenant' }]
          : []),
        { value: 'clusterName', label: 'Cluster' },
        {
          label: 'Source',
          value: (tf: TerraformObject) => {
            const route = getKindRoute(tf.sourceRef?.kind as string);

            const { name, namespace } = tf.sourceRef || {};

            const u = formatURL(route, {
              clusterName: tf.clusterName,
              name,
              namespace,
            });

            return <Link to={u}>{name}</Link>;
          },
          sortValue: ({ sourceRef }: TerraformObject) => sourceRef?.name,
        },
        {
          value: (tf: TerraformObject) => (
            <KubeStatusIndicator
              conditions={tf.conditions || []}
              suspended={tf.suspended}
            />
          ),
          label: 'Status',
          sortValue: statusSortHelper,
        },
        {
          value: (tf: TerraformObject) => (
            <Timestamp time={getLastApplied(tf)} />
          ),
          label: 'Last Applied',
        },
      ]}
      rows={rows}
      filters={filterState}
    />
  );
}

export default styled(TerraformListTable).attrs({
  className: TerraformListTable.name,
})``;
