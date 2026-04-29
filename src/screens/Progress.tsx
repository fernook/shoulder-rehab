import { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { db, getSettings } from '../lib/db';
import { isoFromDate, startOfWeek, weeksBetween } from '../lib/date';
import { TRIGGER_LABELS } from '../lib/checks';
import { getAllExercises } from '../lib/exercises';
import { currentPhase, phaseLabel, weekNumberFromStart } from '../lib/phase';
import type {
  FunctionalCheck,
  Session,
  Settings,
  FunctionalCheckTrigger,
} from '../lib/types';

const TRIGGER_COLORS: Record<FunctionalCheckTrigger, string> = {
  suit: '#f97316',
  'baby-carrier': '#22d3ee',
  backpack: '#a78bfa',
  lifting: '#f43f5e',
  other: '#94a3b8',
};

function weekKey(d: Date): string {
  return isoFromDate(startOfWeek(d));
}

function buildAdherence(sessions: Session[], target: number, startDate: string) {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const k = weekKey(new Date(s.date + 'T00:00:00'));
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  const startWeek = weekKey(new Date(startDate + 'T00:00:00'));
  const today = weekKey(new Date());
  const weeks: { week: string; sessions: number; target: number }[] = [];
  const cursor = new Date(startWeek + 'T00:00:00');
  const end = new Date(today + 'T00:00:00');
  while (cursor <= end) {
    const k = isoFromDate(cursor);
    weeks.push({ week: k.slice(5), sessions: map.get(k) ?? 0, target });
    cursor.setDate(cursor.getDate() + 7);
  }
  return weeks;
}

function buildFormTrend(sessions: Session[]) {
  const exercises = getAllExercises();
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  type Row = Record<string, string | number | undefined> & { date: string };
  const rows: Row[] = sorted.map((s) => {
    const r: Row = { date: s.date.slice(5) };
    for (const ex of exercises) {
      const se = s.exercises.find(
        (x) => x.exerciseId === ex.id && !x.skipped
      );
      if (se) r[ex.id] = se.formRating;
    }
    return r;
  });
  const smoothed: Row[] = rows.map((_, i) => {
    const r: Row = { date: rows[i].date };
    for (const ex of exercises) {
      const window: number[] = [];
      for (let j = Math.max(0, i - 3); j <= i; j++) {
        const v = rows[j][ex.id];
        if (typeof v === 'number') window.push(v);
      }
      if (window.length > 0) {
        r[ex.id] =
          Math.round(
            (window.reduce((a, b) => a + b, 0) / window.length) * 100
          ) / 100;
      }
    }
    return r;
  });
  return smoothed;
}

const EXERCISE_COLORS: Record<string, string> = {
  'wall-slides': '#60a5fa',
  'prone-ytw': '#34d399',
  'serratus-slide': '#fbbf24',
  'band-pull-aparts': '#f472b6',
  'face-pulls': '#a78bfa',
};

export default function Progress() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [checks, setChecks] = useState<FunctionalCheck[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setSettings(s);
      setSessions(await db.sessions.toArray());
      setChecks(await db.checks.toArray());
    })();
  }, []);

  const adherence = useMemo(
    () =>
      settings
        ? buildAdherence(sessions, settings.weeklyTarget, settings.startDate)
        : [],
    [sessions, settings]
  );

  const formTrend = useMemo(() => buildFormTrend(sessions), [sessions]);

  const levelTrend = useMemo(() => {
    const exercises = getAllExercises();
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    type Row = Record<string, string | number | undefined> & { date: string };
    return sorted.map((s) => {
      const r: Row = { date: s.date.slice(5) };
      for (const ex of exercises) {
        const se = s.exercises.find(
          (x) => x.exerciseId === ex.id && !x.skipped && x.level != null
        );
        if (se?.level != null) r[ex.id] = se.level;
      }
      return r;
    });
  }, [sessions]);

  const aggravationPoints = useMemo(() => {
    const sorted = [...checks].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map((c) => {
      const d = new Date(c.date + 'T00:00:00');
      return {
        x: d.getTime(),
        y: c.aggravation,
        trigger: c.trigger,
        date: c.date,
      };
    });
  }, [checks]);

  const aggByTrigger = useMemo(() => {
    const groups: Record<string, typeof aggravationPoints> = {};
    for (const p of aggravationPoints) {
      (groups[p.trigger] ||= []).push(p);
    }
    return groups;
  }, [aggravationPoints]);

  if (!settings) return <div className="text-neutral-500">Loading…</div>;

  const phase = currentPhase(settings);
  const weekNum = weekNumberFromStart(settings.startDate);
  const totalWeeks = 26;
  const phasePct = Math.min(100, Math.round((weekNum / totalWeeks) * 100));

  const exercises = getAllExercises();

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Progress</h1>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-400">
          Real-world load tolerance
        </h2>
        <div className="card">
          {aggravationPoints.length === 0 ? (
            <div className="py-6 text-center text-sm text-neutral-500">
              Log functional checks to see this chart.
            </div>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={['auto', 'auto']}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })
                    }
                    stroke="#737373"
                    fontSize={11}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    domain={[0, 5]}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    stroke="#737373"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#171717',
                      border: '1px solid #262626',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={(v) =>
                      new Date(v as number).toLocaleDateString()
                    }
                    formatter={(value, _name, item) => [
                      String(value),
                      TRIGGER_LABELS[
                        (item?.payload as { trigger: FunctionalCheckTrigger })
                          .trigger
                      ],
                    ]}
                  />
                  {Object.entries(aggByTrigger).map(([trig, pts]) => (
                    <Scatter
                      key={trig}
                      name={TRIGGER_LABELS[trig as FunctionalCheckTrigger]}
                      data={pts}
                      fill={TRIGGER_COLORS[trig as FunctionalCheckTrigger]}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-400">
          Adherence (sessions / week)
        </h2>
        <div className="card">
          {adherence.length === 0 ? (
            <div className="py-6 text-center text-sm text-neutral-500">
              No data yet.
            </div>
          ) : (
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <LineChart data={adherence} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                  <XAxis dataKey="week" stroke="#737373" fontSize={11} />
                  <YAxis
                    domain={[0, Math.max(settings.weeklyTarget + 1, 5)]}
                    stroke="#737373"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#171717',
                      border: '1px solid #262626',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <ReferenceLine
                    y={settings.weeklyTarget}
                    stroke="#525252"
                    strokeDasharray="4 4"
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="#e5e5e5"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-400">
          Level over time
        </h2>
        <div className="card">
          {levelTrend.length === 0 || levelTrend.every((r) =>
            getAllExercises().every((e) => r[e.id] == null)
          ) ? (
            <div className="py-6 text-center text-sm text-neutral-500">
              Log a session to see level progression.
            </div>
          ) : (
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <LineChart data={levelTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    stroke="#737373"
                    fontSize={11}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#171717',
                      border: '1px solid #262626',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {exercises.map((e) => (
                    <Line
                      key={e.id}
                      type="stepAfter"
                      dataKey={e.id}
                      name={e.name}
                      stroke={EXERCISE_COLORS[e.id]}
                      strokeWidth={1.75}
                      dot={{ r: 2 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-400">
          Form rating (4-session rolling avg)
        </h2>
        <div className="card">
          {formTrend.length === 0 ? (
            <div className="py-6 text-center text-sm text-neutral-500">
              Log a few sessions to see trends.
            </div>
          ) : (
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={formTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#262626" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="#737373" fontSize={11} />
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    stroke="#737373"
                    fontSize={11}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#171717',
                      border: '1px solid #262626',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {exercises.map((e) => (
                    <Line
                      key={e.id}
                      type="monotone"
                      dataKey={e.id}
                      name={e.name}
                      stroke={EXERCISE_COLORS[e.id]}
                      strokeWidth={1.5}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-neutral-400">Phase progress</h2>
        <div className="card space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="font-medium">{phaseLabel(phase)}</div>
            <div className="text-sm text-neutral-500 tabular-nums">
              week {weekNum} of ~{totalWeeks}
            </div>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full bg-neutral-100"
              style={{ width: `${phasePct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>Activation</span>
            <span>Integration</span>
            <span>Consolidation</span>
            <span>Maintenance</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// suppress unused import if tree-shaking complains
void weeksBetween;
