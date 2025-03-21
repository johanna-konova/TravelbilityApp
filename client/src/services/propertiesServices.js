import * as api from './api.js';

const endpoint = 'data';

export const getAll = async ({
    propertyTypeIds,
    facilityIds,
    accessibilityIds
}) => {
    if (propertyTypeIds.length > 0 ||
        facilityIds.length > 0 ||
        accessibilityIds.length > 0) {
        const propertiesFacilitiesData = await api.get(`${endpoint}/propertiesFacilities?&load=propertyData%3DpropertyId%3Aproperties`);

        const propertiesData = propertiesFacilitiesData
            .reduce((acc, pfd) => {
                const propertyId = pfd.propertyId;

                acc.hasOwnProperty(propertyId)
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

    return api.get(`${endpoint}/properties`);
};

export const getThreeNewestAdded = async () => api.get(`${endpoint}/properties?sortBy=_createdOn%20desc&pageSize=3&load=typeData%3DtypeId%3ApropertyTypes`);

export const getById = async (id) => api.get(`${endpoint}/properties/${id}`);

export const getByOwnerId = async (ownerId) => api.get(`${endpoint}/properties?where=_ownerId%3D%22${ownerId}%22`);

export const getPropertyTypes = async () => api.get(`${endpoint}/propertyTypes`);

export const getFacilities = async () => api.get(`${endpoint}/facilities`);

export const getAccessibility = async () => api.get(`${endpoint}/facilities?where=IsForAccessibility%3Dtrue`);

export const getPropertyFacilities = async (propertyId) => {
    const propertyFacilitiesData = await api.get(`${endpoint}/propertiesFacilities?where=propertyId%3D%22${propertyId}%22&load=facility%3DfacilityId%3Afacilities`);

    return propertyFacilitiesData.map(pfd => ({
        recordId: pfd._id,
        facilityId: pfd.facilityId,
        facilityName: pfd.facility.name,
        isForAccessibility: pfd.facility.IsForAccessibility,
    }));
}

export const getPropertyAccessibilityById = async (propertyId) => {
    const propertyFacilitiesData = await api.get(`${endpoint}/propertiesFacilities?where=propertyId%3D%22${propertyId}%22&load=facility%3DfacilityId%3Afacilities`);

    return propertyFacilitiesData
        .filter(pfd => pfd.facility.IsForAccessibility)
        .map(pfd => pfd.facility.name);
}

export const create = async (data) => api.post(`${endpoint}/properties`, data);

export const edit = async (id, data) => api.put(`${endpoint}/properties/${id}`, data);

export const createPropertyFacility = async (data) => api.post(`${endpoint}/propertiesFacilities`, data);

export const deletePropertyFacility = async (id) => api.del(`${endpoint}/propertiesFacilities/${id}`);