import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { useToast } from './ToastProvider.jsx';
import { buzz } from '../lib/haptic.js';
import DateTimeInput from './DateTimeInput.jsx';

export default function EditEntryModal({ entry, onClose, onSaved }) {
  const [startMs, setStartMs] = useState(() => new Date(entry.start_time).getTime());
  const [endMs, setEndMs] = useState(() => new Date(entry.end_time).getTime());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const showToast = useToast();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const type = classify(startMs);
  const invalid = !(endMs > startMs);

  async function save() {
    if (invalid || busy) return;
    setBusy(true);
    setError(null);
    buzz(10);
    try {
      await api.updateEntry(entry.id, {
        start_time: new Date(startMs).toISOString(),
        end_time: new Date(endMs).toISOString()
      });
      showToast('Entry updated');
      onSaved();
    } catch (err) {
      console.error(err);
      setError('Failed to save');
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    if (!confirm('Delete this entry?')) return;
    setBusy(true);
    setError(null);
    buzz(10);
    try {
      await api.deleteEntry(entry.id);
      showToast('Entry deleted');
      onSaved();
    } catch (err) {
      console.error(err);
      setError('Failed to delete');
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-sm bg-neutral-900 border border-neutral-800 rounded-t-2xl sm:rounded-2xl p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-neutral-100">Edit entry</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-neutral-500 active:text-neutral-100"
            aria-label="Close"
          >✕</button>
        </div>

        <div className="space-y-4">
          <Field label="Start">
            <DateTimeInput value={startMs} onChange={setStartMs} />
          </Field>
          <Field label="End">
            <DateTimeInput value={endMs} onChange={setEndMs} />
          </Field>
          <div className="flex items-center justify-between text-xs">
            <span className="text-neutral-500">Classification</span>
            <span className="text-neutral-300 uppercase tracking-wider">{type}</span>
          </div>
          {invalid && (
            <p className="text-xs text-red-400">End time must be after start time.</p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={remove}
            disabled={busy}
            className="px-4 py-2.5 rounded-lg bg-red-950 text-red-300 border border-red-900 active:bg-red-900 disabled:opacity-50 text-sm font-medium"
          >
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2.5 rounded-lg bg-neutral-800 text-neutral-200 active:bg-neutral-700 disabled:opacity-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={busy || invalid}
            className="px-4 py-2.5 rounded-lg bg-blue-600 text-white active:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-neutral-500 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function classify(ms) {
  const h = new Date(ms).getHours();
  return h >= 18 || h < 6 ? 'night' : 'nap';
}
