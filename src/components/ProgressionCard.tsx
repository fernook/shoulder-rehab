import { useState } from 'react';
import type { Exercise } from '../lib/types';

type Props = {
  exercise: Exercise;
  onAccept: () => Promise<void> | void;
  onDismiss: () => Promise<void> | void;
};

export default function ProgressionCard({ exercise, onAccept, onDismiss }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handle(fn: () => Promise<void> | void) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card border border-neutral-700">
      <div className="text-xs uppercase tracking-wider text-neutral-500">
        Ready to progress
      </div>
      <h3 className="mt-1 text-lg font-semibold">
        {exercise.name} has been clean for 4 sessions
      </h3>
      {!open ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-primary flex-1"
            disabled={busy}
          >
            Show progression
          </button>
          <button
            type="button"
            onClick={() => handle(onDismiss)}
            className="btn btn-secondary flex-1"
            disabled={busy}
          >
            Not yet
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="rounded-xl bg-neutral-800 p-3 text-sm text-neutral-200">
            {exercise.progressionNotes}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handle(onAccept)}
              className="btn btn-primary flex-1"
              disabled={busy}
            >
              {busy ? 'Applying…' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={() => handle(onDismiss)}
              className="btn btn-secondary flex-1"
              disabled={busy}
            >
              Not yet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
