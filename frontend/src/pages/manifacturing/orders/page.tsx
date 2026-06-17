import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';

import {
  getAllProductionOrders,
  updateProductionOrderStatus,
  deleteProductionOrder,
  mapApiToProductionOrder,
} from '@/api/productionOrder.api';
import { formatDateIST } from '@/utils/format';
import POPrintModal from '@/pages/manifacturing/orders/components/POPrintModal';
import MTSSuggestModal from '@/pages/manifacturing/orders/components/MTSSuggestModal';

// ── Local type derived from the API mapper ────────────────────────────────────
export type ProductionOrder = ReturnType<typeof mapApiToProductionOrder>;

type Status =
  | 'DRAFT'
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ON_HOLD'
  | 'CANCELLED';
type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

type FilterType = 'ALL' | 'MTO' | 'MTS';
type FilterStatus = Status | 'ALL';
type FilterPriority = Priority | 'ALL';

const statusConfig: Record<
  Status,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  DRAFT: {
    label: 'Draft',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: 'ri-draft-line',
  },
  PLANNED: {
    label: 'Planned',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: 'ri-calendar-line',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'ri-loader-4-line',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'ri-check-line',
  },
  ON_HOLD: {
    label: 'On Hold',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: 'ri-pause-circle-line',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: 'ri-close-circle-line',
  },
};




const priorityConfig: Record<
  Priority,
  { label: string; bg: string; text: string; dot: string; border: string }
> = {
  LOW: {
    label: 'Low',
    bg: 'bg-slate-50',
    text: 'text-slate-600',
    dot: 'bg-slate-400',
    border: 'border-slate-200',
  },
  NORMAL: {
    label: 'Normal',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
    border: 'border-sky-200',
  },
  HIGH: {
    label: 'High',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    border: 'border-amber-200',
  },
  URGENT: {
    label: 'Urgent',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
    border: 'border-rose-200',
  },
};

function formatShortDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function ProductionOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // ── Data state ────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // poId being acted on

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Modal state ───────────────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [printPO, setPrintPO] = useState<ProductionOrder | null>(null);
  const [showMTSSuggest, setShowMTSSuggest] = useState(false);

  // ── Fetch all production orders ───────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllProductionOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data.map(mapApiToProductionOrder));
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load production orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // const handleStatusChange = async (
  //   id: string,
  //   status: Status,
  // ) => {
  //   try {
  //     await updateProductionOrderStatus(id, status);

  //     toast.success('Status updated');

  //     await fetchOrders(); // refresh grid
  //   } catch (error) {
  //     console.error(error);

  //     toast.error('Failed to update status');
  //   }
  // };

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return orders.filter((po) => {
      if (typeFilter !== 'ALL' && po.type !== typeFilter) return false;
      if (statusFilter !== 'ALL' && po.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && po.priority !== priorityFilter)
        return false;
      if (dateFrom && new Date(po.plannedStartDate) < new Date(dateFrom))
        return false;
      if (dateTo && new Date(po.plannedEndDate) > new Date(dateTo))
        return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          po.poNumber.toLowerCase().includes(q) ||
          po.itemName.toLowerCase().includes(q) ||
          po.itemCode.toLowerCase().includes(q) ||
          (po.notes?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [orders, search, typeFilter, statusFilter, priorityFilter, dateFrom, dateTo]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = orders.length;
    const inProgress = orders.filter((po) => po.status === 'IN_PROGRESS').length;
    const planned = orders.filter((po) => po.status === 'PLANNED').length;
    const onHold = orders.filter((po) => po.status === 'ON_HOLD').length;

    const now = new Date();
    const completedThisMonth = orders.filter((po) => {
      if (po.status !== 'COMPLETED' || !po.actualEndDate) return false;
      const d = new Date(po.actualEndDate);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    const byStatus: Record<string, number> = {};
    orders.forEach((po) => {
      byStatus[po.status] = (byStatus[po.status] ?? 0) + 1;
    });

    return { total, inProgress, planned, onHold, completedThisMonth, byStatus };
  }, [orders]);

  const completionPct = useCallback((po: ProductionOrder) => {
    if (po.plannedQty === 0) return 0;
    return Math.min(
      100,
      Math.round(((po.completedQty + po.rejectedQty) / po.plannedQty) * 100),
    );
  }, []);

  // ── Status transition helper ──────────────────────────────────────────────
  const changeStatus = useCallback(
    async (poId: string, newStatus: string, successMsg: string) => {
      setActionLoading(poId);
      try {
        const res = await updateProductionOrderStatus(poId, newStatus);
        if (res.success) {
          toast.success(successMsg);
          // Optimistic update locally
          setOrders((prev) =>
            prev.map((po) =>
              po.id === poId
                ? {
                    ...po,
                    status: newStatus,
                    ...(newStatus === 'IN_PROGRESS' && !po.actualStartDate
                      ? { actualStartDate: new Date().toISOString().split('T')[0] }
                      : {}),
                    ...(newStatus === 'COMPLETED'
                      ? { actualEndDate: new Date().toISOString().split('T')[0] }
                      : {}),
                  }
                : po,
            ),
          );
        } else {
          toast.error((res as any).message || 'Status update failed');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Status update failed');
      } finally {
        setActionLoading(null);
      }
    },
    [toast],
  );

  const handleSubmit = useCallback(
    (po: ProductionOrder) =>
      changeStatus(po.id, 'PLANNED', `${po.poNumber} → PLANNED`),
    [changeStatus],
  );

  const handleStart = useCallback(
    (po: ProductionOrder) =>
      changeStatus(po.id, 'IN_PROGRESS', `${po.poNumber} → IN PROGRESS`),
    [changeStatus],
  );

  const handleComplete = useCallback(
    (po: ProductionOrder) =>
      changeStatus(po.id, 'COMPLETED', `${po.poNumber} → COMPLETED`),
    [changeStatus],
  );

  const handleHold = useCallback(
    (po: ProductionOrder) =>
      changeStatus(po.id, 'ON_HOLD', `${po.poNumber} → ON HOLD`),
    [changeStatus],
  );

  const handleResume = useCallback(
    (po: ProductionOrder) =>
      changeStatus(po.id, 'IN_PROGRESS', `${po.poNumber} → IN PROGRESS`),
    [changeStatus],
  );

  const handleCancelConfirm = useCallback(async () => {
    if (!cancelTarget) return;
    const po = orders.find((o) => o.id === cancelTarget);
    if (!po) {
      setCancelTarget(null);
      return;
    }
    await changeStatus(cancelTarget, 'CANCELLED', `${po.poNumber} → CANCELLED`);
    setCancelTarget(null);
  }, [cancelTarget, orders, changeStatus]);

  // ── Delete handler (unused in UI but imported) ────────────────────────────
  const handleDelete = useCallback(
    async (poId: string) => {
      setActionLoading(poId);
      try {
        const res = await deleteProductionOrder(poId);
        if (res.success) {
          toast.success('Production order deleted');
          setOrders((prev) => prev.filter((po) => po.id !== poId));
        } else {
          toast.error((res as any).message || 'Delete failed');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Delete failed');
      } finally {
        setActionLoading(null);
      }
    },
    [toast],
  );

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8fafc] py-6 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto">
          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">
                Production Orders
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5">
                {loading ? 'Loading…' : `${stats.total} orders`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowMTSSuggest(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-amber-300 text-amber-700 text-sm font-medium hover:bg-amber-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-lightbulb-line" />
                Suggest MTS
              </button>
              <button
                onClick={() =>
                  navigate('/manufacturing/production-orders/new', {
                    state: { type: 'MTO' },
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line" />
                New MTO Order
              </button>
              <button
                onClick={() =>
                  navigate('/manufacturing/production-orders/new', {
                    state: { type: 'MTS' },
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#059669] text-white text-sm font-medium hover:bg-emerald-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line" />
                New MTS Order
              </button>
            </div>
          </div>

          {/* ── Dashboard Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {/* In Progress — amber */}
            <div className="bg-white border border-amber-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-amber-100">
                <i className="ri-loader-4-line text-amber-600 text-base" />
              </div>
              <div className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                In Progress
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {stats.inProgress}
              </div>
              <div className="text-[11px] text-amber-600 mt-0.5">
                {stats.inProgress} order{stats.inProgress !== 1 ? 's' : ''}{' '}
                running
              </div>
            </div>

            {/* Planned — sky */}
            <div className="bg-white border border-sky-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-sky-100">
                <i className="ri-calendar-line text-sky-600 text-base" />
              </div>
              <div className="text-xs text-sky-700 font-medium uppercase tracking-wide">
                Planned
              </div>
              <div className="text-2xl font-bold text-sky-700 mt-1">
                {stats.planned}
              </div>
              <div className="text-[11px] text-sky-600 mt-0.5">
                {stats.planned} order{stats.planned !== 1 ? 's' : ''} ready to
                start
              </div>
            </div>

            {/* Completed This Month — emerald */}
            <div className="bg-white border border-emerald-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100">
                <i className="ri-check-double-line text-emerald-600 text-base" />
              </div>
              <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
                Completed (Month)
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {stats.completedThisMonth}
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">
                {stats.completedThisMonth} order
                {stats.completedThisMonth !== 1 ? 's' : ''} this month
              </div>
            </div>

            {/* On Hold — rose/red */}
            <div className="bg-white border border-rose-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-rose-100">
                <i className="ri-pause-circle-line text-rose-600 text-base" />
              </div>
              <div className="text-xs text-rose-700 font-medium uppercase tracking-wide">
                On Hold
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-1">
                {stats.onHold}
              </div>
              <div className="text-[11px] text-rose-600 mt-0.5">
                {stats.onHold} order{stats.onHold !== 1 ? 's' : ''} need
                attention
              </div>
            </div>
          </div>

          {/* ── Status Pills ── */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(
              [
                'ALL',
                'DRAFT',
                'PLANNED',
                'IN_PROGRESS',
                'ON_HOLD',
                'COMPLETED',
                'CANCELLED',
              ] as const
            ).map((s) => {
              const count =
                s === 'ALL' ? stats.total : (stats.byStatus[s] ?? 0);
              const active = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s as FilterStatus)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                      : 'bg-white text-[#475569] border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {s === 'ALL'
                    ? 'All'
                    : (statusConfig[s as Status]?.label ?? s)}
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Toolbar ── */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400">
                      <i className="ri-search-line text-sm" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search by PO number, product name or code..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={typeFilter}
                    onChange={(e) =>
                      setTypeFilter(e.target.value as FilterType)
                    }
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                  >
                    <option value="ALL">All Types</option>
                    <option value="MTO">Make to Order</option>
                    <option value="MTS">Make to Stock</option>
                  </select>
                  <select
                    value={priorityFilter}
                    onChange={(e) =>
                      setPriorityFilter(e.target.value as FilterPriority)
                    }
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                  >
                    <option value="ALL">All Priorities</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="NORMAL">Normal</option>
                    <option value="LOW">Low</option>
                  </select>
                  <button
                    onClick={fetchOrders}
                    title="Refresh"
                    className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    <i className={`ri-refresh-line text-sm ${loading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#64748b] font-medium">
                  Planned Start:
                </span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
                <span className="text-xs text-[#94a3b8]">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
                {(dateFrom ||
                  dateTo ||
                  search ||
                  typeFilter !== 'ALL' ||
                  priorityFilter !== 'ALL' ||
                  statusFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearch('');
                      setTypeFilter('ALL');
                      setStatusFilter('ALL');
                      setPriorityFilter('ALL');
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="ml-auto text-xs text-[#64748b] hover:text-[#1e293b] cursor-pointer underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      PO Number
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Product
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Qty
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Progress
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Planned Dates
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Priority
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-12 text-center text-sm text-[#94a3b8]"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <i className="ri-loader-4-line text-2xl text-indigo-400 animate-spin" />
                          <span>Loading production orders…</span>
                        </div>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-sm text-[#94a3b8]"
                      >
                        <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 mb-3">
                          <i className="ri-inbox-line text-xl text-slate-300" />
                        </div>
                        No production orders match your filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map((po) => {
                      const s =
                        statusConfig[po.status as Status] ??
                        statusConfig['DRAFT'];
                      const p =
                        priorityConfig[po.priority as Priority] ??
                        priorityConfig['NORMAL'];
                      const pct = completionPct(po);
                      const isComplete = po.completedQty >= po.plannedQty && po.plannedQty > 0;
                      const hasStarted =
                        po.completedQty > 0 || po.rejectedQty > 0;
                      const isActing = actionLoading === po.id;
                      return (
                        <tr
                          key={po.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          {/* PO Number */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                navigate(
                                 `/manufacturing/production-orders/${po.id}/edit`,
                                )
                              }
                              className="text-sm font-semibold text-[#4f46e5] hover:text-indigo-800 cursor-pointer text-left"
                            >
                              {po.poNumber}
                            </button>
                            <div className="text-[11px] text-[#94a3b8] mt-0.5">
                              BOM v{po.bomVersion || '—'}
                            </div>
                          </td>
                          {/* Type */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                po.type === 'MTO'
                                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}
                            >
                              {po.type}
                            </span>
                          </td>
                          {/* Product */}
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900">
                              {po.itemName}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {po.itemCode}
                            </p>
                            {po.warehouseName && (
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                <i className="ri-store-2-line mr-0.5" />
                                {po.warehouseName}
                              </p>
                            )}
                          </td>
                          {/* Qty */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-[#1e293b]">
                              {po.plannedQty}
                            </div>
                            {po.rejectedQty > 0 && (
                              <div className="text-[11px] text-rose-500 mt-0.5">
                                {po.rejectedQty} rejected
                              </div>
                            )}
                          </td>
                          {/* Progress */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isComplete ? 'bg-emerald-500' : hasStarted ? 'bg-amber-500' : 'bg-slate-300'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[11px] font-medium text-[#475569]">
                                {po.completedQty}/{po.plannedQty}
                              </span>
                            </div>
                          </td>
                          {/* Dates */}
                          <td className="px-4 py-3 whitespace-nowrap text-[#475569]">
                            <div className="text-xs">
                              {formatShortDate(po.plannedStartDate)} &rarr;{' '}
                              {formatShortDate(po.plannedEndDate)}
                            </div>
                          </td>
                          {/* Priority */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${p.bg} ${p.text} ${p.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${p.dot}`}
                              />
                              {p.label}
                            </span>
                          </td>
                          {/* Status */}
                           <td className="px-4 py-3 whitespace-nowrap">
                           <span
                           className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${s.bg} ${s.text} ${s.border}`}
                            >
                          <i className={s.icon} />
                          {s.label}
                         </span>
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              {isActing ? (
                                <i className="ri-loader-4-line animate-spin text-indigo-400 text-base" />
                              ) : (
                                <>
                                  {/* Status transition buttons */}
                                  {po.status === 'DRAFT' && (
                                    <button
                                      onClick={() => handleSubmit(po)}
                                      title="Submit for Planning"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 text-sky-700 text-[11px] font-medium border border-sky-200 hover:bg-sky-100 cursor-pointer whitespace-nowrap"
                                    >
                                      <i className="ri-send-plane-line" />
                                      Submit
                                    </button>
                                  )}
                                  {po.status === 'PLANNED' && (
                                    <button
                                      onClick={() => handleStart(po)}
                                      title="Start Production"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                                    >
                                      <i className="ri-play-line" />
                                      Start
                                    </button>
                                  )}
                                  {po.status === 'IN_PROGRESS' && (
                                    <>
                                      <button
                                        onClick={() => handleComplete(po)}
                                        title="Complete Production"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200 hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
                                      >
                                        <i className="ri-check-line" />
                                        Complete
                                      </button>
                                      <button
                                        onClick={() => handleHold(po)}
                                        title="Put on Hold"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 text-rose-700 text-[11px] font-medium border border-rose-200 hover:bg-rose-100 cursor-pointer whitespace-nowrap"
                                      >
                                        <i className="ri-pause-line" />
                                        Hold
                                      </button>
                                    </>
                                  )}
                                  {po.status === 'ON_HOLD' && (
                                    <>
                                      <button
                                        onClick={() => handleResume(po)}
                                        title="Resume Production"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 text-amber-700 text-[11px] font-medium border border-amber-200 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                                      >
                                        <i className="ri-play-line" />
                                        Resume
                                      </button>
                                      <button
                                        onClick={() => setCancelTarget(po.id)}
                                        title="Cancel"
                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-[11px] font-medium border border-slate-200 hover:bg-slate-100 cursor-pointer whitespace-nowrap"
                                      >
                                        <i className="ri-close-line" />
                                        Cancel
                                      </button>
                                    </>
                                  )}

                                  {/* Print button */}
                                  <button
                                    onClick={() => setPrintPO(po)}
                                    title="Print Production Order"
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#64748b] hover:bg-slate-100 hover:text-[#1e293b] transition-colors cursor-pointer"
                                  >
                                    <i className="ri-printer-line text-sm" />
                                  </button>
                                  {/* Edit */}
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/manufacturing/production-orders/${po.id}/edit`,
                                      )
                                    }
                                    title="Edit"
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#64748b] hover:bg-slate-100 hover:text-[#1e293b] transition-colors cursor-pointer"
                                  >
                                    <i className="ri-pencil-line text-sm" />
                                  </button>
                                  {/* Work Orders */}
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/manufacturing/work-orders?poId=${po.id}`,
                                      )
                                    }
                                    title="Work Orders"
                                    className="w-7 h-7 flex items-center justify-center rounded-md text-[#64748b] hover:bg-slate-100 hover:text-[#1e293b] transition-colors cursor-pointer"
                                  >
                                    <i className="ri-stack-line text-sm" />
                                  </button>
                                  {/* Cancel — for statuses that allow it */}
                                  {po.status !== 'CANCELLED' &&
                                    po.status !== 'COMPLETED' &&
                                    po.status !== 'ON_HOLD' &&
                                    po.status !== 'DRAFT' &&
                                    po.status !== 'PLANNED' &&
                                    po.status !== 'IN_PROGRESS' && (
                                      <button
                                        onClick={() => setCancelTarget(po.id)}
                                        title="Cancel"
                                        className="w-7 h-7 flex items-center justify-center rounded-md text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                                      >
                                        <i className="ri-close-circle-line text-sm" />
                                      </button>
                                    )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-[#64748b]">
                Showing {filtered.length} of {orders.length} production orders
              </span>
              {!loading && (
                <button
                  onClick={fetchOrders}
                  className="text-xs text-indigo-500 hover:text-indigo-700 cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-refresh-line" />
                  Refresh
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {printPO && (
        <POPrintModal po={printPO} onClose={() => setPrintPO(null)} />
      )}

      {showMTSSuggest && (
        <MTSSuggestModal
          onClose={() => setShowMTSSuggest(false)}
          onCreated={fetchOrders}
        />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Production Order"
        message="Are you sure you want to cancel this production order? This action cannot be undone."
        variant="danger"
        confirmLabel="Cancel Order"
        cancelLabel="Keep Order"
        onConfirm={handleCancelConfirm}
        onCancel={() => setCancelTarget(null)}
      />
    </AppLayout>
  );
}
