const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const securityRoutes = require("./routes/securityRoutes");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ message: "Advanced 2FA backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/security", securityRoutes);

module.exports = app;
