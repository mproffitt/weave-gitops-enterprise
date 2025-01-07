import { MenuItem } from '@mui/material';
import React from 'react';
//import { Flex, RequestStateHandler, RequestError, Text } from '../../../gitops.d';
import { useListCluster } from '../../../hooks/clusters';
import { Select } from '../../../utils/form';
import Flex from '../../../weave/components/Flex';
import RequestStateHandler from '../../../weave/components/RequestStateHandler';
import Text from '../../../weave/components/Text';
import { RequestError } from '../../../weave/lib/types';

const ListClusters = ({
  value,
  validateForm,
  handleFormData,
}: {
  value: string;
  validateForm: boolean;
  handleFormData: (value: any) => void;
}) => {
  const { isLoading, data, error } = useListCluster();
  return (
    <RequestStateHandler loading={isLoading} error={error as RequestError}>
      <Select
        name="clusterName"
        required={true}
        label="CLUSTER"
        onChange={(event: { target: { value: any; }; }) => handleFormData(event.target.value)}
        value={value}
        error={validateForm && !value}
      >
        {data?.gitopsClusters
          ?.filter(e =>
            e.conditions?.find(c => c.status === 'True' && c.type === 'Ready'),
          )
          .map((option, index: number) => {
            return (
              <MenuItem
                key={index}
                value={
                  option.namespace
                    ? `${option.namespace}/${option.name}`
                    : option.name
                }
              >
                <Flex column>
                  <Text>{option.name}</Text>
                  <Text color="neutral30" size="small">
                    {option.namespace ? `ns: ${option.namespace}` : '-'}
                  </Text>
                </Flex>
              </MenuItem>
            );
          })}
      </Select>
    </RequestStateHandler>
  );
};

export default ListClusters;
