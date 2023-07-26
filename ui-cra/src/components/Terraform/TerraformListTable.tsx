import {
  DataTable,
  filterByStatusCallback,
  filterConfig,
  formatURL,
  KubeStatusIndicator,
  Link,
  statusSortHelper,
  useFeatureFlags,
} from '@weaveworks/weave-gitops';
import styled from 'styled-components';
import { TerraformObject } from '../../api/terraform/types.pb';
import { computeMessage } from '../../utils/conditions';
import { getKindRoute, Routes } from '../../utils/nav';

type Props = {
  className?: string;
  rows?: TerraformObject[];
};

function TerraformListTable({ className, rows }: Props) {
  const { isFlagEnabled } = useFeatureFlags();
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

  //for all other instaces/reqs in the UI, we know that the type is Terraform, so it doesn't exist on the obj. When passing it to OSS for Sync/Suspend however, we need to supply the "type" to satisfy the ObjectRef[] type and determine which func to use
  //The uid needs to be supplied for the CheckboxActions component in OSS to work properly
  const kindRows = rows?.map((row, index) => {
    return { ...row, type: 'Terraform', uid: index };
  });

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
          value: (tf: TerraformObject) => computeMessage(tf.conditions as any),
          label: 'Message',
        },
      ]}
      rows={kindRows}
      filters={filterState}
    />
  );
}

export default styled(TerraformListTable).attrs({
  className: TerraformListTable.name,
})``;
