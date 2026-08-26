import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/api";

function decodeToken(token) {
    try {
        const payload = token.split(".")[1];

        if (!payload) {
            return {};
        }

        return JSON.parse(
            atob(
                payload
                    .replace(/-/g, "+")
                    .replace(/_/g, "/")
            )
        );
    } catch {
        return {};
    }
}

function Profile() {
    const { token, logout } = useAuth();
    const navigate = useNavigate();

    const [showPasswordForm, setShowPasswordForm] =
        useState(false);

    const [currentPassword, setCurrentPassword] =
        useState("");

    const [newPassword, setNewPassword] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const user = useMemo(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            try {
                return JSON.parse(storedUser);
            } catch {
                // Fall through to JWT information.
            }
        }

        return decodeToken(token || "");
    }, [token]);

    const firstName =
        user?.firstName ||
        user?.firstname ||
        "";

    const lastName =
        user?.lastName ||
        user?.lastname ||
        "";

    const email = user?.email || user?.sub || "Not available";

    const phoneNumber =
        user?.phoneNumber ||
        user?.phone ||
        "Not available";

    const displayName =
        `${firstName} ${lastName}`.trim() ||
        email;

    const initials =
        `${firstName?.[0] || ""}${
            lastName?.[0] || ""
        }`.toUpperCase() ||
        email[0]?.toUpperCase() ||
        "U";

    const handleChangePassword = async (event) => {
        event.preventDefault();

        setMessage("");
        setError("");

        if (newPassword.length < 6) {
            setError(
                "New password must be at least 6 characters."
            );
            return;
        }

        setLoading(true);

        try {
            const response = await api.post(
                "/api/v1/auth/change",
                {
                    currentPassword,
                    newPassword,
                }
            );

            setMessage(
                response.data?.message ||
                    "Password changed successfully."
            );

            setCurrentPassword("");
            setNewPassword("");
            setShowPasswordForm(false);
        } catch (err) {
            if (err.response?.status === 401) {
                setError(
                    err.response.data?.message ||
                        "Current password is incorrect."
                );
            } else if (err.response?.status === 400) {
                setError(
                    err.response.data?.message ||
                        "Please check your password."
                );
            } else {
                setError(
                    "Unable to change password."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <main className="page-container">
            <div className="page-header">
                <h1>Profile</h1>
                <p>
                    View your account information and manage
                    your account.
                </p>
            </div>

            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {initials}
                    </div>

                    <h1>{displayName}</h1>

                    <p>{email}</p>
                </div>

                <div className="profile-body">
                    <div className="profile-info">
                        <div className="profile-info-item">
                            <span className="profile-info-label">
                                First Name
                            </span>

                            <span className="profile-info-value">
                                {firstName ||
                                    "Not available"}
                            </span>
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">
                                Last Name
                            </span>

                            <span className="profile-info-value">
                                {lastName ||
                                    "Not available"}
                            </span>
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">
                                Email
                            </span>

                            <span className="profile-info-value">
                                {email}
                            </span>
                        </div>

                        <div className="profile-info-item">
                            <span className="profile-info-label">
                                Phone
                            </span>

                            <span className="profile-info-value">
                                {phoneNumber}
                            </span>
                        </div>
                    </div>

                    {message && (
                        <div className="message message-success">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="message message-error">
                            {error}
                        </div>
                    )}

                    <div className="profile-actions">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setShowPasswordForm(
                                    (current) => !current
                                );
                                setError("");
                                setMessage("");
                            }}
                        >
                            {showPasswordForm
                                ? "Cancel"
                                : "Change Password"}
                        </button>

                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>

                    {showPasswordForm && (
                        <div className="password-panel">
                            <h2>Change Password</h2>

                            <form
                                className="form"
                                onSubmit={
                                    handleChangePassword
                                }
                            >
                                <div className="form-group">
                                    <label htmlFor="currentPassword">
                                        Current Password
                                    </label>

                                    <input
                                        id="currentPassword"
                                        type="password"
                                        value={
                                            currentPassword
                                        }
                                        onChange={(event) =>
                                            setCurrentPassword(
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="newPassword">
                                        New Password
                                    </label>

                                    <input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(event) =>
                                            setNewPassword(
                                                event.target
                                                    .value
                                            )
                                        }
                                        required
                                    />
                                </div>

                                <div className="button-row">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading
                                            ? "Changing..."
                                            : "Reset Password"}
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => {
                                            setShowPasswordForm(
                                                false
                                            );
                                            setCurrentPassword(
                                                ""
                                            );
                                            setNewPassword("");
                                            setError("");
                                        }}
                                        disabled={loading}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}

export default Profile;