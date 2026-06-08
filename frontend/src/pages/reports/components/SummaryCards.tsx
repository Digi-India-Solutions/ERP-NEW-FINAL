interface SummaryCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  sub?: string;
}

interface SummaryCardsProps {
  cards: SummaryCard[];
}

export default function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className={`grid gap-4 mb-4 grid-cols-2 lg:grid-cols-${Math.min(cards.length, 4)}`}>
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-4"
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}>
            <i className={`${card.icon} text-lg`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-[#64748b] whitespace-nowrap">{card.label}</p>
            <p className="text-lg font-bold text-[#1e293b] whitespace-nowrap">{card.value}</p>
            {card.sub && <p className="text-[11px] text-[#94a3b8] whitespace-nowrap">{card.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
