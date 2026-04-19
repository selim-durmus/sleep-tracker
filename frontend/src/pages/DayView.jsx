import { useEffect, useMemo, useState, useCallback } from 'react';
import { api } from '../lib/api.js';
import { dayWindow, shiftDay, fmtDateLabel, fmtHour, fmtTimeShort, fmtHM, HOUR_MS, DAY_START_HOUR, isSameDay } from '../lib/time.js';
import { useSwipe } from '../hooks/useSwipe.js';

const HOUR_HEIGHT = 64;

export default function DayView({ onEntryClick, reloadKey = 0 }) {
  const [date, setDate] = useState(() => new Date());
  const [entries, setEntries] = useState([]);
  const [nowTick, setNowTick] = useState(() => Date.now());
  const { start, end } = useMemo(() => dayWindow(date), [date]);

  const reload = useCallback(() => {
    api.listEntries(start.toISOString(), end.toISOString())
      .then(setEntries)
      .catch((err) => {
        console.error(err);
        setEntries([]);
      });
  }, [start, end]);

  useEffect(() => { reload(); }, [reload, reloadKey]);

  const viewingToday = useMemo(() => isSameDay(date, new Date()), [date]);

  useEffect(() => {
    if (!viewingToday) return;
    const id = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(id);
  }, [viewingToday]);

  const nowLineTop = useMemo(() => {
    if (!viewingToday) return null;
    const offset = nowTick - start.getTime();
    if (offset < 0 || offset > HOUR_MS * 24) return null;
    return (offset / HOUR_MS) * HOUR_HEIGHT;
  }, [viewingToday, nowTick, start]);

  const totals = useMemo(() => {
    let nightMs = 0, napMs = 0;
    for (const e of entries) {
      const s = new Date(e.start_time);
      if (s < start || s >= end) continue;
      const ms = new Date(e.end_time) - new Date(e.start_time);
      if (e.type === 'night') nightMs += ms;
      else napMs += ms;
    }
    return { nightMs, napMs, totalMs: nightMs + napMs };
  }, [entries, start, end]);

  const blocks = useMemo(() => entries.map((e) => {
    const es = new Date(e.start_time);
    const ee = new Date(e.end_time);
    const visStart = es < start ? start : es;
    const visEnd = ee > end ? end : ee;
    if (visEnd <= visStart) return null;
    const top = ((visStart - start) / HOUR_MS) * HOUR_HEIGHT;
    const height = ((visEnd - visStart) / HOUR_MS) * HOUR_HEIGHT;
    return { ...e, top, height };
  }).filter(Boolean), [entries, start, end]);

  const hourMarks = Array.from({ length: 25 }, (_, i) => ({
    h: (DAY_START_HOUR + i) % 24,
    y: i * HOUR_HEIGHT
  }));

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => setDate(shiftDay(date, 1)),
    onSwipeRight: () => setDate(shiftDay(date, -1))
  });

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-neutral-800"
        {...swipeHandlers}
      >
        <button
          onClick={() => setDate(shiftDay(date, -1))}
          className="w-10 h-10 flex items-center justify-center text-2xl text-neutral-400 active:text-neutral-100"
          aria-label="Previous day"
        >‹</button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-100">{fmtDateLabel(date)}</span>
          {!viewingToday && (
            <button
              onClick={() => setDate(new Date())}
              className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] uppercase tracking-wider text-neutral-300 active:bg-neutral-700"
            >
              Today
            </button>
          )}
        </div>
        <button
          onClick={() => setDate(shiftDay(date, 1))}
          className="w-10 h-10 flex items-center justify-center text-2xl text-neutral-400 active:text-neutral-100"
          aria-label="Next day"
        >›</button>
      </div>

      <div className="grid grid-cols-3 border-b border-neutral-800">
        <Stat label="Night" ms={totals.nightMs} />
        <Stat label="Nap" ms={totals.napMs} />
        <Stat label="Total" ms={totals.totalMs} />
      </div>

      <div className="flex-1 overflow-y-auto" {...swipeHandlers}>
        <div className="relative" style={{ height: HOUR_HEIGHT * 24 + 20 }}>
          {hourMarks.map(({ h, y }, i) => (
            <div key={i}>
              <div
                className="absolute left-0 right-0 border-t border-neutral-800/70"
                style={{ top: y }}
              />
              <span
                className="absolute left-2 px-1 text-[10px] text-neutral-500 tabular-nums"
                style={{ top: y + 2 }}
              >
                {fmtHour(h)}
              </span>
            </div>
          ))}
          <div
            className="absolute left-16 right-3"
            style={{ top: 0, height: HOUR_HEIGHT * 24 }}
          >
            {blocks.map((b) => (
              <button
                key={b.id}
                onClick={() => onEntryClick?.(b)}
                className={`absolute left-0 right-0 rounded-md px-2 py-1 text-[11px] text-white overflow-hidden shadow-sm text-left transition-colors border ${
                  b.type === 'night'
                    ? 'bg-indigo-500/80 border-indigo-400/60 active:bg-indigo-600'
                    : 'bg-blue-500/80 border-blue-400/60 active:bg-blue-600'
                }`}
                style={{ top: b.top, height: Math.max(b.height, 20) }}
              >
                <span className="tabular-nums whitespace-nowrap">
                  {fmtTimeShort(b.start_time)} – {fmtTimeShort(b.end_time)}
                </span>
              </button>
            ))}
            {nowLineTop != null && (
              <div
                className="absolute left-0 right-0 pointer-events-none"
                style={{ top: nowLineTop }}
              >
                <div className="absolute -left-2 -top-1 w-2 h-2 rounded-full bg-red-500" />
                <div className="border-t border-red-500/80 w-full" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, ms }) {
  return (
    <div className="py-2 text-center border-r border-neutral-800 last:border-r-0">
      <div className="text-[10px] uppercase tracking-wider text-neutral-500">{label}</div>
      <div className="text-sm font-medium tabular-nums text-neutral-100 mt-0.5">{fmtHM(ms)}</div>
    </div>
  );
}
