import { DataTable } from '@choclab/weave-gitops';
import _ from 'lodash';
import styled from 'styled-components';
import { AccessRule } from '../../api/query/query.pb';
import { useListAccessRules } from '../../hooks/query';
import { NotificationsWrapper } from '../Layout/NotificationsWrapper';

type Props = {
  className?: string;
};

function AccessRulesDebugger({ className }: Props) {
  const { data: rules } = useListAccessRules();
  return (
    <NotificationsWrapper>
      <div className={className}>
        <DataTable
          fields={[
            { label: 'Cluster', value: 'cluster' },
            {
              label: 'Subjects',
              value: (r: AccessRule) =>
                _.map(r.subjects, 'name').join(', ') || null,
            },
            {
              label: 'Accessible Kinds',
              value: (r: AccessRule) =>
                r?.accessibleKinds?.sort().join(', ') || null,
            },
            {
              label: 'Role',
              value: 'providedByRole',
            },
            {
              label: 'Binding',
              value: 'providedByBinding',
            },
          ]}
          rows={_.sortBy(rules?.rules, 'providedByRole')}
        />
      </div>
    </NotificationsWrapper>
  );
}

export default styled(AccessRulesDebugger).attrs({
  className: AccessRulesDebugger.name,
})``;
