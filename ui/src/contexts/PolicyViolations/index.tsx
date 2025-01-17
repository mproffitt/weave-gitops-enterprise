import { CoreClientContext } from '@choclab/weave-gitops';
import {
  GetPolicyRequest,
  GetPolicyResponse,
  GetPolicyValidationRequest,
  GetPolicyValidationResponse,
  ListPoliciesRequest,
  ListPoliciesResponse,
} from '@choclab/weave-gitops/ui/lib/api/core/core.pb';
import { RequestError } from '@choclab/weave-gitops/ui/lib/types';
import { useContext } from 'react';
import { useQuery } from 'react-query';
import { formatError } from '../../utils/formatters';
import useNotifications from './../../contexts/Notifications';


export const useCoreClientContext = () => useContext(CoreClientContext);

const LIST_POLICIES_QUERY_KEY = 'list-policy';

export function useListPolicies(req: ListPoliciesRequest) {
  const { api } = useCoreClientContext();
  const { setNotifications } = useNotifications();
  const onError = (error: Error) => setNotifications(formatError(error));

  return useQuery<ListPoliciesResponse, Error>(
    [LIST_POLICIES_QUERY_KEY, req],
    () => api.ListPolicies(req),
    { onError },
  );
}
const GET_POLICY_QUERY_KEY = 'get-policy-details';

export function useGetPolicyDetails(req: GetPolicyRequest) {
  const { api } = useCoreClientContext();
  const { setNotifications } = useNotifications();
  const onError = (error: Error) => setNotifications(formatError(error));

  return useQuery<GetPolicyResponse, RequestError>(
    [GET_POLICY_QUERY_KEY, req],
    () => api.GetPolicy(req),
    { onError },
  );
}

const GET_POLICY_VIOLATION_QUERY_KEY = 'get-policy-violation-details';

export function useGetPolicyValidationDetails(req: GetPolicyValidationRequest) {
  const { api } = useCoreClientContext();

  const { setNotifications } = useNotifications();
  const onError = (error: Error) => setNotifications(formatError(error));

  return useQuery<GetPolicyValidationResponse, RequestError>(
    [GET_POLICY_VIOLATION_QUERY_KEY, req],
    () => api.GetPolicyValidation(req),
    { onError },
  );
}
