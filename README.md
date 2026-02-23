# SCE Stock Exchange API (Backend)

Backend service that monitors stock quotes using Finnhub and stores an in-memory history per symbol.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the project root:
```bash
FINNHUB_API_KEY=YOUR_FINNHUB_API_KEY
```

3. Start the server:
```bash
npm start
```

Server runs on `http://localhost:3000`.

---

## API Endpoints

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

## Notes

- History is stored in-memory using a `Map` keyed by stock symbol.
- History is capped at 200 records per symbol.
- Calling `POST /start-monitoring` again for the same symbol will restart the monitoring interval (previous job is cleared), but it will **continue appending to the existing history** for that symbol. To reset history, restart the server (in-memory storage) or modify the code to clear `historyBySymbol` for that symbol when restarting.
