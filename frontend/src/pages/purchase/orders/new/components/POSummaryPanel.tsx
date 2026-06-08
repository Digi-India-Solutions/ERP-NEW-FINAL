import type { POPriority } from '../page';

interface Props {
  totalItems: number;
  totalQty: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  gstType: 'CGST_SGST' | 'IGST';
  priority: POPriority;
  onPriorityChange: (p: POPriority) => void;
}

const PRIORITIES: { value: POPriority; color: string; active: string }[] = [
  { value: 'Normal', color: 'text-slate-600 border-slate-200 hover:bg-slate-50', active: 'bg-slate-700 text-white border-slate-700' },
  { value: 'High', color: 'text-amber-600 border-amber-200 hover:bg-amber-50', active: 'bg-amber-500 text-white border-amber-500' },
  { value: 'Urgent', color: 'text-orange-600 border-orange-200 hover:bg-orange-50', active: 'bg-orange-500 text-white border-orange-500' },
  { value: 'Critical', color: 'text-red-600 border-red-200 hover:bg-red-50', active: 'bg-red-600 text-white border-red-600' },
];

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function POSummaryPanel({
  totalItems,
  totalQty,
  subtotal,
  cgst,
  sgst,
  igst,
  grandTotal,
  gstType,
  priority,
  onPriorityChange,
}: Props) {
  const row = 'flex items-center justify-between py-1.5 border-b border-[#f1f5f9]';
  const lbl = 'text-xs text-slate-500';
  const val = 'text-sm font-medium text-[#1e293b]';

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">PO Summary</h3>

      <div className="space-y-0">
        <div className={row}>
          <span className={lbl}>Total Items</span>
          <span className={val}>{totalItems}</span>
        </div>
        <div className={row}>
          <span className={lbl}>Total Qty</span>
          <span className={val}>{totalQty}</span>
        </div>
        <div className={row}>
          <span className={lbl}>Subtotal</span>
          <span className={val}>{formatINR(subtotal)}</span>
        </div>

        {gstType === 'CGST_SGST' ? (
          <>
            <div className={row}>
              <span className={lbl}>CGST</span>
              <span className={val}>{formatINR(cgst)}</span>
            </div>
            <div className={row}>
              <span className={lbl}>SGST</span>
              <span className={val}>{formatINR(sgst)}</span>
            </div>
          </>
        ) : (
          <div className={row}>
            <span className={lbl}>IGST</span>
            <span className={val}>{formatINR(igst)}</span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div className="mt-3 pt-3 border-t-2 border-[#4f46e5]/20 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-600">Grand Total</span>
        <span className="text-xl font-extrabold text-[#4f46e5]">{formatINR(grandTotal)}</span>
      </div>

      {/* Priority */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Priority</p>
        <div className="grid grid-cols-2 gap-1.5">
          {PRIORITIES.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onPriorityChange(p.value)}
              className={`h-7 px-2 text-xs font-semibold rounded-lg border cursor-pointer whitespace-nowrap transition-colors ${
                priority === p.value ? p.active : p.color
              }`}
            >
              {p.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
