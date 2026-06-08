import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import KPICard from './components/KPICard';
import SalesChart from './components/SalesChart';
import TopItemsChart from './components/TopItemsChart';
import RecentTransactions from './components/RecentTransactions';
import LowStockAlert from './components/LowStockAlert';
import QuickActions from './components/QuickActions';
import { mockGatePasses } from '@/mocks/gatepass';
import { useAuthStore } from '@/stores/authStore';
import { getData } from '../../services/FetchNodeServices.js';
import { useWarehouseStore } from '@/stores/warehouseStore.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatCrLakh(val: number): string {
  if (val >= 10_000_000) return `₹${(val / 10_000_000).toFixed(1)}Cr`;
  if (val >= 100_000) return `₹${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000) return `₹${(val / 1_000).toFixed(1)}K`;
  return `₹${val.toFixed(0)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface KPI {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: string;
  color: string;
}

interface RecentTransaction {
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

interface TopItem {
  id: string;
  name: string;
  code: string;
  category: string;
  totalQtySold: number;
  totalRevenue: number;
}

interface SummaryData {
  sales: { total: number; change: string; trend: 'up' | 'down' };
  purchases: { total: number; change: string; trend: 'up' | 'down' };
  receivables: { total: number; invoiceCount: number };
  payables: { total: number };
  lowStock: { count: number };
  challans: { pending: number };
  recentTransactions: RecentTransaction[];
  topItems: TopItem[];
}

interface DashboardState {
  kpis: KPI[];
  recentTransactions: RecentTransaction[];
  topItems: TopItem[];
  loading: boolean;
  error: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI builder — uses the single /dashboard/summary endpoint
// ─────────────────────────────────────────────────────────────────────────────

function buildKPIs(d: SummaryData): KPI[] {
  return [
    {
      id: 'sales',
      label: 'Sales This Month',
      value: formatCrLakh(d.sales.total),
      change: d.sales.change,
      trend: d.sales.trend,
      icon: 'ri-shopping-cart-2-line',
      color: 'green',
    },
    {
      id: 'purchase',
      label: 'Purchases This Month',
      value: formatCrLakh(d.purchases.total),
      change: d.purchases.change,
      trend: d.purchases.trend,
      icon: 'ri-store-2-line',
      color: 'indigo',
    },
    {
      id: 'receivables',
      label: 'Outstanding Receivables',
      value: formatCrLakh(d.receivables.total),
      change: `${d.receivables.invoiceCount} unpaid invoice${d.receivables.invoiceCount !== 1 ? 's' : ''}`,
      trend: 'down',
      icon: 'ri-money-rupee-circle-line',
      color: 'amber',
    },
    {
      id: 'payables',
      label: 'Outstanding Payables',
      value: formatCrLakh(d.payables.total),
      change: 'Due to suppliers',
      trend: 'down',
      icon: 'ri-bill-line',
      color: 'red',
    },
    {
      id: 'lowstock',
      label: 'Low Stock Alerts',
      value: String(d.lowStock.count),
      change: d.lowStock.count > 0 ? 'Needs reorder' : 'All stocked up',
      trend: d.lowStock.count > 0 ? 'down' : 'up',
      icon: 'ri-alert-line',
      color: 'red',
    },
    {
      id: 'challans',
      label: 'Pending Challans',
      value: String(d.challans.pending),
      change: d.challans.pending > 0 ? 'Action needed' : 'None pending',
      trend: d.challans.pending > 0 ? 'up' : 'up',
      icon: 'ri-truck-line',
      color: 'amber',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// KPI nav map
// ─────────────────────────────────────────────────────────────────────────────

const KPI_ROUTES: Record<string, string> = {
  sales: '/sales/invoices',
  purchase: '/purchase/invoices',
  receivables: '/sales/invoices',
  payables: '/purchase/invoices',
  lowstock: '/reports/low-stock',
  challans: '/sales/challans',
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
const { selectedWarehouseId, selectedWarehouseName, setSelectedWarehouse } = useWarehouseStore();
  const [dashData, setDashData] = useState<DashboardState>({
    kpis: [],
    recentTransactions: [],
    topItems: [],
    loading: true,
    error: null,
  });

  // ── Fetch all dashboard data from the single summary endpoint ──
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await getData(`api/v1/dashboard/summary?warehouseId=${selectedWarehouseId}`);
        console.log("SXXXXXXXX=>SUMMARY", res.data)
        if (!res?.success || !res?.data) {
          throw new Error(res?.message ?? 'Failed to load dashboard data.');
        }

        const summary: SummaryData = res.data;

        if (!cancelled) {
          setDashData({
            kpis: buildKPIs(summary),
            recentTransactions: summary.recentTransactions ?? [],
            topItems: summary.topItems ?? [],
            loading: false,
            error: null,
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setDashData({
            kpis: [],
            recentTransactions: [],
            topItems: [],
            loading: false,
            error: err?.message ?? 'Failed to load dashboard data.',
          });
        }
      }
    })();

    return () => { cancelled = true; };
  }, [selectedWarehouseId]);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const currentUserId = user?.id ?? '';

  const overdueGPs = mockGatePasses.filter(
    (gp) => gp.type === 'OUTWARD' && gp.status === 'OVERDUE',
  );

  const myRejectedGPs = mockGatePasses.filter(
    (gp) =>
      gp.verificationStatus === 'REJECTED' &&
      gp.createdById === currentUserId &&
      !gp.isRecreated,
  );

  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Dashboard</h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Welcome back, {user?.name?.split(' ')[0] ?? 'User'} &mdash; {today}
            </p>
          </div>
          <button
            onClick={() => navigate('/sales/invoices/new')}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line" /> New Sale
          </button>
        </div>

        {/* ── Error Banner ── */}
        {dashData.error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <i className="ri-error-warning-line text-red-500 text-xl shrink-0" />
            <p className="text-sm font-semibold text-red-700">{dashData.error}</p>
          </div>
        )}

        {/* ── Gate Pass: Overdue Banner ── */}
        {overdueGPs.length > 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
            onClick={() => navigate('/inventory/gate-pass/outward')}
          >
            <i className="ri-alarm-warning-line text-amber-500 text-xl shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                {overdueGPs.length} Overdue Gate {overdueGPs.length === 1 ? 'Pass' : 'Passes'} — Return Expected
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Returnable goods past their expected return date.{' '}
                <span className="font-semibold underline">View Outward Passes →</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Gate Pass: Rejected Banner ── */}
        {myRejectedGPs.length > 0 && (
          <div
            className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => navigate('/inventory/gate-pass/outward')}
          >
            <i className="ri-shield-cross-line text-red-500 text-xl shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-800">
                {myRejectedGPs.length} Gate {myRejectedGPs.length === 1 ? 'Pass' : 'Passes'} Rejected by Security
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Security guard rejected your submission. Please review and recreate.{' '}
                <span className="font-semibold underline">View Rejected Passes →</span>
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-100 border border-red-300 px-2.5 py-1 rounded-full shrink-0">
              <i className="ri-close-circle-line" />
              {myRejectedGPs.length} Rejected
            </div>
          </div>
        )}

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-3 gap-4">
          {dashData.loading
            ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-slate-100 animate-pulse" />
            ))
            : dashData.kpis.map((kpi) => (
              <div
                key={kpi.id}
                className="cursor-pointer"
                onClick={() => navigate(KPI_ROUTES[kpi.id] ?? '/')}
              >
                <KPICard {...kpi} />
              </div>
            ))}
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <SalesChart />
          </div>
          <div className="col-span-1">
            {/* Pass real topItems data down to TopItemsChart */}
            <TopItemsChart />
          </div>
        </div>

        {/* ── Bottom Row ── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            {/* Pass real transactions data down to RecentTransactions */}
            <RecentTransactions
              transactions={dashData.recentTransactions}
              loading={dashData.loading}
            />
          </div>
          <div className="col-span-1 flex flex-col gap-4" >
            <LowStockAlert />
            <QuickActions />
          </div>
        </div>

      </div>
    </AppLayout>
  );
}