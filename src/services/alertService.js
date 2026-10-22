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

module.exports = { buildFallbackMessage };