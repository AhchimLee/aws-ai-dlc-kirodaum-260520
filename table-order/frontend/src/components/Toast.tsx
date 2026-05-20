import { useEffect, useState, createContext, useContext, useCallback } from 'react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; message: string; type: ToastType; }

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {});

export const useToast = () => useContext(ToastContext);

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div style={{ position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [exiting, setExiting] = useState(false);
  const bg = toast.type === 'success' ? '#16a34a' : toast.type === 'error' ? '#dc2626' : '#1f2937';

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), 2700);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      onClick={onClose}
      style={{
        background: bg, color: '#fff', padding: '10px 20px', borderRadius: 8,
        fontSize: 14, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', cursor: 'pointer',
        animation: exiting ? 'slideDown 0.3s forwards' : 'slideUp 0.3s forwards',
        minWidth: 200, textAlign: 'center',
      }}
    >
      {toast.message}
    </div>
  );
}
