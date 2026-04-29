export function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function isoFromDate(d: Date): string {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

// Monday as start of week
export function startOfWeek(d: Date = new Date()): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = x.getDay(); // 0=Sun ... 6=Sat
  const diff = (day + 6) % 7; // days since Monday
  x.setDate(x.getDate() - diff);
  return x;
}

export function weekDates(d: Date = new Date()): Date[] {
  const start = startOfWeek(d);
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return x;
  });
}

export function weeksBetween(startISO: string, endISO: string): number {
  const a = new Date(startISO + 'T00:00:00');
  const b = new Date(endISO + 'T00:00:00');
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / (7 * 24 * 60 * 60 * 1000));
}

export function daysBetween(startISO: string, endISO: string): number {
  const a = new Date(startISO + 'T00:00:00');
  const b = new Date(endISO + 'T00:00:00');
  return Math.floor((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

export function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelative(iso: string): string {
  const today = todayISO();
  const diff = daysBetween(iso, today);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return formatDate(iso);
}
