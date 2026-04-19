import { useState } from 'react';
import DayView from './DayView.jsx';
import WeekView from './WeekView.jsx';
import EditEntryModal from '../components/EditEntryModal.jsx';

export default function ReportsPage() {
  const [view, setView] = useState('day');
  const [editing, setEditing] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  function handleSaved() {
    setEditing(null);
    setReloadKey((k) => k + 1);
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-3 border-b border-neutral-800">
        <ToggleBtn active={view === 'day'} onClick={() => setView('day')}>Day</ToggleBtn>
        <ToggleBtn active={view === 'week'} onClick={() => setView('week')}>Week</ToggleBtn>
      </div>
      <div className="flex-1 overflow-hidden">
        {view === 'day' && <DayView onEntryClick={setEditing} reloadKey={reloadKey} />}
        {view === 'week' && <WeekView onEntryClick={setEditing} reloadKey={reloadKey} />}
      </div>
      {editing && (
        <EditEntryModal
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ToggleBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400'
      }`}
    >
      {children}
    </button>
  );
}
