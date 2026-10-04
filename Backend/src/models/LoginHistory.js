const mongoose = require("mongoose");

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    email: String,
    status: String,
    riskLevel: String,
    riskScore: Number,
    location: String,
    ipAddress: String,
    deviceFingerprint: String,
    challengeType: String
  },
  {
    timestamps: true,
    collection: "LoginHistory"
  }
);

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
