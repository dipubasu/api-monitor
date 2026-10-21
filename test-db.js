const { upsertAnomaly, getActiveAnomalies } = require("./src/models/anomalyModel");

const sampleIssue = {
  apiName: "AppointmentAPI",
  issueType: "server_error",
  severity: "critical",
  message: "AppointmentAPI failed with status 500.",
  source: "fallback",
  metrics: { response_time_ms: 5500, status_code: 500, records_returned: 0 },
};

console.log("--- First insert ---");
const first = upsertAnomaly(sampleIssue);
console.log(first);

console.log("--- Second insert (should increment, not duplicate) ---");
const second = upsertAnomaly(sampleIssue);
console.log(second);

console.log("--- Active anomalies ---");
console.log(getActiveAnomalies());