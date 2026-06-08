import { useRef, useCallback, useState } from 'react';
import { calcGST, round2 } from '@/utils/gst';
import type { InvoiceLineItem } from '@/types/billing';
import { emptyLineItem } from '@/types/billing';
import ItemSearchInput, { type SelectedItem } from '@/pages/billing/components/ItemSearchInput';
import { formatINR } from '@/utils/format';
import { useInvoiceTableNav } from '@/hooks/useInvoiceTableNav';
import { mockCategories } from '@/mocks/masters';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  items: InvoiceLineItem[];
  onChange: (items: InvoiceLineItem[]) => void;
  isSameState: boolean;
  warehouseId?: string;
  rateType?: 'sale' | 'purchase';
  onAddNewItem?: (rowIdx: number) => void;
  /** Row indices that have qty > stock (highlighted red) */
  overstockRows?: Set<number>;
  /** Row indices that are missing required narration */
  missingNarrationRows?: Set<number>;
}

const recalc = (item: InvoiceLineItem, isSameState: boolean): InvoiceLineItem => {
  const taxable = round2(item.qty * item.rate * (1 - item.discount / 100));
  const gst = calcGST(item.taxRate, taxable, isSameState);
  return { ...item, taxableAmount: taxable, ...gst, total: round2(taxable + gst.cgst + gst.sgst + gst.igst) };
};

const nfmt = (n: number) => (n === 0 ? '' : String(n));

function getCategoryForItem(categoryId?: string) {
  if (!categoryId) return null;
  return mockCategories.find((c) => c.id === categoryId) ?? null;
}

export default function InvoiceItemsTable({
  items,
  onChange,
  isSameState,
  warehouseId,
  rateType = 'sale',
  onAddNewItem,
  overstockRows = new Set(),
  missingNarrationRows = new Set(),
}: Props) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const user = useAuthStore((s) => s.user);

  const addRow = useCallback(() => {
    onChange([...items, emptyLineItem()]);
  }, [items, onChange]);

  const { handleCellKeyDown } = useInvoiceTableNav({
    tableRef: tableRef as React.RefObject<HTMLElement | null>,
    rowCount: items.length,
    onAddRow: addRow,
  });

  const update = useCallback(
    (idx: number, patch: Partial<InvoiceLineItem>) => {
      const next = items.map((it, i) => (i === idx ? recalc({ ...it, ...patch }, isSameState) : it));
      onChange(next);
    },
    [items, onChange],
  );

  const removeRow = useCallback(
    (idx: number) => {
      if (items.length <= 1) { onChange([emptyLineItem()]); return; }
      onChange(items.filter((_, i) => i !== idx));
    },
    [items, onChange],
  );

  // FIX 2: Delete/Backspace on empty row → delete row, focus previous row same col
  const handleEmptyRowDelete = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, col: string) => {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      const row = items[rowIdx];
      const isEmpty = !row.itemId && !row.itemName && row.qty <= 0;
      if (isEmpty && items.length > 1) {
        e.preventDefault();
        removeRow(rowIdx);
        const prevIdx = Math.max(0, rowIdx - 1);
        setTimeout(() => {
          const el = tableRef.current?.querySelector<HTMLElement>(`[data-row="${prevIdx}"][data-col="${col}"]`);
          el?.focus();
        }, 30);
      }
      // Row has data → normal browser behaviour, don't intercept
    },
    [items, removeRow],
  );

  const handleItemSelect = (idx: number, selected: SelectedItem) => {
    update(idx, {
      itemId: selected.id,
      itemCode: selected.code,
      itemName: selected.name,
      hsnCode: selected.hsnCode,
      taxRate: selected.taxRate,
      rate: rateType === 'sale' ? selected.saleRate : selected.purchaseRate,
      qty: 1,
      unit: selected.unit,
      unitId: selected.unitId,
      categoryId: selected.categoryId,
      narration: '',
      currentStock: selected.currentStock,
    });
    setTimeout(() => {
      const qtyInput = tableRef.current?.querySelector(`[data-row="${idx}"][data-col="qty"]`) as HTMLInputElement;
      qtyInput?.focus();
    }, 50);
  };

  // Focus/blur tracking for stock badge
  const handleRowFocus = useCallback((rowIdx: number) => {
    setFocusedRowIndex(rowIdx);
  }, []);

  const handleRowBlur = useCallback((rowIdx: number) => {
    setTimeout(() => {
      const active = document.activeElement;
      const rowEl = tableRef.current?.querySelector(`[data-row-container="${rowIdx}"]`);
      if (!rowEl?.contains(active)) {
        setFocusedRowIndex((prev) => (prev === rowIdx ? -1 : prev));
      }
    }, 50);
  }, []);

  const numIn = (isOverstock: boolean) =>
    `w-full h-8 text-right text-sm bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset rounded px-1 ${
      isOverstock ? 'focus:ring-red-300 ring-1 ring-red-400 bg-red-50' : 'focus:ring-indigo-300'
    }`;
  const calcCell = 'text-right text-sm text-[#1e293b] pr-2';

  // Stock badge renderer
  const renderStockBadge = (row: InvoiceLineItem) => {
    if (!row.itemId) return null;
    const stock = row.currentStock ?? 0;
    if (stock > 10) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Stock: {stock} pcs available
        </span>
      );
    }
    if (stock > 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Only {stock} pcs — low stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 font-medium whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Out of stock in your warehouse
      </span>
    );
  };

  // Narration requirement check
  const categoryRequiresNarration = (categoryId?: string) => {
    if (!categoryId) return false;
    const cat = getCategoryForItem(categoryId);
    return cat?.requiresNarration ?? false;
  };

  void user; // used for future permission checks

  return (
    <div ref={tableRef} className="w-full overflow-x-auto">
      <table className="w-full min-w-[860px] text-sm border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-[#e2e8f0]">
            {['#', 'Item / Barcode', 'HSN', 'Qty', 'Unit', 'Rate', 'Disc%', 'Taxable', 'GST%', 'Total', ''].map((h) => (
              <th
                key={h}
                className={`px-2 py-2.5 text-left text-xs font-semibold text-slate-500 ${
                  ['Qty', 'Rate', 'Disc%', 'Taxable', 'GST%', 'Total'].includes(h) ? 'text-right' : ''
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => {
            const isOverstock = overstockRows.has(idx);
            const isMissingNarration = missingNarrationRows.has(idx);
            const isFocused = focusedRowIndex === idx;
            const needsNarration = categoryRequiresNarration(row.categoryId);
            const category = getCategoryForItem(row.categoryId);

            return (
              <tr
                key={row.id}
                data-row-container={idx}
                className={`border-b border-slate-100 group transition-colors ${
                  isOverstock ? 'bg-red-50/40' : isFocused ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'
                }`}
              >
                <td className="px-2 py-1 w-8 text-center text-xs text-slate-400">{idx + 1}</td>

                {/* Item search + stock badge + narration */}
                <td className="px-2 py-1 min-w-[200px]" data-row={idx} data-col="item">
                  <ItemSearchInput
                    value={row.itemName}
                    onChange={(v) => update(idx, { itemName: v })}
                    onSelect={(s) => handleItemSelect(idx, s)}
                    onKeyDown={(e) => {
                      handleEmptyRowDelete(e, idx, 'item');
                      handleCellKeyDown(e, idx, 'item');
                    }}
                    warehouseId={warehouseId}
                    rateType={rateType}
                    placeholder="Type or scan barcode..."
                    onAddNew={onAddNewItem ? () => onAddNewItem(idx) : undefined}
                    onFocus={() => handleRowFocus(idx)}
                    onBlur={() => handleRowBlur(idx)}
                  />
                  {/* Stock badge — only on focused row with item selected */}
                  {isFocused && row.itemId && (
                    <div className="mt-0.5">{renderStockBadge(row)}</div>
                  )}
                  {/* Narration field for categories that require it */}
                  {needsNarration && row.itemId && (
                    <div className="mt-1">
                      <input
                        type="text"
                        value={row.narration ?? ''}
                        onChange={(e) => update(idx, { narration: e.target.value })}
                        onFocus={() => handleRowFocus(idx)}
                        onBlur={() => handleRowBlur(idx)}
                        placeholder={`Serial/IMEI (required for ${category?.name ?? 'this category'})`}
                        className={`w-full h-7 px-2 text-xs rounded border focus:outline-none focus:ring-1 ${
                          isMissingNarration
                            ? 'border-red-400 bg-red-50 focus:ring-red-300 placeholder:text-red-400'
                            : 'border-[#e2e8f0] bg-white focus:border-[#4f46e5] focus:ring-indigo-200'
                        }`}
                      />
                    </div>
                  )}
                </td>

                {/* HSN */}
                <td className="px-2 py-1 w-24" data-row={idx} data-col="hsn">
                  <input
                    data-row={idx}
                    data-col="hsn"
                    value={row.hsnCode}
                    onChange={(e) => update(idx, { hsnCode: e.target.value })}
                    onKeyDown={(e) => {
                      handleEmptyRowDelete(e, idx, 'hsn');
                      handleCellKeyDown(e, idx, 'hsn');
                    }}
                    onFocus={() => handleRowFocus(idx)}
                    onBlur={() => handleRowBlur(idx)}
                    className="w-full h-8 text-sm bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-300 rounded px-1"
                    placeholder="HSN"
                  />
                </td>

                {/* Qty */}
                <td className="px-2 py-1 w-20">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    data-row={idx}
                    data-col="qty"
                    value={nfmt(row.qty)}
                    placeholder="1"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        update(idx, { qty: parseInt(value, 10) || 0 });
                      }
                    }}
                    onBlur={() => handleRowBlur(idx)}
                    onKeyDown={(e) => {
                      handleEmptyRowDelete(e, idx, 'qty');
                      handleCellKeyDown(e, idx, 'qty');
                    }}
                    onFocus={() => handleRowFocus(idx)}
                    className={numIn(isOverstock)}
                  />
                </td>

                {/* Unit (read-only) */}
                <td className="px-2 py-1 w-14 text-xs text-slate-500 text-center">{row.unit || '—'}</td>

                {/* Rate */}
                <td className="px-2 py-1 w-24">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    data-row={idx}
                    data-col="rate"
                    value={nfmt(row.rate)}
                    placeholder="0.00"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*(\.\d*)?$/.test(value)) {
                        update(idx, { rate: parseFloat(value) || 0 });
                      }
                    }}
                    onBlur={() => handleRowBlur(idx)}
                    onKeyDown={(e) => {
                      handleEmptyRowDelete(e, idx, 'rate');
                      handleCellKeyDown(e, idx, 'rate');
                    }}
                    onFocus={() => handleRowFocus(idx)}
                    className={numIn(isOverstock)}
                  />
                </td>
                

                {/* Disc% */}
                {/* <td className="px-2 py-1 w-16">
                  <input
                    data-row={idx}
                    data-col="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={nfmt(row.discount)}
                    onChange={(e) => update(idx, { discount: parseFloat(e.target.value) || 0 })}
                    onKeyDown={(e) => { handleEmptyRowDelete(e, idx, 'discount'); handleCellKeyDown(e, idx, 'discount'); }}
                    onFocus={() => handleRowFocus(idx)}
                    onBlur={() => handleRowBlur(idx)}
                    className="w-full h-8 text-right text-sm bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-300 rounded px-1"
                  />
                </td> */}
                <td className="px-2 py-1 w-16">
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.]?[0-9]*"
                    data-row={idx}
                    data-col="discount"
                    value={nfmt(row.discount)}
                    placeholder="0"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*(\.\d*)?$/.test(value)) {
                        update(idx, { discount: Math.min(100, Math.max(0, parseFloat(value) || 0)) });
                      }
                    }}
                    onBlur={() => handleRowBlur(idx)}
                    onKeyDown={(e) => {
                      handleEmptyRowDelete(e, idx, 'discount');
                      handleCellKeyDown(e, idx, 'discount');
                    }}
                    onFocus={() => handleRowFocus(idx)}
                    className="w-full h-8 text-right text-sm bg-transparent focus:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-300 rounded px-1"
                  />
                </td>

                {/* Taxable (read-only) */}
                <td className={`px-2 py-1 w-24 ${calcCell}`}>
                  {row.taxableAmount > 0 ? formatINR(row.taxableAmount) : '—'}
                </td>

                {/* GST% (read-only) */}
                <td className="px-2 py-1 w-14 text-right text-xs text-slate-500">
                  {row.taxRate > 0 ? `${row.taxRate}%` : '—'}
                </td>

                {/* Total (read-only) */}
                <td className={`px-2 py-1 w-24 ${calcCell} font-semibold`}>
                  {row.total > 0 ? formatINR(row.total) : '—'}
                </td>

                {/* Delete */}
                <td className="w-8 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    <i className="ri-delete-bin-6-line text-sm" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 ml-2 flex items-center gap-1.5 text-sm text-[#4f46e5] hover:text-indigo-700 font-medium cursor-pointer py-1.5 px-2 rounded-lg hover:bg-indigo-50 transition-colors"
      >
        <i className="ri-add-line text-base" /> Add Row
      </button>
    </div>
  );
}
