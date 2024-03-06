import _ from 'lodash';
import React, { FC, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnabledComponent, Object } from '../../api/query/query.pb';
import { Template } from '../../cluster-services/cluster_services.pb';
import useNotifications, {
  NotificationData,
} from '../../contexts/Notifications';
/*import {
  Button,
  Icon,
  IconType,
} from '../../gitops.d';*/
import Button from '../../weave/components/Button';
import Icon, { IconType } from '../../weave/components/Icon';
import Explorer from '../Explorer/Explorer';
import {
  addFieldsWithIndex,
  defaultExplorerFields,
} from '../Explorer/ExplorerTable';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

type Props = {
  className?: string;
  location: { state: { notification: NotificationData[] } };
};

const TemplatesDashboard: FC<Props> = ({ location, className }) => {
  const { setNotifications } = useNotifications();
  const navigate = useNavigate();

  const handleAddCluster = useCallback(
    (_event: any, t: Template) =>
      navigate(`/templates/create?name=${t.name}&namespace=${t.namespace}`),
    [navigate],
  );

  useEffect(
    () => location?.state?.notification && setNotifications([
      {
        message: {
          text: location?.state?.notification?.[0]?.message.text,
        },
        severity: location?.state?.notification?.[0]?.severity,
      } as NotificationData,
    ]),
    [location?.state?.notification, setNotifications],
  );

  const templateTableFields = defaultExplorerFields.filter(
    field => !['name', 'status', 'tenant'].includes(field.id),
  );

  const fields = addFieldsWithIndex(templateTableFields, [
    {
      index: 0,
      id: 'name',
      label: 'Name',
      value: 'name',
    },
    {
      index: 3,
      id: 'type',
      label: 'Type',
      value: (t: any) =>
        t.parsed?.metadata?.labels?.['weave.works/template-type'] || '',
    },
    {
      id: 'action',
      label: '',
      value: (t: Template) => (
        <Button
          id="create-resource"
          startIcon={<Icon type={IconType.AddIcon} size="base" />}
          onClick={event => handleAddCluster(event, t)}
          disabled={Boolean(t.error)}
        >
          USE THIS TEMPLATE
        </Button>
      ),
    },
  ]);

  return (
    <Page
      loading={false}
      className={className}
      path={[
        {
          label: 'Templates',
        },
      ]}
    >
      <NotificationsWrapper>
        <Explorer
          category="template"
          enableBatchSync={false} // disables sync controls
          fields={fields}
        />
      </NotificationsWrapper>
    </Page>
  );
};

export default TemplatesDashboard;
