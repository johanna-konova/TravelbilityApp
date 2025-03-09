import * as api from './api.js';

const endpoints = {
    REGISTER: 'users/register',
    LOGIN: 'users/login',
    LOGOUT: 'users/logout'
};

export const register = async(data) => await api.post(endpoints.REGISTER, data);
export const login = async (data) => await api.post(endpoints.LOGIN, data);
export const logout = async () => await api.get(endpoints.LOGOUT);