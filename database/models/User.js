const mongoose = require("mongoose");

const pendingAuthSchema = new mongoose.Schema(
  {
    sessionId: String,
    fingerprintHash: String,
    location: String,
    riskLevel: String,
    riskScore: Number,
    challengeType: String,
    patternSequence: [String],
    otpHash: String,
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
