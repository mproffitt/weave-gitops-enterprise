import _ from 'lodash';
import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Object } from '../../api/query/query.pb';
import { NotificationData } from '../../contexts/Notifications';
/*import {
  Button,
  Flex,
  formatURL,
  Icon,
  IconType,
  Link,
} from '../../gitops.d';*/
import Button from '../../weave/components/Button';
import Flex from '../../weave/components/Flex';
import { formatURL } from '../../weave/lib/nav';
import Icon, { IconType } from '../../weave/components/Icon';
import Link from '../../weave/components/Link';
import { getKindRoute, Routes } from '../../utils/nav';
import OpenedPullRequest from '../Clusters/OpenedPullRequest';
import Explorer from '../Explorer/Explorer';
import {
  addFieldsWithIndex,
  defaultExplorerFields,
} from '../Explorer/ExplorerTable';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

type Props = {
  className?: string;
  location?: { state: { notification: NotificationData[] } };
};

const WGApplicationsDashboard: FC<Props> = ({ location, className }: any) => {
  const navigate = useNavigate();
  const handleAddApplication = () => navigate(Routes.AddApplication);
  const fields = addFieldsWithIndex(defaultExplorerFields, [
    {
      id: 'source',
      label: 'Source',
      index: 4,
      value: (o: Object & { parsed: any }) => {
        const sourceAddr =
          o.kind === 'HelmRelease'
            ? 'spec.chart.spec.sourceRef'
            : 'spec.sourceRef';

        const sourceName = _.get(o.parsed, `${sourceAddr}.name`);
        const sourceKind = _.get(o.parsed, `${sourceAddr}.kind`);

        if (!sourceName || !sourceKind) {
          return '-';
        }

        const kind = getKindRoute(sourceKind || '');

        if (!kind) {
          return sourceName;
        }

        const url = formatURL(kind, {
          name: sourceName,
          namespace: o.namespace,
          clusterName: o.cluster,
        });

        return <Link to={url}>{sourceName}</Link>;
      },
    },
  ]);

  return (
    <Page
      loading={false}
      path={[
        {
          label: 'Applications',
        },
      ]}
    >
      <NotificationsWrapper>
        <Flex column alignItems="stretch" gap="24">
          <Flex gap="12">
            <Button
              id="add-application"
              className="actionButton btn"
              startIcon={<Icon type={IconType.AddIcon} size="base" />}
              onClick={handleAddApplication}
            >
              ADD AN APPLICATION
            </Button>
            <OpenedPullRequest />
          </Flex>
          <div className={className}>
            <Explorer
              category="automation"
              enableBatchSync={true} // enables sync controls
              fields={fields}
            />
          </div>
        </Flex>
      </NotificationsWrapper>
    </Page>
  );
};

export default styled(WGApplicationsDashboard)`
  tbody tr td:nth-child(6) {
    white-space: nowrap;
  }
`;
