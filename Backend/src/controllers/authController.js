const bcrypt = require("bcrypt");
const User = require("../models/User");
const Device = require("../models/Device");
const LoginHistory = require("../models/LoginHistory");
const SecurityLog = require("../models/SecurityLog");
const { buildFingerprint, getClientIp } = require("../utils/deviceUtils");
const { calculateRisk } = require("../utils/riskEngine");
const {
  generatePendingToken,
  verifyPendingToken
} = require("../utils/tokenUtils");
const { createSecurityLog } = require("../utils/logger");
const {
  buildEncodedOtp,
  generateContextualOtp,
  mapDeviceCode,
  parseEncodedOtp
} = require("../utils/contextualOtp");

const PATTERN_POOL = ["shield", "eye", "lock", "orb", "pulse", "matrix"];

function generatePattern() {
  const shuffled = [...PATTERN_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

function isUnusualLoginTime() {
  const currentHour = new Date().getHours();
  return currentHour >= 0 && currentHour < 5;
}

function regenerateSession(req) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

function saveSession(req) {
  return new Promise((resolve, reject) => {
    req.session.save((error) => {
      if (error) {
        return reject(error);
      }

      return resolve();
    });
  });
}

async function analyzeRisk(req, res) {
  try {
    const { email, deviceInfo, location } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    const fingerprintHash = buildFingerprint(deviceInfo);
    const knownDevice = user
      ? await Device.findOne({ userId: user._id, fingerprintHash })
      : null;

    const result = calculateRisk({
      isTrustedDevice: Boolean(knownDevice && knownDevice.trusted),
      location,
      failedAttempts: user?.failedLoginAttempts || 0,
      unusualLoginTime: isUnusualLoginTime()
    });

    return res.json({
      ...result,
      deviceWarning: knownDevice?.trusted
        ? null
        : "This device feels new. Please verify your identity."
    });
  } catch (error) {
    return res.status(500).json({ message: "Risk analysis failed.", error: error.message });
  }
}

async function registerUser(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const normalizedEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      username,
      email: normalizedEmail,
      password: hashedPassword,
      role: "user"
    });

    await createSecurityLog({
      userId: user._id,
      email: user.email,
      eventType: "REGISTER_SUCCESS",
      message: "User registered successfully."
    });

    return res.status(201).json({ message: "Registration successful." });
  } catch (error) {
    return res.status(500).json({ message: "Registration failed.", error: error.message });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password, deviceInfo, location } = req.body;
    const normalizedEmail = email?.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    const fingerprintHash = buildFingerprint(deviceInfo);
    const clientIp = getClientIp(req);

    if (!user) {
      await createSecurityLog({
        email: normalizedEmail,
        eventType: "LOGIN_FAILED",
        severity: "warning",
        message: "Login attempt with unknown email.",
        metadata: { location, fingerprintHash, clientIp }
      });

      return res.status(401).json({ message: "Invalid email or password." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      user.failedLoginAttempts += 1;
      await user.save();

      await LoginHistory.create({
        userId: user._id,
        email: user.email,
        status: "FAILED_PASSWORD",
        riskLevel: "unknown",
        riskScore: 0,
        location,
        ipAddress: clientIp,
        deviceFingerprint: fingerprintHash,
        challengeType: "password"
      });

      await createSecurityLog({
        userId: user._id,
        email: user.email,
        eventType: "PASSWORD_FAILURE",
        severity: "warning",
        message: "Incorrect password submitted.",
        metadata: { failedLoginAttempts: user.failedLoginAttempts, fingerprintHash, location }
      });

      return res.status(401).json({ message: "Invalid email or password." });
    }

    const knownDevice = await Device.findOne({ userId: user._id, fingerprintHash });
    const isTrustedDevice = Boolean(knownDevice && knownDevice.trusted);

    const { riskScore, riskLevel, reasons } = calculateRisk({
      isTrustedDevice,
      location,
      failedAttempts: user.failedLoginAttempts,
      unusualLoginTime: isUnusualLoginTime()
    });

    const sessionId = `${user._id}-${Date.now()}`;
    const pendingAuth = {
      sessionId,
      fingerprintHash,
      ipAddress: clientIp,
      location,
      riskLevel,
      riskScore,
      challengeType: "otp",
      patternSequence: generatePattern(),
      otpHash: null,
      rawOtp: null,
      deviceType: null,
      deviceCode: null,
      ipSuffix: null,
      timestampCode: null,
      otpIssuedAt: null,
      attempts: 0,
      honeypotTriggered: false,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    };

    const generatedOtp = generateContextualOtp(deviceInfo, clientIp);
    pendingAuth.rawOtp = generatedOtp.rawOtp;
    pendingAuth.deviceType = generatedOtp.device;
    pendingAuth.deviceCode = generatedOtp.deviceCode;
    pendingAuth.ipSuffix = generatedOtp.ipSuffix;
    pendingAuth.timestampCode = generatedOtp.timestampCode;
    pendingAuth.otpIssuedAt = generatedOtp.timestamp;
    pendingAuth.otpHash = await bcrypt.hash(generatedOtp.otp, 10);

    const contextualOtp = generatedOtp.otp;
    const otpMeta = {
      otp: generatedOtp.otp,
      rawOtp: generatedOtp.rawOtp,
      device: generatedOtp.device,
      ip: generatedOtp.ip,
      timestamp: Number(generatedOtp.timestampCode)
    };

    user.pendingAuth = pendingAuth;
    user.failedLoginAttempts = 0;
    await user.save();

    await LoginHistory.create({
      userId: user._id,
      email: user.email,
      status: "CHALLENGE_REQUIRED",
      riskLevel,
      riskScore,
      location,
      ipAddress: clientIp,
      deviceFingerprint: fingerprintHash,
      challengeType: pendingAuth.challengeType
    });

    await createSecurityLog({
      userId: user._id,
      email: user.email,
      eventType: "LOGIN_RISK_EVALUATED",
      message: "Login risk evaluation completed.",
      metadata: {
        riskLevel,
        riskScore,
        reasons,
        isTrustedDevice,
        location,
        fingerprintHash,
        ipAddress: clientIp
      }
    });

    await createSecurityLog({
        userId: user._id,
        email: user.email,
        eventType: "CONTEXTUAL_OTP_ISSUED",
        message: "Contextual OTP issued for the current login session.",
        metadata: otpMeta
      });

    const pendingToken = generatePendingToken({
      userId: user._id.toString(),
      sessionId,
      challengeType: pendingAuth.challengeType
    });

    return res.json({
      message: "Login accepted. Complete contextual OTP verification first.",
      nextStep: pendingAuth.challengeType,
      pendingToken,
      riskLevel,
      riskScore,
      reasons,
      trustedDevice: isTrustedDevice,
      deviceWarning: isTrustedDevice
        ? null
        : "This device feels new. Please verify your identity.",
      patternHint: `Repeat this pattern: ${pendingAuth.patternSequence.join(" -> ")}`,
      patternPool: PATTERN_POOL,
      otp: contextualOtp,
      rawOtp: otpMeta?.rawOtp || null,
      device: otpMeta?.device || null,
      ip: otpMeta?.ip || null,
      timestamp: otpMeta?.timestamp || null
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed.", error: error.message });
  }
}

async function verifyPattern(req, res) {
  try {
    const { pendingToken, selectedPattern, deviceInfo } = req.body;
    const decoded = verifyPendingToken(pendingToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.pendingAuth || user.pendingAuth.sessionId !== decoded.sessionId) {
      return res.status(401).json({ message: "Verification session expired." });
    }

    const expected = user.pendingAuth.patternSequence.join(",");
    const received = (selectedPattern || []).join(",");

    if (expected !== received) {
      await createSecurityLog({
        userId: user._id,
        email: user.email,
        eventType: "PATTERN_FAILURE",
        severity: "warning",
        message: "Visual pattern verification failed.",
        metadata: { expected, received }
      });

      return res.status(401).json({ message: "Pattern verification failed." });
    }

    const fingerprintHash = buildFingerprint(deviceInfo);

    await upsertTrustedDevice({ user, deviceInfo, fingerprintHash });
    user.pendingAuth = null;
    await user.save();
    await regenerateSession(req);
    req.session.user = {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,
      role: user.role || "user"
    };
    await saveSession(req);

    await createSecurityLog({
      userId: user._id,
      email: user.email,
      eventType: "PATTERN_SUCCESS",
      message: "Visual pattern verification successful."
    });

    return res.json({
      message: "Pattern verified successfully.",
      user: formatUser(user),
      nextStep: user.role === "admin" ? "admin" : "dashboard"
    });
  } catch (error) {
    return res.status(500).json({ message: "Pattern verification failed.", error: error.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { pendingToken, otp, deviceInfo } = req.body;
    const decoded = verifyPendingToken(pendingToken);
    const user = await User.findById(decoded.userId);

    if (!user || !user.pendingAuth || user.pendingAuth.sessionId !== decoded.sessionId) {
      return res.status(401).json({ message: "OTP session expired." });
    }

    if (user.pendingAuth.honeypotTriggered) {
      return res.status(403).json({
        message: "Suspicious behavior detected.",
        nextStep: "honeypot"
      });
    }

    if (!user.pendingAuth.otpIssuedAt || new Date(user.pendingAuth.expiresAt) < new Date()) {
      user.pendingAuth = null;
      await user.save();
      return res.status(401).json({ message: "Contextual OTP expired. Please log in again." });
    }

    const parsedOtp = parseEncodedOtp((otp || "").toUpperCase());

    if (!parsedOtp) {
      return res.status(400).json({ message: "Invalid OTP format. Use RAW-DEVICE-IPXX-TYY format." });
    }

    const fingerprintHash = buildFingerprint(deviceInfo);
    const clientIp = getClientIp(req);
    const expectedDeviceCode = mapDeviceCode(user.pendingAuth.deviceType);

    if (fingerprintHash !== user.pendingAuth.fingerprintHash || clientIp !== user.pendingAuth.ipAddress) {
      await createSecurityLog({
        userId: user._id,
        email: user.email,
        eventType: "OTP_CONTEXT_MISMATCH",
        severity: "warning",
        message: "Contextual OTP failed because device or IP context changed.",
        metadata: {
          expectedFingerprint: user.pendingAuth.fingerprintHash,
          actualFingerprint: fingerprintHash,
          expectedIp: user.pendingAuth.ipAddress,
          actualIp: clientIp
        }
      });

      return res.status(401).json({ message: "Context mismatch detected. OTP verification rejected." });
    }

    if (
      parsedOtp.rawOtp !== user.pendingAuth.rawOtp ||
      parsedOtp.deviceCode !== expectedDeviceCode ||
      parsedOtp.ipSuffix !== user.pendingAuth.ipSuffix ||
      parsedOtp.timestampCode !== user.pendingAuth.timestampCode
    ) {
      user.pendingAuth.attempts += 1;
      await user.save();
      return res.status(401).json({ message: "Contextual OTP details do not match." });
    }

    const expectedOtp = buildEncodedOtp({
      rawOtp: user.pendingAuth.rawOtp,
      deviceCode: expectedDeviceCode,
      ipSuffix: user.pendingAuth.ipSuffix,
      timestampCode: user.pendingAuth.timestampCode
    });
    const otpMatches = await bcrypt.compare(expectedOtp, user.pendingAuth.otpHash || "");

    if (!otpMatches) {
      user.pendingAuth.attempts += 1;

      if (user.pendingAuth.attempts >= 3) {
        user.pendingAuth.honeypotTriggered = true;
        await user.save();

        await createSecurityLog({
          userId: user._id,
          email: user.email,
          eventType: "HONEYPOT_TRIGGERED",
          severity: "critical",
          message: "Repeated OTP failures triggered honeypot flow.",
          metadata: { attempts: user.pendingAuth.attempts, fingerprintHash }
        });

        return res.status(403).json({
          message: "Too many failed OTP attempts.",
          nextStep: "honeypot"
        });
      }

      await user.save();

      await createSecurityLog({
        userId: user._id,
        email: user.email,
        eventType: "OTP_FAILURE",
        severity: "warning",
        message: "Contextual OTP verification failed.",
        metadata: { attempts: user.pendingAuth.attempts, fingerprintHash }
      });

      return res.status(401).json({
        message: "Invalid contextual OTP.",
        attempts: user.pendingAuth.attempts
      });
    }

    await createSecurityLog({
      userId: user._id,
      email: user.email,
      eventType: "OTP_SUCCESS",
      message: "Contextual OTP verified successfully."
    });

    return res.json({
      message: "Contextual OTP verified successfully. Please complete pattern verification.",
      nextStep: "pattern",
      patternHint: `Repeat this pattern: ${user.pendingAuth.patternSequence.join(" -> ")}`,
      patternPool: PATTERN_POOL
    });
  } catch (error) {
    return res.status(500).json({ message: "OTP verification failed.", error: error.message });
  }
}

async function submitHoneypotOtp(req, res) {
  try {
    const { email, fakeOtp, deviceInfo } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    const fingerprintHash = buildFingerprint(deviceInfo);

    await createSecurityLog({
      userId: user?._id,
      email,
      eventType: "HONEYPOT_INTERACTION",
      severity: "critical",
      message: "Fake OTP screen was used by a suspicious actor.",
      metadata: { fakeOtp, fingerprintHash }
    });

    return res.json({
      message: "Verification pending. Security team has been notified."
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to submit honeypot OTP.", error: error.message });
  }
}

async function logoutUser(req, res) {
  try {
    if (!req.session) {
      return res.json({ message: "Logged out successfully." });
    }

    req.session.destroy((error) => {
      if (error) {
        return res.status(500).json({ message: "Logout failed.", error: error.message });
      }

      res.clearCookie(process.env.SESSION_NAME || "advanced.sid");
      return res.json({ message: "Logged out successfully." });
    });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed.", error: error.message });
  }
}

async function getCurrentUser(req, res) {
  const user = await User.findById(req.user.userId).select("-password -pendingAuth.otpHash");

  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  return res.json({ user: formatUser(user) });
}

async function getSecurityOverview(req, res) {
  try {
    const [devices, loginHistory, securityLogs] = await Promise.all([
      Device.find({ userId: req.user.userId }).sort({ updatedAt: -1 }),
      LoginHistory.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(10),
      SecurityLog.find({ userId: req.user.userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    return res.json({
      devices,
      loginHistory,
      securityLogs
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load security overview.", error: error.message });
  }
}

async function getAdminOverview(req, res) {
  try {
    const [users, devices, loginHistory, securityLogs] = await Promise.all([
      User.find().select("-password -pendingAuth.otpHash").sort({ createdAt: -1 }).limit(20),
      Device.find().sort({ updatedAt: -1 }).limit(20),
      LoginHistory.find().sort({ createdAt: -1 }).limit(20),
      SecurityLog.find().sort({ createdAt: -1 }).limit(20)
    ]);

    return res.json({ users, devices, loginHistory, securityLogs });
  } catch (error) {
    return res.status(500).json({ message: "Unable to load admin overview.", error: error.message });
  }
}

async function deleteUserByAdmin(req, res) {
  try {
    const { userId } = req.params;
    const userToDelete = await User.findById(userId);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found." });
    }

    if (userToDelete.role === "admin") {
      return res.status(403).json({ message: "Admin accounts cannot be removed." });
    }

    await Promise.all([
      Device.deleteMany({ userId }),
      LoginHistory.deleteMany({ userId }),
      SecurityLog.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    await createSecurityLog({
      userId: req.user.userId,
      email: req.user.email,
      eventType: "ADMIN_USER_REMOVED",
      severity: "warning",
      message: "An admin removed a user account.",
      metadata: { removedUserId: userId, removedUserEmail: userToDelete.email }
    });

    return res.json({ message: "User removed successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Unable to remove user.", error: error.message });
  }
}

async function upsertTrustedDevice({ user, deviceInfo, fingerprintHash }) {
  await Device.findOneAndUpdate(
    { userId: user._id, fingerprintHash },
    {
      userId: user._id,
      fingerprintHash,
      browser: deviceInfo?.browser,
      os: deviceInfo?.os,
      screenResolution: deviceInfo?.screenResolution,
      userAgent: deviceInfo?.userAgent,
      trusted: true,
      lastSeenAt: new Date()
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

function formatUser(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role || "user"
  };
}

module.exports = {
  registerUser,
  loginUser,
  analyzeRisk,
  verifyPattern,
  verifyOtp,
  submitHoneypotOtp,
  logoutUser,
  getCurrentUser,
  getSecurityOverview,
  getAdminOverview,
  deleteUserByAdmin
};
