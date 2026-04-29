import type { Phase, Settings } from './types';
import { todayISO, weeksBetween } from './date';

export function weekNumberFromStart(startDate: string, today = todayISO()): number {
  return weeksBetween(startDate, today) + 1;
}

export function phaseFromWeek(week: number): Phase {
  if (week <= 4) return 'activation';
  if (week <= 12) return 'integration';
  if (week <= 24) return 'consolidation';
  return 'maintenance';
}

export function currentPhase(settings: Settings): Phase {
  if (settings.phaseOverride) return settings.phaseOverride;
  return phaseFromWeek(weekNumberFromStart(settings.startDate));
}

export function phaseLabel(p: Phase): string {
  return p[0].toUpperCase() + p.slice(1);
}
