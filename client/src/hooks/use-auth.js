import { useAuthContext } from "../contexts/Auth-Context";

import * as api from '../services/api';

const endpoints = {
    REGISTER: 'users/register',
    LOGIN: 'users/login',
    LOGOUT: 'users/logout'
};

export function useLogin() {
    const { changeLoggedInUserData } = useAuthContext();

    const loginHandler = async (userData) => {
        const response = await api.post(endpoints.LOGIN, userData);
        changeLoggedInUserData(response);
    }
    
    return { loginHandler };
}

export function useRegister() {
    const { changeLoggedInUserData } = useAuthContext();

    const registerHandler = async (userData) => {
        const response = await api.post(endpoints.REGISTER, userData);
        changeLoggedInUserData(response);
    }
    
    return { registerHandler };
}

export function useLogout() {
    const { changeLoggedInUserData } = useAuthContext();

    const logoutHandler = async () => {
        await api.get(endpoints.LOGOUT);
        changeLoggedInUserData({});
    }
    
    return { logoutHandler };
}