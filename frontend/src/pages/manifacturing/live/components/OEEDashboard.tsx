import { useState, useMemo } from 'react';
import { calculateOEE, type OEEResult } from '@/utils/oeeCalculator';
import { mockMachines, mockWorkCenters, mockShifts } from '@/mocks/masters';

function getOEEBarColor(pct: number): string {
  if (pct >= 85) return 'bg-emerald-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-rose-500';
}

function getOEETextColor(pct: number): string {
  if (pct >= 85) return 'text-emerald-700';
  if (pct >= 60) return 'text-amber-700';
  return 'text-rose-700';
}

function getOEEStatusLabel(pct: number): string {
  if (pct >= 85) return 'World Class';
  if (pct >= 60) return 'Good';
  return 'Needs Improvement';
}

function getStatusDot(status: string): string {
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
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function ProgressBar({ pct, colorClass }: { pct: number; colorClass: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function MachineOEECard({
  machine,
  oee,
  last7Days,
  shiftId,
}: {
  machine: (typeof mockMachines)[number];
  oee: OEEResult;
  last7Days: string[];
  shiftId: string;
}) {
  const workCenter = mockWorkCenters.find(
    (wc) => wc.id === machine.workCenterId,
  );
  const oeeColor = getOEEBarColor(oee.asPercent.oee);
  const oeeText = getOEETextColor(oee.asPercent.oee);
  const trend = last7Days.map(
    (day) => calculateOEE(machine.id, day, shiftId).asPercent.oee,
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold text-[#1e293b]">{machine.name}</div>
          <div className="text-xs text-[#64748b]">
            {workCenter?.name ?? machine.workCenterId}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${getStatusDot(machine.status)}`}
          />
          <span className="text-[11px] font-medium text-[#475569]">
            {machine.status}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-2xl font-bold ${oeeText}`}>
          {oee.asPercent.oee}%
        </span>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border bg-slate-50 text-slate-600 border-slate-200">
          {getOEEStatusLabel(oee.asPercent.oee)}
        </span>
      </div>
      <ProgressBar pct={oee.asPercent.oee} colorClass={oeeColor} />

      <div className="space-y-2 mt-1">
        <div>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-[#475569]">Availability</span>
            <span className="font-semibold text-[#1e293b]">
              {oee.asPercent.availability}%
            </span>
          </div>
          <ProgressBar
            pct={oee.asPercent.availability}
            colorClass={getOEEBarColor(oee.asPercent.availability)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-[#475569]">Performance</span>
            <span className="font-semibold text-[#1e293b]">
              {oee.asPercent.performance}%
            </span>
          </div>
          <ProgressBar
            pct={oee.asPercent.performance}
            colorClass={getOEEBarColor(oee.asPercent.performance)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between text-xs mb-0.5">
            <span className="text-[#475569]">Quality</span>
            <span className="font-semibold text-[#1e293b]">
              {oee.asPercent.quality}%
            </span>
          </div>
          <ProgressBar
            pct={oee.asPercent.quality}
            colorClass={getOEEBarColor(oee.asPercent.quality)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[#475569] pt-2 border-t border-slate-100">
        <span>
          Produced:{' '}
          <strong className="text-[#1e293b]">{oee.producedQty} Pcs</strong>
        </span>
        <span>
          Rejected: <strong className="text-rose-600">{oee.rejectedQty}</strong>
        </span>
      </div>
      <div className="text-xs text-[#475569]">
        Downtime:{' '}
        <strong className="text-[#1e293b]">{oee.downtimeMinutes} min</strong>
      </div>

      {/* 7-day mini trend */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[11px] font-medium text-[#64748b] mb-1.5">
          Last 7 Days
        </div>
        <div className="flex items-end gap-1 h-12">
          {trend.map((pct, idx) => (
            <div
              key={last7Days[idx]}
              className={`flex-1 rounded-t ${getOEEBarColor(pct)} min-w-[8px]`}
              style={{ height: `${Math.max(4, pct)}%` }}
              title={`${last7Days[idx]}: ${pct}%`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-1">
          {last7Days.map((day) => (
            <span
              key={day}
              className="flex-1 text-center text-[9px] text-[#94a3b8]"
            >
              {formatShortDate(day)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OEEDashboard() {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [selectedShift, setSelectedShift] = useState('all');

  const last7Days = useMemo(() => {
    const date = new Date(selectedDate + 'T00:00:00');
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(date);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, [selectedDate]);

  const machineOEEData = useMemo(() => {
    return mockMachines.map((m) => ({
      machine: m,
      oee: calculateOEE(m.id, selectedDate, selectedShift),
    }));
  }, [selectedDate, selectedShift]);

  const workCenterSummaries = useMemo(() => {
    return mockWorkCenters.map((wc) => {
      const machinesInWC = machineOEEData.filter(
        (d) => d.machine.workCenterId === wc.id,
      );
      const avgOEE =
        machinesInWC.length > 0
          ? machinesInWC.reduce((s, d) => s + d.oee.oee, 0) /
            machinesInWC.length
          : 0;
      const totalProduced = machinesInWC.reduce(
        (s, d) => s + d.oee.producedQty,
        0,
      );
      const totalRejected = machinesInWC.reduce(
        (s, d) => s + d.oee.rejectedQty,
        0,
      );
      const totalDowntime = machinesInWC.reduce(
        (s, d) => s + d.oee.downtimeMinutes,
        0,
      );
      return {
        workCenter: wc,
        avgOEE,
        machinesInWC,
        totalProduced,
        totalRejected,
        totalDowntime,
      };
    });
  }, [machineOEEData]);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#475569]">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#475569]">Shift</label>
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-slate-200 bg-white"
          >
            <option value="all">All Shifts</option>
            {mockShifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Work Center Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {workCenterSummaries.map((wc) => {
          const pct = Math.round(wc.avgOEE * 100);
          const color = getOEEBarColor(pct);
          const textColor = getOEETextColor(pct);
          return (
            <div
              key={wc.workCenter.id}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-[#1e293b]">
                  {wc.workCenter.name}
                </span>
                <span className={`text-lg font-bold ${textColor}`}>{pct}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-[#64748b]">Machines</div>
                  <div className="text-sm font-semibold text-[#1e293b]">
                    {wc.machinesInWC.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Produced</div>
                  <div className="text-sm font-semibold text-[#1e293b]">
                    {wc.totalProduced}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#64748b]">Downtime</div>
                  <div className="text-sm font-semibold text-[#1e293b]">
                    {wc.totalDowntime}m
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Machine OEE Cards */}
      <div>
        <h2 className="text-sm font-bold text-[#1e293b] mb-3">Machine OEE</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {machineOEEData.map((d) => (
            <MachineOEECard
              key={d.machine.id}
              machine={d.machine}
              oee={d.oee}
              last7Days={last7Days}
              shiftId={selectedShift}
            />
          ))}
        </div>
      </div>

      {/* OEE Summary Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="text-sm font-bold text-[#1e293b]">OEE Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                  Machine
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                  Work Center
                </th>
                <th className="text-right px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                  Availability
                </th>
                <th className="text-right px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                  Performance
                </th>
                <th className="text-right px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                  Quality
                </th>
                <th className="text-right px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                  OEE
                </th>
                <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {machineOEEData.map((d) => {
                const wc = mockWorkCenters.find(
                  (w) => w.id === d.machine.workCenterId,
                );
                const oeePct = d.oee.asPercent.oee;
                return (
                  <tr
                    key={d.machine.id}
                    className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${getStatusDot(d.machine.status)}`}
                        />
                        <span className="text-sm font-medium text-[#1e293b]">
                          {d.machine.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                      {wc?.name ?? d.machine.workCenterId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-semibold text-[#1e293b]">
                      {d.oee.asPercent.availability}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-semibold text-[#1e293b]">
                      {d.oee.asPercent.performance}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-semibold text-[#1e293b]">
                      {d.oee.asPercent.quality}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <span
                        className={`text-xs font-bold ${getOEETextColor(oeePct)}`}
                      >
                        {oeePct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                          d.machine.status === 'RUNNING'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : d.machine.status === 'BREAKDOWN'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : d.machine.status === 'MAINTENANCE'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {d.machine.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
