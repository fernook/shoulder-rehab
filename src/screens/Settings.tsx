import { useEffect, useRef, useState } from 'react';
import { getSettings, updateSettings } from '../lib/db';
import { phaseFromWeek, phaseLabel, weekNumberFromStart } from '../lib/phase';
import {
  Backup,
  downloadJson,
  exportAll,
  importAll,
  resetAll,
} from '../lib/backup';
import { getTheme, setTheme as applySetTheme, type Theme } from '../lib/theme';
import type { Phase, Settings as SettingsType } from '../lib/types';

const PHASES: Phase[] = ['activation', 'integration', 'consolidation', 'maintenance'];

export default function Settings() {
  const [s, setS] = useState<SettingsType | null>(null);
  const [theme, setThemeState] = useState<Theme>('dark');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getSettings().then(setS);
    setThemeState(getTheme());
  }, []);

  if (!s) return <div className="text-neutral-500">Loading…</div>;

  const autoPhase = phaseFromWeek(weekNumberFromStart(s.startDate));
  const effectivePhase = s.phaseOverride ?? autoPhase;

  async function patch(p: Partial<SettingsType>) {
    const next = await updateSettings(p);
    setS(next);
  }

  async function handleExport() {
    const data = await exportAll();
    const stamp = new Date().toISOString().slice(0, 10);
    downloadJson(`rehab-backup-${stamp}.json`, data);
  }

  async function handleImportFile(file: File) {
    setImportStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text) as Backup;
      const ok = window.confirm(
        'Import will REPLACE all current data. Continue?'
      );
      if (!ok) return;
      await importAll(data, 'replace');
      setImportStatus('Imported. Reload to see changes.');
      const fresh = await getSettings();
      setS(fresh);
    } catch (err) {
      setImportStatus(`Failed: ${(err as Error).message}`);
    }
  }

  async function handleReset() {
    const ok = window.confirm(
      'Delete ALL sessions, checks, settings, and progression data? This cannot be undone.'
    );
    if (!ok) return;
    await resetAll();
    const fresh = await getSettings();
    setS(fresh);
    setImportStatus('Reset complete.');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="card space-y-4">
        <div>
          <label className="label">Program start date</label>
          <input
            type="date"
            className="input"
            value={s.startDate}
            onChange={(e) => patch({ startDate: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Weekly target</label>
          <input
            type="number"
            min={1}
            max={7}
            className="input"
            value={s.weeklyTarget}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (!Number.isNaN(n)) patch({ weeklyTarget: Math.max(1, Math.min(7, n)) });
            }}
          />
        </div>

        <div>
          <label className="label">
            Current phase {!s.phaseOverride && <span className="text-neutral-500">(auto: {phaseLabel(autoPhase)})</span>}
          </label>
          <div className="flex flex-wrap gap-2">
            {PHASES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => patch({ phaseOverride: p })}
                className={`rounded-xl px-3 py-2 text-sm ${
                  effectivePhase === p
                    ? 'bg-neutral-100 text-neutral-900'
                    : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {phaseLabel(p)}
              </button>
            ))}
          </div>
          {s.phaseOverride && (
            <button
              type="button"
              onClick={() => patch({ phaseOverride: undefined })}
              className="mt-2 text-sm text-neutral-500 underline-offset-2 hover:underline"
            >
              Clear override
            </button>
          )}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-medium text-neutral-400">Appearance</h2>
        <div className="flex gap-2">
          {(['dark', 'light'] as Theme[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                applySetTheme(t);
                setThemeState(t);
              }}
              className={`flex-1 rounded-xl py-2 text-sm font-medium ${
                theme === t
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'bg-neutral-800 text-neutral-300'
              }`}
            >
              {t === 'dark' ? 'Dark' : 'Light'}
            </button>
          ))}
        </div>
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-medium text-neutral-400">Backup</h2>
        <button type="button" onClick={handleExport} className="btn btn-secondary w-full">
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn btn-secondary w-full"
        >
          Import JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleImportFile(f);
            e.target.value = '';
          }}
        />
        {importStatus && (
          <div className="text-sm text-neutral-400">{importStatus}</div>
        )}
      </section>

      <section className="card space-y-3">
        <h2 className="text-sm font-medium text-neutral-400">Danger zone</h2>
        <button
          type="button"
          onClick={handleReset}
          className="w-full rounded-xl bg-red-950 py-3 font-medium text-red-200 active:bg-red-900"
        >
          Reset all data
        </button>
      </section>
    </div>
  );
}
