import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setLoading(true);

        try {
            const response = await login(
                identifier,
                password
            );

            if (response?.token) {
                navigate("/dashboard");
            } else {
                setError("Invalid credentials.");
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setError("Invalid email/phone or password.");
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
                    <h1>Welcome back</h1>
                    <p>
                        Sign in to manage your contacts.
                    </p>
                </div>

                <form
                    className="form"
                    onSubmit={handleSubmit}
                >
                    <div className="form-group">
                        <label htmlFor="identifier">
                            Email or Phone
                        </label>

                        <input
                            id="identifier"
                            type="text"
                            placeholder="you@example.com"
                            value={identifier}
                            onChange={(event) =>
                                setIdentifier(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event) =>
                                setPassword(
                                    event.target.value
                                )
                            }
                            required
                        />
                    </div>

                    {error && (
                        <div className="message message-error">
                            {error}
                        </div>
                    )}

                    <button
                        className="btn btn-primary btn-full"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Signing in..."
                            : "Sign In"}
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
                    Don't have an account?{" "}
                    <Link
                        to="/register"
                        style={{
                            color: "var(--primary)",
                            fontWeight: 600,
                        }}
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;