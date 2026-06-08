interface SummaryCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
}

function SummaryCard({ icon, label, value, color }: SummaryCardProps) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 flex items-center justify-center rounded-xl shrink-0 ${color}`}>
        <i className={`${icon} text-xl`} />
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[#1e293b] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default SummaryCard;