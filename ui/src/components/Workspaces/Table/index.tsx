import React, { FC } from 'react';
import { Workspace } from '../../../cluster-services/cluster_services.pb';
/*import {
  DataTable,
  filterConfig,
  formatURL,
  Link,
} from '../../../gitops.d';*/
import { Routes } from '../../../utils/nav';
import DataTable, { filterConfig } from '../../../weave/components/DataTable';
import Link from '../../../weave/components/Link';
import { formatURL } from '../../../weave/lib/nav';
import { TableWrapper } from '../../Shared';

interface Props {
  workspaces: Workspace[];
}

export const WorkspacesTable: FC<Props> = ({ workspaces }) => {
  const initialFilterState = {
    ...filterConfig(workspaces, 'clusterName'),
    ...filterConfig(workspaces, 'name'),
  };

  return (
    <TableWrapper
      id="workspaces-list"
      style={{ minHeight: 'calc(100vh - 233px)' }}
    >
      <DataTable
        key={workspaces?.length}
        filters={initialFilterState}
        rows={workspaces}
        fields={[
          {
            label: 'Name',
            value: (w: Workspace) => (
              <Link
                to={formatURL(Routes.WorkspaceDetails, {
                  clusterName: w.clusterName,
                  workspaceName: w.name,
                })}
                data-workspace-name={w.name}
              >
                {w.name}
              </Link>
            ),
            textSearchable: true,
            sortValue: ({ name }) => name,
            maxWidth: 650,
          },
          {
            label: 'Namespaces',
            value: ({ namespaces }) => namespaces.join(', '),
          },
          {
            label: 'Cluster',
            value: 'clusterName',
          },
        ]}
      />
    </TableWrapper>
  );
};
