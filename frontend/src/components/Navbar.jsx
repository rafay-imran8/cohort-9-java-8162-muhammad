import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const {
        isAuthenticated,
        logout,
        user,
    } = useAuth();

    const location = useLocation();
    const navigate = useNavigate();

    if (!isAuthenticated) {
        return null;
    }

    const firstName =
        user?.firstName ||
        user?.firstname ||
        "";

    const isContactsActive =
        location.pathname === "/dashboard" ||
        location.pathname === "/" ||
        location.pathname.startsWith("/contacts");

    const isProfileActive =
        location.pathname === "/profile" ||
        location.pathname === "/change-password";

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
                        isContactsActive
                            ? "nav-link active"
                            : "nav-link"
                    }
                >
                    Contacts
                </Link>

                <Link
                    to="/profile"
                    className={
                        isProfileActive
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