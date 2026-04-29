import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getAllExercises,
  resolveCurrentLevel,
  setCurrentLevel,
} from '../lib/exercises';
import type { Exercise, ExerciseId } from '../lib/types';

const KNOWN_IDS: ExerciseId[] = [
  'wall-slides',
  'prone-ytw',
  'serratus-slide',
  'band-pull-aparts',
  'face-pulls',
];

function isExerciseId(id: string | undefined): id is ExerciseId {
  return !!id && (KNOWN_IDS as string[]).includes(id);
}

export default function ExerciseDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [currentLevel, setLevel] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isExerciseId(id)) return;
    const ex = getAllExercises().find((x) => x.id === id) ?? null;
    setExercise(ex);
    if (ex) {
      resolveCurrentLevel(ex.id).then(setLevel);
    }
  }, [id]);

  if (!exercise) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => nav(-1)}
          className="btn btn-ghost px-2 py-1 text-sm"
        >
          ← Back
        </button>
        <div className="text-neutral-500">Exercise not found.</div>
      </div>
    );
  }

  async function setAsCurrent(level: number) {
    if (!exercise) return;
    setBusy(true);
    try {
      await setCurrentLevel(exercise.id, level);
      setLevel(level);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => nav(-1)}
          className="btn btn-ghost px-2 py-1 text-sm"
        >
          ← Back
        </button>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wider text-neutral-500">
          {exercise.category}
        </div>
        <h1 className="mt-1 text-2xl font-semibold">{exercise.name}</h1>
      </div>

      <div className="card text-sm text-neutral-300">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Progression notes
        </div>
        <p className="leading-relaxed">{exercise.progressionNotes}</p>
      </div>

      <div className="space-y-3">
        {exercise.levels.map((l) => {
          const isCurrent = currentLevel === l.level;
          return (
            <div
              key={l.level}
              className={`card ${isCurrent ? 'border border-neutral-500' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-wider text-neutral-500">
                    Level {l.level}
                  </div>
                  <h3 className="text-lg font-semibold">{l.name}</h3>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-900">
                    Current
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setAsCurrent(l.level)}
                    className="rounded-xl bg-neutral-800 px-3 py-1.5 text-xs text-neutral-200 active:bg-neutral-700 disabled:opacity-40"
                  >
                    Set as current
                  </button>
                )}
              </div>

              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    How to do it
                  </div>
                  <ol className="list-decimal space-y-1.5 pl-5 text-neutral-300 leading-relaxed marker:text-neutral-500">
                    {l.description.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Cue
                  </div>
                  <p className="text-neutral-300 leading-relaxed">{l.cueText}</p>
                </div>

                <div className="flex flex-wrap gap-x-6 gap-y-1 text-neutral-400">
                  <div>
                    <span className="text-neutral-500">Default: </span>
                    {l.defaultSets} × {l.defaultReps}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Failure modes
                  </div>
                  <ul className="list-disc space-y-1 pl-5 text-neutral-400">
                    {l.failureModes.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                    Graduate when
                  </div>
                  <p className="text-neutral-300 leading-relaxed">
                    {l.graduationCriteria}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
