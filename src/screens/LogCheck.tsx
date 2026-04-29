import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Rating from '../components/Rating';
import NumberStepper from '../components/NumberStepper';
import { TRIGGER_LABELS, createCheck } from '../lib/checks';
import type { Aggravation, FunctionalCheckTrigger } from '../lib/types';

const TRIGGERS: FunctionalCheckTrigger[] = [
  'suit',
  'baby-carrier',
  'backpack',
  'lifting',
  'other',
];

export default function LogCheck() {
  const nav = useNavigate();
  const [trigger, setTrigger] = useState<FunctionalCheckTrigger | null>(null);
  const [triggerDetail, setTriggerDetail] = useState('');
  const [duration, setDuration] = useState(30);
  const [aggravation, setAggravation] = useState<Aggravation | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const valid = trigger != null && aggravation != null && duration > 0;

  async function save() {
    if (!valid || trigger == null || aggravation == null) return;
    setSaving(true);
    await createCheck({
      trigger,
      triggerDetail: triggerDetail.trim() || undefined,
      durationMinutes: duration,
      aggravation,
      notes: notes.trim() || undefined,
    });
    nav('/', { replace: true });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="btn btn-ghost px-2 py-1 text-sm"
        >
          ← Back
        </button>
      </div>

      <h1 className="text-2xl font-semibold">Functional check</h1>

      <div>
        <label className="label">Trigger</label>
        <div className="flex flex-wrap gap-2">
          {TRIGGERS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTrigger(t)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                trigger === t
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {TRIGGER_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {trigger === 'other' && (
        <div>
          <label className="label">Detail</label>
          <input
            className="input"
            value={triggerDetail}
            onChange={(e) => setTriggerDetail(e.target.value)}
            placeholder="e.g. cooking dinner"
          />
        </div>
      )}

      <div>
        <NumberStepper
          label="Duration (min)"
          value={duration}
          onChange={setDuration}
          min={1}
          max={600}
        />
      </div>

      <div>
        <label className="label">Aggravation</label>
        <Rating
          value={aggravation ?? -1}
          onChange={(n) => setAggravation(n as Aggravation)}
          min={0}
          max={5}
          lowLabel="none"
          highLabel="severe"
        />
      </div>

      <div>
        <label className="label">Notes (optional)</label>
        <textarea
          className="input min-h-[64px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button
        type="button"
        disabled={!valid || saving}
        onClick={save}
        className="btn btn-primary w-full disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save check'}
      </button>
    </div>
  );
}
