import { useState, useMemo, useEffect, useCallback } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { useWarehouseStore } from '@/stores/warehouseStore';
import {
  createProductionEntry,
  getAllProductionEntries,
  updateProductionEntry,
  deleteProductionEntry,
  approveProductionEntry,
} from '@/api/productionentry.api';
import { getAllProductionOrders } from '@/api/productionOrder.api';
import { getAllRoutings } from '@/api/routing.api';
import { getAllShifts } from '@/api/shift.api';
import { getAllOperators } from '@/api/operator.api';
import { getAllMachines } from '@/api/machine.api';
import { getAllRejectionCodes } from '@/api/rejectioncode.api';
import { getAllWorkCenters } from '@/api/workcenter.api';
import { getAllWorkOrders } from '@/api/workorder.api';

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
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

const mapResponseToEntry = (r: any) => ({
  id: r.id,
  entryNumber: r.entry_number ?? r.entryNumber ?? '',
  productionOrderId: r.production_order_id ?? r.productionOrderId ?? '',
  productionOrderNumber: r.production_order_number ?? r.productionOrderNumber ?? '',
  workOrderId: r.work_order_id ?? r.workOrderId ?? '',
  workOrderNumber: r.work_order_number ?? r.workOrderNumber ?? '',
  stageName: r.stage_name ?? r.stageName ?? '',
  stageNumber: r.stage_number ?? r.stageNumber ?? null,
  workCenterId: r.work_center_id ?? r.workCenterId ?? '',
  workCenterName: r.work_center_name ?? r.workCenterName ?? '',
  machineId: r.machine_id ?? r.machineId ?? '',
  machineName: r.machine_name ?? r.machineName ?? '',
  operatorId: r.operator_id ?? r.operatorId ?? '',
  operatorName: r.operator_name ?? r.operatorName ?? '',
  shiftId: r.shift_id ?? r.shiftId ?? '',
  shiftName: r.shift_name ?? r.shiftName ?? '',
  date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
  producedQty: Number(r.produced_qty ?? r.producedQty ?? 0),
  rejectedQty: Number(r.rejected_qty ?? r.rejectedQty ?? 0),
  unit: r.unit ?? 'Pcs',
  startTime: r.start_time ?? r.startTime ?? '',
  endTime: r.end_time ?? r.endTime ?? '',
  actualTimeMinutes: Number(r.actual_time_minutes ?? r.actualTimeMinutes ?? 0),
  rejectionCodeId: r.rejection_code_id ?? r.rejectionCodeId ?? '',
  notes: r.notes ?? '',
  status: r.status ?? 'PENDING',
  isApproved: r.status === 'APPROVED',
  createdAt: r.created_at ?? r.createdAt ?? '',
  warehouseId: r.warehouse_id ?? r.warehouseId ?? '',
});

export default function ProductionEntryPage() {
  const toast = useToast();
  const { selectedWarehouseId } = useWarehouseStore();

  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [poFilter, setPoFilter] = useState('ALL');
  const [wcFilter, setWcFilter] = useState('ALL');
  const [opFilter, setOpFilter] = useState('ALL');
  const [approvedFilter, setApprovedFilter] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [showSlideOver, setShowSlideOver] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'entries' | 'rejections'>('entries');

  // Rejection form
  const [showRejectionSlideOver, setShowRejectionSlideOver] = useState(false);
  const [rejectionForm, setRejectionForm] = useState({
    productionOrderId: '',
    workOrderId: '',
    date: new Date().toISOString().split('T')[0],
    shiftId: '',
    operatorId: '',
    machineId: '',
    rejectionCodeId: '',
    rejectedQty: '',
    notes: '',
  });
  const [rejectionError, setRejectionError] = useState<string | null>(null);

  // Real API Data States
  const [entries, setEntries] = useState<any[]>([]);
  const [productionOrders, setProductionOrders] = useState<any[]>([]);
  const [routings, setRoutings] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [operators, setOperators] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [rejectionCodes, setRejectionCodes] = useState<any[]>([]);
  const [workCenters, setWorkCenters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        entriesRes,
        poRes,
        routingsRes,
        workOrdersRes,
        shiftsRes,
        operatorsRes,
        machinesRes,
        rejRes,
        wcRes,
      ] = await Promise.all([
        getAllProductionEntries(),
        getAllProductionOrders(),
        getAllRoutings(),
        getAllWorkOrders(selectedWarehouseId),
        getAllShifts(),
        getAllOperators(),
        getAllMachines(),
        getAllRejectionCodes(),
        getAllWorkCenters(),
      ]);

      if (entriesRes.success && entriesRes.data) {
        setEntries(entriesRes.data.map(mapResponseToEntry));
      }
      if (poRes.success && poRes.data) {
        setProductionOrders(poRes.data);
      }
      if (routingsRes.success && routingsRes.data) {
        setRoutings(routingsRes.data);
      }
      if (workOrdersRes.success && workOrdersRes.data) {
        setWorkOrders(workOrdersRes.data);
      }
      if (shiftsRes.success && shiftsRes.data) {
        setShifts(shiftsRes.data);
      }
      if (operatorsRes.success && operatorsRes.data) {
        setOperators(operatorsRes.data);
      }
      if (machinesRes.success && machinesRes.data) {
        setMachines(machinesRes.data);
      }
      if (rejRes.success && rejRes.data) {
        setRejectionCodes(rejRes.data);
      }
      if (wcRes.success && wcRes.data) {
        setWorkCenters(wcRes.data);
      }
    } catch (error) {
      console.error('Failed to load production entries:', error);
      toast.error('Failed to load page data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWarehouseId]);

  // Warehouse partitioning filters
  // POs and entries are warehouse-scoped; masters (shifts/operators/machines/workcenters) are global
  const warehousePOs = useMemo(() => {
    if (!selectedWarehouseId) return productionOrders;
    return productionOrders.filter(
      (po) => po.warehouse_id === selectedWarehouseId || po.warehouseId === selectedWarehouseId
    );
  }, [productionOrders, selectedWarehouseId]);

  // Global masters — show all (not warehouse-filtered)
  const warehouseShifts = shifts;
  const warehouseOperators = operators;
  const warehouseMachines = machines;
  const warehouseRejectionCodes = rejectionCodes;
  const warehouseWorkCenters = workCenters;

  const warehouseEntries = useMemo(() => {
    if (!selectedWarehouseId) return entries;
    return entries.filter(
      (e) => e.warehouseId === selectedWarehouseId
    );
  }, [entries, selectedWarehouseId]);

  // Work Orders filtered by selected PO for Entry Form
  const selectedPO = useMemo(() => {
    return warehousePOs.find((po) => po.id === form.productionOrderId) || null;
  }, [form.productionOrderId, warehousePOs]);

  // Use real work orders from DB, filtered by selected production order
  const selectedPOWorkOrders = useMemo(() => {
    if (!form.productionOrderId) return [];
    return workOrders.filter(
      (wo) => wo.production_order_id === form.productionOrderId
    );
  }, [form.productionOrderId, workOrders]);

  // Keep routing stages as fallback if no work orders exist
  const selectedPOStages = useMemo(() => {
    if (selectedPOWorkOrders.length > 0) return []; // prefer work orders
    if (!selectedPO || !selectedPO.routing_id) return [];
    const routing = routings.find((r) => r.id === selectedPO.routing_id);
    if (!routing) return [];
    try {
      const parsed = typeof routing.stages === 'string' ? JSON.parse(routing.stages) : routing.stages;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse routing stages:', e);
      return [];
    }
  }, [selectedPO, routings, selectedPOWorkOrders]);

  // Selected work order (from DB) or routing stage (fallback)
  const selectedWorkOrder = useMemo(() => {
    return selectedPOWorkOrders.find((wo) => wo.id === form.workOrderId) || null;
  }, [form.workOrderId, selectedPOWorkOrders]);

  const selectedStage = useMemo(() => {
    const stageNum = Number(form.workOrderId);
    return selectedPOStages.find((s) => s.sequence === stageNum) || null;
  }, [form.workOrderId, selectedPOStages]);

  // Machines filtered by the work center of the selected work order
  const availableMachines = useMemo(() => {
    const wcId = selectedWorkOrder?.work_center_id || selectedStage?.workCenterId || selectedStage?.work_center_id;
    if (!wcId) return [];
    return machines.filter(
      (m) => m.work_center_id === wcId
    );
  }, [selectedWorkOrder, selectedStage, machines]);

  // Work Orders & Routing stages resolver for Rejection Form
  const selectedPORej = useMemo(() => {
    return warehousePOs.find((po) => po.id === rejectionForm.productionOrderId) || null;
  }, [rejectionForm.productionOrderId, warehousePOs]);

  const selectedPOWorkOrdersRej = useMemo(() => {
    if (!rejectionForm.productionOrderId) return [];
    return workOrders.filter(
      (wo) => wo.production_order_id === rejectionForm.productionOrderId
    );
  }, [rejectionForm.productionOrderId, workOrders]);

  const selectedPOStagesRej = useMemo(() => {
    if (selectedPOWorkOrdersRej.length > 0) return []; // prefer work orders
    if (!selectedPORej || !selectedPORej.routing_id) return [];
    const routing = routings.find((r) => r.id === selectedPORej.routing_id);
    if (!routing) return [];
    try {
      const parsed = typeof routing.stages === 'string' ? JSON.parse(routing.stages) : routing.stages;
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse routing stages:', e);
      return [];
    }
  }, [selectedPORej, routings, selectedPOWorkOrdersRej]);

  const selectedWorkOrderRej = useMemo(() => {
    return selectedPOWorkOrdersRej.find((wo) => wo.id === rejectionForm.workOrderId) || null;
  }, [rejectionForm.workOrderId, selectedPOWorkOrdersRej]);

  const selectedStageRej = useMemo(() => {
    const stageNum = Number(rejectionForm.workOrderId);
    return selectedPOStagesRej.find((s) => s.sequence === stageNum) || null;
  }, [rejectionForm.workOrderId, selectedPOStagesRej]);

  const availableMachinesRej = useMemo(() => {
    const wcId = selectedWorkOrderRej?.work_center_id || selectedStageRej?.workCenterId || selectedStageRej?.work_center_id;
    if (!wcId) return [];
    return machines.filter(
      (m) => m.work_center_id === wcId
    );
  }, [selectedWorkOrderRej, selectedStageRej, machines]);

  const selectedRejCode = useMemo(() => {
    return warehouseRejectionCodes.find((c) => c.id === rejectionForm.rejectionCodeId) || null;
  }, [rejectionForm.rejectionCodeId, warehouseRejectionCodes]);

  // Main list filters
  const filtered = useMemo(() => {
    return warehouseEntries.filter((e) => {
      if (dateFilter && e.date !== dateFilter) return false;
      if (poFilter !== 'ALL' && e.productionOrderId !== poFilter) return false;
      if (wcFilter !== 'ALL' && e.workCenterId !== wcFilter) return false;
      if (opFilter !== 'ALL' && e.operatorId !== opFilter) return false;
      if (approvedFilter === 'APPROVED' && e.status !== 'APPROVED') return false;
      if (approvedFilter === 'PENDING' && e.status !== 'PENDING') return false;
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
  }, [warehouseEntries, search, dateFilter, poFilter, wcFilter, opFilter, approvedFilter]);

  const stats = useMemo(() => {
    const total = warehouseEntries.length;
    const approved = warehouseEntries.filter((e) => e.status === 'APPROVED').length;
    const pending = total - approved;
    const totalProduced = warehouseEntries.reduce((s, e) => s + e.producedQty, 0);
    const totalRejected = warehouseEntries.reduce((s, e) => s + e.rejectedQty, 0);
    return { total, approved, pending, totalProduced, totalRejected };
  }, [warehouseEntries]);

  const rejectionEntries = useMemo(() => {
    return warehouseEntries.filter((e) => e.rejectedQty > 0);
  }, [warehouseEntries]);

  const rejectionStats = useMemo(() => {
    const total = rejectionEntries.length;
    const rework = 0;
    const scrap = total;
    const totalQty = rejectionEntries.reduce((s, r) => s + r.rejectedQty, 0);
    return { total, rework, scrap, totalQty };
  }, [rejectionEntries]);

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

  const openEditEntry = (entry: any) => {
    setEditingId(entry.id);
    setForm({
      productionOrderId: entry.productionOrderId,
      workOrderId: String(entry.stageNumber),
      date: entry.date,
      shiftId: entry.shiftId,
      operatorId: entry.operatorId,
      machineId: entry.machineId ?? '',
      startTime: entry.startTime.slice(0, 5),
      endTime: entry.endTime.slice(0, 5),
      producedQty: String(entry.producedQty),
      rejectedQty: String(entry.rejectedQty),
      rejectionCodeId: entry.rejectionCodeId ?? '',
      notes: entry.notes ?? '',
    });
    setFormError(null);
    setShowSlideOver(true);
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await approveProductionEntry(id);
      if (res.success) {
        toast.success('Production entry approved successfully');
        loadData();
      } else {
        toast.error(res.message || 'Failed to approve entry');
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      const res = await deleteProductionEntry(id);
      if (res.success) {
        toast.success('Production entry deleted successfully');
        loadData();
      } else {
        toast.error(res.message || 'Failed to delete entry');
      }
    } catch (err: any) {
      toast.error(err.message || 'Server error occurred');
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

  const handleSave = async () => {
    if (!form.productionOrderId) return setFormError('Production Order is required');
    if (!form.workOrderId) return setFormError('Work Order / Stage is required');
    if (!form.date) return setFormError('Date is required');
    if (!form.shiftId) return setFormError('Shift is required');
    if (!form.operatorId) return setFormError('Operator is required');
    if (!form.startTime) return setFormError('Start Time is required');
    if (!form.endTime) return setFormError('End Time is required');
    if (form.startTime >= form.endTime) return setFormError('End Time must be after Start Time');
    if (form.producedQty === '' || Number(form.producedQty) < 0) return setFormError('Produced Qty is required');
    if (form.rejectedQty !== '' && Number(form.rejectedQty) < 0) return setFormError('Rejected Qty cannot be negative');
    if (Number(form.rejectedQty || 0) > 0 && !form.rejectionCodeId) {
      return setFormError('Rejection Code is required when rejected qty > 0');
    }

    const producedQty = Number(form.producedQty);
    const rejectedQty = Number(form.rejectedQty || 0);
    const actualTimeMinutes = timeToMinutes(form.endTime) - timeToMinutes(form.startTime);

    const po = warehousePOs.find((p) => p.id === form.productionOrderId);
    // Prefer real work order from DB; fall back to routing stage
    const wo = selectedWorkOrder;
    const stage = !wo ? selectedPOStages.find((s) => s.sequence === Number(form.workOrderId)) : null;
    const shift = warehouseShifts.find((s) => s.id === form.shiftId);
    const operator = warehouseOperators.find((o) => o.id === form.operatorId);
    const machine = machines.find((m) => m.id === form.machineId) || null;

    if (!po || (!wo && !stage) || !shift || !operator) {
      return setFormError('Invalid selection — please check fields');
    }

    const payload = {
      productionOrderId: po.id,
      productionOrderNumber: po.po_number || po.poNumber,
      workOrderId: wo ? wo.id : `${po.id}-stage-${stage!.sequence}`,
      workOrderNumber: wo ? (wo.wo_number || wo.woNumber) : `${po.po_number || po.poNumber}-ST-${stage!.sequence}`,
      stageName: wo ? (wo.stage_name || wo.stageName) : stage!.operationName,
      stageNumber: wo ? (wo.stage_number ?? wo.stageNumber) : stage!.sequence,
      workCenterId: wo ? (wo.work_center_id || wo.workCenterId) : stage!.workCenterId,
      workCenterName: wo ? (wo.work_center_name || wo.workCenterName) : stage!.workCenterName,
      machineId: machine?.id ?? null,
      machineName: machine?.name ?? null,
      operatorId: operator.id,
      operatorName: operator.name,
      shiftId: shift.id,
      shiftName: shift.name,
      date: form.date,
      producedQty,
      rejectedQty,
      unit: po.unit || 'Pcs',
      startTime: form.startTime,
      endTime: form.endTime,
      actualTimeMinutes,
      rejectionCodeId: form.rejectionCodeId || null,
      notes: form.notes || null,
      warehouseId: selectedWarehouseId || po.warehouse_id || null,
    };

    try {
      if (editingId) {
        const res = await updateProductionEntry(editingId, payload);
        if (res.success) {
          toast.success('Production entry updated successfully');
          setShowSlideOver(false);
          loadData();
        } else {
          setFormError(res.message || 'Failed to update entry');
        }
      } else {
        const res = await createProductionEntry(payload);
        if (res.success) {
          toast.success('Production entry saved successfully');
          setShowSlideOver(false);
          loadData();
        } else {
          setFormError(res.message || 'Failed to save entry');
        }
      }
    } catch (error: any) {
      setFormError(error.message || 'Server error occurred');
    }
  };

  const openRejectionForm = () => {
    setRejectionForm({
      productionOrderId: '',
      workOrderId: '',
      date: new Date().toISOString().split('T')[0],
      shiftId: '',
      operatorId: '',
      machineId: '',
      rejectionCodeId: '',
      rejectedQty: '',
      notes: '',
    });
    setRejectionError(null);
    setShowRejectionSlideOver(true);
  };

  const handleSaveRejection = async () => {
    if (!rejectionForm.productionOrderId) return setRejectionError('Production Order is required');
    if (!rejectionForm.workOrderId) return setRejectionError('Work Order / Stage is required');
    if (!rejectionForm.date) return setRejectionError('Date is required');
    if (!rejectionForm.shiftId) return setRejectionError('Shift is required');
    if (!rejectionForm.operatorId) return setRejectionError('Operator is required');
    if (!rejectionForm.rejectionCodeId) return setRejectionError('Rejection Code is required');
    if (!rejectionForm.rejectedQty || Number(rejectionForm.rejectedQty) <= 0) {
      return setRejectionError('Rejected Qty is required and must be > 0');
    }

    const rejectedQty = Number(rejectionForm.rejectedQty);
    const po = warehousePOs.find((p) => p.id === rejectionForm.productionOrderId);
    // Prefer real work order from DB; fall back to routing stage
    const wo = selectedWorkOrderRej;
    const stage = !wo ? selectedPOStagesRej.find((s) => s.sequence === Number(rejectionForm.workOrderId)) : null;
    const shift = warehouseShifts.find((s) => s.id === rejectionForm.shiftId);
    const operator = warehouseOperators.find((o) => o.id === rejectionForm.operatorId);
    const machine = machines.find((m) => m.id === rejectionForm.machineId) || null;

    if (!po || (!wo && !stage) || !shift || !operator) {
      return setRejectionError('Invalid selection');
    }

    const payload = {
      productionOrderId: po.id,
      productionOrderNumber: po.po_number || po.poNumber,
      workOrderId: wo ? wo.id : `${po.id}-stage-${stage!.sequence}`,
      workOrderNumber: wo ? (wo.wo_number || wo.woNumber) : `${po.po_number || po.poNumber}-ST-${stage!.sequence}`,
      stageName: wo ? (wo.stage_name || wo.stageName) : stage!.operationName,
      stageNumber: wo ? (wo.stage_number ?? wo.stageNumber) : stage!.sequence,
      workCenterId: wo ? (wo.work_center_id || wo.workCenterId) : stage!.workCenterId,
      workCenterName: wo ? (wo.work_center_name || wo.workCenterName) : stage!.workCenterName,
      machineId: machine?.id ?? null,
      machineName: machine?.name ?? null,
      operatorId: operator.id,
      operatorName: operator.name,
      shiftId: shift.id,
      shiftName: shift.name,
      date: rejectionForm.date,
      producedQty: 0,
      rejectedQty,
      unit: po.unit || 'Pcs',
      startTime: '00:00',
      endTime: '00:00',
      actualTimeMinutes: 0,
      rejectionCodeId: rejectionForm.rejectionCodeId,
      notes: rejectionForm.notes || null,
      warehouseId: selectedWarehouseId || po.warehouse_id || null,
    };

    try {
      const res = await createProductionEntry(payload);
      if (res.success) {
        toast.success('Rejection entry logged successfully');
        setShowRejectionSlideOver(false);
        loadData();
      } else {
        setRejectionError(res.message || 'Failed to log rejection');
      }
    } catch (error: any) {
      setRejectionError(error.message || 'Server error occurred');
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
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-blue-700 transition-colors cursor-pointer whitespace-nowrap flex"
              >
                <i className="ri-add-line" />
                New Entry
              </button>
            ) : (
              <button
                onClick={openRejectionForm}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 transition-colors cursor-pointer whitespace-nowrap flex"
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
                className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors ${activeTab === 'entries'
                  ? 'bg-slate-100 text-[#1e293b]'
                  : 'text-[#64748b] hover:bg-slate-50'
                  }`}
              >
                <i className="ri-file-list-3-line mr-1.5" />
                Production Entries
              </button>
              <button
                onClick={() => setActiveTab('rejections')}
                className={`px-4 py-2 text-sm font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors ${activeTab === 'rejections'
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
                        {warehousePOs.map((po) => (
                          <option key={po.id} value={po.id}>
                            {po.po_number || po.poNumber}
                          </option>
                        ))}
                      </select>
                      <select
                        value={wcFilter}
                        onChange={(e) => setWcFilter(e.target.value)}
                        className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 cursor-pointer bg-white"
                      >
                        <option value="ALL">All Work Centers</option>
                        {warehouseWorkCenters.map((wc) => (
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
                        {warehouseOperators.map((op) => (
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
                      {isLoading ? (
                        <tr>
                          <td colSpan={13} className="px-4 py-10 text-center text-sm text-[#94a3b8]">
                            Loading production entries...
                          </td>
                        </tr>
                      ) : filtered.length === 0 ? (
                        <tr>
                          <td colSpan={13} className="px-4 py-10 text-center text-sm text-[#94a3b8]">
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
                    Showing {filtered.length} of {warehouseEntries.length} entries
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
                  {rejectionEntries.length} rejection entries on record
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
                      {isLoading ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#94a3b8]">
                            Loading rejection entries...
                          </td>
                        </tr>
                      ) : rejectionEntries.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#94a3b8]">
                            <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-slate-50 border border-slate-200 mb-3">
                              <i className="ri-inbox-line text-xl text-slate-300" />
                            </div>
                            No rejection entries logged
                          </td>
                        </tr>
                      ) : (
                        rejectionEntries.map((r) => (
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
                                {
                                  warehouseRejectionCodes.find((c) => c.id === r.rejectionCodeId)?.code ??
                                  'REJ'
                                }
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
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border bg-rose-50 text-rose-700 border-rose-200">
                                <i className="ri-delete-bin-line" /> Scrap
                              </span>
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
                                  onClick={() => handleDelete(r.id)}
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
                    Showing {rejectionEntries.length} of {rejectionEntries.length} entries
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
                  {warehousePOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number || po.poNumber} — {po.item_name || po.itemName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Work Order / Stage */}
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
                  {/* Show real work orders from DB first */}
                  {selectedPOWorkOrders.map((wo: any) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.wo_number} — Stage {wo.stage_number}: {wo.stage_name}
                    </option>
                  ))}
                  {/* Fallback: routing stages if no work orders exist */}
                  {selectedPOWorkOrders.length === 0 && selectedPOStages.map((stage: any) => (
                    <option key={stage.sequence} value={stage.sequence}>
                      Stage {stage.sequence}: {stage.operationName}
                    </option>
                  ))}
                  {selectedPOWorkOrders.length === 0 && selectedPOStages.length === 0 && form.productionOrderId && (
                    <option disabled value="">
                      No work orders found for this PO
                    </option>
                  )}
                </select>
                {selectedPOWorkOrders.length === 0 && selectedPOStages.length === 0 && form.productionOrderId && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No work orders exist for this PO yet. Create work orders first.
                  </p>
                )}
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
                  {warehouseShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time || s.startTime} – {s.end_time || s.endTime})
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
                  {warehouseOperators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.employee_code || o.employeeCode})
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
                    {timeToMinutes(form.endTime) - timeToMinutes(form.startTime)} min
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
                    {warehouseRejectionCodes.map((rc) => (
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
                  {warehousePOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number || po.poNumber} — {po.item_name || po.itemName}
                    </option>
                  ))}
                </select>
              </div>

              {/* WO / Stage */}
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
                  {/* Show real work orders from DB first */}
                  {selectedPOWorkOrdersRej.map((wo: any) => (
                    <option key={wo.id} value={wo.id}>
                      {wo.wo_number} — Stage {wo.stage_number}: {wo.stage_name}
                    </option>
                  ))}
                  {/* Fallback: routing stages if no work orders exist */}
                  {selectedPOWorkOrdersRej.length === 0 && selectedPOStagesRej.map((stage: any) => (
                    <option key={stage.sequence} value={stage.sequence}>
                      Stage {stage.sequence}: {stage.operationName}
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
                  {warehouseShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time || s.startTime} – {s.end_time || s.endTime})
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
                  {warehouseOperators.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.employee_code || o.employeeCode})
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
                  {warehouseRejectionCodes.map((rc) => (
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
                    value={selectedPORej?.unit || 'Pcs'}
                    readOnly
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500"
                  />
                </div>
              </div>

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
