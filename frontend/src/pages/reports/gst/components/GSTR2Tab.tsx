import { mockPurchaseInvoices } from '@/mocks/billing';
import { mockParties } from '@/mocks/masters';

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

function isInPeriod(dateStr: string, month: number, year: number) {
  const [y, m] = dateStr.split('-').map(Number);
  return y === year && m === month;
}

function getSupplierGstin(partyName: string): string | undefined {
  return mockParties.find((p) => p.name === partyName)?.gstin;
}

interface GSTR2TabProps {
  month: number;
  year: number;
}

export default function GSTR2Tab({ month, year }: GSTR2TabProps) {
  const periodPurchases = mockPurchaseInvoices.filter((inv) => isInPeriod(inv.date, month, year) && inv.status === 'SAVED');

  // All purchase invoices in our data are from registered suppliers (all have GSTIN)
  const registeredPurchases = periodPurchases;

  const totalPurchaseTaxable = registeredPurchases.reduce((s, i) => s + i.taxableAmount, 0);
  const totalCGST = registeredPurchases.reduce((s, i) => s + i.totalCGST, 0);
  const totalSGST = registeredPurchases.reduce((s, i) => s + i.totalSGST, 0);
  const totalIGST = registeredPurchases.reduce((s, i) => s + i.totalIGST, 0);
  const totalITC = totalCGST + totalSGST + totalIGST;

  const exportCSV = () => {
    const lines = [
      'GSTR-2 Report',
      `Period,${month}/${year}`,
      '',
      'Purchase from Registered Suppliers',
      'Invoice No,Date,Supplier GSTIN,Supplier Name,Taxable Value,CGST,SGST,IGST,Total GST,Eligible ITC',
      ...registeredPurchases.map((inv) => {
        const gstin = inv.supplierGstin || getSupplierGstin(inv.partyName) || '';
        const itc = inv.totalCGST + inv.totalSGST + inv.totalIGST;
        return [
          inv.billNo,
          inv.date,
          gstin,
          inv.partyName,
          inv.taxableAmount,
          inv.totalCGST,
          inv.totalSGST,
          inv.totalIGST,
          itc,
          itc,
        ].join(',');
      }),
      '',
      'Summary',
      `Total Purchase Taxable,${totalPurchaseTaxable}`,
      `Total ITC Available,${totalITC}`,
      `CGST ITC,${totalCGST}`,
      `SGST ITC,${totalSGST}`,
      `IGST ITC,${totalIGST}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR-2-${String(month).padStart(2, '0')}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (periodPurchases.length === 0) {
    return (
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-8 text-center text-[#64748b]">
        <i className="ri-file-list-3-line text-4xl text-slate-200 block mb-3" />
        <p className="text-sm font-medium">No purchase invoices found for this period</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Purchases', value: registeredPurchases.length, color: 'bg-indigo-50 text-[#4f46e5]', icon: 'ri-file-list-3-line' },
          { label: 'Total Taxable', value: formatINR(totalPurchaseTaxable), color: 'bg-emerald-50 text-emerald-600', icon: 'ri-money-rupee-circle-line' },
          { label: 'Total ITC Available', value: formatINR(totalITC), color: 'bg-sky-50 text-sky-600', icon: 'ri-refund-line' },
          { label: 'Registered Suppliers', value: new Set(registeredPurchases.map((i) => i.partyName)).size, color: 'bg-violet-50 text-violet-600', icon: 'ri-building-line' },
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

      {/* Purchase table */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#1e293b]">Purchase from Registered Suppliers</h3>
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
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Supplier GSTIN</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#64748b]">Supplier Name</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Taxable Value</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">CGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">SGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">IGST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Total GST</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#64748b]">Eligible ITC</th>
              </tr>
            </thead>
            <tbody>
              {registeredPurchases.map((inv) => {
                const gstin = inv.supplierGstin || getSupplierGstin(inv.partyName) || '-';
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
                    <td className="px-3 py-2.5 text-right font-semibold text-emerald-600">{formatINR(totalGst)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t border-[#e2e8f0]">
                <td colSpan={4} className="px-3 py-2.5 text-xs font-semibold text-[#64748b]">TOTAL ({registeredPurchases.length} invoices)</td>
                <td className="px-3 py-2.5 text-right font-bold">{formatINR(totalPurchaseTaxable)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-[#4f46e5]">{formatINR(totalCGST)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-violet-600">{formatINR(totalSGST)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-amber-600">{formatINR(totalIGST)}</td>
                <td className="px-3 py-2.5 text-right font-bold">{formatINR(totalITC)}</td>
                <td className="px-3 py-2.5 text-right font-bold text-emerald-600">{formatINR(totalITC)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Import of Goods */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#1e293b]">Import of Goods</h3>
        </div>
        <div className="p-8 text-center text-[#64748b]">
          <i className="ri-ship-line text-4xl text-slate-200 block mb-3" />
          <p className="text-sm font-medium">No import transactions recorded for this period</p>
          <p className="text-xs mt-1">Import GST (IGST on imports) will appear here when recorded</p>
        </div>
      </div>

      {/* Summary footer */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#64748b]">Total Purchase Taxable</p>
            <p className="font-bold text-[#1e293b]">{formatINR(totalPurchaseTaxable)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">Total ITC Available</p>
            <p className="font-bold text-emerald-600">{formatINR(totalITC)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">CGST ITC / SGST ITC</p>
            <p className="font-bold text-[#1e293b]">{formatINR(totalCGST)} / {formatINR(totalSGST)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">IGST ITC</p>
            <p className="font-bold text-[#1e293b]">{formatINR(totalIGST)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}