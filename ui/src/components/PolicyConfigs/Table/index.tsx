import moment from 'moment';
import React, { FC } from 'react';
import { PolicyConfigListItem } from '../../../cluster-services/cluster_services.pb';
/*import {
  DataTable,
  Link,
  Text,
  filterConfig,
  formatURL
} from '../../../gitops.d';*/
import { Routes } from '../../../utils/nav';
import DataTable, { filterConfig } from '../../../weave/components/DataTable';
import Link from '../../../weave/components/Link';
import Text from '../../../weave/components/Text';
import { formatURL } from '../../../weave/lib/nav';

import {
  PolicyConfigsTableWrapper,
  TotalPolicies,
  WarningIcon,
} from '../PolicyConfigStyles';

interface Props {
  PolicyConfigs: PolicyConfigListItem[];
}

export const PolicyConfigsTable: FC<Props> = ({ PolicyConfigs }) => {
  const initialFilterState = {
    ...filterConfig(PolicyConfigs, 'name'),
  };

  return (
    <PolicyConfigsTableWrapper id="policyConfigs-list">
      <DataTable
        key={PolicyConfigs?.length}
        filters={initialFilterState}
        rows={PolicyConfigs}
        fields={[
          {
            label: '',
            value: ({ status, clusterName, name }) =>
              status === 'Warning' ? (
                <span
                  title={`One or more policies are not found in cluster ${clusterName}.`}
                  data-testid={`warning-icon-${name}`}
                >
                  <WarningIcon />
                </span>
              ) : (
                ' '
              ),
            maxWidth: 50,
          },
          {
            label: 'Name',
            value: (s: PolicyConfigListItem) => (
              <Link
                to={formatURL(Routes.PolicyConfigsDetails, {
                  clusterName: s.clusterName,
                  name: s.name,
                })}
                data-policyconfig-name={s.name}
              >
                {s.name}
              </Link>
            ),
            textSearchable: true,
            defaultSort: true,
            sortValue: ({ name }) => name,
            maxWidth: 650,
          },
          {
            label: 'Cluster',
            value: 'clusterName',
          },
          {
            label: 'Policy Count',
            sortValue: ({ totalPolicies }) => totalPolicies,
            value: ({ totalPolicies }) => (
              <TotalPolicies wide center>
                {totalPolicies}
              </TotalPolicies>
            ),
            maxWidth: 100,
          },
          {
            label: 'Applied To',
            sortValue: ({ match }) => match,
            value: ({ match }) => <Text capitalize>{match}</Text>,
          },
          {
            label: 'Age',
            value: ({ age }) => moment(age).fromNow(),
            sortValue: ({ age }) => age ? new Date(age).getTime() * -1 : 0,
          },
        ]}
      />
    </PolicyConfigsTableWrapper>
  );
};
