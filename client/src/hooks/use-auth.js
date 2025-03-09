import { login, logout, register } from "../services/usersServices";
import { useAuthContext } from "../contexts/Auth-Context";

export function useLogin() {
    const { changeLoggedInUserData } = useAuthContext();

    const loginHandler = async (userData) => {
        const response = await login(userData);
        changeLoggedInUserData(response);
    }
    
    return { loginHandler };
}

export function useRegister() {
    const { changeLoggedInUserData } = useAuthContext();

    const registerHandler = async (userData) => {
        const response = await register(userData);
        changeLoggedInUserData(response);
    }
    
    return { registerHandler };
}

export function useLogout() {
    const { changeLoggedInUserData } = useAuthContext();

    const logoutHandler = async () => {
        await logout();
        changeLoggedInUserData({});
    }
    
    return { logoutHandler };
}