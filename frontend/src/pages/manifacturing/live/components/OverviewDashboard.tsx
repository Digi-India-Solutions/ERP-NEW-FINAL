import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  mockMachines,
  mockWorkCenters,
  mockProductionEntries,
  mockDowntimeEntries,
  mockRejectionEntries,
  mockWorkOrders,
  mockProductionOrders,
  mockOperators,
  mockShifts,
} from '@/mocks/masters';
import { calculateOEE } from '@/utils/oeeCalculator';

const getCurrentPOForMachine = (machineId: string) => {
  const activeWO = mockWorkOrders.find(
    (wo) => wo.machineId === machineId && wo.status === 'IN_PROGRESS',
  );
  if (!activeWO) return null;
  const po = mockProductionOrders.find(
    (po) => po.id === activeWO.productionOrderId,
  );
  return { wo: activeWO, po };
};

const calculateETA = (wo: (typeof mockWorkOrders)[number]) => {
  const remaining = wo.plannedQty - wo.completedQty;
  const machine = mockMachines.find((m) => m.id === wo.machineId);
  const ratePerHour = machine?.capacityPerHour || 10;
  const minutesLeft = (remaining / ratePerHour) * 60;
  const eta = new Date();
  eta.setMinutes(eta.getMinutes() + minutesLeft);
  return eta.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

function getDashboardDate(): string {
  const actualToday = new Date().toISOString().split('T')[0];
  const hasDataToday = mockProductionEntries.some(
    (e) => e.date === actualToday,
  );
  if (hasDataToday) return actualToday;
  const dates = [...new Set(mockProductionEntries.map((e) => e.date))].sort();
  return dates[dates.length - 1] || actualToday;
}

function parseDateTime(dateStr: string, timeStr: string | null): Date {
  if (timeStr) {
    return new Date(`${dateStr}T${timeStr}:00`);
  }
  return new Date(`${dateStr}T00:00:00`);
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

const machineStatusColor = (status: string) => {
  switch (status) {
    case 'RUNNING':
      return 'bg-emerald-500';
    case 'IDLE':
      return 'bg-slate-400';
    case 'MAINTENANCE':
      return 'bg-amber-500';
    case 'BREAKDOWN':
      return 'bg-rose-500';
    default:
      return 'bg-slate-300';
  }
};

const machineStatusText = (status: string) => {
  switch (status) {
    case 'RUNNING':
      return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    case 'IDLE':
      return 'text-slate-600 bg-slate-50 border-slate-200';
    case 'MAINTENANCE':
      return 'text-amber-700 bg-amber-50 border-amber-200';
    case 'BREAKDOWN':
      return 'text-rose-700 bg-rose-50 border-rose-200';
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200';
  }
};

const oeeColorClass = (pct: number) => {
  if (pct >= 85) return 'text-emerald-600';
  if (pct >= 60) return 'text-amber-600';
  return 'text-rose-600';
};

const oeeBarColor = (pct: number) => {
  if (pct >= 85) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
};

interface ActivityItem {
  id: string;
  type: 'production' | 'downtime' | 'wo_complete';
  timestamp: Date;
  message: string;
  iconClass: string;
  iconColor: string;
}

export default function OverviewDashboard() {
  const navigate = useNavigate();
  const todayDate = useMemo(() => getDashboardDate(), []);

  // ── Summary Stats ──
  const summaryStats = useMemo(() => {
    const activeMachines = mockMachines.filter(
      (m) => m.status === 'RUNNING',
    ).length;

    const todayEntries = mockProductionEntries.filter(
      (e) => e.date === todayDate,
    );
    const totalProduced = todayEntries.reduce(
      (s, e) => s + e.producedQty + e.rejectedQty,
      0,
    );
    const totalRejected = todayEntries.reduce((s, e) => s + e.rejectedQty, 0);
    const rejectionRate =
      totalProduced > 0 ? Math.round((totalRejected / totalProduced) * 100) : 0;

    const todayProduced = todayEntries.reduce((s, e) => s + e.producedQty, 0);
    const activeDowntime = mockDowntimeEntries.filter(
      (d) => !d.isResolved,
    ).length;

    return {
      activeMachines,
      todayProduced,
      activeDowntime,
      rejectionRate,
      totalProduced,
      totalRejected,
    };
  }, [todayDate]);

  // ── Machine Status Data ──
  const machineData = useMemo(() => {
    return mockMachines.map((m) => {
      const wc = mockWorkCenters.find((w) => w.id === m.workCenterId);
      const todayEntries = mockProductionEntries.filter(
        (e) => e.machineId === m.id && e.date === todayDate,
      );
      const todayProduced = todayEntries.reduce((s, e) => s + e.producedQty, 0);
      const todayRejected = todayEntries.reduce((s, e) => s + e.rejectedQty, 0);
      const oee = calculateOEE(m.id, todayDate, 'all');

      // Find current work order (any status — shows on RUNNING machines in JSX)
      const currentJob = getCurrentPOForMachine(m.id);

      return {
        ...m,
        workCenterName: wc?.name ?? m.workCenterId,
        todayProduced,
        todayRejected,
        oeePct: oee.asPercent.oee,
        currentWO: currentJob?.wo ?? null,
        currentPO: currentJob?.po ?? null,
      };
    });
  }, [todayDate]);

  // ── Work Center Progress ──
  const workCenterProgress = useMemo(() => {
    return mockWorkCenters.map((wc) => {
      const wos = mockWorkOrders.filter((wo) => wo.workCenterId === wc.id);
      const totalWOs = wos.length;
      const completedWOs = wos.filter((wo) => wo.status === 'COMPLETED').length;
      const activeWOs = wos.filter((wo) => wo.status === 'IN_PROGRESS').length;
      const pct =
        totalWOs > 0 ? Math.round((completedWOs / totalWOs) * 100) : 0;
      return { ...wc, totalWOs, completedWOs, activeWOs, pct };
    });
  }, []);

  // ── Active Work Orders ──
  const activeWorkOrders = useMemo(() => {
    return mockWorkOrders.filter((wo) => wo.status === 'IN_PROGRESS');
  }, []);

  // ── Operator Performance ──
  const operatorPerformance = useMemo(() => {
    const todayEntries = mockProductionEntries.filter(
      (e) => e.date === todayDate,
    );
    const operatorIds = [...new Set(todayEntries.map((e) => e.operatorId))];

    return operatorIds.map((opId) => {
      const op = mockOperators.find((o) => o.id === opId);
      const entries = todayEntries.filter((e) => e.operatorId === opId);
      const produced = entries.reduce((s, e) => s + e.producedQty, 0);
      const rejected = entries.reduce((s, e) => s + e.rejectedQty, 0);

      // Target = sum of plannedQty for WOs this operator worked on today
      const woIds = [...new Set(entries.map((e) => e.workOrderId))];
      const target = woIds.reduce((s, woId) => {
        const wo = mockWorkOrders.find((w) => w.id === woId);
        return s + (wo?.plannedQty ?? 0);
      }, 0);

      const efficiency = target > 0 ? Math.round((produced / target) * 100) : 0;
      const shift = op ? mockShifts.find((s) => s.id === op.shiftId) : null;

      return {
        op,
        produced,
        rejected,
        target,
        efficiency,
        shiftName: shift?.name ?? '-',
        entryCount: entries.length,
      };
    });
  }, [todayDate]);

  // ── Activity Feed ──
  const activityFeed = useMemo(() => {
    const items: ActivityItem[] = [];

    // Production entries
    mockProductionEntries.forEach((e) => {
      items.push({
        id: `pe-${e.id}`,
        type: 'production',
        timestamp: parseDateTime(e.date, e.endTime),
        message: `${e.entryNumber}: ${e.operatorName} produced ${e.producedQty} ${e.unit} (${e.stageName})`,
        iconClass: 'ri-checkbox-circle-line',
        iconColor: 'text-emerald-600 bg-emerald-100',
      });
    });

    // Downtime entries
    mockDowntimeEntries.forEach((d) => {
      items.push({
        id: `dt-${d.id}`,
        type: 'downtime',
        timestamp: parseDateTime(d.date, d.startTime),
        message: `${d.entryNumber}: ${d.downtimeCodeName} \u2014 ${d.machineName}`,
        iconClass: d.isResolved ? 'ri-check-line' : 'ri-error-warning-line',
        iconColor: d.isResolved
          ? 'text-slate-600 bg-slate-100'
          : 'text-rose-600 bg-rose-100',
      });
    });

    // Work order completions
    mockWorkOrders
      .filter((wo) => wo.status === 'COMPLETED')
      .forEach((wo) => {
        // Find last production entry for this WO to get a time
        const lastEntry = mockProductionEntries
          .filter((e) => e.workOrderId === wo.id)
          .sort((a, b) => {
            const da = parseDateTime(a.date, a.endTime);
            const db = parseDateTime(b.date, b.endTime);
            return db.getTime() - da.getTime();
          })[0];
        const ts = lastEntry
          ? parseDateTime(lastEntry.date, lastEntry.endTime)
          : parseDateTime(wo.plannedEndDate, '08:00');
        items.push({
          id: `wo-${wo.id}`,
          type: 'wo_complete',
          timestamp: ts,
          message: `${wo.woNumber}: ${wo.stageName} COMPLETED`,
          iconClass: 'ri-flag-line',
          iconColor: 'text-indigo-600 bg-indigo-100',
        });
      });

    return items
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
  }, []);

  return (
    <div className="space-y-5">
      {/* ── SECTION 1: Factory Overview Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Machines */}
        <div className="bg-white border border-emerald-200 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100">
            <i className="ri-settings-3-line text-emerald-600 text-base" />
          </div>
          <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
            Active Machines
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {summaryStats.activeMachines}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5">
            of {mockMachines.length} machines running
          </div>
        </div>

        {/* Today's Production */}
        <div className="bg-white border border-sky-200 rounded-xl p-4 relative overflow-hidden">
          <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-sky-100">
            <i className="ri-box-3-line text-sky-600 text-base" />
          </div>
          <div className="text-xs text-sky-700 font-medium uppercase tracking-wide">
            Today's Production
          </div>
          <div className="text-2xl font-bold text-sky-700 mt-1">
            {summaryStats.todayProduced}
          </div>
          <div className="text-[11px] text-sky-600 mt-0.5">
            units produced today
          </div>
        </div>

        {/* Active Downtime */}
        <div
          className={`bg-white border rounded-xl p-4 relative overflow-hidden ${summaryStats.activeDowntime > 0 ? 'border-rose-200' : 'border-emerald-200'}`}
        >
          <div
            className={`absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full ${summaryStats.activeDowntime > 0 ? 'bg-rose-100' : 'bg-emerald-100'}`}
          >
            <i
              className={`text-base ${summaryStats.activeDowntime > 0 ? 'ri-error-warning-line text-rose-600' : 'ri-check-line text-emerald-600'}`}
            />
          </div>
          <div
            className={`text-xs font-medium uppercase tracking-wide ${summaryStats.activeDowntime > 0 ? 'text-rose-700' : 'text-emerald-700'}`}
          >
            Active Downtime
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${summaryStats.activeDowntime > 0 ? 'text-rose-700' : 'text-emerald-700'}`}
          >
            {summaryStats.activeDowntime}
          </div>
          <div
            className={`text-[11px] mt-0.5 ${summaryStats.activeDowntime > 0 ? 'text-rose-600' : 'text-emerald-600'}`}
          >
            {summaryStats.activeDowntime > 0
              ? 'machine(s) down'
              : 'all machines operational'}
          </div>
        </div>

        {/* Rejection Rate */}
        <div
          className={`bg-white border rounded-xl p-4 relative overflow-hidden ${summaryStats.rejectionRate === 0 ? 'border-emerald-200' : summaryStats.rejectionRate <= 2 ? 'border-amber-200' : 'border-rose-200'}`}
        >
          <div
            className={`absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full ${summaryStats.rejectionRate === 0 ? 'bg-emerald-100' : summaryStats.rejectionRate <= 2 ? 'bg-amber-100' : 'bg-rose-100'}`}
          >
            <i
              className={`text-base ${summaryStats.rejectionRate === 0 ? 'ri-shield-check-line text-emerald-600' : summaryStats.rejectionRate <= 2 ? 'ri-alert-line text-amber-600' : 'ri-error-warning-line text-rose-600'}`}
            />
          </div>
          <div
            className={`text-xs font-medium uppercase tracking-wide ${summaryStats.rejectionRate === 0 ? 'text-emerald-700' : summaryStats.rejectionRate <= 2 ? 'text-amber-700' : 'text-rose-700'}`}
          >
            Rejection Rate
          </div>
          <div
            className={`text-2xl font-bold mt-1 ${summaryStats.rejectionRate === 0 ? 'text-emerald-700' : summaryStats.rejectionRate <= 2 ? 'text-amber-700' : 'text-rose-700'}`}
          >
            {summaryStats.rejectionRate}%{' '}
            {summaryStats.rejectionRate === 0
              ? '\u2014 Excellent'
              : summaryStats.rejectionRate <= 2
                ? '\u2014 Acceptable'
                : '\u2014 High'}
          </div>
          <div
            className={`text-[11px] mt-0.5 ${summaryStats.rejectionRate === 0 ? 'text-emerald-600' : summaryStats.rejectionRate <= 2 ? 'text-amber-600' : 'text-rose-600'}`}
          >
            {summaryStats.todayRejected} of {summaryStats.totalProduced} units
            rejected
          </div>
        </div>
      </div>

      {/* ── SECTION 2: Machine Status Grid ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#1e293b]">Machine Status</h2>
          <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Running
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-400" /> Idle
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Maint
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Down
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-3 p-4">
          {machineData.map((m) => (
            <div
              key={m.id}
              className="border border-slate-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-bold text-[#1e293b]">
                    {m.name}
                  </div>
                  <div className="text-[11px] text-[#64748b]">
                    {m.workCenterName}
                  </div>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${machineStatusText(m.status)}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${machineStatusColor(m.status)}`}
                  />
                  {m.status}
                </span>
              </div>

              {m.status === 'RUNNING' && m.currentWO && m.currentPO && (
                <div className="mb-2 p-2 bg-slate-50 rounded-md border border-slate-100">
                  <div className="text-[11px] font-medium text-[#475569]">
                    {m.currentPO.poNumber} &mdash; Stage{' '}
                    {m.currentWO.stageNumber}: {m.currentWO.stageName}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${Math.min(100, m.currentWO.plannedQty > 0 ? (m.currentWO.completedQty / m.currentWO.plannedQty) * 100 : 0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-[#64748b] whitespace-nowrap">
                      {m.currentWO.completedQty}/{m.currentWO.plannedQty}
                    </span>
                  </div>
                </div>
              )}

              {m.status === 'RUNNING' && !m.currentWO && (
                <p className="text-xs text-[#94a3b8] mt-1 mb-2">
                  No active work order
                </p>
              )}

              <div className="flex items-center justify-between text-[11px] text-[#475569] mb-2">
                <span>
                  Today: <strong>{m.todayProduced}</strong>{' '}
                  {m.todayProduced === 1 ? 'unit' : 'units'}
                </span>
                {m.todayRejected > 0 && (
                  <span className="text-rose-600">
                    {m.todayRejected} rejected
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${oeeBarColor(m.oeePct)}`}
                    style={{ width: `${m.oeePct}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-bold whitespace-nowrap ${oeeColorClass(m.oeePct)}`}
                >
                  OEE: {m.oeePct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: Work Center Progress ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-[#1e293b]">
            Work Center Progress
          </h2>
        </div>
        <div className="p-4 space-y-3">
          {workCenterProgress.map((wc) => (
            <div key={wc.id} className="flex items-center gap-4">
              <div className="w-32 shrink-0">
                <div className="text-xs font-medium text-[#1e293b]">
                  {wc.name}
                </div>
                <div className="text-[10px] text-[#64748b]">
                  {wc.activeWOs} WO{wc.activeWOs !== 1 ? 's' : ''} active
                </div>
              </div>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${wc.pct >= 100 ? 'bg-emerald-500' : wc.pct >= 60 ? 'bg-amber-500' : 'bg-sky-500'}`}
                  style={{ width: `${Math.min(100, wc.pct)}%` }}
                />
              </div>
              <div className="w-12 text-right">
                <span className="text-xs font-bold text-[#475569]">
                  {wc.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SECTION 4 & 5: Two column — Active WOs + Operator Performance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Active Work Orders */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-[#1e293b]">
              Active Work Orders
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                    WO Number
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                    PO
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                    Machine
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                    Operator
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="text-left px-4 py-2.5 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                    ETA
                  </th>
                </tr>
              </thead>
              <tbody>
                {activeWorkOrders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-xs text-[#94a3b8]"
                    >
                      No active work orders right now
                    </td>
                  </tr>
                ) : (
                  activeWorkOrders.map((wo) => {
                    const po = mockProductionOrders.find(
                      (p) => p.id === wo.productionOrderId,
                    );
                    return (
                      <tr
                        key={wo.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs font-semibold text-[#1e293b]">
                          {wo.woNumber}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[#475569]">
                          {po?.poNumber || '\u2014'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[#475569]">
                          {wo.stageNumber}: {wo.stageName}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[#475569]">
                          {wo.machineName || '\u2014'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[#475569]">
                          {wo.operatorName || '\u2014'}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[#475569]">
                          {wo.completedQty}/{wo.plannedQty}
                        </td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-[#475569]">
                          {calculateETA(wo)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operator Performance */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <h2 className="text-sm font-bold text-[#1e293b]">
              Operator Performance &mdash; Today
            </h2>
          </div>
          <div className="p-4 space-y-3">
            {operatorPerformance.length > 0 ? (
              operatorPerformance.map((op) => (
                <div
                  key={op.op?.id}
                  className="border border-slate-200 rounded-lg p-3 flex items-center gap-3"
                >
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 shrink-0">
                    <i className="ri-user-line text-slate-500 text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1e293b]">
                        {op.op?.name ?? 'Unknown'}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200 uppercase">
                        {op.op?.skill ?? '-'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748b] mt-0.5">
                      Shift: {op.shiftName} &bull; {op.entryCount} entries
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-[#475569]">
                      <strong>{op.produced}</strong> produced
                      {op.rejected > 0 && (
                        <span className="text-rose-600">
                          {' '}
                          / {op.rejected} rejected
                        </span>
                      )}
                    </div>
                    <div className="mt-1">
                      <span
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${
                          op.efficiency >= 100
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : op.efficiency >= 80
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {op.efficiency >= 100
                          ? 'On Target'
                          : op.efficiency >= 80
                            ? 'Below Target'
                            : 'Needs Attention'}{' '}
                        ({op.efficiency}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-xs text-[#94a3b8]">
                No operator entries for today
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 6: Recent Activity Feed ── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-[#1e293b]">Recent Activity</h2>
        </div>
        <div className="p-4">
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-3.5 top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-4">
              {activityFeed.map((item) => (
                <div
                  key={item.id}
                  className="relative flex items-start gap-3 pl-1"
                >
                  <div
                    className={`relative z-10 w-7 h-7 flex items-center justify-center rounded-full shrink-0 ${item.iconColor}`}
                  >
                    <i className={`${item.iconClass} text-xs`} />
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-xs text-[#475569]">{item.message}</div>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">
                      {formatTime(item.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Floating Action Buttons ── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
        <button
          onClick={() => navigate('/manufacturing/shop-floor')}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1e293b] text-white rounded-full shadow-lg hover:bg-[#334155] transition-colors text-xs font-medium"
        >
          <i className="ri-add-line" />
          Log Production
        </button>
        <button
          onClick={() => navigate('/manufacturing/downtime')}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-full shadow-lg hover:bg-rose-700 transition-colors text-xs font-medium"
        >
          <i className="ri-time-line" />
          Log Downtime
        </button>
      </div>
    </div>
  );
}
