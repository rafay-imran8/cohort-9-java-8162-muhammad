import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <NavLink
                    to="/dashboard"
                    className="navbar-brand"
                >
                    Contact Manager
                </NavLink>

                <div className="navbar-links">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            `navbar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >
                        Contacts
                    </NavLink>

                    <NavLink
                        to="/profile"
                        className={({ isActive }) =>
                            `navbar-link ${
                                isActive ? "active" : ""
                            }`
                        }
                    >
                        Profile
                    </NavLink>

                    <button
                        type="button"
                        className="navbar-link navbar-logout"
                        onClick={handleLogout}
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;