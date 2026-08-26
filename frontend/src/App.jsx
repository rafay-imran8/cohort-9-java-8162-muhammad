import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AppRoutes from "./routes/AppRoutes";

import "./App.css";

function App() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="app-layout">
            {isAuthenticated && <Navbar />}

            <AppRoutes />
        </div>
    );
}

export default App;