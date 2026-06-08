import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  invoiceNo: string;
  date: string;
  partyName: string;
  warehouseName: string;
  itemCount: number;
  grandTotal: number;
  paidAmount: number;
  balanceDue: number;
  paymentStatus: string;
  paymentMode: string;
  status: string;
}

interface Props {
  transactions: Transaction[];
  loading: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function formatAmount(val: number): string {
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000)   return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
}

// Maps API paymentStatus → display label + badge colours
const PAYMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PAID:    { label: 'Paid',    bg: 'bg-green-100', text: 'text-green-700' },
  PARTIAL: { label: 'Partial', bg: 'bg-amber-100',  text: 'text-amber-700' },
  UNPAID:  { label: 'Unpaid',  bg: 'bg-red-100',    text: 'text-red-600'  },
};

// Maps API paymentMode → display label + type badge colours
const PAYMENT_MODE_CONFIG: Record<string, { label: string; bg: string; text: string; icon: string }> = {
  CASH:    { label: 'Cash',    bg: 'bg-green-50',  text: 'text-green-700',  icon: 'ri-money-rupee-circle-line' },
  UPI:     { label: 'UPI',     bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'ri-smartphone-line'         },
  CARD:    { label: 'Card',    bg: 'bg-blue-50',   text: 'text-blue-600',   icon: 'ri-bank-card-line'          },
  CHEQUE:  { label: 'Cheque',  bg: 'bg-violet-50', text: 'text-violet-600', icon: 'ri-file-text-line'          },
  NEFT:    { label: 'NEFT',    bg: 'bg-cyan-50',   text: 'text-cyan-700',   icon: 'ri-bank-line'               },
  RTGS:    { label: 'RTGS',    bg: 'bg-cyan-50',   text: 'text-cyan-700',   icon: 'ri-bank-line'               },
  BANK:    { label: 'Bank',    bg: 'bg-slate-100',  text: 'text-slate-600',  icon: 'ri-bank-line'               },
  CREDIT:  { label: 'Credit',  bg: 'bg-amber-50',  text: 'text-amber-700',  icon: 'ri-bill-line'               },
  PARTIAL: { label: 'Partial', bg: 'bg-orange-50', text: 'text-orange-600', icon: 'ri-split-cells-horizontal'  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function RecentTransactions({ transactions, loading }: Props) {
  const navigate = useNavigate();

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">Recent Transactions</h3>
          <p className="text-xs text-[#64748b] mt-0.5">Latest bills and orders</p>
        </div>
        {/* <button
          onClick={() => navigate('/sales/invoices')}
          className="text-xs font-medium text-[#4f46e5] hover:text-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
        >
          View all
        </button> */}
      </div>

      {/* ── Skeleton ── */}
      {loading && (
        <div className="divide-y divide-[#f1f5f9]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-28 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="w-16 h-5 bg-slate-100 rounded-full animate-pulse" />
              <div className="flex-1 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="w-20 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="w-14 h-3 bg-slate-100 rounded animate-pulse" />
              <div className="w-14 h-5 bg-slate-100 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && transactions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-[#94a3b8]">
          <i className="ri-file-list-3-line text-4xl mb-2" />
          <p className="text-sm font-medium">No recent transactions</p>
        </div>
      )}

      {/* ── Table ── */}
      {!loading && transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Invoice No.</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Mode</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Party</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Date</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Amount</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Balance</th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">Status</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, idx) => {
                const sc = PAYMENT_STATUS_CONFIG[tx.paymentStatus] ?? { label: tx.paymentStatus, bg: 'bg-slate-100', text: 'text-slate-600' };
                const mc = PAYMENT_MODE_CONFIG[tx.paymentMode]   ?? { label: tx.paymentMode,   bg: 'bg-slate-100', text: 'text-slate-600', icon: 'ri-money-dollar-circle-line' };

                return (
                  <tr
                    key={tx.id}
                    // onClick={() => navigate(`/sales/invoices/${tx.id}`)}
                    className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f8fafc]/50'}`}
                  >
                    {/* Invoice No */}
                    <td className="px-5 py-3 font-semibold text-[#4f46e5] whitespace-nowrap">
                      {tx.invoiceNo}
                    </td>

                    {/* Payment Mode badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${mc.bg} ${mc.text}`}>
                        <i className={`${mc.icon} text-xs`} />
                        {mc.label}
                      </span>
                    </td>

                    {/* Party */}
                    <td className="px-4 py-3 text-[#1e293b] max-w-[130px] truncate whitespace-nowrap">
                      {tx.partyName}
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>

                    {/* Grand Total */}
                    <td className="px-4 py-3 text-right font-semibold text-[#1e293b] whitespace-nowrap">
                      {formatAmount(tx.grandTotal)}
                    </td>

                    {/* Balance Due */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {tx.balanceDue > 0 ? (
                        <span className="font-semibold text-red-600">{formatAmount(tx.balanceDue)}</span>
                      ) : (
                        <span className="text-[#94a3b8]">—</span>
                      )}
                    </td>

                    {/* Payment Status badge */}
                    <td className="px-5 py-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}