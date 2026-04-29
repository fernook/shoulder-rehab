import { db, uid } from './db';
import { todayISO } from './date';
import { getAllExercises, getExercise } from './exercises';
import type {
  Exercise,
  ExerciseId,
  ExerciseProgressionState,
  ProgressionEvent,
} from './types';

const REQUIRED_CLEAN_SESSIONS = 4;

type ExerciseAppearance = {
  sessionId: string;
  formRating: number;
};

async function appearancesForExercise(id: ExerciseId): Promise<ExerciseAppearance[]> {
  const sessions = await db.sessions.toArray();
  sessions.sort((a, b) => a.createdAt - b.createdAt);
  const out: ExerciseAppearance[] = [];
  for (const s of sessions) {
    const se = s.exercises.find((x) => x.exerciseId === id && !x.skipped);
    if (se) out.push({ sessionId: s.id, formRating: se.formRating });
  }
  return out;
}

async function getOrCreateState(id: ExerciseId): Promise<ExerciseProgressionState> {
  const existing = await db.progressionState.get(id);
  if (existing) return existing;
  const init: ExerciseProgressionState = {
    exerciseId: id,
    progressionStep: 0,
  };
  await db.progressionState.put(init);
  return init;
}

export async function findEligibleProgressions(): Promise<Exercise[]> {
  const exercises = getAllExercises();
  const eligible: Exercise[] = [];
  for (const ex of exercises) {
    const apps = await appearancesForExercise(ex.id);
    if (apps.length < REQUIRED_CLEAN_SESSIONS) continue;
    const state = await db.progressionState.get(ex.id);
    let pool = apps;
    if (state?.lastPromptSessionId) {
      const idx = apps.findIndex((a) => a.sessionId === state.lastPromptSessionId);
      pool = idx >= 0 ? apps.slice(idx + 1) : apps;
    }
    if (pool.length < REQUIRED_CLEAN_SESSIONS) continue;
    const tail = pool.slice(-REQUIRED_CLEAN_SESSIONS);
    if (tail.every((a) => a.formRating === 5)) eligible.push(ex);
  }
  return eligible;
}

async function latestSessionId(): Promise<string | undefined> {
  const sessions = await db.sessions.toArray();
  sessions.sort((a, b) => b.createdAt - a.createdAt);
  return sessions[0]?.id;
}

function bumpReps(reps: number | string): number | string {
  if (typeof reps === 'number') return Math.min(20, reps + 2);
  return reps;
}

export async function acceptProgression(id: ExerciseId): Promise<void> {
  const base = getExercise(id);
  const state = await getOrCreateState(id);
  const baseReps =
    state.repsOverride ?? base.defaultReps;
  const baseSets = state.setsOverride ?? base.defaultSets;
  const newCue = `${state.cueOverride ?? base.cueText}\n\nProgression: ${base.progressionNotes}`;
  const updated: ExerciseProgressionState = {
    ...state,
    progressionStep: state.progressionStep + 1,
    repsOverride: bumpReps(baseReps),
    setsOverride: baseSets,
    cueOverride: newCue,
    lastPromptSessionId: await latestSessionId(),
  };
  await db.progressionState.put(updated);

  const event: ProgressionEvent = {
    id: uid(),
    date: todayISO(),
    exerciseId: id,
    fromNotes: base.progressionNotes,
    acceptedAt: Date.now(),
  };
  await db.progressionEvents.add(event);
}

export async function dismissProgression(id: ExerciseId): Promise<void> {
  const state = await getOrCreateState(id);
  const updated: ExerciseProgressionState = {
    ...state,
    lastPromptSessionId: await latestSessionId(),
  };
  await db.progressionState.put(updated);
}
