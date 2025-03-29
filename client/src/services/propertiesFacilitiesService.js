import * as api from './api';
import { getAll as getAllProperties } from './propertiesService';

const endpoint = 'data/propertiesFacilities';

export const getAll = async ({
    propertyTypeIds,
    facilityIds,
    accessibilityIds
}) => {
    if (propertyTypeIds.length > 0 ||
        facilityIds.length > 0 ||
        accessibilityIds.length > 0) {
        const propertiesFacilitiesData = await api.get(`${endpoint}?&load=propertyData%3DpropertyId%3Aproperties`);

        const propertiesData = propertiesFacilitiesData
            .reduce((acc, pfd) => {
                const propertyId = pfd.propertyId;

                acc[propertyId] !== undefined
                    ? acc[propertyId].facilityIds.push(pfd.facilityId)
                    : acc[propertyId] = { ...pfd.propertyData, facilityIds: [pfd.facilityId] };
                return acc;
            }, {});

        const filteredPropertiesData = Object.values(propertiesData)
            .filter(pd => (propertyTypeIds.length === 0 || propertyTypeIds.includes(pd.typeId)) &&
                facilityIds.every(fi => pd.facilityIds.includes(fi)) &&
                accessibilityIds.every(ai => pd.facilityIds.includes(ai)));

        return filteredPropertiesData;
    };

    return getAllProperties();
};

export const getPropertyFacilities = async (propertyId) => {
    const propertyFacilitiesData = await api.get(`${endpoint}?where=propertyId%3D%22${propertyId}%22&load=facility%3DfacilityId%3Afacilities`);

    return propertyFacilitiesData.map(pfd => ({
        recordId: pfd._id,
        facilityId: pfd.facilityId,
        facilityName: pfd.facility.name,
        isForAccessibility: pfd.facility.IsForAccessibility,
    }));
}

export const getPropertyAccessibilityById = async (propertyId) => {
    const propertyFacilitiesData = await api.get(`${endpoint}?where=propertyId%3D%22${propertyId}%22&load=facility%3DfacilityId%3Afacilities`);

    return propertyFacilitiesData
        .filter(pfd => pfd.facility.IsForAccessibility)
        .map(pfd => pfd.facility.name);
}

export const createPropertyFacility = async (data) => api.post(endpoint, data);

export const deletePropertyFacility = async (id) => api.del(`${endpoint}/${id}`);

export const deletePropertyFacilities = async (propertyId) => {
    const propertyFacilitiesData = await api.get(`${endpoint}?where=propertyId%3D%22${propertyId}%22&select=_id`);

    const propertyFacilityIds = propertyFacilitiesData.map(pfd => pfd._id);
    
    for (const propertyFacilityId of propertyFacilityIds) {
        await deletePropertyFacility(propertyFacilityId);
    }
}