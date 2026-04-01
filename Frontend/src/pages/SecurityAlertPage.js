import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function SecurityAlertPage() {
  const pendingAuth = useMemo(() => {
    const stored = localStorage.getItem("pendingAuth");
    return stored ? JSON.parse(stored) : null;
  }, []);
  const [fakeOtp, setFakeOtp] = useState("");
  const [message, setMessage] = useState("");

  async function handleFakeSubmit(event) {
    event.preventDefault();

    const response = await api.post("/auth/honeypot-otp", {
      email: pendingAuth?.email,
      fakeOtp,
      deviceInfo: pendingAuth?.deviceInfo
    });

    setMessage(response.data.message);
  }

  return (
    <div className="page-shell">
      <Navbar />
      <div className="auth-layout">
        <form className="glass-card auth-card" onSubmit={handleFakeSubmit}>
          <h2>Security Alert Channel</h2>
          <p>
            Suspicious verification behavior was detected. This decoy OTP screen records attacker
            activity silently for security analysis.
          </p>
          <input
            value={fakeOtp}
            onChange={(event) => setFakeOtp(event.target.value)}
            placeholder="Enter backup OTP"
          />
          <button className="primary-button">Submit OTP</button>
          {message && <p className="success-text">{message}</p>}
          <p className="helper-text">
            Return to the <Link to="/login">login portal</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default SecurityAlertPage;
