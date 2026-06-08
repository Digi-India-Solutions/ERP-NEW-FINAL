import type { InvoiceTotals } from '@/types/billing';
import { formatINR } from '@/utils/format';

interface Props {
  totals: InvoiceTotals;
  isSameState: boolean;
}

export default function TotalsCard({ totals, isSameState }: Props) {
  const Row = ({ label, value, bold, large }: { label: string; value: string; bold?: boolean; large?: boolean }) => (
    <div className={`flex justify-between py-1.5 ${large ? 'border-t border-[#e2e8f0] mt-1 pt-2.5' : ''}`}>
      <span className={`text-sm ${bold ? 'font-semibold text-[#1e293b]' : 'text-slate-500'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-[#1e293b]' : 'text-[#1e293b]'} ${large ? 'text-base' : ''}`}>{value}</span>
    </div>
  );

  return (
    <div className="w-full max-w-xs ml-auto mt-4 bg-white border border-[#e2e8f0] rounded-xl p-4">
      <Row label="Subtotal" value={formatINR(totals.subtotal)} />
      {totals.totalDiscount > 0 && <Row label="(-) Total Discount" value={`-${formatINR(totals.totalDiscount)}`} />}
      <Row label="Taxable Amount" value={formatINR(totals.taxableAmount)} />
      {isSameState ? (
        <>
          {totals.totalCGST > 0 && <Row label="(+) CGST" value={formatINR(totals.totalCGST)} />}
          {totals.totalSGST > 0 && <Row label="(+) SGST" value={formatINR(totals.totalSGST)} />}
        </>
      ) : (
        totals.totalIGST > 0 && <Row label="(+) IGST" value={formatINR(totals.totalIGST)} />
      )}
      {totals.roundOff !== 0 && (
        <Row label={totals.roundOff > 0 ? '(+) Round Off' : '(-) Round Off'} value={formatINR(Math.abs(totals.roundOff))} />
      )}
      <Row label="Grand Total" value={formatINR(totals.grandTotal)} bold large />
    </div>
  );
}
