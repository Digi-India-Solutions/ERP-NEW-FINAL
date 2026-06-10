import { mockFinancialSummary } from '@/mocks/finance';
import { formatINR } from '@/utils/format';

const WEEKLY = [
  { week: 'Week 1', receipts: 85000, payments: 65000 },
  { week: 'Week 2', receipts: 92000, payments: 78000 },
  { week: 'Week 3', receipts: 104000, payments: 48000 },
  { week: 'Week 4', receipts: 99000, payments: 29000 },
];

export default function CashFlowCard() {
  const { totalReceipts, totalPayments } = mockFinancialSummary;
  const netCashFlow = totalReceipts - totalPayments;
  const maxVal = Math.max(...WEEKLY.flatMap((w) => [w.receipts, w.payments]));

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
      <h3 className="text-sm font-semibold text-[#1e293b] mb-1">Cash Flow</h3>
      <p className="text-xs text-[#64748b] mb-4">This month — weekly breakdown</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2.5 bg-emerald-50 rounded-lg">
          <p className="text-xs text-emerald-600 font-medium">Receipts</p>
          <p className="text-sm font-bold text-emerald-700 mt-0.5">{formatINR(totalReceipts)}</p>
        </div>
        <div className="text-center p-2.5 bg-red-50 rounded-lg">
          <p className="text-xs text-red-600 font-medium">Payments</p>
          <p className="text-sm font-bold text-red-700 mt-0.5">{formatINR(totalPayments)}</p>
        </div>
        <div className={`text-center p-2.5 rounded-lg ${netCashFlow >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
          <p className={`text-xs font-medium ${netCashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>Net Cash</p>
          <p className={`text-sm font-bold mt-0.5 ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {formatINR(Math.abs(netCashFlow))}
          </p>
        </div>
      </div>

      {/* Weekly bars */}
      <div className="space-y-2">
        {WEEKLY.map((w) => {
          const recPct = Math.round((w.receipts / maxVal) * 100);
          const payPct = Math.round((w.payments / maxVal) * 100);
          return (
            <div key={w.week} className="flex items-center gap-2">
              <span className="text-xs text-[#94a3b8] w-12 flex-shrink-0">{w.week}</span>
              <div className="flex-1 flex flex-col gap-0.5">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${recPct}%` }} />
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-400 rounded-full" style={{ width: `${payPct}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400 inline-block" />
          Receipts
        </span>
        <span className="flex items-center gap-1.5 text-xs text-[#64748b]">
          <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" />
          Payments
        </span>
      </div>
    </div>
  );
}