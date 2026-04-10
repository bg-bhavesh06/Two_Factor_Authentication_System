const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const authRoutes = require("./routes/authRoutes");
const securityRoutes = require("./routes/securityRoutes");

const app = express();
const isProduction = process.env.NODE_ENV === "production";
const sessionName = process.env.SESSION_NAME || "advanced.sid";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI is required to use MongoDB-backed sessionStore.");
}

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
  })
);
app.use(express.json());
app.use(
  session({
    name: sessionName,
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "Sessions",
      ttl: 2 * 60 * 60,
      autoRemove: "native"
    }),
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 2 * 60 * 60 * 1000
    }
  })
);

app.get("/api/health", (req, res) => {
  res.json({ message: "Advanced 2FA backend is running." });
});

app.use("/api/auth", authRoutes);
app.use("/api/security", securityRoutes);

module.exports = app;
