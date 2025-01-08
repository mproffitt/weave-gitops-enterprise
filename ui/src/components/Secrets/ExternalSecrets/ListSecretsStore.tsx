import { MenuItem } from '@mui/material';
import React from 'react';
import { useListExternalSecretStores } from '../../../contexts/Secrets';
//import { RequestStateHandler } from '../../../gitops.d';
import { RequestError } from '../../../types/custom';
import { Select } from '../../../utils/form';
import RequestStateHandler from '../../../weave/components/RequestStateHandler';

const ListSecretsStore = ({
  value,
  validateForm,
  handleFormData,
  clusterName,
}: {
  value: string;
  validateForm: boolean;
  handleFormData: (value: any) => void;
  clusterName: string;
}) => {
  const { data, isLoading, error } = useListExternalSecretStores({
    clusterName,
  });
  return (
    <RequestStateHandler loading={isLoading} error={error as RequestError}>
      <Select
        required
        name="secretStoreRef"
        label="SECRET STORE"
        onChange={(event: { target: { value: any; }; }) => handleFormData(event.target.value)}
        value={value}
        error={validateForm && !value}
      >
        {data?.stores?.length ? (
          data?.stores?.map((s, index: number) => {
            return (
              <MenuItem
                key={index}
                value={`${s.name}/${s.kind}/${s.namespace}/${s.type}`}
              >
                {s.name}
              </MenuItem>
            );
          })
        ) : (
          <MenuItem value="" disabled={true}>
            No SecretStore found in {clusterName}
          </MenuItem>
        )}
      </Select>
    </RequestStateHandler>
  );
};

export default ListSecretsStore;
