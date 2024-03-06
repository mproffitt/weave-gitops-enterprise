import moment from 'moment';
import React from 'react';
import { useGetWorkspacePolicies } from '../../../../contexts/Workspaces';
//import { DataTable, Link, Severity, V2Routes, formatURL } from '../../../../gitops.d';
import { TableWrapper } from '../../../Shared';
import WorkspaceTabsWrapper from './WorkspaceTabsWrapper';
import Link from '../../../../weave/components/Link';
import DataTable from '../../../../weave/components/DataTable';
import Severity from '../../../../weave/components/Policies/Utils/Severity';
import { formatURL } from '../../../../weave/lib/nav';
import { V2Routes } from '../../../../weave/lib/types';

export const PoliciesTab = ({
  clusterName,
  workspaceName,
}: {
  clusterName: string;
  workspaceName: string;
}) => {
  const {
    data: workspacePolicies,
    isLoading,
    error,
  } = useGetWorkspacePolicies({
    clusterName,
    name: workspaceName,
  });

  return (
    <WorkspaceTabsWrapper loading={isLoading} errorMessage={error?.message}>
      <TableWrapper id="workspace-policy-list">
        <DataTable
          key={workspacePolicies?.objects?.length}
          rows={workspacePolicies?.objects}
          fields={[
            {
              label: 'Name',
              value: w => (
                <Link
                  to={formatURL(V2Routes.PolicyDetailsPage, {
                    clusterName: clusterName,
                    id: w.id,
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
              label: 'Category',
              value: 'category',
            },
            {
              label: 'Severity',
              value: ({ severity }) => <Severity severity={severity} />,
            },
            {
              label: 'Age',
              value: ({ timestamp }) => moment(timestamp).fromNow(),
              sortValue: ({ createdAt }) => {
                const t = createdAt && new Date(createdAt).getTime();
                return t * -1;
              },
            },
          ]}
        />
      </TableWrapper>
    </WorkspaceTabsWrapper>
  );
};
