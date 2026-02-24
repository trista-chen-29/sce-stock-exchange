# Stock Exchange - SCE Financial Advising App (Full Stack)

A simple full-stack stock monitoring app.

- **Frontend (React)**: lets users enter a stock symbol + refresh interval and displays results in a table.
- **Backend (Node/Express)**: calls Finnhub Quote API, stores an **in-memory** history per symbol, and provides REST endpoints consumed by the frontend.

> **Security note:** The Finnhub API key is stored only on the backend in `.env` (not exposed to the browser).

---

## Tech Stack

**Frontend**
- React (Vite)
- Fetch API (calls backend endpoints)

**Backend**
- Node.js + Express
- Finnhub Stock API
- `dotenv` for API key config

---

## Project Structure

```bash
sce-stock-exchange/
├── README.md                # Single full-stack README
├── .gitignore
├── server/                  # Backend (Express)
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env                 # (not committed)
└── client/                  # Frontend (React - Vite)
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── index.css
        ├── api/
        │   └── stockApi.js
        └── components/
            ├── StatusBar.jsx
            ├── StockForm.jsx
            └── StockTable.jsx
```

---

## Prerequisites

- Node.js (recommended: Node 18+)
- A Finnhub API key (free tier is fine): https://finnhub.io

---

## Setup

### Backend setup (Express)

1. From the `server/` folder (or repo root if backend is in root):

```bash
npm install
```

2. Create a `.env` file:

```bash
FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY
```

3. Start the backend server:

```bash
npm start
```

Backend runs on:
- `http://localhost:3000`

### Frontend setup (React)

1. From the `client/` folder:

```bash
npm install
npm run dev
```

Frontend runs on:
- `http://localhost:5173`

---

## Local Development Notes (important)

### Vite Proxy (Frontend → Backend)

The frontend uses relative API paths like `/history` and `/start-monitoring`.

To avoid CORS issues in development, configure a Vite proxy in `client/vite.config.js`:

```js
export default {
  server: {
    proxy: {
      "/start-monitoring": "http://localhost:3000",
      "/history": "http://localhost:3000",
      "/refresh": "http://localhost:3000",
      "/stop-monitoring": "http://localhost:3000",
    },
  },
};
```

---

## Backend API Endpoints

### POST /start-monitoring

Starts monitoring a stock at a given interval.

Body:
```json
{
    "symbol": "AAPL",
    "minutes": 0,
    "seconds": 5
}
```

Example:
```bash
curl -X POST http://localhost:3000/start-monitoring \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL","minutes":0,"seconds":5}'
```

### GET /history?symbol=SYMBOL

Returns the full in-memory history for a symbol.

Example:
```bash
curl "http://localhost:3000/history?symbol=AAPL"
```

### POST /refresh

Fetches a new quote immediately and appends it to history.

Example:
```bash
curl -X POST http://localhost:3000/refresh \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL"}'
```

### POST /stop-monitoring

Stops the monitoring job for a symbol.

Example:
```bash
curl -X POST http://localhost:3000/stop-monitoring \
  -H "Content-Type: application/json" \
  -d '{"symbol":"AAPL"}'
```

---

## Frontend Features

- Input fields: minutes, seconds, symbol
- Submit starts monitoring (backend scheduled job)
- Table displays rows of:
  - Open, High, Low, Current, Previous Close, Timestamp
- Automatic UI updates while monitoring (polls `/history`)
- Refresh (calls `/refresh`)
- Stop (calls `/stop-monitoring`)

---

## Notes / Behavior

- History is stored in-memory using a `Map` keyed by stock symbol.
- History is capped at 200 records per symbol.
- Calling `POST /start-monitoring` again for the same symbol:
  - clears the previous monitoring interval job,
  - continues appending to the existing history for that symbol.
  - To reset history: restart the backend server (in-memory storage) or clear the symbol’s history in code.
