import type { PurchaseRow } from '@/types/billing';
import type { MockGRN } from '@/mocks/billing';
import { formatINR } from '@/utils/format';

interface Props {
  rows: PurchaseRow[];
  isSameState: boolean;
  tcs: number;
  addCharges: number;
  onTcsChange: (v: number) => void;
  onAddChargesChange: (v: number) => void;
  linkedGRN?: {
  id: string;
  supplierId: string;
  supplierName?: string;
  grnNumber?: string;
  date?: string;
} | null;
  paidAmount?: number;
  warehouses?: { id: string; name: string }[];
}

export default function PurchaseInvoiceSummary({
  rows, isSameState, tcs, addCharges,
  onTcsChange, onAddChargesChange, linkedGRN,
}: Props) {
  const validRows  = rows.filter((r) => r.itemName && r.qty > 0);
  const totalQty   = validRows.reduce((s, r) => s + r.qty, 0);
  const baseAmount = validRows.reduce((s, r) => s + r.qty * r.purRate * (1 + (r.purExpPct || 0) / 100), 0);
  const totalTaxable = baseAmount;
  const grossAmount  = baseAmount;

  const gstByRate: Record<number, number> = {};
  validRows.forEach((r) => {
    const effectiveRate = r.purRate * (1 + r.purExpPct / 100);
    const taxable = r.qty * effectiveRate;
    const gst     = taxable * r.taxRate / 100;
    gstByRate[r.taxRate] = (gstByRate[r.taxRate] ?? 0) + gst;
  });

  const totalGST = Object.values(gstByRate).reduce((s, v) => s + v, 0);
  const cgst     = isSameState ? totalGST / 2 : 0;
  const sgst     = isSameState ? totalGST / 2 : 0;
  const igst     = isSameState ? 0 : totalGST;
  const grandTotal = Math.round(totalTaxable + totalGST + tcs + addCharges);
  const totalMRP   = grandTotal;

  // ── Input with NO spinner arrows ─────────────────────────────────────────
  // Using type="text" with numeric validation to avoid browser's up/down arrows
  const NoSpinnerInput = ({
    value, onChange,
  }: { value: number; onChange: (v: number) => void }) => (
    <input
      type="text"
      inputMode="decimal"
      value={value === 0 ? '' : value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '' || /^\d*\.?\d*$/.test(v)) onChange(v === '' ? 0 : parseFloat(v) || 0);
      }}
      placeholder="0"
      className="w-24 h-7 px-2 text-xs bg-white border border-[#e2e8f0] rounded focus:outline-none focus:border-[#4f46e5] text-right"
    />
  );

  const Row = ({
    label, value, bold, large, color, editable, editValue, onEdit,
  }: {
    label: string; value: string; bold?: boolean; large?: boolean; color?: string;
    editable?: boolean; editValue?: number; onEdit?: (v: number) => void;
  }) => (
    <div className={`flex justify-between items-center py-1 ${large ? 'border-t border-[#e2e8f0] mt-1 pt-2' : ''}`}>
      <span className={`text-xs ${bold ? 'font-semibold text-[#1e293b]' : 'text-slate-500'}`}>{label}</span>
      {editable && onEdit != null ? (
        <NoSpinnerInput value={editValue ?? 0} onChange={onEdit} />
      ) : (
        <span className={`text-xs font-semibold ${color ?? (bold ? 'text-[#1e293b]' : 'text-[#1e293b]')} ${large ? 'text-sm' : ''}`}>
          {value}
        </span>
      )}
    </div>
  );

  const summaryRows = [
    { key: 'gross',   label: 'Gross Amount',     value: formatINR(grossAmount) },
    ...(isSameState
      ? [
          { key: 'cgst', label: '(+) CGST', value: formatINR(cgst), show: cgst > 0 },
          { key: 'sgst', label: '(+) SGST', value: formatINR(sgst), show: sgst > 0 },
        ]
      : [{ key: 'igst', label: '(+) IGST', value: formatINR(igst), show: igst > 0 }]),
    { key: 'tcs',     label: '(+) TCS',          editable: true, value: '', editValue: tcs,        onEdit: onTcsChange        },
    { key: 'charges', label: '(+) Add/Charges',  editable: true, value: '', editValue: addCharges, onEdit: onAddChargesChange },
    { key: 'grand',   label: 'Grand Total',       value: formatINR(grandTotal), bold: true, large: true, color: 'text-[#4f46e5]' },
  ];

  const stats = [
    { label: 'Total Qty', value: totalQty },
    { label: 'Total MRP', value: formatINR(totalMRP) },
  ];

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Invoice Summary</h3>

      {/* GRN linked notice */}
      {linkedGRN && (
        <div className="mb-3 flex items-start gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
          <i className="ri-checkbox-circle-line text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-700">Stock already updated via {linkedGRN.grnNumber}</p>
            <p className="text-[10px] text-emerald-600 mt-0.5">No double stock entry — financial record only</p>
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-2 text-center">
            <div className="text-lg font-bold text-[#1e293b]">{s.value}</div>
            <div className="text-[10px] text-slate-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#e2e8f0] pt-2">
        {summaryRows
          .filter((r) => (r as any).show !== false)
          .map((r) => (
            <Row
              key={r.key}
              label={r.label}
              value={r.value}
              bold={(r as any).bold}
              large={(r as any).large}
              color={(r as any).color}
              editable={(r as any).editable}
              editValue={(r as any).editValue}
              onEdit={(r as any).onEdit}
            />
          ))}
      </div>
    </div>
  );
}