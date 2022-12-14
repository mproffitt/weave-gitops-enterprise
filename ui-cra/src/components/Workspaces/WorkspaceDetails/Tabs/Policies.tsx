import { DataTable, filterConfig, formatURL } from '@weaveworks/weave-gitops';
import { TableWrapper } from '../../../Shared';
import { useGetWorkspacePolicies } from '../../../../contexts/Workspaces';
import moment from 'moment';
import { Link } from 'react-router-dom';
import { Routes } from '../../../../utils/nav';
import Severity from '../../../Policies/Severity';
import WorkspaceTabsWrapper from './WorkspaceTabsWrapper';

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
    workspaceName,
  });

  let initialFilterState = {
    ...filterConfig(workspacePolicies?.objects, 'name'),
  };

  return (
    <WorkspaceTabsWrapper loading={isLoading} errorMessage={error?.message}>
      <TableWrapper id="workspace-policy-list">
        <DataTable
          key={workspacePolicies?.objects?.length}
          rows={workspacePolicies?.objects}
          filters={initialFilterState}
          fields={[
            {
              label: 'Name',
              value: w => (
                <Link
                  to={formatURL(Routes.PolicyDetails, {
                    clusterName: clusterName,
                    id: w.id,
                  })}
                  className="link"
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
              defaultSort: true,
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
