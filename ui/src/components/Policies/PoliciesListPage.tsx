import {
  PolicyViolationsList,
  RouterTab,
  SubRouterTabs,
  useFeatureFlags,
} from '@choclab/weave-gitops';
import { useRouteMatch } from 'react-router-dom';
import WarningMsg from '../Explorer/WarningMsg';
import { Page } from '../Layout/App';
import PolicyAuditList from './Audit/PolicyAuditList';
import { PoliciesTab } from './PoliciesListTab';

const Policies = () => {
  const { path } = useRouteMatch();
  const { isFlagEnabled } = useFeatureFlags();

  const isQueryServiceExplorerEnabled = isFlagEnabled(
    'WEAVE_GITOPS_FEATURE_EXPLORER',
  );

  return (
    <Page path={[{ label: 'Policies' }]}>
      <SubRouterTabs rootPath={`${path}/list`} clearQuery>
        <RouterTab name="Policies" path={`${path}/list`}>
          <PoliciesTab />
        </RouterTab>
        <RouterTab name="Policy Audit" path={`${path}/audit`}>
          {isQueryServiceExplorerEnabled ? <PolicyAuditList /> : <WarningMsg />}
        </RouterTab>
        <RouterTab name="Enforcement Events" path={`${path}/enforcement`}>
          <PolicyViolationsList req={{}} />
        </RouterTab>
      </SubRouterTabs>
    </Page>
  );
};

export default Policies;
