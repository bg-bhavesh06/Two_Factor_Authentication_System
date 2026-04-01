import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";

function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/auth/register", formData);
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <Navbar />
      <div className="auth-layout">
        <form className="glass-card auth-card" onSubmit={handleSubmit}>
          <h2>Create Secure Identity</h2>
          <p>Register a user account with strong password protection.</p>
          <input name="username" placeholder="Username" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            required
          />
          <button className="primary-button" disabled={loading}>
            {loading ? "Encrypting..." : "Register"}
          </button>
          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}
          <p className="helper-text">
            Already registered? <Link to="/login">Login here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
