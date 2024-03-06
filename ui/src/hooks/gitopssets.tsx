import { useContext } from 'react';
import { QueryClient, useQuery, useQueryClient } from 'react-query';
import useNotifications from '../contexts/Notifications';
/*import {
  CoreClientContext,
  ListError,
  RequestError,
  FluxObject,
} from '../gitops.d';*/

import { CoreClientContext, CoreClientContextType } from '../weave/contexts/CoreClientContext';
import { Object } from '../weave/lib/api/core/types.pb';
import { ListError } from '../weave/lib/api/core/core.pb';
import { RequestError } from '../weave/lib/types';
import { FluxObject } from '../weave/lib/objects';

const GITOPSSETS_KEY = 'gitopssets';
const GITOPSSETS_POLL_INTERVAL = 5000;

type Res = { objects: FluxObject[]; errors: ListError[] };

export function useListGitOpsSets(
  opts: { enabled: boolean } = {
    enabled: true,
  },
) {
  const { setNotifications } = useNotifications();
  const { api } = useContext(CoreClientContext) as CoreClientContextType;

  const onError = (error: Error) =>
    setNotifications([{ message: { text: error.message }, severity: 'error' }]);

  return useQuery<Res, Error>(
    [GITOPSSETS_KEY],
    async () => {
      const res = await api.ListObjects({ kind: 'GitOpsSet' });
      let objects: FluxObject[] = [];
      if (res.objects) {
        objects = res.objects.map((obj: Object) => new FluxObject(obj));
      }
      return { objects, errors: res.errors || [] };
    },
    {
      keepPreviousData: true,
      refetchInterval: GITOPSSETS_POLL_INTERVAL,
      onError,
      ...opts,
    },
  );
}

interface DetailParams {
  name: string;
  namespace: string;
  clusterName: string;
}

export function useGetGitOpsSet({
  name,
  namespace,
  clusterName,
}: DetailParams) {
  const { setNotifications } = useNotifications();
  const { api } = useContext(CoreClientContext) as CoreClientContextType;
  const onError = (error: Error) =>
    setNotifications([{ message: { text: error.message }, severity: 'error' }]);

  return useQuery<FluxObject, RequestError>(
    [GITOPSSETS_KEY, clusterName, namespace, name],
    async () => {
      const res = await api.GetObject({
        name,
        namespace,
        clusterName,
        kind: 'GitOpsSet',
      });
      return new FluxObject(res.object!);
    },
    {
      onError,
    },
  );
}

interface DetailParams {
  name: string;
  namespace: string;
  clusterName: string;
}

function invalidate(
  qc: QueryClient,
  { name, namespace, clusterName }: DetailParams,
) {
  return qc.invalidateQueries([GITOPSSETS_KEY, clusterName, namespace, name]);
}

export function useSyncGitOpsSet(params: DetailParams) {
  const qc = useQueryClient();
  const { api } = useContext(CoreClientContext) as CoreClientContextType;

  return () =>
    api
      .SyncFluxObject({ objects: [{ kind: 'GitOpsSet', ...params }] })
      .then(res => {
        invalidate(qc, params);
        return res;
      });
}

export function useToggleSuspendGitOpsSet(params: DetailParams) {
  const qc = useQueryClient();
  const { api } = useContext(CoreClientContext) as CoreClientContextType;

  return (suspend: boolean) =>
    api
      .ToggleSuspendResource({
        objects: [{ kind: 'GitOpsSet', ...params }],
        suspend,
      })
      .then(res => {
        return invalidate(qc, params).then(() => res);
      });
}
