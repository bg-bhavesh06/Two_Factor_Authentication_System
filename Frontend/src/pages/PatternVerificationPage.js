import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function PatternVerificationPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const pendingAuth = useMemo(() => {
    const stored = localStorage.getItem("pendingAuth");
    return stored ? JSON.parse(stored) : null;
  }, []);
  const [selectedPattern, setSelectedPattern] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!pendingAuth) {
    return <Navigate to="/login" replace />;
  }

  function toggleSelection(icon) {
    if (selectedPattern.length >= 3) {
      return;
    }

    setSelectedPattern((current) => [...current, icon]);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/auth/verify-pattern", {
        pendingToken: pendingAuth.pendingToken,
        selectedPattern,
        deviceInfo: pendingAuth.deviceInfo
      });
      login(response.data.token, response.data.user);
      localStorage.removeItem("pendingAuth");
      navigate(response.data.user?.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Pattern verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <Navbar />
      <div className="auth-layout">
        <form className="glass-card auth-card" onSubmit={handleSubmit}>
          <h2>Visual Pattern Verification</h2>
          <p>{pendingAuth.deviceWarning || "Step 2 of 2: repeat the pattern to complete login."}</p>
          <div className="demo-box">{pendingAuth.patternHint}</div>
          <div className="pattern-grid">
            {pendingAuth.patternPool.map((icon) => (
              <button
                key={icon}
                type="button"
                className="pattern-tile"
                onClick={() => toggleSelection(icon)}
              >
                {icon}
              </button>
            ))}
          </div>
          <div className="selection-strip">Selected: {selectedPattern.join(" -> ") || "none"}</div>
          <button className="secondary-button" type="button" onClick={() => setSelectedPattern([])}>
            Reset Pattern
          </button>
          <button className="primary-button" disabled={loading || selectedPattern.length !== 3}>
            {loading ? "Checking..." : "Verify Pattern"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default PatternVerificationPage;

