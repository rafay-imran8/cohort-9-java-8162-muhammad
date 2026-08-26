import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";

function Register() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        email: "",
        phoneNumber: "",
        password: "",
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            await api.post(
                "/api/v1/auth/register",
                formData
            );

            setSuccess(
                "Registration successful. Redirecting to login..."
            );

            setTimeout(() => {
                navigate("/login");
            }, 1000);
        } catch (err) {
            if (err.response?.status === 409) {
                setError(
                    err.response.data?.message ||
                        "Email or phone number already exists."
                );
            } else if (err.response?.status === 400) {
                setError(
                    err.response.data?.message ||
                        "Please check your information."
                );
            } else {
                setError(
                    "Unable to connect to the server."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>
                        Create your account to start managing
                        contacts.
                    </p>
                </div>

                <form
                    className="form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="firstname">
                            First Name
                        </label>

                        <input
                            id="firstname"
                            name="firstname"
                            type="text"
                            placeholder="John"
                            value={formData.firstname}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="lastname">
                            Last Name
                        </label>

                        <input
                            id="lastname"
                            name="lastname"
                            type="text"
                            placeholder="Doe"
                            value={formData.lastname}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">
                            Phone Number
                        </label>

                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            placeholder="03001234567"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {error && (
                        <div className="message message-error">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="message message-success">
                            {success}
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Creating account..."
                            : "Create Account"}
                    </button>
                </form>

                <p
                    style={{
                        marginTop: "22px",
                        textAlign: "center",
                        color: "var(--muted)",
                        fontSize: "14px",
                    }}
                >
                    Already have an account?{" "}
                    <Link
                        to="/login"
                        style={{
                            color: "var(--primary)",
                            fontWeight: 600,
                        }}
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Register;