import { HOUR_MS } from './time.js';

const FIRST_NAP_WINDOW_MS = 3 * HOUR_MS;
const NAP_WAKE_WINDOW_MS = 3.5 * HOUR_MS;
const LAST_NAP_CUTOFF_HOUR = 14;

export function computeSuggestion(latestEntry) {
  if (!latestEntry) return null;
  const end = new Date(latestEntry.end_time);
  const endMs = end.getTime();

  if (latestEntry.type === 'night') {
    return { kind: 'nap', label: 'Next nap', atMs: endMs + FIRST_NAP_WINDOW_MS };
  }

  const napStart = new Date(latestEntry.start_time);
  const cutoff = new Date(napStart);
  cutoff.setHours(LAST_NAP_CUTOFF_HOUR, 0, 0, 0);
  const isLastNap = napStart.getTime() >= cutoff.getTime();

  return {
    kind: isLastNap ? 'bedtime' : 'nap',
    label: isLastNap ? 'Bedtime' : 'Next nap',
    atMs: endMs + NAP_WAKE_WINDOW_MS
  };
}
