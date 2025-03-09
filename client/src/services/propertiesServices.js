import * as api from './api.js';

const endpoint = 'data';

export const getById = async (id) => api.get(`${endpoint}/properties/${id}`);

export const getByOwnerId = async (ownerId) => api.get(`${endpoint}/properties?where=_ownerId%3D%22${ownerId}%22`);

export const getPropertyTypes = async () => api.get(`${endpoint}/propertyTypes`);

export const getFacilities = async () => api.get(`${endpoint}/facilities`);

export const getPropertyFacilities = async (propertyId) => {
    const propertyFacilitiesData = await api.get(`${endpoint}/propertiesFacilities?where=propertyId%3D%22${propertyId}%22&load=facility%3DfacilityId%3Afacilities`);
    
    return propertyFacilitiesData.map(pfd => ({
        recordId: pfd._id,
        facilityId: pfd.facilityId,
        facilityName: pfd.facility.name,
        isForAccessibility: pfd.facility.IsForAccessibility,
    }));
}

export const create = async (data) => api.post(`${endpoint}/properties`, data);

export const edit = async (id, data) => api.put(`${endpoint}/properties/${id}`, data);

export const createPropertyFacility = async (data) => api.post(`${endpoint}/propertiesFacilities`, data);

export const deletePropertyFacility = async (id) => api.del(`${endpoint}/propertiesFacilities/${id}`);