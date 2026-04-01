function generateRawOtp() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let otp = "";

  for (let index = 0; index < 4; index += 1) {
    otp += chars[Math.floor(Math.random() * chars.length)];
  }

  return otp;
}

function detectDeviceType(deviceInfo = {}) {
  const raw = `${deviceInfo.os || ""} ${deviceInfo.userAgent || ""}`.toLowerCase();

  if (raw.includes("iphone") || raw.includes("ios")) {
    return "iPhone";
  }

  if (raw.includes("android")) {
    return "Android";
  }

  if (raw.includes("windows") || raw.includes("win")) {
    return "Windows";
  }

  return "Unknown";
}

function mapDeviceCode(deviceType) {
  if (deviceType === "Windows") {
    return "WIN";
  }

  if (deviceType === "Android") {
    return "ANDR";
  }

  if (deviceType === "iPhone") {
    return "IOS";
  }

  return "UNKN";
}

function getIpSuffix(ipAddress = "") {
  const digits = ipAddress.replace(/\D/g, "");
  return digits.slice(-2).padStart(2, "0");
}

function maskIpAddress(ipAddress = "") {
  const match = ipAddress.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/);

  if (!match) {
    return `unknown.xxx.${getIpSuffix(ipAddress)}`;
  }

  return `${match[1]}.${match[2]}.xxx.${match[4]}`;
}

function getTimestampCode(date = new Date()) {
  return String(date.getTime()).slice(-2);
}

function buildEncodedOtp({ rawOtp, deviceCode, ipSuffix, timestampCode }) {
  return `${rawOtp}-${deviceCode}-IP${ipSuffix}-T${timestampCode}`;
}

function parseEncodedOtp(encodedOtp = "") {
  const match = encodedOtp.match(/^([A-Z0-9]{4})-([A-Z]+)-IP(\d{2})-T(\d{2})$/);

  if (!match) {
    return null;
  }

  return {
    rawOtp: match[1],
    deviceCode: match[2],
    ipSuffix: match[3],
    timestampCode: match[4]
  };
}

function generateContextualOtp(deviceInfo, ipAddress) {
  const device = detectDeviceType(deviceInfo);
  const deviceCode = mapDeviceCode(device);
  const rawOtp = generateRawOtp();
  const timestamp = new Date();
  const timestampCode = getTimestampCode(timestamp);
  const ipSuffix = getIpSuffix(ipAddress);
  const otp = buildEncodedOtp({
    rawOtp,
    deviceCode,
    ipSuffix,
    timestampCode
  });

  return {
    otp,
    rawOtp,
    device,
    deviceCode,
    ip: maskIpAddress(ipAddress),
    ipSuffix,
    timestamp,
    timestampCode
  };
}

module.exports = {
  buildEncodedOtp,
  generateContextualOtp,
  mapDeviceCode,
  parseEncodedOtp
};
