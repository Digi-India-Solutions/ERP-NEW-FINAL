import { useRef, useCallback } from 'react';
import { calcGST, round2 } from '@/utils/gst';
import type { InvoiceLineItem } from '@/types/billing';
import { emptyLineItem } from '@/types/billing';
import ItemSearchInput, { type SelectedItem } from './ItemSearchInput';
import { formatINR } from '@/utils/format';

interface Props {
  items: InvoiceLineItem[];
  onChange: (items: InvoiceLineItem[]) => void;
  isSameState: boolean;
  warehouseId?: string;
  rateType?: 'sale' | 'purchase';
  /** Called with row index when user clicks "+ Add New Item" in the item search dropdown */
  onAddNewItem?: (rowIdx: number) => void;
}

const recalc = (item: InvoiceLineItem, isSameState: boolean): InvoiceLineItem => {
  const taxable = round2(item.qty * item.rate * (1 - item.discount / 100));
  const gst = calcGST(item.taxRate, taxable, isSameState);
  return { ...item, taxableAmount: taxable, ...gst, total: round2(taxable + gst.cgst + gst.sgst + gst.igst) };
};

const nfmt = (n: number) => n === 0 ? '' : String(n);

export default function ItemEntryTable({ items, onChange, isSameState, warehouseId, rateType = 'sale', onAddNewItem }: Props) {
  const tableRef = useRef<HTMLDivElement>(null);

  const update = useCallback((idx: number, patch: Partial<InvoiceLineItem>) => {
    const next = items.map((it, i) => i === idx ? recalc({ ...it, ...patch }, isSameState) : it);
    onChange(next);
  }, [items, onChange, isSameState]);

  const addRow = useCallback(() => {
    onChange([...items, { ...emptyLineItem(), qty: 1 }]);
  }, [items, onChange]);

  const removeRow = useCallback((idx: number) => {
    if (items.length <= 1) { onChange([{ ...emptyLineItem(), qty: 1 }]); return; }
    onChange(items.filter((_, i) => i !== idx));
  }, [items, onChange]);

  const handleItemSelect = (idx: number, selected: SelectedItem) => {
    update(idx, {
      itemId: selected.id,
      itemCode: selected.code,
      itemName: selected.name,
      hsnCode: selected.hsnCode,
      taxRate: selected.taxRate,
      qty: items[idx]?.qty > 0 ? items[idx].qty : 1,
      rate: rateType === 'sale' ? selected.saleRate : selected.purchaseRate,
      unit: selected.unit,
      unitId: selected.unitId,
    });
    // Focus qty field after item selected
    setTimeout(() => {
      const qtyInput = tableRef.current?.querySelector(`[data-row="${idx}"][data-col="qty"]`) as HTMLInputElement;
      qtyInput?.focus();
    }, 50);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, colName: string) => {
    const cols = ['item', 'hsn', 'qty', 'rate', 'discount'];
    const colIdx = cols.indexOf(colName);

    const focusCell = (targetRow: number, targetCol: string) => {
      const el = tableRef.current?.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`) as HTMLElement | null;
      const inp = (el?.tagName === 'INPUT' ? el : el?.querySelector('input')) as HTMLInputElement | null;
      inp?.focus();
    };

    if (e.key === 'Enter') {
      e.preventDefault();
      if (colName === 'discount') {
        // Last editable col → add new row or jump to next row item
        if (rowIdx === items.length - 1) {
          addRow();
          setTimeout(() => {
            focusCell(rowIdx + 1, 'item');
          }, 80);
        } else {
          focusCell(rowIdx + 1, 'item');
        }
      } else {
        const nextCol = cols[colIdx + 1];
        focusCell(rowIdx, nextCol);
      }
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const isLastCol = colIdx === cols.length - 1;
      const isLastRow = rowIdx === items.length - 1;
      if (isLastCol) {
        if (!isLastRow) focusCell(rowIdx + 1, 'item');
      } else {
        focusCell(rowIdx, cols[colIdx + 1]);
      }
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const isFirstCol = colIdx === 0;
      if (isFirstCol) {
        if (rowIdx > 0) focusCell(rowIdx - 1, cols[cols.length - 1]);
      } else {
        focusCell(rowIdx, cols[colIdx - 1]);
      }
    }
    if (e.key === 'Backspace' || e.key === 'Delete') {
      const row = items[rowIdx];
      if (!row.itemName && !row.qty && colName === 'item') removeRow(rowIdx);
    }
    if (e.key === 'ArrowUp' && rowIdx > 0) {
      e.preventDefault();
      focusCell(rowIdx - 1, colName);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (rowIdx < items.length - 1) {
        focusCell(rowIdx + 1, colName);
      }
    }
  };

  const cellCls = 'px-2 py-0 border-r border-slate-100 last:border-r-0';
  const numIn = 'w-full h-8 text-right text-sm bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-300 rounded px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';
  const calcCell = 'text-right text-sm text-[#1e293b] pr-2';

  return (
    <div ref={tableRef} className="w-full overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-[#e2e8f0]">
            {['#', 'Item', 'HSN', 'Qty', 'Unit', 'Rate', 'Disc%', 'Taxable', 'CGST', 'SGST', 'IGST', 'Total', ''].map((h) => (
              <th key={h} className={`px-2 py-2.5 text-left text-xs font-semibold text-slate-500 ${['Qty','Rate','Disc%','Taxable','CGST','SGST','IGST','Total'].includes(h) ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => (
            <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50/50 group">
              <td className={`${cellCls} w-8 text-center text-xs text-slate-400`}>{idx + 1}</td>
              <td className={`${cellCls} min-w-[180px]`} data-row={idx} data-col="item">
                <ItemSearchInput
                  value={row.itemName}
                  onChange={(v) => update(idx, { itemName: v })}
                  onSelect={(s) => handleItemSelect(idx, s)}
                  warehouseId={warehouseId}
                  rateType={rateType}
                  placeholder="Type to search..."
                  onKeyDown={(e) => handleCellKeyDown(e, idx, 'item')}
                  onAddNew={onAddNewItem ? () => onAddNewItem(idx) : undefined}
                />
              </td>
              <td className={`${cellCls} w-24`} data-row={idx} data-col="hsn">
                <input data-row={idx} data-col="hsn" value={row.hsnCode} onChange={(e) => update(idx, { hsnCode: e.target.value })} onKeyDown={(e) => handleCellKeyDown(e, idx, 'hsn')} className="w-full h-8 text-sm bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-300 rounded px-1" placeholder="HSN" />
              </td>
              <td className={`${cellCls} w-20`}>
                <input data-row={idx} data-col="qty" type="number" min="0" step="any" value={nfmt(row.qty)} placeholder="1" onChange={(e) => update(idx, { qty: parseFloat(e.target.value) || 0 })} onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  handleCellKeyDown(e, idx, 'qty');
                }} className={numIn} />
              </td>
              <td className={`${cellCls} w-14 text-xs text-slate-500 text-center`}>{row.unit || '—'}</td>
              <td className={`${cellCls} w-24`}>
                <input data-row={idx} data-col="rate" type="number" min="0" step="any" value={nfmt(row.rate)} placeholder="0.00" onChange={(e) => update(idx, { rate: parseFloat(e.target.value) || 0 })} onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  handleCellKeyDown(e, idx, 'rate');
                }} className={numIn} />
              </td>
              <td className={`${cellCls} w-16`}>
                <input data-row={idx} data-col="discount" type="number" min="0" max="100" step="any" value={nfmt(row.discount)} placeholder="0" onChange={(e) => update(idx, { discount: parseFloat(e.target.value) || 0 })} onKeyDown={(e) => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                  handleCellKeyDown(e, idx, 'discount');
                }} className={numIn} />
              </td>
              <td className={`${cellCls} w-24 ${calcCell}`}>{row.taxableAmount > 0 ? formatINR(row.taxableAmount) : '—'}</td>
              <td className={`${cellCls} w-20 ${calcCell} text-slate-500`}>{isSameState && row.cgst > 0 ? formatINR(row.cgst) : '—'}</td>
              <td className={`${cellCls} w-20 ${calcCell} text-slate-500`}>{isSameState && row.sgst > 0 ? formatINR(row.sgst) : '—'}</td>
              <td className={`${cellCls} w-20 ${calcCell} text-slate-500`}>{!isSameState && row.igst > 0 ? formatINR(row.igst) : '—'}</td>
              <td className={`${cellCls} w-24 ${calcCell} font-semibold`}>{row.total > 0 ? formatINR(row.total) : '—'}</td>
              <td className="w-8 text-center">
                <button type="button" onClick={() => removeRow(idx)} className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 cursor-pointer">
                  <i className="ri-delete-bin-6-line text-sm" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" onClick={addRow} className="mt-2 ml-2 flex items-center gap-1.5 text-sm text-[#4f46e5] hover:text-indigo-700 font-medium cursor-pointer py-1.5 px-2 rounded-lg hover:bg-indigo-50 transition-colors">
        <i className="ri-add-line text-base" /> Add Row
      </button>
    </div>
  );
}
