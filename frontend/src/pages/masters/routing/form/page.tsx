import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { getAllRoutings, createRouting, updateRouting } from '@/api/routing.api';
import { getAllItems } from '@/api/item.api';
import { getAllWorkCenters } from '@/api/workcenter.api';
import { getAllMachines } from '@/api/machine.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

/* ─── helpers ─── */
function formatMinutes(total: number) {
  const hrs = Math.floor(total / 60);
  const mins = total % 60;
  if (hrs === 0) return `${mins} min`;
  if (mins === 0) return `${hrs} hrs`;
  return `${hrs} hrs ${mins} min`;
}

/* ─── local form types ─── */
interface StageFormRow {
  id: string;
  stageName: string;
  workCenterId: string;
  machineId: string;
  standardTimeMinutes: number;
  setupTimeMinutes: number;
  qcRequired: boolean;
  description: string;
}

interface RoutingFormState {
  name: string;
  code: string;
  itemId: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'OBSOLETE';
}

/* ─── Searchable Item Dropdown ─── */
function ItemSearchDropdown({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (itemId: string, itemName: string | null) => void;
  items: any[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.id === value);

  useEffect(() => {
    if (selected) setQuery(selected.name);
    else setQuery('');
  }, [selected?.id, value]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return items.slice(0, 8);
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.code && i.code.toLowerCase().includes(q)),
    );
  }, [query, items]);

  const handleSelect = (item: any) => {
    onChange(item.id, item.name);
    setQuery(item.name);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('', null);
    setQuery('');
    setOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
            if (value) onChange('', null);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search and select an item..."
          className="w-full h-10 pl-9 pr-8 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
        />
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded hover:bg-[#f1f5f9] text-[#94a3b8] cursor-pointer"
          >
            <i className="ri-close-line text-xs" />
          </button>
        )}
      </div>
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#94a3b8]">No items found</div>
          ) : (
            filtered.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-[#f8fafc] transition-colors cursor-pointer ${value === item.id ? 'bg-indigo-50 text-[#4f46e5] font-medium' : 'text-[#1e293b]'}`}
              >
                <div className="flex items-center justify-between">
                  <span>{item.name}</span>
                  <span className="text-xs text-[#94a3b8] font-mono">{item.code}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main Form Page ─── */
export default function RoutingFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const toast = useToast();
  const { selectedWarehouseId } = useWarehouseStore();

  const [activeItems, setActiveItems] = useState<any[]>([]);
  const [activeWorkCenters, setActiveWorkCenters] = useState<any[]>([]);
  const [activeMachines, setActiveMachines] = useState<any[]>([]);

  const [form, setForm] = useState<RoutingFormState>({
    name: '',
    code: '',
    itemId: '',
    version: '1.0',
    status: 'DRAFT',
  });

  const [stages, setStages] = useState<StageFormRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  /* confirm dialogs */
  const [confirmDeleteStage, setConfirmDeleteStage] = useState<StageFormRow | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  /* refs for focus management */
  const nameInputRef = useRef<HTMLInputElement>(null);
  const stageNameRefs = useRef<(HTMLInputElement | null)[]>([]);
  const wcSelectRefs = useRef<(HTMLSelectElement | null)[]>([]);
  const stdTimeRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setupTimeRefs = useRef<(HTMLInputElement | null)[]>([]);

  const fetchInitialData = async () => {
    try {
      const [itemsRes, wcRes, mcRes, routingsRes] = await Promise.all([
        getAllItems(),
        getAllWorkCenters(),
        getAllMachines(),
        getAllRoutings(),
      ]);

      let itemsLocal: any[] = [];
      if (itemsRes.success && itemsRes.data) {
        itemsLocal = itemsRes.data.filter((i: any) => i.is_active || i.isActive);
        if (selectedWarehouseId) {
          // item API returns warehouse field as `warehouseid` (lowercase, no underscore)
          itemsLocal = itemsLocal.filter((i: any) =>
            i.warehouseid === selectedWarehouseId ||
            i.warehouse_id === selectedWarehouseId ||
            i.warehouseId === selectedWarehouseId
          );
        }
        setActiveItems(itemsLocal);
      }
      if (wcRes.success && wcRes.data) {
        let wcLocal = wcRes.data.filter((w: any) => w.is_active || w.isActive);
        if (selectedWarehouseId) {
          wcLocal = wcLocal.filter((w: any) => w.warehouse_id === selectedWarehouseId || w.warehouseId === selectedWarehouseId);
        }
        setActiveWorkCenters(wcLocal);
      }
      if (mcRes.success && mcRes.data) {
        let mcLocal = mcRes.data.filter((m: any) => m.is_active || m.isActive);
        if (selectedWarehouseId) {
          mcLocal = mcLocal.filter((m: any) => m.warehouse_id === selectedWarehouseId || m.warehouseId === selectedWarehouseId);
        }
        setActiveMachines(mcLocal);
      }

      if (isEdit && id && routingsRes.success && routingsRes.data) {
        const found = routingsRes.data.find((r: any) => r.id === id);
        if (found) {
          setForm({
            name: found.name || '',
            code: found.code || '',
            itemId: found.item_id || '',
            version: found.version || '1.0',
            status: found.status || 'DRAFT',
          });

          const parsedStages = typeof found.stages === 'string' ? JSON.parse(found.stages) : found.stages;
          setStages(
            (parsedStages || []).map((s: any) => ({
              id: s.id || `rs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              stageName: s.stageName || s.operationName || '',
              workCenterId: s.workCenterId || '',
              machineId: s.machineId || '',
              standardTimeMinutes: s.standardTimeMinutes || s.runTimeMinutes || 0,
              setupTimeMinutes: s.setupTimeMinutes || 0,
              qcRequired: s.qcRequired || false,
              description: s.description || '',
            }))
          );
        } else {
          toast.error('Routing not found');
          navigate('/masters/routing');
        }
      }
    } catch (err) {
      toast.error('Failed to load routing data');
    }
  };

  useEffect(() => {
    fetchInitialData();
    setTimeout(() => nameInputRef.current?.focus(), 80);
  }, [id, isEdit]);

  /* update helper */
  const updateForm = (field: keyof RoutingFormState, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) {
      setErrors((e) => {
        const n = { ...e };
        delete n[field];
        return n;
      });
    }
  };

  /* auto-suggest code on name blur */
  const handleNameBlur = async () => {
    if (!isEdit && !form.code.trim() && form.name.trim()) {
      try {
        const rRes = await getAllRoutings();
        const count = (rRes.data || []).length + 1;
        updateForm('code', `RT-${String(count).padStart(3, '0')}`);
      } catch {
        updateForm('code', `RT-${String(Date.now()).slice(-3)}`);
      }
    }
  };

  /* stage helpers */
  const addStage = useCallback(() => {
    const newRow: StageFormRow = {
      id: `rs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      stageName: '',
      workCenterId: '',
      machineId: '',
      standardTimeMinutes: 0,
      setupTimeMinutes: 0,
      qcRequired: false,
      description: '',
    };
    setStages((prev) => [...prev, newRow]);
    setTimeout(() => {
      const idx = stages.length;
      stageNameRefs.current[idx]?.focus();
    }, 60);
  }, [stages.length]);

  const updateStage = (idx: number, patch: Partial<StageFormRow>) => {
    setStages((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const moveStage = (idx: number, direction: -1 | 1) => {
    setStages((prev) => {
      const next = [...prev];
      const swapIdx = idx + direction;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const deleteStage = (stage: StageFormRow) => {
    if (stages.length === 1) {
      setConfirmDeleteStage(stage);
      return;
    }
    setStages((prev) => prev.filter((s) => s.id !== stage.id));
  };

  const confirmDeleteLastStage = () => {
    if (!confirmDeleteStage) return;
    setStages((prev) => prev.filter((s) => s.id !== confirmDeleteStage.id));
    setConfirmDeleteStage(null);
  };

  /* summary */
  const summary = useMemo(() => {
    const totalStages = stages.length;
    const totalStd = stages.reduce((s, r) => s + (Number(r.standardTimeMinutes) || 0), 0);
    const totalSetup = stages.reduce((s, r) => s + (Number(r.setupTimeMinutes) || 0), 0);
    const qcCount = stages.filter((r) => r.qcRequired).length;
    return { totalStages, totalStd, totalSetup, totalTime: totalStd + totalSetup, qcCount };
  }, [stages]);

  /* validation */
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Routing name is required';
    if (!form.code.trim()) e.code = 'Code is required';
    stages.forEach((s, i) => {
      if (!s.stageName.trim()) e[`stage_${i}_name`] = 'Stage name required';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* save */
  const handleSave = async () => {
    if (!validate()) {
      toast.error('Please fix the errors before saving');
      return;
    }
    setIsSaving(true);
    try {
      const savedStages = stages.map((s, idx) => {
        const wc = activeWorkCenters.find((w) => w.id === s.workCenterId);
        const mc = activeMachines.find((m) => m.id === s.machineId);
        return {
          id: s.id.startsWith('rs-') ? s.id : `rs-${Date.now()}-${idx}`,
          stageNumber: idx + 1,
          stageName: s.stageName,
          workCenterId: s.workCenterId || null,
          workCenterName: wc?.name ?? null,
          machineId: s.machineId || null,
          machineName: mc?.name ?? null,
          standardTimeMinutes: Number(s.standardTimeMinutes) || 0,
          setupTimeMinutes: Number(s.setupTimeMinutes) || 0,
          description: s.description || null,
          qcRequired: s.qcRequired,
        };
      });

      const totalTime = savedStages.reduce(
        (sum, s) => sum + s.standardTimeMinutes + s.setupTimeMinutes,
        0,
      );

      const item = activeItems.find((i) => i.id === form.itemId);

      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        itemId: form.itemId || null,
        itemName: item?.name ?? null,
        version: form.version.trim() || '1.0',
        status: form.status,
        stages: savedStages.map((s) => ({
          sequence: s.stageNumber,
          workCenterId: s.workCenterId || '',
          workCenterName: s.workCenterName || '',
          machineId: s.machineId || '',
          machineName: s.machineName || '',
          operationName: s.stageName,
          setupTimeMinutes: s.setupTimeMinutes,
          runTimeMinutes: s.standardTimeMinutes,
          description: s.description || '',
        })),
        totalTimeMinutes: totalTime,
        isActive: form.status !== 'OBSOLETE',
        warehouseId: selectedWarehouseId || null,
      };

      let res;
      if (isEdit && id) {
        res = await updateRouting(id, payload);
      } else {
        res = await createRouting(payload);
      }

      if (res.success) {
        toast.success(isEdit ? 'Routing updated' : 'Routing created');
        navigate('/masters/routing');
      } else {
        toast.error(res.message || 'Failed to save routing');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save routing');
    } finally {
      setIsSaving(false);
    }
  };

  /* keyboard nav inside table */
  const focusStageName = (idx: number) => stageNameRefs.current[idx]?.focus();
  const focusWorkCenter = (idx: number) => wcSelectRefs.current[idx]?.focus();
  const focusStdTime = (idx: number) => stdTimeRefs.current[idx]?.focus();
  const focusSetupTime = (idx: number) => setupTimeRefs.current[idx]?.focus();

  const onStageNameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      focusWorkCenter(idx);
    }
  };

  const onWorkCenterKeyDown = (e: React.KeyboardEvent<HTMLSelectElement>, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      focusStdTime(idx);
    }
  };

  const onSetupTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (idx === stages.length - 1) {
        addStage();
      } else {
        focusStageName(idx + 1);
      }
    }
  };

  /* get machines for a work center
     NOTE: Machine API returns snake_case (work_center_id) from the DB */
  const getMachinesForWC = (wcId: string) => {
    if (!wcId) return activeMachines;
    return activeMachines.filter(
      (m) => (m.work_center_id ?? m.workCenterId) === wcId,
    );
  };

  const machinesForRow = (wcId: string) => getMachinesForWC(wcId);

  const isDirty =
    form.name.trim() ||
    form.code.trim() ||
    stages.length > 0;

  const handleCancel = () => {
    if (isDirty && !isEdit) {
      setConfirmCancel(true);
      return;
    }
    navigate('/masters/routing');
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-6xl">
        {/* Top bar */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">
                {isEdit ? 'Edit Routing' : 'New Routing'}
              </h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                {isEdit
                  ? 'Update routing stages and production sequence'
                  : 'Create a production routing with configurable stages'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
            >
              {isSaving ? (
                <>
                  <i className="ri-loader-4-line animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <i className="ri-save-line" /> Save Routing
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Header Fields ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Routing Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Routing Name <span className="text-red-500">*</span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                onBlur={handleNameBlur}
                placeholder="e.g. Industrial Pump Routing"
                className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.name
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Code <span className="text-red-500">*</span>
                <span className="ml-1 text-[10px] font-normal normal-case text-[#94a3b8]">
                  (auto-suggest RT-XXX)
                </span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => updateForm('code', e.target.value.toUpperCase())}
                placeholder="RT-001"
                className={`w-full h-10 px-3 rounded-lg border text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.code
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                }`}
              />
              {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
            </div>

            {/* Linked Item */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Linked Item
                <span className="ml-1 text-[10px] font-normal normal-case text-[#94a3b8]">
                  (optional — generic routing)
                </span>
              </label>
              <ItemSearchDropdown
                value={form.itemId}
                onChange={(itemId, itemName) => {
                  updateForm('itemId', itemId);
                }}
                items={activeItems}
              />
            </div>

            {/* Version */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Version
              </label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => updateForm('version', e.target.value)}
                placeholder="1.0"
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Status <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {(['ACTIVE', 'DRAFT', 'OBSOLETE'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateForm('status', s)}
                    className={`flex-1 h-10 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      form.status === s
                        ? s === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-200'
                          : s === 'DRAFT'
                            ? 'bg-amber-50 text-amber-700 border-amber-300 ring-2 ring-amber-200'
                            : 'bg-slate-100 text-slate-600 border-slate-300 ring-2 ring-slate-200'
                        : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Stages Section ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50">
                <i className="ri-git-branch-line text-[#4f46e5]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#1e293b]">Production Stages</h3>
                <p className="text-xs text-[#64748b]">
                  Define the sequence of operations for this routing
                </p>
              </div>
            </div>
            <button
              onClick={addStage}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#4f46e5] text-white text-xs font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" /> Add Stage
            </button>
          </div>

          {stages.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <i className="ri-git-branch-line text-4xl text-[#e2e8f0] block mb-2" />
              <p className="text-sm text-[#94a3b8]">No stages added yet</p>
              <button
                onClick={addStage}
                className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#4f46e5] hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line" /> Add First Stage
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    {[
                      'Stage',
                      'Stage Name',
                      'Work Center',
                      'Machine',
                      'Std Time (min)',
                      'Setup (min)',
                      'QC',
                      'Actions',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {stages.map((s, idx) => {
                    const machines = machinesForRow(s.workCenterId);
                    const isFirst = idx === 0;
                    const isLast = idx === stages.length - 1;
                    const hasError = errors[`stage_${idx}_name`];
                    return (
                      <tr key={s.id} className="hover:bg-[#f8fafc]/60 transition-colors">
                        {/* Stage No */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#f1f5f9] text-xs font-bold text-[#64748b]">
                            {idx + 1}
                          </span>
                        </td>

                        {/* Stage Name */}
                        <td className="px-4 py-3 whitespace-nowrap min-w-[180px]">
                          <input
                            ref={(el) => {
                              stageNameRefs.current[idx] = el;
                            }}
                            type="text"
                            value={s.stageName}
                            onChange={(e) => updateStage(idx, { stageName: e.target.value })}
                            onKeyDown={(e) => onStageNameKeyDown(e, idx)}
                            placeholder="e.g. Cutting, Assembly, Inspection"
                            className={`w-full h-9 px-2.5 rounded-md border text-sm bg-white focus:outline-none focus:ring-2 transition-colors ${
                              hasError
                                ? 'border-red-400 focus:ring-red-200'
                                : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                            }`}
                          />
                          {hasError && (
                            <p className="text-[11px] text-red-500 mt-0.5">{hasError}</p>
                          )}
                        </td>

                        {/* Work Center */}
                        <td className="px-4 py-3 whitespace-nowrap min-w-[150px]">
                          <select
                            ref={(el) => {
                              wcSelectRefs.current[idx] = el;
                            }}
                            value={s.workCenterId}
                            onChange={(e) => {
                              const wcId = e.target.value;
                              updateStage(idx, {
                                workCenterId: wcId,
                                machineId: '',
                              });
                            }}
                            onKeyDown={(e) => onWorkCenterKeyDown(e, idx)}
                            className="w-full h-9 px-2.5 rounded-md border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer"
                          >
                            <option value="">— Select —</option>
                            {activeWorkCenters.map((w) => (
                              <option key={w.id} value={w.id}>
                                {w.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Machine */}
                        <td className="px-4 py-3 whitespace-nowrap min-w-[150px]">
                          <select
                            value={s.machineId}
                            onChange={(e) => updateStage(idx, { machineId: e.target.value })}
                            disabled={!s.workCenterId}
                            className="w-full h-9 px-2.5 rounded-md border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer disabled:bg-[#f8fafc] disabled:text-[#94a3b8]"
                          >
                            <option value="">
                              {s.workCenterId ? '— Select Machine —' : '— Select Work Center First —'}
                            </option>
                            {machines.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Std Time */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            ref={(el) => {
                              stdTimeRefs.current[idx] = el;
                            }}
                            type="number"
                            min={0}
                            value={s.standardTimeMinutes}
                            onChange={(e) =>
                              updateStage(idx, {
                                standardTimeMinutes: parseInt(e.target.value) || 0,
                              })
                            }
                            className="w-20 h-9 px-2.5 rounded-md border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                          />
                        </td>

                        {/* Setup Time */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <input
                            ref={(el) => {
                              setupTimeRefs.current[idx] = el;
                            }}
                            type="number"
                            min={0}
                            value={s.setupTimeMinutes}
                            onChange={(e) =>
                              updateStage(idx, {
                                setupTimeMinutes: parseInt(e.target.value) || 0,
                              })
                            }
                            onKeyDown={(e) => onSetupTimeKeyDown(e, idx)}
                            className="w-20 h-9 px-2.5 rounded-md border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                          />
                        </td>

                        {/* QC */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateStage(idx, { qcRequired: !s.qcRequired })}
                              className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 ${
                                s.qcRequired ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'
                              }`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                  s.qcRequired ? 'translate-x-5' : 'translate-x-1'
                                }`}
                              />
                            </button>
                            {s.qcRequired && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                QC
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => moveStage(idx, -1)}
                              disabled={isFirst}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] disabled:text-[#e2e8f0] disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Move up"
                            >
                              <i className="ri-arrow-up-line text-sm" />
                            </button>
                            <button
                              onClick={() => moveStage(idx, 1)}
                              disabled={isLast}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] disabled:text-[#e2e8f0] disabled:hover:bg-transparent transition-colors cursor-pointer"
                              title="Move down"
                            >
                              <i className="ri-arrow-down-line text-sm" />
                            </button>
                            <button
                              onClick={() => deleteStage(s)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
                              title="Delete stage"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Add stage button below table */}
          {stages.length > 0 && (
            <div className="px-5 py-3 border-t border-[#e2e8f0] flex items-center gap-2">
              <button
                onClick={addStage}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#4f46e5] hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line" /> Add Stage
              </button>
              <span className="text-xs text-[#94a3b8]">
                Press Enter in Setup Time of last row to add a new stage
              </span>
            </div>
          )}
        </div>

        {/* ── Summary Bar ── */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0]">
                <i className="ri-stack-line text-[#4f46e5] text-sm" />
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Total Stages</p>
                <p className="text-lg font-bold text-[#1e293b]">{summary.totalStages}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0]">
                <i className="ri-time-line text-blue-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Std Time</p>
                <p className="text-lg font-bold text-[#1e293b]">{formatMinutes(summary.totalStd)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0]">
                <i className="ri-settings-3-line text-amber-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Setup Time</p>
                <p className="text-lg font-bold text-[#1e293b]">{formatMinutes(summary.totalSetup)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0]">
                <i className="ri-hourglass-line text-emerald-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-[#64748b]">Total Time</p>
                <p className="text-lg font-bold text-[#1e293b]">{formatMinutes(summary.totalTime)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#e2e8f0]">
                <i className="ri-shield-check-line text-purple-600 text-sm" />
              </div>
              <div>
                <p className="text-xs text-[#64748b]">QC Stages</p>
                <p className="text-lg font-bold text-[#1e293b]">{summary.qcCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Bottom Save / Cancel ── */}
        <div className="flex items-center justify-end gap-2 pb-4">
          <button
            onClick={handleCancel}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {isSaving ? (
              <>
                <i className="ri-loader-4-line animate-spin" /> Saving…
              </>
            ) : (
              <>
                <i className="ri-save-line" /> Save Routing
              </>
            )}
          </button>
        </div>
      </div>

      {/* Confirm delete last stage */}
      <ConfirmDialog
        open={!!confirmDeleteStage}
        title="Delete Last Stage?"
        message="This is the only remaining stage. Deleting it will leave the routing with no stages. Are you sure?"
        variant="warning"
        confirmLabel="Yes, Delete (Y)"
        onConfirm={confirmDeleteLastStage}
        onCancel={() => setConfirmDeleteStage(null)}
      />

      {/* Confirm cancel unsaved */}
      <ConfirmDialog
        open={confirmCancel}
        title="Discard Changes?"
        message="You have unsaved changes. Are you sure you want to leave this page?"
        variant="warning"
        confirmLabel="Yes, Discard (Y)"
        onConfirm={() => {
          setConfirmCancel(false);
          navigate('/masters/routing');
        }}
        onCancel={() => setConfirmCancel(false)}
      />
    </AppLayout>
  );
}