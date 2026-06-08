import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * Returns a debounced VALUE — use for search inputs.
 * const debouncedSearch = useDebounce(inputValue, 300)
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/**
 * Returns a stable debounced CALLBACK — use for event handlers.
 * const debouncedSearch = useDebouncedCallback((val) => fetch(val), 300)
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 300,
): (...args: Parameters<T>) => void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );
}

/** Alias for useDebounce — debounces a value */
export const useDebouncedValue = useDebounce;

/** Plain function debounce (non-hook, for use outside components) */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay = 300,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
