import { SEED_EXERCISES } from './seed';
import { db } from './db';
import type {
  Exercise,
  ExerciseId,
  ExerciseLevel,
  ExerciseProgressionState,
} from './types';

export function getAllExercises(): Exercise[] {
  return [...SEED_EXERCISES].sort((a, b) => a.order - b.order);
}

export function getExercise(id: ExerciseId): Exercise {
  const e = SEED_EXERCISES.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown exercise ${id}`);
  return e;
}

export function getLevel(ex: Exercise, level: number): ExerciseLevel {
  const found = ex.levels.find((l) => l.level === level);
  if (found) return found;
  // Clamp to valid range, default to lowest level
  const clamped = Math.max(1, Math.min(maxLevel(ex), level || 1));
  return ex.levels.find((l) => l.level === clamped) ?? ex.levels[0];
}

export function maxLevel(ex: Exercise): number {
  return Math.max(...ex.levels.map((l) => l.level));
}

export async function getProgressionState(
  id: ExerciseId
): Promise<ExerciseProgressionState | undefined> {
  return db.progressionState.get(id);
}

// Returns the level the user should default to for this exercise:
// 1. explicit currentLevel from progression state
// 2. otherwise, the most recent session's level for this exercise
// 3. otherwise, level 1
export async function resolveCurrentLevel(id: ExerciseId): Promise<number> {
  const state = await db.progressionState.get(id);
  if (state?.currentLevel != null) return state.currentLevel;

  const sessions = await db.sessions.toArray();
  sessions.sort((a, b) => b.createdAt - a.createdAt);
  for (const s of sessions) {
    const se = s.exercises.find((x) => x.exerciseId === id && x.level != null);
    if (se?.level != null) return se.level;
  }
  return 1;
}

export async function setCurrentLevel(id: ExerciseId, level: number): Promise<void> {
  const existing = (await db.progressionState.get(id)) ?? { exerciseId: id };
  await db.progressionState.put({ ...existing, currentLevel: level });
}

export async function resolveCurrentLevels(): Promise<Map<ExerciseId, number>> {
  const out = new Map<ExerciseId, number>();
  for (const ex of getAllExercises()) {
    out.set(ex.id, await resolveCurrentLevel(ex.id));
  }
  return out;
}
