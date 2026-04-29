import { db, uid } from './db';
import { todayISO } from './date';
import {
  getAllExercises,
  getExercise,
  getLevel,
  maxLevel,
  resolveCurrentLevel,
  setCurrentLevel,
} from './exercises';
import type {
  Exercise,
  ExerciseId,
  ExerciseProgressionState,
  ProgressionEvent,
  Session,
} from './types';

const LEVEL_UP_THRESHOLD = 3; // 3 sessions form 5/5 at current level
const ADD_LOAD_THRESHOLD = 4; // 4 sessions form 5/5 at max level
const AGGRAVATION_THRESHOLD = 2; // 2 consecutive aggravated sessions at current level

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

async function appearancesForExercise(id: ExerciseId): Promise<{
  all: Appearance[];
  sessions: Session[];
}> {
  const sessions = await db.sessions.toArray();
  sessions.sort((a, b) => a.createdAt - b.createdAt);
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
  return { all: out, sessions };
}

async function poolSinceLastPrompt(
  id: ExerciseId,
  apps: Appearance[]
): Promise<Appearance[]> {
  const state = await db.progressionState.get(id);
  if (!state?.lastPromptSessionId) return apps;
  const idx = apps.findIndex((a) => a.sessionId === state.lastPromptSessionId);
  return idx >= 0 ? apps.slice(idx + 1) : apps;
}

async function suggestionForExercise(ex: Exercise): Promise<Suggestion | null> {
  const { all } = await appearancesForExercise(ex.id);
  const currentLevel = await resolveCurrentLevel(ex.id);
  const pool = await poolSinceLastPrompt(ex.id, all);
  const atLevel = pool.filter((a) => a.level === currentLevel);

  // Aggravation drop-level suggestion takes priority
  if (atLevel.length >= AGGRAVATION_THRESHOLD) {
    const tail = atLevel.slice(-AGGRAVATION_THRESHOLD);
    if (tail.every((a) => a.aggravated === true) && currentLevel > 1) {
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
  } else {
    if (atLevel.length >= ADD_LOAD_THRESHOLD) {
      const tail = atLevel.slice(-ADD_LOAD_THRESHOLD);
      if (tail.every((a) => a.formRating === 5)) {
        return { kind: 'add-load', exercise: ex, level: currentLevel };
      }
    }
  }

  return null;
}

export async function findSuggestions(): Promise<Suggestion[]> {
  const exercises = getAllExercises();
  const out: Suggestion[] = [];
  for (const ex of exercises) {
    const s = await suggestionForExercise(ex);
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
  const existing = (await db.progressionState.get(id)) ?? {
    exerciseId: id,
  };
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
    // add-load: no level change, but record the event so it doesn't re-prompt
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
  if (s.kind === 'level-down') {
    return ex.progressionNotes;
  }
  return ex.progressionNotes;
}

// Back-compat exports for callers that still reference the old API names.
// These wrap the new findSuggestions / accept / dismiss functions.
export async function findEligibleProgressions(): Promise<Exercise[]> {
  const ss = await findSuggestions();
  return ss.map((s) => s.exercise);
}

export async function acceptProgression(id: ExerciseId): Promise<void> {
  const ss = await findSuggestions();
  const s = ss.find((x) => x.exercise.id === id);
  if (s) await acceptSuggestion(s);
}

export async function dismissProgression(id: ExerciseId): Promise<void> {
  const ss = await findSuggestions();
  const s = ss.find((x) => x.exercise.id === id);
  if (s) await dismissSuggestion(s);
  else {
    // Fall back to recording a prompt for this exercise even if no current suggestion
    await recordPrompt(id);
  }
}

void getExercise;
