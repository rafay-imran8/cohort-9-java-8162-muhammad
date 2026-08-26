import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ContactDetails from "../pages/ContactDetails";
import ChangePassword from "../pages/ChangePassword";
import Profile from "../pages/Profile";

import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
    return (
        <Routes>
            <Route
                path="/login"
                element={<Login />}
            />

            <Route
                path="/register"
                element={<Register />}
            />

            <Route element={<ProtectedRoute />}>
                <Route
                    path="/"
                    element={<Dashboard />}
                />

                <Route
                    path="/dashboard"
                    element={<Dashboard />}
                />

                <Route
                    path="/contacts/:id"
                    element={<ContactDetails />}
                />

                <Route
                    path="/profile"
                    element={<Profile />}
                />

                <Route
                    path="/change-password"
                    element={<ChangePassword />}
                />
            </Route>
        </Routes>
    );
}

export default AppRoutes;