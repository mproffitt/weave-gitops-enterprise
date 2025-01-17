import { ReactQueryOptions } from '@choclab/weave-gitops/ui/lib/types';
import { useContext } from 'react';
import { useQuery } from 'react-query';
import {
  ListSopsKustomizationsRequest,
  ListSopsKustomizationsResponse,
} from '../cluster-services/cluster_services.pb';
import { useEnterpriseClient } from '../contexts/API';
import { RequestError } from '../types/custom';

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
