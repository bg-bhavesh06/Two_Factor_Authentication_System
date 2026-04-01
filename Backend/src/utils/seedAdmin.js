const bcrypt = require("bcrypt");
const User = require("../models/User");

async function seedAdmin() {
  const adminEmail = "admin@system.com";
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    return;
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  await User.create({
    username: "System Admin",
    email: adminEmail,
    password: hashedPassword,
    role: "admin"
  });

  console.log("Default admin created: admin@system.com / Admin@123");
}

module.exports = seedAdmin;
