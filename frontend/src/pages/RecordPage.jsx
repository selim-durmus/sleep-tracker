import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTimer } from '../hooks/useTimer.js';
import { usePullToRefresh } from '../hooks/usePullToRefresh.js';
import { api } from '../lib/api.js';
import { formatDuration, classifyType } from '../lib/format.js';
import {
  fmtHM,
  fmtTimeShort,
  dayWindow,
  formatTimeInput,
  applyTimeInput,
  formatDateInput,
  applyDateInput,
  autoFormatTimeDigits
} from '../lib/time.js';
import { computeSuggestion } from '../lib/schedule.js';
import { buzz } from '../lib/haptic.js';
import { useToast } from '../components/ToastProvider.jsx';
import TimeAdjustButtons from '../components/TimeAdjustButtons.jsx';
import PullIndicator from '../components/PullIndicator.jsx';

const AWAKE_ALARM_MS = 3.5 * 60 * 60 * 1000;

export default function RecordPage() {
  const { status, start, end, elapsedMs, startTimer, pause, resume, reset, save, updateStart, updateEnd, refresh } = useTimer();
  const [saving, setSaving] = useState(false);
  const [latest, setLatest] = useState(null);
  const [todayEntries, setTodayEntries] = useState([]);
  const [, tick] = useState(0);
  const showToast = useToast();

  const classifyAt = start ?? Date.now();
  const type = classifyType(classifyAt);

  const loadContext = useCallback(async () => {
    const { start: dayStart, end: dayEnd } = dayWindow(new Date());
    const [entry, rows] = await Promise.all([
      api.latestEntry().catch(() => null),
      api.listEntries(dayStart.toISOString(), dayEnd.toISOString()).catch(() => [])
    ]);
    setLatest(entry);
    setTodayEntries(rows || []);
  }, []);

  useEffect(() => {
    if (status !== 'idle') return;
    loadContext();
  }, [status, loadContext]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refresh(), loadContext()]);
  }, [refresh, loadContext]);

  const { handlers: pullHandlers, pull, refreshing, threshold } = usePullToRefresh(handleRefresh);
  const pullOffset = pull || (refreshing ? threshold : 0);

  useEffect(() => {
    if (status !== 'idle' || !latest) return;
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [status, latest]);

  const awakeMs = status === 'idle' && latest
    ? Date.now() - new Date(latest.end_time).getTime()
    : null;

  const suggestion = useMemo(() => {
    if (status !== 'idle') return null;
    return computeSuggestion(latest);
  }, [status, latest]);

  const today = useMemo(() => {
    const { start: dayStart, end: dayEnd } = dayWindow(new Date());
    let napMs = 0, nightMs = 0, naps = 0;
    for (const e of todayEntries) {
      const s = new Date(e.start_time);
      if (s < dayStart || s >= dayEnd) continue;
      const ms = new Date(e.end_time) - s;
      if (e.type === 'night') nightMs += ms;
      else { napMs += ms; naps += 1; }
    }
    return { napMs, nightMs, naps, totalMs: napMs + nightMs };
  }, [todayEntries]);

  async function handleSave() {
    if (saving || start == null || end == null || end <= start) return;
    setSaving(true);
    buzz(15);
    try {
      await save();
      showToast('Entry saved');
    } catch (err) {
      console.error(err);
      showToast('Failed to save', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full relative overflow-hidden" {...pullHandlers}>
      <PullIndicator pull={pull} refreshing={refreshing} threshold={threshold} />
      <div
        className="flex flex-col items-center h-full px-6 pt-4 gap-6"
        style={{
          transform: `translateY(${pullOffset}px)`,
          transition: pull ? 'none' : 'transform 200ms ease-out'
        }}
      >
      {status === 'idle' && today.totalMs > 0 && (
        <TodayPill naps={today.naps} totalMs={today.totalMs} />
      )}

      <TimeBar
        start={start}
        end={end}
        status={status}
        onChangeStart={updateStart}
        onChangeEnd={updateEnd}
      />

      <div className="flex flex-col items-center gap-2 mt-2">
        <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          {type === 'night' ? 'Night sleep' : 'Nap'}
        </span>
        <div className="text-6xl font-light tabular-nums text-neutral-100">
          {formatDuration(elapsedMs)}
        </div>
      </div>

      <div className="flex-1" />

      {status === 'idle' && latest && (
        <LastNap entry={latest} />
      )}

      {awakeMs != null && awakeMs > 0 && (
        <AwakeTracker ms={awakeMs} />
      )}

      {suggestion && <SuggestionPill suggestion={suggestion} />}

      <div className="pb-20 w-full flex flex-col items-center gap-6">
        {status === 'idle' && (
          <button
            onClick={() => { buzz(12); startTimer(); }}
            className="w-40 h-40 rounded-full bg-blue-600 active:bg-blue-700 text-white text-xl font-medium shadow-lg shadow-blue-900/50 transition-colors"
          >
            Start
          </button>
        )}

        {status === 'running' && (
          <button
            onClick={() => { buzz(12); pause(); }}
            className="relative w-40 h-40 rounded-full bg-neutral-800 border-2 border-red-500 active:bg-neutral-700 text-red-400 text-xl font-medium transition-colors"
          >
            <span className="absolute inset-0 rounded-full border-2 border-red-500/60 animate-ping" />
            <span className="relative">Stop</span>
          </button>
        )}

        {status === 'paused' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-xs">
            <div className="flex gap-3 w-full">
              <button
                onClick={() => { buzz(10); resume(); }}
                className="flex-1 py-4 rounded-xl bg-neutral-800 active:bg-neutral-700 text-neutral-100 font-medium"
              >
                Resume
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !(end > start)}
                className="flex-1 py-4 rounded-xl bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-medium"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <button
              onClick={() => { buzz(5); reset(); }}
              className="text-xs text-neutral-500 active:text-neutral-300 py-2"
            >
              Discard
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}

function TodayPill({ naps, totalMs }) {
  return (
    <div className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 flex items-center gap-2">
      <span className="uppercase tracking-wider">Today</span>
      <span className="text-neutral-200 tabular-nums">{naps} {naps === 1 ? 'nap' : 'naps'}</span>
      <span className="text-neutral-600">·</span>
      <span className="text-neutral-200 tabular-nums">{fmtHM(totalMs)}</span>
    </div>
  );
}

function LastNap({ entry }) {
  const ms = new Date(entry.end_time) - new Date(entry.start_time);
  const label = entry.type === 'night' ? 'Last night' : 'Last nap';
  return (
    <div className="text-[11px] text-neutral-500 text-center">
      <span className="uppercase tracking-wider">{label}: </span>
      <span className="text-neutral-400 tabular-nums">
        {fmtTimeShort(entry.start_time)} – {fmtTimeShort(entry.end_time)} ({fmtHM(ms)})
      </span>
    </div>
  );
}

function AwakeTracker({ ms }) {
  const alarming = ms > AWAKE_ALARM_MS;
  return (
    <div
      className={`px-4 py-2 rounded-full border text-sm flex items-center gap-2 ${
        alarming
          ? 'bg-red-950/60 border-red-800 text-red-300 animate-pulse'
          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
      }`}
    >
      <span className="text-[10px] uppercase tracking-wider">Awake for</span>
      <span className="tabular-nums font-medium">{fmtHM(ms)}</span>
    </div>
  );
}

function SuggestionPill({ suggestion }) {
  const now = Date.now();
  const diff = suggestion.atMs - now;
  const past = diff < 0;
  const timeStr = fmtTimeShort(new Date(suggestion.atMs).toISOString());
  return (
    <div
      className={`px-4 py-2 rounded-xl border text-sm flex items-center gap-2 ${
        past
          ? 'bg-red-950/60 border-red-800 text-red-300'
          : 'bg-neutral-900 border-neutral-800 text-neutral-300'
      }`}
    >
      <span className="text-[10px] uppercase tracking-wider text-neutral-500">
        {past ? `${suggestion.label} was due` : suggestion.label}
      </span>
      <span className="tabular-nums font-medium">{timeStr}</span>
      <span className="text-neutral-600">·</span>
      <span className={`tabular-nums text-xs ${past ? 'text-red-300' : 'text-neutral-500'}`}>
        {past ? `${fmtHM(-diff)} ago` : `in ${fmtHM(diff)}`}
      </span>
    </div>
  );
}

function TimeBar({ start, end, status, onChangeStart, onChangeEnd }) {
  if (status === 'idle') {
    return <div className="h-4" />;
  }

  const paused = status === 'paused';
  const showEnd = paused && end != null;

  return (
    <div className="w-full flex flex-col items-center gap-2">
      <TimeField label="Started" value={start} onChange={onChangeStart} showAdjust={paused} />
      {showEnd && <TimeField label="Ended" value={end} onChange={onChangeEnd} showAdjust={paused} />}
    </div>
  );
}

function TimeField({ label, value, onChange, showAdjust }) {
  const [timeStr, setTimeStr] = useState(() => formatTimeInput(value));
  const [dateStr, setDateStr] = useState(() => formatDateInput(value));

  useEffect(() => {
    setTimeStr(formatTimeInput(value));
    setDateStr(formatDateInput(value));
  }, [value]);

  const commitTime = () => {
    const ms = applyTimeInput(value, timeStr);
    if (ms != null) {
      if (ms !== value) onChange(ms);
    } else {
      setTimeStr(formatTimeInput(value));
    }
  };

  const commitDate = (str) => {
    const ms = applyDateInput(value, str);
    if (ms != null && ms !== value) onChange(ms);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] uppercase tracking-wider text-neutral-500 w-14 text-right">
        {label}
      </span>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]{1,2}:[0-9]{2}"
        maxLength={5}
        value={timeStr}
        onChange={(e) => setTimeStr(autoFormatTimeDigits(e.target.value))}
        onBlur={commitTime}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="bg-transparent text-neutral-200 text-sm tabular-nums focus:outline-none border-b border-neutral-800 focus:border-neutral-600 pb-0.5 w-14 text-center"
      />
      <input
        type="date"
        value={dateStr}
        onChange={(e) => {
          setDateStr(e.target.value);
          if (e.target.value) commitDate(e.target.value);
        }}
        className="bg-transparent text-neutral-300 text-xs tabular-nums focus:outline-none border-b border-neutral-800 focus:border-neutral-600 pb-0.5"
      />
      {showAdjust && <TimeAdjustButtons value={value} onChange={onChange} />}
    </div>
  );
}
