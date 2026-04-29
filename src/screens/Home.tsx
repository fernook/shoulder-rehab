import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db, getSettings, updateSettings } from '../lib/db';
import LevelsOnboarding from '../components/LevelsOnboarding';
import { isoFromDate, todayISO, weekDates, formatRelative } from '../lib/date';
import { currentPhase, phaseLabel, weekNumberFromStart } from '../lib/phase';
import {
  acceptSuggestion,
  dismissSuggestion,
  findSuggestions,
  type Suggestion,
} from '../lib/progression';
import ProgressionCard from '../components/ProgressionCard';
import type { FunctionalCheck, Session, Settings } from '../lib/types';

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function Home() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lastCheck, setLastCheck] = useState<FunctionalCheck | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const reload = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    const all = await db.sessions.toArray();
    setSessions(all);
    const checks = await db.checks.toArray();
    checks.sort((a, b) => b.createdAt - a.createdAt);
    setLastCheck(checks[0] ?? null);
    setSuggestions(await findSuggestions());

    if (!s.levelsOnboardingSeen) {
      const hasLegacy = all.some((sess) =>
        sess.exercises.some((e) => e.level == null && !e.skipped)
      );
      if (hasLegacy) {
        setShowOnboarding(true);
      } else {
        await updateSettings({ levelsOnboardingSeen: true });
      }
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!settings) return <div className="text-neutral-500">Loading…</div>;

  const today = todayISO();
  const sessionDates = new Set(sessions.map((s) => s.date));
  const week = weekDates();
  const weekISO = week.map(isoFromDate);
  const sessionsThisWeek = weekISO.filter((d) => sessionDates.has(d)).length;
  const loggedToday = sessionDates.has(today);
  const lastSession = [...sessions].sort((a, b) => b.createdAt - a.createdAt)[0];
  const phase = currentPhase(settings);
  const weekNum = weekNumberFromStart(settings.startDate);

  return (
    <div className="space-y-6">
      {showOnboarding && (
        <LevelsOnboarding
          onDone={() => {
            setShowOnboarding(false);
            reload();
          }}
        />
      )}
      <header>
        <div className="text-sm text-neutral-500">
          {phaseLabel(phase)} phase · week {weekNum}
        </div>
      </header>

      {suggestions.length > 0 && (
        <ProgressionCard
          suggestion={suggestions[0]}
          onAccept={async () => {
            await acceptSuggestion(suggestions[0]);
            await reload();
          }}
          onDismiss={async () => {
            await dismissSuggestion(suggestions[0]);
            await reload();
          }}
        />
      )}

      {loggedToday ? (
        <div className="card flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">Session logged ✓</div>
            <div className="text-sm text-neutral-500">Done for today</div>
          </div>
          <Link to="/session" className="btn btn-secondary">
            Log another
          </Link>
        </div>
      ) : (
        <Link to="/session" className="btn btn-primary block w-full text-center text-lg py-4">
          Start session
        </Link>
      )}

      <section className="card">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-neutral-400">This week</h2>
          <div className="text-sm tabular-nums text-neutral-300">
            {sessionsThisWeek} of {settings.weeklyTarget}
          </div>
        </div>
        <div className="flex gap-2">
          {week.map((d, i) => {
            const iso = weekISO[i];
            const filled = sessionDates.has(iso);
            const isToday = iso === today;
            return (
              <div key={iso} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm ${
                    filled
                      ? 'bg-neutral-100 text-neutral-900'
                      : isToday
                      ? 'border border-neutral-600 text-neutral-400'
                      : 'bg-neutral-800 text-neutral-500'
                  }`}
                >
                  {d.getDate()}
                </div>
                <div className="text-[10px] text-neutral-500">{DAY_LETTERS[i]}</div>
              </div>
            );
          })}
        </div>
      </section>

      <Link
        to="/check"
        className="block rounded-2xl border border-dashed border-neutral-700 p-4 text-center text-neutral-300 active:bg-neutral-900"
      >
        Log functional check
      </Link>

      <section className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Last session</span>
          <span className="text-neutral-300">
            {lastSession ? formatRelative(lastSession.date) : '—'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Last functional check</span>
          <span className="text-neutral-300">
            {lastCheck ? formatRelative(lastCheck.date) : '—'}
          </span>
        </div>
      </section>
    </div>
  );
}
