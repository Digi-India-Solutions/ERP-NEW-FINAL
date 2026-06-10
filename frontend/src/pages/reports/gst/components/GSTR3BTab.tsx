import { mockSalesInvoices, mockPurchaseInvoices } from '@/mocks/billing';
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

interface GSTR3BTabProps {
  month: number;
  year: number;
}

export default function GSTR3BTab({ month, year }: GSTR3BTabProps) {
  const periodSales = mockSalesInvoices.filter((inv) => isInPeriod(inv.date, month, year) && inv.status !== 'CANCELLED');
  const periodPurchases = mockPurchaseInvoices.filter((inv) => isInPeriod(inv.date, month, year) && inv.status === 'SAVED');

  // 3.1 Outward Supplies
  const taxableOutwardValue = periodSales.reduce((s, i) => s + i.taxableAmount, 0);
  const outwardIGST = periodSales.reduce((s, i) => s + i.totalIGST, 0);
  const outwardCGST = periodSales.reduce((s, i) => s + i.totalCGST, 0);
  const outwardSGST = periodSales.reduce((s, i) => s + i.totalSGST, 0);

  // 4. Eligible ITC
  const itcIGST = periodPurchases.reduce((s, i) => s + i.totalIGST, 0);
  const itcCGST = periodPurchases.reduce((s, i) => s + i.totalCGST, 0);
  const itcSGST = periodPurchases.reduce((s, i) => s + i.totalSGST, 0);
  const netITC = itcIGST + itcCGST + itcSGST;

  // 6. Payment of Tax
  const taxPayableIGST = outwardIGST;
  const taxPayableCGST = outwardCGST;
  const taxPayableSGST = outwardSGST;

  const lessITC_IGST = itcIGST;
  const lessITC_CGST = itcCGST;
  const lessITC_SGST = itcSGST;

  const taxToPayIGST = taxPayableIGST - lessITC_IGST;
  const taxToPayCGST = taxPayableCGST - lessITC_CGST;
  const taxToPaySGST = taxPayableSGST - lessITC_SGST;

  const netGSTPayable = taxToPayIGST + taxToPayCGST + taxToPaySGST;

  const exportCSV = () => {
    const lines = [
      'GSTR-3B Report',
      `Period,${month}/${year}`,
      '',
      '3.1 Details of Outward Supplies',
      `Taxable Outward Supplies - IGST,${outwardIGST}`,
      `Taxable Outward Supplies - CGST,${outwardCGST}`,
      `Taxable Outward Supplies - SGST,${outwardSGST}`,
      'Zero Rated Supplies,0',
      'Nil Rated,0',
      'Exempted,0',
      '',
      '4. Eligible ITC',
      `Import of Goods,0`,
      `From Registered Suppliers,${netITC}`,
      'ITC Reversed,0',
      `Net ITC,${netITC}`,
      '',
      '5. Exempt/Nil/Non-GST Supplies,0',
      '',
      '6. Payment of Tax',
      'Description,IGST,CGST,SGST',
      `Tax Payable,${taxPayableIGST},${taxPayableCGST},${taxPayableSGST}`,
      `Less: ITC,${lessITC_IGST},${lessITC_CGST},${lessITC_SGST}`,
      `Tax to Pay,${taxToPayIGST},${taxToPayCGST},${taxToPaySGST}`,
      '',
      `Net GST Payable,${netGSTPayable}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR-3B-${String(month).padStart(2, '0')}-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Net GST Payable Card */}
      <div className={`rounded-xl border px-6 py-5 flex items-center justify-between ${netGSTPayable > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <div>
          <p className="text-sm font-medium text-[#64748b]">Net GST Payable / Refund Due</p>
          <p className={`text-2xl font-bold mt-1 ${netGSTPayable > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatINR(Math.abs(netGSTPayable))} {netGSTPayable > 0 ? 'payable' : 'refund due'}
          </p>
          <p className="text-xs text-[#64748b] mt-1">
            {netGSTPayable > 0
              ? 'Payment required for this tax period'
              : 'Excess ITC available — refund or carry forward'}
          </p>
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${netGSTPayable > 0 ? 'bg-red-100' : 'bg-emerald-100'}`}>
          <i className={`ri-${netGSTPayable > 0 ? 'money-rupee-circle-line' : 'refund-line'} text-2xl ${netGSTPayable > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
        </div>
      </div>

      {/* Section 3.1 — Outward Supplies */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#1e293b]">3.1 Details of Outward Supplies</h3>
          <button
            onClick={exportCSV}
            className="h-8 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
          >
            <i className="ri-download-line text-xs" />
            Export CSV
          </button>
        </div>
        <div className="p-5 space-y-3">
          {/* (a) Taxable outward supplies */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-xs font-semibold text-[#64748b] mb-2">(a) Taxable Outward Supplies</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-[#64748b]">Integrated Tax (IGST)</p>
                <p className="font-semibold text-amber-600">{formatINR(outwardIGST)}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Central Tax (CGST)</p>
                <p className="font-semibold text-[#4f46e5]">{formatINR(outwardCGST)}</p>
              </div>
              <div>
                <p className="text-xs text-[#64748b]">State Tax (SGST)</p>
                <p className="font-semibold text-violet-600">{formatINR(outwardSGST)}</p>
              </div>
            </div>
          </div>

          {/* (b)(c)(d) */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: '(b) Zero Rated Supplies', value: 0 },
              { label: '(c) Nil Rated', value: 0 },
              { label: '(d) Exempted', value: 0 },
            ].map((item) => (
              <div key={item.label} className="border border-[#e2e8f0] rounded-lg p-3 text-center">
                <p className="text-xs text-[#64748b]">{item.label}</p>
                <p className="text-sm font-semibold text-[#1e293b] mt-1">{formatINR(item.value)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 4 — Eligible ITC */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#1e293b]">4. Eligible Input Tax Credit (ITC)</h3>
        </div>
        <div className="p-5 space-y-4">
          {/* (A) ITC Available */}
          <div>
            <p className="text-xs font-semibold text-[#64748b] mb-2">(A) ITC Available</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-[#f1f5f9]">
                <span className="text-sm text-[#1e293b]">Import of Goods</span>
                <span className="text-sm font-medium text-[#64748b]">{formatINR(0)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[#f1f5f9]">
                <span className="text-sm text-[#1e293b]">From Registered Suppliers (Inward Supplies)</span>
                <span className="text-sm font-semibold text-emerald-600">{formatINR(netITC)}</span>
              </div>
            </div>
          </div>

          {/* (B) ITC Reversed */}
          <div>
            <p className="text-xs font-semibold text-[#64748b] mb-2">(B) ITC Reversed</p>
            <div className="flex items-center justify-between py-2 border-b border-[#f1f5f9]">
              <span className="text-sm text-[#1e293b]">As per rules 42 & 43 of CGST/SGST rules</span>
              <span className="text-sm font-medium text-[#64748b]">{formatINR(0)}</span>
            </div>
          </div>

          {/* (C) Net ITC */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-800">(C) Net ITC Available (A - B)</span>
            <span className="text-lg font-bold text-emerald-700">{formatINR(netITC)}</span>
          </div>
        </div>
      </div>

      {/* Section 5 */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1e293b]">5. Values of Exempt / Nil / Non-GST Supplies</p>
          <p className="text-xs text-[#64748b] mt-0.5">Inter-state and intra-state supplies to unregistered persons</p>
        </div>
        <p className="text-lg font-bold text-[#1e293b]">{formatINR(0)}</p>
      </div>

      {/* Section 6 — Payment of Tax */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e2e8f0]">
          <h3 className="text-sm font-semibold text-[#1e293b]">6. Payment of Tax</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#64748b]">Description</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b]">IGST</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b]">CGST</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[#64748b]">SGST</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#f1f5f9]">
                <td className="px-4 py-3 font-medium text-[#1e293b]">Tax Payable</td>
                <td className="px-4 py-3 text-right font-semibold text-amber-600">{formatINR(taxPayableIGST)}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#4f46e5]">{formatINR(taxPayableCGST)}</td>
                <td className="px-4 py-3 text-right font-semibold text-violet-600">{formatINR(taxPayableSGST)}</td>
              </tr>
              <tr className="border-t border-[#f1f5f9] bg-slate-50/50">
                <td className="px-4 py-3 font-medium text-[#1e293b]">Less: ITC Available</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatINR(lessITC_IGST)}</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatINR(lessITC_CGST)}</td>
                <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatINR(lessITC_SGST)}</td>
              </tr>
              <tr className="border-t border-[#e2e8f0] bg-slate-50">
                <td className="px-4 py-3 font-bold text-[#1e293b]">Tax to Pay (in cash / credit)</td>
                <td className={`px-4 py-3 text-right font-bold ${taxToPayIGST > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatINR(taxToPayIGST)}</td>
                <td className={`px-4 py-3 text-right font-bold ${taxToPayCGST > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatINR(taxToPayCGST)}</td>
                <td className={`px-4 py-3 text-right font-bold ${taxToPaySGST > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatINR(taxToPaySGST)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary footer */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div>
            <p className="text-xs text-[#64748b]">Outward Taxable</p>
            <p className="font-bold text-[#1e293b]">{formatINR(taxableOutwardValue)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">Total Tax Payable</p>
            <p className="font-bold text-amber-600">{formatINR(taxPayableIGST + taxPayableCGST + taxPayableSGST)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">Total ITC</p>
            <p className="font-bold text-emerald-600">{formatINR(netITC)}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">Net GST Payable</p>
            <p className={`font-bold ${netGSTPayable > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatINR(Math.abs(netGSTPayable))}</p>
          </div>
          <div>
            <p className="text-xs text-[#64748b]">Sales / Purchase Docs</p>
            <p className="font-bold text-[#1e293b]">{periodSales.length} / {periodPurchases.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}