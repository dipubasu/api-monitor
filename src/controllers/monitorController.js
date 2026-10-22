const { detectBatch } = require("../services/anomalyDetector");
const { generateAlertMessage } = require("../services/alertService");
const { upsertAnomaly } = require("../models/anomalyModel");
const logger = require("../utils/logger");

async function handleMonitor(req, res) {
  const records = req.body;

  if (!Array.isArray(records)) {
    return res.status(400).json({
      error: "Request body must be a JSON array of API response records.",
    });
  }

  if (records.length === 0) {
    return res.status(400).json({
      error: "Request body array must not be empty.",
    });
  }

  const results = detectBatch(records);

  const summary = {
    total_checked: results.length,
    anomalies_found: 0,
    new_alerts: 0,
    updated_alerts: 0,
    alerts: [],
  };

  const anomalyResults = results.filter((r) => r.is_anomaly);

  const alertPromises = [];

  for (const result of anomalyResults) {
    for (const issue of result.issues) {
      alertPromises.push(
        (async () => {
          try {
            const { message, source } = await generateAlertMessage(
              result.api_name,
              issue,
              result.metrics
            );

            const { id, isNew } = upsertAnomaly({
              apiName: result.api_name,
              issueType: issue.type,
              severity: issue.severity,
              message,
              source,
              metrics: result.metrics,
            });

            return {
              id,
              api_name: result.api_name,
              issue_type: issue.type,
              severity: issue.severity,
              message,
              source,
              isNew,
            };
          } catch (err) {
            logger.error(
              `Failed to process alert for ${result.api_name} (${issue.type}): ${err.message}`
            );
            return null;
          }
        })()
      );
    }
  }

  const settled = await Promise.allSettled(alertPromises);

  for (const outcome of settled) {
    if (outcome.status === "fulfilled" && outcome.value) {
      summary.anomalies_found += 1;
      if (outcome.value.isNew) {
        summary.new_alerts += 1;
      } else {
        summary.updated_alerts += 1;
      }
      summary.alerts.push(outcome.value);
    }
  }

  logger.info(
    `Monitor batch processed: ${summary.total_checked} checked, ${summary.anomalies_found} anomalies (${summary.new_alerts} new, ${summary.updated_alerts} updated)`
  );

  res.json(summary);
}

module.exports = { handleMonitor };