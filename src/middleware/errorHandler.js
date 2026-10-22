const logger = require("../utils/logger");

function notFoundHandler(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.url}` });
}

function errorHandler(err, req, res, next) {
  logger.error(`Unhandled error on ${req.method} ${req.url}: ${err.message}`);
  res.status(500).json({
    error: "An unexpected error occurred. Please try again later.",
  });
}

module.exports = { notFoundHandler, errorHandler };