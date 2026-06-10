import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import {
  mockProductionOrders,
  mockWarehouseStock,
  mockRoutings,
  mockItems,
  mockInspectionChecklists,
} from '@/mocks/masters';
import { mockInspections, calcSampleQty } from '@/mocks/qms';
import { formatDateIST } from '@/utils/format';
import POPrintModal from '@/pages/manifacturing/orders/components/POPrintModal';
import MTSSuggestModal from '@/pages/manifacturing/orders/components/MTSSuggestModal';
import type { MockProductionOrder } from '@/mocks/masters';

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
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function getThisMonthCompleted(): number {
  const now = new Date();
  return mockProductionOrders.filter((po) => {
    if (po.status !== 'COMPLETED' || !po.actualEndDate) return false;
    const d = new Date(po.actualEndDate);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;
}

export default function ProductionOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('ALL');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<FilterPriority>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [printPO, setPrintPO] = useState<MockProductionOrder | null>(null);
  const [showMTSSuggest, setShowMTSSuggest] = useState(false);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const filtered = useMemo(() => {
    return mockProductionOrders.filter((po) => {
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
          po.productName.toLowerCase().includes(q) ||
          (po.variantName?.toLowerCase().includes(q) ?? false) ||
          po.productCode.toLowerCase().includes(q) ||
          (po.salesOrderRef?.toLowerCase().includes(q) ?? false) ||
          (po.notes?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [
    search,
    typeFilter,
    statusFilter,
    priorityFilter,
    dateFrom,
    dateTo,
    refreshKey,
  ]);

  const stats = useMemo(() => {
    const total = mockProductionOrders.length;
    const inProgress = mockProductionOrders.filter(
      (po) => po.status === 'IN_PROGRESS',
    ).length;
    const planned = mockProductionOrders.filter(
      (po) => po.status === 'PLANNED',
    ).length;
    const onHold = mockProductionOrders.filter(
      (po) => po.status === 'ON_HOLD',
    ).length;
    const completedThisMonth = getThisMonthCompleted();
    const byStatus: Record<string, number> = {};
    mockProductionOrders.forEach((po) => {
      byStatus[po.status] = (byStatus[po.status] ?? 0) + 1;
    });
    return { total, inProgress, planned, onHold, completedThisMonth, byStatus };
  }, [refreshKey]);

  const completionPct = useCallback((po: MockProductionOrder) => {
    if (po.plannedQty === 0) return 0;
    return Math.min(
      100,
      Math.round(((po.completedQty + po.rejectedQty) / po.plannedQty) * 100),
    );
  }, []);

  // ── Status Transition Handlers ─────────────────────────────────────────────
  const handleSubmit = useCallback(
    (poId: string) => {
      const idx = mockProductionOrders.findIndex((po) => po.id === poId);
      if (idx < 0) return;
      mockProductionOrders[idx] = {
        ...mockProductionOrders[idx],
        status: 'PLANNED',
      };
      toast.success(
        `Production Order ${mockProductionOrders[idx].poNumber} → PLANNED`,
      );
      refresh();
    },
    [toast, refresh],
  );

  const handleStart = useCallback(
    (poId: string) => {
      const idx = mockProductionOrders.findIndex((po) => po.id === poId);
      if (idx < 0) return;
      const po = mockProductionOrders[idx];
      mockProductionOrders[idx] = {
        ...po,
        status: 'IN_PROGRESS',
        actualStartDate:
          po.actualStartDate || new Date().toISOString().split('T')[0],
      };
      toast.success(`Production Order ${po.poNumber} → IN PROGRESS`);
      refresh();
    },
    [toast, refresh],
  );

  const handleComplete = useCallback(
    (poId: string) => {
      const idx = mockProductionOrders.findIndex((po) => po.id === poId);
      if (idx < 0) return;
      const po = mockProductionOrders[idx];
      const today = new Date().toISOString().split('T')[0];
      mockProductionOrders[idx] = {
        ...po,
        status: 'COMPLETED',
        actualEndDate: today,
      };
      // Update finished goods stock
      if (!mockWarehouseStock['wh-001']) mockWarehouseStock['wh-001'] = {};
      const prev = mockWarehouseStock['wh-001'][po.productId] || 0;
      mockWarehouseStock['wh-001'][po.productId] = prev + po.plannedQty;
      toast.success(`Production Order ${po.poNumber} → COMPLETED`);
      toast.success(`Stock updated: +${po.plannedQty} ${po.productName}`);

      // Auto-trigger Final inspection if completedQty > 0
      if (po.completedQty > 0) {
        const item = mockItems.find((i) => i.id === po.productId);
        const checklist =
          mockInspectionChecklists.find(
            (c) =>
              c.applicableTo === 'FINAL' &&
              c.itemTypeTarget === item?.itemType &&
              c.isActive,
          ) ||
          mockInspectionChecklists.find(
            (c) => c.applicableTo === 'FINAL' && c.isActive,
          );
        if (checklist) {
          const nextNum = mockInspections.length + 1;
          const sampleQty = calcSampleQty(
            checklist.samplingPlan,
            po.completedQty,
          );
          const newInspection = {
            id: `insp-${Date.now()}`,
            inspectionNumber: `QC-FN-2024-${String(nextNum).padStart(3, '0')}`,
            type: 'FINAL' as const,
            status: 'PENDING' as const,
            triggeredBy: 'AUTO' as const,
            sourceType: 'PRODUCTION_ORDER' as const,
            sourceId: po.id,
            sourceNumber: po.poNumber,
            itemId: po.productId,
            itemName: po.productName,
            itemCode: item?.code || null,
            isVariant: po.isVariant ?? false,
            variantName: po.variantName || null,
            checklistId: checklist.id,
            checklistName: checklist.name,
            samplingPlan: checklist.samplingPlan,
            batchNumber: null,
            lotNumber: null,
            totalQty: po.completedQty,
            sampleQty,
            passedQty: 0,
            failedQty: 0,
            unit: po.unit,
            inspectorId: null,
            inspectorName: null,
            scheduledDate: today,
            completedDate: null,
            warehouseId: null,
            notes: `Auto-triggered on completion of ${po.poNumber}`,
            createdAt: new Date().toISOString(),
          };
          mockInspections.push(newInspection);
          toast.success(`Final inspection triggered for ${po.poNumber}`);
        }
      }

      refresh();
    },
    [toast, refresh],
  );

  const handleHold = useCallback(
    (poId: string) => {
      const idx = mockProductionOrders.findIndex((po) => po.id === poId);
      if (idx < 0) return;
      const po = mockProductionOrders[idx];
      mockProductionOrders[idx] = { ...po, status: 'ON_HOLD' };
      toast.success(`Production Order ${po.poNumber} → ON HOLD`);
      refresh();
    },
    [toast, refresh],
  );

  const handleResume = useCallback(
    (poId: string) => {
      const idx = mockProductionOrders.findIndex((po) => po.id === poId);
      if (idx < 0) return;
      const po = mockProductionOrders[idx];
      mockProductionOrders[idx] = { ...po, status: 'IN_PROGRESS' };
      toast.success(`Production Order ${po.poNumber} → IN PROGRESS`);
      refresh();
    },
    [toast, refresh],
  );

  const handleCancelConfirm = useCallback(() => {
    if (!cancelTarget) return;
    const idx = mockProductionOrders.findIndex((po) => po.id === cancelTarget);
    if (idx >= 0) {
      const po = mockProductionOrders[idx];
      mockProductionOrders[idx] = { ...po, status: 'CANCELLED' };
      toast.success(`Production Order ${po.poNumber} → CANCELLED`);
      refresh();
    }
    setCancelTarget(null);
  }, [cancelTarget, toast, refresh]);

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
                {stats.total} orders
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
                  navigate('/manufacturing/orders/new', {
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
                  navigate('/manufacturing/orders/new', {
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
                      placeholder="Search by PO number or product name..."
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
                      QC Status
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
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
                      const s = statusConfig[po.status];
                      const p = priorityConfig[po.priority];
                      const pct = completionPct(po);
                      const isComplete = po.completedQty === po.plannedQty;
                      const hasStarted =
                        po.completedQty > 0 || po.rejectedQty > 0;
                      return (
                        <tr
                          key={po.id}
                          className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                        >
                          {/* PO Number */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <button
                              onClick={() =>
                                navigate(`/manufacturing/orders/${po.id}/edit`)
                              }
                              className="text-sm font-semibold text-[#4f46e5] hover:text-indigo-800 cursor-pointer text-left"
                            >
                              {po.poNumber}
                            </button>
                            <div className="text-[11px] text-[#94a3b8] mt-0.5">
                              BOM v{po.bomVersion}
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
                              {po.productName}
                            </p>
                            {po.isVariant && po.variantName && (
                              <p className="text-xs text-gray-400 mt-0.5">
                                {po.variantName}
                              </p>
                            )}
                            <p className="text-[11px] text-gray-400">
                              {po.productCode}
                            </p>
                          </td>
                          {/* Qty */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-[#1e293b]">
                              {po.plannedQty} {po.unit}
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
                          {/* QC Status */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {(() => {
                              const linkedInspections = mockInspections.filter(
                                (i) =>
                                  i.sourceType === 'PRODUCTION_ORDER' &&
                                  i.sourceId === po.id,
                              );
                              if (linkedInspections.length === 0) {
                                return (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium whitespace-nowrap">
                                    No QC
                                  </span>
                                );
                              }
                              const allPassed = linkedInspections.every(
                                (i) => i.status === 'PASSED',
                              );
                              const anyFailed = linkedInspections.some(
                                (i) => i.status === 'FAILED',
                              );
                              const anyPending = linkedInspections.some(
                                (i) =>
                                  i.status === 'PENDING' ||
                                  i.status === 'IN_PROGRESS',
                              );
                              if (anyFailed)
                                return (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 font-medium whitespace-nowrap">
                                    ❌ QC Failed
                                  </span>
                                );
                              if (allPassed)
                                return (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
                                    ✅ QC Passed
                                  </span>
                                );
                              if (anyPending)
                                return (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium whitespace-nowrap">
                                    ⏳ QC Pending
                                  </span>
                                );
                              return (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200 font-medium whitespace-nowrap">
                                  No QC
                                </span>
                              );
                            })()}
                          </td>
                          {/* Actions */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 flex-wrap">
                              {/* Status transition buttons */}
                              {po.status === 'DRAFT' && (
                                <button
                                  onClick={() => handleSubmit(po.id)}
                                  title="Submit for Planning"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-sky-50 text-sky-700 text-[11px] font-medium border border-sky-200 hover:bg-sky-100 cursor-pointer whitespace-nowrap"
                                >
                                  <i className="ri-send-plane-line" />
                                  Submit
                                </button>
                              )}
                              {po.status === 'PLANNED' && (
                                <button
                                  onClick={() => handleStart(po.id)}
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
                                    onClick={() => handleComplete(po.id)}
                                    title="Complete Production"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200 hover:bg-emerald-100 cursor-pointer whitespace-nowrap"
                                  >
                                    <i className="ri-check-line" />
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleHold(po.id)}
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
                                    onClick={() => handleResume(po.id)}
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
                                    `/manufacturing/orders/${po.id}/edit`,
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
                              {/* Cancel (not draft/on-hold/cancelled/completed) */}
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
                Showing {filtered.length} of {mockProductionOrders.length}{' '}
                production orders
              </span>
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
          onCreated={refresh}
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
