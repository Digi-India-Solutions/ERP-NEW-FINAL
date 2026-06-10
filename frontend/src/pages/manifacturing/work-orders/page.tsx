import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import {
  mockWorkOrders,
  mockWorkCenters,
  mockMachines,
  mockOperators,
  mockProductionOrders,
  type MockWorkOrder,
} from '@/mocks/masters';
import WorkOrderEditModal from './components/WorkOrderEditModal';

type WOStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';

const woStatusConfig: Record<
  WOStatus,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
    icon: 'ri-time-line',
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
};

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export default function WorkOrdersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const poIdFromUrl = searchParams.get('poId');

  // ── Filter state ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<WOStatus | 'ALL'>('ALL');
  const [workCenterFilter, setWorkCenterFilter] = useState<string>('ALL');
  const [poFilter, setPoFilter] = useState<string>(poIdFromUrl || 'ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // ── Edit modal state ──
  const [editWO, setEditWO] = useState<MockWorkOrder | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  // ── Unique POs for dropdown ──
  const uniquePOs = useMemo(() => {
    const ids = [...new Set(mockWorkOrders.map((w) => w.productionOrderId))];
    return ids.map((id) => {
      const po = mockProductionOrders.find((p) => p.id === id);
      return { id, number: po?.poNumber || id };
    });
  }, []);

  // ── Filtered work orders ──
  const filtered = useMemo(() => {
    let list = [...mockWorkOrders];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (w) =>
          w.woNumber.toLowerCase().includes(q) ||
          w.stageName.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== 'ALL') {
      list = list.filter((w) => w.status === statusFilter);
    }
    if (workCenterFilter !== 'ALL') {
      list = list.filter((w) => w.workCenterId === workCenterFilter);
    }
    if (poFilter !== 'ALL') {
      list = list.filter((w) => w.productionOrderId === poFilter);
    }
    if (dateFrom) {
      list = list.filter((w) => w.plannedStartDate >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((w) => w.plannedStartDate <= dateTo);
    }
    return list.sort((a, b) => a.stageNumber - b.stageNumber);
  }, [search, statusFilter, workCenterFilter, poFilter, dateFrom, dateTo]);

  // ── Summary counts ──
  const counts = useMemo(() => {
    const total = filtered.length;
    const pending = filtered.filter((w) => w.status === 'PENDING').length;
    const inProgress = filtered.filter(
      (w) => w.status === 'IN_PROGRESS',
    ).length;
    const completed = filtered.filter((w) => w.status === 'COMPLETED').length;
    return { total, pending, inProgress, completed };
  }, [filtered]);

  // ── Actions ──
  const handleStart = useCallback(
    (wo: MockWorkOrder) => {
      const idx = mockWorkOrders.findIndex((w) => w.id === wo.id);
      if (idx >= 0) {
        mockWorkOrders[idx] = {
          ...mockWorkOrders[idx],
          status: 'IN_PROGRESS',
          actualStartDate: todayISO(),
        };
        toast.success(`Work Order ${wo.woNumber} started`);
      }
    },
    [toast],
  );

  const handleComplete = useCallback(
    (wo: MockWorkOrder) => {
      const idx = mockWorkOrders.findIndex((w) => w.id === wo.id);
      if (idx >= 0) {
        mockWorkOrders[idx] = {
          ...mockWorkOrders[idx],
          status: 'COMPLETED',
          completedQty: mockWorkOrders[idx].plannedQty,
          actualEndDate: todayISO(),
        };
        toast.success(`Work Order ${wo.woNumber} completed`);
      }
    },
    [toast],
  );

  const handleEdit = useCallback((wo: MockWorkOrder) => {
    setEditWO(wo);
    setEditOpen(true);
  }, []);

  const handleSaveEdit = useCallback(
    (updated: MockWorkOrder) => {
      const idx = mockWorkOrders.findIndex((w) => w.id === updated.id);
      if (idx >= 0) {
        mockWorkOrders[idx] = updated;
        toast.success(`Work Order ${updated.woNumber} updated`);
      }
      setEditOpen(false);
      setEditWO(null);
    },
    [toast],
  );

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('ALL');
    setWorkCenterFilter('ALL');
    setPoFilter('ALL');
    setDateFrom('');
    setDateTo('');
    if (poIdFromUrl) {
      setSearchParams({});
    }
  }, [poIdFromUrl, setSearchParams]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8fafc] py-6 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Work Orders</h1>
              <p className="text-xs text-[#64748b] mt-0.5">
                {counts.total} work orders
                {counts.pending > 0 && (
                  <span className="ml-2 text-slate-500">
                    | {counts.pending} pending
                  </span>
                )}
                {counts.inProgress > 0 && (
                  <span className="ml-2 text-amber-600">
                    | {counts.inProgress} in progress
                  </span>
                )}
                {counts.completed > 0 && (
                  <span className="ml-2 text-emerald-600">
                    | {counts.completed} completed
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => navigate('/manufacturing/orders')}
              className="h-9 px-4 rounded-lg border border-slate-200 text-sm font-medium text-[#64748b] hover:bg-white cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <i className="ri-arrow-left-line" />
              Back to Orders
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4">
            <div className="flex flex-wrap items-end gap-3">
              {/* Search */}
              <div className="flex-1 min-w-[200px]">
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Search
                </label>
                <div className="relative">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="WO number or stage name..."
                    className="w-full h-10 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* PO Filter */}
              <div className="w-[200px]">
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Production Order
                </label>
                <select
                  value={poFilter}
                  onChange={(e) => setPoFilter(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="ALL">All Orders</option>
                  {uniquePOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div className="w-[160px]">
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as WOStatus | 'ALL')
                  }
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ON_HOLD">On Hold</option>
                </select>
              </div>

              {/* Work Center */}
              <div className="w-[180px]">
                <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                  Work Center
                </label>
                <select
                  value={workCenterFilter}
                  onChange={(e) => setWorkCenterFilter(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                >
                  <option value="ALL">All Centers</option>
                  {mockWorkCenters.map((wc) => (
                    <option key={wc.id} value={wc.id}>
                      {wc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div className="flex gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-[140px] h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#64748b] uppercase tracking-wide mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-[140px] h-10 px-3 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Clear */}
              <button
                onClick={handleClearFilters}
                className="h-10 px-3 rounded-lg border border-slate-200 text-sm text-[#64748b] hover:bg-white cursor-pointer whitespace-nowrap flex items-center gap-1"
              >
                <i className="ri-filter-off-line" />
                Clear
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      WO Number
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Production Order
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Stage
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Work Center
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Machine
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Operator
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Planned Dates
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Progress
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((wo) => {
                    const statusCfg = woStatusConfig[wo.status];
                    const progressPct =
                      wo.plannedQty > 0
                        ? Math.round((wo.completedQty / wo.plannedQty) * 100)
                        : 0;
                    const machineName =
                      wo.machineName ||
                      (wo.machineId
                        ? mockMachines.find((m) => m.id === wo.machineId)?.name
                        : null);
                    const operatorName =
                      wo.operatorName ||
                      (wo.operatorId
                        ? mockOperators.find((o) => o.id === wo.operatorId)
                            ?.name
                        : null);

                    return (
                      <tr
                        key={wo.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-[#4f46e5]">
                            {wo.woNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() =>
                              navigate(
                                `/manufacturing/orders/${wo.productionOrderId}/edit`,
                              )
                            }
                            className="text-sm text-[#475569] hover:text-[#4f46e5] cursor-pointer whitespace-nowrap"
                          >
                            {wo.productionOrderNumber}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600">
                              {wo.stageNumber}
                            </span>
                            <span className="text-sm text-[#1e293b]">
                              {wo.stageName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#475569]">
                          {wo.workCenterName}
                        </td>
                        <td className="px-4 py-3">
                          {machineName ? (
                            <span className="text-sm text-[#475569]">
                              {machineName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              — Not assigned —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {operatorName ? (
                            <span className="text-sm text-[#475569]">
                              {operatorName}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">
                              — Not assigned —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#475569] whitespace-nowrap">
                          {formatShortDate(wo.plannedStartDate)}{' '}
                          <span className="text-slate-300 mx-1">→</span>{' '}
                          {formatShortDate(wo.plannedEndDate)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${progressPct === 100 ? 'bg-emerald-500' : progressPct > 0 ? 'bg-amber-500' : 'bg-slate-300'}`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#64748b] whitespace-nowrap">
                              {wo.completedQty}/{wo.plannedQty}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                          >
                            <i className={statusCfg.icon} />
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {wo.status === 'PENDING' && (
                              <button
                                onClick={() => handleStart(wo)}
                                className="h-8 px-2.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 cursor-pointer whitespace-nowrap flex items-center gap-1"
                                title="Start Work Order"
                              >
                                <i className="ri-play-line" />
                                Start
                              </button>
                            )}
                            {wo.status === 'IN_PROGRESS' && (
                              <button
                                onClick={() => handleComplete(wo)}
                                className="h-8 px-2.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium hover:bg-emerald-100 cursor-pointer whitespace-nowrap flex items-center gap-1"
                                title="Complete Work Order"
                              >
                                <i className="ri-check-double-line" />
                                Complete
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(wo)}
                              className="h-8 w-8 flex items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 cursor-pointer"
                              title="Edit Work Order"
                            >
                              <i className="ri-edit-line" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-4 py-12 text-center text-sm text-[#94a3b8]"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <i className="ri-search-line text-2xl text-slate-300" />
                          <p>No work orders match your filters</p>
                          <button
                            onClick={handleClearFilters}
                            className="text-[#4f46e5] text-xs font-medium hover:underline cursor-pointer"
                          >
                            Clear all filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <WorkOrderEditModal
        open={editOpen}
        workOrder={editWO}
        onClose={() => {
          setEditOpen(false);
          setEditWO(null);
        }}
        onSave={handleSaveEdit}
      />
    </AppLayout>
  );
}
