function shuffleArray(array) {
  const list = [...array];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

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

function buildEncodedOtp({ rawOtp, deviceCode, ipSuffix, timestampCode, shuffle = true }) {
  const components = [rawOtp, deviceCode, `IP${ipSuffix}`, `T${timestampCode}`];
  const finalComponents = shuffle ? shuffleArray(components) : components;
  return finalComponents.join("-");
}

function parseEncodedOtp(encodedOtp = "") {
  const parts = encodedOtp.split("-").map((p) => p.trim());
  if (parts.length !== 4) {
    return null;
  }

  let rawOtp = null;
  let deviceCode = null;
  let ipSuffix = null;
  let timestampCode = null;

  for (const part of parts) {
    if (/^IP\d{2}$/i.test(part)) {
      ipSuffix = part.slice(2);
    } else if (/^T\d{2}$/i.test(part)) {
      timestampCode = part.slice(1);
    } else if (/^(WIN|ANDR|IOS|UNKN)$/i.test(part)) {
      deviceCode = part.toUpperCase();
    } else if (/^[A-Z0-9]{4}$/i.test(part)) {
      rawOtp = part.toUpperCase();
    }
  }

  if (!rawOtp || !deviceCode || !ipSuffix || !timestampCode) {
    return null;
  }

  return {
    rawOtp,
    deviceCode,
    ipSuffix,
    timestampCode
  };
}

function generateContextualOtp(deviceInfo, ipAddress) {
  const device = detectDeviceType(deviceInfo);
  const deviceCode = mapDeviceCode(device);
  const rawOtp = generateRawOtp();
  const timestamp = new Date();
  const timestampCode = getTimestampCode(timestamp);
  const ipSuffix = getIpSuffix(ipAddress);

  // Dynamically shuffle OTP components every single time
  const otp = buildEncodedOtp({
    rawOtp,
    deviceCode,
    ipSuffix,
    timestampCode,
    shuffle: true
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

