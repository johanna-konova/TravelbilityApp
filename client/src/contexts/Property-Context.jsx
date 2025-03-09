import { createContext, useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getById, getPropertyFacilities } from "../services/propertiesServices";

export const PropertyContext = createContext({
    propertyId: '',
    propertyData: {},
    propertyFacilities: [],
    propertyCreatorId: '',
    isPropertyLoaded: false,
    //updatePropertyDataHandler: (propertyId, propertyData) => { },
});

export default function PropertyContextProvider(props) {
    const { propertyId } = useParams();

    const [propertyData, setPropertyData] = useState({});
    const [propertyFacilities, setPropertyFacilityIds] = useState([]);
    const [isPropertyDataLoaded, setIsPropertyDataLoaded] = useState(false);

    useEffect(() => {
        if (propertyId !== undefined) {
            (async () => {
                const [ propertyData, propertyFacilities ] = await Promise.all([getById(propertyId), getPropertyFacilities(propertyId)]);

                setPropertyData(propertyData);
                setPropertyFacilityIds(propertyFacilities);
                setIsPropertyDataLoaded(true);
            }
            )()
        }
    }, [propertyId]);

    const updatePropertyDataHandler = async (updatedPropertyDataCallbackFunction) => {
        const response = await updatedPropertyDataCallbackFunction();
        setPropertyData(response);
    };

    const contextData = {
        propertyId,
        propertyData,
        propertyFacilities,
        propertyCreatorId: propertyData._ownerId,
        isPropertyDataLoaded,
        //updatePropertyDataHandler
    };

    return (
        <>
            <PropertyContext.Provider value={contextData}>
                {props.children}
            </PropertyContext.Provider>
        </>
    )
}

export const usePropertyContext = () => useContext(PropertyContext);