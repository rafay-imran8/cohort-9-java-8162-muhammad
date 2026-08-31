import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

const isSecureApiUrl = (baseURL) => {
    if (!baseURL) {
        return true;
    }

    try {
        const url = new URL(
            baseURL,
            window.location.origin
        );

        // Allow HTTP only for local development.
        const isLocalhost =
            url.hostname === "localhost" ||
            url.hostname === "127.0.0.1";

        return (
            url.protocol === "https:" ||
            (url.protocol === "http:" && isLocalhost)
        );
    } catch {
        return false;
    }
};

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (
            token &&
            !isSecureApiUrl(config.baseURL)
        ) {
            return Promise.reject(
                new Error(
                    "Refusing to send authentication credentials over an insecure connection."
                )
            );
        }

        if (token) {
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.dispatchEvent(
                new Event("auth:logout")
            );
        }

        return Promise.reject(error);
    }
);

export default api;