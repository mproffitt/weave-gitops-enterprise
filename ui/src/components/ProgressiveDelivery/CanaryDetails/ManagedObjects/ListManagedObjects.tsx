import { Alert } from '@mui/material';
import React from 'react';
import { useListFlaggerObjects, CanaryParams } from '../../../../contexts/ProgressiveDelivery';
//import { AlertListErrors, LoadingPage } from '../../../../gitops.d';
import { AlertListErrors } from '../../../../weave/components/AlertListErrors';
import LoadingPage from '../../../../weave/components/LoadingPage';

import { ManagedObjectsTable } from './ManagedObjectsTable';

type Props = CanaryParams;

const ListManagedObjects = (props: Props) => {
    const { error, data, isLoading } = useListFlaggerObjects(props);

    return (
        <>
            <AlertListErrors errors={data?.errors}/>
            {isLoading && <LoadingPage />}
            {error && <Alert severity="error">{error.message}</Alert>}
            {data?.objects &&
                    <ManagedObjectsTable objects={data.objects} />
            }
        </>
    );
};

export default ListManagedObjects;
