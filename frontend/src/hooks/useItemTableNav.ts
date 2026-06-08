import { RefObject, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

/**
 * GLOBAL RULE 2 — ITEM TABLE ENTER KEY NAVIGATION
 *
 * Attach to the table container. Each cell must have:
 *   data-row-idx="{rowIndex}"  data-col-idx="{colIndex}"
 *
 * Behaviour:
 *   Enter on last col       → append new empty row, focus item-name col of new row
 *   Enter on other col      → move to next col in same row
 *   Alt+Delete / Alt+Backsp → remove empty row, focus previous row
 *
 * Generic over row type so it works on Sales, Purchase, Transfer, Adjustment tables.
 */
export interface UseItemTableNavOptions<T> {
  containerRef: RefObject<HTMLElement | null>;
  rows: T[];
  setRows: Dispatch<SetStateAction<T[]>>;
  createEmptyRow: () => T;
  /** Return true when the row has no meaningful data entered */
  isRowEmpty: (row: T, rowIndex: number) => boolean;
  /** 0-based total column count including all cells (Sr, Item, HSN, Qty…) */
  totalColumns: number;
  /** Which col-idx to focus in the newly created row (usually the Item/Name col). Default 0 */
  focusColOnNewRow?: number;
}

export function useItemTableNav<T>({
  containerRef,
  rows,
  setRows,
  createEmptyRow,
  isRowEmpty,
  totalColumns,
  focusColOnNewRow = 0,
}: UseItemTableNavOptions<T>) {
  const focusCell = useCallback(
    (rowIdx: number, colIdx: number, delayMs = 30) => {
      setTimeout(() => {
        if (!containerRef.current) return;
        const cell = containerRef.current.querySelector<HTMLElement>(
          `[data-row-idx="${rowIdx}"][data-col-idx="${colIdx}"]`,
        );
        if (cell) {
          cell.focus();
          if (cell instanceof HTMLInputElement) cell.select();
        }
      }, delayMs);
    },
    [containerRef],
  );

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createEmptyRow()]);
  }, [setRows, createEmptyRow]);

  const removeRow = useCallback(
    (rowIdx: number, focusRowIdx: number, focusColIdx: number) => {
      setRows((prev) => {
        if (prev.length <= 1) return prev; // always keep at least 1 row
        return prev.filter((_, i) => i !== rowIdx);
      });
      focusCell(focusRowIdx, focusColIdx);
    },
    [setRows, focusCell],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const rowStr = target.getAttribute('data-row-idx');
      const colStr = target.getAttribute('data-col-idx');
      if (rowStr === null || colStr === null) return;

      const rowIdx = parseInt(rowStr, 10);
      const colIdx = parseInt(colStr, 10);

      // Enter key navigation within rows
      if (e.key === 'Enter' && !e.shiftKey) {
        if (colIdx >= totalColumns - 1) {
          // Last column → add new row + focus item col
          e.preventDefault();
          const newRowIdx = rows.length;
          addRow();
          focusCell(newRowIdx, focusColOnNewRow, 50);
          return;
        }
        // Not last column → move right
        e.preventDefault();
        focusCell(rowIdx, colIdx + 1);
        return;
      }

      // Alt+Delete or Alt+Backspace on an empty row → remove it
      if ((e.key === 'Delete' || e.key === 'Backspace') && e.altKey) {
        if (rows[rowIdx] && isRowEmpty(rows[rowIdx], rowIdx)) {
          e.preventDefault();
          const targetRow = Math.max(0, rowIdx - 1);
          removeRow(rowIdx, targetRow, colIdx);
        }
      }
    };

    el.addEventListener('keydown', handler);
    return () => el.removeEventListener('keydown', handler);
  }, [
    containerRef,
    rows,
    totalColumns,
    focusColOnNewRow,
    addRow,
    removeRow,
    focusCell,
    isRowEmpty,
  ]);

  return { addRow, removeRow, focusCell };
}
