import moment from 'moment';
import React from 'react';
import { useGetWorkspaceServiceAccount } from '../../../../contexts/Workspaces';
/*import {
  DataTable,
  YamlView,
  createYamlCommand,
} from '../../../../gitops.d';*/
import DataTable from '../../../../weave/components/DataTable';
import YamlView from '../../../../weave/components/YamlView';
import { createYamlCommand } from '../../../../weave/lib/utils';
import { TableWrapper } from '../../../Shared';
import WorkspaceModal from '../WorkspaceModal';
import WorkspaceTabsWrapper from './WorkspaceTabsWrapper';

export const ServiceAccountsTab = ({
  clusterName,
  workspaceName,
}: {
  clusterName: string;
  workspaceName: string;
}) => {
  const {
    data: serviceAccounts,
    isLoading,
    error,
  } = useGetWorkspaceServiceAccount({
    clusterName,
    name: workspaceName,
  });

  return (
    <WorkspaceTabsWrapper loading={isLoading} errorMessage={error?.message}>
      <TableWrapper id="service-accounts-list">
        <DataTable
          key={serviceAccounts?.objects?.length}
          rows={serviceAccounts?.objects}
          fields={[
            {
              label: 'Name',
              value: ({ name, namespace, kind, manifest }) => {
                if (manifest) {
                  return (
                    <WorkspaceModal
                      content={
                        <YamlView
                          yaml={manifest}
                          header={createYamlCommand(kind, name, namespace)}
                        />
                      }
                      title="Service Accounts Manifest"
                      btnName={name}
                    />
                  );
                } else return name;
              },
              textSearchable: true,
              maxWidth: 650,
            },
            {
              label: 'Namespace',
              value: 'namespace',
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
