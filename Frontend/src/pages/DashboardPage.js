import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState({
    devices: [],
    loginHistory: [],
    securityLogs: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const response = await api.get("/security/overview");
        setOverview(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadOverview();
  }, []);

  return (
    <div className="page-shell">
      <Navbar />
      <section className="dashboard-header glass-card">
        <div>
          <p className="eyebrow">Security Dashboard</p>
          <h1>Welcome, {user?.username}</h1>
          <p>Adaptive authentication is active for your account.</p>
        </div>
      </section>

      {loading ? (
        <div className="loader-line">Loading security overview...</div>
      ) : (
        <section className="dashboard-grid">
          <div className="glass-card dashboard-card">
            <h3>Trusted Devices</h3>
            {overview.devices.map((device) => (
              <div key={device._id} className="list-card">
                <strong>{device.browser}</strong>
                <span>{device.os}</span>
                <span>{device.screenResolution}</span>
              </div>
            ))}
          </div>

          <div className="glass-card dashboard-card">
            <h3>Recent Login History</h3>
            {overview.loginHistory.map((entry) => (
              <div key={entry._id} className="list-card">
                <strong>{entry.status}</strong>
                <span>
                  {entry.riskLevel} risk ({entry.riskScore})
                </span>
                <span>{entry.location}</span>
              </div>
            ))}
          </div>

          <div className="glass-card dashboard-card">
            <h3>Security Logs</h3>
            {overview.securityLogs.map((log) => (
              <div key={log._id} className="list-card">
                <strong>{log.eventType}</strong>
                <span>{log.message}</span>
                <span>{log.severity}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default DashboardPage;
