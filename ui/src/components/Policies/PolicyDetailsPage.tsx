import React from 'react';
import { useGetPolicyDetails } from '../../contexts/PolicyViolations';
//import { Page, PolicyDetails, V2Routes } from '../../gitops.d';
import Page from '../../weave/components/Page';
import PolicyDetails from '../../weave/components/Policies/PolicyDetails/PolicyDetails';
import { V2Routes } from '../../weave/lib/types';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

const PolicyDetailsPage = ({
  clusterName,
  id,
}: {
  clusterName: string;
  id: string;
}) => {
  const { data, isLoading } = useGetPolicyDetails({
    clusterName,
    policyName: id,
  });

  return (
    <Page
      loading={isLoading}
      path={[
        { label: 'Policies', url: V2Routes.Policies },
        { label: data?.policy?.name || '' },
      ]}
    >
      <NotificationsWrapper>
        <PolicyDetails policy={data?.policy || {}} />
      </NotificationsWrapper>
    </Page>
  );
};

export default PolicyDetailsPage;
