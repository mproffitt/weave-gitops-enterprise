import { Button } from '@choclab/weave-gitops';
import { Dispatch, useCallback, useState } from 'react';
import {
  ClusterAutomation,
  RenderAutomationResponse,
} from '../../../cluster-services/cluster_services.pb';
import { useEnterpriseClient } from '../../../contexts/API';
import useNotifications from '../../../contexts/Notifications';
import { validateFormData } from '../../../utils/form';
import PreviewModal from '../../Templates/Form/Partials/PreviewModal';

export const Preview = ({
  clusterAutomations,
  setFormError,
  sourceType,
}: {
  clusterAutomations: ClusterAutomation[];
  setFormError: Dispatch<React.SetStateAction<string>>;
  sourceType: string;
}) => {
  const [openPreview, setOpenPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [prPreview, setPRPreview] = useState<RenderAutomationResponse | null>(
    null,
  );
  const { setNotifications } = useNotifications();
  const { clustersService } = useEnterpriseClient();

  const handlePRPreview = useCallback(() => {
    setPreviewLoading(true);
    return clustersService
      .RenderAutomation({
        clusterAutomations,
      })
      .then(data => {
        setOpenPreview(true);
        setPRPreview(data);
      })
      .catch(err =>
        setNotifications([
          {
            message: { text: err.message },
            severity: 'error',
            display: 'bottom',
          },
        ]),
      )
      .finally(() => setPreviewLoading(false));
  }, [clustersService, setOpenPreview, clusterAutomations, setNotifications]);

  return (
    <>
      <Button
        onClick={event =>
          validateFormData(event, handlePRPreview, setFormError)
        }
        disabled={previewLoading}
        loading={previewLoading}
      >
        PREVIEW PR
      </Button>
      {!previewLoading && openPreview && prPreview ? (
        <PreviewModal
          context="app"
          openPreview={openPreview}
          setOpenPreview={setOpenPreview}
          prPreview={prPreview}
          sourceType={sourceType}
        />
      ) : null}
    </>
  );
};
