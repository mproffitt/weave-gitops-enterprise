import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListPolicyConfigs } from '../../contexts/PolicyConfigs';
//import { Button, Icon, IconType } from '../../gitops.d';
import Button from '../../weave/components/Button';
import Icon, { IconType } from '../../weave/components/Icon';
import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { PolicyConfigsTable } from './Table';

const PolicyConfigsList = () => {
  const { data, isLoading } = useListPolicyConfigs({});
  const navigate = useNavigate();

  const handleCreatePolicyConfig = useCallback(
    () => navigate(`/policyConfigs/create`),
    [history],
  );
  return (
    <Page loading={isLoading} path={[{ label: 'PolicyConfigs' }]}>
      <NotificationsWrapper errors={data?.errors}>
        <Button
          id="create-policy-config"
          startIcon={<Icon type={IconType.AddIcon} size="base" />}
          onClick={handleCreatePolicyConfig}
        >
          CREATE A POLICY CONFIG
        </Button>
        {data?.policyConfigs && (
          <PolicyConfigsTable PolicyConfigs={data.policyConfigs} />
        )}
      </NotificationsWrapper>
    </Page>
  );
};

export default PolicyConfigsList;
