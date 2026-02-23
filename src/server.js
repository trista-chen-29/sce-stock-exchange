require("dotenv").config();

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const express = require("express");

const app = express();
const PORT = 3000;

const historyBySymbol = new Map();
const jobBySymbol = new Map(); 

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

app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Stock API is running" });
});

app.get("/test-fetch", async (req, res) => {
    const { symbol }  = req.query;

    if (!symbol || typeof symbol !== "string") {
        return res.status(400).json({ error: "Invalid symbol" });
    }

    try {
        const result = await fetchStockQuote(symbol);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/history", (req, res) => {
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
        return res.status(400).json({ error: "Invalid symbol" });
    }

    const key = symbol.trim().toUpperCase();
    const history = historyBySymbol.get(key) || [];

    res.json(history);
});

app.post("/start-monitoring", async (req, res) => {
    const { symbol, minutes, seconds } = req.body;

    // validate symbol
    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
        return res.status(400).json({ error: "symbol must be a non-empty string" });
    }

    // validate minutes/seconds are integers >= 0
    const m = Number(minutes);
    const s = Number(seconds);

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

    const key = symbol.trim().toUpperCase();

    // if a job already exists for this symbol, clear it first
    const existingJob = jobBySymbol.get(key);
    if (existingJob) {
        clearInterval(existingJob);
        jobBySymbol.delete(key);
    }

    // ensure history array exists
    if (!historyBySymbol.has(key)) {
        historyBySymbol.set(key, []);
    }

    // fetch once immediately (so user gets data right away)
    try {
        const firstRecord = await fetchStockQuote(key);
        const history = historyBySymbol.get(key);
        history.push(firstRecord);
        if (history.length > 200) 
            history.shift();

        // start interval job
        const job = setInterval(async () => {
            try {
                const record = await fetchStockQuote(key);
                const history = historyBySymbol.get(key);
                history.push(record);
                if (history.length > 200) 
                    history.shift();
            } catch (err) {
                // don't crash the server; just log errors
                console.error(`Monitoring error for ${key}:`, err.message);
            }
        }, intervalMs);

        jobBySymbol.set(key, job);

        return res.json({
            message: `Started monitoring ${key}`,
            intervalMs,
            firstRecord
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post("/refresh", async (req, res) => {
    const { symbol } = req.body;

    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
        return res.status(400).json({ error: "symbol must be a non-empty string" });
    }

    const key = symbol.trim().toUpperCase();

    try {
        const record = await fetchStockQuote(key);

        if (!historyBySymbol.has(key)) {
            historyBySymbol.set(key, []);
        }
        const history = historyBySymbol.get(key);
        history.push(record);
        if (history.length > 200)
            history.shift();

        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post("/stop-monitoring", (req, res) => {
    const { symbol } = req.body;

    if (!symbol || typeof symbol !== "string" || symbol.trim().length === 0) {
        return res.status(400).json({ error: "symbol must be a non-empty string" });
    }

    const key = symbol.trim().toUpperCase();

    const job = jobBySymbol.get(key);
    if (!job) {
        return res.status(404).json({ error: `No monitoring job found for ${key}` });
    }

    clearInterval(job);
    jobBySymbol.delete(key);

    res.json({ message: `Stopped monitoring ${key}` });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
