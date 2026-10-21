const db = require("./db");

function findActiveAnomaly(apiName, issueType) {
  const stmt = db.prepare(`
    SELECT * FROM anomalies
    WHERE api_name = ? AND issue_type = ? AND status = 'active'
    LIMIT 1
  `);
  return stmt.get(apiName, issueType);
}

function insertAnomaly({
  apiName,
  issueType,
  severity,
  message,
  source,
  metrics,
}) {
  const stmt = db.prepare(`
    INSERT INTO anomalies
      (api_name, issue_type, severity, message, source, status, occurrence_count, metrics_json, created_at, last_seen_at)
    VALUES
      (?, ?, ?, ?, ?, 'active', 1, ?, datetime('now'), datetime('now'))
  `);
  const result = stmt.run(
    apiName,
    issueType,
    severity,
    message,
    source,
    JSON.stringify(metrics || {})
  );
  return result.lastInsertRowid;
}

function incrementOccurrence(id, { severity, message, source, metrics }) {
  const stmt = db.prepare(`
    UPDATE anomalies
    SET occurrence_count = occurrence_count + 1,
        severity = ?,
        message = ?,
        source = ?,
        metrics_json = ?,
        last_seen_at = datetime('now')
    WHERE id = ?
  `);
  stmt.run(severity, message, source, JSON.stringify(metrics || {}), id);
}

function upsertAnomaly({ apiName, issueType, severity, message, source, metrics }) {
  const existing = findActiveAnomaly(apiName, issueType);

  if (existing) {
    incrementOccurrence(existing.id, { severity, message, source, metrics });
    return { id: existing.id, isNew: false };
  }

  const id = insertAnomaly({
    apiName,
    issueType,
    severity,
    message,
    source,
    metrics,
  });
  return { id, isNew: true };
}

function getActiveAnomalies() {
  const stmt = db.prepare(`
    SELECT * FROM anomalies
    WHERE status = 'active'
    ORDER BY last_seen_at DESC
  `);
  return stmt.all();
}

function resolveAnomaly(id) {
  const stmt = db.prepare(`
    UPDATE anomalies SET status = 'resolved' WHERE id = ?
  `);
  const result = stmt.run(id);
  return result.changes > 0;
}

module.exports = {
  findActiveAnomaly,
  insertAnomaly,
  incrementOccurrence,
  upsertAnomaly,
  getActiveAnomalies,
  resolveAnomaly,
};