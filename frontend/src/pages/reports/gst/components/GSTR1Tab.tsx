import { mockSalesInvoices } from '@/mocks/billing';
import { mockParties } from '@/mocks/masters';

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function isInPeriod(dateStr: string, month: number, year: number) {
  const [y, m] = dateStr.split('-').map(Number);
  return y === year && m === month;
}

function getPartyGstin(partyName: string): string | undefined {
  return mockParties.find((p) => p.name === partyName)?.gstin;
}

interface GSTR1TabProps {
  month: number;
  year: number;
}

export default function GSTR1Tab({ month, year }: GSTR1TabProps) {
  const periodInvoices = mockSalesInvoices.filter((inv) => isInPeriod(inv.date, month, year) && inv.status !== 'CANCELLED');

  const b2bInvoices = periodInvoices.filter((inv) => {
    const partyGstin = getPartyGstin(inv.partyName);
    return !!partyGstin || !!inv.customerGstin;
  });

  const b2cInvoices = periodInvoices.filter((inv) => {
    const partyGstin = getPartyGstin(inv.partyName);
    return !partyGstin && !inv.customerGstin;
  });

  // HSN Summary
  const hsnMap = new Map<string, { hsnCode: string; desc: string; uom: string; qty: number; taxable: number; taxRate: number; cgst: number; sgst: number; igst: number }>();
  periodInvoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const key = item.hsnCode;
      const existing = hsnMap.get(key);
      if (existing) {
        existing.qty += item.qty;
        existing.taxable += item.taxableAmount;
        existing.cgst += item.cgst;
        existing.sgst += item.sgst;
        existing.igst += item.igst;
      } else {
        hsnMap.set(key, {
          hsnCode: item.hsnCode,
          desc: item.itemName,
          uom: item.unit,
          qty: item.qty,
          taxable: item.taxableAmount,
          taxRate: item.taxRate,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
        });
      }
    });
  });
  const hsnSummary = Array.from(hsnMap.values()).sort((a, b) => a.hsnCode.localeCompare(b.hsnCode));

  const totalB2BTaxable = b2bInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalB2CTaxable = b2cInvoices.reduce((s, i) => s + i.taxableAmount, 0);
  const totalTaxable = totalB2BTaxable + totalB2CTaxable;
  const totalCGST = periodInvoices.reduce((s, i) => s + i.totalCGST, 0);
  const totalSGST = periodInvoices.reduce((s, i) => s + i.totalSGST, 0);
  const totalIGST = periodInvoices.reduce((s, i) => s + i.totalIGST, 0);
  const totalGSTCollected = totalCGST + totalSGST + totalIGST;

  const exportCSV = () => {
    const lines = [
      'GSTR-1 Report',
      `Period,${month}/${year}`,
      '',
      'B2B Sales',
      'Invoice No,Date,Customer GSTIN,Customer Name,Taxable Value,CGST,SGST,IGST,Total GST,Invoice Total',
      ...b2bInvoices.map((inv) => [
        inv.billNo,
        inv.date,
        inv.customerGstin || getPartyGstin(inv.partyName) || '',
        inv.partyName,
        inv.taxableAmount,
        inv.totalCGST,
        inv.totalSGST,
        inv.totalIGST,
        inv.totalCGST + inv.totalSGST + inv.totalIGST,
        inv.grandTotal,
      ].join(',')),
      '',
      'B2C Sales',
      'Invoice No,Date,Customer Name,Taxable Value,GST Rate,GST Amount,Total',
      ...b2cInvoices.map((inv) => {
        const taxAmt = inv.totalCGST + inv.totalSGST + inv.totalIGST;
        const rate = inv.taxableAmount > 0 ? Math.round((taxAmt / inv.taxableAmount) * 100) : 0;
        return [
          inv.billNo,
          inv.date,
          inv.partyName,
          inv.taxableAmount,
          `${rate}%`,
          taxAmt,
          inv.grandTotal,
        ].join(',');
      }),
      '',
      'HSN Summary',
      'HSN Code,Description,UOM,Total Qty,Taxable Value,GST Rate,CGST,SGST,IGST,Total Tax',
      ...hsnSummary.map((h) => [
        h.hsnCode,
        h.desc,
        h.uom,
        h.qty,
        Math.round(h.taxable * 100) / 100,
        `${h.taxRate}%`,
        Math.round(h.cgst * 100) / 100,
        Math.round(h.sgst * 100) / 100,
        Math.round(h.igst * 100) / 100,
        Math.round((h.cgst + h.sgst + h.igst) * 100) / 100,
      ].join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR-1-${String(month).padStart(2, '0')}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (periodInvoices.length === 0) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 text-center text-[#64748b]">
        <i className="ri-file-list-3-line text-4xl text-slate-200 block mb-3" />
        <p className="text-sm font-medium">No sales invoices found for this period</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: periodInvoices.length, color: 'bg-indigo-50 text-[#4f46e5]', icon: 'ri-file-list-3-line' },
          { label: 'Total Taxable', value: formatINR(totalTaxable), color: 'bg-emerald-50 text-emerald-600', icon: 'ri-money-rupee-circle-line' },
          { label: 'Total GST Collected', value: formatINR(totalGSTCollected), color: 'bg-amber-50 text-amber-600', icon: 'ri-government-line' },
          { label: 'B2B Invoices', value: b2bInvoices.length, color: 'bg-sky-50 text-sky-600', icon: 'ri-building-line' },
        ].map((card) => (
          <div key={card.label} className={`${card.color.split(' ')[0]} border border-[#e2e8f0] rounded-xl p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 flex items-center justify-center">
                <i className={`${card.icon} text-base ${card.color.split(' ')[1]}`} />
              </div>
              <span className="text-xs font-medium text-[#64748b]">{card.label}</span>
            </div>
            <p className="text-lg font-bold text-[#1e293b]">{card.value}</p>
          </div>
        ))}
      </div>

      {/* B2B Sales */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#1e293b]">B2B Sales (Registered Customers)</h3>
          <button
            onClick={exportCSV}
            className="h-8 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <i className="ri-download-line text-xs" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Invoice No</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Date</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Customer GSTIN</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Customer Name</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Taxable Value</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">CGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">SGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">IGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Total GST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Invoice Total</th>
              </tr>
            </thead>
            <tbody>
              {b2bInvoices.map((inv) => {
                const gstin = inv.customerGstin || getPartyGstin(inv.partyName) || '-';
                const totalGst = inv.totalCGST + inv.totalSGST + inv.totalIGST;
                return (
                  <tr key={inv.id} className="border-t border-[#f1f5f9] hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-mono text-xs font-medium text-[#4f46e5]">{inv.billNo}</td>
                    <td className="px-3 py-2.5 text-xs text-[#64748b]">{inv.date}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">{gstin}</td>
                    <td className="px-3 py-2.5 font-medium text-[#1e293b]">{inv.partyName}</td>
                    <td className="px-3 py-2.5 text-right">{formatINR(inv.taxableAmount)}</td>
                    <td className="px-3 py-2.5 text-right text-[#4f46e5]">{inv.totalCGST > 0 ? formatINR(inv.totalCGST) : '—'}</td>
                    <td className="px-3 py-2.5 text-right text-violet-600">{inv.totalSGST > 0 ? formatINR(inv.totalSGST) : '—'}</td>
                    <td className="px-3 py-2.5 text-right text-amber-600">{inv.totalIGST > 0 ? formatINR(inv.totalIGST) : '—'}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">{formatINR(totalGst)}</td>
                    <td className="px-3 py-2.5 text-right font-bold">{formatINR(inv.grandTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-[#e2e8f0]">
                <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold text-[#64748b]">B2B TOTAL ({b2bInvoices.length} invoices)</td>
                <td className="px-3 py-2.5 text-right font-bold">{formatINR(totalB2BTaxable)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#4f46e5]">{formatINR(b2bInvoices.reduce((s, i) => s + i.totalCGST, 0))}</td>
                <td className="px-3 py-2.5 text-right font-bold text-violet-600">{formatINR(b2bInvoices.reduce((s, i) => s + i.totalSGST, 0))}</td>
                <td className="px-3 py-2.5 text-right font-bold text-amber-600">{formatINR(b2bInvoices.reduce((s, i) => s + i.totalIGST, 0))}</td>
                <td className="px-3 py-2.5 text-right font-bold">{formatINR(b2bInvoices.reduce((s, i) => s + i.totalCGST + i.totalSGST + i.totalIGST, 0))}</td>
                <td className="px-3 py-2.5 text-right font-bold">{formatINR(b2bInvoices.reduce((s, i) => s + i.grandTotal, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* B2C Sales */}
      {b2cInvoices.length > 0 && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-[#1e293b]">B2C Sales (Retail / Unregistered Customers)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Invoice No</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Customer Name</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Taxable Value</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">GST Rate</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">GST Amount</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Total</th>
                </tr>
              </thead>
              <tbody>
                {b2cInvoices.map((inv) => {
                  const taxAmt = inv.totalCGST + inv.totalSGST + inv.totalIGST;
                  const rate = inv.taxableAmount > 0 ? Math.round((taxAmt / inv.taxableAmount) * 100) : 0;
                  return (
                    <tr key={inv.id} className="border-t border-[#f1f5f9] hover:bg-slate-50/50">
                      <td className="px-3 py-2.5 font-mono text-xs font-medium text-[#4f46e5]">{inv.billNo}</td>
                      <td className="px-3 py-2.5 text-xs text-[#64748b]">{inv.date}</td>
                      <td className="px-3 py-2.5 font-medium text-[#1e293b]">{inv.partyName}</td>
                      <td className="px-3 py-2.5 text-right">{formatINR(inv.taxableAmount)}</td>
                      <td className="px-3 py-2.5 text-right">{rate > 0 ? `${rate}%` : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-semibold">{taxAmt > 0 ? formatINR(taxAmt) : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-bold">{formatINR(inv.grandTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t border-[#e2e8f0]">
                  <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold text-[#64748b]">B2C TOTAL ({b2cInvoices.length} invoices)</td>
                  <td className="px-3 py-2.5 text-right font-bold">{formatINR(totalB2CTaxable)}</td>
                  <td className="px-3 py-2.5 text-right">—</td>
                  <td className="px-3 py-2.5 text-right font-bold">{formatINR(b2cInvoices.reduce((s, i) => s + i.totalCGST + i.totalSGST + i.totalIGST, 0))}</td>
                  <td className="px-3 py-2.5 text-right font-bold">{formatINR(b2cInvoices.reduce((s, i) => s + i.grandTotal, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* HSN Summary */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#1e293b]">HSN-wise Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">HSN Code</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Description</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">UOM</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Total Qty</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Taxable Value</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">GST Rate</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">CGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">SGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">IGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Total Tax</th>
              </tr>
            </thead>
            <tbody>
              {hsnSummary.map((h) => (
                <tr key={h.hsnCode} className="border-t border-[#f1f5f9] hover:bg-slate-50/50">
                  <td className="px-3 py-2.5 font-mono text-xs font-medium">{h.hsnCode}</td>
                  <td className="px-3 py-2.5 text-xs text-[#1e293b]">{h.desc}</td>
                  <td className="px-3 py-2.5 text-xs text-[#64748b]">{h.uom}</td>
                  <td className="px-3 py-2.5 text-right">{h.qty}</td>
                  <td className="px-3 py-2.5 text-right">{formatINR(Math.round(h.taxable * 100) / 100)}</td>
                  <td className="px-3 py-2.5 text-right">{h.taxRate > 0 ? `${h.taxRate}%` : '0%'}</td>
                  <td className="px-3 py-2.5 text-right text-[#4f46e5]">{h.cgst > 0 ? formatINR(Math.round(h.cgst * 100) / 100) : '—'}</td>
                  <td className="px-3 py-2.5 text-right text-violet-600">{h.sgst > 0 ? formatINR(Math.round(h.sgst * 100) / 100) : '—'}</td>
                  <td className="px-3 py-2.5 text-right text-amber-600">{h.igst > 0 ? formatINR(Math.round(h.igst * 100) / 100) : '—'}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatINR(Math.round((h.cgst + h.sgst + h.igst) * 100) / 100)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-[#e2e8f0]">
                <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold text-[#64748b]">TOTAL ({hsnSummary.length} HSN codes)</td>
                <td className="px-3 py-2.5 text-right font-bold">{formatINR(Math.round(hsnSummary.reduce((s, h) => s + h.taxable, 0) * 100) / 100)}</td>
                <td className="px-3 py-2.5 text-right">—</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#4f46e5]">{formatINR(Math.round(hsnSummary.reduce((s, h) => s + h.cgst, 0) * 100) / 100)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-violet-600">{formatINR(Math.round(hsnSummary.reduce((s, h) => s + h.sgst, 0) * 100) / 100)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-amber-600">{formatINR(Math.round(hsnSummary.reduce((s, h) => s + h.igst, 0) * 100) / 100)}</td>
                <td className="px-3 py-2.5 text-right font-bold">{formatINR(Math.round(hsnSummary.reduce((s, h) => s + h.cgst + h.sgst + h.igst, 0) * 100) / 100)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Grand Summary Footer */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#64748b]">Total B2B Taxable</p>
            <p className="font-bold text-[#1e293b]">{formatINR(totalB2BTaxable)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">Total B2C Taxable</p>
            <p className="font-bold text-[#1e293b]">{formatINR(totalB2CTaxable)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">Total Taxable Value</p>
            <p className="font-bold text-[#1e293b]">{formatINR(totalTaxable)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">Total GST Collected</p>
            <p className="font-bold text-amber-600">{formatINR(totalGSTCollected)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">CGST / SGST / IGST</p>
            <p className="font-bold text-[#1e293b]">
              {formatINR(totalCGST)} / {formatINR(totalSGST)} / {formatINR(totalIGST)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}