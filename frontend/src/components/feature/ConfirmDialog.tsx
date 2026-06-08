import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Yes (Y)',
  cancelLabel = 'No (N)',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Y = confirm, N = cancel
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') { e.preventDefault(); onConfirm(); }
      if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') { e.preventDefault(); onCancel(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onConfirm, onCancel]);

  // Focus trap
  useEffect(() => {
    if (open && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button');
      if (focusable.length) focusable[0].focus();
    }
  }, [open]);

  if (!open) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : variant === 'warning'
      ? 'bg-amber-500 hover:bg-amber-600 text-white'
      : 'bg-[#4f46e5] hover:bg-indigo-700 text-white';

  const iconClass =
    variant === 'danger'
      ? 'ri-error-warning-fill text-red-500'
      : variant === 'warning'
      ? 'ri-alert-fill text-amber-500'
      : 'ri-question-fill text-[#4f46e5]';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="absolute bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-scale-in"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-[#f8fafc] shrink-0">
            <i className={`${iconClass} text-xl`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#1e293b]">{title}</h3>
            <p className="text-sm text-[#64748b] mt-1">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${confirmBtnClass}`}
          >
            {confirmLabel}
          </button>
        </div>

        <p className="text-center text-[11px] text-[#94a3b8] mt-3">
          Press <kbd className="font-mono bg-[#f1f5f9] px-1 rounded">Y</kbd> to confirm &nbsp;/&nbsp; <kbd className="font-mono bg-[#f1f5f9] px-1 rounded">N</kbd> to cancel
        </p>
      </div>
    </div>
  );
}
