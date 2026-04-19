import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'timer.v1';

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

const initialState = { status: 'idle', startedAt: null, accumulatedMs: 0, segmentStart: null };

export function useTimer() {
  const [state, setState] = useState(() => readPersisted() || initialState);
  const [, forceTick] = useState(0);

  useEffect(() => {
    writePersisted(state);
  }, [state]);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => forceTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [state.status]);

  const elapsedMs =
    state.status === 'running'
      ? state.accumulatedMs + (Date.now() - state.segmentStart)
      : state.accumulatedMs;

  const start = useCallback(() => {
    const now = Date.now();
    setState({ status: 'running', startedAt: now, accumulatedMs: 0, segmentStart: now });
  }, []);

  const pause = useCallback(() => {
    setState((s) => ({
      ...s,
      status: 'paused',
      accumulatedMs: s.accumulatedMs + (Date.now() - s.segmentStart),
      segmentStart: null
    }));
  }, []);

  const resume = useCallback(() => {
    setState((s) => ({ ...s, status: 'running', segmentStart: Date.now() }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { status: state.status, startedAt: state.startedAt, elapsedMs, start, pause, resume, reset };
}
