import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';

interface ReportCard {
  title: string;
  desc: string;
  icon: string;
  color: string;
  path: string;
  badge?: string;
}

const inventoryReports: ReportCard[] = [
  { title: 'Stock Summary', desc: 'Current stock levels, valuation, and status for all items', icon: 'ri-stack-line', color: 'bg-indigo-50 text-[#4f46e5]', path: '/reports/stock-summary' },
  { title: 'Stock Ledger', desc: 'Complete movement history for any item in a warehouse', icon: 'ri-file-list-3-line', color: 'bg-blue-50 text-blue-600', path: '/reports/stock-ledger' },
  { title: 'Low Stock Alert', desc: 'Items below minimum reorder level with suggested reorder quantity', icon: 'ri-alert-line', color: 'bg-red-50 text-red-500', path: '/reports/low-stock', badge: 'Action Required' },
];

const purchaseReports: ReportCard[] = [
  { title: 'Purchase Register', desc: 'All purchase invoices with GST breakdown by date range', icon: 'ri-store-2-line', color: 'bg-green-50 text-green-600', path: '/reports/purchase-register' },
  { title: 'GST Purchase Register', desc: 'Purchase taxable values by GST slab — GSTR-2A/2B reconciliation', icon: 'ri-receipt-line', color: 'bg-teal-50 text-teal-600', path: '/reports/gst-purchase', badge: 'GST Filing' },
];

const salesReports: ReportCard[] = [
  { title: 'Sales Register', desc: 'All sales invoices with GST breakdown, payment status by date range', icon: 'ri-bar-chart-2-line', color: 'bg-emerald-50 text-emerald-600', path: '/reports/sales-register' },
  { title: 'GST Sales Register (GSTR-1)', desc: 'Sales taxable values by GST slab — GSTR-1 filing preparation', icon: 'ri-file-shield-2-line', color: 'bg-amber-50 text-amber-600', path: '/reports/gst-sales', badge: 'GST Filing' },
  { title: 'Outstanding Invoices', desc: 'Unpaid invoices with aging buckets (0-30, 31-60, 61-90, 90+)', icon: 'ri-money-rupee-circle-line', color: 'bg-orange-50 text-orange-600', path: '/reports/outstanding' },
];

const generalReports: ReportCard[] = [
  { title: 'Day Book', desc: 'All transactions on a single date grouped by type with subtotals', icon: 'ri-calendar-check-line', color: 'bg-violet-50 text-violet-600', path: '/reports/day-book' },
  { title: 'Party Ledger', desc: 'Customer or supplier ledger with opening balance, transactions, and running balance', icon: 'ri-group-line', color: 'bg-slate-100 text-slate-600', path: '/reports/party-ledger' },
];

interface SectionProps {
  title: string;
  icon: string;
  cards: ReportCard[];
}

function ReportSection({ title, icon, cards }: SectionProps) {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <i className={`${icon} text-base text-[#64748b]`} />
        <h3 className="text-sm font-semibold text-[#64748b] uppercase tracking-wider">{title}</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((r) => (
          <button
            key={r.path}
            onClick={() => navigate(r.path)}
            className="bg-white border border-[#e2e8f0] rounded-xl p-5 hover:border-[#4f46e5]/40 hover:bg-indigo-50/20 transition-all cursor-pointer text-left group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${r.color.split(' ')[0]} flex items-center justify-center`}>
                <i className={`${r.icon} text-base ${r.color.split(' ')[1]}`} />
              </div>
              {r.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${r.badge === 'Action Required' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                  {r.badge}
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-[#1e293b] group-hover:text-[#4f46e5] transition-colors">{r.title}</h3>
            <p className="text-xs text-[#64748b] mt-1 leading-relaxed">{r.desc}</p>
            <div className="mt-4 flex items-center gap-1 text-xs text-[#4f46e5] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Open Report</span>
              <i className="ri-arrow-right-line text-xs" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReportsLanding() {
  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Reports</h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              {inventoryReports.length + purchaseReports.length + salesReports.length + generalReports.length} reports available · All support Excel, PDF & Print export
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
            <i className="ri-information-line" />
            <span>All reports show mock data until backend is connected</span>
          </div>
        </div>

        <ReportSection title="Inventory Reports" icon="ri-archive-stack-line" cards={inventoryReports} />
        <ReportSection title="Purchase Reports" icon="ri-store-2-line" cards={purchaseReports} />
        <ReportSection title="Sales Reports" icon="ri-shopping-cart-2-line" cards={salesReports} />
        <ReportSection title="General Reports" icon="ri-file-chart-line" cards={generalReports} />
      </div>
    </AppLayout>
  );
}
