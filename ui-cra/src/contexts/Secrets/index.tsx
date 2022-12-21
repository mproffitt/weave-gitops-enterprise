import { useContext } from 'react';
import { useQuery } from 'react-query';
import {
  GetExternalSecretRequest,
  GetExternalSecretResponse,
  ListExternalSecretsRequest,
  ListExternalSecretsResponse,
} from '../../cluster-services/cluster_services.pb';
import { formatError } from '../../utils/formatters';
import { EnterpriseClientContext } from '../EnterpriseClient';
import useNotifications from './../../contexts/Notifications';

const LIST_ALL_SECRETS_QUERY_KEY = 'secrets-list';

export function useListSecrets(req: ListExternalSecretsRequest) {
  const { api } = useContext(EnterpriseClientContext);
  const { setNotifications } = useNotifications();
  const onError = (error: Error) => setNotifications(formatError(error));
  
  return useQuery<ListExternalSecretsResponse, Error>(
    [LIST_ALL_SECRETS_QUERY_KEY, req],
    () => api.ListExternalSecrets(req),
    { onError },
  );
}

const GET_SECRET_QUERY_KEY = 'secret-details';

export function useGetSecretDetails(req: GetExternalSecretRequest) {
  const { api } = useContext(EnterpriseClientContext);
  const { setNotifications } = useNotifications();
  const onError = (error: Error) => setNotifications(formatError(error));
  return useQuery<GetExternalSecretResponse, Error>(
    [GET_SECRET_QUERY_KEY, req],
    () => api.GetExternalSecret(req),
    { onError },
  );
}
