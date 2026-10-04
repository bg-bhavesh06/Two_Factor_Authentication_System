const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    email: String,
    eventType: String,
    severity: String,
    message: String,
    metadata: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true,
    collection: "SecurityLogs"
  }
);

module.exports = mongoose.model("SecurityLog", securityLogSchema);
