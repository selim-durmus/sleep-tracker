import { createContext, useCallback, useContext, useState } from 'react';

const ToastContext = createContext(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const show = useCallback((message, opts = {}) => {
    const id = Date.now() + Math.random();
    setToast({ id, message, type: opts.type || 'success' });
    const duration = opts.duration ?? 2200;
    setTimeout(() => {
      setToast((t) => (t && t.id === id ? null : t));
    }, duration);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-6">
          <div
            className={`pointer-events-auto px-5 py-3 rounded-xl text-sm font-medium shadow-xl border backdrop-blur ${
              toast.type === 'error'
                ? 'bg-red-950/95 text-red-200 border-red-800'
                : 'bg-neutral-800/95 text-neutral-100 border-neutral-700'
            }`}
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}
