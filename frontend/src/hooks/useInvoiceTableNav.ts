import { useCallback } from 'react';

export type EditableCol = 'item' | 'hsn' | 'qty' | 'rate' | 'discount';

const EDITABLE_COLS: EditableCol[] = ['item', 'hsn', 'qty', 'rate', 'discount'];

function focusCell(tableEl: HTMLElement | null, rowIdx: number, colName: string) {
  if (!tableEl) return;
  const cell = tableEl.querySelector(`[data-row="${rowIdx}"][data-col="${colName}"]`) as HTMLElement | null;
  if (!cell) return;
  // If the cell itself is an input, focus it directly
  if (cell.tagName === 'INPUT') {
    (cell as HTMLInputElement).focus();
    return;
  }
  // Otherwise look for an inner input (e.g. ItemSearchInput wrapper)
  const inner = cell.querySelector('input') as HTMLInputElement | null;
  inner?.focus();
}

interface UseInvoiceTableNavOptions {
  tableRef: React.RefObject<HTMLElement | null>;
  rowCount: number;
  onAddRow: () => void;
}

export function useInvoiceTableNav({ tableRef, rowCount, onAddRow }: UseInvoiceTableNavOptions) {
  const handleCellKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colName: EditableCol) => {
      const colIdx = EDITABLE_COLS.indexOf(colName);
      const isLastCol = colIdx === EDITABLE_COLS.length - 1;
      const isFirstCol = colIdx === 0;
      const isLastRow = rowIdx === rowCount - 1;
      const isFirstRow = rowIdx === 0;

      switch (e.key) {
        case 'Enter': {
          e.preventDefault();
          if (isLastCol) {
            if (isLastRow) {
              // Add new row and focus its item field
              onAddRow();
              setTimeout(() => focusCell(tableRef.current, rowIdx + 1, 'item'), 80);
            } else {
              focusCell(tableRef.current, rowIdx + 1, 'item');
            }
          } else {
            focusCell(tableRef.current, rowIdx, EDITABLE_COLS[colIdx + 1]);
          }
          break;
        }
        case 'ArrowRight': {
          if (isLastCol) {
            if (!isLastRow) {
              e.preventDefault();
              focusCell(tableRef.current, rowIdx + 1, 'item');
            }
          } else {
            e.preventDefault();
            focusCell(tableRef.current, rowIdx, EDITABLE_COLS[colIdx + 1]);
          }
          break;
        }
        case 'ArrowLeft': {
          if (!isFirstCol) {
            e.preventDefault();
            focusCell(tableRef.current, rowIdx, EDITABLE_COLS[colIdx - 1]);
          }
          break;
        }
        case 'ArrowDown': {
          if (!isLastRow) {
            e.preventDefault();
            focusCell(tableRef.current, rowIdx + 1, colName);
          }
          break;
        }
        case 'ArrowUp': {
          if (!isFirstRow) {
            e.preventDefault();
            focusCell(tableRef.current, rowIdx - 1, colName);
          }
          break;
        }
        default:
          break;
      }
    },
    [tableRef, rowCount, onAddRow],
  );

  return { handleCellKeyDown, focusCell: (rowIdx: number, colName: string) => focusCell(tableRef.current, rowIdx, colName) };
}
