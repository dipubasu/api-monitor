const express = require("express");
const path = require("path");
const cors = require("cors");
const logger = require("./utils/logger");
const monitorRoutes = require("./routes/monitorRoutes");
const alertRoutes = require("./routes/alertRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(monitorRoutes);
app.use(alertRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;