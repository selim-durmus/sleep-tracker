import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'timer.v2';

function readPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writePersisted(state) {
  if (state && state.status !== 'idle') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

const initialState = { status: 'idle', start: null, end: null };

export function useTimer() {
  const [state, setState] = useState(() => readPersisted() || initialState);
  const [, forceTick] = useState(0);

  useEffect(() => { writePersisted(state); }, [state]);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => forceTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [state.status]);

  const effectiveEnd = state.end ?? (state.status === 'running' ? Date.now() : null);
  const elapsedMs = state.start != null && effectiveEnd != null
    ? Math.max(0, effectiveEnd - state.start)
    : 0;

  const startTimer = useCallback(() => {
    const now = Date.now();
    setState({ status: 'running', start: now, end: null });
  }, []);

  const pause = useCallback(() => {
    setState((s) => ({ ...s, status: 'paused', end: Date.now() }));
  }, []);

  const resume = useCallback(() => {
    setState((s) => {
      const idle = Date.now() - s.end;
      return { ...s, status: 'running', start: s.start + idle, end: null };
    });
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const updateStart = useCallback((ms) => {
    setState((s) => {
      const next = { ...s, start: ms };
      if (s.status === 'paused' && s.end != null && ms > s.end) next.end = ms;
      return next;
    });
  }, []);

  const updateEnd = useCallback((ms) => {
    setState((s) => {
      if (s.status !== 'paused') return s;
      const next = { ...s, end: ms };
      if (ms < s.start) next.start = ms;
      return next;
    });
  }, []);

  return {
    status: state.status,
    start: state.start,
    end: state.end,
    elapsedMs,
    startTimer,
    pause,
    resume,
    reset,
    updateStart,
    updateEnd
  };
}
