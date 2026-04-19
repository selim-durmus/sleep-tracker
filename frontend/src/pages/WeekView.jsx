import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import {
  DAY_START_HOUR, HOUR_MS, weekStart, shiftDate,
  fmtWeekRangeLabel, fmtHour, isSameDay
} from '../lib/time.js';
import { useSwipe } from '../hooks/useSwipe.js';

const HOUR_HEIGHT = 48;
const COL_WIDTH = 96;
const GUTTER_WIDTH = 48;
const HEADER_HEIGHT = 44;
const BODY_HEIGHT = HOUR_HEIGHT * 24 + 20;

export default function WeekView({ onEntryClick, reloadKey = 0 }) {
  const [anchor, setAnchor] = useState(() => new Date());
  const [entries, setEntries] = useState([]);
  const scrollRef = useRef(null);
  const didInitialScroll = useRef(false);

  const start = useMemo(() => weekStart(anchor), [anchor]);
  const end = useMemo(() => shiftDate(start, 7), [start]);

  useEffect(() => {
    api.listEntries(start.toISOString(), end.toISOString())
      .then(setEntries)
      .catch((err) => {
        console.error(err);
        setEntries([]);
      });
  }, [start, end, reloadKey]);

  const days = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const dayStart = shiftDate(start, i);
      const dayEnd = shiftDate(dayStart, 1);
      const dayEntries = entries.filter((e) => {
        const s = new Date(e.start_time);
        return s >= dayStart && s < dayEnd;
      });
      return { start: dayStart, end: dayEnd, entries: dayEntries, isToday: isSameDay(dayStart, today) };
    });
  }, [start, entries]);

  const hourMarks = Array.from({ length: 25 }, (_, i) => ({
    h: (DAY_START_HOUR + i) % 24,
    y: i * HOUR_HEIGHT
  }));

  const viewingCurrentWeek = useMemo(() => {
    const today = weekStart(new Date());
    return today.getTime() === start.getTime();
  }, [start]);

  useEffect(() => {
    if (didInitialScroll.current || !scrollRef.current) return;
    const todayIdx = days.findIndex((d) => d.isToday);
    if (todayIdx >= 0) {
      scrollRef.current.scrollLeft = Math.max(0, todayIdx * COL_WIDTH - COL_WIDTH);
      didInitialScroll.current = true;
    }
  }, [days]);

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => setAnchor(shiftDate(anchor, 7)),
    onSwipeRight: () => setAnchor(shiftDate(anchor, -7))
  });

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-neutral-800"
        {...swipeHandlers}
      >
        <button
          onClick={() => setAnchor(shiftDate(anchor, -7))}
          className="w-10 h-10 flex items-center justify-center text-2xl text-neutral-400 active:text-neutral-100"
          aria-label="Previous week"
        >‹</button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-neutral-100">{fmtWeekRangeLabel(start)}</span>
          {!viewingCurrentWeek && (
            <button
              onClick={() => setAnchor(new Date())}
              className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-[10px] uppercase tracking-wider text-neutral-300 active:bg-neutral-700"
            >
              This week
            </button>
          )}
        </div>
        <button
          onClick={() => setAnchor(shiftDate(anchor, 7))}
          className="w-10 h-10 flex items-center justify-center text-2xl text-neutral-400 active:text-neutral-100"
          aria-label="Next week"
        >›</button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="flex" style={{ minWidth: GUTTER_WIDTH + 7 * COL_WIDTH }}>
          <div
            className="sticky left-0 z-20 flex-shrink-0 bg-neutral-950 border-r border-neutral-800"
            style={{ width: GUTTER_WIDTH }}
          >
            <div
              className="sticky top-0 z-30 bg-neutral-950 border-b border-neutral-800"
              style={{ height: HEADER_HEIGHT }}
            />
            <div className="relative" style={{ height: BODY_HEIGHT }}>
              {hourMarks.map(({ h, y }, i) => (
                <span
                  key={i}
                  className="absolute right-1 px-1 text-[10px] text-neutral-500 tabular-nums"
                  style={{ top: y + 2 }}
                >
                  {fmtHour(h)}
                </span>
              ))}
            </div>
          </div>

          {days.map((d, i) => (
            <div
              key={i}
              className="flex-shrink-0 border-r border-neutral-800"
              style={{ width: COL_WIDTH }}
            >
              <div
                className="sticky top-0 z-10 bg-neutral-950 border-b border-neutral-800 flex flex-col items-center justify-center gap-0.5"
                style={{ height: HEADER_HEIGHT }}
              >
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                  {d.start.toLocaleDateString(undefined, { weekday: 'short' })}
                </span>
                {d.isToday ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-100 text-neutral-950 text-xs font-semibold tabular-nums">
                    {d.start.getDate()}
                  </span>
                ) : (
                  <span className="text-sm text-neutral-200 tabular-nums">
                    {d.start.getDate()}
                  </span>
                )}
              </div>

              <div className="relative" style={{ height: BODY_HEIGHT }}>
                {hourMarks.map(({ y }, idx) => (
                  <div
                    key={idx}
                    className="absolute left-0 right-0 border-t border-neutral-800/60"
                    style={{ top: y }}
                  />
                ))}
                {d.entries.map((e) => {
                  const es = new Date(e.start_time);
                  const ee = new Date(e.end_time);
                  const visEnd = ee > d.end ? d.end : ee;
                  const top = ((es - d.start) / HOUR_MS) * HOUR_HEIGHT;
                  const height = ((visEnd - es) / HOUR_MS) * HOUR_HEIGHT;
                  const isNight = e.type === 'night';
                  return (
                    <button
                      key={e.id}
                      onClick={() => onEntryClick?.(e)}
                      className={`absolute left-1 right-1 rounded shadow-sm transition-colors border ${
                        isNight
                          ? 'bg-indigo-500/85 border-indigo-400/60 active:bg-indigo-600'
                          : 'bg-blue-500/85 border-blue-400/60 active:bg-blue-600'
                      }`}
                      style={{ top, height: Math.max(height, 6) }}
                      aria-label="Edit entry"
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
