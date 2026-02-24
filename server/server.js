/**
 * Stock API Server
 * - provides endpoints to fetch current stock quotes (via Finnhub)
 * - allows users to start/stop periodic monitoring per symbol
 * - stores a short rolling history in memory (server reset clears history)
 */

require("dotenv").config(); // load environment variables from .env

const express = require("express"); // express framework for handling HTTP requests

// ----------------------
// configuration
// ----------------------
const PORT = 3000;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

// history size limit to avoid unbounded memory growth
const MAX_HISTORY = 200; 

// ----------------------
// app + middleware
// ----------------------
const app = express();
app.use(express.json()); // parse JSON bodies for POST requests

// ----------------------
// in-memory state
// ----------------------
/**
 * historyBySymbol: Map<symbol, QuoteRecord[]>
 * ex: "AAPL" -> [{...record1}, {...record2}, ...]
 */
const historyBySymbol = new Map();
/**
 * jobBySymbol: Map<symbol, NodeJS.Timeout>
 * stores the interval timer so we can stop it later
 */
const jobBySymbol = new Map(); 

// ----------------------
// helper functions
// ----------------------

/**
 * fetch one stock quote from Finnhub
 * returns a normalized object with fields frontend can use
 */
async function fetchStockQuote(symbol) {
    if (!FINNHUB_API_KEY) {
        throw new Error("Missing FINNHUB_API_KEY");
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Finnhub API error: ${response.status}`);
    }

    const data = await response.json();

    // Finnhub returns:
    // c = current price
    // h = high
    // l = low
    // o = open
    // pc = previous close
    return {
        symbol,
        open: data.o,
        high: data.h,
        low: data.l,
        current: data.c,
        previousClose: data.pc,
        fetchedAt: new Date().toISOString()
    };
}

/**
 * keep a symbol’s history array from growing forever
 */
function pushToHistory(symbolKey, record) {
    if (!historyBySymbol.has(symbolKey)) {
        historyBySymbol.set(symbolKey, []);
    }
    const history = historyBySymbol.get(symbolKey);
    history.push(record);

    if (history.length > MAX_HISTORY) {
        history.shift();
    }
}

/**
 * normalize and validate a stock symbol from user input
 */
function normalizeSymbol(symbol) {
    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
        return null;
    }
    return symbol.trim().toUpperCase();
}

// ----------------------
// routes
// ----------------------

/**
 * health check endpoint
 * GET /
 */
app.get("/", (req, res) => {
    res.json({ status: "ok", service: "SCE Stock Exchange API" });
});

/**
 * get stored history for a symbol (in-memory)
 * GET /history?symbol=AAPL
 */
app.get("/history", (req, res) => {
    const key = normalizeSymbol(req.query.symbol);
    if (!key) {
        return res.status(400).json({ error: "Invalid symbol" });
    }

    res.json(historyBySymbol.get(key) || []);
});

/**
 * manually refresh (fetch once and append to history)
 * POST /refresh { "symbol": "AAPL" }
 */
app.post("/refresh", async (req, res) => {
    const key = normalizeSymbol(req.body.symbol);
    if (!key) {
        return res.status(400).json({ error: "symbol must be a non-empty string" });
    }

    try {
        const record = await fetchStockQuote(key);
        pushToHistory(key, record);
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * start monitoring a symbol on an interval
 * POST /start-monitoring { "symbol": "AAPL", "minutes": 0, "seconds": 10 }
 *
 * - slears an existing job for the same symbol (restart behavior)
 * - fetches immediately once so the client sees data right away
 * - then fetches repeatedly on setInterval
 */
app.post("/start-monitoring", async (req, res) => {
    const key = normalizeSymbol(req.body.symbol);
    if (!key) {
        return res.status(400).json({ error: "symbol must be a non-empty string" });
    }

    // validate minutes/seconds are integers >= 0
    const m = Number(req.body.minutes);
    const s = Number(req.body.seconds);

    if (!Number.isInteger(m) || m < 0) {
        return res.status(400).json({ error: "minutes must be a non-negative integer" });
    }

    if (!Number.isInteger(s) || s < 0) {
        return res.status(400).json({ error: "seconds must be a non-negative integer" });
    }

    const intervalMs = (m * 60 + s) * 1000;
    if (intervalMs <= 0) {
        return res.status(400).json({ error: "refresh interval must be greater than 0" });
    }

    // if a monitoring job already exists, stop it before starting a new one
    const existingJob = jobBySymbol.get(key);
    if (existingJob) {
        clearInterval(existingJob);
        jobBySymbol.delete(key);
    }

    try {
        // fetch immediately
        const firstRecord = await fetchStockQuote(key);
        pushToHistory(key, firstRecord);

        // start interval job
        const job = setInterval(async () => {
            try {
                const record = await fetchStockQuote(key);
                pushToHistory(key, record);
            } catch (err) {
                // avoid crashing the server if Finnhub fails temporarily
                console.error(`Monitoring error for ${key}:`, err.message);
            }
        }, intervalMs);

        jobBySymbol.set(key, job);

        res.json({
            message: `Started monitoring ${key}`,
            intervalMs,
            firstRecord
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * stop monitoring a symbol
 * POST /stop-monitoring { "symbol": "AAPL" }
 */
app.post("/stop-monitoring", (req, res) => {
    const key = normalizeSymbol(req.body.symbol);
    if (!key) {
        return res.status(400).json({ error: "symbol must be a non-empty string" });
    }

    const job = jobBySymbol.get(key);
    if (!job) {
        return res.status(404).json({ error: `No monitoring job found for ${key}` });
    }

    clearInterval(job);
    jobBySymbol.delete(key);

    res.json({ message: `Stopped monitoring ${key}` });
});

// ----------------------
// start the server
// ----------------------
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
