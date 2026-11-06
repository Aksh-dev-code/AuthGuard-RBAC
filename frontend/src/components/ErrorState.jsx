import { RefreshCw } from "lucide-react";

export default function ErrorState({ message = "Something went wrong.", onRetry }) {
  return (
    <div className="empty-state error-state" role="alert">
      <strong>{message}</strong>
      {onRetry && (
        <button className="secondary-button" onClick={onRetry}>
          <RefreshCw size={16} /> Try again
        </button>
      )}
    </div>
  );
}