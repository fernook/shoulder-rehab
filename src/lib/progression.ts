import { db, uid } from './db';
import { todayISO } from './date';
import {
  getAllExercises,
  getLevel,
  maxLevel,
  setCurrentLevel,
} from './exercises';
import type {
  Exercise,
  ExerciseId,
  ExerciseProgressionState,
  ProgressionEvent,
  Session,
} from './types';

const LEVEL_UP_THRESHOLD = 3;
const ADD_LOAD_THRESHOLD = 4;
const AGGRAVATION_THRESHOLD = 2;

export type Suggestion =
  | { kind: 'level-up'; exercise: Exercise; fromLevel: number; toLevel: number }
  | { kind: 'add-load'; exercise: Exercise; level: number }
  | { kind: 'level-down'; exercise: Exercise; fromLevel: number; toLevel: number };

type Appearance = {
  sessionId: string;
  level: number | undefined;
  formRating: number;
  aggravated?: boolean;
};

function appearancesFromSessions(
  sessions: Session[],
  id: ExerciseId
): Appearance[] {
  const out: Appearance[] = [];
  for (const s of sessions) {
    const se = s.exercises.find((x) => x.exerciseId === id && !x.skipped);
    if (se) {
      out.push({
        sessionId: s.id,
        level: se.level,
        formRating: se.formRating,
        aggravated: se.aggravated,
      });
    }
  }
  return out;
}

function resolveCurrentLevelFromCache(
  id: ExerciseId,
  state: ExerciseProgressionState | undefined,
  sessionsNewestFirst: Session[]
): number {
  if (state?.currentLevel != null) return state.currentLevel;
  for (const s of sessionsNewestFirst) {
    const se = s.exercises.find(
      (x) => x.exerciseId === id && x.level != null
    );
    if (se?.level != null) return se.level;
  }
  return 1;
}

function suggestionForExercise(
  ex: Exercise,
  apps: Appearance[],
  currentLevel: number,
  state: ExerciseProgressionState | undefined
): Suggestion | null {
  // Pool of appearances since the last prompt for this exercise
  let pool = apps;
  if (state?.lastPromptSessionId) {
    const idx = apps.findIndex((a) => a.sessionId === state.lastPromptSessionId);
    if (idx >= 0) pool = apps.slice(idx + 1);
  }
  const atLevel = pool.filter((a) => a.level === currentLevel);

  // Aggravation drop-level suggestion takes priority
  if (atLevel.length >= AGGRAVATION_THRESHOLD && currentLevel > 1) {
    const tail = atLevel.slice(-AGGRAVATION_THRESHOLD);
    if (tail.every((a) => a.aggravated === true)) {
      return {
        kind: 'level-down',
        exercise: ex,
        fromLevel: currentLevel,
        toLevel: currentLevel - 1,
      };
    }
  }

  const max = maxLevel(ex);
  if (currentLevel < max) {
    if (atLevel.length >= LEVEL_UP_THRESHOLD) {
      const tail = atLevel.slice(-LEVEL_UP_THRESHOLD);
      if (tail.every((a) => a.formRating === 5)) {
        return {
          kind: 'level-up',
          exercise: ex,
          fromLevel: currentLevel,
          toLevel: currentLevel + 1,
        };
      }
    }
  } else if (atLevel.length >= ADD_LOAD_THRESHOLD) {
    const tail = atLevel.slice(-ADD_LOAD_THRESHOLD);
    if (tail.every((a) => a.formRating === 5)) {
      return { kind: 'add-load', exercise: ex, level: currentLevel };
    }
  }

  return null;
}

export async function findSuggestions(): Promise<Suggestion[]> {
  // Fetch all DB data ONCE up-front, then compute in memory.
  // This matters on iOS Safari where chained IDB calls are slow.
  const [sessions, states] = await Promise.all([
    db.sessions.toArray(),
    db.progressionState.toArray(),
  ]);
  const sortedAsc = [...sessions].sort((a, b) => a.createdAt - b.createdAt);
  const sortedDesc = [...sessions].sort((a, b) => b.createdAt - a.createdAt);
  const stateById = new Map(states.map((s) => [s.exerciseId, s]));

  const exercises = getAllExercises();
  const out: Suggestion[] = [];
  for (const ex of exercises) {
    const apps = appearancesFromSessions(sortedAsc, ex.id);
    const state = stateById.get(ex.id);
    const currentLevel = resolveCurrentLevelFromCache(ex.id, state, sortedDesc);
    const s = suggestionForExercise(ex, apps, currentLevel, state);
    if (s) out.push(s);
  }
  return out;
}

async function latestSessionId(): Promise<string | undefined> {
  const sessions = await db.sessions.toArray();
  sessions.sort((a, b) => b.createdAt - a.createdAt);
  return sessions[0]?.id;
}

async function recordPrompt(id: ExerciseId): Promise<void> {
  const existing = (await db.progressionState.get(id)) ?? { exerciseId: id };
  const updated: ExerciseProgressionState = {
    ...existing,
    lastPromptSessionId: await latestSessionId(),
  };
  await db.progressionState.put(updated);
}

export async function acceptSuggestion(s: Suggestion): Promise<void> {
  if (s.kind === 'level-up' || s.kind === 'level-down') {
    await setCurrentLevel(s.exercise.id, s.toLevel);
    const event: ProgressionEvent = {
      id: uid(),
      date: todayISO(),
      exerciseId: s.exercise.id,
      kind: s.kind,
      fromLevel: s.fromLevel,
      toLevel: s.toLevel,
      acceptedAt: Date.now(),
    };
    await db.progressionEvents.add(event);
  } else {
    const event: ProgressionEvent = {
      id: uid(),
      date: todayISO(),
      exerciseId: s.exercise.id,
      kind: 'add-load',
      toLevel: s.level,
      acceptedAt: Date.now(),
    };
    await db.progressionEvents.add(event);
  }
  await recordPrompt(s.exercise.id);
}

export async function dismissSuggestion(s: Suggestion): Promise<void> {
  await recordPrompt(s.exercise.id);
}

export function suggestionTitle(s: Suggestion): string {
  const ex = s.exercise;
  if (s.kind === 'level-up') {
    const next = getLevel(ex, s.toLevel);
    return `Move ${ex.name} up to Level ${next.level}: ${next.name}?`;
  }
  if (s.kind === 'level-down') {
    const next = getLevel(ex, s.toLevel);
    return `${ex.name} has aggravated twice in a row — drop to Level ${next.level}: ${next.name}?`;
  }
  return `${ex.name} is solid at Level ${s.level} — add load or volume?`;
}

export function suggestionBody(s: Suggestion): string {
  const ex = s.exercise;
  if (s.kind === 'level-up') {
    return getLevel(ex, s.toLevel).graduationCriteria;
  }
  return ex.progressionNotes;
}
