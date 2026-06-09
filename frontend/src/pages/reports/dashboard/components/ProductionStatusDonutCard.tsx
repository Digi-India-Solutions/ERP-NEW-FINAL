import { mockProductionOrders } from '@/mocks/masters';

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT:       { bg: '#94a3b8', text: '#64748b',  dot: 'bg-slate-400' },
  PLANNED:     { bg: '#60a5fa', text: '#2563eb',  dot: 'bg-sky-400' },
  IN_PROGRESS: { bg: '#f59e0b', text: '#d97706',  dot: 'bg-amber-400' },
  COMPLETED:   { bg: '#10b981', text: '#059669',  dot: 'bg-emerald-500' },
  ON_HOLD:     { bg: '#f97316', text: '#ea580c',  dot: 'bg-orange-500' },
  CANCELLED:   { bg: '#ef4444', text: '#dc2626',  dot: 'bg-red-500' },
};

export default function ProductionStatusDonut() {
  const counts = mockProductionOrders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  const total = mockProductionOrders.length;

  const segments = Object.entries(counts).map(([status, count]) => ({
    status,
    count,
    pct: Math.round((count / total) * 100),
    color: STATUS_COLORS[status]?.bg ?? '#94a3b8',
    dotColor: STATUS_COLORS[status]?.dot ?? 'bg-slate-400',
    textColor: STATUS_COLORS[status]?.text ?? '#64748b',
  }));

  // SVG donut
  const R = 50;
  const cx = 70;
  const cy = 70;
  const strokeW = 18;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  const arcs = segments.map((s) => {
    const dashLen = (s.pct / 100) * circumference;
    const arc = { ...s, dashLen, offset };
    offset += dashLen;
    return arc;
  });

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Production Status</h3>
      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" className="-rotate-90">
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
            {arcs.map((arc) => (
              <circle
                key={arc.status}
                cx={cx}
                cy={cy}
                r={R}
                fill="none"
                stroke={arc.color}
                strokeWidth={strokeW}
                strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
                strokeDashoffset={-arc.offset}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-[#1e293b]">{total}</span>
            <span className="text-xs text-[#64748b]">Orders</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 flex-1">
          {segments.map((s) => (
            <div key={s.status} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${s.dotColor} flex-shrink-0`} />
                <span className="text-xs text-[#475569] capitalize">{s.status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold" style={{ color: s.textColor }}>{s.count}</span>
                <span className="text-xs text-[#94a3b8]">{s.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#f1f5f9]">
        {(() => {
          const completed = counts['COMPLETED'] ?? 0;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          return (
            <div className="flex justify-between text-xs">
              <span className="text-[#64748b]">Completion rate</span>
              <span className="font-semibold text-emerald-600">{pct}%</span>
            </div>
          );
        })()}
      </div>
    </div>
  );
}