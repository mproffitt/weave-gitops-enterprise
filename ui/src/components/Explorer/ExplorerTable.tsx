import { Box } from '@mui/material';
import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { Object } from '../../api/query/query.pb';
/*import {
  DataTable,
  Field,
  Flex,
  formatURL,
  Icon,
  Link,
  V2Routes,
} from '../../gitops.d';*/
import { getKindRoute, Routes } from '../../utils/nav';
import { getIndicatorInfo } from '../../utils/status';
import DataTable, { Field } from '../../weave/components/DataTable';
import Flex from '../../weave/components/Flex';
import Icon from '../../weave/components/Icon';
import Link from '../../weave/components/Link';
import { formatURL } from '../../weave/lib/nav';
import { V2Routes } from '../../weave/lib/types';
import { QueryState } from './hooks';

export type ExplorerField = Field & {
  id: string;
  index?: number;
};

type Props = {
  className?: string;
  fields: ExplorerField[];
  onColumnHeaderClick?: (field: Field) => void;
  rows: Object[];
  queryState: QueryState;
  enableBatchSync?: boolean;
  defaultSort?: string;
};

export const defaultExplorerFields: ExplorerField[] = [
  {
    id: 'name',
    label: 'Name',
    defaultSort: true,
    sortValue: (o: Object) => o.name,
    value: (o: Object) => {
      const page = getKindRoute(o?.kind as string);

      let url: string;
      if (page === V2Routes.NotImplemented) {
        url = formatURL(Routes.ExplorerView, {
          kind: o.kind,
          name: o.name,
          namespace: o.namespace,
          clusterName: o.cluster,
        });
      } else if (page === Routes.Templates) {
        url = formatURL(page, {
          terms: o.name,
          qfilters: 'namespace: ' + o.namespace,
        });
      } else {
        url = formatURL(page, {
          name: o.name,
          namespace: o.namespace,
          clusterName: o.cluster,
        });
      }

      return <Link to={url}>{o.name}</Link>;
    },
  },
  {
    id: 'kind',
    label: 'Kind',
    value: 'kind',
    sortValue: (o: Object) => o.kind,
  },
  {
    id: 'namespace',
    label: 'Namespace',
    value: 'namespace',
    sortValue: (o: Object) => o.namespace,
  },
  {
    id: 'clusterName',
    label: 'Cluster',
    value: 'clusterName',
    sortValue: (o: Object) => o.cluster,
  },
  {
    id: 'tenant',
    label: 'Tenant',
    value: 'tenant',
    sortValue: (o: Object) => o.tenant,
  },
  {
    id: 'status',
    label: 'Status',
    sortValue: (o: Object) => o.status,
    value: (o: Object) => {
      if (o.status === '-') {
        return '-';
      }

      return (
        <Flex align>
          <Box marginRight={1}>
            <Icon
              size="medium"
              {...getIndicatorInfo(o?.status)}
            />
          </Box>
          {o?.status}
        </Flex>
      );
    },
  },
  {
    id: 'message',
    label: 'Message',
    value: 'message',
    sortValue: (o: Object) => o.message,
    maxWidth: 600,
  },
];

export function addFieldsWithIndex(
  fields: ExplorerField[],
  extraFieldsWithIndex: ExplorerField[],
) {
  const newFields = [...fields];
  // Allows for columns to be added anywhere in the table.
  // We sort them here because if we mutate fields out of order,
  // the column order won't be accurate. See test case for example.
  for (const extra of _.sortBy(extraFieldsWithIndex, 'index')) {
    if (typeof extra.index !== 'undefined') {
      newFields.splice(extra.index, 0, extra);
    } else {
      newFields.push(extra);
    }
  }

  return newFields;
}

function ExplorerTable({
  className,
  fields,
  onColumnHeaderClick,
  rows,
  enableBatchSync,
  defaultSort,
}: Props) {
  const r: Object[] = _.map(rows, o => ({
    // Doing some things here to make this work with the DataTable.
    // It handles rendering the sync/pause buttons.
    ...o,
    uid: o.id,
    clusterName: o.cluster,
    type: o.kind,
  }));

  return (
    <DataTable
      className={className}
      fields={fields}
      rows={r}
      hideSearchAndFilters
      onColumnHeaderClick={onColumnHeaderClick}
      hasCheckboxes={enableBatchSync}
      defaultSort={defaultSort}
    />
  );
}

export default styled(ExplorerTable).attrs({ className: ExplorerTable.name })`
  width: 100%;

  /* Moving the sync/pause buttons to the left */
  & > div:first-child {
    justify-content: flex-start;
  }
`;
