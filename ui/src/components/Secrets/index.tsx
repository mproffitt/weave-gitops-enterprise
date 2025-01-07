import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useListSecrets } from '../../contexts/Secrets';
import { Routes } from '../../utils/nav';
import Button from '../../weave/components/Button';
import Flex from '../../weave/components/Flex';
import Icon, { IconType } from '../../weave/components/Icon';
import Text from '../../weave/components/Text';

import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { SecretsTable } from './Table';

const SecretsList = () => {
  const { data, isLoading } = useListSecrets({});
  const navigate = useNavigate();

  const handleCreateSecret = useCallback(
    (url: string) => navigate(url),
    [navigate],
  );

  return (
    <Page loading={isLoading} path={[{ label: 'Secrets' }]}>
      <NotificationsWrapper errors={data?.errors}>
        <Flex column gap="32">
          <Flex gap="12">
            <Button
              id="create-secrets"
              startIcon={<Icon type={IconType.AddIcon} size="base" />}
              onClick={() => handleCreateSecret(Routes.CreateSecret)}
            >
              CREATE EXTERNAL SECRET
            </Button>
            <Button
              id="create-sops-secrets"
              startIcon={<Icon type={IconType.AddIcon} size="base" />}
              onClick={() => handleCreateSecret(Routes.CreateSopsSecret)}
            >
              CREATE SOPS SECRET
            </Button>
          </Flex>
          {data?.secrets && (
            <Flex column wide>
              <Text titleHeight semiBold size="large">
                ExternalSecrets List
              </Text>
              <SecretsTable secrets={data.secrets} />
            </Flex>
          )}
        </Flex>
      </NotificationsWrapper>
    </Page>
  );
};

export default SecretsList;
