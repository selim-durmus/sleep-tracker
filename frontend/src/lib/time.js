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

export function isoToLocalInput(iso) {
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function localInputToIso(value) {
  return new Date(value).toISOString();
}

export function formatTimeInput(ms) {
  if (ms == null) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function applyTimeInput(ms, timeStr) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23 || m > 59) return null;
  const d = ms != null ? new Date(ms) : new Date();
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function formatDateInput(ms) {
  if (ms == null) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function applyDateInput(ms, dateStr) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const d = ms != null ? new Date(ms) : new Date();
  d.setFullYear(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  return d.getTime();
}

export function autoFormatTimeDigits(input) {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + ':' + digits.slice(2);
}

export function formatDateMDInput(ms) {
  if (ms == null) return '';
  const d = new Date(ms);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}

export function applyDateMDInput(ms, str) {
  const match = /^(\d{1,2})\/(\d{1,2})$/.exec(str.trim());
  if (!match) return null;
  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = ms != null ? new Date(ms) : new Date();
  d.setMonth(month - 1);
  d.setDate(day);
  return d.getTime();
}

export function autoFormatDateDigits(input) {
  const digits = input.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return digits.slice(0, 2) + '/' + digits.slice(2);
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
