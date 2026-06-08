import type { InvoiceTotals } from '@/types/billing';
import { formatINR } from '@/utils/format';



interface Props {
  invoiceNo: string;
  date: string;
  dueDate: string;
  warehouseId: string;
  isSameState: boolean;
  totals: InvoiceTotals;
   linkedGRN?:{
    id: string;
    supplierId: string;
    supplierName?: string;
    grnNumber?: string;
    date?: string;
  } | null;   // ✅ IMPORTANT

  paidAmount?: number; // ✅ NEW
  warehouses: { id: string; name: string }[]; // ✅ NEW
  

  onDateChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onWarehouseChange: (v: string) => void;
}


export default function PurchaseInfoSummary({
  invoiceNo,
  date,
  dueDate,
  warehouseId,
  isSameState,
  totals,
  onDateChange,
  onDueDateChange,
  onWarehouseChange,
  paidAmount = 0,         // ✅ ADD THIS
  warehouses, 
  linkedGRN,
}: Props) {
  const fl = 'w-full h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200';
  const lb = 'block text-xs text-slate-500 mb-0.5';

  const SummaryRow = ({
    label,
    value,
    bold,
    large,
    color,
  }: {
    label: string;
    value: string;
    bold?: boolean;
    large?: boolean;
    color?: string;
  }) => (
    <div className={`flex justify-between items-center py-1 ${large ? 'border-t border-[#e2e8f0] mt-1 pt-2' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-[#1e293b]' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-sm font-semibold ${color ?? (bold ? 'text-[#1e293b]' : 'text-[#1e293b]')} ${large ? 'text-base' : ''}`}>
        {value}
      </span>
    </div>
  );

    const paid = paidAmount ?? 0;
    const grandTotal = totals?.grandTotal ?? 0;
    const balance = grandTotal - paid;


    const paymentStatus =
      balance <= 0 ? 'PAID' :
      paid > 0 ? 'PARTIAL' :
      'UNPAID';

    const roundOff = totals?.roundOff ?? 0;



  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Invoice Info &amp; Summary</h3>

      {/* Pill badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
          {invoiceNo}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
        </span>
                <span
          className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${
            paymentStatus === 'PAID'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : paymentStatus === 'PARTIAL'
              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}
        >
          {paymentStatus}
        </span>

        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${isSameState ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
          {isSameState ? 'CGST+SGST' : 'IGST'}
        </span>
      </div>

      {/* Date + Warehouse + Due Date */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className={lb}>Invoice Date <span className="text-red-500">*</span></label>
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className={fl} />
        </div>
        <div>
          <label className={lb}>Due Date</label>
          <input type="date" value={dueDate} onChange={(e) => onDueDateChange(e.target.value)} className={fl} />
        </div>
        <div className="col-span-2">
          <label className={lb}>Warehouse</label>
          <select value={warehouseId} onChange={(e) => onWarehouseChange(e.target.value)} className={fl}>
            { warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary */}
      <div className="border-t border-[#e2e8f0] pt-2">
        <SummaryRow label="Subtotal" value={formatINR(totals?.subtotal ?? 0)} />
        {totals.totalDiscount > 0 && (
          <SummaryRow label="(-) Discount" value={`-${formatINR(totals?.totalDiscount ?? 0)}`} />
        )}
        <SummaryRow label="Taxable Amount" value={formatINR(totals?.taxableAmount ?? 0)} />
        {isSameState ? (
          <>
            {totals.totalCGST > 0 && <SummaryRow label="(+) CGST" value={formatINR(totals?.totalCGST ?? 0)} />}
            {totals.totalSGST > 0 && <SummaryRow label="(+) SGST" value={formatINR(totals?.totalSGST ?? 0)} />}
          </>
        ) : (
          totals.totalIGST > 0 && <SummaryRow label="(+) IGST" value={formatINR(totals?.totalIGST ?? 0)} />
        )}
        {roundOff !== 0 && (
          <SummaryRow
            label={roundOff > 0 ? '(+) Round Off' : '(-) Round Off'}
            value={`${roundOff > 0 ? '+' : '-'}${formatINR(Math.abs(roundOff))}`}
          />
        )}

        <SummaryRow
          label="Grand Total"
          value={formatINR(totals?.grandTotal ?? 0)}
          bold
          large
          color="text-[#4f46e5]"
        />
      </div>
    </div>
  );
}
