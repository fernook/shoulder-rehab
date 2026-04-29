import { db } from './db';

export type Backup = {
  version: 1;
  exportedAt: string;
  sessions: unknown[];
  checks: unknown[];
  settings: unknown[];
  progressionEvents: unknown[];
  progressionState: unknown[];
};

export async function exportAll(): Promise<Backup> {
  const [sessions, checks, settings, progressionEvents, progressionState] = await Promise.all([
    db.sessions.toArray(),
    db.checks.toArray(),
    db.settings.toArray(),
    db.progressionEvents.toArray(),
    db.progressionState.toArray(),
  ]);
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
    checks,
    settings,
    progressionEvents,
    progressionState,
  };
}

export async function importAll(data: Backup, mode: 'replace' | 'merge' = 'replace') {
  if (data.version !== 1) throw new Error(`Unsupported backup version: ${data.version}`);
  await db.transaction(
    'rw',
    [db.sessions, db.checks, db.settings, db.progressionEvents, db.progressionState],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.sessions.clear(),
          db.checks.clear(),
          db.settings.clear(),
          db.progressionEvents.clear(),
          db.progressionState.clear(),
        ]);
      }
      // bulkPut handles duplicates by id in merge mode
      await db.sessions.bulkPut(data.sessions as never);
      await db.checks.bulkPut(data.checks as never);
      await db.settings.bulkPut(data.settings as never);
      await db.progressionEvents.bulkPut(data.progressionEvents as never);
      await db.progressionState.bulkPut(data.progressionState as never);
    }
  );
}

export async function resetAll() {
  await db.transaction(
    'rw',
    [db.sessions, db.checks, db.settings, db.progressionEvents, db.progressionState],
    async () => {
      await Promise.all([
        db.sessions.clear(),
        db.checks.clear(),
        db.settings.clear(),
        db.progressionEvents.clear(),
        db.progressionState.clear(),
      ]);
    }
  );
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
