import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type Props = {
  source: string; // which screen
  error?: string | null;
  onRetry?: () => void;
};

export default function LoadingState({ source, error, onRetry }: Props) {
  const location = useLocation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-4">
      <div className="text-neutral-300">Loading… ({elapsed}s)</div>
      <div className="text-xs text-neutral-500">
        screen: {source} · path: {location.pathname}
      </div>

      {error && (
        <div className="card border border-red-700/60 text-sm">
          <div className="font-semibold text-red-300">Couldn’t load</div>
          <div className="mt-1 text-neutral-300 break-words">{error}</div>
          {onRetry && (
            <button
              type="button"
              className="btn btn-secondary mt-3"
              onClick={onRetry}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {elapsed >= 4 && !error && (
        <div className="card text-sm">
          <div className="text-neutral-300">
            Still loading after {elapsed}s — IndexedDB may be stuck.
          </div>
          <button
            type="button"
            className="btn btn-secondary mt-3 w-full"
            onClick={async () => {
              if (
                window.confirm(
                  'Wipe the local IndexedDB and reload the app? This deletes all sessions, checks, and settings.'
                )
              ) {
                await indexedDB.deleteDatabase('rehab-db');
                window.location.reload();
              }
            }}
          >
            Drop IndexedDB &amp; reload (recovery)
          </button>
          <button
            type="button"
            className="btn btn-secondary mt-2 w-full"
            onClick={() => window.location.reload()}
          >
            Just reload
          </button>
        </div>
      )}

      <div className="text-center text-[11px] text-neutral-400 tabular-nums">
        build {__BUILD_ID__} UTC
      </div>
    </div>
  );
}
