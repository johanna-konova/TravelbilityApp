import { createContext, useContext } from "react";
import usePersistedState from "../hooks/use-persisted-state";

export const AuthContext = createContext({
    id: '',
    email: '',
    accessToken: '',
    isAuthenticated: false,
    changeLoggedInUserData: () => {},
});

export default function AuthContextProvider(props) {
    const [loggedInUserData, setLoggedInUserData] = usePersistedState('userData', {});

    const changeLoggedInUserData = (loggedInUserData) => setLoggedInUserData(loggedInUserData);

    const contextData = {
        id: loggedInUserData._id,
        email: loggedInUserData.email,
        accessToken: loggedInUserData.accessToken,
        isAuthenticated: !!loggedInUserData.email,
        changeLoggedInUserData,
    };

    return (
        <>
            <AuthContext.Provider value={contextData}>
                {props.children}
            </AuthContext.Provider>
        </>
    )
}

export const useAuthContext = () => useContext(AuthContext);