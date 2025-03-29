import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { getById } from "../services/propertiesService";
import { getPropertyFacilities } from "../services/propertiesFacilitiesService";

export const PropertyContext = createContext({
    propertyId: '',
    propertyData: {},
    propertyFacilities: [],
    propertyCreatorId: '',
    isPropertyDataLoaded: false,
});

export default function PropertyContextProvider(props) {
    const { propertyId } = useParams();

    const [propertyData, setPropertyData] = useState({});
    const [propertyFacilities, setPropertyFacilityIds] = useState([]);
    const [isPropertyDataLoaded, setIsPropertyDataLoaded] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        if (propertyId !== undefined) {
            (async () => {
                try {
                    const [ propertyData, propertyFacilities ] = await Promise.all([getById(propertyId), getPropertyFacilities(propertyId)]);
    
                    setPropertyData(propertyData);
                    setPropertyFacilityIds(propertyFacilities);
                    setIsPropertyDataLoaded(true);
                } catch (error) {
                    if (error.code === 404) {
                        navigate("/404");
                    }
                }
            }
            )()
        }
    }, [propertyId]);

    const contextData = {
        propertyId,
        propertyData,
        propertyFacilities,
        propertyCreatorId: propertyData._ownerId,
        isPropertyDataLoaded,
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