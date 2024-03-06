import { useContext } from "react";
import { useQuery } from "react-query";
import { CoreClientContext, CoreClientContextType } from "../contexts/CoreClientContext";
import { ListError } from "../lib/api/core/core.pb";
import { Kind } from "../lib/api/core/types.pb";
import { Alert, Provider } from "../lib/objects";
import { NoNamespace, ReactQueryOptions, RequestError } from "../lib/types";
import { convertResponse } from "./objects";

type Res = { objects: Provider[]; errors: ListError[] };
type AlertsRes = { objects: Alert[]; errors: ListError[] };

export function useListProviders(
  namespace: string = NoNamespace,
  opts: ReactQueryOptions<Res, RequestError> = {
    retry: false,
    refetchInterval: 5000,
  }
) {
  const { api } = useContext(CoreClientContext) as CoreClientContextType

  return useQuery<Res, RequestError>(
    ["providers", namespace],
    async () => {
      const res = await api.ListObjects({ namespace, kind: Kind.Provider });
      const providers = res.objects?.map(
        (obj) => convertResponse(Kind.Provider, obj) as Provider
      ) ?? [];
      return { objects: providers, errors: res.errors ?? [] };
    },
    opts
  );
}

export function useListAlerts(
  name = "",
  namespace: string = NoNamespace,
  opts: ReactQueryOptions<AlertsRes, RequestError> = {
    retry: false,
    refetchInterval: 5000,
  }
) {
  const { api } = useContext(CoreClientContext) as CoreClientContextType;
  return useQuery<AlertsRes, RequestError>(
    ["alerts", namespace],
    async () => {
      const res = await api.ListObjects({ namespace, kind: Kind.Alert });
      const alerts = res.objects?.map(
        (obj) => convertResponse(Kind.Alert, obj) as Alert
      );
      const matches = alerts?.filter((alert) => alert.providerRef === name) ?? [];
      return { objects: matches, errors: res.errors ?? [] };
    },
    opts
  );
}
