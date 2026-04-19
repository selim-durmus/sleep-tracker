import { useState } from 'react';
import { useTimer } from '../hooks/useTimer.js';
import { api } from '../lib/api.js';
import { formatDuration, classifyType } from '../lib/format.js';

export default function RecordPage() {
  const { status, startedAt, elapsedMs, start, pause, resume, reset } = useTimer();
  const [saving, setSaving] = useState(false);

  const type = startedAt ? classifyType(startedAt) : classifyType(new Date());

  async function handleSave() {
    if (saving || !startedAt || elapsedMs <= 0) return;
    setSaving(true);
    try {
      const startISO = new Date(startedAt).toISOString();
      const endISO = new Date(startedAt + elapsedMs).toISOString();
      await api.createEntry(startISO, endISO);
      reset();
    } catch (err) {
      console.error(err);
      alert('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 gap-10">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
          {type === 'night' ? 'Night sleep' : 'Nap'}
        </span>
        <div className="text-6xl font-light tabular-nums text-neutral-100">
          {formatDuration(elapsedMs)}
        </div>
      </div>

      {status === 'idle' && (
        <button
          onClick={start}
          className="w-40 h-40 rounded-full bg-blue-600 active:bg-blue-700 text-white text-xl font-medium shadow-lg shadow-blue-900/50 transition-colors"
        >
          Start
        </button>
      )}

      {status === 'running' && (
        <button
          onClick={pause}
          className="w-40 h-40 rounded-full bg-neutral-800 border-2 border-red-500 active:bg-neutral-700 text-red-400 text-xl font-medium transition-colors"
        >
          Stop
        </button>
      )}

      {status === 'paused' && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <div className="flex gap-3 w-full">
            <button
              onClick={resume}
              className="flex-1 py-4 rounded-xl bg-neutral-800 active:bg-neutral-700 text-neutral-100 font-medium"
            >
              Resume
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-4 rounded-xl bg-blue-600 active:bg-blue-700 disabled:opacity-50 text-white font-medium"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          <button
            onClick={reset}
            className="text-xs text-neutral-500 active:text-neutral-300 py-2"
          >
            Discard
          </button>
        </div>
      )}
    </div>
  );
}
