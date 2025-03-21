import React from 'react';
import { Container } from 'react-bootstrap';

import { usePropertyContext } from '../../../contexts/Property-Context';
import { useAuthContext } from '../../../contexts/Auth-Context';

import PropertyDetailsImages from './Property-Details-Images';
import UserActions from '../../user-actions/User-Actions';
import PropertyDetails from './Property-Details';
import WheelchairTireSpinner from '../../loaders/Wheelcheir-Tire-Spinner';

export default function PropertyDetailsContainer() {
    const { propertyData, propertyFacilities, isPropertyDataLoaded } = usePropertyContext();
    const { id } = useAuthContext();

    return (
        <>
            <Container className="mt-5">
                {isPropertyDataLoaded
                    ? <>
                        {propertyData.imageUrls && <PropertyDetailsImages imageUrls={propertyData.imageUrls} />}

                        {(id === propertyData._ownerId) && <UserActions _id={propertyData._id} name={propertyData.name} />}

                        <PropertyDetails {...propertyData} facilities={propertyFacilities} />
                    </>
                    : <WheelchairTireSpinner />
                }

            </Container>
        </>
    )
};
