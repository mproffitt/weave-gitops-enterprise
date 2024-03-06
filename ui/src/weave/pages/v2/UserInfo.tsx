import * as React from "react";
import Page from "../../components/Page";
import UserGroupsTable from "../../components/UserGroupsTable";
import { Auth, AuthContext } from "../../contexts/AuthContext";
type Props = {
  className?: string;
};

export default function UserInfo({ className }: Props) {
  const { userInfo, loading } = React.useContext(Auth) as AuthContext;
  return (
    <Page
      className={className}
      loading={loading}
      path={[{ label: "User Info" }]}
    >
      <UserGroupsTable rows={userInfo?.groups}></UserGroupsTable>
    </Page>
  );
}
