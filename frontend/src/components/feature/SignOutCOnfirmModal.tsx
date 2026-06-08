import { useEffect } from 'react';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}


export default function SignOutConfirmModal({ open, onConfirm, onCancel }: Props) {
  // ── Keyboard shortcuts Y / N ──────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      // Don't fire if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        onConfirm();
      }
      if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)' }}
      onClick={onCancel}
    >
      {/* Modal card */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-start gap-4">
          {/* Question icon */}
          <div className="w-10 h-10 rounded-full bg-[#4f46e5] flex items-center justify-center shrink-0 mt-0.5">
            <i className="ri-question-line text-white text-lg" />
          </div>

          {/* Text */}
          <div>
            <h2 className="text-lg font-bold text-[#1e293b] leading-tight">Sign Out</h2>
            <p className="text-sm text-[#64748b] mt-1 leading-relaxed">
              Are you sure you want to sign out of InvenPro?
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          {/* No */}
          <button
            type="button"
            onClick={onCancel}
            className="h-10 px-5 rounded-xl border-2 border-[#e2e8f0] text-sm font-semibold text-[#1e293b] hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30"
          >
            No (N)
          </button>

          {/* Yes, Sign Out */}
          <button
            type="button"
            onClick={onConfirm}
            className="h-10 px-5 rounded-xl bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 active:bg-indigo-800 transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40"
          >
            Yes, Sign Out (Y)
          </button>
        </div>

        {/* Keyboard hint */}
        <p className="text-center text-xs text-[#94a3b8]">
          Press{' '}
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#f1f5f9] border border-[#e2e8f0] text-[#4f46e5] font-mono font-bold text-[10px]">Y</kbd>
          {' '}to confirm{'  /  '}
          <kbd className="inline-flex items-center px-1.5 py-0.5 rounded bg-[#f1f5f9] border border-[#e2e8f0] text-[#475569] font-mono font-bold text-[10px]">N</kbd>
          {' '}to cancel
        </p>
      </div>
    </div>
  );
}