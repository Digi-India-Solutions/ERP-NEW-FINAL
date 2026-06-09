import { useState, useMemo, useEffect } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { formatINR } from '@/utils/format';
import {
  mockGLEntries,
  mockFinancialSummary,
} from '@/mocks/finance';

type TabKey = 'pnl' | 'balance' | 'gl' | 'trial';

function useTabState() {
  const [activeTab, setActiveTab] = useState<TabKey>('pnl');
  const [period, setPeriod] = useState('month');
  const [fromDate, setFromDate] = useState('2024-04-01');
  const [toDate, setToDate] = useState('2024-04-30');
  const [generated, setGenerated] = useState(true);

  const handleGenerate = () => setGenerated(true);

  return {
    activeTab, setActiveTab, period, setPeriod,
    fromDate, setFromDate, toDate, setToDate,
    generated, handleGenerate,
  };
}

/* ─── Export CSV helper ─── */
function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [
    headers.join(','),
    ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── P&L Data ─── */
const PNL_DATA = {
  period: 'April 2024',
  salesRevenue: 456800,
  returns: 0,
  netSales: 456800,
  openingStock: 250000,
  purchases: 285600,
  closingStock: 320000,
  cogs: 215600,
  grossProfit: 241200,
  grossMarginPct: 52.8,
  manufacturingCost: 45425,
  labourCost: 4500,
  overhead: 5925,
  qualityRejection: 2300,
  totalOperatingExpenses: 58150,
  operatingProfit: 183050,
  gstLiability: 30816,
  netProfit: 152234,
  netProfitMarginPct: 33.3,
};

/* ─── Balance Sheet Data ─── */
const BS_DATA = {
  asOn: '30 April 2024',
  cashBank: 380000,
  accountsReceivable: 120000,
  rawMaterialStock: 250000,
  wipStock: 45000,
  finishedGoodsStock: 180000,
  totalCurrentAssets: 975000,
  plantMachinery: 500000,
  depreciation: 50000,
  netFixedAssets: 450000,
  totalAssets: 1425000,
  accountsPayable: 250000,
  gstPayable: 30816,
  totalLiabilities: 280816,
  openingCapital: 500000,
  netProfit: 152234,
  drawings: 0,
  totalEquity: 652234,
  totalLiabEquity: 933050,
};

/* ─── Tab Button ─── */
function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-[#1e293b] text-white'
          : 'bg-white text-[#64748b] hover:text-[#1e293b] border border-[#e2e8f0]'
      }`}
    >
      {label}
    </button>
  );
}

/* ─── P&L Row ─── */
function PNLRow({
  label,
  value,
  bold = false,
  indent = false,
  highlight = false,
}: {
  label: string;
  value: number;
  bold?: boolean;
  indent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-2 ${
        bold ? 'border-t border-[#e2e8f0] font-semibold' : ''
      } ${indent ? 'pl-6' : ''} ${highlight ? 'bg-emerald-50/50' : ''}`}
    >
      <span className={bold ? 'text-[#1e293b]' : 'text-[#475569]'}>{label}</span>
      <span className={bold ? 'text-[#1e293b]' : 'text-[#64748b]'}>{formatINR(value)}</span>
    </div>
  );
}

/* ─── P&L Section ─── */
function PnLTab({ onExport }: { onExport: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">
            Profit &amp; Loss Statement
          </h3>
          <p className="text-sm text-[#64748b]">Period: {PNL_DATA.period}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-printer-line text-[#64748b]" />
            <span className="text-xs font-medium">Print</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-download-line text-[#64748b]" />
            <span className="text-xs font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
        <div className="mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Income
          </span>
        </div>
        <PNLRow label="Sales Revenue" value={PNL_DATA.salesRevenue} indent />
        <PNLRow label="Less: Returns" value={PNL_DATA.returns} indent />
        <PNLRow label="Net Sales" value={PNL_DATA.netSales} bold highlight />

        <div className="my-3 border-t border-dashed border-[#e2e8f0]" />

        <div className="mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Cost of Goods Sold
          </span>
        </div>
        <PNLRow label="Opening Stock" value={PNL_DATA.openingStock} indent />
        <PNLRow label="Add: Purchases" value={PNL_DATA.purchases} indent />
        <PNLRow label="Less: Closing Stock" value={PNL_DATA.closingStock} indent />
        <PNLRow label="COGS" value={PNL_DATA.cogs} bold />
        <div className="flex justify-between py-2 pl-6">
          <span className="text-sm text-[#475569]">Gross Profit Margin</span>
          <span className="text-sm font-semibold text-emerald-600">
            {PNL_DATA.grossMarginPct}%
          </span>
        </div>
        <PNLRow label="Gross Profit" value={PNL_DATA.grossProfit} bold highlight />

        <div className="my-3 border-t border-dashed border-[#e2e8f0]" />

        <div className="mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Operating Expenses
          </span>
        </div>
        <PNLRow label="Manufacturing Cost" value={PNL_DATA.manufacturingCost} indent />
        <PNLRow label="Labour Cost" value={PNL_DATA.labourCost} indent />
        <PNLRow label="Overhead" value={PNL_DATA.overhead} indent />
        <PNLRow label="Quality / Rejection" value={PNL_DATA.qualityRejection} indent />
        <PNLRow label="Total Expenses" value={PNL_DATA.totalOperatingExpenses} bold />

        <div className="my-3 border-t border-dashed border-[#e2e8f0]" />

        <PNLRow label="Operating Profit" value={PNL_DATA.operatingProfit} bold highlight />
        <PNLRow label="GST Liability (Net)" value={PNL_DATA.gstLiability} />

        <div className="my-3 border-t border-[#1e293b]" />

        <div className="flex justify-between py-3 bg-emerald-50/70 rounded-lg px-4 -mx-4">
          <span className="text-base font-bold text-[#1e293b]">Net Profit</span>
          <span className="text-base font-bold text-emerald-700">
            {formatINR(PNL_DATA.netProfit)}
          </span>
        </div>
        <div className="flex justify-between py-2 px-4 -mx-4">
          <span className="text-sm text-[#475569]">Net Profit Margin</span>
          <span className="text-sm font-semibold text-emerald-600">
            {PNL_DATA.netProfitMarginPct}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─── Balance Sheet Section ─── */
function BalanceSheetTab({ onExport }: { onExport: () => void }) {
  const balanced = BS_DATA.totalAssets === BS_DATA.totalLiabEquity;
  const diff = BS_DATA.totalAssets - BS_DATA.totalLiabEquity;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">Balance Sheet</h3>
          <p className="text-sm text-[#64748b]">As on: {BS_DATA.asOn}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              balanced
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <i className={balanced ? 'ri-check-line' : 'ri-close-line'} />
            {balanced ? 'Balanced' : `Not Balanced (Diff: ${formatINR(Math.abs(diff))})`}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-printer-line text-[#64748b]" />
            <span className="text-xs font-medium">Print</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-download-line text-[#64748b]" />
            <span className="text-xs font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ASSETS */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <h4 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
            <i className="ri-bank-line text-amber-500" />
            Assets
          </h4>

          <div className="mb-2">
            <span className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Current Assets
            </span>
          </div>
          <BSRow label="Cash &amp; Bank" value={BS_DATA.cashBank} />
          <BSRow label="Accounts Receivable" value={BS_DATA.accountsReceivable} />
          <BSRow label="Raw Material Stock" value={BS_DATA.rawMaterialStock} />
          <BSRow label="WIP Stock" value={BS_DATA.wipStock} />
          <BSRow label="Finished Goods Stock" value={BS_DATA.finishedGoodsStock} />
          <div className="flex justify-between py-2 border-t border-[#e2e8f0] mt-1 mb-3">
            <span className="text-sm font-semibold text-[#1e293b]">
              Total Current Assets
            </span>
            <span className="text-sm font-semibold text-[#1e293b]">
              {formatINR(BS_DATA.totalCurrentAssets)}
            </span>
          </div>

          <div className="mb-2">
            <span className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Fixed Assets
            </span>
          </div>
          <BSRow label="Plant &amp; Machinery" value={BS_DATA.plantMachinery} />
          <BSRow label="Less: Depreciation" value={-BS_DATA.depreciation} negative />
          <div className="flex justify-between py-2 border-t border-[#e2e8f0] mt-1 mb-3">
            <span className="text-sm font-semibold text-[#1e293b]">
              Net Fixed Assets
            </span>
            <span className="text-sm font-semibold text-[#1e293b]">
              {formatINR(BS_DATA.netFixedAssets)}
            </span>
          </div>

          <div className="flex justify-between py-3 border-t-2 border-[#1e293b] mt-2 bg-amber-50/50 px-3 -mx-3 rounded-lg">
            <span className="text-base font-bold text-[#1e293b]">Total Assets</span>
            <span className="text-base font-bold text-amber-700">
              {formatINR(BS_DATA.totalAssets)}
            </span>
          </div>
        </div>

        {/* LIABILITIES + EQUITY */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
          <h4 className="text-sm font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
            <i className="ri-scales-3-line text-rose-500" />
            Liabilities + Equity
          </h4>

          <div className="mb-2">
            <span className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Current Liabilities
            </span>
          </div>
          <BSRow label="Accounts Payable" value={BS_DATA.accountsPayable} />
          <BSRow label="GST Payable" value={BS_DATA.gstPayable} />
          <div className="flex justify-between py-2 border-t border-[#e2e8f0] mt-1 mb-3">
            <span className="text-sm font-semibold text-[#1e293b]">
              Total Liabilities
            </span>
            <span className="text-sm font-semibold text-[#1e293b]">
              {formatINR(BS_DATA.totalLiabilities)}
            </span>
          </div>

          <div className="mb-2">
            <span className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
              Equity
            </span>
          </div>
          <BSRow label="Opening Capital" value={BS_DATA.openingCapital} />
          <BSRow label="Add: Net Profit" value={BS_DATA.netProfit} />
          <BSRow label="Less: Drawings" value={-BS_DATA.drawings} negative />
          <div className="flex justify-between py-2 border-t border-[#e2e8f0] mt-1 mb-3">
            <span className="text-sm font-semibold text-[#1e293b]">
              Total Equity
            </span>
            <span className="text-sm font-semibold text-[#1e293b]">
              {formatINR(BS_DATA.totalEquity)}
            </span>
          </div>

          <div className="flex justify-between py-3 border-t-2 border-[#1e293b] mt-2 bg-rose-50/50 px-3 -mx-3 rounded-lg">
            <span className="text-base font-bold text-[#1e293b]">
              Total Liab + Equity
            </span>
            <span className="text-base font-bold text-rose-700">
              {formatINR(BS_DATA.totalLiabEquity)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BSRow({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-[#475569] pl-4">{label}</span>
      <span className={`text-sm ${negative ? 'text-red-500' : 'text-[#64748b]'}`}>
        {negative && value < 0 ? formatINR(Math.abs(value)) : formatINR(value)}
      </span>
    </div>
  );
}

/* ─── Type Badge Colors ─── */
const TYPE_COLORS: Record<string, string> = {
  OPENING: 'bg-gray-100 text-gray-700',
  SALES: 'bg-emerald-100 text-emerald-700',
  PURCHASE: 'bg-blue-100 text-blue-700',
  RECEIPT: 'bg-indigo-100 text-indigo-700',
  PAYMENT: 'bg-amber-100 text-amber-700',
  JOURNAL: 'bg-purple-100 text-purple-700',
};

/* ─── General Ledger Section ─── */
function GLTab({
  onExport,
  pageFromDate,
  pageToDate,
}: {
  onExport: () => void;
  pageFromDate: string;
  pageToDate: string;
}) {
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [glFromDate, setGlFromDate] = useState(pageFromDate);
  const [glToDate, setGlToDate] = useState(pageToDate);

  useEffect(() => {
    setGlFromDate(pageFromDate);
    setGlToDate(pageToDate);
  }, [pageFromDate, pageToDate]);

  const allAccounts = useMemo(() => {
    const set = new Set<string>();
    mockGLEntries.forEach((e) => {
      set.add(e.debitAccount);
      set.add(e.creditAccount);
    });
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    let result = [...mockGLEntries];

    if (filterAccount !== 'ALL') {
      result = result.filter(
        (e) => e.debitAccount === filterAccount || e.creditAccount === filterAccount
      );
    }

    if (filterType !== 'ALL') {
      result = result.filter((e) => e.type === filterType);
    }

    if (glFromDate) {
      result = result.filter((e) => e.date >= glFromDate);
    }

    if (glToDate) {
      result = result.filter((e) => e.date <= glToDate);
    }

    return result;
  }, [filterAccount, filterType, glFromDate, glToDate]);

  let runningBalance = 0;
  const totalDebits = filtered.reduce((s, e) => s + e.amount, 0);
  const totalCredits = totalDebits;

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">General Ledger</h3>
          <p className="text-sm text-[#64748b]">
            {filtered.length} entries
            {filterAccount !== 'ALL' ? ` for ${filterAccount}` : ''}
            {filterType !== 'ALL' ? ` (${filterType})` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] cursor-pointer"
          >
            <option value="ALL">All Accounts</option>
            {allAccounts.map((acct) => (
              <option key={acct} value={acct}>
                {acct}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={glFromDate}
            onChange={(e) => setGlFromDate(e.target.value)}
            className="h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b]"
          />
          <input
            type="date"
            value={glToDate}
            onChange={(e) => setGlToDate(e.target.value)}
            className="h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b]"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] cursor-pointer"
          >
            <option value="ALL">All Types</option>
            <option value="OPENING">Opening</option>
            <option value="SALES">Sales</option>
            <option value="PURCHASE">Purchase</option>
            <option value="RECEIPT">Receipt</option>
            <option value="PAYMENT">Payment</option>
            <option value="JOURNAL">Journal</option>
          </select>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-printer-line text-[#64748b]" />
            <span className="text-xs font-medium">Print</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-download-line text-[#64748b]" />
            <span className="text-xs font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-[#e2e8f0]">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Date
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Entry #
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Description
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Debit Account
              </th>
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Credit Account
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Amount
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                GST
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => {
              if (filterAccount !== 'ALL') {
                if (entry.debitAccount === filterAccount) {
                  runningBalance += entry.amount;
                } else if (entry.creditAccount === filterAccount) {
                  runningBalance -= entry.amount;
                }
              } else {
                runningBalance += entry.amount;
              }

              return (
                <tr
                  key={entry.id}
                  className="border-b border-[#f1f5f9] hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-2.5 text-[#475569]">
                    {new Date(entry.date).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-2.5 text-[#1e293b] font-medium">
                    {entry.entryNumber}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        TYPE_COLORS[entry.type] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {entry.type}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#475569] max-w-[200px] truncate">
                    {entry.description}
                  </td>
                  <td className="px-4 py-2.5 text-[#475569]">
                    {entry.debitAccount}
                  </td>
                  <td className="px-4 py-2.5 text-[#475569]">
                    {entry.creditAccount}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#1e293b] font-medium">
                    {formatINR(entry.amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#64748b]">
                    {entry.gstAmount > 0 ? formatINR(entry.gstAmount) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#475569] font-medium">
                    {formatINR(runningBalance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-[#e2e8f0]">
              <td colSpan={6} className="px-4 py-2.5 text-sm font-semibold text-[#1e293b]">
                Total
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-[#1e293b]">
                {formatINR(totalDebits)}
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-[#1e293b]">
                {formatINR(filtered.reduce((s, e) => s + e.gstAmount, 0))}
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-semibold text-[#1e293b]">
                {formatINR(runningBalance)}
              </td>
            </tr>
            <tr className="bg-white border-t border-dashed border-[#e2e8f0]">
              <td colSpan={6} className="px-4 py-2 text-sm text-[#64748b]">
                <span className="font-medium text-[#1e293b]">Total Debits:</span>{' '}
                {formatINR(totalDebits)}
                <span className="mx-3 text-[#cbd5e1]">|</span>
                <span className="font-medium text-[#1e293b]">Total Credits:</span>{' '}
                {formatINR(totalCredits)}
                <span className="mx-3 text-[#cbd5e1]">|</span>
                <span className="font-medium text-[#1e293b]">Difference:</span>{' '}
                <span className="text-emerald-600 font-medium">₹0 (should balance)</span>
              </td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ─── Trial Balance Section ─── */
function TrialBalanceTab({ onExport }: { onExport: () => void }) {
  const accounts = useMemo(() => {
    const map = new Map<string, { name: string; debit: number; credit: number }>();

    mockGLEntries.forEach((entry) => {
      const debit = map.get(entry.debitAccount) || {
        name: entry.debitAccount,
        debit: 0,
        credit: 0,
      };
      debit.debit += entry.amount;
      map.set(entry.debitAccount, debit);

      const credit = map.get(entry.creditAccount) || {
        name: entry.creditAccount,
        debit: 0,
        credit: 0,
      };
      credit.credit += entry.amount;
      map.set(entry.creditAccount, credit);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const totalDebit = accounts.reduce((s, a) => s + a.debit, 0);
  const totalCredit = accounts.reduce((s, a) => s + a.credit, 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#1e293b]">Trial Balance</h3>
          <p className="text-sm text-[#64748b]">
            {accounts.length} accounts as of 30 Apr 2024
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              balanced
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            <i className={balanced ? 'ri-check-line' : 'ri-close-line'} />
            {balanced ? '✅ Trial Balance agrees' : 'Mismatch'}
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-printer-line text-[#64748b]" />
            <span className="text-xs font-medium">Print</span>
          </button>
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-download-line text-[#64748b]" />
            <span className="text-xs font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-[#e2e8f0]">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Account Name
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Debit (₹)
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Credit (₹)
              </th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-[#64748b] uppercase tracking-wider">
                Net
              </th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acct) => {
              const net = acct.debit - acct.credit;
              return (
                <tr
                  key={acct.name}
                  className="border-b border-[#f1f5f9] hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-2.5 text-[#1e293b] font-medium">
                    {acct.name}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#475569]">
                    {acct.debit > 0 ? formatINR(acct.debit) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#475569]">
                    {acct.credit > 0 ? formatINR(acct.credit) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <span
                      className={`text-sm font-medium ${
                        net > 0
                          ? 'text-emerald-600'
                          : net < 0
                          ? 'text-red-500'
                          : 'text-[#64748b]'
                      }`}
                    >
                      {net !== 0 ? formatINR(Math.abs(net)) : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 border-t border-[#e2e8f0]">
              <td className="px-4 py-2.5 text-sm font-bold text-[#1e293b]">
                Total
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-bold text-[#1e293b]">
                {formatINR(totalDebit)}
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-bold text-[#1e293b]">
                {formatINR(totalCredit)}
              </td>
              <td className="px-4 py-2.5 text-right text-sm font-bold text-[#1e293b]">
                {formatINR(Math.abs(totalDebit - totalCredit))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function FinanceReportsPage() {
  const {
    activeTab,
    setActiveTab,
    period,
    setPeriod,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    generated,
    handleGenerate,
  } = useTabState();

  const handleExport = () => {
    const date = new Date().toISOString().split('T')[0];
    if (activeTab === 'pnl') {
      downloadCSV(
        `pnl-report-${date}.csv`,
        ['Item', 'Amount'],
        [
          ['Sales Revenue', PNL_DATA.salesRevenue],
          ['Less: Returns', PNL_DATA.returns],
          ['Net Sales', PNL_DATA.netSales],
          ['Opening Stock', PNL_DATA.openingStock],
          ['Add: Purchases', PNL_DATA.purchases],
          ['Less: Closing Stock', PNL_DATA.closingStock],
          ['COGS', PNL_DATA.cogs],
          ['Gross Profit', PNL_DATA.grossProfit],
          ['Manufacturing Cost', PNL_DATA.manufacturingCost],
          ['Labour Cost', PNL_DATA.labourCost],
          ['Overhead', PNL_DATA.overhead],
          ['Quality / Rejection', PNL_DATA.qualityRejection],
          ['Total Operating Expenses', PNL_DATA.totalOperatingExpenses],
          ['Operating Profit', PNL_DATA.operatingProfit],
          ['GST Liability (Net)', PNL_DATA.gstLiability],
          ['Net Profit', PNL_DATA.netProfit],
        ]
      );
    } else if (activeTab === 'balance') {
      downloadCSV(
        `balance-sheet-${date}.csv`,
        ['Section', 'Item', 'Amount'],
        [
          ['Assets', 'Cash & Bank', BS_DATA.cashBank],
          ['Assets', 'Accounts Receivable', BS_DATA.accountsReceivable],
          ['Assets', 'Raw Material Stock', BS_DATA.rawMaterialStock],
          ['Assets', 'WIP Stock', BS_DATA.wipStock],
          ['Assets', 'Finished Goods Stock', BS_DATA.finishedGoodsStock],
          ['Assets', 'Total Current Assets', BS_DATA.totalCurrentAssets],
          ['Assets', 'Plant & Machinery', BS_DATA.plantMachinery],
          ['Assets', 'Less: Depreciation', -BS_DATA.depreciation],
          ['Assets', 'Net Fixed Assets', BS_DATA.netFixedAssets],
          ['Assets', 'Total Assets', BS_DATA.totalAssets],
          ['Liabilities', 'Accounts Payable', BS_DATA.accountsPayable],
          ['Liabilities', 'GST Payable', BS_DATA.gstPayable],
          ['Liabilities', 'Total Liabilities', BS_DATA.totalLiabilities],
          ['Equity', 'Opening Capital', BS_DATA.openingCapital],
          ['Equity', 'Add: Net Profit', BS_DATA.netProfit],
          ['Equity', 'Less: Drawings', -BS_DATA.drawings],
          ['Equity', 'Total Equity', BS_DATA.totalEquity],
          ['Equity', 'Total Liab + Equity', BS_DATA.totalLiabEquity],
        ]
      );
    } else if (activeTab === 'gl') {
      downloadCSV(
        `general-ledger-${date}.csv`,
        ['Date', 'Entry #', 'Type', 'Description', 'Debit Account', 'Credit Account', 'Amount', 'GST'],
        mockGLEntries.map((e) => [
          e.date,
          e.entryNumber,
          e.type,
          e.description,
          e.debitAccount,
          e.creditAccount,
          e.amount,
          e.gstAmount,
        ])
      );
    } else if (activeTab === 'trial') {
      const map = new Map<string, { debit: number; credit: number }>();
      mockGLEntries.forEach((e) => {
        const d = map.get(e.debitAccount) || { debit: 0, credit: 0 };
        d.debit += e.amount;
        map.set(e.debitAccount, d);
        const c = map.get(e.creditAccount) || { debit: 0, credit: 0 };
        c.credit += e.amount;
        map.set(e.creditAccount, c);
      });
      const rows = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
      downloadCSV(
        `trial-balance-${date}.csv`,
        ['Account', 'Debit', 'Credit', 'Net'],
        rows.map(([name, vals]) => [name, vals.debit, vals.credit, vals.debit - vals.credit])
      );
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Financial Reports</h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Profit &amp; Loss, Balance Sheet, General Ledger &amp; Trial Balance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] cursor-pointer"
            >
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="year">Year</option>
            </select>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b]"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b]"
            />
            <button
              onClick={handleGenerate}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#1e293b] text-white text-sm font-medium hover:bg-[#334155] transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line" />
              <span>Generate</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-download-line text-[#64748b]" />
              <span className="text-xs font-medium">Export</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        {generated && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Total Sales</p>
              <p className="text-lg font-bold text-[#1e293b]">{formatINR(mockFinancialSummary.totalSales)}</p>
              <p className="text-xs text-emerald-600 mt-1">{mockFinancialSummary.period}</p>
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Net Profit</p>
              <p className="text-lg font-bold text-[#1e293b]">{formatINR(mockFinancialSummary.netProfit)}</p>
              <p className="text-xs text-emerald-600 mt-1">{PNL_DATA.netProfitMarginPct}% margin</p>
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Total Assets</p>
              <p className="text-lg font-bold text-[#1e293b]">{formatINR(mockFinancialSummary.totalAssets)}</p>
              <p className="text-xs text-[#64748b] mt-1">As on {BS_DATA.asOn}</p>
            </div>
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">GST Net</p>
              <p className="text-lg font-bold text-[#1e293b]">{formatINR(mockFinancialSummary.netGST)}</p>
              <p className="text-xs text-amber-600 mt-1">Collected - Paid</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] pb-3">
          <TabButton
            label="P&L"
            active={activeTab === 'pnl'}
            onClick={() => setActiveTab('pnl')}
          />
          <TabButton
            label="Balance Sheet"
            active={activeTab === 'balance'}
            onClick={() => setActiveTab('balance')}
          />
          <TabButton
            label="General Ledger"
            active={activeTab === 'gl'}
            onClick={() => setActiveTab('gl')}
          />
          <TabButton
            label="Trial Balance"
            active={activeTab === 'trial'}
            onClick={() => setActiveTab('trial')}
          />
        </div>

        {/* Tab Content */}
        {generated && (
          <div className="min-h-[400px]">
            {activeTab === 'pnl' && <PnLTab onExport={handleExport} />}
            {activeTab === 'balance' && <BalanceSheetTab onExport={handleExport} />}
            {activeTab === 'gl' && (
              <GLTab
                onExport={handleExport}
                pageFromDate={fromDate}
                pageToDate={toDate}
              />
            )}
            {activeTab === 'trial' && <TrialBalanceTab onExport={handleExport} />}
          </div>
        )}

        {!generated && (
          <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
            <i className="ri-file-chart-line text-5xl mb-3" />
            <p className="text-sm">Select a period and click Generate to view reports</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}