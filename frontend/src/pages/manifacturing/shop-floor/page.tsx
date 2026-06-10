import { useState, useMemo, useCallback } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import {
  mockProductionEntries,
  mockProductionOrders,
  mockWorkOrders,
  mockMachines,
  mockOperators,
  mockShifts,
  mockWorkCenters,
  mockRejectionCodes,
  mockRejectionEntries,
  mockRoutings,
  mockInspectionChecklists,
  mockItems,
  type MockProductionEntry,
  type MockRejectionEntry,
} from '@/mocks/masters';
import { mockInspections, calcSampleQty } from '@/mocks/qms';

interface FormState {
  productionOrderId: string;
  workOrderId: string;
  date: string;
  shiftId: string;
  operatorId: string;
  machineId: string;
  startTime: string;
  endTime: string;
  producedQty: string;
  rejectedQty: string;
  rejectionCodeId: string;
  notes: string;
}

const emptyForm = (): FormState => ({
  productionOrderId: '',
  workOrderId: '',
  date: new Date().toISOString().split('T')[0],
  shiftId: '',
  operatorId: '',
  machineId: '',
  startTime: '',
  endTime: '',
  producedQty: '',
  rejectedQty: '',
  rejectionCodeId: '',
  notes: '',
});

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function ProductionEntryPage() {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [poFilter, setPoFilter] = useState('ALL');
  const [wcFilter, setWcFilter] = useState('ALL');
  const [opFilter, setOpFilter] = useState('ALL');
  const [approvedFilter, setApprovedFilter] = useState<
    'ALL' | 'APPROVED' | 'PENDING'
  >('ALL');
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [activeTab, setActiveTab] = useState<'entries' | 'rejections'>(
    'entries',
  );

  // Rejection form
  const [showRejectionSlideOver, setShowRejectionSlideOver] = useState(false);
  const [rejectionEditingId, setRejectionEditingId] = useState<string | null>(
    null,
  );
  const [rejectionForm, setRejectionForm] = useState<{
    productionOrderId: string;
    workOrderId: string;
    date: string;
    shiftId: string;
    operatorId: string;
    machineId: string;
    rejectionCodeId: string;
    rejectedQty: string;
    isReworkable: boolean;
    reworkQty: string;
    notes: string;
  }>({
    productionOrderId: '',
    workOrderId: '',
    date: new Date().toISOString().split('T')[0],
    shiftId: '',
    operatorId: '',
    machineId: '',
    rejectionCodeId: '',
    rejectedQty: '',
    isReworkable: false,
    reworkQty: '',
    notes: '',
  });
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  const inProgressPOs = useMemo(
    () => mockProductionOrders.filter((po) => po.status === 'IN_PROGRESS'),
    [],
  );

  const filteredWOs = useMemo(() => {
    if (!form.productionOrderId) return [];
    return mockWorkOrders.filter(
      (wo) =>
        wo.productionOrderId === form.productionOrderId &&
        (wo.status === 'PENDING' || wo.status === 'IN_PROGRESS'),
    );
  }, [form.productionOrderId]);

  const selectedWO = useMemo(
    () => mockWorkOrders.find((wo) => wo.id === form.workOrderId) || null,
    [form.workOrderId],
  );

  const availableMachines = useMemo(() => {
    if (!selectedWO) return [];
    return mockMachines.filter(
      (m) => m.workCenterId === selectedWO.workCenterId,
    );
  }, [selectedWO]);

  const filtered = useMemo(() => {
    return mockProductionEntries.filter((e) => {
      if (dateFilter && e.date !== dateFilter) return false;
      if (poFilter !== 'ALL' && e.productionOrderId !== poFilter) return false;
      if (wcFilter !== 'ALL' && e.workCenterId !== wcFilter) return false;
      if (opFilter !== 'ALL' && e.operatorId !== opFilter) return false;
      if (approvedFilter === 'APPROVED' && !e.isApproved) return false;
      if (approvedFilter === 'PENDING' && e.isApproved) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          e.entryNumber.toLowerCase().includes(q) ||
          e.productionOrderNumber.toLowerCase().includes(q) ||
          e.workOrderNumber.toLowerCase().includes(q) ||
          e.stageName.toLowerCase().includes(q) ||
          e.operatorName.toLowerCase().includes(q) ||
          (e.machineName?.toLowerCase().includes(q) ?? false) ||
          e.workCenterName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [
    search,
    dateFilter,
    poFilter,
    wcFilter,
    opFilter,
    approvedFilter,
    refreshTick,
  ]);

  const stats = useMemo(() => {
    const total = mockProductionEntries.length;
    const approved = mockProductionEntries.filter((e) => e.isApproved).length;
    const pending = total - approved;
    const totalProduced = mockProductionEntries.reduce(
      (s, e) => s + e.producedQty,
      0,
    );
    const totalRejected = mockProductionEntries.reduce(
      (s, e) => s + e.rejectedQty,
      0,
    );
    return { total, approved, pending, totalProduced, totalRejected };
  }, [refreshTick]);

  const selectedWORej = useMemo(
    () =>
      mockWorkOrders.find((wo) => wo.id === rejectionForm.workOrderId) || null,
    [rejectionForm.workOrderId],
  );

  const filteredWOsRej = useMemo(() => {
    if (!rejectionForm.productionOrderId) return [];
    return mockWorkOrders.filter(
      (wo) =>
        wo.productionOrderId === rejectionForm.productionOrderId &&
        (wo.status === 'PENDING' || wo.status === 'IN_PROGRESS'),
    );
  }, [rejectionForm.productionOrderId]);

  const availableMachinesRej = useMemo(() => {
    if (!selectedWORej) return [];
    return mockMachines.filter(
      (m) => m.workCenterId === selectedWORej.workCenterId,
    );
  }, [selectedWORej]);

  const selectedRejCode = useMemo(
    () =>
      mockRejectionCodes.find((c) => c.id === rejectionForm.rejectionCodeId) ||
      null,
    [rejectionForm.rejectionCodeId],
  );

  const selectedRejPO = useMemo(
    () =>
      mockProductionOrders.find(
        (po) => po.id === rejectionForm.productionOrderId,
      ) || null,
    [rejectionForm.productionOrderId],
  );

  const rejectionStats = useMemo(() => {
    const total = mockRejectionEntries.length;
    const rework = mockRejectionEntries.filter((r) => r.isReworkable).length;
    const scrap = total - rework;
    const totalQty = mockRejectionEntries.reduce(
      (s, r) => s + r.rejectedQty,
      0,
    );
    return { total, rework, scrap, totalQty };
  }, [refreshTick]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setDateFilter('');
    setPoFilter('ALL');
    setWcFilter('ALL');
    setOpFilter('ALL');
    setApprovedFilter('ALL');
  }, []);

  const hasFilters =
    search ||
    dateFilter !== '' ||
    poFilter !== 'ALL' ||
    wcFilter !== 'ALL' ||
    opFilter !== 'ALL' ||
    approvedFilter !== 'ALL';

  const openNewEntry = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError(null);
    setShowSlideOver(true);
  };

  const openEditEntry = (entry: MockProductionEntry) => {
    setEditingId(entry.id);
    setForm({
      productionOrderId: entry.productionOrderId,
      workOrderId: entry.workOrderId,
      date: entry.date,
      shiftId: entry.shiftId,
      operatorId: entry.operatorId,
      machineId: entry.machineId ?? '',
      startTime: entry.startTime,
      endTime: entry.endTime,
      producedQty: String(entry.producedQty),
      rejectedQty: String(entry.rejectedQty),
      rejectionCodeId: '',
      notes: entry.notes ?? '',
    });
    setFormError(null);
    setShowSlideOver(true);
  };

  const handleApprove = (id: string) => {
    const idx = mockProductionEntries.findIndex((e) => e.id === id);
    if (idx !== -1) {
      mockProductionEntries[idx] = {
        ...mockProductionEntries[idx],
        isApproved: true,
      };
      setRefreshTick((t) => t + 1);
    }
  };

  const handleDelete = (id: string) => {
    const idx = mockProductionEntries.findIndex((e) => e.id === id);
    if (idx !== -1) {
      mockProductionEntries.splice(idx, 1);
      setRefreshTick((t) => t + 1);
    }
  };

  const updateForm = (patch: Partial<FormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...patch };
      if (patch.productionOrderId !== undefined) {
        next.workOrderId = '';
        next.machineId = '';
      }
      if (patch.workOrderId !== undefined) {
        next.machineId = '';
      }
      return next;
    });
    setFormError(null);
  };

  const handleSave = () => {
    // Validation
    if (!form.productionOrderId)
      return setFormError('Production Order is required');
    if (!form.workOrderId)
      return setFormError('Work Order / Stage is required');
    if (!form.date) return setFormError('Date is required');
    if (!form.shiftId) return setFormError('Shift is required');
    if (!form.operatorId) return setFormError('Operator is required');
    if (!form.startTime) return setFormError('Start Time is required');
    if (!form.endTime) return setFormError('End Time is required');
    if (form.startTime >= form.endTime)
      return setFormError('End Time must be after Start Time');
    if (!form.producedQty || Number(form.producedQty) < 0)
      return setFormError('Produced Qty is required');
    if (form.rejectedQty && Number(form.rejectedQty) < 0)
      return setFormError('Rejected Qty cannot be negative');
    if (Number(form.rejectedQty || 0) > 0 && !form.rejectionCodeId)
      return setFormError('Rejection Code is required when rejected qty > 0');

    const producedQty = Number(form.producedQty);
    const rejectedQty = Number(form.rejectedQty || 0);
    const actualTimeMinutes =
      timeToMinutes(form.endTime) - timeToMinutes(form.startTime);

    const po = mockProductionOrders.find(
      (p) => p.id === form.productionOrderId,
    );
    const wo = mockWorkOrders.find((w) => w.id === form.workOrderId);
    const shift = mockShifts.find((s) => s.id === form.shiftId);
    const operator = mockOperators.find((o) => o.id === form.operatorId);
    const machine = mockMachines.find((m) => m.id === form.machineId) || null;
    const wc = mockWorkCenters.find((w) => w.id === (wo?.workCenterId || ''));

    if (!po || !wo || !shift || !operator || !wc) {
      return setFormError('Invalid selection — please refresh and try again');
    }

    if (editingId) {
      const idx = mockProductionEntries.findIndex((e) => e.id === editingId);
      if (idx === -1) return;
      const old = mockProductionEntries[idx];
      // Reverse old quantities from WO and PO
      wo.completedQty = Math.max(
        0,
        wo.completedQty - old.producedQty + producedQty,
      );
      wo.rejectedQty = Math.max(
        0,
        wo.rejectedQty - old.rejectedQty + rejectedQty,
      );
      mockProductionEntries[idx] = {
        ...old,
        productionOrderId: form.productionOrderId,
        productionOrderNumber: po.poNumber,
        workOrderId: form.workOrderId,
        workOrderNumber: wo.woNumber,
        stageName: wo.stageName,
        workCenterId: wc.id,
        workCenterName: wc.name,
        machineId: machine?.id ?? null,
        machineName: machine?.name ?? null,
        operatorId: operator.id,
        operatorName: operator.name,
        shiftId: shift.id,
        shiftName: shift.name,
        date: form.date,
        producedQty,
        rejectedQty,
        unit: po.unit,
        startTime: form.startTime,
        endTime: form.endTime,
        actualTimeMinutes,
        notes: form.notes || null,
        enteredBy: operator.id,
      };
    } else {
      const nextNum = mockProductionEntries.length + 1;
      const entryNumber = `PE-2024-${String(nextNum).padStart(3, '0')}`;
      const newEntry: MockProductionEntry = {
        id: `pe-${String(nextNum).padStart(3, '0')}`,
        entryNumber,
        productionOrderId: form.productionOrderId,
        productionOrderNumber: po.poNumber,
        workOrderId: form.workOrderId,
        workOrderNumber: wo.woNumber,
        stageName: wo.stageName,
        workCenterId: wc.id,
        workCenterName: wc.name,
        machineId: machine?.id ?? null,
        machineName: machine?.name ?? null,
        operatorId: operator.id,
        operatorName: operator.name,
        shiftId: shift.id,
        shiftName: shift.name,
        date: form.date,
        producedQty,
        rejectedQty,
        unit: po.unit,
        startTime: form.startTime,
        endTime: form.endTime,
        actualTimeMinutes,
        notes: form.notes || null,
        enteredBy: operator.id,
        supervisorId: null,
        supervisorName: null,
        isApproved: false,
        createdAt: new Date().toISOString(),
      };
      mockProductionEntries.push(newEntry);

      // Update WO
      wo.completedQty += producedQty;
      wo.rejectedQty += rejectedQty;
    }

    // Auto-complete WO if fully produced
    if (wo.completedQty >= wo.plannedQty && wo.status !== 'COMPLETED') {
      wo.status = 'COMPLETED';
      wo.actualEndDate = form.date;
    } else if (wo.completedQty > 0 && wo.status === 'PENDING') {
      wo.status = 'IN_PROGRESS';
      wo.actualStartDate = wo.actualStartDate || form.date;
    }

    // Recalculate PO completedQty
    const poWOs = mockWorkOrders.filter((w) => w.productionOrderId === po.id);
    po.completedQty = poWOs.reduce((sum, w) => sum + w.completedQty, 0);
    po.rejectedQty = poWOs.reduce((sum, w) => sum + w.rejectedQty, 0);

    // Auto-trigger IN_PROCESS inspection if stage has qcRequired
    const routing = po.routingId
      ? mockRoutings.find((r) => r.id === po.routingId)
      : mockRoutings.find(
          (r) => r.itemId === po.productId && r.status === 'ACTIVE',
        );
    if (routing) {
      const stage = routing.stages.find(
        (s) => s.stageNumber === wo.stageNumber,
      );
      if (stage && stage.qcRequired) {
        const item = mockItems.find((i) => i.id === po.productId);
        const checklist =
          mockInspectionChecklists.find(
            (c) =>
              c.applicableTo === 'IN_PROCESS' &&
              c.itemTypeTarget === item?.itemType &&
              c.isActive,
          ) ||
          mockInspectionChecklists.find(
            (c) => c.applicableTo === 'IN_PROCESS' && c.isActive,
          );
        if (checklist) {
          const nextNum = mockInspections.length + 1;
          const sampleQty = calcSampleQty(
            checklist.samplingPlan,
            wo.plannedQty,
          );
          const newInspection = {
            id: `insp-${Date.now()}`,
            inspectionNumber: `QC-IP-2024-${String(nextNum).padStart(3, '0')}`,
            type: 'IN_PROCESS' as const,
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
            totalQty: wo.plannedQty,
            sampleQty,
            passedQty: 0,
            failedQty: 0,
            unit: po.unit,
            inspectorId: null,
            inspectorName: null,
            scheduledDate: form.date,
            completedDate: null,
            warehouseId: null,
            notes: `Auto-triggered for Stage ${stage.stageName}`,
            createdAt: new Date().toISOString(),
          };
          mockInspections.push(newInspection);
          toast.success(
            `In-Process inspection triggered for Stage ${stage.stageName}`,
          );
        }
      }
    }

    setShowSlideOver(false);
    setEditingId(null);
    setForm(emptyForm());
    setRefreshTick((t) => t + 1);
  };

  const openRejectionForm = () => {
    setRejectionEditingId(null);
    setRejectionForm({
      productionOrderId: '',
      workOrderId: '',
      date: new Date().toISOString().split('T')[0],
      shiftId: '',
      operatorId: '',
      machineId: '',
      rejectionCodeId: '',
      rejectedQty: '',
      isReworkable: false,
      reworkQty: '',
      notes: '',
    });
    setRejectionError(null);
    setShowRejectionSlideOver(true);
  };

  const handleSaveRejection = () => {
    if (!rejectionForm.productionOrderId)
      return setRejectionError('Production Order is required');
    if (!rejectionForm.workOrderId)
      return setRejectionError('Work Order / Stage is required');
    if (!rejectionForm.date) return setRejectionError('Date is required');
    if (!rejectionForm.shiftId) return setRejectionError('Shift is required');
    if (!rejectionForm.operatorId)
      return setRejectionError('Operator is required');
    if (!rejectionForm.rejectionCodeId)
      return setRejectionError('Rejection Code is required');
    if (!rejectionForm.rejectedQty || Number(rejectionForm.rejectedQty) <= 0)
      return setRejectionError('Rejected Qty is required and must be > 0');

    const rejectedQty = Number(rejectionForm.rejectedQty);
    const reworkQty = rejectionForm.isReworkable
      ? Math.min(Number(rejectionForm.reworkQty || 0), rejectedQty)
      : 0;
    const scrapQty = rejectedQty - reworkQty;

    const po = mockProductionOrders.find(
      (p) => p.id === rejectionForm.productionOrderId,
    );
    const wo = mockWorkOrders.find((w) => w.id === rejectionForm.workOrderId);
    const shift = mockShifts.find((s) => s.id === rejectionForm.shiftId);
    const operator = mockOperators.find(
      (o) => o.id === rejectionForm.operatorId,
    );
    const machine = rejectionForm.machineId
      ? mockMachines.find((m) => m.id === rejectionForm.machineId) || null
      : null;
    const code = mockRejectionCodes.find(
      (c) => c.id === rejectionForm.rejectionCodeId,
    );
    const wc = wo
      ? mockWorkCenters.find((w) => w.id === wo.workCenterId) || null
      : null;

    if (!po || !wo || !shift || !operator || !code || !wc) {
      return setRejectionError('Invalid selection');
    }

    if (rejectionEditingId) {
      const idx = mockRejectionEntries.findIndex(
        (r) => r.id === rejectionEditingId,
      );
      if (idx === -1) return;
      const old = mockRejectionEntries[idx];
      // Reverse old qtys
      wo.rejectedQty = Math.max(
        0,
        wo.rejectedQty - old.rejectedQty + rejectedQty,
      );
      po.rejectedQty = Math.max(
        0,
        po.rejectedQty - old.rejectedQty + rejectedQty,
      );
      mockRejectionEntries[idx] = {
        ...old,
        productionOrderId: po.id,
        productionOrderNumber: po.poNumber,
        workOrderId: wo.id,
        workOrderNumber: wo.woNumber,
        stageName: wo.stageName,
        workCenterId: wc.id,
        workCenterName: wc.name,
        machineId: machine?.id ?? null,
        machineName: machine?.name ?? null,
        shiftId: shift.id,
        shiftName: shift.name,
        operatorId: operator.id,
        operatorName: operator.name,
        rejectionCodeId: code.id,
        rejectionCodeName: code.description,
        category: code.category,
        rejectedQty,
        reworkQty,
        scrapQty,
        unit: po.unit,
        isReworkable: rejectionForm.isReworkable,
        date: rejectionForm.date,
        notes: rejectionForm.notes || null,
      };
    } else {
      const nextNum = mockRejectionEntries.length + 1;
      const entryNumber = `REJ-2024-${String(nextNum).padStart(3, '0')}`;
      const newEntry = {
        id: `rej-${String(nextNum).padStart(3, '0')}`,
        entryNumber,
        productionOrderId: po.id,
        productionOrderNumber: po.poNumber,
        workOrderId: wo.id,
        workOrderNumber: wo.woNumber,
        stageName: wo.stageName,
        workCenterId: wc.id,
        workCenterName: wc.name,
        machineId: machine?.id ?? null,
        machineName: machine?.name ?? null,
        shiftId: shift.id,
        shiftName: shift.name,
        operatorId: operator.id,
        operatorName: operator.name,
        rejectionCodeId: code.id,
        rejectionCodeName: code.description,
        category: code.category,
        rejectedQty,
        reworkQty,
        scrapQty,
        unit: po.unit,
        isReworkable: rejectionForm.isReworkable,
        date: rejectionForm.date,
        notes: rejectionForm.notes || null,
        createdAt: new Date().toISOString(),
      };
      mockRejectionEntries.push(newEntry as MockRejectionEntry);
    }

    // Update WO and PO rejected qtys
    wo.rejectedQty += rejectedQty;
    po.rejectedQty += rejectedQty;

    setShowRejectionSlideOver(false);
    setRejectionEditingId(null);
    setRejectionForm({
      productionOrderId: '',
      workOrderId: '',
      date: new Date().toISOString().split('T')[0],
      shiftId: '',
      operatorId: '',
      machineId: '',
      rejectionCodeId: '',
      rejectedQty: '',
      isReworkable: false,
      reworkQty: '',
      notes: '',
    });
    setRefreshTick((t) => t + 1);
  };

  const handleDeleteRejection = (id: string) => {
    const idx = mockRejectionEntries.findIndex((r) => r.id === id);
    if (idx !== -1) {
      const entry = mockRejectionEntries[idx];
      const wo = mockWorkOrders.find((w) => w.id === entry.workOrderId);
      const po = mockProductionOrders.find(
        (p) => p.id === entry.productionOrderId,
      );
      if (wo) wo.rejectedQty = Math.max(0, wo.rejectedQty - entry.rejectedQty);
      if (po) po.rejectedQty = Math.max(0, po.rejectedQty - entry.rejectedQty);
      mockRejectionEntries.splice(idx, 1);
      setRefreshTick((t) => t + 1);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#f8fafc] py-6 px-4 md:px-6">
        <div className="max-w-[1400px] mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">
                Production Entry
              </h1>
              <p className="text-xs text-[#64748b] mt-0.5">
                {activeTab === 'entries'
                  ? `${stats.total} entries recorded`
                  : `${rejectionStats.total} rejections logged`}
              </p>
            </div>
            {activeTab === 'entries' ? (
              <button
                onClick={openNewEntry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line" />
                New Entry
              </button>
            ) : (
              <button
                onClick={openRejectionForm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line" />
                Log Rejection
              </button>
            )}
          </div>

          {/* Stats */}
          {activeTab === 'entries' ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
              <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-indigo-100">
                  <i className="ri-file-list-3-line text-indigo-600 text-base" />
                </div>
                <div className="text-xs text-indigo-700 font-medium uppercase tracking-wide">
                  Total Entries
                </div>
                <div className="text-2xl font-bold text-indigo-700 mt-1">
                  {stats.total}
                </div>
              </div>
              <div className="bg-white border border-emerald-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-emerald-100">
                  <i className="ri-check-double-line text-emerald-600 text-base" />
                </div>
                <div className="text-xs text-emerald-700 font-medium uppercase tracking-wide">
                  Approved
                </div>
                <div className="text-2xl font-bold text-emerald-700 mt-1">
                  {stats.approved}
                </div>
              </div>
              <div className="bg-white border border-amber-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-amber-100">
                  <i className="ri-time-line text-amber-600 text-base" />
                </div>
                <div className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                  Pending
                </div>
                <div className="text-2xl font-bold text-amber-700 mt-1">
                  {stats.pending}
                </div>
              </div>
              <div className="bg-white border border-sky-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-sky-100">
                  <i className="ri-box-3-line text-sky-600 text-base" />
                </div>
                <div className="text-xs text-sky-700 font-medium uppercase tracking-wide">
                  Total Produced
                </div>
                <div className="text-2xl font-bold text-sky-700 mt-1">
                  {stats.totalProduced}
                </div>
              </div>
              <div className="bg-white border border-rose-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-rose-100">
                  <i className="ri-close-circle-line text-rose-600 text-base" />
                </div>
                <div className="text-xs text-rose-700 font-medium uppercase tracking-wide">
                  Total Rejected
                </div>
                <div className="text-2xl font-bold text-rose-700 mt-1">
                  {stats.totalRejected}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-rose-100">
                  <i className="ri-close-circle-line text-rose-600 text-base" />
                </div>
                <div className="text-xs text-rose-700 font-medium uppercase tracking-wide">
                  Total Rejections
                </div>
                <div className="text-2xl font-bold text-rose-700 mt-1">
                  {rejectionStats.total}
                </div>
              </div>
              <div className="bg-white border border-amber-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-amber-100">
                  <i className="ri-tools-line text-amber-600 text-base" />
                </div>
                <div className="text-xs text-amber-700 font-medium uppercase tracking-wide">
                  Reworkable
                </div>
                <div className="text-2xl font-bold text-amber-700 mt-1">
                  {rejectionStats.rework}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100">
                  <i className="ri-delete-bin-line text-slate-600 text-base" />
                </div>
                <div className="text-xs text-slate-700 font-medium uppercase tracking-wide">
                  Scrap
                </div>
                <div className="text-2xl font-bold text-slate-700 mt-1">
                  {rejectionStats.scrap}
                </div>
              </div>
              <div className="bg-white border border-rose-200 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full bg-rose-100">
                  <i className="ri-stack-line text-rose-600 text-base" />
                </div>
                <div className="text-xs text-rose-700 font-medium uppercase tracking-wide">
                  Total Qty
                </div>
                <div className="text-2xl font-bold text-rose-700 mt-1">
                  {rejectionStats.totalQty}
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white border border-slate-200 rounded-t-xl border-b-0">
            <div className="flex p-1 gap-1">
              <button
                onClick={() => setActiveTab('entries')}
                className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'entries'
                    ? 'bg-slate-100 text-[#1e293b]'
                    : 'text-[#64748b] hover:bg-slate-50'
                }`}
              >
                <i className="ri-file-list-3-line mr-1.5" />
                Production Entries
              </button>
              <button
                onClick={() => setActiveTab('rejections')}
                className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
                  activeTab === 'rejections'
                    ? 'bg-slate-100 text-[#1e293b]'
                    : 'text-[#64748b] hover:bg-slate-50'
                }`}
              >
                <i className="ri-close-circle-line mr-1.5" />
                Rejections
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-semibold">
                  {rejectionStats.total}
                </span>
              </button>
            </div>
          </div>

          {activeTab === 'entries' && (
            <>
              {/* Filters */}
              <div className="bg-white border border-slate-200 rounded-b-xl p-3 mb-4 -mt-px">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400">
                          <i className="ri-search-line text-sm" />
                        </div>
                        <input
                          type="text"
                          placeholder="Search by entry number, PO, WO, operator..."
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer"
                      />
                      <select
                        value={poFilter}
                        onChange={(e) => setPoFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                      >
                        <option value="ALL">All POs</option>
                        {mockProductionOrders.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.poNumber}
                          </option>
                        ))}
                      </select>
                      <select
                        value={wcFilter}
                        onChange={(e) => setWcFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                      >
                        <option value="ALL">All Work Centers</option>
                        {mockWorkCenters.map((wc) => (
                          <option key={wc.id} value={wc.id}>
                            {wc.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={opFilter}
                        onChange={(e) => setOpFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                      >
                        <option value="ALL">All Operators</option>
                        {mockOperators.map((op) => (
                          <option key={op.id} value={op.id}>
                            {op.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={approvedFilter}
                        onChange={(e) =>
                          setApprovedFilter(
                            e.target.value as typeof approvedFilter,
                          )
                        }
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                      >
                        <option value="ALL">All Status</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PENDING">Pending Approval</option>
                      </select>
                    </div>
                  </div>
                  {hasFilters && (
                    <div className="flex justify-end">
                      <button
                        onClick={clearFilters}
                        className="text-xs text-[#64748b] hover:text-[#1e293b] cursor-pointer underline"
                      >
                        Clear all filters
                      </button>
                    </div>
                  )}
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
                          Date
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          PO / WO
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Stage
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Work Center
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Machine
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Operator
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Shift
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Produced
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Rejected
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Time
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Approval
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
                            colSpan={13}
                            className="px-4 py-10 text-center text-sm text-[#94a3b8]"
                          >
                            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 mb-3">
                              <i className="ri-inbox-line text-xl text-slate-300" />
                            </div>
                            No production entries match your filters
                          </td>
                        </tr>
                      ) : (
                        filtered.map((e) => (
                          <tr
                            key={e.id}
                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-semibold text-[#4f46e5]">
                                {e.entryNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-[#475569] text-xs">
                              {e.date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-xs font-medium text-[#1e293b]">
                                {e.productionOrderNumber}
                              </div>
                              <div className="text-[11px] text-[#94a3b8]">
                                {e.workOrderNumber}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-[#1e293b]">
                              {e.stageName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                              {e.workCenterName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                              {e.machineName ?? '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                              {e.operatorName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-slate-50 text-slate-600 border-slate-200">
                                {e.shiftName}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-semibold text-emerald-700">
                                {e.producedQty}
                              </span>
                              <span className="text-[11px] text-[#94a3b8] ml-1">
                                {e.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {e.rejectedQty > 0 ? (
                                <span className="text-sm font-semibold text-rose-700">
                                  {e.rejectedQty}
                                </span>
                              ) : (
                                <span className="text-sm text-[#94a3b8]">
                                  0
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                              {e.startTime} – {e.endTime}
                              <div className="text-[11px] text-[#94a3b8]">
                                {e.actualTimeMinutes} min
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {e.isApproved ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-emerald-50 text-emerald-700 border-emerald-200">
                                  <i className="ri-check-line" /> Approved
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-amber-50 text-amber-700 border-amber-200">
                                  <i className="ri-time-line" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {!e.isApproved ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleApprove(e.id)}
                                    className="px-2 py-1 text-[11px] font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                    title="Approve"
                                  >
                                    <i className="ri-check-line" />
                                  </button>
                                  <button
                                    onClick={() => openEditEntry(e)}
                                    className="px-2 py-1 text-[11px] font-medium rounded-md bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                                    title="Edit"
                                  >
                                    <i className="ri-edit-line" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(e.id)}
                                    className="px-2 py-1 text-[11px] font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer"
                                    title="Delete"
                                  >
                                    <i className="ri-delete-bin-line" />
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs text-[#94a3b8]">
                                  —
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs text-[#64748b]">
                    Showing {filtered.length} of {mockProductionEntries.length}{' '}
                    entries
                  </span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'rejections' && (
            <>
              {/* Rejection Filters placeholder */}
              <div className="bg-white border border-slate-200 rounded-b-xl p-3 mb-4 -mt-px">
                <div className="text-xs text-[#64748b]">
                  {mockRejectionEntries.length} rejection entries on record
                </div>
              </div>

              {/* Rejection Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Entry #
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          PO
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Stage
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Code
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Qty
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Reworkable
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Date
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Operator
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-[#475569] text-xs uppercase tracking-wider whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockRejectionEntries.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-10 text-center text-sm text-[#94a3b8]"
                          >
                            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 mb-3">
                              <i className="ri-inbox-line text-xl text-slate-300" />
                            </div>
                            No rejection entries logged
                          </td>
                        </tr>
                      ) : (
                        mockRejectionEntries.map((r) => (
                          <tr
                            key={r.id}
                            className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-semibold text-[#4f46e5]">
                                {r.entryNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-xs font-medium text-[#1e293b]">
                                {r.productionOrderNumber}
                              </div>
                              <div className="text-[11px] text-[#94a3b8]">
                                {r.workOrderNumber}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                              {r.stageName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-50 text-rose-700 border-rose-200">
                                {r.rejectionCodeName}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="text-sm font-semibold text-rose-700">
                                {r.rejectedQty}
                              </span>
                              <span className="text-[11px] text-[#94a3b8] ml-1">
                                {r.unit}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              {r.isReworkable ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-amber-50 text-amber-700 border-amber-200">
                                  <i className="ri-tools-line" /> Rework
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-50 text-rose-700 border-rose-200">
                                  <i className="ri-delete-bin-line" /> Scrap
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                              {r.date}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-xs text-[#475569]">
                              {r.operatorName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleDeleteRejection(r.id)}
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
                    Showing {mockRejectionEntries.length} of{' '}
                    {mockRejectionEntries.length} entries
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Production Entry Slide-over */}
      {showSlideOver && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSlideOver(false)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#1e293b]">
                {editingId ? 'Edit Production Entry' : 'Log Production Entry'}
              </h2>
              <button
                onClick={() => setShowSlideOver(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {formError && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {formError}
                </div>
              )}

              {/* Production Order */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Production Order <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.productionOrderId}
                  onChange={(e) =>
                    updateForm({ productionOrderId: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Production Order</option>
                  {inProgressPOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.productName}
                      {po.variantName ? ` (${po.variantName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Order */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Work Order / Stage <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.workOrderId}
                  onChange={(e) => updateForm({ workOrderId: e.target.value })}
                  disabled={!form.productionOrderId}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {form.productionOrderId
                      ? 'Select Work Order'
                      : 'Choose PO first'}
                  </option>
                  {filteredWOs.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      Stage {wo.stageNumber}: {wo.stageName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm({ date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Shift <span className="text-rose-500">*</span>
                </label>
                <select
                  value={form.shiftId}
                  onChange={(e) => updateForm({ shiftId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Shift</option>
                  {mockShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} – {s.endTime})
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
                  value={form.operatorId}
                  onChange={(e) => updateForm({ operatorId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Operator</option>
                  {mockOperators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Machine
                </label>
                <select
                  value={form.machineId}
                  onChange={(e) => updateForm({ machineId: e.target.value })}
                  disabled={!form.workOrderId}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {form.workOrderId
                      ? 'Select Machine (optional)'
                      : 'Choose WO first'}
                  </option>
                  {availableMachines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Times */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => updateForm({ startTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => updateForm({ endTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                </div>
              </div>
              {form.startTime && form.endTime && (
                <div className="text-xs text-[#64748b]">
                  Duration:{' '}
                  <span className="font-medium text-[#1e293b]">
                    {timeToMinutes(form.endTime) -
                      timeToMinutes(form.startTime)}{' '}
                    min
                  </span>
                </div>
              )}

              {/* Quantities */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Produced Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.producedQty}
                    onChange={(e) =>
                      updateForm({ producedQty: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Rejected Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.rejectedQty}
                    onChange={(e) =>
                      updateForm({ rejectedQty: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                </div>
              </div>

              {/* Rejection Code */}
              {Number(form.rejectedQty || 0) > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Rejection Code <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={form.rejectionCodeId}
                    onChange={(e) =>
                      updateForm({ rejectionCodeId: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                  >
                    <option value="">Select Rejection Code</option>
                    {mockRejectionCodes.map((rc) => (
                      <option key={rc.id} value={rc.id}>
                        {rc.code} — {rc.description}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Notes
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 resize-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowSlideOver(false)}
                className="px-4 py-2 text-sm font-medium text-[#475569] border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                {editingId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Slide-over */}
      {showRejectionSlideOver && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowRejectionSlideOver(false)}
          />
          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-[#1e293b]">
                Log Rejection
              </h2>
              <button
                onClick={() => setShowRejectionSlideOver(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-5 flex-1">
              {rejectionError && (
                <div className="px-3 py-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {rejectionError}
                </div>
              )}

              {/* PO */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Production Order <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rejectionForm.productionOrderId}
                  onChange={(e) =>
                    setRejectionForm((p) => ({
                      ...p,
                      productionOrderId: e.target.value,
                      workOrderId: '',
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Production Order</option>
                  {inProgressPOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.productName}
                    </option>
                  ))}
                </select>
              </div>

              {/* WO */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Work Order / Stage <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rejectionForm.workOrderId}
                  onChange={(e) =>
                    setRejectionForm((p) => ({
                      ...p,
                      workOrderId: e.target.value,
                      machineId: '',
                    }))
                  }
                  disabled={!rejectionForm.productionOrderId}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {rejectionForm.productionOrderId
                      ? 'Select Work Order'
                      : 'Choose PO first'}
                  </option>
                  {filteredWOsRej.map((wo) => (
                    <option key={wo.id} value={wo.id}>
                      Stage {wo.stageNumber}: {wo.stageName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={rejectionForm.date}
                  onChange={(e) =>
                    setRejectionForm((p) => ({ ...p, date: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                />
              </div>

              {/* Shift */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Shift <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rejectionForm.shiftId}
                  onChange={(e) =>
                    setRejectionForm((p) => ({ ...p, shiftId: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Shift</option>
                  {mockShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.startTime} – {s.endTime})
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
                  value={rejectionForm.operatorId}
                  onChange={(e) =>
                    setRejectionForm((p) => ({
                      ...p,
                      operatorId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Operator</option>
                  {mockOperators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Machine */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Machine
                </label>
                <select
                  value={rejectionForm.machineId}
                  onChange={(e) =>
                    setRejectionForm((p) => ({
                      ...p,
                      machineId: e.target.value,
                    }))
                  }
                  disabled={!rejectionForm.workOrderId}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white disabled:bg-slate-50 disabled:text-slate-400"
                >
                  <option value="">
                    {rejectionForm.workOrderId
                      ? 'Select Machine (optional)'
                      : 'Choose WO first'}
                  </option>
                  {availableMachinesRej.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rejection Code */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Rejection Code <span className="text-rose-500">*</span>
                </label>
                <select
                  value={rejectionForm.rejectionCodeId}
                  onChange={(e) =>
                    setRejectionForm((p) => ({
                      ...p,
                      rejectionCodeId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                >
                  <option value="">Select Rejection Code</option>
                  {mockRejectionCodes.map((rc) => (
                    <option key={rc.id} value={rc.id}>
                      {rc.code} — {rc.description}
                    </option>
                  ))}
                </select>
                {selectedRejCode && (
                  <div className="mt-1.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-50 text-rose-700 border-rose-200">
                      {selectedRejCode.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Rejected Qty + Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Rejected Qty <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={rejectionForm.rejectedQty}
                    onChange={(e) =>
                      setRejectionForm((p) => ({
                        ...p,
                        rejectedQty: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={selectedRejPO?.unit ?? ''}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                  />
                </div>
              </div>

              {/* Is Reworkable */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rejectionForm.isReworkable}
                    onChange={(e) =>
                      setRejectionForm((p) => ({
                        ...p,
                        isReworkable: e.target.checked,
                        reworkQty: '',
                      }))
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#2563eb] focus:ring-indigo-200"
                  />
                  <span className="text-sm font-medium text-[#1e293b]">
                    Is Reworkable
                  </span>
                </label>
              </div>

              {/* Rework Qty */}
              {rejectionForm.isReworkable && (
                <div>
                  <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                    Rework Qty
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={Number(rejectionForm.rejectedQty || 0)}
                    value={rejectionForm.reworkQty}
                    onChange={(e) =>
                      setRejectionForm((p) => ({
                        ...p,
                        reworkQty: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
                  />
                  <div className="mt-1 text-xs text-[#64748b]">
                    Scrap Qty:{' '}
                    <span className="font-medium text-[#1e293b]">
                      {Math.max(
                        0,
                        Number(rejectionForm.rejectedQty || 0) -
                          Number(rejectionForm.reworkQty || 0),
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-[#475569] mb-1.5">
                  Description
                </label>
                <textarea
                  value={rejectionForm.notes}
                  onChange={(e) =>
                    setRejectionForm((p) => ({ ...p, notes: e.target.value }))
                  }
                  rows={3}
                  maxLength={500}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 resize-none"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 py-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowRejectionSlideOver(false)}
                className="px-4 py-2 text-sm font-medium text-[#475569] border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRejection}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 rounded-lg hover:bg-rose-700 cursor-pointer"
              >
                Log Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
