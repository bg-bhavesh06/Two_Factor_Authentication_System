import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const capabilityCards = [
  {
    title: "Adaptive Risk Engine",
    text: "Evaluates login behavior using trusted device checks, login patterns, and suspicious activity signals."
  },
  {
    title: "Contextual OTP",
    text: "Binds OTP validation to the active device fingerprint, session, and timestamp for stronger verification."
  },
  {
    title: "Invisible Protection",
    text: "Redirects repeated OTP failures into a silent honeypot flow and records attacker behavior in logs."
  }
];

const workflowSteps = [
  "User enters email and password.",
  "System checks device trust and recent failed attempts.",
  "Medium risk triggers visual pattern verification.",
  "High risk triggers contextual OTP verification.",
  "Successful users access their secure dashboard and logs."
];

const projectHighlights = [
  "JWT-based user sessions",
  "bcrypt password hashing",
  "MongoDB security collections",
  "Trusted device recognition",
  "Pattern verification challenge",
  "Admin overview and audit monitoring"
];

function LandingPage() {
  return (
    <div className="page-shell">
      <Navbar />

      <section className="hero">
        <div className="hero-copy">
          <h1>Advanced Two-Factor Authentication with intelligent invisible security.</h1>
          <p className="hero-text">
            A modern authentication platform that improves security while keeping the user
            experience smooth, adaptive, and easy to understand for academic evaluation.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="primary-button">
              Create Account
            </Link>
            <Link to="/login" className="secondary-button">
              Secure Login
            </Link>
          </div>
        </div>

        <div className="hero-panel glass-card pulse-panel">
          <h3>Real-Time Security Layers</h3>
          <ul className="feature-list">
            <li>Risk-based authentication</li>
            <li>Device fingerprint analysis</li>
            <li>Context-bound OTP validation</li>
            <li>Visual bot resistance challenge</li>
            <li>Security logging and attack tracing</li>
          </ul>
        </div>
      </section>

      <section className="stats-strip">
        <div className="stat-card glass-card">
          <strong>4</strong>
          <span>MongoDB collections</span>
        </div>
        <div className="stat-card glass-card">
          <strong>3</strong>
          <span>Adaptive risk levels</span>
        </div>
        <div className="stat-card glass-card">
          <strong>2</strong>
          <span>Verification challenge types</span>
        </div>
        <div className="stat-card glass-card">
          <strong>24/7</strong>
          <span>Security monitoring concept</span>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Core Features</p>
          <h2>Built like a real-world authentication platform</h2>
          <p>
            The system combines secure login fundamentals with adaptive security mechanisms that
            respond to context and suspicious behavior.
          </p>
        </div>

        <div className="card-grid three-col">
          {capabilityCards.map((card) => (
            <article key={card.title} className="glass-card info-card">
              <h3>{card.title}</h3>
              <p>{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section split-layout">
        <div className="glass-card info-card wide-card">
          <p className="eyebrow">System Workflow</p>
          <h2>How the authentication journey works</h2>
          <div className="timeline-list">
            {workflowSteps.map((step, index) => (
              <div key={step} className="timeline-item">
                <div className="timeline-badge">0{index + 1}</div>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card info-card wide-card">
          <p className="eyebrow">Project Modules</p>
          <h2>Academic-friendly implementation</h2>
          <ul className="feature-list compact-list">
            {projectHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <p className="eyebrow">Use Cases</p>
          <h2>Designed for secure digital services</h2>
        </div>

        <div className="card-grid two-col">
          <article className="glass-card info-card">
            <h3>Banking and FinTech</h3>
            <p>
              Helps protect account logins by responding differently to normal and suspicious access
              attempts.
            </p>
          </article>
          <article className="glass-card info-card">
            <h3>University Portals</h3>
            <p>
              Demonstrates secure student and faculty authentication without making every login too
              difficult.
            </p>
          </article>
          <article className="glass-card info-card">
            <h3>Enterprise Admin Panels</h3>
            <p>
              Supports administrative visibility through user monitoring, device logs, and security
              event tracking.
            </p>
          </article>
          <article className="glass-card info-card">
            <h3>E-Commerce Platforms</h3>
            <p>
              Adds stronger protection for customer accounts while keeping the login experience
              smooth in low-risk situations.
            </p>
          </article>
        </div>
      </section>

      <section className="cta-band glass-card">
        <div>
          <p className="eyebrow">Project Demo</p>
          <h2>Explore registration, adaptive login, and security dashboards</h2>
          <p>
            Start as a user, test medium and high-risk flows, and review logs from the admin panel.
          </p>
        </div>
        <div className="hero-actions">
          <Link to="/register" className="primary-button">
            Start Demo
          </Link>
          <Link to="/login" className="secondary-button">
            Open Login
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
