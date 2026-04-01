const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    fingerprintHash: {
      type: String,
      required: true
    },
    browser: String,
    os: String,
    screenResolution: String,
    userAgent: String,
    trusted: {
      type: Boolean,
      default: false
    },
    lastSeenAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    collection: "Devices"
  }
);

module.exports = mongoose.model("Device", deviceSchema);
