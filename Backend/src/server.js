const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDatabase = require("./config/db");
const seedAdmin = require("./utils/seedAdmin");

const PORT = process.env.PORT || 5000;

connectDatabase().then(async () => {
  await seedAdmin();

  app.listen(PORT, () => {
    console.log(`Server running on port At ${PORT}`);
  });
});
