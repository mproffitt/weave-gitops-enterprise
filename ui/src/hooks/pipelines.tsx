import { Link } from '@choclab/weave-gitops';
import { RequestError } from '@choclab/weave-gitops/ui/lib/types';
import { useMutation } from 'react-query';
import {
  ApprovePromotionRequest,
  ApprovePromotionResponse,
  Pipelines,
} from '../api/pipelines/pipelines.pb';
import useNotifications from '../contexts/Notifications';
import { formatError } from '../utils/formatters';
export const useApprove = () => {
  const { setNotifications } = useNotifications();
  const mutation = useMutation<
    ApprovePromotionResponse,
    RequestError,
    ApprovePromotionRequest
  >('approve', req => Pipelines.ApprovePromotion(req), {
    //pending backend changes, show PR through notifications in order to not remove functionality
    onError: error => {
      setNotifications(formatError(error));
    },
    onSuccess: data => {
      setNotifications([
        {
          message: {
            component: (
              <Link href={data.pullRequestUrl} newTab>
                {data.pullRequestUrl ? 'Click to view PR' : 'No PR to Approve'}
              </Link>
            ),
          },
          severity: 'success',
        },
      ]);
    },
  });
  return mutation;
};
