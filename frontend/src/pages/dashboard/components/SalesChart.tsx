import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { getData } from '../../../services/FetchNodeServices.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TrendPoint {
  month:     string;   // 'Jan'
  monthFull: string;   // 'January 2025'
  sales:     number;
  purchase:  number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatAxis  = (val: number) => `₹${(val / 1000).toFixed(0)}K`;
const formatRupee = (val: number) =>
  val >= 100_000
    ? `₹${(val / 100_000).toFixed(2)}L`
    : `₹${val.toLocaleString('en-IN')}`;

// ─────────────────────────────────────────────────────────────────────────────
// Custom Tooltip
// ─────────────────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const monthFull = payload[0]?.payload?.monthFull ?? label;
  const sales    = payload.find((p: any) => p.dataKey === 'sales')?.value    ?? 0;
  const purchase = payload.find((p: any) => p.dataKey === 'purchase')?.value ?? 0;
  const net      = sales - purchase;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-lg px-4 py-3 text-xs min-w-[170px]">
      <p className="font-semibold text-[#1e293b] mb-2">{monthFull}</p>
      <div className="space-y-1.5">
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#64748b]">
            <span className="w-2 h-2 rounded-full bg-[#4f46e5] inline-block" />
            Sales
          </span>
          <span className="font-semibold text-[#4f46e5]">{formatRupee(sales)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 text-[#64748b]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] inline-block" />
            Purchase
          </span>
          <span className="font-semibold text-[#10b981]">{formatRupee(purchase)}</span>
        </div>
        <div className="border-t border-[#f1f5f9] pt-1.5 flex justify-between gap-4">
          <span className="text-[#64748b]">Net</span>
          <span className={`font-semibold ${net >= 0 ? 'text-[#1e293b]' : 'text-red-500'}`}>
            {net >= 0 ? '+' : ''}{formatRupee(net)}
          </span>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function SalesChart() {
  const [data,    setData]    = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getData('api/v1/dashboard/sales-trend');
        console.log('sales-trend===>' ,res)
        if (!res?.success || !Array.isArray(res?.data)) {
          throw new Error(res?.message ?? 'Failed to load chart data.');
        }
        if (!cancelled) {
          setData(res.data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Failed to load chart data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Summary stats for the header pills
  const totalSales    = data.reduce((s, d) => s + d.sales,    0);
  const totalPurchase = data.reduce((s, d) => s + d.purchase, 0);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex flex-col gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">Sales vs Purchase</h3>
          <p className="text-xs text-[#64748b] mt-0.5">Last 6 months overview</p>
        </div>

        {/* Legend + totals */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4f46e5] inline-block" />
            Sales
            {!loading && (
              <span className="font-semibold text-[#4f46e5] ml-0.5">
                {formatRupee(totalSales)}
              </span>
            )}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block" />
            Purchase
            {!loading && (
              <span className="font-semibold text-[#10b981] ml-0.5">
                {formatRupee(totalPurchase)}
              </span>
            )}
          </span>
        </div>
      </div>

      {/* ── Skeleton ── */}
      {loading && (
        <div className="h-[220px] rounded-lg bg-slate-50 animate-pulse flex items-end gap-2 px-4 pb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-200 rounded-t"
              style={{ height: `${40 + i * 15}%` }}
            />
          ))}
        </div>
      )}

      {/* ── Error ── */}
      {!loading && error && (
        <div className="h-[220px] flex flex-col items-center justify-center text-[#94a3b8] gap-2">
          <i className="ri-error-warning-line text-3xl text-red-400" />
          <p className="text-sm text-red-500">{error}</p>
        </div>
      )}

      {/* ── Chart ── */}
      {!loading && !error && data.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatAxis}
              tick={{ fontSize: 11, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="sales"
              stroke="#4f46e5"
              strokeWidth={2}
              fill="url(#salesGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#4f46e5', strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="purchase"
              stroke="#10b981"
              strokeWidth={2}
              fill="url(#purchaseGrad)"
              dot={false}
              activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* ── Empty state (all zeros) ── */}
      {!loading && !error && data.length === 0 && (
        <div className="h-[220px] flex flex-col items-center justify-center text-[#94a3b8]">
          <i className="ri-line-chart-line text-4xl mb-2" />
          <p className="text-sm font-medium">No data available</p>
        </div>
      )}

    </div>
  );
}