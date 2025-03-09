import React from 'react';
import { Container, Spinner } from 'react-bootstrap';

import NoProperties from './No-Properties';
import UserPropertiesContainer from './User-Properties-Container';

import { useAuthContext } from '../../../contexts/Auth-Context';
import { useBasicGetFetch } from '../../../hooks/use-basic-get-fetch';
import { getByOwnerId } from '../../../services/propertiesServices';

export default function UserProperties() {
    const { id } = useAuthContext();
    const {
        data: propertiesDataByOwnerId,
        isDataLoaded: isPropertiesDataByOwnerIdLoaded} = useBasicGetFetch(() => getByOwnerId(id));

    return (
        <>
            <Container className="mt-5">
                {isPropertiesDataByOwnerIdLoaded
                    ? propertiesDataByOwnerId.length === 0
                        ? <NoProperties />
                        : <UserPropertiesContainer propertiesDataByOwnerId={propertiesDataByOwnerId} />
                    : <Spinner />
                }
            </Container>
        </>
    )
};
