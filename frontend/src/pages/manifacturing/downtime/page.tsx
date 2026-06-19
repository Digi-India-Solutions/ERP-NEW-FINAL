import { useState, useMemo, useEffect, useCallback } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { useWarehouseStore } from '@/stores/warehouseStore';
import {
  createDowntimeEntry,
  getAllDowntimeEntries,
  updateDowntimeEntry,
  resolveDowntimeEntry,
  deleteDowntimeEntry,
  mapToFrontend,
  type MockDowntimeEntry,
} from '@/api/downtime.api';
import { getAllMachines } from '@/api/machine.api';
import { getAllDowntimeCodes } from '@/api/downtimecode.api';
import { getAllShifts } from '@/api/shift.api';
import { getAllOperators } from '@/api/operator.api';
import { getAllProductionOrders } from '@/api/productionOrder.api';
import { getAllWorkCenters } from '@/api/workcenter.api';

interface LogForm {
  machineId: string;
  downtimeCodeId: string;
  date: string;
  startTime: string;
  productionOrderId: string;
  shiftId: string;
  operatorId: string;
  description: string;
}

interface ResolveForm {
  endTime: string;
  resolvedBy: string;
  notes: string;
}

function timeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function nowHHMM(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

const emptyLog = (): LogForm => ({
  machineId: '',
  downtimeCodeId: '',
  date: new Date().toISOString().split('T')[0],
  startTime: nowHHMM(),
  productionOrderId: '',
  shiftId: '',
  operatorId: '',
  description: '',
});

const emptyResolve = (): ResolveForm => ({
  endTime: '',
  resolvedBy: '',
  notes: '',
});

const categoryStyles: Record<string, string> = {
  BREAKDOWN: 'bg-rose-50 text-rose-700 border-rose-200',
  PLANNED: 'bg-sky-50 text-sky-700 border-sky-200',
  MATERIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  POWER: 'bg-orange-50 text-orange-700 border-orange-200',
  OPERATOR: 'bg-slate-50 text-slate-600 border-slate-200',
  SETUP: 'bg-purple-50 text-purple-700 border-purple-200',
  OTHER: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function DowntimeEntryPage() {
  const toast = useToast();
  const { selectedWarehouseId } = useWarehouseStore();

  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [machineFilter, setMachineFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'RESOLVED'>('ALL');

  const [showLogSlideOver, setShowLogSlideOver] = useState(false);
  const [logForm, setLogForm] = useState<LogForm>(emptyLog());
  const [logError, setLogError] = useState<string | null>(null);

  const [showResolveSlideOver, setShowResolveSlideOver] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveForm, setResolveForm] = useState<ResolveForm>(emptyResolve());
  const [resolveError, setResolveError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);

  // Dynamic API Data States
  const [downtimeEntries, setDowntimeEntries] = useState<MockDowntimeEntry[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [downtimeCodes, setDowntimeCodes] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        entriesRes,
        machinesRes,
        codesRes,
        shiftsRes,
        operatorsRes,
        poRes,
      ] = await Promise.all([
        getAllDowntimeEntries(selectedWarehouseId || undefined),
        getAllMachines(),
        getAllDowntimeCodes(),
        getAllShifts(),
        getAllOperators(),
        getAllProductionOrders(),
      ]);

      if (entriesRes.success && entriesRes.data) {
        setDowntimeEntries(entriesRes.data.map(mapToFrontend));
      }
      if (machinesRes.success && machinesRes.data) {
        setMachines(machinesRes.data);
      }
      if (codesRes.success && codesRes.data) {
        setDowntimeCodes(codesRes.data);
      }
      if (shiftsRes.success && shiftsRes.data) {
        setShifts(shiftsRes.data);
      }
      if (operatorsRes.success && operatorsRes.data) {
        setOperators(operatorsRes.data);
      }
      if (poRes.success && poRes.data) {
        setProductionOrders(poRes.data);
      }
    } catch (err: any) {
      console.error("Error loading downtime page data:", err);
      toast.error("Failed to load page data");
    } finally {
      setIsLoading(false);
    }
  }, [selectedWarehouseId, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeDowntimes = useMemo(
    () => downtimeEntries.filter((d) => !d.isResolved),
    [downtimeEntries],
  );

  const activePOs = useMemo(
    () => productionOrders.filter((po) => po.status === 'IN_PROGRESS' || po.status === 'DRAFT' || po.status === 'PLANNED'),
    [productionOrders],
  );

  const selectedCode = useMemo(
    () =>
      downtimeCodes.find((c) => c.id === logForm.downtimeCodeId) || null,
    [logForm.downtimeCodeId, downtimeCodes],
  );

  const filtered = useMemo(() => {
    return downtimeEntries.filter((d) => {
      if (dateFrom && new Date(d.date) < new Date(dateFrom)) return false;
      if (dateTo && new Date(d.date) > new Date(dateTo)) return false;
      if (machineFilter !== 'ALL' && d.machineId !== machineFilter)
        return false;
      if (categoryFilter !== 'ALL' && d.category !== categoryFilter)
        return false;
      if (statusFilter === 'ACTIVE' && d.isResolved) return false;
      if (statusFilter === 'RESOLVED' && !d.isResolved) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          d.entryNumber.toLowerCase().includes(q) ||
          d.machineName.toLowerCase().includes(q) ||
          d.downtimeCodeName.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q) ||
          d.workCenterName.toLowerCase().includes(q) ||
          (d.description?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });
  }, [
    downtimeEntries,
    search,
    dateFrom,
    dateTo,
    machineFilter,
    categoryFilter,
    statusFilter,
  ]);

  const stats = useMemo(() => {
    const total = downtimeEntries.length;
    const active = downtimeEntries.filter((d) => !d.isResolved).length;
    const resolved = total - active;
    const totalMinutes = downtimeEntries.reduce(
      (s, d) => s + (d.durationMinutes || 0),
      0,
    );
    return { total, active, resolved, totalMinutes };
  }, [downtimeEntries]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setDateFrom('');
    setDateTo('');
    setMachineFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
  }, []);

  const hasFilters =
    search ||
    dateFrom ||
    dateTo ||
    machineFilter !== 'ALL' ||
    categoryFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  const openLog = () => {
    setEditingId(null);
    setLogForm(emptyLog());
    setLogError(null);
    setShowLogSlideOver(true);
  };

  const openResolve = (id: string) => {
    setResolvingId(id);
    setResolveForm(emptyResolve());
    setResolveError(null);
    setShowResolveSlideOver(true);
  };

  const openEdit = (entry: MockDowntimeEntry) => {
    setEditingId(entry.id);
    setLogForm({
      machineId: entry.machineId,
      downtimeCodeId: entry.downtimeCodeId,
      date: entry.date,
      startTime: entry.startTime,
      productionOrderId: entry.productionOrderId ?? '',
      shiftId: entry.shiftId,
      operatorId: entry.operatorId,
      description: entry.description ?? '',
    });
    setLogError(null);
    setShowLogSlideOver(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this downtime entry?")) return;
    try {
      const res = await deleteDowntimeEntry(id);
      if (res.success) {
        toast.success(res.message || 'Downtime deleted successfully');
        loadData();
      } else {
        toast.error(res.message || 'Failed to delete downtime');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete downtime');
    }
  };

  const handleSaveResolve = async () => {
    if (!resolveForm.endTime) return setResolveError('End Time is required');
    const entry = downtimeEntries.find((d) => d.id === resolvingId);
    if (!entry) return setResolveError('Entry not found');

    const duration =
      timeToMinutes(resolveForm.endTime) - timeToMinutes(entry.startTime);
    if (duration <= 0)
      return setResolveError('End Time must be after Start Time');

    try {
      const res = await resolveDowntimeEntry(resolvingId!, {
        endTime: resolveForm.endTime,
        resolvedBy: resolveForm.resolvedBy || 'System',
        notes: resolveForm.notes,
      });

      if (res.success) {
        toast.success(res.message || 'Downtime resolved successfully');
        setShowResolveSlideOver(false);
        setResolvingId(null);
        setResolveForm(emptyResolve());
        loadData();
      } else {
        setResolveError(res.message || 'Failed to resolve downtime');
      }
    } catch (err: any) {
      setResolveError(err.message || 'Failed to resolve downtime');
    }
  };

  const handleSaveLog = async () => {
    if (!logForm.machineId) return setLogError('Machine is required');
    if (!logForm.downtimeCodeId)
      return setLogError('Downtime Code is required');
    if (!logForm.date) return setLogError('Date is required');
    if (!logForm.startTime) return setLogError('Start Time is required');
    if (!logForm.shiftId) return setLogError('Shift is required');
    if (!logForm.operatorId) return setLogError('Operator is required');

    const machine = machines.find((m) => m.id === logForm.machineId);
    const code = downtimeCodes.find((c) => c.id === logForm.downtimeCodeId);
    const shift = shifts.find((s) => s.id === logForm.shiftId);
    const operator = operators.find((o) => o.id === logForm.operatorId);

    if (!machine || !code || !shift || !operator) {
      return setLogError('Invalid selection');
    }

    try {
      if (editingId) {
        const res = await updateDowntimeEntry(editingId, {
          machineId: logForm.machineId,
          downtimeCodeId: logForm.downtimeCodeId,
          date: logForm.date,
          startTime: logForm.startTime,
          productionOrderId: logForm.productionOrderId || null,
          shiftId: logForm.shiftId,
          operatorId: logForm.operatorId,
          description: logForm.description,
          warehouseId: selectedWarehouseId,
        });

        if (res.success) {
          toast.success(res.message || 'Downtime updated successfully');
          setShowLogSlideOver(false);
          setEditingId(null);
          setLogForm(emptyLog());
          loadData();
        } else {
          setLogError(res.message || 'Failed to update downtime');
        }
      } else {
        const res = await createDowntimeEntry({
          machineId: logForm.machineId,
          downtimeCodeId: logForm.downtimeCodeId,
          date: logForm.date,
          startTime: logForm.startTime,
          productionOrderId: logForm.productionOrderId || null,
          shiftId: logForm.shiftId,
          operatorId: logForm.operatorId,
          description: logForm.description,
          warehouseId: selectedWarehouseId,
        });

        if (res.success) {
          toast.success(res.message || 'Downtime logged successfully');
          setShowLogSlideOver(false);
          setEditingId(null);
          setLogForm(emptyLog());
          loadData();
        } else {
          setLogError(res.message || 'Failed to log downtime');
        }
      }
    } catch (err: any) {
      setLogError(err.message || 'Failed to save downtime');
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    downtimeEntries.forEach((d) => set.add(d.category));
    return Array.from(set);
  }, [downtimeEntries]);

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8fafc] py-6 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">
                Machine Downtime
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5">
                {stats.total} downtime events logged
              </p>
            </div>
            <button
              onClick={openLog}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" />
              Log Downtime
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100">
                <i className="ri-alarm-warning-line text-indigo-600 text-base" />
              </div>
              <div className="text-xs text-indigo-700 font-medium uppercase tracking-wide">
                Total Events
              </div>
              <div className="text-2xl font-bold text-indigo-700 mt-1">
                {stats.total}
              </div>
            </div>
            <div className="bg-white border border-rose-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-rose-100">
                <i className="ri-pulse-line text-rose-600 text-base" />
              </div>
              <div className="text-xs text-rose-700 font-medium uppercase tracking-wide">
                Active Down
              </div>
              <div className="text-2xl font-bold text-rose-700 mt-1">
                {stats.active}
              </div>
            </div>
            <div className="bg-white border border-emerald-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100">
                <i className="ri-check-double-line text-emerald-600 text-base" />
              </div>
              <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
                Resolved
              </div>
              <div className="text-2xl font-bold text-emerald-700 mt-1">
                {stats.resolved}
              </div>
            </div>
            <div className="bg-white border border-amber-200 rounded-xl p-4 relative overflow-hidden">
              <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-amber-100">
                <i className="ri-time-line text-amber-600 text-base" />
              </div>
              <div className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                Total Downtime
              </div>
              <div className="text-2xl font-bold text-amber-700 mt-1">
                {stats.totalMinutes} min
              </div>
            </div>
          </div>

          {/* Active Alerts */}
          {activeDowntimes.length > 0 && (
            <div className="mb-5 space-y-2">
              {activeDowntimes.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200"
                >
                  <div className="flex items-center gap-2 text-sm text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="font-semibold">
                      {d.machineName} — {d.downtimeCodeName} since {d.startTime}
                    </span>
                  </div>
                  <button
                    onClick={() => openResolve(d.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-check-line mr-1" />
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Filters */}
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
                      placeholder="Search by entry, machine, reason..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={machineFilter}
                    onChange={(e) => setMachineFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                  >
                    <option value="ALL">All Machines</option>
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                  >
                    <option value="ALL">All Categories</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as typeof statusFilter)
                    }
                    className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#64748b] font-medium">
                  Date:
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
                {hasFilters && (
                  <button
                    onClick={clearFilters}
                    className="ml-auto text-xs text-[#64748b] hover:text-[#1e293b] cursor-pointer underline"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Entry #
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Machine
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Work Center
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Category
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Reason
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Start
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      End
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      Duration
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                      PO Ref
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
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-sm text-[#94a3b8]"
                      >
                        Loading downtime entries...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-sm text-[#94a3b8]"
                      >
                        <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 mb-3">
                          <i className="ri-inbox-line text-xl text-slate-300" />
                        </div>
                        No downtime entries match your filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map((d) => (
                      <tr
                        key={d.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm font-semibold text-[#4f46e5]">
                            {d.entryNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e293b]">
                          {d.machineName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                          {d.workCenterName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                              categoryStyles[d.category] || categoryStyles.OTHER
                            }`}
                          >
                            {d.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569] max-w-[200px] truncate">
                          {d.downtimeCodeName}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                          {d.startTime}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                          {d.endTime ?? '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                          {d.durationMinutes !== null
                            ? `${d.durationMinutes} min`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                          {productionOrders.find(p => p.id === d.productionOrderId)?.po_number ?? d.productionOrderId ?? '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {d.isResolved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <i className="ri-check-line" /> Resolved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-50 text-rose-700 border-rose-200">
                              <i className="ri-pulse-line" /> Active
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {!d.isResolved && (
                              <button
                                onClick={() => openResolve(d.id)}
                                className="px-2 py-1 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                title="Resolve"
                              >
                                <i className="ri-check-line" />
                              </button>
                            )}
                            <button
                              onClick={() => openEdit(d)}
                              className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                              title="Edit"
                            >
                              <i className="ri-edit-line" />
                            </button>
                            <button
                              onClick={() => handleDelete(d.id)}
                              className="px-2 py-1 text-[11px] font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                              title="Delete"
                            >
                              <i className="ri-delete-bin-line" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-[#64748b]">
                Showing {filtered.length} of {downtimeEntries.length} entries
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Log Downtime Slide-over */}
      {showLogSlideOver && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowLogSlideOver(false)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#1e293b]">
                {editingId ? 'Edit Downtime' : 'Log Downtime'}
              </h2>
              <button
                onClick={() => setShowLogSlideOver(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {logError && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {logError}
                </div>
              )}

              {/* Machine */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Machine <span className="text-rose-500">*</span>
                </label>
                <select
                  value={logForm.machineId}
                  onChange={(e) =>
                    setLogForm((p) => ({ ...p, machineId: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Machine</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} [{m.status}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Downtime Code */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Downtime Code <span className="text-rose-500">*</span>
                </label>
                <select
                  value={logForm.downtimeCodeId}
                  onChange={(e) =>
                    setLogForm((p) => ({
                      ...p,
                      downtimeCodeId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Reason Code</option>
                  {downtimeCodes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.description}
                    </option>
                  ))}
                </select>
                {selectedCode && (
                  <div className="mt-1.5">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                        categoryStyles[selectedCode.category] ||
                        categoryStyles.OTHER
                      }`}
                    >
                      {selectedCode.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Date + Start Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={logForm.date}
                    onChange={(e) =>
                      setLogForm((p) => ({ ...p, date: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={logForm.startTime}
                    onChange={(e) =>
                      setLogForm((p) => ({ ...p, startTime: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                </div>
              </div>

              {/* Production Order */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Production Order
                </label>
                <select
                  value={logForm.productionOrderId}
                  onChange={(e) =>
                    setLogForm((p) => ({
                      ...p,
                      productionOrderId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">None (optional)</option>
                  {activePOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number || po.poNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Shift <span className="text-rose-500">*</span>
                </label>
                <select
                  value={logForm.shiftId}
                  onChange={(e) =>
                    setLogForm((p) => ({ ...p, shiftId: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Shift</option>
                  {shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time} – {s.end_time})
                    </option>
                  ))}
                </select>
              </div>

              {/* Operator */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Operator <span className="text-rose-500">*</span>
                </label>
                <select
                  value={logForm.operatorId}
                  onChange={(e) =>
                    setLogForm((p) => ({ ...p, operatorId: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Operator</option>
                  {operators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Description
                </label>
                <textarea
                  value={logForm.description}
                  onChange={(e) =>
                    setLogForm((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 resize-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowLogSlideOver(false)}
                className="px-4 py-2 text-sm font-medium text-[#475569] border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLog}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                {editingId ? 'Update' : 'Log Downtime'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Slide-over */}
      {showResolveSlideOver && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowResolveSlideOver(false)}
          />
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#1e293b]">
                Resolve Downtime
              </h2>
              <button
                onClick={() => setShowResolveSlideOver(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {resolveError && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {resolveError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  End Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  value={resolveForm.endTime}
                  onChange={(e) =>
                    setResolveForm((p) => ({ ...p, endTime: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Resolved By
                </label>
                <input
                  type="text"
                  value={resolveForm.resolvedBy}
                  onChange={(e) =>
                    setResolveForm((p) => ({
                      ...p,
                      resolvedBy: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={resolveForm.notes}
                  onChange={(e) =>
                    setResolveForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 resize-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowResolveSlideOver(false)}
                className="px-4 py-2 text-sm font-medium text-[#475569] border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveResolve}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 cursor-pointer"
              >
                Resolve
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
