const crypto = require("crypto");

function buildFingerprint(deviceInfo = {}) {
  const rawFingerprint = [
    deviceInfo.browser || "unknown-browser",
    deviceInfo.os || "unknown-os",
    deviceInfo.screenResolution || "unknown-resolution",
    deviceInfo.userAgent || "unknown-agent"
  ].join("|");

  return crypto.createHash("sha256").update(rawFingerprint).digest("hex");
}

function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown-ip"
  );
}

module.exports = {
  buildFingerprint,
  getClientIp
};
