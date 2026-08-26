import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { isAuthenticated, logout, user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        return null;
    }

    const firstName =
        user?.firstName ||
        user?.firstname ||
        "";

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <Link
                to="/dashboard"
                className="navbar-brand"
            >
                ContactHub
            </Link>

            <div className="navbar-links">
                <Link
                    to="/dashboard"
                    className={
                        location.pathname === "/dashboard" ||
                        location.pathname === "/"
                            ? "nav-link active"
                            : "nav-link"
                    }
                >
                    Contacts
                </Link>

                <Link
                    to="/profile"
                    className={
                        location.pathname === "/profile"
                            ? "nav-link active"
                            : "nav-link"
                    }
                >
                    Profile
                </Link>

                <button
                    type="button"
                    className="nav-logout"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </div>

            {firstName && (
                <div className="navbar-user">
                    Hi, {firstName}
                </div>
            )}
        </nav>
    );
}

export default Navbar;