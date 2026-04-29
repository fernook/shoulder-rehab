import { db, uid } from './db';
import { todayISO } from './date';
import type { Session, SessionExercise, FormRating } from './types';

export async function createSession(input: {
  date?: string;
  exercises: SessionExercise[];
  overallFeel: FormRating;
  notes?: string;
  durationMinutes?: number;
}): Promise<Session> {
  const session: Session = {
    id: uid(),
    date: input.date ?? todayISO(),
    exercises: input.exercises,
    overallFeel: input.overallFeel,
    notes: input.notes,
    durationMinutes: input.durationMinutes,
    createdAt: Date.now(),
  };
  await db.sessions.add(session);
  return session;
}

export async function getSessionsForDate(date: string): Promise<Session[]> {
  return db.sessions.where('date').equals(date).toArray();
}

export async function getAllSessions(): Promise<Session[]> {
  const all = await db.sessions.toArray();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getLastSession(): Promise<Session | undefined> {
  const all = await getAllSessions();
  return all[0];
}
