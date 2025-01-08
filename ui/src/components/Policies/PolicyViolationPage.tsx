import React from 'react';
import styled from 'styled-components';
import { useGetPolicyValidationDetails } from '../../contexts/PolicyViolations';
/*import {
  Breadcrumb,
  FluxObject,
  Kind,
  PolicyValidation,
  V2Routes,
  ViolationDetails,
  formatURL,
} from '../../gitops.d';*/
import { Routes } from '../../utils/nav';
import { Breadcrumb } from '../../weave/components/Breadcrumbs';
import { ViolationDetails } from "../../weave/components/Policies/PolicyViolations/PolicyViolationDetails";
import { PolicyValidation } from '../../weave/lib/api/core/core.pb';
import { Kind } from '../../weave/lib/api/core/types.pb';
import { formatURL } from '../../weave/lib/nav';
import { FluxObject } from '../../weave/lib/objects';
import { V2Routes } from '../../weave/lib/types';

import { Page } from '../Layout/App';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

const getPath = (kind?: string, violation?: PolicyValidation): Breadcrumb[] => {
  if (!violation) return [{ label: '' }];
  const { name, entity, namespace, clusterName, policyId } = violation;
  if (!kind) {
    return [{ label: 'Policies', url: `${Routes.Policies}/enforcement` }];
  }

  if (kind === Kind.Policy) {
    const policyUrl = formatURL(`${V2Routes.PolicyDetailsPage}/violations`, {
      id: policyId,
      clusterName,
      name,
    });
    return [
      { label: 'Policies', url: V2Routes.Policies },
      { label: name || '', url: policyUrl },
    ];
  }
  const entityUrl = formatURL(
    kind === Kind.Kustomization
      ? `${V2Routes.Kustomization}/violations`
      : `${V2Routes.HelmRelease}/violations`,
    {
      name: entity,
      namespace: namespace,
      clusterName: clusterName,
    },
  );
  return [
    { label: 'Applications', url: V2Routes.Automations },
    { label: entity || '', url: entityUrl },
  ];
};

interface Props {
  id: string;
  name: string;
  clusterName?: string;
  className?: string;
  kind?: string;
}

const PolicyViolationPage = ({ id, name, clusterName, kind }: Props) => {
  const { data, isLoading } = useGetPolicyValidationDetails({
    validationId: id,
    clusterName,
  });

  const violation = data?.validation;
  const entityObject = new FluxObject({
    payload: violation?.violatingEntity,
  });
  return (
    <Page
      loading={isLoading}
      path={[...getPath(kind, violation), { label: name || '' }]}
    >
      <NotificationsWrapper>
        {violation && (
          <ViolationDetails
            violation={violation}
            entityObject={entityObject}
            kind={kind || ''}
          />
        )}
      </NotificationsWrapper>
    </Page>
  );
};

export default styled(PolicyViolationPage)``;
