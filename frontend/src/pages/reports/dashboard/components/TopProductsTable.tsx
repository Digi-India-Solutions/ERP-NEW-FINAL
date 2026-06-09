import { formatINR } from '@/utils/format';
import { mockSalesInvoices } from '@/mocks/billing';

interface TopProduct {
  name: string;
  unitsSold: number;
  revenue: number;
  margin: number;
}

function buildTopProducts(): TopProduct[] {
  const map = new Map<string, { units: number; rev: number; cost: number }>();
  mockSalesInvoices
    .filter((inv) => inv.status === 'SAVED')
    .forEach((inv) => {
      inv.items.forEach((item) => {
        const existing = map.get(item.itemName) ?? { units: 0, rev: 0, cost: 0 };
        existing.units += item.qty;
        existing.rev += item.taxableAmount;
        existing.cost += item.qty * (item.rate * 0.65);
        map.set(item.itemName, existing);
      });
    });

  return Array.from(map.entries())
    .map(([name, v]) => ({
      name,
      unitsSold: v.units,
      revenue: v.rev,
      margin: v.rev > 0 ? Math.round(((v.rev - v.cost) / v.rev) * 100) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
}

export default function TopProductsTable() {
  const products = buildTopProducts();
  const maxRevenue = products[0]?.revenue ?? 1;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Top 5 Products by Revenue</h3>
      <div className="space-y-3">
        {products.map((p, i) => (
          <div key={p.name} className="flex items-center gap-3">
            <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-[#64748b] flex-shrink-0">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium text-[#1e293b] truncate">{p.name}</span>
                <span className="text-xs text-[#64748b] ml-2 whitespace-nowrap">{p.unitsSold} units</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full"
                    style={{ width: `${Math.round((p.revenue / maxRevenue) * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-emerald-600 whitespace-nowrap">
                  {p.margin}%
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-0.5">{formatINR(p.revenue)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}