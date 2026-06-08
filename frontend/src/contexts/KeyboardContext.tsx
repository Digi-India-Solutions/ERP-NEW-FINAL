import { createContext, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';

type ShortcutMap = Partial<Record<string, () => void>>;

interface KeyboardContextValue {
  registerShortcuts: (id: string, map: ShortcutMap) => void;
  unregisterShortcuts: (id: string) => void;
}

const KeyboardContext = createContext<KeyboardContextValue>({
  registerShortcuts: () => undefined,
  unregisterShortcuts: () => undefined,
});

/**
 * Global keyboard shortcut manager.
 * Screens register their own F8/F9/F10/Esc handlers on mount and unregister on unmount.
 * The last registered screen's handlers win (stack-based).
 */
export function KeyboardProvider({ children }: { children: ReactNode }) {
  // Map of id → shortcut handlers; last registered takes priority
  const stackRef = useRef<Map<string, ShortcutMap>>(new Map());
  const orderRef = useRef<string[]>([]);

  const registerShortcuts = useCallback((id: string, map: ShortcutMap) => {
    stackRef.current.set(id, map);
    // Remove if already in order then push to end
    orderRef.current = orderRef.current.filter((k) => k !== id);
    orderRef.current.push(id);
  }, []);

  const unregisterShortcuts = useCallback((id: string) => {
    stackRef.current.delete(id);
    orderRef.current = orderRef.current.filter((k) => k !== id);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const active = orderRef.current[orderRef.current.length - 1];
      if (!active) return;
      const map = stackRef.current.get(active);
      if (!map) return;

      const key = buildKey(e);
      const action = map[key];
      if (action) {
        e.preventDefault();
        action();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <KeyboardContext.Provider value={{ registerShortcuts, unregisterShortcuts }}>
      {children}
    </KeyboardContext.Provider>
  );
}

function buildKey(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('ctrl');
  if (e.shiftKey) parts.push('shift');
  if (e.altKey) parts.push('alt');
  parts.push(e.key.toLowerCase());
  return parts.join('+');
}

export function useScreenShortcuts(id: string, map: ShortcutMap) {
  const { registerShortcuts, unregisterShortcuts } = useContext(KeyboardContext);

  useEffect(() => {
    registerShortcuts(id, map);
    return () => unregisterShortcuts(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
