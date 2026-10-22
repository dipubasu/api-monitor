const { callGroq } = require("./groqClient");

function buildFallbackMessage(apiName, issue, metrics) {
  const statusCode = metrics && metrics.status_code;
  const responseTime = metrics && metrics.response_time_ms;
  const recordsReturned = metrics && metrics.records_returned;

  switch (issue.type) {
    case "server_error":
      return `${apiName} failed with status ${statusCode} and returned ${recordsReturned ?? 0} records. Possible outage or data issue.`;

    case "client_error":
      return `${apiName} responded with client error status ${statusCode}. This may indicate a broken request or invalid endpoint.`;

    case "high_response_time":
      return `${apiName} is responding slowly (${responseTime}ms), well above the acceptable threshold. This may affect downstream services.`;

    case "slow_response_time":
      return `${apiName} response time (${responseTime}ms) is higher than normal. Monitor for further degradation.`;

    case "zero_records":
      return `${apiName} returned 0 records with status ${statusCode}. Possible outage or data issue.`;

    case "missing_records":
      return `${apiName} response did not include a records_returned field. This may indicate a malformed response.`;

    case "invalid_data":
      return `${apiName} sent an invalid monitoring payload: ${issue.detail}`;

    default:
      return `${apiName} reported an anomaly: ${issue.detail}`;
  }
}

function buildPrompt(apiName, issue, metrics) {
  const statusCode = metrics && metrics.status_code;
  const responseTime = metrics && metrics.response_time_ms;
  const recordsReturned = metrics && metrics.records_returned;

  return `An API monitoring system detected an issue.
API name: ${apiName}
Issue type: ${issue.type}
Severity: ${issue.severity}
Status code: ${statusCode ?? "N/A"}
Response time (ms): ${responseTime ?? "N/A"}
Records returned: ${recordsReturned ?? "N/A"}
Detail: ${issue.detail}

Write a short, human-readable alert message (1-2 sentences) for a monitoring dashboard, explaining what went wrong and the likely cause. Do not repeat the raw field names, write it as natural text.`;
}

async function generateAlertMessage(apiName, issue, metrics) {
  try {
    const prompt = buildPrompt(apiName, issue, metrics);
    const aiMessage = await callGroq(prompt);
    return { message: aiMessage, source: "ai" };
  } catch (err) {
    const fallbackMessage = buildFallbackMessage(apiName, issue, metrics);
    return { message: fallbackMessage, source: "fallback" };
  }
}

module.exports = { buildFallbackMessage, generateAlertMessage };