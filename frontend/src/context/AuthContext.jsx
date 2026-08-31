import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";
import api from "../api/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken] = useState(
        localStorage.getItem("token")
    );

    const [user, setUser] = useState(() => {
        const storedUser =
            localStorage.getItem("user");

        try {
            return storedUser
                ? JSON.parse(storedUser)
                : null;
        } catch {
            return null;
        }
    });

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        const handleAuthenticationLogout = () => {
            logout();
        };

        window.addEventListener(
            "auth:logout",
            handleAuthenticationLogout
        );

        return () => {
            window.removeEventListener(
                "auth:logout",
                handleAuthenticationLogout
            );
        };
    }, []);

    const login = async (
        identifier,
        password
    ) => {
        const response = await api.post(
            "/api/v1/auth/login",
            {
                identifier,
                password,
            }
        );

        const newToken = response.data.token;

        localStorage.setItem(
            "token",
            newToken
        );

        setToken(newToken);

        /*
         * Some backend responses return the user
         * directly, while others may put it inside
         * response.data.user.
         */
        const loggedInUser =
            response.data.user ||
            response.data;

        if (
            loggedInUser &&
            (
                loggedInUser.firstName ||
                loggedInUser.firstname ||
                loggedInUser.email ||
                loggedInUser.phoneNumber
            )
        ) {
            localStorage.setItem(
                "user",
                JSON.stringify(loggedInUser)
            );

            setUser(loggedInUser);
        }

        return response.data;
    };

    return (
        <AuthContext.Provider
            value={{
                token,
                user,
                isAuthenticated: !!token,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}