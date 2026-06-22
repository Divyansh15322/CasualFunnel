# CausalFunnel Analytics

A full-stack user analytics application that tracks page views and clicks, stores them in MongoDB, and visualises them in a React dashboard with a sessions explorer and click heatmap.

---

## Tech Stack

| Layer      | Technology                       |
|------------|----------------------------------|
| Tracker    | Vanilla JS (no dependencies)     |
| Backend    | Node.js + Express                |
| Database   | MongoDB (via Mongoose)           |
| Dashboard  | React (Create React App)         |

---

## Project Structure

```
causalfunnel/
├── backend/          # Express API server
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── frontend/         # React dashboard
│   ├── src/
│   │   ├── App.js        — layout, stats bar, tab nav
│   │   ├── Sessions.js   — session list + event journey
│   │   ├── Heatmap.js    — canvas click heatmap
│   │   └── api.js        — fetch helpers
│   └── package.json
├── tracker/
│   └── tracker.js    # Drop-in tracking script
└── demo/
    └── index.html    # Demo store page (uses tracker)
```

---

## Setup

### Prerequisites

- Node.js ≥ 18
- MongoDB running locally on port 27017 (or a MongoDB Atlas URI)

### 1. Backend

```bash
cd backend
cp .env.example .env          # edit MONGO_URI if needed
npm install
npm start                     # runs on http://localhost:3001
```

### 2. Frontend dashboard

```bash
cd frontend
npm install
npm start                     # runs on http://localhost:3000
```

### 3. Demo page

Open `demo/index.html` in a browser. It will send events to `http://localhost:3001/api/events`.

> The tracker script is already embedded with `data-endpoint="http://localhost:3001/api/events"`. Click around the demo page, then refresh the dashboard to see sessions and heatmap data appear.

### 4. Use the tracker on any page

```html
<script src="/path/to/tracker.js" data-endpoint="https://your-api/api/events"></script>
```

The script is self-contained and dependency-free. It:
- Assigns a persistent `session_id` (localStorage with cookie fallback)
- Fires a `page_view` on load and on SPA navigation (History API hooks)
- Fires a `click` event on every click with `x`/`y` coordinates
- Batches and sends events via `navigator.sendBeacon` (or `fetch`) every 2 s

---

## API Endpoints

| Method | Path                          | Description                                   |
|--------|-------------------------------|-----------------------------------------------|
| POST   | `/api/events`                 | Receive one or more events (JSON array or object) |
| GET    | `/api/sessions`               | List all sessions with counts and duration    |
| GET    | `/api/sessions/:sessionId`    | Ordered event list for a single session       |
| GET    | `/api/heatmap?page_url=<url>` | Click coordinates for a given page URL        |
| GET    | `/api/pages`                  | Distinct page URLs that have been tracked     |
| GET    | `/api/stats`                  | Summary counts (sessions, events, clicks, views) |
| GET    | `/health`                     | Health check                                  |

---

## Dashboard Features

### Sessions View
- Lists all sessions sorted by most recent activity
- Shows event count, page view count, click count, duration
- Clicking a session reveals the full ordered event journey (type, URL, timestamp, click coordinates)

### Heatmap View
- Select any tracked page URL from the dropdown
- Renders a radial-gradient density heatmap on an HTML5 `<canvas>`
- Warmer colours (red/orange) = higher click density
- White dots = exact click positions
- Adaptive radius and opacity based on local density

---

## Assumptions & Trade-offs

- **No authentication** — this is a prototype; a production build would add API keys or JWT auth for both the tracker endpoint and dashboard.
- **Single-host CORS** — the backend allows all origins (`*`). Tighten this in production to your tracker domains.
- **No viewport normalisation** — click `x`/`y` are `clientX/Y` (viewport-relative). A production heatmap would store and normalise relative to the document or a fixed canvas size matching the real page dimensions.
- **Session = tab session** — `session_id` is stored in `localStorage`. Clearing storage or opening a private window starts a new session. A server-side session cookie would be more robust.
- **Batched sends** — events are queued and flushed every 2 s or on page hide. This reduces API calls but means up to 2 s of events could be lost if the browser is force-killed.
- **MongoDB indexes** — compound indexes on `(session_id, timestamp)` and `(page_url, event_type)` cover the main query patterns efficiently.
- **Canvas heatmap dimensions** — the canvas is fixed at 1280 × 800 px (a common laptop viewport). For accuracy across screen sizes, coordinates should be stored normalised (0–1) and scaled at render time.
