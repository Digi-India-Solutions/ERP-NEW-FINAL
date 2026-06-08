import { useEffect, useRef } from 'react';
import { useScreenShortcuts } from '@/contexts/KeyboardContext';

/**
 * GLOBAL RULE 3 — SIMPLIFIED KEYBOARD SHORTCUTS
 *
 * Each form calls:
 *   useShortcuts('unique-form-id', {
 *     F8: handleSaveNew,
 *     F9: handleSave,
 *     F10: handlePrint,
 *     Escape: handleCancel,
 *   })
 *
 * Key names map: F8 → 'f8', F9 → 'f9', F10 → 'f10', Escape → 'escape'
 * Handlers auto-register on mount, auto-unregister on unmount.
 * The id must be stable (pass a literal string, not a variable).
 */
export interface ShortcutHandlers {
  F8?: () => void;
  F9?: () => void;
  F10?: () => void;
  Escape?: () => void;
  [key: string]: (() => void) | undefined;
}

export function useShortcuts(id: string, handlers: ShortcutHandlers) {
  // Keep a stable ref so map never goes stale in the effect
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  // Build stable proxy map (keys lowercased)
  const stableMap = useRef<Record<string, () => void>>({});

  // Rebuild stable map from ref so callers always get latest callbacks
  Object.keys(handlers).forEach((k) => {
    const normalized = k.toLowerCase();
    stableMap.current[normalized] = () => {
      const fn = handlersRef.current[k];
      if (fn) fn();
    };
  });

  useScreenShortcuts(id, stableMap.current);
}
