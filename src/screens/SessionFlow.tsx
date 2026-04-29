import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Rating from '../components/Rating';
import NumberStepper from '../components/NumberStepper';
import LoadingState from '../components/LoadingState';
import {
  getAllExercises,
  getLevel,
  resolveCurrentLevel,
  setCurrentLevel,
  maxLevel,
} from '../lib/exercises';
import { createSession } from '../lib/sessions';
import type { Exercise, FormRating, SessionExercise } from '../lib/types';

type Draft = {
  level: number;
  setsCompleted: number;
  repsCompleted: number;
  load: string;
  formRating: FormRating | null;
  notes: string;
  skipped: boolean;
  skipReason: string;
  aggravated: boolean | null;
};

function repsAsNumber(r: number | string): number {
  return typeof r === 'number' ? r : parseInt(String(r), 10) || 0;
}

function emptyDraft(ex: Exercise, level: number): Draft {
  const lvl = getLevel(ex, level);
  return {
    level: lvl.level,
    setsCompleted: lvl.defaultSets,
    repsCompleted: repsAsNumber(lvl.defaultReps),
    load: '',
    formRating: null,
    notes: '',
    skipped: false,
    skipReason: '',
    aggravated: null,
  };
}

export default function SessionFlow() {
  const nav = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [step, setStep] = useState(0);
  const [showHowTo, setShowHowTo] = useState(false);
  const [showFailures, setShowFailures] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [overallFeel, setOverallFeel] = useState<FormRating | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');
  const [startTime] = useState(() => Date.now());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const list = getAllExercises();
      const initialDrafts: Draft[] = [];
      for (const ex of list) {
        const lvl = await resolveCurrentLevel(ex.id);
        initialDrafts.push(emptyDraft(ex, lvl));
      }
      setExercises(list);
      setDrafts(initialDrafts);
    })();
  }, []);

  const total = exercises.length;
  const onSummary = step === total;
  const current = exercises[step];
  const draft = drafts[step];
  const currentLevel = current && draft ? getLevel(current, draft.level) : null;

  const stepValid = useMemo(() => {
    if (!draft) return false;
    if (draft.skipped) return draft.skipReason.trim().length > 0;
    return (
      draft.formRating != null &&
      draft.setsCompleted > 0 &&
      draft.aggravated != null
    );
  }, [draft]);

  function patchDraft(p: Partial<Draft>) {
    setDrafts((prev) => {
      const next = prev.slice();
      next[step] = { ...next[step], ...p };
      return next;
    });
  }

  function pickLevel(newLevel: number) {
    if (!current) return;
    const lvl = getLevel(current, newLevel);
    // Reset sets/reps to the new level's defaults; keep form/notes/etc.
    patchDraft({
      level: lvl.level,
      setsCompleted: lvl.defaultSets,
      repsCompleted: repsAsNumber(lvl.defaultReps),
    });
    setShowLevelPicker(false);
    setShowHowTo(false);
    setShowFailures(false);
  }

  async function save() {
    if (overallFeel == null) return;
    setSaving(true);
    setSaveError(null);
    try {
      const sessionExercises: SessionExercise[] = drafts.map((d, i) => ({
        exerciseId: exercises[i].id,
        level: d.level,
        setsCompleted: d.skipped ? 0 : d.setsCompleted,
        repsCompleted: d.skipped ? 0 : d.repsCompleted,
        load: d.load.trim() || undefined,
        formRating: (d.formRating ?? 3) as FormRating,
        notes: d.notes.trim() || undefined,
        skipped: d.skipped || undefined,
        skipReason: d.skipped ? d.skipReason.trim() : undefined,
        aggravated: d.aggravated ?? undefined,
      }));
      const elapsedMin = Math.max(1, Math.round((Date.now() - startTime) / 60000));
      // Save the session FIRST — that's the main user action. Level persistence
      // is a convenience and shouldn't block navigation if it fails.
      await createSession({
        exercises: sessionExercises,
        overallFeel,
        notes: sessionNotes.trim() || undefined,
        durationMinutes: elapsedMin,
      });
      for (let i = 0; i < drafts.length; i++) {
        const d = drafts[i];
        if (d.skipped) continue;
        try {
          await setCurrentLevel(exercises[i].id, d.level);
        } catch (err) {
          console.error('setCurrentLevel failed', exercises[i].id, err);
        }
      }
      nav('/', { replace: true });
    } catch (err) {
      console.error('save failed', err);
      setSaveError(`Save failed: ${(err as Error).message ?? err}`);
      setSaving(false);
    }
  }

  if (exercises.length === 0 || !current || !draft || !currentLevel) {
    return <LoadingState source="SessionFlow" />;
  }

  const max = maxLevel(current);

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

      {!onSummary && (
        <div className="space-y-5">
          <div>
            <div className="text-xs uppercase tracking-wider text-neutral-500">
              {current.category}
            </div>
            <h1 className="mt-1 text-2xl font-semibold">{current.name}</h1>
          </div>

          {/* Level picker */}
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-neutral-500">
                  Level {currentLevel.level} of {max}
                </div>
                <div className="mt-0.5 truncate font-medium">
                  {currentLevel.name}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLevelPicker((v) => !v)}
                className="btn btn-secondary px-3 py-2 text-sm"
              >
                Change
              </button>
            </div>

            {showLevelPicker && (
              <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
                {current.levels.map((l) => {
                  const active = l.level === draft.level;
                  return (
                    <button
                      key={l.level}
                      type="button"
                      onClick={() => pickLevel(l.level)}
                      className={`block w-full rounded-xl px-3 py-2 text-left ${
                        active
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'bg-neutral-800 text-neutral-200'
                      }`}
                    >
                      <div className="text-xs uppercase tracking-wider opacity-60">
                        Level {l.level}
                      </div>
                      <div className="font-medium">{l.name}</div>
                    </button>
                  );
                })}
                <Link
                  to={`/exercise/${current.id}`}
                  className="block pt-1 text-center text-sm text-neutral-400 underline-offset-2 hover:underline"
                >
                  See full ladder
                </Link>
              </div>
            )}
          </div>

          {/* Cue + how-to */}
          <div className="card">
            <p className="text-neutral-200 leading-relaxed">{currentLevel.cueText}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => setShowHowTo((v) => !v)}
                className="text-sm text-neutral-300 underline-offset-2 hover:underline"
              >
                {showHowTo ? 'Hide' : 'How to do it'}
              </button>
              <button
                type="button"
                onClick={() => setShowFailures((v) => !v)}
                className="text-sm text-neutral-400 underline-offset-2 hover:underline"
              >
                {showFailures ? 'Hide' : 'Show'} failure modes
              </button>
            </div>

            {showHowTo && (
              <div className="mt-4 space-y-4 border-t border-neutral-800 pt-4 text-sm">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Steps
                  </div>
                  <ol className="list-decimal space-y-2 pl-5 text-neutral-300 leading-relaxed marker:text-neutral-500">
                    {currentLevel.description.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Graduate when
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    {currentLevel.graduationCriteria}
                  </p>
                </div>
              </div>
            )}

            {showFailures && (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-neutral-400">
                {currentLevel.failureModes.map((f) => (
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
                <div className="label">Aggravated the affected area?</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => patchDraft({ aggravated: false })}
                    className={`flex-1 rounded-xl py-3 text-sm font-medium ${
                      draft.aggravated === false
                        ? 'bg-neutral-100 text-neutral-900'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => patchDraft({ aggravated: true })}
                    className={`flex-1 rounded-xl py-3 text-sm font-medium ${
                      draft.aggravated === true
                        ? 'bg-red-200 text-red-950'
                        : 'bg-neutral-800 text-neutral-300'
                    }`}
                  >
                    Yes
                  </button>
                </div>
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
              setShowHowTo(false);
              setShowFailures(false);
              setShowLevelPicker(false);
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
          {saveError && (
            <div className="card border border-red-700/60 text-sm">
              <div className="font-semibold text-red-300">{saveError}</div>
              <div className="mt-1 text-neutral-400">
                Try again, or copy this and let me know.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
