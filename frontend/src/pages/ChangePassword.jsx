import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function ChangePassword() {
    const navigate = useNavigate();
    const redirectTimeoutRef = useRef(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        return () => {
            // Clean up redirect timeout on unmount
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
        };
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            await api.post(
                "/api/v1/auth/change",
                {
                    currentPassword,
                    newPassword,
                }
            );

            setSuccess(
                "Password changed successfully."
            );

            setCurrentPassword("");
            setNewPassword("");

            redirectTimeoutRef.current = setTimeout(
                () => {
                    navigate("/profile");
                },
                1500
            );
        } catch (err) {
            if (err.response?.status === 401) {
                setError(
                    err.response?.data?.message ||
                    "Current password is incorrect."
                );
            } else {
                setError(
                    err.response?.data?.message ||
                    "Unable to change password."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="page-container">
            <div className="profile-page">
                <div className="page-header">
                    <div>
                        <span className="eyebrow">
                            ACCOUNT
                        </span>

                        <h1>Change Password</h1>

                        <p>
                            Update your account password.
                        </p>
                    </div>

                    <Link
                        to="/profile"
                        className="secondary-button"
                    >
                        Back to Profile
                    </Link>
                </div>

                <section className="profile-details">
                    <h2>Change Your Password</h2>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="success-message">
                            {success}
                        </div>
                    )}

                    <form
                        className="contact-form"
                        onSubmit={handleSubmit}
                    >
                        <div className="profile-field">
                            <label htmlFor="currentPassword">
                                Current Password
                            </label>

                            <input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(event) =>
                                    setCurrentPassword(
                                        event.target.value
                                    )
                                }
                                required
                            />
                        </div>

                        <div className="profile-field">
                            <label htmlFor="newPassword">
                                New Password
                            </label>

                            <input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(event) =>
                                    setNewPassword(
                                        event.target.value
                                    )
                                }
                                required
                                minLength={8}
                            />
                        </div>

                        <div className="action-buttons">
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={loading}
                            >
                                {loading
                                    ? "Changing Password..."
                                    : "Change Password"}
                            </button>

                            <Link
                                to="/profile"
                                className="secondary-button"
                            >
                                Cancel
                            </Link>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}

export default ChangePassword;