import React from 'react';
//import { RouterTab, SubRouterTabs } from '../../../gitops.d';

import { Routes } from '../../../utils/nav';
import { PoliciesTab } from './Tabs/Policies';
import { RoleBindingsTab } from './Tabs/RoleBindings';
import { RolesTab } from './Tabs/Roles';
import { ServiceAccountsTab } from './Tabs/ServiceAccounts';
import SubRouterTabs, { RouterTab } from '../../../weave/components/SubRouterTabs';

const TabDetails = ({
  clusterName,
  workspaceName,
}: {
  clusterName: string;
  workspaceName: string;
}) => {
  const path = Routes.WorkspaceDetails;

  return (
    <div style={{ minHeight: 'calc(100vh - 335px)' }}>
      <SubRouterTabs rootPath={`serviceAccounts`}>
        <RouterTab name="Service Accounts" path={`serviceAccounts`}>
          <ServiceAccountsTab
            clusterName={clusterName}
            workspaceName={workspaceName}
          />
        </RouterTab>

        <RouterTab name="Roles" path={`roles`}>
          <RolesTab clusterName={clusterName} workspaceName={workspaceName} />
        </RouterTab>

        <RouterTab name="Role Bindings" path={`roleBindings`}>
          <RoleBindingsTab
            clusterName={clusterName}
            workspaceName={workspaceName}
          />
        </RouterTab>

        <RouterTab name="Policies" path={`policies`}>
          <PoliciesTab
            clusterName={clusterName}
            workspaceName={workspaceName}
          />
        </RouterTab>
      </SubRouterTabs>
    </div>
  );
};

export default TabDetails;
