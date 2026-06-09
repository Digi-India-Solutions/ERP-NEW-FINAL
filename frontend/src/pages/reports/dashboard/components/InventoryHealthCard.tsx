import { mockLowStock } from '@/mocks/reports';
import { mockStockSummary } from '@/mocks/reports';

export default function InventoryHealthCard() {
  const totalItems = mockStockSummary.length;
  const lowStockItems = mockStockSummary.filter((i) => i.status === 'LOW').length;
  const outOfStock = mockStockSummary.filter((i) => i.currentStock === 0).length;
  const criticalItems = mockStockSummary.filter((i) => i.status === 'CRITICAL').length;

  const rows = [
    { label: 'Total Active Items', value: totalItems, color: 'text-[#1e293b]', icon: 'ri-archive-2-line', dot: 'bg-slate-400' },
    { label: 'Low Stock Items', value: lowStockItems + mockLowStock.length, color: 'text-amber-600', icon: 'ri-alert-line', dot: 'bg-amber-400' },
    { label: 'Out of Stock', value: outOfStock, color: 'text-red-600', icon: 'ri-close-circle-line', dot: 'bg-red-500' },
    { label: 'Critical Level', value: criticalItems, color: 'text-red-700', icon: 'ri-error-warning-line', dot: 'bg-red-700' },
    { label: 'Overstock Items', value: mockStockSummary.filter((i) => i.currentStock > i.minLevel * 5).length, color: 'text-sky-600', icon: 'ri-stack-line', dot: 'bg-sky-400' },
  ];

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
        <i className="ri-store-3-line text-amber-500" />
        Inventory Health
      </h3>

      <div className="space-y-2.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between py-1.5 border-b border-[#f8fafc] last:border-0">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${r.dot} flex-shrink-0`} />
              <span className="text-xs text-[#475569]">{r.label}</span>
            </div>
            <span className={`text-sm font-bold ${r.color}`}>{r.value}</span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#64748b]">Stock health score</span>
          <span className="font-semibold text-emerald-600">
            {Math.round(((totalItems - criticalItems - outOfStock) / Math.max(totalItems, 1)) * 100)}%
          </span>
        </div>
        <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400 rounded-full"
            style={{ width: `${Math.round(((totalItems - criticalItems - outOfStock) / Math.max(totalItems, 1)) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}