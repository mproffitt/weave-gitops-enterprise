import React from 'react';
import { useListPolicies } from '../../contexts/PolicyViolations';
//import { PolicyTable } from '../../gitops.d';
import { PolicyTable } from '../../weave/components/Policies/PolicyList/PolicyTable';
import { TableWrapper } from '../Shared';
import LoadingWrapper from '../Workspaces/WorkspaceDetails/Tabs/WorkspaceTabsWrapper';

export const PoliciesTab = () => {
  const { data, isLoading } = useListPolicies({});

  return (
    <LoadingWrapper loading={isLoading} errors={data?.errors}>
      {data?.policies && (
        <TableWrapper id="policy-list">
          <PolicyTable policies={data.policies} />
        </TableWrapper>
      )}
    </LoadingWrapper>
  );
};
