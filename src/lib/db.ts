import Dexie, { type Table } from 'dexie';
import type {
  Session,
  FunctionalCheck,
  Settings,
  ProgressionEvent,
  ExerciseProgressionState,
} from './types';

class RehabDB extends Dexie {
  sessions!: Table<Session, string>;
  checks!: Table<FunctionalCheck, string>;
  settings!: Table<Settings, string>;
  progressionEvents!: Table<ProgressionEvent, string>;
  progressionState!: Table<ExerciseProgressionState, string>;

  constructor() {
    super('rehab-db');
    this.version(1).stores({
      sessions: 'id, date, createdAt',
      checks: 'id, date, trigger, createdAt',
      settings: 'id',
      progressionEvents: 'id, exerciseId, date',
      progressionState: 'exerciseId',
    });
  }
}

export const db = new RehabDB();

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('singleton');
  if (s) return s;
  const today = new Date().toISOString().slice(0, 10);
  const init: Settings = {
    id: 'singleton',
    startDate: today,
    weeklyTarget: 4,
  };
  await db.settings.put(init);
  return init;
}

export async function updateSettings(patch: Partial<Settings>) {
  const cur = await getSettings();
  const next: Settings = { ...cur, ...patch, id: 'singleton' };
  await db.settings.put(next);
  return next;
}
