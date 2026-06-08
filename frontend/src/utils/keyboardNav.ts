import { RefObject, useEffect, useCallback } from 'react';

/**
 * GLOBAL RULE 1 — ENTER KEY NAVIGATION
 *
 * Scans all [data-nav-index] elements inside formRef.
 * Enter → next field, Shift+Enter → previous field.
 * Accepts optional `deps` array — re-registers listener when deps change
 * (use this when rows are added/removed and new nav elements appear).
 *
 * Exports: focusFirst, focusLast, focusNext, focusPrev, focusIndex(n)
 */
export function useKeyboardNav(
  formRef: RefObject<HTMLElement | null>,
  deps: unknown[] = [],
) {
  /** Always reads DOM fresh — no stale closure issues */
  const getFields = useCallback((): HTMLElement[] => {
    if (!formRef.current) return [];
    const nodes = formRef.current.querySelectorAll<HTMLElement>('[data-nav-index]');
    return Array.from(nodes).sort((a, b) => {
      const ai = parseInt(a.getAttribute('data-nav-index') ?? '0', 10);
      const bi = parseInt(b.getAttribute('data-nav-index') ?? '0', 10);
      return ai - bi;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formRef, ...deps]);

  const focusFirst = useCallback(() => {
    const fields = getFields();
    if (fields.length > 0) fields[0].focus();
  }, [getFields]);

  const focusLast = useCallback(() => {
    const fields = getFields();
    if (fields.length > 0) fields[fields.length - 1].focus();
  }, [getFields]);

  /** Focus the element that has data-nav-index === idx (exact match) */
  const focusIndex = useCallback(
    (idx: number) => {
      const fields = getFields();
      const target = fields.find(
        (f) => parseInt(f.getAttribute('data-nav-index') ?? '-99', 10) === idx,
      );
      if (target) target.focus();
    },
    [getFields],
  );

  const focusNext = useCallback(
    (fromEl?: HTMLElement) => {
      const fields = getFields();
      const current = fromEl ?? (document.activeElement as HTMLElement);
      const idx = fields.findIndex((f) => f === current);
      if (idx === -1) { focusFirst(); return; }
      const next = fields[idx + 1];
      if (next) next.focus();
    },
    [getFields, focusFirst],
  );

  const focusPrev = useCallback(
    (fromEl?: HTMLElement) => {
      const fields = getFields();
      const current = fromEl ?? (document.activeElement as HTMLElement);
      const idx = fields.findIndex((f) => f === current);
      if (idx <= 0) return;
      fields[idx - 1].focus();
    },
    [getFields],
  );

  useEffect(() => {
    const el = formRef.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement;

      // Textarea: plain Enter = line break; Shift+Enter = go prev
      if (target.tagName === 'TEXTAREA' && !e.shiftKey) return;

      // Only intercept elements with data-nav-index
      if (!target.hasAttribute('data-nav-index')) return;

      e.preventDefault();

      if (e.shiftKey) {
        focusPrev(target);
      } else {
        focusNext(target);
      }
    };

    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formRef, focusNext, focusPrev, ...deps]);

  return { focusFirst, focusLast, focusNext, focusPrev, focusIndex };
}
