import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import SmartItemRow, { makeSmartRow, type SmartRowData } from './SmartItemRow';
import { type DSEReason } from '@/mocks/billing';
import { directStockEntryService } from '@/services/directStockEntryService';
import { getAllWarehouses, type WarehouseResponse } from '@/api/warehouse.api';
import { useWarehouseStore } from '@/stores/warehouseStore';
// ─── Constants ────────────────────────────────────────────────────────────────
const DSE_REASONS: DSEReason[] = [
  'Opening Stock',
  'Stock Audit Found',
  'Free Sample',
  'Goods Returned No Invoice',
  'Internal Transfer Found',
  'Other',
];

const today = () => new Date().toISOString().split('T')[0];

const mapReasonToApi = (reason: DSEReason) => {
  switch (reason) {
    case 'Opening Stock':
      return 'OPENING';
    case 'Stock Audit Found':
      return 'STOCK_AUDIT_FOUND';
    case 'Free Sample':
      return 'FREE_SAMPLE';
    case 'Goods Returned No Invoice':
      return 'GOODS_RETURNED_NO_INVOICE';
    case 'Internal Transfer Found':
      return 'INTERNAL_TRANSFER_FOUND';
    case 'Other':
    default:
      return 'OTHER';
  }
};


// ─── Success Modal ────────────────────────────────────────────────────────────
interface DSESuccessSummary {
  entryNumber: string;
  warehouseName: string;
  reason: string;
  itemCount: number;
  totalQty: number;
  totalValue: number;
}

interface SuccessModalProps {
  summary: DSESuccessSummary;
  onNew: () => void;
  onViewHistory: () => void;
  onClose: () => void;
}

function DSESuccessModal({ summary, onNew, onViewHistory, onClose }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100">
            <i className="ri-checkbox-circle-fill text-emerald-600 text-xl" />
          </div>
          <div>
            <h2 className="text-base font-bold text-emerald-800">Stock Entry Saved</h2>
            <p className="text-xs text-emerald-600">{summary.entryNumber}</p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Warehouse</p>
              <p className="text-sm font-bold text-[#1e293b] mt-0.5">{summary.warehouseName}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Reason</p>
              <p className="text-sm font-bold text-[#1e293b] mt-0.5">{summary.reason}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Items</p>
              <p className="text-sm font-bold text-[#1e293b] mt-0.5">{summary.itemCount}</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Total Qty</p>
              <p className="text-sm font-bold text-[#1e293b] mt-0.5">{summary.totalQty}</p>
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <p className="text-[10px] text-indigo-400 uppercase tracking-wide font-semibold">Total Value</p>
            <p className="text-lg font-bold text-[#4f46e5] mt-0.5">₹{summary.totalValue.toLocaleString('en-IN')}</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center gap-2 justify-end">
          <button type="button" onClick={onNew} className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#1e293b] hover:bg-slate-50 cursor-pointer whitespace-nowrap">
            <i className="ri-add-line mr-1" />New Entry
          </button>
          <button type="button" onClick={onViewHistory} className="h-9 px-4 rounded-lg border border-[#4f46e5] text-sm font-medium text-[#4f46e5] hover:bg-indigo-50 cursor-pointer whitespace-nowrap">
            <i className="ri-history-line mr-1" />View History
          </button>
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg bg-[#4f46e5] text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DirectStockEntryForm() {
  
  const toast = useToast();
  const navigate = useNavigate();

  const { selectedWarehouseId: userWarehouseId, selectedWarehouseName: userWarehouseName } = useWarehouseStore();


  const [date, setDate] = useState(today());
  const [reason, setReason] = useState<DSEReason>('Opening Stock');
  const [otherReason, setOtherReason] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<SmartRowData[]>([makeSmartRow()]);
  const [saving, setSaving] = useState(false);
  const [successSummary, setSuccessSummary] = useState<DSESuccessSummary | null>(null);
  const [entryNumber, setEntryNumber] = useState('');

  const smartInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const addRow = useCallback(() => {
    const newRow = makeSmartRow();
    setRows((r) => [...r, newRow]);
    setTimeout(() => {
      smartInputRefs.current[newRow.id]?.focus();
    }, 80);
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<SmartRowData>) => {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r));
  }, []);

  const filledRows = rows.filter((r) => r.itemId);
  const totalQty = filledRows.reduce((s, r) => s + r.qty, 0);
  const totalValue = filledRows.reduce((s, r) => s + r.total, 0);

  const handleSave = useCallback(async () => {
    if (!userWarehouseId) {
      toast.error('No warehouse found for this company');
      return;
    }

    if (reason === 'Other' && !otherReason.trim()) {
      toast.error('Please specify the reason');
      return;
    }
    if (filledRows.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setSaving(true);
    try {
      const saved = await directStockEntryService.create({
        warehouseId: userWarehouseId,
        entryDate: date,
        reason: mapReasonToApi(reason),
        customReason: reason === 'Other' ? otherReason.trim() : null,
        referenceNo: referenceNo.trim() || null,
        notes: notes.trim() || null,
        items: filledRows.map((row) => ({
          itemId: row.itemId,
          quantity: row.qty,
          rate: row.rate,
          unitName: row.unit || null,
        })),
      });

      setEntryNumber(saved.dse_number);
      setSuccessSummary({
        entryNumber: saved.dse_number,
        warehouseName: userWarehouseName,
        reason: reason === 'Other' ? otherReason : reason,
        itemCount: filledRows.length,
        totalQty: saved.total_qty,
        totalValue: saved.total_value,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save direct stock entry';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [reason, otherReason, filledRows, date, userWarehouseId, userWarehouseName, referenceNo, notes, toast]);

  const handleNew = useCallback(() => {
    setSuccessSummary(null);
    setEntryNumber('');
    setReason('Opening Stock');
    setOtherReason('');
    setReferenceNo('');
    setNotes('');
    setRows([makeSmartRow()]);
  }, []);

  const lb = 'block text-xs font-semibold text-slate-500 mb-1';
  const fl = 'w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20';

  return (
    <>
      <div className="p-6 space-y-4">
        {/* Header Fields */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={lb}>Entry No</label>
              <input type="text" value={entryNumber} readOnly placeholder="Generated on save" className="w-full h-10 px-3 text-sm bg-slate-50 border border-[#e2e8f0] rounded-lg text-slate-500 cursor-not-allowed font-mono" />
            </div>
            <div>
              <label className={lb}>Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fl} />
            </div>
            <div className="lg:col-span-2">
              <label className={lb}>Reason <span className="text-red-500">*</span></label>
              <select value={reason} onChange={(e) => setReason(e.target.value as DSEReason)} className={`${fl} cursor-pointer`}>
                {DSE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {reason === 'Other' && (
              <div className="lg:col-span-2">
                <label className={lb}>Specify Reason <span className="text-red-500">*</span></label>
                <input type="text" value={otherReason} onChange={(e) => setOtherReason(e.target.value)} placeholder="Enter reason..." className={fl} />
              </div>
            )}
            <div>
              <label className={lb}>Reference No <span className="text-slate-300">(optional)</span></label>
              <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} placeholder="e.g. AUDIT-2024" className={fl} />
            </div>
            <div className="lg:col-span-2">
              <label className={lb}>Notes <span className="text-slate-300">(optional)</span></label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." className={fl} />
            </div>
          </div>
          <div className="mt-4">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
              <i className="ri-store-3-line text-[#4f46e5] text-sm" />
              <span className="text-sm font-medium text-[#4f46e5]">{userWarehouseName}</span>
              <span className="text-xs text-indigo-400">(your warehouse)</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded font-medium">READ ONLY</span>
            </div>
          </div>
        </div>

        {/* Item Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Items</h2>
            <span className="text-xs text-slate-400">Scan barcode or type item name · Enter: Item → Qty → Rate → next row</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 w-8">#</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">Item</th>
                  <th className="px-2 py-2.5 text-right text-xs font-semibold text-slate-500 w-24">Qty</th>
                  <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500 w-20">Unit</th>
                  <th className="px-2 py-2.5 text-right text-xs font-semibold text-slate-500 w-28">Rate (₹)</th>
                  <th className="px-2 py-2.5 text-right text-xs font-semibold text-slate-500 w-28">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                 {rows.map((row, idx) => (
                  <SmartItemRow
                    key={row.id}
                    row={row}
                    rowIdx={idx}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                    onEnterOnRate={addRow}
                    isLast={idx === rows.length - 1}
                    warehouseId={userWarehouseId}
                    smartInputRef={(el) => { smartInputRefs.current[row.id] = el; }}
                  />
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
            <button type="button" onClick={addRow} className="flex items-center gap-1.5 text-sm text-[#4f46e5] hover:text-indigo-700 font-medium cursor-pointer px-2 py-1 rounded hover:bg-indigo-50">
              <i className="ri-add-line" /> Add Row
            </button>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-slate-500">Total Items: <strong className="text-[#1e293b]">{filledRows.length}</strong></span>
              <span className="text-slate-500">Total Qty: <strong className="text-[#1e293b]">{totalQty}</strong></span>
              <span className="font-bold text-[#1e293b]">Total Value: ₹{totalValue.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 h-10 px-6 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {saving ? (
              <><i className="ri-loader-4-line animate-spin" /> Saving...</>
            ) : (
              <><i className="ri-save-3-line" /> Save Entry <kbd className="text-[10px] bg-white/20 px-1 rounded ml-1">F9</kbd></>
            )}
          </button>
        </div>
      </div>

      {successSummary && (
        <DSESuccessModal
          summary={successSummary}
          onNew={handleNew}
          onViewHistory={() => { setSuccessSummary(null); navigate('/inventory/stock-entries'); }}
          onClose={() => setSuccessSummary(null)}
        />
      )}
    </>
  );
}
