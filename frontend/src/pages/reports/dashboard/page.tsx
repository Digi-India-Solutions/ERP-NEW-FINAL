import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { formatINR } from '@/utils/format';
import { mockFinancialSummary } from '@/mocks/finance';
import { mockProductionOrders, mockMachines, mockMRPResults } from '@/mocks/masters';
import { mockInspections, mockNCRs } from '@/mocks/qms';
import { mockSalesInvoices, mockPurchaseInvoices } from '@/mocks/billing';
import { mockProductionCosts } from '@/mocks/costing';
import ExecKPICard from './components/ExecKPICard';
import RevenueTrendChart from './components/RevenueTrendChart';
import ProductionStatusDonut from './components/ProductionStatusDonutCard';
import TopProductsTable from './components/TopProductsTable';
import QualityScorecard from './components/QualityScoredcard';
import InventoryHealthCard from './components/InventoryHealthCard';
import CashFlowCard from './components/CashFlowCard';
import AlertsPanel from './components/AlertsPanel';

type PeriodKey = 'this_month' | 'last_month' | 'this_quarter' | 'custom';

/* ─── Quick Actions ─── */
const QUICK_ACTIONS = [
  { label: '+ Sales Invoice', path: '/sales/invoices/new', icon: 'ri-file-add-line', color: 'bg-emerald-600 text-white hover:bg-emerald-700' },
  { label: '+ Purchase Order', path: '/purchase/orders/new', icon: 'ri-shopping-bag-line', color: 'bg-amber-500 text-white hover:bg-amber-600' },
  { label: '+ Production Order', path: '/manufacturing/orders/new', icon: 'ri-settings-line', color: 'bg-[#1e293b] text-white hover:bg-[#334155]' },
  { label: 'Run MRP', path: '/manufacturing/mrp', icon: 'ri-calculator-line', color: 'bg-white border border-[#e2e8f0] text-[#1e293b] hover:bg-slate-50' },
  { label: 'Log Production', path: '/manufacturing/shop-floor', icon: 'ri-time-line', color: 'bg-white border border-[#e2e8f0] text-[#1e293b] hover:bg-slate-50' },
  { label: 'Start Inspection', path: '/manufacturing/qc/incoming', icon: 'ri-search-eye-line', color: 'bg-white border border-[#e2e8f0] text-[#1e293b] hover:bg-slate-50' },
];

/* ─── KPI Computations ─── */
function buildBusinessKPIs() {
  const totalRevenue = mockSalesInvoices
    .filter((i) => i.status === 'SAVED')
    .reduce((s, i) => s + i.grandTotal, 0);

  const totalPurchases = mockPurchaseInvoices
    .filter((i) => i.status === 'SAVED')
    .reduce((s, i) => s + i.grandTotal, 0);

  const expenses = mockProductionCosts.reduce((s, c) => s + c.labourCost + c.overheadCost, 0);
  const netProfit = totalRevenue - totalPurchases - expenses;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  return { totalRevenue, totalPurchases, netProfit, profitMargin };
}

function buildMfgKPIs() {
  const total = mockProductionOrders.length;
  const completed = mockProductionOrders.filter((o) => o.status === 'COMPLETED').length;
  const efficiency = total > 0 ? Math.round((completed / total) * 100) : 0;

  // OEE average (simplified — using last known OEE per machine from running data)
  const avgOEE = 74;

  // Quality pass rate
  const completedInspections = mockInspections.filter((i) => i.status === 'PASSED' || i.status === 'FAILED');
  const passed = completedInspections.filter((i) => i.status === 'PASSED').length;
  const qualityRate = completedInspections.length > 0 ? Math.round((passed / completedInspections.length) * 100) : 100;

  // Open NCRs
  const openNCRs = mockNCRs.filter((n) => n.status !== 'CLOSED').length;

  // Critical MRP shortages
  const criticalShortages = mockMRPResults.filter((r) => r.status === 'CRITICAL').length;

  return { efficiency, avgOEE, qualityRate, openNCRs, criticalShortages };
}

export default function ExecutiveDashboardPage() {
  const navigate = useNavigate();
  const [activePeriod, setActivePeriod] = useState<PeriodKey>('this_month');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { totalRevenue, totalPurchases, netProfit, profitMargin } = buildBusinessKPIs();
  const { efficiency, avgOEE, qualityRate, openNCRs } = buildMfgKPIs();

  const effColor = efficiency >= 80 ? 'text-emerald-600' : efficiency >= 60 ? 'text-amber-600' : 'text-red-600';
  const oeeColor = avgOEE >= 85 ? 'text-emerald-600' : avgOEE >= 60 ? 'text-amber-600' : 'text-red-600';

  const PERIOD_LABELS: Record<PeriodKey, string> = {
    this_month: 'This Month',
    last_month: 'Last Month',
    this_quarter: 'This Quarter',
    custom: 'Custom',
  };

  const handleRefresh = () => setLastUpdated(new Date());

  const businessKPIs = [
    {
      label: 'Total Revenue',
      value: formatINR(totalRevenue),
      subtitle: '+12.4% vs last period',
      icon: 'ri-money-rupee-circle-line',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: 'up' as const,
    },
    {
      label: 'Total Purchases',
      value: formatINR(totalPurchases),
      subtitle: '+8.1% vs last period',
      icon: 'ri-store-2-line',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      trend: 'up' as const,
    },
    {
      label: 'Net Profit',
      value: formatINR(Math.max(0, netProfit)),
      subtitle: `${profitMargin}% profit margin`,
      icon: 'ri-line-chart-line',
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-600',
      trend: 'up' as const,
    },
    {
      label: 'GST Payable',
      value: formatINR(mockFinancialSummary.netGST),
      subtitle: 'Due by 20th next month',
      icon: 'ri-government-line',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      trend: 'neutral' as const,
      badge: { text: 'Due soon', color: 'bg-rose-50 text-rose-600 border border-rose-200' },
    },
  ];

  const mfgKPIs = [
    {
      label: 'Production Efficiency',
      value: `${efficiency}%`,
      subtitle: `${efficiency >= 80 ? 'Target met' : efficiency >= 60 ? 'Below target' : 'Critical — action needed'}`,
      icon: 'ri-settings-3-line',
      iconBg: efficiency >= 80 ? 'bg-emerald-50' : efficiency >= 60 ? 'bg-amber-50' : 'bg-red-50',
      iconColor: efficiency >= 80 ? 'text-emerald-600' : efficiency >= 60 ? 'text-amber-600' : 'text-red-600',
      trend: efficiency >= 80 ? 'up' as const : 'down' as const,
    },
    {
      label: 'OEE Average',
      value: `${avgOEE}%`,
      subtitle: 'Target 85%+',
      icon: 'ri-speed-line',
      iconBg: avgOEE >= 85 ? 'bg-emerald-50' : 'bg-amber-50',
      iconColor: avgOEE >= 85 ? 'text-emerald-600' : 'text-amber-600',
      trend: avgOEE >= 85 ? 'up' as const : 'down' as const,
    },
    {
      label: 'Quality Pass Rate',
      value: `${qualityRate}%`,
      subtitle: `Target 95%+`,
      icon: 'ri-verified-badge-line',
      iconBg: qualityRate >= 95 ? 'bg-emerald-50' : 'bg-amber-50',
      iconColor: qualityRate >= 95 ? 'text-emerald-600' : 'text-amber-600',
      trend: qualityRate >= 95 ? 'up' as const : 'down' as const,
    },
    {
      label: 'Open NCRs',
      value: String(openNCRs),
      subtitle: openNCRs === 0 ? 'All resolved' : 'Requires attention',
      icon: 'ri-error-warning-line',
      iconBg: openNCRs === 0 ? 'bg-emerald-50' : 'bg-red-50',
      iconColor: openNCRs === 0 ? 'text-emerald-600' : 'text-red-600',
      trend: openNCRs === 0 ? 'up' as const : 'down' as const,
      badge: openNCRs > 0 ? { text: `${openNCRs} open`, color: 'bg-red-50 text-red-600 border border-red-200' } : undefined,
    },
  ];

  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Executive Dashboard</h2>
            <p className="text-sm text-[#64748b] mt-0.5">Complete business overview — all modules</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((p) => (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                className={`h-8 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  activePeriod === p
                    ? 'bg-[#1e293b] text-white'
                    : 'bg-white border border-[#e2e8f0] text-[#64748b] hover:text-[#1e293b]'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
            <div className="flex items-center gap-1 text-xs text-[#94a3b8] px-2">
              <i className="ri-time-line" />
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line text-[#64748b]" />
              <span className="text-xs font-medium">Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Section 1: Business KPIs ── */}
        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Business KPIs</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {businessKPIs.map((kpi) => (
              <ExecKPICard key={kpi.label} {...kpi} />
            ))}
          </div>
        </section>

        {/* ── Section 2: Manufacturing KPIs ── */}
        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Manufacturing KPIs</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {mfgKPIs.map((kpi) => (
              <ExecKPICard key={kpi.label} {...kpi} />
            ))}
          </div>
        </section>

        {/* ── Section 3: Revenue Trend Chart ── */}
        <RevenueTrendChart />

        {/* ── Section 4: Manufacturing Overview ── */}
        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Manufacturing Overview</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ProductionStatusDonut />
            <TopProductsTable />
          </div>
        </section>

        {/* ── Section 5: Quality + Inventory ── */}
        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Quality &amp; Inventory</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <QualityScorecard />
            <InventoryHealthCard />
          </div>
        </section>

        {/* ── Section 6+7: Cash Flow + Alerts ── */}
        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Cash Flow &amp; Alerts</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CashFlowCard />
            <AlertsPanel />
          </div>
        </section>

        {/* ── Section 8: Quick Actions ── */}
        <section>
          <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => navigate(a.path)}
                className={`flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${a.color}`}
              >
                <i className={a.icon} />
                {a.label}
              </button>
            ))}
          </div>
        </section>

      </div>
    </AppLayout>
  );
}