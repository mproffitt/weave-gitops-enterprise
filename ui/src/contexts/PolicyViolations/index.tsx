import { useContext } from 'react';
import { useQuery } from 'react-query';
/*import {
  CoreClientContext,
  GetPolicyRequest,
  GetPolicyResponse,
  GetPolicyValidationRequest,
  GetPolicyValidationResponse,
  ListPoliciesRequest,
  ListPoliciesResponse,
  RequestError,
} from '../../gitops.d';*/
import { formatError } from '../../utils/formatters';
import useNotifications from './../../contexts/Notifications';
import { CoreClientContext, CoreClientContextType } from '../../weave/contexts/CoreClientContext';
import { RequestError } from '../../weave/lib/types';
import {
  ListPoliciesRequest,
  ListPoliciesResponse,
  GetPolicyRequest,
  GetPolicyResponse,
  GetPolicyValidationRequest,
  GetPolicyValidationResponse
} from '../../weave/lib/api/core/core.pb';


export const useCoreClientContext = () => useContext(CoreClientContext);

const LIST_POLICIES_QUERY_KEY = 'list-policy';

export function useListPolicies(req: ListPoliciesRequest) {
  const { api } = useCoreClientContext() as CoreClientContextType;
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
  const { api } = useCoreClientContext() as CoreClientContextType;
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
  const { api } = useCoreClientContext() as CoreClientContextType;

  const { setNotifications } = useNotifications();
  const onError = (error: Error) => setNotifications(formatError(error));

  return useQuery<GetPolicyValidationResponse, RequestError>(
    [GET_POLICY_VIOLATION_QUERY_KEY, req],
    () => api.GetPolicyValidation(req),
    { onError },
  );
}
