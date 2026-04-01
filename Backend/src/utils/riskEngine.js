function calculateRisk({ isTrustedDevice, location, failedAttempts, unusualLoginTime = false }) {
  let score = 0;
  const reasons = [];

  if (!isTrustedDevice) {
    score += 40;
    reasons.push("New or untrusted device detected.");
  }

  if (location === "Unknown" || location === "Suspicious") {
    score += 25;
    reasons.push("Location looks unusual.");
  }

  if (unusualLoginTime) {
    score += 15;
    reasons.push("Login time is unusual.");
  }

  if (failedAttempts > 0) {
    const failedAttemptsScore = Math.min(failedAttempts * 15, 45);
    score += failedAttemptsScore;
    reasons.push(`Recent failed attempts: ${failedAttempts}`);
  }

  let riskLevel = "low";

  if (score >= 70) {
    riskLevel = "high";
  } else if (score >= 40) {
    riskLevel = "medium";
  }

  return { riskScore: score, riskLevel, reasons };
}

module.exports = { calculateRisk };
