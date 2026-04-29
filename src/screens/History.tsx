import { useEffect, useState } from 'react';
import { db } from '../lib/db';
import { formatRelative } from '../lib/date';
import { getExercise } from '../lib/exercises';
import { TRIGGER_LABELS } from '../lib/checks';
import type { FunctionalCheck, Session } from '../lib/types';

type Tab = 'sessions' | 'checks';

function avgForm(s: Session): number | null {
  const rated = s.exercises.filter((e) => !e.skipped);
  if (rated.length === 0) return null;
  const sum = rated.reduce((acc, e) => acc + e.formRating, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

function SessionRow({ s }: { s: Session }) {
  const [open, setOpen] = useState(false);
  const af = avgForm(s);
  const completed = s.exercises.filter((e) => !e.skipped).length;
  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between text-left"
      >
        <div>
          <div className="font-medium">{formatRelative(s.date)}</div>
          <div className="mt-1 text-sm text-neutral-500">
            {completed}/{s.exercises.length} exercises
            {af != null && ` · form ${af}`}
            {` · feel ${s.overallFeel}`}
          </div>
        </div>
        <div className="text-neutral-500">{open ? '▾' : '▸'}</div>
      </button>
      {open && (
        <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3 text-sm">
          {s.exercises.map((e) => {
            const ex = getExercise(e.exerciseId);
            return (
              <div key={e.exerciseId} className="flex items-baseline justify-between gap-3">
                <div>
                  <div className="text-neutral-200">{ex.name}</div>
                  {e.skipped ? (
                    <div className="text-xs text-neutral-500">
                      skipped — {e.skipReason}
                    </div>
                  ) : (
                    <div className="text-xs text-neutral-500">
                      {e.level != null && `L${e.level} · `}
                      {e.setsCompleted}×{e.repsCompleted}
                      {e.load && ` · ${e.load}`}
                      {e.aggravated && ' · aggravated'}
                      {e.notes && ` · ${e.notes}`}
                    </div>
                  )}
                </div>
                {!e.skipped && (
                  <div className="shrink-0 text-neutral-300 tabular-nums">
                    {e.formRating}/5
                  </div>
                )}
              </div>
            );
          })}
          {s.notes && (
            <div className="border-t border-neutral-800 pt-2 text-neutral-400">
              {s.notes}
            </div>
          )}
          {s.durationMinutes != null && (
            <div className="text-xs text-neutral-500">
              ~{s.durationMinutes} min
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CheckRow({ c }: { c: FunctionalCheck }) {
  return (
    <div className="card">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-medium">{TRIGGER_LABELS[c.trigger]}</div>
          <div className="mt-1 text-sm text-neutral-500">
            {formatRelative(c.date)} · {c.durationMinutes} min
            {c.triggerDetail && ` · ${c.triggerDetail}`}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-semibold tabular-nums">{c.aggravation}</div>
          <div className="text-[10px] uppercase text-neutral-500">aggravation</div>
        </div>
      </div>
      {c.notes && (
        <div className="mt-2 border-t border-neutral-800 pt-2 text-sm text-neutral-400">
          {c.notes}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const [tab, setTab] = useState<Tab>('sessions');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [checks, setChecks] = useState<FunctionalCheck[]>([]);

  useEffect(() => {
    (async () => {
      const ss = await db.sessions.toArray();
      ss.sort((a, b) => b.createdAt - a.createdAt);
      setSessions(ss);
      const cc = await db.checks.toArray();
      cc.sort((a, b) => b.createdAt - a.createdAt);
      setChecks(cc);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">History</h1>

      <div className="flex gap-2 rounded-xl bg-neutral-900 p-1">
        {(['sessions', 'checks'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              tab === t ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400'
            }`}
          >
            {t === 'sessions' ? 'Sessions' : 'Functional checks'}
          </button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div className="space-y-3">
          {sessions.length === 0 && (
            <div className="text-center text-neutral-500 py-8">
              No sessions yet.
            </div>
          )}
          {sessions.map((s) => (
            <SessionRow key={s.id} s={s} />
          ))}
        </div>
      )}

      {tab === 'checks' && (
        <div className="space-y-3">
          {checks.length === 0 && (
            <div className="text-center text-neutral-500 py-8">
              No functional checks logged.
            </div>
          )}
          {checks.map((c) => (
            <CheckRow key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
