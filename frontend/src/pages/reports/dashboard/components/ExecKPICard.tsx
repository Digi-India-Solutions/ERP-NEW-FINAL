interface ExecKPICardProps {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  badge?: { text: string; color: string };
  trend?: 'up' | 'down' | 'neutral';
}

export default function ExecKPICard({
  label, value, subtitle, icon, iconBg, iconColor, badge, trend,
}: ExecKPICardProps) {
  const trendIcon =
    trend === 'up' ? 'ri-arrow-up-line text-emerald-500' :
    trend === 'down' ? 'ri-arrow-down-line text-red-500' : '';

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 hover:border-[#cbd5e1] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 flex items-center justify-center rounded-lg ${iconBg}`}>
          <i className={`${icon} text-base ${iconColor}`} />
        </div>
        {badge && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-xs text-[#94a3b8] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-xl font-bold text-[#1e293b] leading-tight">{value}</p>
      <p className={`text-xs mt-1 flex items-center gap-0.5 ${
        trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-500' : 'text-[#64748b]'
      }`}>
        {trendIcon && <i className={trendIcon} />}
        {subtitle}
      </p>
    </div>
  );
}