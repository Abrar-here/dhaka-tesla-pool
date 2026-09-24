const express = require("express");

function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "dhaka-tesla-pool-api" });
  });

  return app;
}

module.exports = { createApp };
