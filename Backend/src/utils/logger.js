const SecurityLog = require("../models/SecurityLog");

async function createSecurityLog({
  userId,
  email,
  eventType,
  severity = "info",
  message,
  metadata = {}
}) {
  await SecurityLog.create({
    userId,
    email,
    eventType,
    severity,
    message,
    metadata
  });
}

module.exports = { createSecurityLog };
