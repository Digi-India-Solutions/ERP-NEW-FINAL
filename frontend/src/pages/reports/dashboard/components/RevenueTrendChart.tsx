import { formatINRShort } from '@/utils/format';

interface MonthData {
  label: string;
  sales: number;
  purchases: number;
}

const MONTHS: MonthData[] = [
  { label: 'Nov', sales: 285000, purchases: 198000 },
  { label: 'Dec', sales: 320000, purchases: 225000 },
  { label: 'Jan', sales: 298000, purchases: 210000 },
  { label: 'Feb', sales: 375000, purchases: 258000 },
  { label: 'Mar', sales: 428500, purchases: 302000 },
  { label: 'Apr', sales: 456800, purchases: 285600 },
];

export default function RevenueTrendChart() {
  const maxVal = Math.max(...MONTHS.flatMap((m) => [m.sales, m.purchases]));

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">Revenue Trend</h3>
          <p className="text-xs text-[#64748b] mt-0.5">Last 6 months — Sales vs Purchases</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
            Sales
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" />
            Purchases
          </span>
        </div>
      </div>

      <div className="flex items-end gap-2 h-44">
        {MONTHS.map((m) => {
          const salesH = Math.round((m.sales / maxVal) * 100);
          const purchH = Math.round((m.purchases / maxVal) * 100);
          return (
            <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end gap-0.5" style={{ height: '160px' }}>
                {/* Sales bar */}
                <div
                  className="flex-1 bg-emerald-500 rounded-t-md transition-all"
                  style={{ height: `${salesH}%` }}
                  title={`Sales: ${formatINRShort(m.sales)}`}
                />
                {/* Purchase bar */}
                <div
                  className="flex-1 bg-amber-400 rounded-t-md transition-all"
                  style={{ height: `${purchH}%` }}
                  title={`Purchases: ${formatINRShort(m.purchases)}`}
                />
              </div>
              <span className="text-xs text-[#94a3b8]">{m.label}</span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-[#94a3b8] mt-3 pt-3 border-t border-[#f1f5f9]">
        <span>Sales this period: <span className="font-medium text-emerald-600">₹4,56,800</span></span>
        <span>Purchases this period: <span className="font-medium text-amber-600">₹2,85,600</span></span>
        <span>Net margin: <span className="font-medium text-[#1e293b]">37.5%</span></span>
      </div>
    </div>
  );
}