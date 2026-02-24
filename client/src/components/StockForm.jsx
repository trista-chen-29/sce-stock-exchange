// presentational component: renders the form inputs and buttons

export default function StockForm({
    minutes,
    seconds,
    symbol,
    onMinutesChange,
    onSecondsChange,
    onSymbolChange,
    onSubmit,
    onRefresh,
    onStop,
    canRefresh,
    canStop,
}) {
    return (
        <form className="form" onSubmit={onSubmit}>
            {/* minutes input: controlled by parent */}
            <input 
                className="input" 
                placeholder="MIN" 
                value={minutes} 
                onChange={onMinutesChange}
                aria-label="minutes"
            />

            {/* seconds input */}
            <input 
                className="input" 
                placeholder="SEC" 
                value={seconds} 
                onChange={onSecondsChange} 
                aria-label="seconds"
            />

            {/* symbol input */}
            <input 
                className="input symbol" 
                placeholder="SYMBOL" 
                value={symbol} 
                onChange={onSymbolChange} 
                aria-label="stock symbol"
            />

            {/* SUBMIT: starts the monitoring job on the backend */}
            <button 
                className="btn primary" 
                type="submit"
            >
                SUBMIT
            </button>

            {/* REFRESH: asks server for an immediate fetch, disabled when not allowed */}
            <button 
                className="btn secondary" 
                type="button" 
                onClick={onRefresh} 
                disabled={!canRefresh}
            >
                REFRESH
            </button>

            {/* STOP: stops the backend job and UI polling */}
            <button 
                className="btn danger" 
                type="button" 
                onClick={onStop} 
                disabled={!canStop}
            >
                STOP
            </button>
        </form>
    );
}