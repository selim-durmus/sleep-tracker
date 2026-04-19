export const HOUR_MS = 60 * 60 * 1000;
export const DAY_START_HOUR = 6;

export function dayWindow(date) {
  const start = new Date(date);
  start.setHours(DAY_START_HOUR, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function shiftDay(date, delta) {
  const d = new Date(date);
  d.setDate(d.getDate() + delta);
  return d;
}

export function fmtDateLabel(date) {
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export function weekStart(date) {
  const d = new Date(date);
  d.setHours(DAY_START_HOUR, 0, 0, 0);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return d;
}

export function shiftDate(date, deltaDays) {
  const d = new Date(date);
  d.setDate(d.getDate() + deltaDays);
  return d;
}

export function fmtWeekRangeLabel(start) {
  const end = shiftDate(start, 6);
  const sameMonth = start.getMonth() === end.getMonth();
  const opts = { month: 'short', day: 'numeric' };
  const s = start.toLocaleDateString(undefined, opts);
  const e = sameMonth
    ? end.toLocaleDateString(undefined, { day: 'numeric' })
    : end.toLocaleDateString(undefined, opts);
  return `${s} – ${e}`;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

export function fmtHour(h) {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12} ${ampm}`;
}

export function fmtTimeShort(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function fmtHM(ms) {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
