// thin client wrapper over backend endpoints
// responsibilities:
//  - perform fetch requests
//  - handle non-200 responses by throwing Error with helpful message
//  - serialize JSON bodies

export async function startMonitoring({ symbol, minutes, seconds }) {
    // POST to /start-monitoring
    // backend validates the payload again
    const res = await fetch("/start-monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, minutes, seconds }),
    });
    
    if (!res.ok) {
        // try to parse the error body
        // fall back to status code
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `start-monitoring failed: ${res.status}`);
    }

    return await res.json();
}

export async function fetchHistory(symbol) {
    // GET /history?symbol=...
    const res = await fetch(`/history?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `history failed: ${res.status}`);
    }

    return await res.json();
}

export async function refresh(symbol) {
    // POST /refresh to force an immediate fetch & append
    const res = await fetch("/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `refresh failed: ${res.status}`);
    }

    return await res.json();
}

export async function stopMonitoring(symbol) {
    // POST /stop-monitoring to clear server-side job
    const res = await fetch("/stop-monitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
    });
    
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `stop-monitoring failed: ${res.status}`);
    }

    return await res.json();
}
