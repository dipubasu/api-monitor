const SAMPLE_DATA = [
  {
    api_name: "PatientDataAPI",
    response_time_ms: 1200,
    status_code: 200,
    records_returned: 50,
  },
  {
    api_name: "AppointmentAPI",
    response_time_ms: 5500,
    status_code: 500,
    records_returned: 0,
  },
  {
    api_name: "BillingAPI",
    response_time_ms: 2600,
    status_code: 200,
    records_returned: 20,
  },
  {
    api_name: "LabResultsAPI",
    response_time_ms: 900,
    status_code: 404,
    records_returned: 0,
  },
  {
    api_name: "PharmacyAPI",
    response_time_ms: 1100,
    status_code: 200,
  },
];

const alertListEl = document.getElementById("alertList");
const totalCountEl = document.getElementById("totalCount");
const criticalCountEl = document.getElementById("criticalCount");
const highCountEl = document.getElementById("highCount");
const mediumCountEl = document.getElementById("mediumCount");
const sendSampleBtn = document.getElementById("sendSampleBtn");

function formatTime(isoLikeString) {
  const date = new Date(isoLikeString.replace(" ", "T") + "Z");
  return date.toLocaleString();
}

function renderAlerts(alerts) {
  if (alerts.length === 0) {
    alertListEl.innerHTML = `<p class="empty-state">No active alerts. All systems normal.</p>`;
    updateSummary(alerts);
    return;
  }

  alertListEl.innerHTML = alerts
    .map((alert) => {
      return `
        <div class="alert-item ${alert.severity}">
          <div class="alert-top">
            <span class="alert-api-name">${alert.api_name}</span>
            <span class="badge ${alert.severity}">${alert.severity}</span>
          </div>
          <p class="alert-message">${alert.message}</p>
          <div class="alert-meta">
            <span>Issue: ${alert.issue_type}</span>
            <span>Occurrences: ${alert.occurrence_count}</span>
            <span>Last seen: ${formatTime(alert.last_seen_at)}</span>
            <span class="source-tag">${alert.source}</span>
          </div>
        </div>
      `;
    })
    .join("");

  updateSummary(alerts);
}

function updateSummary(alerts) {
  totalCountEl.textContent = alerts.length;
  criticalCountEl.textContent = alerts.filter((a) => a.severity === "critical").length;
  highCountEl.textContent = alerts.filter((a) => a.severity === "high").length;
  mediumCountEl.textContent = alerts.filter((a) => a.severity === "medium").length;
}

async function loadAlerts() {
  try {
    const res = await fetch("/alerts");
    const data = await res.json();
    renderAlerts(data.alerts || []);
  } catch (err) {
    alertListEl.innerHTML = `<p class="empty-state">Failed to load alerts: ${err.message}</p>`;
  }
}

async function sendSampleData() {
  sendSampleBtn.disabled = true;
  sendSampleBtn.textContent = "Sending...";

  try {
    await fetch("/monitor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(SAMPLE_DATA),
    });
    await loadAlerts();
  } catch (err) {
    alert("Failed to send sample data: " + err.message);
  } finally {
    sendSampleBtn.disabled = false;
    sendSampleBtn.textContent = "Send Sample Data";
  }
}

sendSampleBtn.addEventListener("click", sendSampleData);

loadAlerts();
setInterval(loadAlerts, 10000);