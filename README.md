# Intelligent API Monitoring & Alert System

A backend system that monitors API health, detects anomalies (slow responses, server errors, missing/zero records), generates human-readable alerts using an LLM (Groq), stores them with deduplication, and displays them on a simple dashboard.

Built as a technical assessment for Care Guide.

---

## Features

- `POST /monitor` — accepts a batch of API response records (JSON array) and runs anomaly detection on each one
- Anomaly detection for:
  - High / slow response time (configurable thresholds)
  - 5xx server errors and 4xx client errors
  - Zero or missing `records_returned`
  - Invalid/malformed input records
- AI-generated alert messages via Groq (`openai/gpt-oss-20b`), with automatic fallback to template-based messages if the AI call fails or no API key is configured
- SQLite storage with deduplication — repeated occurrences of the same issue update a single row (`occurrence_count`, `last_seen_at`) instead of creating duplicate rows
- `GET /alerts` — returns all active anomalies
- `GET /health` — basic health check
- Simple dashboard (plain HTML/CSS/JS) with summary cards, severity badges, and a "Send Sample Data" button
- Centralized error handling (404 + unexpected errors) and Winston-based logging (console + log files)
- Batch processing of alerts using `Promise.allSettled`, so one failed alert doesn't block the rest

---

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** SQLite (via `better-sqlite3`) — file-based, no external account/service required to run this project
- **LLM:** Groq API (model configurable via `.env`)
- **Logging:** Winston
- **Frontend:** Plain HTML, CSS, vanilla JavaScript (served as static files by Express)

---

## Project Structure

```
api-monitor/
├── data/              # sample.json, SQLite database file (auto-created)
├── logs/              # app.log, error.log (auto-created)
├── public/            # frontend (index.html, style.css, app.js)
├── src/
│   ├── config/        # centralized config (port, thresholds, Groq settings)
│   ├── controllers/   # request handlers (monitor, alerts)
│   ├── middleware/     # error handling
│   ├── models/         # SQLite setup + anomaly model (CRUD + dedup logic)
│   ├── routes/         # Express routes
│   ├── services/       # anomaly detector, Groq client, alert message generator
│   └── app.js          # Express app setup
├── server.js          # entry point (starts the server)
├── .env.example       # template for required environment variables
└── README.md
```

---

## Setup & Run Instructions

### Prerequisites

- Node.js v18 or higher (tested on v24)
- npm
- A free Groq API key (optional — the system works without it, using fallback alert messages) from https://console.groq.com/keys

### 1. Clone the repository

```bash
git clone https://github.com/dipubasu/api-monitor.git
cd api-monitor
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env`:

```bash
copy .env.example .env
```

Then open `.env` and fill in your own Groq API key:

```
PORT=3000
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

If you don't have a Groq key, you can leave `GROQ_API_KEY` empty — the system will automatically use fallback template-based alert messages instead of AI-generated ones.

### 4. Run the server

```bash
node server.js
```

You should see:

```
Server running on http://localhost:3000
```

### 5. Open the dashboard

Go to `http://localhost:3000` in your browser. Click **"Send Sample Data"** to send a built-in sample batch and see alerts appear.

---

## API Usage

### POST /monitor

Accepts a JSON array of API response records and runs anomaly detection on each one.

```bash
curl -X POST http://localhost:3000/monitor \
  -H "Content-Type: application/json" \
  -d '[
    { "api_name": "PatientDataAPI", "response_time_ms": 1200, "status_code": 200, "records_returned": 50 },
    { "api_name": "AppointmentAPI", "response_time_ms": 5500, "status_code": 500, "records_returned": 0 }
  ]'
```

Example response:

```json
{
  "total_checked": 2,
  "anomalies_found": 1,
  "new_alerts": 1,
  "updated_alerts": 0,
  "alerts": [
    {
      "id": 1,
      "api_name": "AppointmentAPI",
      "issue_type": "server_error",
      "severity": "critical",
      "message": "AppointmentAPI failed with status 500 and returned 0 records. Possible outage or data issue.",
      "source": "ai",
      "isNew": true
    }
  ]
}
```

### GET /alerts

Returns all currently active anomalies.

```bash
curl http://localhost:3000/alerts
```

### GET /health

Basic health check.

```bash
curl http://localhost:3000/health
```

---

## Architecture & Key Decisions

- **Modular structure:** Routes, controllers, services, and models are separated so each piece has a single responsibility — similar in spirit to keeping separate nodes for separate jobs in an n8n workflow, instead of one giant function doing everything.
- **SQLite over a hosted database:** Chosen so the project can run immediately after `git clone` + `npm install`, with no external database account/setup needed to evaluate it. The schema (`anomalies` table) would map cleanly to Postgres/MongoDB if this were scaled up.
- **AI with fallback:** Alert messages are generated by Groq (LLM), but if the API key is missing or the call fails for any reason (network, rate limit, bad response), the system automatically falls back to a template-based message. This guarantees `POST /monitor` never fails just because the AI call failed.
- **Thresholds in config, not hardcoded:** Response time thresholds (medium/high) and other tunables live in `src/config/index.js`, so they can be adjusted without touching detection logic.
- **Deduplication:** Anomalies are deduplicated by `(api_name, issue_type)` while `status = 'active'`. Repeated occurrences of the same issue increment `occurrence_count` and update `last_seen_at` instead of creating a new row each time — this keeps the alert list clean when the same API keeps failing.
  - **Known limitation:** For the generic `invalid_data` issue type specifically, if a single API record has multiple different validation problems in one batch, they can collapse into a single row because the dedup key isn't granular enough for that case. This does not affect the core required anomaly types (`server_error`, `client_error`, `high_response_time`, `slow_response_time`, `zero_records`, `missing_records`), which are each tracked correctly.
- **Batch processing:** `POST /monitor` processes all records and all detected issues concurrently using `Promise.allSettled`, so if generating or saving one alert fails, it doesn't block or crash the processing of the rest of the batch.
- **Logging:** Winston logs every request and all errors to both the console and log files (`logs/app.log`, `logs/error.log`), which helps with debugging and would be the basis for production monitoring.

---

## Environment Variables

| Variable       | Required | Description                                                   |
|----------------|----------|-----------------------------------------------------------------|
| `PORT`         | No       | Port the server runs on (defaults to 3000)                     |
| `GROQ_API_KEY` | No       | Groq API key for AI-generated alerts. If empty, fallback messages are used instead. |
| `GROQ_MODEL`   | No       | Groq model name (defaults to `openai/gpt-oss-20b`)              |

---

## Notes

- AI tools were used during the development of this project (for code assistance, debugging, and content drafting). All prompts used are documented in the accompanying `AI_Prompts.docx` file submitted alongside this repository, as per the assessment requirements.