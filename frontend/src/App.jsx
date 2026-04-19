import { useState } from 'react';
import RecordPage from './pages/RecordPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';

export default function App() {
  const [tab, setTab] = useState('record');

  return (
    <ToastProvider>
      <div className="flex flex-col h-full">
        <main className="flex-1 overflow-y-auto">
          {tab === 'record' && <RecordPage />}
          {tab === 'reports' && <ReportsPage />}
        </main>
        <BottomNav tab={tab} setTab={setTab} />
      </div>
    </ToastProvider>
  );
}

function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: 'record', label: 'Record' },
    { id: 'reports', label: 'Reports' }
  ];
  return (
    <nav className="flex border-t border-neutral-800 bg-neutral-950 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`flex-1 py-4 text-sm font-medium transition-colors ${
            tab === t.id ? 'text-white' : 'text-neutral-500'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
