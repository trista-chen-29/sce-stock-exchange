// renders the fetched stock history as a table
// the table expects each row to have { open, high, low, current, previousClose, fetchedAt }
// design decisions:
//  - show the newest items on top (rows.slice().reverse())
//  - fmt helper hides nulls and formats numbers to two decimals
//  - time is displayed using toLocaleString()

export default function StockTable({ rows }) {
    const fmt = (v) => (v == null ? "-" : `$${Number(v).toFixed(2)}`);

    return (
        <div className="tableWrap">
            <table className="table" role="table" aria-label="stock history">
                <thead>
                    <tr>
                        <th>Open Price</th>
                        <th>High Price</th>
                        <th>Low Price</th>
                        <th>Current Price</th>
                        <th>Previous Close Price</th>
                        <th>Time</th>
                    </tr>
                </thead>

                <tbody>
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="empty">
                                No data yet. Submit a symbol to start monitoring.
                            </td>
                        </tr>
                    ) : (
                        // reverse() on a copy avoids mutating the original rows array passed by parent
                        rows.slice().reverse().map((r, idx) => (
                            <tr key={`${r.fetchedAt}-${idx}`}>
                                <td>{fmt(r.open)}</td>
                                <td>{fmt(r.high)}</td>
                                <td>{fmt(r.low)}</td>
                                <td>{fmt(r.current)}</td>
                                <td>{fmt(r.previousClose)}</td>
                                <td>{new Date(r.fetchedAt).toLocaleString()}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}