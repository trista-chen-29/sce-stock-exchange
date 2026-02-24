import { useEffect, useMemo, useRef, useState } from 'react'
import { startMonitoring, fetchHistory, refresh, stopMonitoring } from './api/stockApi';
import './App.css'

import StockForm from './components/StockForm';
import StockTable from './components/StockTable';
import StatusBar from './components/StatusBar';

export default function App() {
  const [symbol, setSymbol] = useState("");
  const [minutes, setMinutes] = useState("0");
  const [seconds, setSeconds] = useState("10");

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("");
  const [isMonitoring, setIsMonitoring] = useState(false);

  const pollerRef = useRef(null);

  const normalizedSymbol = useMemo(() => symbol.trim().toUpperCase(), [symbol]);

  // --- handlers ---
  async function handleSubmit(e) {
    e.preventDefault();

    const sym = normalizedSymbol;
    const m = Number(minutes);
    const s = Number(seconds);

    // input validation
    if (!sym) {
      setStatus("Please enter a stock symbol (e.g., AAPL)");
      return;
    }

    if (!Number.isInteger(m) || m < 0 || !Number.isInteger(s) || s < 0) {
      setStatus("Minutes/seconds must be non-negative integers");
      return;
    }  

    if ((m * 60 + s) <= 0) {
      setStatus("Interval must be greater than 0");
      return;
    }

    setStatus(`Starting monitoring...`);

    try {
      // start backend monitoring job (clears prior job if exists)
      await startMonitoring({ symbol: sym, minutes: m, seconds: s });

      // fetch the history immediately to show first data row fast
      const history = await fetchHistory(sym);
      setRows(history);

      setIsMonitoring(true);
      setStatus(`Monitoring ${sym}...`);
    } catch (err) {
      setIsMonitoring(false);
      setStatus(err.message || "Failed to start monitoring");
    }
  }

  async function handleRefresh() {
    const sym = normalizedSymbol;
    if (!sym) {
      return;
    }

    setStatus(`Refreshing...`);

    try {
      const newRecord = await refresh(sym);
      
      // Two valid approaches:
      // A) Append new row immediately (feels snappy)
      setRows((prev) => [...prev, newRecord]);

      // B) Or re-fetch history (guaranteed consistent with backend)
      // const history = await fetchHistory(sym);
      // setRows(history);

      setStatus(`Refreshed ${sym}`);
    } catch (err) {
      setStatus(err.message || "Refresh failed");
    }
  }

  async function handleStop() {
    const sym = normalizedSymbol;
    if (!sym) {
      return;
    }

    setStatus(`Stopping monitoring ${sym}...`);

    try {
      await stopMonitoring(sym);
      setIsMonitoring(false);
      setStatus(`Stopped monitoring ${sym}`);
    } catch (err) {
      // Even if stop fails, we can still stop polling on the UI side
      setIsMonitoring(false);
      setStatus(err.message || "Stop failed");
    }
  }

  // --- poll history while monitoring ---
  useEffect(() => {
    // only poll when monitoring and a valid symbol exists
    if (!isMonitoring || !normalizedSymbol) {
      return;
    }

    // clear old poller if any
    if (pollerRef.current) {
      clearInterval(pollerRef.current);
    }

    pollerRef.current = setInterval(async () => {
      try {
        const history = await fetchHistory(normalizedSymbol);
        setRows(history);
      } catch {
        // keep silent
      }
    }, 1000);

    return () => {
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
      }
      pollerRef.current = null;
    };
  }, [isMonitoring, normalizedSymbol]);

  // If user edits symbol while monitoring, you can choose behavior.
  // Right now, polling will switch to new symbol once symbol changes.
  // That’s okay, but you might prefer to stop monitoring automatically when symbol changes.

  return (
    <div className="appShell">
      <div className="page">
        <h1 className="title">Stock Exchange</h1>

        <StockForm
          minutes={minutes}
          seconds={seconds}
          symbol={symbol}
          onMinutesChange={(e) => setMinutes(e.target.value)}
          onSecondsChange={(e) => setSeconds(e.target.value)}
          onSymbolChange={(e) => setSymbol(e.target.value)}
          onSubmit={handleSubmit}
          onRefresh={handleRefresh}
          onStop={handleStop}
          canRefresh={Boolean(normalizedSymbol) && isMonitoring}
          canStop={Boolean(normalizedSymbol) && isMonitoring}
        />

        <StatusBar status={status} />

        <StockTable rows={rows} />
      </div>
    </div>
  );
}
