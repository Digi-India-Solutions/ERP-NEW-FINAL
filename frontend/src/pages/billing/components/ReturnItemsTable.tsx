/**
 * Shared component for Sale Return and Purchase Return item tables.
 * Columns: [✓][Item Name][HSN][Original Qty][Return Qty][Unit][Rate][Amount][Reason]
 */
import { useCallback } from 'react';
import { formatINR } from '@/utils/format';

export type ReturnReason = 'Damaged' | 'Wrong Item' | 'Quality Issue' | 'Expired' | 'Other';

const RETURN_REASONS: ReturnReason[] = ['Damaged', 'Wrong Item', 'Quality Issue', 'Expired', 'Other'];

export interface ReturnRow {
  itemId: string;
  itemName: string;
  hsnCode: string;
  originalQty: number;
  returnQty: number;
  unit: string;
  rate: number;
  amount: number;
  selected: boolean;
  reason: ReturnReason;
  customReason: string;
  qtyError?: string;
  id:string;
}

export const buildReturnRows = (items: { itemId: string; itemName: string; hsnCode: string; qty: number; unit: string; rate: number }[]): ReturnRow[] =>
  items.map((i) => ({
    itemId: i.itemId,
    itemName: i.itemName,
    hsnCode: i.hsnCode,
    originalQty: i.qty,
    returnQty: 0,
    unit: i.unit,
    rate: i.rate,
    amount: 0,
    selected: false,
    reason: 'Damaged',
    customReason: '',
  }));

interface Props {
  rows: ReturnRow[];
  onChange: (rows: ReturnRow[]) => void;
}

export default function ReturnItemsTable({ rows, onChange }: Props) {
  const updateRow = useCallback(
    (idx: number, patch: Partial<ReturnRow>) => {
      onChange(
        rows.map((r, i) => {
          if (i !== idx) return r;
          const updated = { ...r, ...patch };
          // Recalculate amount
          updated.amount = Math.round(updated.returnQty * updated.rate * 100) / 100;
          // Validate qty
          if (updated.returnQty > updated.originalQty) {
            updated.qtyError = `Max ${updated.originalQty}`;
          } else if (updated.returnQty < 0) {
            updated.qtyError = 'Cannot be negative';
          } else {
            updated.qtyError = undefined;
          }
          return updated;
        }),
      );
    },
    [rows, onChange],
  );

  const toggleAll = (checked: boolean) => {
    onChange(rows.map((r) => ({ ...r, selected: checked })));
  };

  const allSelected = rows.length > 0 && rows.every((r) => r.selected);
  const someSelected = rows.some((r) => r.selected);
  const selectedCount = rows.filter((r) => r.selected && r.returnQty > 0).length;
  const totalAmount = rows.filter((r) => r.selected).reduce((s, r) => s + r.amount, 0);
  const hasErrors = rows.some((r) => r.qtyError);

  return (
    <div className="space-y-3">
      {/* Summary bar */}
      <div className="flex items-center gap-4 px-3 py-2 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-[#64748b]">Items selected:</span>
          <span className="font-bold text-[#4f46e5]">{selectedCount}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#64748b]">Return amount:</span>
          <span className="font-bold text-[#1e293b]">{formatINR(totalAmount)}</span>
        </div>
        {hasErrors && (
          <span className="text-xs text-red-600 flex items-center gap-1 ml-auto">
            <i className="ri-error-warning-line" /> Fix quantity errors before saving
          </span>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[#e2e8f0]">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = !allSelected && someSelected; }}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
                />
              </th>
              {['Item Name', 'HSN', 'Orig Qty', 'Return Qty', 'Unit', 'Rate', 'Amount', 'Reason'].map((h) => (
                <th key={h} className={`px-3 py-2.5 text-left text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap ${['Orig Qty', 'Return Qty', 'Rate', 'Amount'].includes(h) ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.itemId + idx} className={`border-b border-[#f1f5f9] transition-colors ${row.selected ? 'bg-indigo-50/40' : 'hover:bg-[#f8fafc]'}`}>
                {/* Checkbox */}
                <td className="px-3 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(e) => updateRow(idx, { selected: e.target.checked, returnQty: e.target.checked && row.returnQty === 0 ? row.originalQty : row.returnQty })}
                    className="w-4 h-4 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5] cursor-pointer"
                  />
                </td>
                {/* Item Name */}
                <td className="px-3 py-2.5 font-medium text-[#1e293b] max-w-[180px]">
                  <p className="truncate">{row.itemName}</p>
                </td>
                {/* HSN */}
                <td className="px-3 py-2.5 text-[#64748b] font-mono text-xs">{row.hsnCode}</td>
                {/* Orig Qty */}
                <td className="px-3 py-2.5 text-right text-[#64748b]">{row.originalQty} <span className="text-xs">{row.unit}</span></td>
                {/* Return Qty */}
                <td className="px-3 py-2.5 w-28">
                  <div className="flex flex-col">
                    <input
                      type="number"
                      min="0"
                      max={row.originalQty}
                      value={row.returnQty || ''}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value) || 0;
                        updateRow(idx, { returnQty: v, selected: row.selected || v > 0 });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
                      }}
                      disabled={!row.selected && row.returnQty === 0}
                      className={`w-full h-8 px-2 text-right text-sm rounded-lg border focus:outline-none focus:ring-2 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${row.qtyError ? 'border-red-400 focus:ring-red-200 bg-red-50' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20 bg-white'} disabled:bg-[#f8fafc] disabled:cursor-not-allowed`}
                    />
                    {row.qtyError && <p className="text-[10px] text-red-500 mt-0.5 text-right">{row.qtyError}</p>}
                  </div>
                </td>
                {/* Unit */}
                <td className="px-3 py-2.5 text-[#64748b] text-xs">{row.unit}</td>
                {/* Rate */}
                <td className="px-3 py-2.5 text-right font-medium">{formatINR(row.rate)}</td>
                {/* Amount */}
                <td className="px-3 py-2.5 text-right font-semibold text-[#1e293b]">
                  {row.selected && row.amount > 0 ? formatINR(row.amount) : '—'}
                </td>
                {/* Reason */}
                <td className="px-3 py-2.5 w-44">
                  {row.selected ? (
                    <div className="space-y-1">
                      <select
                        value={row.reason}
                        onChange={(e) => updateRow(idx, { reason: e.target.value as ReturnReason })}
                        className="w-full h-8 px-2 text-xs rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:border-[#4f46e5] cursor-pointer"
                      >
                        {RETURN_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                      {row.reason === 'Other' && (
                        <input
                          type="text"
                          value={row.customReason}
                          onChange={(e) => updateRow(idx, { customReason: e.target.value })}
                          placeholder="Specify reason..."
                          className="w-full h-7 px-2 text-xs rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:border-[#4f46e5]"
                          maxLength={100}
                        />
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-[#94a3b8]">Select to add reason</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
