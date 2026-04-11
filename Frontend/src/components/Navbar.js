import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isDashboardPage = location.pathname === "/dashboard" || location.pathname === "/admin";

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="navbar glass-card">
      <Link to="/" className="brand">
        2FA System
      </Link>
      <div className="nav-links">
        <Link to="/">Home</Link>
        {isDashboardPage && user ? (
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
