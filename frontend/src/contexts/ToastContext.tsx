import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  success: () => undefined,
  error: () => undefined,
  warning: () => undefined,
  info: () => undefined,
});

const iconMap: Record<ToastType, string> = {
  success: 'ri-checkbox-circle-line',
  error: 'ri-error-warning-line',
  warning: 'ri-alert-line',
  info: 'ri-information-line',
};

const styleMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-indigo-50 border-indigo-200 text-indigo-800',
};

const iconColorMap: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-[#4f46e5]',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const add = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const value = useMemo<ToastContextValue>(() => ({
    success: (m) => add('success', m),
    error: (m) => add('error', m),
    warning: (m) => add('warning', m),
    info: (m) => add('info', m),
  }), [add]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-16 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium shadow-lg pointer-events-auto min-w-[280px] max-w-sm animate-fade-in ${styleMap[t.type]}`}
          >
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <i className={`${iconMap[t.type]} text-base ${iconColorMap[t.type]}`} />
            </div>
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              className="w-5 h-5 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
            >
              <i className="ri-close-line text-sm" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
