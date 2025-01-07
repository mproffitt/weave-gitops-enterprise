import React, { FC } from 'react';
//import { Auth, UserGroupsTable } from '../gitops.d';
import UserGroupsTable from '../weave/components/UserGroupsTable';
import { Auth, AuthContext } from '../weave/contexts/AuthContext';
import { Page } from './Layout/App';
import { NotificationsWrapper } from './Layout/NotificationsWrapper';

const WGUserInfo: FC = () => {
  const { userInfo, error } = React.useContext(Auth) as AuthContext;

  return (
    <Page
      path={[
        {
          label: 'User Info',
        },
      ]}
    >
      <NotificationsWrapper
        errors={error?.statusText != "" ? [{ message: error?.statusText }] : []}
      >
        <UserGroupsTable rows={userInfo?.groups} />
      </NotificationsWrapper>
    </Page>
  );
};

export default WGUserInfo;
