// @ts-ignore
import { Alert, CircularProgress } from '@mui/material';
import _ from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Facet } from '../../api/query/query.pb';
//import { Flex, Icon, IconType, ThemeTypes } from '../../gitops.d';
import Flex from '../../weave/components/Flex';
import Icon, { IconType } from '../../weave/components/Icon';
import { ThemeTypes } from '../../weave/contexts/AppContext';
import { useListFacets, useQueryService } from '../../hooks/query';
import { IconButton } from '../../weave/components/Button';
import ExplorerTable, {
  ExplorerField,
  defaultExplorerFields,
} from './ExplorerTable';
import FilterDrawer from './FilterDrawer';
import Filters from './Filters';
import {
  columnHeaderHandler,
  QueryStateProvider,
  useGetUnstructuredObjects,
} from './hooks';
import PaginationControls from './PaginationControls';
import QueryInput from './QueryInput';
import QueryStateChips from './QueryStateChips';
import { QueryStateManager, URLQueryStateManager } from './QueryStateManager';

type Props = {
  className?: string;
  category?:
    | 'automation'
    | 'source'
    | 'gitopsset'
    | 'template'
    | 'clusterdiscovery';
  enableBatchSync?: boolean;
  manager?: QueryStateManager;
  fields?: ExplorerField[];
};

function Explorer({
  className,
  category,
  enableBatchSync,
  manager,
  fields,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const search = location.search;
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { data: facetsRes } = useListFacets(category);

  if (!manager) {
    manager = new URLQueryStateManager(navigate, location);
  }

  const queryState = manager.read(search);
  const setQueryState = manager.write;
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, error, isLoading, isRefetching, isPreviousData } =
    useQueryService({
      terms: queryState.terms,
      filters: queryState.filters,
      limit: queryState.limit,
      offset: queryState.offset,
      orderBy: queryState.orderBy,
      descending: queryState.orderDescending || false,
      category,
    });

  // This will be true when the query has changed, but the data hasn't been fetched yet.
  // Allows us to animate the table while the query is being worked on.
  // It will be false on background fetches that happen at a regular interval (without user interaction).
  const isRespondingToQuery = isRefetching && isPreviousData;

  const unst = useGetUnstructuredObjects(data?.objects || []);
  const rows = _.map(data?.objects, (o: any) => ({
    ...o,
    parsed: unst[o.id],
  }));

  const filteredFacets = filterFacetsForCategory(facetsRes?.facets, category);

  // Set up the effect for the filter drawer
  useEffect(() => {
    if (!inputRef.current) {
      return;
    }
    // Focus the input so you can click open and start typing
    if (filterDrawerOpen) {
      // Delay the focus so that the drawer animation makes sense.
      // Without the delay, the animation will stutter
      // due to something in material-ui expanding the width.
      setTimeout(() => {
        inputRef.current?.focus();
      }, 500);
    } else {
      inputRef.current.blur();
    }
  }, [filterDrawerOpen]);

  const tableFields: ExplorerField[] = (fields || defaultExplorerFields).map(
    field => ({
      ...field,
      defaultSort: queryState.orderBy ? (queryState.orderBy === field.id) : field.defaultSort,
    }),
  );

  if (isLoading) {
    return (
      // Set min-width here to fix a weird stuttering issue where the spinner had
      // inconsistent width while spinning.
      <Flex wide center style={{ minWidth: '100%' }}>
        <CircularProgress />
      </Flex>
    );
  }

  return (
    <QueryStateProvider manager={manager}>
      <div className={className}>
        <Flex align wide>
          <div style={{ marginLeft: '0 auto', width: 80 }}>
            <CircularProgress
              size={24}
              style={{ display: isRespondingToQuery ? 'block' : 'none' }}
            />
          </div>
          <Flex align wide end>
            <QueryStateChips />
            <IconButton
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              size="large"
              variant={filterDrawerOpen ? 'contained' : 'text'}
              color="inherit"
            >
              <Icon
                size="medium"
                type={IconType.FilterIcon}
                color="neutral30"
              />
            </IconButton>
          </Flex>
        </Flex>
        <Flex wide>
          <ExplorerTableWithBusyAnimation
            fields={tableFields}
            busy={isRespondingToQuery}
            queryState={queryState}
            rows={rows}
            onColumnHeaderClick={columnHeaderHandler(queryState, setQueryState)}
            enableBatchSync={enableBatchSync}
          />

          <FilterDrawer
            onClose={() => setFilterDrawerOpen(false)}
            open={filterDrawerOpen}
          >
            <QueryInput inputRef={inputRef} />

            <Filters
              facets={filteredFacets || []}
              humanReadableLabels={facetsRes?.humanReadableLabels}
            />
          </FilterDrawer>
        </Flex>

        <PaginationControls
          queryState={queryState}
          setQueryState={setQueryState}
          count={data?.objects?.length || 0}
        />
      </div>
    </QueryStateProvider>
  );
}

export default styled(Explorer).attrs({ className: Explorer.name })`
  width: 100%;
  //override so filter dialog button stays highlighted, but color is too bright in dark mode
  .MuiButton-contained {
    ${(props) =>
      props.theme.mode === ThemeTypes.Dark
        ? `background-color: ${props.theme.colors.neutral10};`
        : null}
  }
  .MuiButton-text {
    &:hover {
      background-color: ${(props) => props.theme.colors.neutral10};
    }
  }
  `;

// Gray out the table while we are responding to a query. This is a visual indication to the user the explorer is "thinking".
// This will animate on query changes (including ordering), but not on refretches.
const ExplorerTableWithBusyAnimation = styled(ExplorerTable)<{ busy: boolean }>`
  table tbody {
    opacity: ${(props) => (props.busy ? '0.5' : '1')};
  }
`;

const categoryKinds = {
  automation: ['Kustomization', 'HelmRelease'],
  source: [
    'GitRepository',
    'HelmRepository',
    'Bucket',
    'HelmChart',
    'OCIRepository',
  ],
  gitopsset: ['GitOpsSet'],
  template: ['Template'],
  clusterdiscovery: ['AutomatedClusterDiscovery'],
};

function filterFacetsForCategory(
  facets?: Facet[],
  category?:
    | 'automation'
    | 'source'
    | 'gitopsset'
    | 'template'
    | 'clusterdiscovery',
): Facet[] {
  if (!category) {
    return _.sortBy(facets, 'field') as Facet[];
  }

  const withoutKind = _.filter(facets, facet => {
    return facet.field?.toLowerCase() !== 'kind';
  });

  const kindFacets = _.map(categoryKinds[category], k => k);

  withoutKind.unshift({
    field: 'kind',
    values: kindFacets,
  });

  return _.sortBy(withoutKind, 'field');
}
