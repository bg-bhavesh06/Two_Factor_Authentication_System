const mongoose = require("mongoose");

const pendingAuthSchema = new mongoose.Schema(
  {
    sessionId: String,
    fingerprintHash: String,
    ipAddress: String,
    location: String,
    riskLevel: String,
    riskScore: Number,
    challengeType: String,
    patternSequence: [String],
    otpHash: String,
    rawOtp: String,
    deviceType: String,
    deviceCode: String,
    ipSuffix: String,
    timestampCode: String,
    otpIssuedAt: Date,
    attempts: {
      type: Number,
      default: 0
    },
    honeypotTriggered: {
      type: Boolean,
      default: false
    },
    expiresAt: Date
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    pendingAuth: pendingAuthSchema
  },
  {
    timestamps: true,
    collection: "Users"
  }
);

module.exports = mongoose.model("User", userSchema);
