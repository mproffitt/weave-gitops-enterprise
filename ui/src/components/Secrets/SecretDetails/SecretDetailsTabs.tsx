import React from 'react';
import { GetExternalSecretResponse } from '../../../cluster-services/cluster_services.pb';
/*import {
  DataTable,
  Flex,
  FluxObject,
  RouterTab,
  SubRouterTabs,
  Text,
  YamlView,
  createYamlCommand,
} from '../../../gitops.d';*/

import DataTable from '../../../weave/components/DataTable';
import Flex from '../../../weave/components/Flex';
import { FluxObject } from '../../../weave/lib/objects';
import SubRouterTabs, { RouterTab } from '../../../weave/components/SubRouterTabs';
import Text from '../../../weave/components/Text';
import YamlView from '../../../weave/components/YamlView';
import { createYamlCommand } from '../../../weave/lib/utils';
import { Routes } from '../../../utils/nav';
import ListEvents from '../../ListEvents';
import { RowHeaders, SectionRowHeader } from '../../RowHeader';

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
  const secretObj = new FluxObject({
    payload: secretDetails?.yaml,
  });
  const secretProps = secretObj.obj?.spec?.data?.map((d: any) => ({
    key: d.secretKey,
    value: d.remoteRef.property,
  }));
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
      rowkey: 'Version',
      value: secretDetails.version,
    },
    ...(!secretObj.obj?.spec?.data?.length
      ? [
          {
            rowkey: 'Properties',
            value: 'All Properties Included',
          },
        ]
      : []),
  ];
  return (
    <SubRouterTabs rootPath={`details`}>
      <RouterTab name="Details" path={`details`}>
        <Flex column wide gap="8">
          <RowHeaders rows={secretDetailsHeaders} />
          {secretObj.obj?.spec?.data?.length && (
            <>
              <Text size="medium" semiBold>
                Properties
              </Text>
              <DataTable
                key={secretProps?.length}
                rows={secretProps}
                fields={[
                  {
                    label: 'PROPERTY',
                    value: 'value',
                  },
                  {
                    label: 'SECRET KEY',
                    value: 'key',
                  },
                ]}
              />
            </>
          )}
        </Flex>
      </RouterTab>
      <RouterTab name="Events" path={`events`}>
        <ListEvents
          involvedObject={{
            name: externalSecretName,
            namespace: namespace || '',
            kind: 'ExternalSecret',
          }}
          clusterName={clusterName}
        />
      </RouterTab>
      <RouterTab name="Yaml" path={`yaml`}>
        <YamlView
          yaml={secretObj.yaml}
          header={createYamlCommand(
            'ExternalSecret',
            externalSecretName,
            namespace,
          )}
        />
      </RouterTab>
    </SubRouterTabs>
  );
};

export default SecretDetailsTabs;
