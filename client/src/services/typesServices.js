import * as api from './api.js';

const endpoint = 'data/propertyTypes';

export const getAll = async () => api.get(endpoint);