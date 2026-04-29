import { db, uid } from './db';
import { todayISO } from './date';
import type { FunctionalCheck, FunctionalCheckTrigger, Aggravation } from './types';

export const TRIGGER_LABELS: Record<FunctionalCheckTrigger, string> = {
  suit: 'Suit',
  'baby-carrier': 'Baby carrier',
  backpack: 'Backpack',
  lifting: 'Lifting',
  other: 'Other',
};

export async function createCheck(input: {
  trigger: FunctionalCheckTrigger;
  triggerDetail?: string;
  durationMinutes: number;
  aggravation: Aggravation;
  notes?: string;
  date?: string;
}): Promise<FunctionalCheck> {
  const c: FunctionalCheck = {
    id: uid(),
    date: input.date ?? todayISO(),
    trigger: input.trigger,
    triggerDetail: input.triggerDetail,
    durationMinutes: input.durationMinutes,
    aggravation: input.aggravation,
    notes: input.notes,
    createdAt: Date.now(),
  };
  await db.checks.add(c);
  return c;
}

export async function getAllChecks(): Promise<FunctionalCheck[]> {
  const all = await db.checks.toArray();
  return all.sort((a, b) => b.createdAt - a.createdAt);
}
