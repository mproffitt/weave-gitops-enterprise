import { Field } from '@choclab/weave-gitops/ui/components/DataTable';
import _ from 'lodash';
import { createContext, useContext, useMemo } from 'react';
import { Object } from '../../api/query/query.pb';
import { ExplorerField } from './ExplorerTable';
import { QueryStateManager } from './QueryStateManager';

export type QueryState = {
  terms: string;
  filters: string[];
  limit: number;
  offset: number;
  orderBy: string;
  orderDescending: boolean;
};

export const columnHeaderHandler =
  (queryState: QueryState, setQueryState: (next: QueryState) => void) =>
  (field: Field) => {
    const col = (field as ExplorerField).id;
    setQueryState({
      ...queryState,
      orderBy: col as string,
      orderDescending:
        queryState.orderBy === col ? !queryState.orderDescending : false,
    });
  };

const QueryStateManagerContext = createContext<QueryStateManager>(null as any);

export function QueryStateProvider({
  children,
  manager,
}: {
  children: React.ReactNode;
  manager: QueryStateManager;
}) {
  return (
    <QueryStateManagerContext.Provider value={manager}>
      {children}
    </QueryStateManagerContext.Provider>
  );
}

export function useSetQueryState() {
  const mgr = useContext(QueryStateManagerContext);

  return mgr.write;
}

export function useReadQueryState(): QueryState {
  const mgr = useContext(QueryStateManagerContext);

  return mgr.read();
}

// useGetUnstructuredObjects returns a map of object IDs to the unstructured
// This is memoized so that it doesn't recompute JSON.parse on every render
export function useGetUnstructuredObjects(objects: Object[]) {
  return useMemo(() => {
    return _.reduce(
      objects,
      (acc: any, o) => {
        const obj = o.unstructured && JSON.parse(o.unstructured);
        const o2 = obj?.Object;

        acc[o.id as string] = o2;
        return acc;
      },
      {},
    );
  }, [objects]);
}
