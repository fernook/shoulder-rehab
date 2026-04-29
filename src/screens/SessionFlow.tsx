import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Rating from '../components/Rating';
import NumberStepper from '../components/NumberStepper';
import { getEffectiveExercises } from '../lib/exercises';
import { createSession } from '../lib/sessions';
import type { Exercise, FormRating, SessionExercise } from '../lib/types';

type Draft = {
  setsCompleted: number;
  repsCompleted: number;
  load: string;
  formRating: FormRating | null;
  notes: string;
  skipped: boolean;
  skipReason: string;
};

function emptyDraft(e: Exercise): Draft {
  const reps =
    typeof e.defaultReps === 'number'
      ? e.defaultReps
      : parseInt(String(e.defaultReps), 10) || 0;
  return {
    setsCompleted: e.defaultSets,
    repsCompleted: reps,
    load: '',
    formRating: null,
    notes: '',
    skipped: false,
    skipReason: '',
  };
}

export default function SessionFlow() {
  const nav = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [step, setStep] = useState(0);
  const [showFailures, setShowFailures] = useState(false);
  const [overallFeel, setOverallFeel] = useState<FormRating | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [startTime] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getEffectiveExercises().then((list) => {
      setExercises(list);
      setDrafts(list.map(emptyDraft));
    });
  }, []);

  const total = exercises.length;
  const onSummary = step === total;
  const current = exercises[step];
  const draft = drafts[step];

  const stepValid = useMemo(() => {
    if (!draft) return false;
    if (draft.skipped) return draft.skipReason.trim().length > 0;
    return draft.formRating != null && draft.setsCompleted > 0;
  }, [draft]);

  function patchDraft(p: Partial<Draft>) {
    setDrafts((prev) => {
      const next = prev.slice();
      next[step] = { ...next[step], ...p };
      return next;
    });
  }

  async function save() {
    if (overallFeel == null) return;
    setSaving(true);
    const sessionExercises: SessionExercise[] = drafts.map((d, i) => ({
      exerciseId: exercises[i].id,
      setsCompleted: d.skipped ? 0 : d.setsCompleted,
      repsCompleted: d.skipped ? 0 : d.repsCompleted,
      load: d.load.trim() || undefined,
      formRating: (d.formRating ?? 3) as FormRating,
      notes: d.notes.trim() || undefined,
      skipped: d.skipped || undefined,
      skipReason: d.skipped ? d.skipReason.trim() : undefined,
    }));
    const elapsedMin = Math.max(1, Math.round((Date.now() - startTime) / 60000));
    await createSession({
      exercises: sessionExercises,
      overallFeel,
      notes: sessionNotes.trim() || undefined,
      durationMinutes: elapsedMin,
    });
    nav('/', { replace: true });
  }

  if (exercises.length === 0) {
    return <div className="text-neutral-500">Loading…</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 0 ? nav('/') : setStep(step - 1))}
          className="btn btn-ghost px-2 py-1 text-sm"
        >
          ← Back
        </button>
        <div className="text-sm text-neutral-500 tabular-nums">
          {onSummary ? 'Summary' : `${step + 1} / ${total}`}
        </div>
      </div>

      {!onSummary && current && draft && (
        <div className="space-y-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-500">
              {current.category}
            </div>
            <h1 className="mt-1 text-2xl font-semibold">{current.name}</h1>
          </div>

          <div className="card">
            <p className="text-neutral-200 leading-relaxed">{current.cueText}</p>
            <button
              type="button"
              onClick={() => setShowFailures((v) => !v)}
              className="mt-3 text-sm text-neutral-400 underline-offset-2 hover:underline"
            >
              {showFailures ? 'Hide' : 'Show'} failure modes
            </button>
            {showFailures && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-400">
                {current.failureModes.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            )}
          </div>

          {!draft.skipped ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <NumberStepper
                  label="Sets"
                  value={draft.setsCompleted}
                  onChange={(n) => patchDraft({ setsCompleted: n })}
                  min={0}
                  max={10}
                />
                <NumberStepper
                  label="Reps"
                  value={draft.repsCompleted}
                  onChange={(n) => patchDraft({ repsCompleted: n })}
                  min={0}
                  max={50}
                />
              </div>

              <div>
                <label className="label">Load (optional)</label>
                <input
                  className="input"
                  value={draft.load}
                  onChange={(e) => patchDraft({ load: e.target.value })}
                  placeholder="e.g. 3lb DB, red band"
                />
              </div>

              <div>
                <label className="label">Form</label>
                <Rating
                  value={draft.formRating ?? 0}
                  onChange={(n) => patchDraft({ formRating: n as FormRating })}
                  lowLabel="compensating"
                  highLabel="clean"
                />
              </div>

              <div>
                <label className="label">Notes (optional)</label>
                <textarea
                  className="input min-h-[64px]"
                  value={draft.notes}
                  onChange={(e) => patchDraft({ notes: e.target.value })}
                  placeholder="Anything off?"
                />
              </div>

              <button
                type="button"
                onClick={() => patchDraft({ skipped: true })}
                className="text-sm text-neutral-500 underline-offset-2 hover:underline"
              >
                Skip this exercise
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="label">Reason for skipping</label>
                <input
                  className="input"
                  value={draft.skipReason}
                  onChange={(e) => patchDraft({ skipReason: e.target.value })}
                  placeholder="e.g. shoulder flared"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={() =>
                  patchDraft({ skipped: false, skipReason: '' })
                }
                className="text-sm text-neutral-500 underline-offset-2 hover:underline"
              >
                Undo skip
              </button>
            </div>
          )}

          <button
            type="button"
            disabled={!stepValid}
            onClick={() => {
              setShowFailures(false);
              setStep(step + 1);
            }}
            className="btn btn-primary w-full disabled:opacity-40"
          >
            {step === total - 1 ? 'Continue' : 'Next'}
          </button>
        </div>
      )}

      {onSummary && (
        <div className="space-y-5">
          <h1 className="text-2xl font-semibold">How did the shoulder feel?</h1>
          <Rating
            value={overallFeel ?? 0}
            onChange={(n) => setOverallFeel(n as FormRating)}
            lowLabel="bad"
            highLabel="great"
          />
          <div>
            <label className="label">Session notes (optional)</label>
            <textarea
              className="input min-h-[80px]"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Anything to remember?"
            />
          </div>
          <button
            type="button"
            disabled={overallFeel == null || saving}
            onClick={save}
            className="btn btn-primary w-full disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save session'}
          </button>
        </div>
      )}
    </div>
  );
}
