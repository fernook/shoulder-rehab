import { useEffect, useState } from 'react';
import { getAllExercises, setCurrentLevel } from '../lib/exercises';
import { updateSettings } from '../lib/db';
import type { Exercise, ExerciseId } from '../lib/types';

type Props = {
  onDone: () => void;
};

export default function LevelsOnboarding({ onDone }: Props) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [picks, setPicks] = useState<Record<ExerciseId, number>>(
    {} as Record<ExerciseId, number>
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const list = getAllExercises();
    setExercises(list);
    const init = {} as Record<ExerciseId, number>;
    for (const ex of list) init[ex.id] = 1;
    setPicks(init);
  }, []);

  async function done() {
    setSaving(true);
    for (const ex of exercises) {
      await setCurrentLevel(ex.id, picks[ex.id] ?? 1);
    }
    await updateSettings({ levelsOnboardingSeen: true });
    setSaving(false);
    onDone();
  }

  if (exercises.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-neutral-950 p-5 border-t sm:border border-neutral-800 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Exercises now have levels</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Each exercise now has a regression ladder so you can start where you actually are. Pick a starting level for each — you can change it any time. Your previous sessions are kept as-is.
          </p>
        </div>

        <div className="space-y-3">
          {exercises.map((ex) => (
            <div key={ex.id} className="card">
              <div className="font-medium">{ex.name}</div>
              <div className="mt-2 space-y-1">
                {ex.levels.map((l) => {
                  const active = picks[ex.id] === l.level;
                  return (
                    <button
                      key={l.level}
                      type="button"
                      onClick={() => setPicks({ ...picks, [ex.id]: l.level })}
                      className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${
                        active
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'bg-neutral-800 text-neutral-200'
                      }`}
                    >
                      <span className="opacity-60">L{l.level}</span> · {l.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={done}
          disabled={saving}
          className="btn btn-primary w-full"
        >
          {saving ? 'Saving…' : 'Done'}
        </button>
      </div>
    </div>
  );
}
