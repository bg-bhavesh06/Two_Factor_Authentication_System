import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function detectDeviceInfo() {
  return {
    browser: navigator.userAgent.includes("Chrome") ? "Chrome" : "Browser",
    os: navigator.platform || "Unknown OS",
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    userAgent: navigator.userAgent
  };
}

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  function redirectAfterLogin(user) {
    navigate(user?.role === "admin" ? "/admin" : "/dashboard");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setStatus("Scanning device and evaluating login risk...");
    setError("");

    try {
      const payload = {
        ...formData,
        location: "Known",
        deviceInfo: detectDeviceInfo()
      };
      const response = await api.post("/auth/login", payload);
      const data = response.data;

      if (data.token) {
        login(data.token, data.user);
        redirectAfterLogin(data.user);
        return;
      }

      localStorage.setItem(
        "pendingAuth",
        JSON.stringify({
          email: formData.email,
          pendingToken: data.pendingToken,
          nextStep: data.nextStep,
          patternHint: data.patternHint,
          patternPool: data.patternPool,
          riskLevel: data.riskLevel,
          deviceWarning: data.deviceWarning,
          otp: data.otp,
          rawOtp: data.rawOtp,
          device: data.device,
          ip: data.ip,
          timestamp: data.timestamp,
          deviceInfo: detectDeviceInfo()
        })
      );

      if (data.nextStep === "pattern") {
        navigate("/verify-pattern");
        return;
      }

      if (data.nextStep === "otp") {
        navigate("/verify-otp");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    } finally {
      setLoading(false);
      setStatus("");
    }
  }

  return (
    <div className="page-shell">
      <Navbar />
      <div className="auth-layout">
        <form className="glass-card auth-card" onSubmit={handleSubmit}>
          <h2>Adaptive Login Portal</h2>
          <p>Login with email and password. Then complete contextual OTP and pattern verification.</p>
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <button className="primary-button" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
          {status && <div className="loader-line">{status}</div>}
          {error && <p className="error-text">{error}</p>}
          <p className="helper-text">
            No account yet? <Link to="/register">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
