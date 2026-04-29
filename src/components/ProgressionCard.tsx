import { useState } from 'react';
import {
  type Suggestion,
  suggestionBody,
  suggestionTitle,
} from '../lib/progression';

type Props = {
  suggestion: Suggestion;
  onAccept: () => Promise<void> | void;
  onDismiss: () => Promise<void> | void;
};

const KIND_LABEL: Record<Suggestion['kind'], string> = {
  'level-up': 'Ready to progress',
  'level-down': 'Consider regressing',
  'add-load': 'Ready for more load',
};

const KIND_ACCENT: Record<Suggestion['kind'], string> = {
  'level-up': 'border-neutral-700',
  'level-down': 'border-amber-700/60',
  'add-load': 'border-neutral-700',
};

export default function ProgressionCard({ suggestion, onAccept, onDismiss }: Props) {
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
    <div className={`card border ${KIND_ACCENT[suggestion.kind]}`}>
      <div className="text-xs uppercase tracking-wider text-neutral-500">
        {KIND_LABEL[suggestion.kind]}
      </div>
      <h3 className="mt-1 text-lg font-semibold">{suggestionTitle(suggestion)}</h3>
      {!open ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn btn-primary flex-1"
            disabled={busy}
          >
            Show details
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
            {suggestionBody(suggestion)}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handle(onAccept)}
              className="btn btn-primary flex-1"
              disabled={busy}
            >
              {busy ? 'Applying…' : suggestion.kind === 'level-down' ? 'Drop level' : 'Apply'}
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
