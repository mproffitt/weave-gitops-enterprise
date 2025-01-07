import React from 'react';
import styled from 'styled-components';
import {
  Event,
  ListEventsRequest,
} from '../cluster-services/cluster_services.pb';
import { useListEvents } from '../contexts/ProgressiveDelivery';
import DataTable from '../weave/components/DataTable';
import Icon, { IconType } from '../weave/components/Icon';
import RequestStateHandler from '../weave/components/RequestStateHandler';
import Text from '../weave/components/Text';
import Timestamp from '../weave/components/Timestamp';
import { RequestError } from '../weave/lib/types';
/*import {
  DataTable,
  Icon,
  IconType,
  RequestStateHandler,
  RequestError,
  Text,
  Timestamp,
} from '../gitops.d';*/

const Reason = styled.h2`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px !important;
`;

const ListEvents = (props: ListEventsRequest) => {
  const { error, data, isLoading } = useListEvents(props);
  return (
    <RequestStateHandler loading={isLoading} error={error as RequestError}>
      <DataTable
        fields={[
          {
            label: 'Reason',
            labelRenderer: () => {
              return (
                <Reason title="This refers to what triggered the event, and can vary by component.">
                  Reason
                  <Icon
                    size="base"
                    type={IconType.InfoIcon}
                    color="neutral30"
                  />
                </Reason>
              );
            },
            value: (e: Event) => <Text capitalize>{e?.reason}</Text>,
            sortValue: (e: Event) => e?.reason,
          },
          { label: 'Message', value: 'message', maxWidth: 600 },
          { label: 'From', value: 'component' },
          {
            label: 'Last Updated',
            value: (e: Event) => <Timestamp time={e?.timestamp || ''} />,
            sortValue: (e: Event) => -Date.parse(e?.timestamp || ''),
            defaultSort: true,
            secondarySort: true,
          },
        ]}
        rows={data?.events}
      />
    </RequestStateHandler>
  );
};

export default ListEvents;
