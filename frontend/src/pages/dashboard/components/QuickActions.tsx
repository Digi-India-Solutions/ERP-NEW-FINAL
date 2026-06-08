import { useNavigate } from 'react-router-dom';

interface QuickAction {
  label: string;
  icon: string;
  path: string;
  color: string;
  shortcut?: string;
}

const ACTIONS: QuickAction[] = [
  { label: 'New Sale', icon: 'ri-shopping-cart-2-line', path: '/sales/invoices/new', color: 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200', shortcut: 'F5' },
  { label: 'New Purchase', icon: 'ri-store-2-line', path: '/purchase/invoices/new', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200', shortcut: 'F6' },
  { label: 'Check Stock', icon: 'ri-bar-chart-horizontal-line', path: '/inventory/stock', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100 border-amber-200' },
  { label: 'New Challan', icon: 'ri-truck-line', path: '/sales/challans', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-200' },
  { label: 'Low Stock', icon: 'ri-alert-line', path: '/reports/low-stock', color: 'bg-red-50 text-red-500 hover:bg-red-100 border-red-200' },
  { label: 'Party Ledger', icon: 'ri-group-line', path: '/reports/party-ledger', color: 'bg-indigo-50 text-[#4f46e5] hover:bg-indigo-100 border-indigo-200' },
];

export default function QuickActions() {
  const navigate = useNavigate();
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-3">Quick Actions</p>
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all cursor-pointer ${action.color}`}
          >
            <div className="w-8 h-8 flex items-center justify-center">
              <i className={`${action.icon} text-xl`} />
            </div>
            <span className="text-xs font-medium whitespace-nowrap">{action.label}</span>
            {/* {action.shortcut && (
              <kbd className="text-[9px] opacity-60 font-mono">{action.shortcut}</kbd>
            )} */}
          </button>
        ))}
      </div>
    </div>
  );
}
