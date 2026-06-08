interface KPICardProps {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  indigo: { bg: 'bg-indigo-50', icon: 'text-[#4f46e5]', badge: 'bg-indigo-100 text-indigo-700' },
  green: { bg: 'bg-green-50', icon: 'text-green-600', badge: 'bg-green-100 text-green-700' },
  amber: { bg: 'bg-amber-50', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  red: { bg: 'bg-red-50', icon: 'text-red-500', badge: 'bg-red-100 text-red-600' },
};

export default function KPICard({ label, value, change, trend, icon, color }: KPICardProps) {
  const c = colorMap[color] ?? colorMap.indigo;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex flex-col gap-3 hover:border-[#4f46e5]/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
          <i className={`${icon} text-xl ${c.icon}`} />
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.badge} flex items-center gap-1 whitespace-nowrap`}>
          <i className={`${trend === 'up' ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-xs`} />
          {change}
        </span>
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1e293b] tracking-tight">{value}</p>
        <p className="text-sm text-[#64748b] mt-0.5">{label}</p>
      </div>
    </div>
  );
}
