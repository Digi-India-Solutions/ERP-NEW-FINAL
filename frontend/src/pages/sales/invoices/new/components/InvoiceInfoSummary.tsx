import type { InvoiceTotals } from '@/types/billing';
import { formatINR } from '@/utils/format';

interface Props {
  invoiceNo: string;
  date: string;
  dueDate: string;
  salesman: string;

  isSameState: boolean;
  totals: InvoiceTotals;
  /** Net payable after credits/discounts — used to compute live balance */
  netPayable?: number;
  /** Total amount already entered in payment fields */
  totalPaid?: number;
  onDateChange: (v: string) => void;
  onDueDateChange: (v: string) => void;
  onSalesmanChange: (v: string) => void;
  challanPrefill?: { challanNo: string } | null;

}

export default function InvoiceInfoSummary({
  invoiceNo, date, dueDate, salesman, isSameState, totals,
  netPayable, totalPaid = 0,
  onDateChange, onDueDateChange, onSalesmanChange,
  challanPrefill = [],
}: Props) {
  const fl = 'w-full h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200';
  const lb = 'block text-xs text-slate-500 mb-0.5';

  // Live payment status calculation
  const grandTotal = netPayable ?? totals.grandTotal;
  const balanceDue = Math.max(0, grandTotal - totalPaid);
  const fullyPaid = totalPaid >= grandTotal && grandTotal > 0;
  const partialPaid = totalPaid > 0 && totalPaid < grandTotal;
  console.log("SSSSS==>setInvoiceNo==>", invoiceNo, date,)
  const paymentStatusBadge = () => {
    if (fullyPaid) return { label: 'FULLY PAID', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    if (partialPaid) return { label: 'PARTIAL', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'UNPAID', cls: 'bg-red-50 text-red-600 border-red-200' };
  };

  const badge = paymentStatusBadge();

  const SummaryRow = ({
    label, value, bold, large, color,
  }: { label: string; value: string; bold?: boolean; large?: boolean; color?: string }) => (
    <div className={`flex justify-between items-center py-1 ${large ? 'border-t border-[#e2e8f0] mt-1 pt-2' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-[#1e293b]' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-sm font-semibold ${color ?? (bold ? 'text-[#1e293b]' : 'text-[#1e293b]')} ${large ? 'text-base' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Invoice Info &amp; Summary</h3>

      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">{invoiceNo}</span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
        </span>
        {/* Live payment status badge */}
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold transition-colors ${badge.cls}`}>
          {badge.label}
        </span>
        {challanPrefill && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <i className="ri-file-copy-line text-[10px]" />From {challanPrefill.challanNo}
          </span>
        )}
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${isSameState ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
          {isSameState ? 'CGST+SGST' : 'IGST'}
        </span>
      </div>

      {/* Form fields */}
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
          <label className={lb}>Salesman (optional)</label>
          <input type="text" value={salesman} onChange={(e) => onSalesmanChange(e.target.value)} className={fl} placeholder="Salesman name" />
        </div>
      </div>

      {/* Totals */}
      <div className="border-t border-[#e2e8f0] pt-2">
        <SummaryRow label="Subtotal" value={formatINR(totals.subtotal)} />
        {totals.totalDiscount > 0 && (
          <SummaryRow label="(-) Discount" value={`-${formatINR(totals.totalDiscount)}`} />
        )}
        <SummaryRow label="Taxable Amount" value={formatINR(totals.taxableAmount)} />
        {isSameState ? (
          <>
            {totals.totalCGST > 0 && <SummaryRow label="(+) CGST" value={formatINR(totals.totalCGST)} />}
            {totals.totalSGST > 0 && <SummaryRow label="(+) SGST" value={formatINR(totals.totalSGST)} />}
          </>
        ) : (
          totals.totalIGST > 0 && <SummaryRow label="(+) IGST" value={formatINR(totals.totalIGST)} />
        )}
        {totals.roundOff !== 0 && (
          <SummaryRow
            label={totals.roundOff > 0 ? '(+) Round Off' : '(-) Round Off'}
            value={formatINR(Math.abs(totals.roundOff))}
          />
        )}
        <SummaryRow label="Grand Total" value={formatINR(totals.grandTotal)} bold large color="text-[#4f46e5]" />

        {/* Live balance to pay — updates as user types payment amounts */}
        {totalPaid > 0 && (
          <>
            <SummaryRow label="Amount Paid" value={formatINR(totalPaid)} color="text-emerald-600" />
            <div className={`flex justify-between items-center py-1.5 mt-1 px-2 rounded-lg border ${fullyPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
              <span className="text-sm font-semibold text-[#1e293b]">Balance to Pay</span>
              <span className={`text-sm font-bold ${fullyPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                {fullyPaid ? <span className="flex items-center gap-1"><i className="ri-checkbox-circle-fill" /> Cleared</span> : formatINR(balanceDue)}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}