import { SEED_EXERCISES } from './seed';
import { db } from './db';
import type { Exercise, ExerciseId, ExerciseProgressionState } from './types';

export function getAllExercises(): Exercise[] {
  return [...SEED_EXERCISES].sort((a, b) => a.order - b.order);
}

export function getExercise(id: ExerciseId): Exercise {
  const e = SEED_EXERCISES.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown exercise ${id}`);
  return e;
}

export async function getProgressionState(
  id: ExerciseId
): Promise<ExerciseProgressionState | undefined> {
  return db.progressionState.get(id);
}

export async function getEffectiveExercise(id: ExerciseId): Promise<Exercise> {
  const base = getExercise(id);
  const state = await getProgressionState(id);
  if (!state) return base;
  return {
    ...base,
    defaultSets: state.setsOverride ?? base.defaultSets,
    defaultReps: state.repsOverride ?? base.defaultReps,
    cueText: state.cueOverride ?? base.cueText,
  };
}

export async function getEffectiveExercises(): Promise<Exercise[]> {
  const base = getAllExercises();
  const states = await db.progressionState.toArray();
  const byId = new Map(states.map((s) => [s.exerciseId, s]));
  return base.map((b) => {
    const s = byId.get(b.id);
    if (!s) return b;
    return {
      ...b,
      defaultSets: s.setsOverride ?? b.defaultSets,
      defaultReps: s.repsOverride ?? b.defaultReps,
      cueText: s.cueOverride ?? b.cueText,
    };
  });
}
