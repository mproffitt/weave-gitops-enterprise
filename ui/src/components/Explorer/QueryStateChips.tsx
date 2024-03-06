import React from 'react';
import styled from 'styled-components';
//import { ChipGroup } from '../../gitops.d';
import ChipGroup from '../../weave/components/ChipGroup';

import { useReadQueryState, useSetQueryState } from './hooks';

type Props = {
  className?: string;
};

function QueryStateChips({ className }: Props) {
  const queryState = useReadQueryState();
  const setQueryState = useSetQueryState();

  const chips = [...queryState.filters];

  if (queryState.terms) {
    chips.push(`terms:${queryState.terms}`);
  }

  const handleClearAll = () => {
    setQueryState({
      ...queryState,
      filters: [],
      terms: '',
      offset: 0,
    });
  };

  const handleChipRemove = (chips: string[]) => {
    for (const chip of chips) {
      if (chip.includes('terms:')) {
        setQueryState({
          ...queryState,
          terms: '',
        });
        return;
      }
      setQueryState({
        ...queryState,
        filters: queryState.filters.filter(c => c !== chip),
      });
    }
  };

  return (
    chips.length > 0 && <div className={className}>
      <ChipGroup
        chips={chips}
        onChipRemove={handleChipRemove}
        onClearAll={handleClearAll}
      />
    </div>
  );
}

export default styled(QueryStateChips).attrs({
  className: QueryStateChips.name,
})``;
