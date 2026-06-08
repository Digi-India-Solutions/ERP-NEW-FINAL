import { useEffect, useState } from "react";
import { getData } from '../../../services/FetchNodeServices.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────

interface TopItem {
  id: string;
  name: string;
  code: string;
  category: string;
  totalQtySold: number;
  totalRevenue: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatAmount(val: number): string {
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
}

const BAR_COLORS = ["#4f46e5", "#7c3aed", "#2563eb", "#0891b2", "#0d9488"];

// ── Custom Tooltip ─────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl shadow-lg px-4 py-3 text-xs space-y-1 min-w-[160px]">
      <p className="font-semibold text-[#1e293b] mb-1.5">{item.fullName}</p>
      {item.code !== "—" && (
        <div className="flex justify-between gap-4">
          <span className="text-[#64748b]">Code</span>
          <span className="font-medium text-[#1e293b]">{item.code}</span>
        </div>
      )}
      <div className="flex justify-between gap-4">
        <span className="text-[#64748b]">Qty Sold</span>
        <span className="font-semibold text-[#4f46e5]">{item.sold} units</span>
      </div>
      <div className="flex justify-between gap-4">
        <span className="text-[#64748b]">Revenue</span>
        <span className="font-semibold text-[#1e293b]">{formatAmount(item.revenue)}</span>
      </div>
      {item.category !== "—" && (
        <div className="flex justify-between gap-4">
          <span className="text-[#64748b]">Category</span>
          <span className="text-[#1e293b]">{item.category}</span>
        </div>
      )}
    </div>
  );
};

// ── Component ──────────────────────────────────────────────────────────────

export default function TopItemsChart() {
  const [items, setItems] = useState<TopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchTopItems = async () => {
      try {
        setLoading(true);
        setError(false);
        const res = await getData("api/v1/dashboard/top-items");
        console.log("DDDDD::=>SSSSSSS" , res)
        if (res.success===true) {
          setItems(res.data);
        }
      } catch (err) {
        console.error("TopItemsChart fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchTopItems();
  }, []);

  const data = items.map((item) => ({
    fullName: item.name,
    name: item.name.length > 14 ? item.name.slice(0, 13) + "…" : item.name,
    sold: item.totalQtySold,
    revenue: item.totalRevenue,
    category: item.category,
    code: item.code,
  }));

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">Top Selling Items</h3>
          <p className="text-xs text-[#64748b] mt-0.5">Units sold this month</p>
        </div>
        {!loading && items.length > 0 && (
          <span className="text-xs text-[#64748b] bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2.5 py-1">
            Top {items.length}
          </span>
        )}
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3 py-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-20 h-3 bg-slate-100 rounded animate-pulse shrink-0" />
              <div
                className="h-4 bg-slate-100 rounded animate-pulse"
                style={{ width: `${65 - i * 10}%` }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-10 text-red-400">
          <i className="ri-error-warning-line text-3xl mb-2" />
          <p className="text-sm font-medium">Failed to load data</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-[#94a3b8]">
          <i className="ri-bar-chart-2-line text-4xl mb-2" />
          <p className="text-sm font-medium">No sales data this month</p>
          <p className="text-xs mt-0.5">Create invoices to see top items</p>
        </div>
      )}

      {/* Chart */}
      {!loading && !error && items.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                width={95}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="sold" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {data.map((_, idx) => (
                  <Cell key={idx} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Legend / summary */}
          <div className="border-t border-[#f1f5f9] pt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
                />
                <span
                  className="text-[11px] text-[#64748b] truncate"
                  title={item.fullName}
                >
                  {item.fullName}
                </span>
                <span className="text-[11px] font-semibold text-[#1e293b] shrink-0 ml-auto">
                  {item.sold}
                </span>
              </div>
            ))}
          </div>

          {/* Revenue summary row */}
          <div className="border-t border-[#f1f5f9] pt-3 flex flex-wrap gap-2">
            {data.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg px-2.5 py-1"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: BAR_COLORS[idx % BAR_COLORS.length] }}
                />
                <span className="text-[11px] text-[#64748b] truncate max-w-[80px]" title={item.fullName}>
                  {item.fullName}
                </span>
                <span className="text-[11px] font-semibold text-[#1e293b]">
                  {formatAmount(item.revenue)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}