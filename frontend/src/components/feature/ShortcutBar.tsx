import { useEffect } from 'react';

export interface ShortcutBarAction {
  /** Preferred: called on F8 Save & New */
  onSaveNew?: () => void;
  /** Alias for onSaveNew — accepted for backward compatibility */
  onSaveAndNew?: () => void;
  onSave?: () => void;
  onPrint?: () => void;
  onBack?: () => void;
  isDirty?: boolean;
  /** Preferred: controls loading spinner on Save button */
  isSaving?: boolean;
  /** Alias for isSaving — accepted for backward compatibility */
  saving?: boolean;
  hidePrint?: boolean;
}

export default function ShortcutBar({
  onSaveNew,
  onSaveAndNew,
  onSave,
  onPrint,
  onBack,
  isDirty = false,
  isSaving = false,
  saving = false,
  hidePrint = false,
}: ShortcutBarAction) {
  const handleSaveNew = onSaveNew ?? onSaveAndNew;
  const isLoading = isSaving || saving;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'F8' && handleSaveNew) { e.preventDefault(); handleSaveNew(); }
      if (e.key === 'F9' && onSave) { e.preventDefault(); onSave(); }
      if (e.key === 'F10' && onPrint && !hidePrint) { e.preventDefault(); onPrint(); }
      if (e.key === 'Escape' && !isInput && onBack) { e.preventDefault(); onBack(); }
      if (e.ctrlKey && e.key === 's' && onSave) { e.preventDefault(); onSave(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSaveNew, onSave, onPrint, onBack, hidePrint]);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 h-10 bg-[#1e293b] border-t border-white/10 flex items-center px-4 gap-1">
      <div className="flex items-center gap-1 flex-1">
        {handleSaveNew && (
          <button type="button" onClick={handleSaveNew} disabled={isLoading}
            className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50">
            <kbd className="text-[10px] font-bold text-indigo-300">F8</kbd>
            <span>Save &amp; New</span>
          </button>
        )}
        {onSave && (
          <button type="button" onClick={onSave} disabled={isLoading}
            className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-[#4f46e5] hover:bg-indigo-600 text-white transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60">
            <kbd className="text-[10px] font-bold text-indigo-200">F9</kbd>
            {isLoading ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <span>Save</span>}
          </button>
        )}
        {!hidePrint && onPrint && (
          <button type="button" onClick={onPrint}
            className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer whitespace-nowrap">
            <kbd className="text-[10px] font-bold text-indigo-300">F10</kbd>
            <span>Print</span>
          </button>
        )}
      </div>
      {isDirty && (
        <span className="text-[11px] text-amber-300 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300 inline-block" />Unsaved changes
        </span>
      )}
      <div className="flex items-center ml-2">
        {onBack && (
          <button type="button" onClick={onBack}
            className="flex items-center gap-1.5 h-7 px-3 rounded text-xs font-medium bg-white/10 hover:bg-white/20 text-slate-300 transition-colors cursor-pointer whitespace-nowrap">
            <kbd className="text-[10px] font-bold text-slate-400">Esc</kbd>
            <span>Back</span>
          </button>
        )}
      </div>
    </div>
  );
}
