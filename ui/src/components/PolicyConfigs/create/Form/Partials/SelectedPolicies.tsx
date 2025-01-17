import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
} from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { Flex, Icon, IconType, Text } from '@choclab/weave-gitops';
import {
  PolicyObj,
  PolicyParam,
} from '@choclab/weave-gitops/ui/lib/api/core/core.pb';
import { Dispatch, useState } from 'react';
import { useListPolicies } from '../../../../../contexts/PolicyViolations';
import { Input } from '../../../../../utils/form';
import { ErrorIcon } from '../../../../RemoteSVGIcon';
import {
  ErrorSection,
  PolicyDetailsCardWrapper,
  RemoveIcon,
} from '../../../PolicyConfigStyles';

interface SelectSecretStoreProps {
  cluster: string;
  formData: any;
  setFormData: Dispatch<React.SetStateAction<any>>;
  formError: string;
}

export const SelectedPolicies = ({
  cluster,
  formData,
  setFormData,
  formError,
}: SelectSecretStoreProps) => {
  const { data } = useListPolicies({});

  const policiesList = data?.policies || [];
  const keys = Object.keys(formData.policies);
  const selected: PolicyObj[] =
    policiesList.filter(({ id }) => id && keys.includes(id)) || [];

  const [selectedPolicies, setSelectedPolicies] =
    useState<PolicyObj[]>(selected);

  const handlePolicyParams = (val: any, id: string, param: PolicyParam) => {
    const { name, type } = param;
    const defaultValue =
      type === 'array' ? param.value?.value.join(', ') : param.value?.value;
    const value = type === 'integer' ? parseInt(val) || '0' : val;
    const areSameValues =
      type === 'array'
        ? JSON.stringify(
            value.split(/[\s,]+/).filter((i: string) => i !== ''),
          ) === JSON.stringify(defaultValue?.split(/[\s,]+/))
        : value === defaultValue;

    if (
      areSameValues ||
      (value === '' && defaultValue === (null || undefined))
    ) {
      const policyConfigs = formData.policies;
      delete policyConfigs[id].parameters[name as string];
      if (Object.keys(policyConfigs[id]?.parameters).length === 0)
        delete policyConfigs[id];
    } else {
      formData.policies = {
        ...formData.policies,
        [id as string]: {
          parameters: {
            ...formData.policies[id]?.parameters,
            [name as string]:
              type === 'array'
                ? value.split(/[\s,]+/).filter((i: string) => i !== ' ')
                : value,
          },
        },
      };
    }

    setFormData({
      ...formData,
      policies: formData.policies,
    });
  };
  const handleDeletePolicyParam = (id: string) => {
    const item = formData.policies || {};
    if (Object.keys(item).length !== 0) delete item[id];

    const updateSelected = selectedPolicies?.filter(p => p.id !== id);
    setSelectedPolicies(updateSelected);
  };
  const getValue = (id: string, param: PolicyParam) => {
    const isModified = formData.policies[id!]?.parameters[param.name!]
      ? true
      : false;
    const { type, name, value } = param;
    if (isModified) {
      switch (type) {
        case 'array':
          return formData.policies[id!].parameters[name!].join(', ');
        case 'integer':
          return parseInt(formData.policies[id!].parameters[name!]);
        default:
          return formData.policies[id!].parameters[name!].toString();
      }
    } else {
      switch (type) {
        case 'array':
          return value?.value.join(', ');
        case 'integer':
          return parseInt(value?.value);
        default:
          return value?.value.toString();
      }
    }
  };

  const PoliciesInput = () => (
    <Autocomplete
      multiple
      id="grouped-demo"
      value={selectedPolicies}
      options={policiesList?.sort((a, b) =>
        b.category!.localeCompare(a.category!),
      )}
      groupBy={option => option.category || ''}
      onChange={(e, policy) => setSelectedPolicies(policy)}
      noOptionsText="No Policies found on that cluster."
      getOptionLabel={option => option.name || ''}
      filterSelectedOptions
      renderInput={params => (
        <>
          <Text uppercase color="neutral30" style={{ marginBottom: '12px' }}>
            Select the policies to include in this policy config
          </Text>
          <TextField
            className="policies-input"
            {...params}
            variant="outlined"
            name="policies"
            disabled={cluster === undefined}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <Icon type={IconType.SearchIcon} size="medium" color="black" />
              ),
            }}
          />
        </>
      )}
    />
  );

  const getParameterField = (param: PolicyParam, id: string) => {
    const { type, name } = param;
    switch (type) {
      case 'boolean':
        return (
          <FormControl>
            <FormLabel id="demo-row-radio-buttons-group-label">
              {name}
            </FormLabel>
            <RadioGroup
              row
              aria-labelledby="demo-row-radio-buttons-group-label"
              name="row-radio-buttons-group"
              value={getValue(id!, param)}
              onChange={event => {
                handlePolicyParams(
                  event.target.value === 'true' ? true : false,
                  id!,
                  param,
                );
              }}
            >
              {formData.policies[id!]?.parameters[param.name!] && (
                <span className="modified">Modified</span>
              )}
              <FormControlLabel
                value={'true'}
                control={<Radio />}
                label="True"
              />
              <FormControlLabel
                value={'false'}
                control={<Radio />}
                label="False"
              />
            </RadioGroup>
          </FormControl>
        );
      default:
        return (
          <Flex wide wrap>
            {formData.policies[id!]?.parameters[name!] && (
              <span className="modified">Modified</span>
            )}
            <Input
              type={type === 'integer' ? 'number' : 'text'}
              name={name}
              label={name}
              defaultValue={getValue(id!, param)}
              onChange={event => {
                handlePolicyParams(event.target.value, id!, param);
              }}
            />
          </Flex>
        );
    }
  };

  return (
    <>
      <Flex wide column gap="16" className="form-field policyField">
        <Text capitalize semiBold size="large">
          Policies <span>({selectedPolicies?.length || 0})</span>
        </Text>
        <PoliciesInput />
      </Flex>
      {formError === 'policies' &&
        JSON.stringify(formData.policies) === '{}' && (
          <ErrorSection>
            <ErrorIcon />
            <Text color="black">
              Please add at least one policy with modified parameter
            </Text>
          </ErrorSection>
        )}

      <PolicyDetailsCardWrapper>
        {selectedPolicies?.map(policy => (
          <li key={policy.id}>
            <Card>
              <CardContent>
                <Flex align between gap="8">
                  <Text>{policy.name}</Text>
                  <RemoveIcon
                    onClick={() => handleDeletePolicyParam(policy.id!)}
                  />
                </Flex>
                <label className="cardLbl">Parameters</label>
                {policy?.parameters?.map(param => (
                  <div
                    className="parameterItem"
                    key={`${param.name}${policy.id}`}
                  >
                    <Text uppercase className="parameterItemValue">
                      {getParameterField(param, policy.id!)}
                    </Text>
                  </div>
                ))}
              </CardContent>
            </Card>
          </li>
        ))}
      </PolicyDetailsCardWrapper>
    </>
  );
};
