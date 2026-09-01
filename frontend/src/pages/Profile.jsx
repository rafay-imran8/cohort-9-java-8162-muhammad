import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import api from "../api/api";

function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [profile, setProfile] = useState(user);
    const [loading, setLoading] = useState(!user);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            /*
             * If user information was already saved during login,
             * use it immediately.
             */
            if (user) {
                setProfile(user);
                setLoading(false);
                return;
            }

            /*
             * We don't have a stored user object, so try to retrieve
             * the current user from the backend.
             */
            try {
                const response = await api.get("/api/v1/users/me");

                setProfile(response.data);

                localStorage.setItem(
                    "user",
                    JSON.stringify(response.data)
                );
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    "Unable to load profile."
                );
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [user]);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    if (loading) {
        return (
            <main className="page-container">
                <div className="loading-state">
                    Loading profile...
                </div>
            </main>
        );
    }

    const firstName =
        profile?.firstName ||
        profile?.firstname ||
        "";

    const lastName =
        profile?.lastName ||
        profile?.lastname ||
        "";

    const fullName =
        `${firstName} ${lastName}`.trim() ||
        "User";

    return (
        <main className="page-container">
            <div className="profile-page">
                <div className="page-header">
                    <div>
                        <span className="eyebrow">
                            ACCOUNT
                        </span>

                        <h1>My Profile</h1>

                        <p>
                            View and manage your account information.
                        </p>
                    </div>

                    <Link
                        to="/dashboard"
                        className="secondary-button"
                    >
                        Back to Contacts
                    </Link>
                </div>

                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <section className="profile-card">
                    <div className="profile-avatar">
                        {firstName
                            ? firstName.charAt(0).toUpperCase()
                            : "U"}
                    </div>

                    <div className="profile-heading">
                        <h2>{fullName}</h2>

                        <p>
                            {profile?.email ||
                                "No email available"}
                        </p>
                    </div>
                </section>

                <section className="profile-details">
                    <h2>Personal Information</h2>

                    <div className="profile-grid">
                        <div className="profile-field">
                            <span>First Name</span>
                            <strong>
                                {firstName || "Not provided"}
                            </strong>
                        </div>

                        <div className="profile-field">
                            <span>Last Name</span>
                            <strong>
                                {lastName || "Not provided"}
                            </strong>
                        </div>

                        <div className="profile-field">
                            <span>Email</span>
                            <strong>
                                {profile?.email ||
                                    "Not provided"}
                            </strong>
                        </div>

                        <div className="profile-field">
                            <span>Phone Number</span>
                            <strong>
                                {profile?.phoneNumber ||
                                    "Not provided"}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="profile-actions">
                    <h2>Account Actions</h2>

                    <div className="action-buttons">
                        <Link
                            to="/change-password"
                            className="primary-button"
                        >
                            Change Password
                        </Link>

                        <button
                            type="button"
                            className="danger-button"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </div>
                </section>
            </div>
        </main>
    );
}

export default Profile;