import {
  Automation,
  Canary,
} from '@choclab/progressive-delivery/api/prog/types.pb';
import React from 'react';
import styled from 'styled-components';
/*import {
  Flex,
  RouterTab,
  SubRouterTabs,
  Text,
  YamlView,
  createYamlCommand,
} from '../../../gitops.d';*/
import { Routes } from '../../../utils/nav';
import Flex from '../../../weave/components/Flex';
import SubRouterTabs, { RouterTab } from '../../../weave/components/SubRouterTabs';
import Text from '../../../weave/components/Text';
import YamlView from '../../../weave/components/YamlView';
import { createYamlCommand } from '../../../weave/lib/utils';

import ListEvents from '../../ListEvents';
import { getProgressValue } from '../ListCanaries/Table';
import CanaryStatus from '../SharedComponent/CanaryStatus';
import { CanaryMetricsTable } from './Analysis/CanaryMetricsTable';
import DetailsSection from './Details/DetailsSection';
import ListManagedObjects from './ManagedObjects/ListManagedObjects';

const CanaryDetailsWrapper = styled.div`
  width: 100%;
`;

function CanaryDetailsSection({
  canary,
  automation,
}: {
  canary: Canary;
  automation?: Automation;
}) {
  const path = Routes.CanaryDetails;
  return (
    <Flex column gap="16">
      <Flex gap="8" align start>
        <CanaryStatus
          status={canary.status?.phase || '--'}
          value={getProgressValue(
            canary.deploymentStrategy || '',
            canary.status,
            canary.analysis,
          )}
        />
        <Text color="neutral30">
          {canary.status?.conditions![0].message || '--'}
        </Text>
      </Flex>
      <SubRouterTabs rootPath={`details`}>
        <RouterTab name="Details" path={`details`}>
          <CanaryDetailsWrapper>
            <DetailsSection canary={canary} automation={automation} />
          </CanaryDetailsWrapper>
        </RouterTab>

        <RouterTab name="Objects" path={`objects`}>
          <CanaryDetailsWrapper>
            <ListManagedObjects
              clusterName={canary.clusterName || ''}
              name={canary.name || ''}
              namespace={canary.namespace || ''}
            />
          </CanaryDetailsWrapper>
        </RouterTab>
        <RouterTab name="Events" path={`events`}>
          <CanaryDetailsWrapper>
            <ListEvents
              clusterName={canary?.clusterName}
              involvedObject={{
                kind: 'Canary',
                name: canary.name,
                namespace: canary?.namespace,
              }}
            />
          </CanaryDetailsWrapper>
        </RouterTab>
        <RouterTab name="Analysis" path={`analysis`}>
          <CanaryDetailsWrapper>
            <CanaryMetricsTable
              metrics={canary.analysis?.metrics || []}
            ></CanaryMetricsTable>
          </CanaryDetailsWrapper>
        </RouterTab>
        <RouterTab name="yaml" path={`yaml`}>
          <CanaryDetailsWrapper>
            <YamlView
              yaml={canary.yaml || ''}
              header={createYamlCommand(
                'Canary',
                canary.name,
                canary.namespace,
              )}
            />
          </CanaryDetailsWrapper>
        </RouterTab>
      </SubRouterTabs>
    </Flex>
  );
}

export default CanaryDetailsSection;
