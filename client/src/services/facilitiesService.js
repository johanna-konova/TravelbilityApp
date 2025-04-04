import * as api from './api.js';

const endpoint = 'data/facilities';

export const getFacilities = async () => api.get(endpoint);

export const getAccessibility = async () => api.get(`${endpoint}?where=IsForAccessibility%3Dtrue`);