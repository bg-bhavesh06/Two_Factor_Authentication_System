import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function OtpVerificationPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const pendingAuth = useMemo(() => {
    const stored = localStorage.getItem("pendingAuth");
    return stored ? JSON.parse(stored) : null;
  }, []);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!pendingAuth) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("Validating contextual OTP...");

    try {
      const response = await api.post("/auth/verify-otp", {
        pendingToken: pendingAuth.pendingToken,
        otp,
        deviceInfo: pendingAuth.deviceInfo
      });

      if (response.data.nextStep === "pattern") {
        localStorage.setItem(
          "pendingAuth",
          JSON.stringify({
            ...pendingAuth,
            nextStep: "pattern",
            patternHint: response.data.patternHint || pendingAuth.patternHint,
            patternPool: response.data.patternPool || pendingAuth.patternPool
          })
        );
        navigate("/verify-pattern");
        return;
      }

      login(response.data.token, response.data.user);
      localStorage.removeItem("pendingAuth");
      navigate(response.data.user?.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      const nextStep = err.response?.data?.nextStep;

      if (nextStep === "honeypot") {
        navigate("/security-alert");
        return;
      }

      setError(err.response?.data?.message || "OTP verification failed.");
    } finally {
      setLoading(false);
      setMessage("");
    }
  }

  return (
    <div className="page-shell">
      <Navbar />
      <div className="auth-layout">
        <form className="glass-card auth-card" onSubmit={handleSubmit}>
          <h2>Contextual OTP Verification</h2>
          <p>{pendingAuth.deviceWarning || "Step 1 of 2: enter the encoded contextual OTP for this session."}</p>
          <div className="security-badge" style={{ fontSize: "0.85rem", padding: "8px 12px", background: "rgba(74, 168, 232, 0.15)", borderRadius: "8px", color: "var(--primary-dark)", marginBottom: "12px", border: "1px solid rgba(74, 168, 232, 0.3)" }}>
            🔀 <strong>Dynamic Sequence Active:</strong> OTP component order is randomly shuffled for every session to defeat replay & dictionary attacks.
          </div>
          {pendingAuth.otp && <div className="demo-box" style={{ fontWeight: "bold", letterSpacing: "1px" }}>Shuffled Session OTP: {pendingAuth.otp}</div>}
          <div className="demo-box">
            Device: {pendingAuth.device || "Unknown"}<br />
            IP: {pendingAuth.ip || "unknown"}<br />
            Timestamp: {pendingAuth.timestamp ?? "--"}
          </div>
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value.toUpperCase())}
            placeholder={pendingAuth.otp ? `e.g. ${pendingAuth.otp}` : "Enter OTP format (e.g. T24-65A3-WIN-IP89)"}
            required
          />
          <button className="primary-button" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          {message && <div className="loader-line">{message}</div>}
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default OtpVerificationPage;
