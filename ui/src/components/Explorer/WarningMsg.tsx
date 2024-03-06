import React from 'react';
//import { Button, Flex, MessageBox, Text } from '../../gitops.d';
import Button from '../../weave/components/Button';
import Flex from '../../weave/components/Flex';
import MessageBox from '../../weave/components/MessageBox';
import Text from '../../weave/components/Text';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';
import { LinkTag } from '../Shared';

const WarningMsg = () => {
  return (
    <NotificationsWrapper>
      <Flex center align>
        <MessageBox>
          <Flex column gap="20">
            <Text size="large" semiBold>
              Explorer Disabled
            </Text>
            <Text size="medium" capitalize>
              the explorer service is disabled and it's required to view the
              Page.
            </Text>
            <Flex wide align center>
              <LinkTag
                href="https://docs.gitops.weave.works/docs/explorer/configuration/"
                newTab
              >
                <Button id="navigate-to-imageautomation">
                  EXPLORER CONFIGRATION GUIDE
                </Button>
              </LinkTag>
            </Flex>
          </Flex>
        </MessageBox>
      </Flex>
    </NotificationsWrapper>
  );
};

export default WarningMsg;
