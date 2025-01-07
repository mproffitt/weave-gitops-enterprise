import React from 'react';
import styled from 'styled-components';
//import { RouterTab, SubRouterTabs } from '../../gitops.d';
import { Routes } from '../../utils/nav';
import SubRouterTabs, { RouterTab } from '../../weave/components/SubRouterTabs';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import AccessRulesDebugger from './AccessRulesDebugger';
import Explorer from './Explorer';

type Props = {
  className?: string;
};

function ExplorerPage({ className }: Props) {
  return (
    <Page path={[{ label: 'Explorer' }]}>
      <NotificationsWrapper>
        <div className={className}>
          <SubRouterTabs rootPath={`query`}>
            <RouterTab name="Query" path={`query`}>
              <Explorer />
            </RouterTab>
            <RouterTab name="Access Rules" path={`access`}>
              <AccessRulesDebugger />
            </RouterTab>
          </SubRouterTabs>
        </div>
      </NotificationsWrapper>
    </Page>
  );
}

export default styled(ExplorerPage).attrs({ className: ExplorerPage.name })`
  overflow: auto;

  .ExplorerTable {
    flex: 1;
  }
`;
