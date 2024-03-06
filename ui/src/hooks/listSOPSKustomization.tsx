import { useContext } from 'react';
import { useQuery } from 'react-query';
import {
  ListSopsKustomizationsRequest,
  ListSopsKustomizationsResponse,
} from '../cluster-services/cluster_services.pb';
import { useEnterpriseClient } from '../contexts/API';
//import { ReactQueryOptions } from '../gitops.d';
import { RequestError } from '../types/custom';
import { ReactQueryOptions } from '../weave/lib/types';

export function useListKustomizationSOPS(
  req: ListSopsKustomizationsRequest,
  opts: ReactQueryOptions<ListSopsKustomizationsResponse, RequestError> = {
    retry: true,
    refetchInterval: 30000,
  },
) {
  const { clustersService } = useEnterpriseClient();
  return useQuery<ListSopsKustomizationsResponse, RequestError>(
    ['list_sops', req.clusterName || ''],
    () => clustersService.ListSopsKustomizations(req),
    opts,
  );
}
