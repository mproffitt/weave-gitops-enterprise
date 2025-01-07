import React from 'react';
import { useMutation } from 'react-query';
import {
  ApprovePromotionRequest,
  ApprovePromotionResponse,
  Pipelines,
} from '../api/pipelines/pipelines.pb';
import useNotifications from '../contexts/Notifications';
//import { Link, RequestError } from '../gitops.d';
import { RequestError } from '../types/custom';
import { formatError } from '../utils/formatters';
import Link from '../weave/components/Link';
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
