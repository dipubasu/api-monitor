const { buildFallbackMessage } = require("./src/services/alertService");
const { detectBatch } = require("./src/services/anomalyDetector");
const fs = require("fs");
const path = require("path");

const samplePath = path.join(__dirname, "data", "sample.json");
const records = JSON.parse(fs.readFileSync(samplePath, "utf-8"));

const results = detectBatch(records);

for (const result of results) {
  if (result.is_anomaly) {
    console.log(`\nAPI: ${result.api_name}`);
    for (const issue of result.issues) {
      const message = buildFallbackMessage(result.api_name, issue, result.metrics);
      console.log(`  [${issue.severity}] ${message}`);
    }
  }
}