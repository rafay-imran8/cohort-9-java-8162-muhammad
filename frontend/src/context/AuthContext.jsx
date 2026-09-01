import {
    useEffect,
    useState,
} from "react";
import api from "../api/api";
import storageAdapter from "../utils/storageAdapter";
import { AuthContext } from "./AuthContextDefinition";

// Re-export for backward compatibility
export { AuthContext };

export function AuthProvider({ children }) {
    const [token, setToken] = useState(() => {
        const storedToken =
            storageAdapter.getItem("token");

        // Only use token if it's a non-empty string
        return (
            storedToken &&
            typeof storedToken === "string" &&
            storedToken.trim().length > 0
                ? storedToken
                : null
        );
    });

    const [user, setUser] = useState(() => {
        const storedUser =
            storageAdapter.getItem("user");

        try {
            return storedUser
                ? JSON.parse(storedUser)
                : null;
        } catch {
            return null;
        }
    });

    const logout = () => {
        const tokenRemoved =
            storageAdapter.removeItem("token");
        const userRemoved =
            storageAdapter.removeItem("user");

        // Only clear in-memory state if removal
        // was successful
        if (tokenRemoved && userRemoved) {
            setToken(null);
            setUser(null);
        }
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

        // Only save and set the token if it's a
        // non-empty string
        if (
            newToken &&
            typeof newToken === "string" &&
            newToken.trim().length > 0
        ) {
            const tokenSaved =
                storageAdapter.setItem(
                    "token",
                    newToken
                );

            if (!tokenSaved) {
                throw new Error(
                    "Failed to save authentication token. Please try logging in again."
                );
            }

            setToken(newToken);
        }

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
            storageAdapter.setItem(
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