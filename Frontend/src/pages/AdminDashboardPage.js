import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function AdminDashboardPage() {
  const { token, user } = useAuth();
  const [overview, setOverview] = useState({
    users: [],
    devices: [],
    loginHistory: [],
    securityLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadOverview() {
    try {
      const response = await api.get("/security/admin-overview", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOverview(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, [token]);

  async function handleRemoveUser(userId) {
    const confirmed = window.confirm("Do you want to remove this user account?");
    if (!confirmed) {
      return;
    }

    setActionMessage("");
    setActionError("");

    try {
      const response = await api.delete(`/security/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActionMessage(response.data.message);
      await loadOverview();
    } catch (error) {
      setActionError(error.response?.data?.message || "Unable to remove user.");
    }
  }

  return (
    <div className="page-shell">
      <Navbar />
      <section className="dashboard-header glass-card">
        <div>
          <p className="eyebrow">Administrator Console</p>
          <h1>Welcome, {user?.username}</h1>
          <p>Monitor registered users, trusted devices, login activity, and security events.</p>
        </div>
      </section>

      {actionMessage && <div className="success-text">{actionMessage}</div>}
      {actionError && <div className="error-text">{actionError}</div>}

      {loading ? (
        <div className="loader-line">Loading admin security overview...</div>
      ) : (
        <section className="dashboard-grid">
          <div className="glass-card dashboard-card">
            <h3>Registered Users</h3>
            {overview.users.map((account) => (
              <div key={account._id} className="list-card">
                <strong>{account.username}</strong>
                <span>{account.email}</span>
                <span>Role: {account.role}</span>
                {account.role !== "admin" && (
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => handleRemoveUser(account._id)}
                  >
                    Remove User
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="glass-card dashboard-card">
            <h3>Trusted Devices</h3>
            {overview.devices.map((device) => (
              <div key={device._id} className="list-card">
                <strong>{device.browser || "Unknown Browser"}</strong>
                <span>{device.os || "Unknown OS"}</span>
                <span>{device.screenResolution || "Unknown Resolution"}</span>
              </div>
            ))}
          </div>

          <div className="glass-card dashboard-card">
            <h3>Recent Login History</h3>
            {overview.loginHistory.map((entry) => (
              <div key={entry._id} className="list-card">
                <strong>{entry.email}</strong>
                <span>{entry.status}</span>
                <span>{entry.riskLevel} risk ({entry.riskScore})</span>
              </div>
            ))}
          </div>

          <div className="glass-card dashboard-card">
            <h3>Security Logs</h3>
            {overview.securityLogs.map((log) => (
              <div key={log._id} className="list-card">
                <strong>{log.eventType}</strong>
                <span>{log.email || "System"}</span>
                <span>{log.severity}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default AdminDashboardPage;
