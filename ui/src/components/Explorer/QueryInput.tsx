import { FormControl } from '@mui/material';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
//import { Flex, Icon, IconType, Input } from '../../gitops.d';
import Flex from '../../weave/components/Flex';
import Icon, { IconType } from '../../weave/components/Icon';
import Input from '../../weave/components/Input';

import { useReadQueryState, useSetQueryState } from './hooks';

type Props = {
  className?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
};

const debouncedInputHandler = _.debounce((fn, val) => {
  fn(val);
}, 500);

function QueryInput({ className, inputRef }: Props) {
  const queryState = useReadQueryState();
  const setQueryState = useSetQueryState();
  const [textInput, setTextInput] = useState(queryState.terms || '');

  useEffect(() => {
    setTextInput(queryState.terms || '');
  }, [queryState.terms]);

  const handleTextInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTextInput(e.target.value);

    debouncedInputHandler(
      (val: string) => setQueryState({ ...queryState, terms: val }),
      e.target.value,
    );
  };

  return (
    <Flex className={className} wide>
      <Flex align>
        <Icon size="medium" type={IconType.SearchIcon} />
        <FormControl>
          <Input
            id="searchinput"
            placeholder="Search"
            value={textInput}
            inputRef={inputRef}
            onChange={handleTextInput}
          />
        </FormControl>
      </Flex>
    </Flex>
  );
}

export default styled(QueryInput).attrs({ className: QueryInput.name })`
  position: relative;

  svg {
    margin-right: 8px;
  }

  input {
    padding: 8px 10px;
    border-bottom: 1px solid ${(props) => props.theme.colors.neutral40};
  }
`;
