import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from 'react-bootstrap';

import { useBasicGetFetch } from '../../../hooks/use-basic-get-fetch';
import { getAll, getFacilities, getPropertyTypes } from '../../../services/propertiesServices';
import { useAuthContext } from '../../../contexts/Auth-Context';

import FiltersContainer from '../filters/Filters-Container';
import PropertyShortListView from './Property-Short-List-View';
import WheelchairTireSpinner from '../../loaders/Wheelcheir-Tire-Spinner';

import styles from './All-Properties.module.css';

export default function AllProperties() {
    const [filters, setFilters] = useState({
        propertyTypeIds: [],
        facilityIds: [],
        accessibilityIds: [],
    });
    
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const { id } = useAuthContext();

    const searchParamsEntries = Object.fromEntries(searchParams);

    const {
        data: propertiesData,
        isDataLoaded: isPropertiesDataLoaded } = useBasicGetFetch(() => getAll({...filters}), [], [filters]);

    const {
        data: propertyTypes,
        isDataLoaded: isPropertyTypesLoaded } = useBasicGetFetch(() => getPropertyTypes());

    const {
        data: facilities,
        isDataLoaded: areFacilitiesLoaded } = useBasicGetFetch(() => getFacilities());

    useEffect(() => {
        setFilters(previousFilters => Object.keys(previousFilters)
            .reduce((updatedFilters, k) => {
                updatedFilters[k] = searchParamsEntries[k]?.split(",") || [];
                return updatedFilters;
            }, {...previousFilters})
        );
    }, [searchParams]);

    useEffect(() => {
        const searchParams = Object.entries(filters)
            .filter(([k, v]) => v.length > 0)
            .map(([k, v]) => `${k}=${v.join(",")}`)
            .join("&");

        navigate(`/properties?${searchParams}`, { replace: true });
    }, [filters]);

    const setFiltersHandler = (name, id) => setFilters(previousFilters => ({
        ...previousFilters,
        [name]: previousFilters[name].includes(id)
            ? previousFilters[name].filter(pfId => pfId !== id)
            : [...previousFilters[name], id]
    }));

    return (
        <Container className="mt-5 d-flex">
            <FiltersContainer
                propertyTypes={propertyTypes}
                facilities={facilities}
                filters={filters}
                filtersHandler={setFiltersHandler}
            />

            <div className={styles["properties-container"]}>
                <div className={styles["found"]}>
                    <span>Found suitable properties: {propertiesData.length}</span>
                </div>
                {isPropertiesDataLoaded
                    ? propertiesData.map(pd =>
                        <PropertyShortListView key={pd._id} {...pd} isLoggedInUserPropertyDataCreator={id === pd._ownerId}
                    />)
                    : <WheelchairTireSpinner style={{ minHeight: "calc(100vh - 270px)" }} />
                }
            </div>
        </Container>
    )
};
