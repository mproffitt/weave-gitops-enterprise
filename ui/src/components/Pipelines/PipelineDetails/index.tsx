import { ListError } from '@choclab/progressive-delivery/api/prog/types.pb';
import React from 'react';
import { Pipeline } from '../../../api/pipelines/types.pb';
import { useGetPipeline } from '../../../contexts/Pipelines';
/*import {
  Flex,
  RouterTab,
  SubRouterTabs,
  YamlView,
  createYamlCommand,
} from '../../../gitops.d';*/
import { Routes } from '../../../utils/nav';
import Flex from '../../../weave/components/Flex';
import SubRouterTabs, { RouterTab } from '../../../weave/components/SubRouterTabs';
import YamlView from '../../../weave/components/YamlView';
import { createYamlCommand } from '../../../weave/lib/utils';
import { Page } from '../../Layout/App';
import { NotificationsWrapper } from '../../Layout/NotificationsWrapper';
import Workloads from './Workloads';

const mappedErrors = (
  errors: Array<string>,
  namespace: string,
): Array<ListError> => {
  return errors.map(err => ({
    message: err,
    namespace,
  }));
};
interface Props {
  name: string;
  namespace: string;
}

const PipelineDetails = ({ name, namespace }: Props) => {
  const { isLoading, data } = useGetPipeline({
    name,
    namespace,
  });
  const path = `/pipelines/details`;

  return (
    <Page
      loading={isLoading}
      path={[
        {
          label: 'Pipelines',
          url: Routes.Pipelines,
        },
        {
          label: name,
        },
      ]}
    >
      <NotificationsWrapper
        errors={mappedErrors(data?.errors || [], namespace)}
      >
        <Flex column gap="16" wide>
          <SubRouterTabs rootPath={`status`}>
            <RouterTab name="Status" path={`status`}>
              <Workloads pipeline={data?.pipeline || ({} as Pipeline)} />
            </RouterTab>
            <RouterTab name="Yaml" path={`yaml`}>
              <YamlView
                yaml={data?.pipeline?.yaml || ''}
                header={createYamlCommand(
                  'Pipeline',
                  data?.pipeline?.name,
                  data?.pipeline?.namespace,
                )}
              />
            </RouterTab>
          </SubRouterTabs>
        </Flex>
      </NotificationsWrapper>
    </Page>
  );
};

export default PipelineDetails;
