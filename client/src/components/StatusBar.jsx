// small presentational component for UI feedback
// returns null when there is no status text, keeping the DOM clean

export default function StatusBar({ status }) {
    if (!status) {
        return null;
    }

    return (
        <p className="status" role="status" aria-live="polite">
            <b>Status:</b> {status}
        </p>
    );
}
