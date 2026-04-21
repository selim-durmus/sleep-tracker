import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../lib/api.js';

const POLL_MS = 2000;
const TICK_MS = 250;

const idleState = { status: 'idle', start_time: null, end_time: null, updated_at: null };

export function useTimer() {
  const [state, setState] = useState(idleState);
  const [, forceTick] = useState(0);
  const inFlight = useRef(0);

  const applyState = useCallback((next) => {
    if (next && next.status) setState(next);
  }, []);

  const refresh = useCallback(async () => {
    if (inFlight.current > 0) return;
    try {
      const data = await api.timerGet();
      if (data && inFlight.current === 0) applyState(data);
    } catch (err) {
      console.error(err);
    }
  }, [applyState]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    if (state.status !== 'running') return;
    const id = setInterval(() => forceTick((n) => n + 1), TICK_MS);
    return () => clearInterval(id);
  }, [state.status]);

  const startMs = state.start_time ? new Date(state.start_time).getTime() : null;
  const endMs = state.end_time
    ? new Date(state.end_time).getTime()
    : state.status === 'running' ? Date.now() : null;
  const elapsedMs = startMs != null && endMs != null ? Math.max(0, endMs - startMs) : 0;

  const runAction = useCallback(async (fn) => {
    inFlight.current += 1;
    try {
      const data = await fn();
      return data;
    } finally {
      inFlight.current -= 1;
    }
  }, []);

  const startTimer = useCallback(async () => {
    const data = await runAction(() => api.timerStart());
    applyState(data);
  }, [runAction, applyState]);

  const pause = useCallback(async () => {
    const data = await runAction(() => api.timerPause());
    applyState(data);
  }, [runAction, applyState]);

  const resume = useCallback(async () => {
    const data = await runAction(() => api.timerResume());
    applyState(data);
  }, [runAction, applyState]);

  const reset = useCallback(async () => {
    const data = await runAction(() => api.timerDiscard());
    applyState(data);
  }, [runAction, applyState]);

  const save = useCallback(async () => {
    const result = await runAction(() => api.timerSave());
    if (result && result.timer) applyState(result.timer);
    return result ? result.entry : null;
  }, [runAction, applyState]);

  const updateStart = useCallback(async (ms) => {
    const data = await runAction(() =>
      api.timerPatch({ start_time: new Date(ms).toISOString() })
    );
    applyState(data);
  }, [runAction, applyState]);

  const updateEnd = useCallback(async (ms) => {
    const data = await runAction(() =>
      api.timerPatch({ end_time: new Date(ms).toISOString() })
    );
    applyState(data);
  }, [runAction, applyState]);

  return {
    status: state.status,
    start: startMs,
    end: state.end_time ? new Date(state.end_time).getTime() : null,
    elapsedMs,
    startTimer,
    pause,
    resume,
    reset,
    save,
    updateStart,
    updateEnd,
    refresh
  };
}
