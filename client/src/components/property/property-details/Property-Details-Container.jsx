import React from 'react';
import { Container } from 'react-bootstrap';

import { usePropertyContext } from '../../../contexts/Property-Context';

import PropertyDetailsImages from './Property-Details-Images';
import PropertyDetails from './Property-Details';

export default function PropertyDetailsContainer() {
    const { propertyData, propertyFacilities } = usePropertyContext();

    return (
        <>
            <Container className="mt-5">
                {propertyData.imageUrls && <PropertyDetailsImages imageUrls={propertyData.imageUrls} />}

                <PropertyDetails {...propertyData} facilities={propertyFacilities} />
            </Container>
        </>
    )
};
