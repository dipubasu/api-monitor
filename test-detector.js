const fs = require("fs");
const path = require("path");
const { detectBatch } = require("./src/services/anomalyDetector");

const samplePath = path.join(__dirname, "data", "sample.json");
const rawData = fs.readFileSync(samplePath, "utf-8");
const records = JSON.parse(rawData);

const results = detectBatch(records);

console.log(JSON.stringify(results, null, 2));