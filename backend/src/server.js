require("dotenv").config();

const { createApp } = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB(process.env.MONGO_URI);
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`[server] Dhaka Tesla Pool API listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
