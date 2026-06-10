import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import {
  mockWorkOrders,
  mockWorkCenters,
  mockMachines,
  mockProductionOrders,
  type MockWorkOrder,
} from '@/mocks/masters';
import { formatDateIST, toInputDate } from '@/utils/format';

/* ─── Types ─── */
type ViewMode = 'week' | '2weeks' | 'month';

interface Filters {
  workCenter: string;
  status: string;
  productionOrder: string;
}

/* ─── Helpers ─── */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: string | Date, b: string | Date): number {
  const d1 = new Date(a);
  const d2 = new Date(b);
  const ms = d2.getTime() - d1.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function dayShort(d: Date): string {
  return d.toLocaleDateString('en-IN', { weekday: 'short' });
}

function dayNum(d: Date): number {
  return d.getDate();
}

function monthShort(d: Date): string {
  return d.toLocaleDateString('en-IN', { month: 'short' });
}

function getViewDays(mode: ViewMode): number {
  if (mode === 'week') return 7;
  if (mode === '2weeks') return 14;
  return 30;
}

function getStatusBarClasses(status: MockWorkOrder['status']): string {
  switch (status) {
    case 'PENDING':
      return 'bg-blue-200 text-blue-800 border border-blue-300';
    case 'IN_PROGRESS':
      return 'bg-amber-200 text-amber-800 border border-amber-300';
    case 'COMPLETED':
      return 'bg-emerald-200 text-emerald-800 border border-emerald-300';
    case 'ON_HOLD':
      return 'bg-rose-100 text-rose-700 border border-rose-200';
    default:
      return 'bg-gray-200 text-gray-700 border border-gray-300';
  }
}

function getStatusBadgeClasses(status: MockWorkOrder['status']): string {
  switch (status) {
    case 'PENDING':
      return 'bg-gray-100 text-gray-700';
    case 'IN_PROGRESS':
      return 'bg-amber-100 text-amber-700';
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-700';
    case 'ON_HOLD':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getStatusDotClasses(status: MockWorkOrder['status']): string {
  switch (status) {
    case 'PENDING':
      return 'bg-blue-500';
    case 'IN_PROGRESS':
      return 'bg-amber-500';
    case 'COMPLETED':
      return 'bg-emerald-500';
    case 'ON_HOLD':
      return 'bg-rose-500';
    default:
      return 'bg-gray-400';
  }
}

/* ─── Component ─── */
export default function ProductionSchedulePage() {
  const navigate = useNavigate();

  /* View state */
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [viewStartDate, setViewStartDate] = useState<Date>(() => {
    const today = new Date();
    return addDays(today, -2);
  });

  /* Filters */
  const [filters, setFilters] = useState<Filters>({
    workCenter: '',
    status: '',
    productionOrder: '',
  });

  /* Selected WO popup */
  const [selectedWO, setSelectedWO] = useState<MockWorkOrder | null>(null);

  const viewDays = getViewDays(viewMode);
  const dayWidth = 60;
  const totalWidth = viewDays * dayWidth;
  const today = new Date();

  const viewEndDate = addDays(viewStartDate, viewDays - 1);

  /* Build day array */
  const days = useMemo(() => {
    const arr: Date[] = [];
    for (let i = 0; i < viewDays; i++) {
      arr.push(addDays(viewStartDate, i));
    }
    return arr;
  }, [viewStartDate, viewDays]);

  /* Filtered WOs */
  const filteredWOs = useMemo(() => {
    return mockWorkOrders.filter((wo) => {
      if (filters.workCenter && wo.workCenterId !== filters.workCenter)
        return false;
      if (filters.status && wo.status !== filters.status) return false;
      if (
        filters.productionOrder &&
        wo.productionOrderId !== filters.productionOrder
      )
        return false;
      return true;
    });
  }, [filters]);

  /* WOs grouped by work center then machine */
  const getWOsForRow = useCallback(
    (workCenterId: string, machineId: string | null) => {
      return filteredWOs.filter(
        (wo) => wo.workCenterId === workCenterId && wo.machineId === machineId,
      );
    },
    [filteredWOs],
  );

  /* Calculate bar position */
  const calcBarStyle = useCallback(
    (wo: MockWorkOrder) => {
      const startOffset = daysBetween(viewStartDate, wo.plannedStartDate);
      const duration = daysBetween(wo.plannedStartDate, wo.plannedEndDate) + 1;
      const left = Math.max(0, startOffset * dayWidth);
      const width = Math.max(dayWidth, duration * dayWidth);
      return { left, width };
    },
    [viewStartDate, dayWidth],
  );

  /* Calculate utilization for a work center */
  const calcUtilization = useCallback(
    (wcId: string) => {
      const wos = filteredWOs.filter((wo) => wo.workCenterId === wcId);
      if (wos.length === 0) return 0;
      const totalPlannedMinutes = wos.reduce(
        (s, w) => s + (w.plannedTimeMinutes || 0),
        0,
      );
      const workingMinutesPerDay = 8 * 60;
      const availableMinutes = workingMinutesPerDay * viewDays;
      return Math.min(
        100,
        Math.round((totalPlannedMinutes / availableMinutes) * 100),
      );
    },
    [filteredWOs, viewDays],
  );

  /* Navigation */
  const goPrev = () => setViewStartDate((d) => addDays(d, -viewDays));
  const goNext = () => setViewStartDate((d) => addDays(d, viewDays));
  const goToday = () => setViewStartDate(addDays(new Date(), -2));
  const handleDateClick = useCallback((date: Date) => {
    setViewStartDate(date);
  }, []);

  /* PO lookup helper */
  const getPO = (poId: string) =>
    mockProductionOrders.find((p) => p.id === poId);

  /* Unique filter options */
  const poOptions = useMemo(() => {
    const map = new Map<string, string>();
    mockWorkOrders.forEach((wo) => {
      map.set(wo.productionOrderId, wo.productionOrderNumber);
    });
    return Array.from(map.entries());
  }, []);

  /* Active machines for a work center */
  const getMachines = (wcId: string) =>
    mockMachines.filter((m) => m.workCenterId === wcId);

  /* Clear filters */
  const clearFilters = () =>
    setFilters({ workCenter: '', status: '', productionOrder: '' });

  /* Row height */
  const rowHeight = 48;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        {/* ─── Header ─── */}
        <div className="px-6 pt-5 pb-3 bg-white border-b border-gray-200 shrink-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Production Schedule
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {formatDateIST(viewStartDate)} — {formatDateIST(viewEndDate)}
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* View mode toggle */}
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {(['week', '2weeks', 'month'] as ViewMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                      viewMode === m
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {m === 'week' && 'Week'}
                    {m === '2weeks' && '2 Weeks'}
                    {m === 'month' && 'Month'}
                  </button>
                ))}
              </div>

              {/* Date navigation */}
              <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={goPrev}
                  className="px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors cursor-pointer"
                  title="Previous"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                <button
                  onClick={goToday}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  Today
                </button>
                <button
                  onClick={goNext}
                  className="px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors cursor-pointer"
                  title="Next"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
              <input
                type="date"
                value={toInputDate(viewStartDate)}
                onChange={(e) => {
                  const d = new Date(e.target.value);
                  if (!isNaN(d.getTime())) setViewStartDate(d);
                }}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* ─── Filters ─── */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Work Center
              </label>
              <select
                value={filters.workCenter}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, workCenter: e.target.value }))
                }
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[160px]"
              >
                <option value="">All Work Centers</option>
                {mockWorkCenters.map((wc) => (
                  <option key={wc.id} value={wc.id}>
                    {wc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, status: e.target.value }))
                }
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Production Order
              </label>
              <select
                value={filters.productionOrder}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, productionOrder: e.target.value }))
                }
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
              >
                <option value="">All Orders</option>
                {poOptions.map(([id, num]) => (
                  <option key={id} value={id}>
                    {num}
                  </option>
                ))}
              </select>
            </div>

            {(filters.workCenter ||
              filters.status ||
              filters.productionOrder) && (
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* ─── Gantt Chart ─── */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <div className="relative overflow-x-auto flex-1">
            <div style={{ width: 200 + totalWidth }}>
              {/* Date header row */}
              <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200">
                <div className="w-[200px] shrink-0 sticky left-0 z-30 bg-white border-r border-gray-200 px-3 py-2 flex items-end">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Work Center
                  </span>
                </div>
                <div className="flex" style={{ width: totalWidth }}>
                  {days.map((d, i) => {
                    const isToday = isSameDay(d, today);
                    const weekend = isWeekend(d);
                    return (
                      <div
                        key={i}
                        onClick={() => handleDateClick(d)}
                        className={`shrink-0 text-center border-r border-gray-100 cursor-pointer hover:bg-blue-100 transition-colors ${
                          isToday ? 'bg-sky-50' : weekend ? 'bg-gray-50' : ''
                        }`}
                        style={{ width: dayWidth }}
                      >
                        <div className="text-[10px] text-gray-400 pt-1">
                          {dayShort(d)}
                        </div>
                        <div
                          className={`text-xs font-semibold pb-1 ${
                            isToday
                              ? 'text-sky-700'
                              : weekend
                                ? 'text-gray-400'
                                : 'text-gray-700'
                          }`}
                        >
                          {dayNum(d)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Work center rows */}
              {mockWorkCenters.map((wc) => {
                const machines = getMachines(wc.id);
                const wcWOs = getWOsForRow(wc.id, null);
                const hasMachines = machines.length > 0;
                const rowCount = hasMachines
                  ? machines.length + (wcWOs.length > 0 ? 1 : 0)
                  : 1;

                return (
                  <div key={wc.id} className="border-b border-gray-100">
                    {/* Work center label + machine sub-rows */}
                    {hasMachines ? (
                      <>
                        {/* Work center row — for WOs without machine */}
                        {wcWOs.length > 0 && (
                          <div className="flex" style={{ height: rowHeight }}>
                            <div className="w-[200px] shrink-0 sticky left-0 z-10 bg-white border-r border-gray-200 px-3 flex items-center">
                              <span className="text-sm font-semibold text-gray-800">
                                {wc.name}
                              </span>
                            </div>
                            <div
                              className="relative flex-1"
                              style={{ width: totalWidth }}
                            >
                              {wcWOs.map((wo) => {
                                const style = calcBarStyle(wo);
                                return (
                                  <button
                                    key={wo.id}
                                    onClick={() => setSelectedWO(wo)}
                                    className={`absolute top-1 h-9 rounded text-xs font-medium truncate flex items-center px-2 cursor-pointer hover:brightness-95 transition-all ${getStatusBarClasses(wo.status)}`}
                                    style={{
                                      left: style.left,
                                      width: style.width,
                                    }}
                                  >
                                    {wo.woNumber} — {wo.stageName}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Machine sub-rows */}
                        {machines.map((mc) => {
                          const mcWOs = getWOsForRow(wc.id, mc.id);
                          return (
                            <div
                              key={mc.id}
                              className="flex border-t border-gray-50"
                              style={{ height: rowHeight }}
                            >
                              <div className="w-[200px] shrink-0 sticky left-0 z-10 bg-white border-r border-gray-200 pl-6 pr-3 flex items-center">
                                <span className="text-xs text-gray-600">
                                  {mc.name}
                                </span>
                              </div>
                              <div
                                className="relative flex-1"
                                style={{ width: totalWidth }}
                              >
                                {mcWOs.map((wo) => {
                                  const style = calcBarStyle(wo);
                                  return (
                                    <button
                                      key={wo.id}
                                      onClick={() => setSelectedWO(wo)}
                                      className={`absolute top-1 h-9 rounded text-xs font-medium truncate flex items-center px-2 cursor-pointer hover:brightness-95 transition-all ${getStatusBarClasses(wo.status)}`}
                                      style={{
                                        left: style.left,
                                        width: style.width,
                                      }}
                                    >
                                      {wo.woNumber} — {wo.stageName}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      /* Simple work center row (no machines) */
                      <div className="flex" style={{ height: rowHeight }}>
                        <div className="w-[200px] shrink-0 sticky left-0 z-10 bg-white border-r border-gray-200 px-3 flex items-center">
                          <span className="text-sm font-semibold text-gray-800">
                            {wc.name}
                          </span>
                        </div>
                        <div
                          className="relative flex-1"
                          style={{ width: totalWidth }}
                        >
                          {wcWOs.map((wo) => {
                            const style = calcBarStyle(wo);
                            return (
                              <button
                                key={wo.id}
                                onClick={() => setSelectedWO(wo)}
                                className={`absolute top-1 h-9 rounded text-xs font-medium truncate flex items-center px-2 cursor-pointer hover:brightness-95 transition-all ${getStatusBarClasses(wo.status)}`}
                                style={{
                                  left: style.left,
                                  width: style.width,
                                }}
                              >
                                {wo.woNumber} — {wo.stageName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Capacity utilization bar */}
                    <div className="flex">
                      <div className="w-[200px] shrink-0 sticky left-0 z-10 bg-gray-50 border-r border-gray-200 px-3 py-1.5">
                        <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                          Utilization
                        </span>
                      </div>
                      <div
                        className="flex-1 px-2 py-1.5"
                        style={{ width: totalWidth }}
                      >
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          {(() => {
                            const pct = calcUtilization(wc.id);
                            let barColor = 'bg-emerald-500';
                            if (pct > 100) barColor = 'bg-rose-500';
                            else if (pct > 80) barColor = 'bg-amber-500';
                            return (
                              <div
                                className={`h-full rounded-full ${barColor} transition-all`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            );
                          })()}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {(() => {
                            const pct = calcUtilization(wc.id);
                            if (pct > 100) return `${pct}% — Overloaded`;
                            if (pct > 80) return `${pct}% — High load`;
                            return `${pct}%`;
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── Legend ─── */}
          <div className="px-6 py-2.5 bg-white border-t border-gray-200 shrink-0 flex flex-wrap items-center gap-4">
            <span className="text-xs font-medium text-gray-500">Legend:</span>
            {(
              [
                'PENDING',
                'IN_PROGRESS',
                'COMPLETED',
                'ON_HOLD',
              ] as MockWorkOrder['status'][]
            ).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${getStatusDotClasses(s)}`}
                />
                <span className="text-xs text-gray-600 capitalize">
                  {s.replace('_', ' ').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── WO Detail Popup ─── */}
      {selectedWO && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={() => setSelectedWO(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-[420px] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-gray-900">
                  {selectedWO.woNumber}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedWO.stageName}
                </p>
              </div>
              <button
                onClick={() => setSelectedWO(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {(() => {
                const po = getPO(selectedWO.productionOrderId);
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        Production Order
                      </span>
                      <span className="text-sm font-medium text-indigo-600">
                        {selectedWO.productionOrderNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Product</span>
                      <span className="text-sm text-gray-800 text-right">
                        {po ? (
                          <>
                            {po.productName}
                            {po.variantName && (
                              <span className="block text-xs text-gray-500">
                                {po.variantName}
                              </span>
                            )}
                          </>
                        ) : (
                          '—'
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Planned</span>
                      <span className="text-sm text-gray-800">
                        {formatDateIST(selectedWO.plannedStartDate)} →{' '}
                        {formatDateIST(selectedWO.plannedEndDate)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Machine</span>
                      <span className="text-sm text-gray-800">
                        {selectedWO.machineName || (
                          <span className="text-gray-400 italic">
                            Not assigned
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Quantity</span>
                      <span className="text-sm text-gray-800">
                        {selectedWO.completedQty}/{selectedWO.plannedQty} units
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getStatusBadgeClasses(selectedWO.status)}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${getStatusDotClasses(selectedWO.status)}`}
                        />
                        {selectedWO.status.replace('_', ' ')}
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => {
                  navigate(`/manufacturing/work-orders`);
                  setSelectedWO(null);
                }}
                className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                View Work Order
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
