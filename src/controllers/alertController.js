const { getActiveAnomalies } = require("../models/anomalyModel");
const logger = require("../utils/logger");

function handleGetAlerts(req, res) {
  const alerts = getActiveAnomalies().map((row) => ({
    id: row.id,
    api_name: row.api_name,
    issue_type: row.issue_type,
    severity: row.severity,
    message: row.message,
    source: row.source,
    status: row.status,
    occurrence_count: row.occurrence_count,
    metrics: JSON.parse(row.metrics_json || "{}"),
    created_at: row.created_at,
    last_seen_at: row.last_seen_at,
  }));

  logger.info(`GET /alerts returned ${alerts.length} active alert(s)`);

  res.json({ count: alerts.length, alerts });
}

module.exports = { handleGetAlerts };