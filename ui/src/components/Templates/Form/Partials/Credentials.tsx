import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import React, { FC, useCallback, Dispatch, ChangeEvent, useMemo } from 'react';
import { styled } from 'styled-components';
//import { Flex } from '../../../../gitops.d';
import Flex from '../../../../weave/components/Flex';
import { useListCredentials } from '../../../../hooks/credentials';
import { Credential } from '../../../../types/custom';

const Credentials: FC<{
  infraCredential: Credential | null;
  setInfraCredential: Dispatch<React.SetStateAction<Credential | null>>;
}> = ({ infraCredential, setInfraCredential }) => {
  const { data, isLoading } = useListCredentials();
  const credentials = useMemo(
    () => data?.credentials || [],
    [data?.credentials],
  );

  const credentialsItems = [
    ...credentials.map((credential: Credential) => {
      const { kind, namespace, name } = credential;
      return (
        <MenuItem key={name} value={name || ''}>
          {`${kind}/${namespace || 'default'}/${name}`}
        </MenuItem>
      );
    }),
    <MenuItem key="None" value="None">
      <em>None</em>
    </MenuItem>,
  ];

  const handleSelectCredentials = useCallback(
    (event: ChangeEvent<{ name?: string | undefined; value: unknown }>) => {
      const credential =
        credentials?.find(
          credential => credential.name === event.target.value,
        ) || null;

      setInfraCredential(credential);
    },
    [credentials, setInfraCredential],
  );

  return (
    <Flex align className="credentials">
      <strong style={{textAlign: "right", marginRight: "15px"}}>Infrastructure provider credentials</strong>
      <FormControl>
        <Select
          style={{ width: '200px' }}
          disabled={isLoading}
          value={infraCredential?.name || 'None'}
          onChange={(event: SelectChangeEvent<string>) => handleSelectCredentials(
            event as ChangeEvent<{ name?: string | undefined; value: unknown }>
          )}
          label="Credentials"
          variant="standard"
        >
          {credentialsItems}
        </Select>
      </FormControl>
    </Flex>
  );
};

export default styled(Credentials)``;
