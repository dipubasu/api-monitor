const config = require("../config");

function detectAnomalies(record) {
  const issues = [];

  const apiName = record && record.api_name;
  const responseTime = record && record.response_time_ms;
  const statusCode = record && record.status_code;
  const recordsReturned = record ? record.records_returned : undefined;

  // --- Field validation (missing/invalid basic fields) ---
  if (!apiName || typeof apiName !== "string") {
    issues.push({
      type: "invalid_data",
      severity: "medium",
      detail: "api_name is missing or invalid.",
    });
  }

  if (typeof statusCode !== "number" || Number.isNaN(statusCode)) {
    issues.push({
      type: "invalid_data",
      severity: "medium",
      detail: "status_code is missing or invalid.",
    });
  }

  if (typeof responseTime !== "number" || Number.isNaN(responseTime)) {
    issues.push({
      type: "invalid_data",
      severity: "medium",
      detail: "response_time_ms is missing or invalid.",
    });
  }

  // --- Status code checks ---
  if (typeof statusCode === "number") {
    if (statusCode >= 500) {
      issues.push({
        type: "server_error",
        severity: "critical",
        detail: `API responded with server error status ${statusCode}.`,
      });
    } else if (statusCode >= 400) {
      issues.push({
        type: "client_error",
        severity: "high",
        detail: `API responded with client error status ${statusCode}.`,
      });
    }
  }

  // --- Response time checks ---
  if (typeof responseTime === "number" && !Number.isNaN(responseTime)) {
    if (responseTime > config.thresholds.responseTimeMs.high) {
      issues.push({
        type: "high_response_time",
        severity: "high",
        detail: `Response time ${responseTime}ms exceeds high threshold of ${config.thresholds.responseTimeMs.high}ms.`,
      });
    } else if (responseTime > config.thresholds.responseTimeMs.medium) {
      issues.push({
        type: "slow_response_time",
        severity: "medium",
        detail: `Response time ${responseTime}ms exceeds medium threshold of ${config.thresholds.responseTimeMs.medium}ms.`,
      });
    }
  }

  // --- Records returned checks ---
  if (recordsReturned === undefined || recordsReturned === null) {
    issues.push({
      type: "missing_records",
      severity: "high",
      detail: "records_returned field is missing.",
    });
  } else if (typeof recordsReturned === "number" && recordsReturned === 0) {
    issues.push({
      type: "zero_records",
      severity: "high",
      detail: "API returned zero records.",
    });
  }

  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 };

  let worstSeverity = null;
  for (const issue of issues) {
    if (
      !worstSeverity ||
      severityRank[issue.severity] > severityRank[worstSeverity]
    ) {
      worstSeverity = issue.severity;
    }
  }

  return {
    api_name: apiName || "UnknownAPI",
    is_anomaly: issues.length > 0,
    severity: worstSeverity,
    issues,
    metrics: {
      response_time_ms: responseTime,
      status_code: statusCode,
      records_returned: recordsReturned,
    },
  };
}

function detectBatch(records) {
  if (!Array.isArray(records)) {
    throw new Error("detectBatch expects an array of records.");
  }

  return records.map(detectAnomalies);
}

module.exports = { detectAnomalies, detectBatch };