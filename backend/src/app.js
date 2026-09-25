require("express-async-errors");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const teslaRoutes = require("./routes/teslaRoutes");
const { errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
  app.use(express.json());
  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.get("/health", (req, res) => {
    res.status(200).json({ status: "ok", service: "dhaka-tesla-pool-api" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/teslas", teslaRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: { message: "Route not found" } });
  });

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
