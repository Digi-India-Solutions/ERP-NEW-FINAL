import AppLayout from '@/components/feature/AppLayout';

const bills = [
  { id: 'INV-2024-0342', type: 'Sale', party: 'TechVision Ltd', date: '31 Mar 2026', items: 4, amount: 18400, status: 'Paid' },
  { id: 'INV-2024-0341', type: 'Sale', party: 'Horizon Traders', date: '31 Mar 2026', items: 2, amount: 6750, status: 'Pending' },
  { id: 'PO-2024-0128', type: 'Purchase', party: 'Allied Supplies Co.', date: '30 Mar 2026', items: 8, amount: 42000, status: 'Paid' },
  { id: 'INV-2024-0340', type: 'Sale', party: 'StarMart Retail', date: '30 Mar 2026', items: 3, amount: 9200, status: 'Paid' },
  { id: 'INV-2024-0339', type: 'Sale', party: 'Blue Ocean Exports', date: '29 Mar 2026', items: 6, amount: 31500, status: 'Overdue' },
  { id: 'PO-2024-0127', type: 'Purchase', party: 'Prime Electronics', date: '29 Mar 2026', items: 12, amount: 87300, status: 'Paid' },
  { id: 'INV-2024-0338', type: 'Sale', party: 'NextGen Solutions', date: '28 Mar 2026', items: 5, amount: 14800, status: 'Pending' },
];

const statusBadge: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700',
  Pending: 'bg-amber-100 text-amber-700',
  Overdue: 'bg-red-100 text-red-600',
};

export default function Billing() {
  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Billing</h2>
            <p className="text-sm text-[#64748b] mt-0.5">Manage invoices and purchase orders</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#1e293b] hover:border-[#4f46e5] hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-download-line text-[#64748b]" />
              New Purchase Order
            </button>
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-add-line" />
              New Invoice
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Invoices', value: '342', icon: 'ri-file-list-3-line', color: 'text-[#4f46e5]', bg: 'bg-indigo-50' },
            { label: 'Paid', value: '₹3,28,400', icon: 'ri-checkbox-circle-line', color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Pending', value: '₹21,550', icon: 'ri-time-line', color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Overdue', value: '₹31,500', icon: 'ri-alert-line', color: 'text-red-500', bg: 'bg-red-50' },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <i className={`${s.icon} text-xl ${s.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1e293b]">{s.value}</p>
                <p className="text-xs text-[#64748b]">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {['Bill No.', 'Type', 'Party Name', 'Date', 'Items', 'Amount', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bills.map((b, idx) => (
                <tr key={b.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors cursor-pointer ${idx % 2 === 0 ? '' : 'bg-[#f8fafc]/40'}`}>
                  <td className="px-4 py-3 font-medium text-[#1e293b] whitespace-nowrap">{b.id}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.type === 'Sale' ? 'bg-indigo-50 text-[#4f46e5]' : 'bg-slate-100 text-slate-600'}`}>{b.type}</span>
                  </td>
                  <td className="px-4 py-3 text-[#1e293b] whitespace-nowrap">{b.party}</td>
                  <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{b.date}</td>
                  <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{b.items}</td>
                  <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">₹{b.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadge[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"><i className="ri-eye-line text-sm" /></button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"><i className="ri-edit-line text-sm" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
