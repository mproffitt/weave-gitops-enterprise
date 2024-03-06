import React from 'react';
import { useResolvedPath } from 'react-router-dom';
/*import {
  PolicyViolationsList,
  RouterTab,
  SubRouterTabs,
  useFeatureFlags,
} from '../../gitops.d';*/
import { PolicyViolationsList } from "../../weave/components/Policies/PolicyViolations/Table";
import SubRouterTabs, { RouterTab } from '../../weave/components/SubRouterTabs';
import { useFeatureFlags } from '../../weave/hooks/featureflags';
import WarningMsg from '../Explorer/WarningMsg';
import { Page } from '../Layout/App';
import PolicyAuditList from './Audit/PolicyAuditList';
import { PoliciesTab } from './PoliciesListTab';

const Policies = () => {
  const path = useResolvedPath('').pathname;
  const { isFlagEnabled } = useFeatureFlags();

  const isQueryServiceExplorerEnabled = isFlagEnabled(
    'WEAVE_GITOPS_FEATURE_EXPLORER',
  );

  return (
    <Page path={[{ label: 'Policies' }]}>
      <SubRouterTabs rootPath={`list`} clearQuery>
        <RouterTab name="Policies" path={`list`}>
          <PoliciesTab />
        </RouterTab>
        <RouterTab name="Policy Audit" path={`audit`}>
          {isQueryServiceExplorerEnabled ? <PolicyAuditList /> : <WarningMsg />}
        </RouterTab>
        <RouterTab name="Enforcement Events" path={`enforcement`}>
          <PolicyViolationsList req={{}} />
        </RouterTab>
      </SubRouterTabs>
    </Page>
  );
};

export default Policies;
