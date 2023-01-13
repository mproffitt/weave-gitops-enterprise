import { RouterTab } from '@weaveworks/weave-gitops';
import { GetExternalSecretResponse } from '../../../cluster-services/cluster_services.pb';
import styled from 'styled-components';
import { generateRowHeaders, SectionRowHeader } from '../../RowHeader';
import { Routes } from '../../../utils/nav';
import { CustomSubRouterTabs } from '../../Workspaces/WorkspaceStyles';
import ListEvents from './Events/ListEvents';

const ListEventsWrapper = styled.div`
  width: 100%;
`;
const DetailsHeadersWrapper = styled.div`
  div {
    margin-top: 0px !important;
  }
`;

const SecretDetailsTabs = ({
  clusterName,
  namespace,
  externalSecretName,
  secretDetails,
}: {
  clusterName: string;
  namespace: string;
  externalSecretName: string;
  secretDetails: GetExternalSecretResponse;
}) => {
  const path = Routes.SecretDetails;

  const secretDetailsHeaders: Array<SectionRowHeader> = [
    {
      rowkey: 'External Secret',
      value: externalSecretName,
    },
    {
      rowkey: 'K8s Secret',
      value: secretDetails.secretName,
    },
    {
      rowkey: 'Cluster',
      value: clusterName,
    },
    {
      rowkey: 'Secret Store',
      value: secretDetails.secretStore,
    },
    {
      rowkey: 'Secret Store Type',
      value: secretDetails.secretStoreType,
    },
    {
      rowkey: 'Secret path',
      value: secretDetails.secretPath,
    },
    {
      rowkey: 'Property',
      value: secretDetails.property,
    },
    {
      rowkey: 'Version',
      value: secretDetails.version,
    },
  ];

  return (
      <CustomSubRouterTabs rootPath={`${path}/details`}>
        <RouterTab name="Details" path={`${path}/details`}>
          <DetailsHeadersWrapper>
            {generateRowHeaders(secretDetailsHeaders)}
          </DetailsHeadersWrapper>
        </RouterTab>

        <RouterTab name="Events" path={`${path}/events`}>
          <ListEventsWrapper>
            <ListEvents
              involvedObject={{
                name: externalSecretName,
                namespace: namespace || '',
                kind: 'ExternalSecret',
              }}
              clusterName={clusterName}
            />
          </ListEventsWrapper>
        </RouterTab>
      </CustomSubRouterTabs>
  );
};

export default SecretDetailsTabs;