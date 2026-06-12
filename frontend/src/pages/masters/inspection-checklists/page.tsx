import { useState, useMemo, useCallback, useEffect } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import {
  createInspectionChecklist,
  getAllInspectionChecklists,
  updateInspectionChecklist,
  deleteInspectionChecklist
} from '@/api/inspectionchecklist.api';
import {
  getAllQualityParameters
} from '@/api/qualityparameter.api';

interface QualityParameter {
  id: string;
  name: string;
  code: string;
  type: string;
  isActive: boolean;
}

interface InspectionChecklist {
  id: string;
  name: string;
  code: string;
  applicableTo: 'INCOMING' | 'IN_PROCESS' | 'FINAL';
  itemTypeTarget: 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED_GOOD' | 'ALL';
  parameters: string[]; // maps to parameter_ids array
  samplingPlan: 'ALL' | 'RANDOM_10' | 'RANDOM_20' | 'AQL';
  isActive: boolean;
}

const APPLICABLE_OPTIONS: { value: InspectionChecklist['applicableTo']; label: string }[] = [
  { value: 'INCOMING', label: 'Incoming' },
  { value: 'IN_PROCESS', label: 'In-Process' },
  { value: 'FINAL', label: 'Final' },
];

const ITEM_TYPE_OPTIONS: { value: InspectionChecklist['itemTypeTarget']; label: string }[] = [
  { value: 'RAW_MATERIAL', label: 'Raw Material' },
  { value: 'SEMI_FINISHED', label: 'Semi-Finished' },
  { value: 'FINISHED_GOOD', label: 'Finished Good' },
  { value: 'ALL', label: 'All' },
];

const SAMPLING_OPTIONS: { value: InspectionChecklist['samplingPlan']; label: string }[] = [
  { value: 'ALL', label: 'All Units' },
  { value: 'RANDOM_10', label: 'Random 10%' },
  { value: 'RANDOM_20', label: 'Random 20%' },
  { value: 'AQL', label: 'AQL Level' },
];

const APPLICABLE_BADGE: Record<InspectionChecklist['applicableTo'], { bg: string; text: string; label: string }> = {
  INCOMING: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Incoming' },
  IN_PROCESS: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In-Process' },
  FINAL: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Final' },
};

const ITEM_TYPE_LABEL: Record<InspectionChecklist['itemTypeTarget'], string> = {
  RAW_MATERIAL: 'Raw Material',
  SEMI_FINISHED: 'Semi-Finished',
  FINISHED_GOOD: 'Finished Good',
  ALL: 'All Types',
};

const SAMPLING_LABEL: Record<InspectionChecklist['samplingPlan'], string> = {
  ALL: 'All Units',
  RANDOM_10: 'Random 10%',
  RANDOM_20: 'Random 20%',
  AQL: 'AQL Level',
};

const QP_TYPE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  PASS_FAIL: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Pass/Fail' },
  NUMERIC: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Numeric' },
  TEXT: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Text' },
  MISSING: { bg: 'bg-red-50 border border-red-200', text: 'text-red-700', label: 'Not Available' }
};

export default function InspectionChecklistsPage() {
  const toast = useToast();
  const [items, setItems] = useState<InspectionChecklist[]>([]);
  const [qualityParameters, setQualityParameters] = useState<QualityParameter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [applicableFilter, setApplicableFilter] = useState<'ALL' | InspectionChecklist['applicableTo']>('ALL');
  const [itemTypeFilter, setItemTypeFilter] = useState<'ALL' | InspectionChecklist['itemTypeTarget']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<InspectionChecklist>>({
    applicableTo: 'INCOMING',
    itemTypeTarget: 'RAW_MATERIAL',
    samplingPlan: 'ALL',
    parameters: [],
    isActive: true,
  });
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const activeParameters = useMemo(
    () => qualityParameters.filter((p) => p.isActive),
    [qualityParameters]
  );

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const qpRes = await getAllQualityParameters();
      if (qpRes.success && qpRes.data) {
        setQualityParameters(
          qpRes.data.map((qp) => ({
            id: qp.id,
            name: qp.name,
            code: qp.code,
            type: qp.type,
            isActive: qp.is_active,
          })),
        );
      }

      const clRes = await getAllInspectionChecklists();
      if (clRes.success && clRes.data) {
        setItems(
          clRes.data.map((cl) => ({
            id: cl.id,
            name: cl.name,
            code: cl.code,
            applicableTo: cl.applicable_to as any,
            itemTypeTarget: cl.item_type_target as any,
            parameters: cl.parameter_ids || [],
            samplingPlan: cl.sampling_plan as any,
            isActive: cl.is_active,
          })),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q);
      const matchesApplicable = applicableFilter === 'ALL' || it.applicableTo === applicableFilter;
      const matchesItemType = itemTypeFilter === 'ALL' || it.itemTypeTarget === itemTypeFilter;
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? it.isActive : !it.isActive);
      return matchesSearch && matchesApplicable && matchesItemType && matchesStatus;
    });
  }, [items, search, applicableFilter, itemTypeFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const incoming = items.filter((i) => i.applicableTo === 'INCOMING').length;
    const inProcess = items.filter((i) => i.applicableTo === 'IN_PROCESS').length;
    const final = items.filter((i) => i.applicableTo === 'FINAL').length;
    return { total, active, inactive: total - active, incoming, inProcess, final };
  }, [items]);

  const getParameterNames = useCallback((paramIds: string[]) => {
    return paramIds.map((id) => {
      const p = qualityParameters.find((qp) => qp.id === id);
      if (p) return p;
      return {
        id,
        name: 'Parameter is currently not available',
        code: 'UNAVAILABLE',
        type: 'MISSING',
        isActive: false,
      };
    });
  }, [qualityParameters]);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm({
      applicableTo: 'INCOMING',
      itemTypeTarget: 'RAW_MATERIAL',
      samplingPlan: 'ALL',
      parameters: [],
      isActive: true,
    });
    setFormError(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((it: InspectionChecklist) => {
    setEditingId(it.id);
    setForm({
      ...it,
      applicableTo: it?.applicableTo ?? 'INCOMING',
      itemTypeTarget: it?.itemTypeTarget ?? 'RAW_MATERIAL',
      samplingPlan: it?.samplingPlan ?? 'ALL',
      parameters: it?.parameters ?? [],
      isActive: it?.isActive ?? true,
    });
    setFormError(null);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setFormError(null);
  }, []);

  const validate = useCallback((): boolean => {
    if (!form.name?.trim()) { setFormError('Checklist name is required'); return false; }
    if (!form.code?.trim()) { setFormError('Code is required'); return false; }
    const dup = items.find((i) => i.code.trim().toUpperCase() === form.code!.trim().toUpperCase() && i.id !== editingId);
    if (dup) { setFormError(`Code "${form.code}" already exists`); return false; }
    if (!form.parameters || form.parameters.length === 0) { setFormError('Select at least one quality parameter'); return false; }
    setFormError(null);
    return true;
  }, [form, items, editingId]);

  const save = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        name: form.name!.trim(),
        code: form.code!.trim().toUpperCase(),
        applicableTo: form.applicableTo!,
        itemTypeTarget: form.itemTypeTarget!,
        samplingPlan: form.samplingPlan!,
        parameterIds: form.parameters ?? [],
        isActive: form.isActive ?? true,
      };
      if (editingId) {
        const res = await updateInspectionChecklist(editingId, payload);
        if (res.success && res.data) {
          setItems((prev) => prev.map((i) => (i.id === editingId ? {
            id: res.data!.id,
            name: res.data!.name,
            code: res.data!.code,
            applicableTo: res.data!.applicable_to as any,
            itemTypeTarget: res.data!.item_type_target as any,
            parameters: res.data!.parameter_ids || [],
            samplingPlan: res.data!.sampling_plan as any,
            isActive: res.data!.is_active,
          } : i)));
          toast.success('Inspection checklist updated');
        }
      } else {
        const res = await createInspectionChecklist(payload);
        if (res.success && res.data) {
          setItems((prev) => [{
            id: res.data!.id,
            name: res.data!.name,
            code: res.data!.code,
            applicableTo: res.data!.applicable_to as any,
            itemTypeTarget: res.data!.item_type_target as any,
            parameters: res.data!.parameter_ids || [],
            samplingPlan: res.data!.sampling_plan as any,
            isActive: res.data!.is_active,
          }, ...prev]);
          toast.success('Inspection checklist added');
        }
      }
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save checklist');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleStatus = async (id: string) => {
    const it = items.find((i) => i.id === id);
    if (!it) return;
    const newStatus = !it.isActive;

    // Optimistic update
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isActive: newStatus } : i)));
    try {
      await updateInspectionChecklist(id, { isActive: newStatus });
      toast.success('Status updated');
    } catch (err) {
      // Rollback
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isActive: !newStatus } : i)));
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const confirmDelete = useCallback((id: string) => setDeleteId(id), []);
  const doDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteInspectionChecklist(deleteId);
      setItems((prev) => prev.filter((i) => i.id !== deleteId));
      toast.success('Inspection checklist deleted');
      setDeleteId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete checklist');
    }
  };

  const toggleParam = useCallback((paramId: string) => {
    setForm((f) => {
      const current = f.parameters ?? [];
      const next = current.includes(paramId)
        ? current.filter((id) => id !== paramId)
        : [...current, paramId];
      return { ...f, parameters: next };
    });
  }, []);

  const removeParam = useCallback((paramId: string) => {
    setForm((f) => ({
      ...f,
      parameters: (f.parameters ?? []).filter((id) => id !== paramId),
    }));
  }, []);

  return (
    <AppLayout>
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Inspection Checklists</h1>
          <p className="text-sm text-slate-500 mt-1">Define quality inspection checklists with parameters and sampling plans</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4f46e5] text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line" />
          Add Checklist
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: 'ri-checkbox-multiple-line', color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Active', value: stats.active, icon: 'ri-check-line', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Incoming', value: stats.incoming, icon: 'ri-arrow-down-line', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'In-Process', value: stats.inProcess, icon: 'ri-settings-3-line', color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Final', value: stats.final, icon: 'ri-shield-check-line', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 border border-slate-100`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-5 h-5 flex items-center justify-center"><i className={`${s.icon} ${s.color}`} /></div>
              <span className="text-xs text-slate-500 font-medium">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Applicable To filter cards */}
      <div className="flex flex-wrap gap-2 mb-4">
        {([
          { value: 'ALL' as const, label: 'All Checklists', icon: 'ri-folders-line' },
          { value: 'INCOMING' as const, label: 'Incoming', icon: 'ri-arrow-down-line', badge: 'bg-blue-100 text-blue-700' },
          { value: 'IN_PROCESS' as const, label: 'In-Process', icon: 'ri-settings-3-line', badge: 'bg-amber-100 text-amber-700' },
          { value: 'FINAL' as const, label: 'Final', icon: 'ri-shield-check-line', badge: 'bg-emerald-100 text-emerald-700' },
        ]).map((card) => {
          const isActive = applicableFilter === card.value;
          return (
            <button
              key={card.value}
              onClick={() => setApplicableFilter(card.value)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              <i className={card.icon} />
              {card.label}
              {card.value !== 'ALL' && (
                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : card.badge}`}>
                  {stats[card.value === 'INCOMING' ? 'incoming' : card.value === 'IN_PROCESS' ? 'inProcess' : 'final']}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <div className="w-4 h-4 flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <i className="ri-search-line text-sm" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or code..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
          />
        </div>
        <select
          value={applicableFilter}
          onChange={(e) => setApplicableFilter(e.target.value as typeof applicableFilter)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
        >
          <option value="ALL">All Stages</option>
          <option value="INCOMING">Incoming</option>
          <option value="IN_PROCESS">In-Process</option>
          <option value="FINAL">Final</option>
        </select>
        <select
          value={itemTypeFilter}
          onChange={(e) => setItemTypeFilter(e.target.value as typeof itemTypeFilter)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
        >
          <option value="ALL">All Item Types</option>
          <option value="RAW_MATERIAL">Raw Material</option>
          <option value="SEMI_FINISHED">Semi-Finished</option>
          <option value="FINISHED_GOOD">Finished Good</option>
          <option value="ALL">All Types</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
          <table className="w-full min-w-[800px] text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Code</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Applicable To</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Item Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Parameters</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Sampling Plan</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <i className="ri-loader-4-line text-4xl text-[#4f46e5] animate-spin block mb-2" />
                    <p className="text-sm">Loading inspection checklists...</p>
                  </td>
                </tr>
              ) : filtered.map((it) => {
                const badge = APPLICABLE_BADGE[it.applicableTo];
                const isExpanded = expandedId === it.id;
                const paramNames = getParameterNames(it.parameters);
                return (
                  <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                    <td colSpan={8} className="p-0">
                      <table className="w-full text-sm border-collapse">
                        <tbody>
                          <tr
                            className="cursor-pointer hover:bg-slate-50 transition-colors"
                            onClick={() => setExpandedId((prev) => (prev === it.id ? null : it.id))}
                          >
                            <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap w-[12%]">{it.code}</td>
                            <td className="px-4 py-3 text-slate-900 font-medium whitespace-nowrap w-[20%]">{it.name}</td>
                            <td className="px-4 py-3 whitespace-nowrap w-[15%]">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                                {badge.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap w-[15%]">{ITEM_TYPE_LABEL[it.itemTypeTarget]}</td>
                            <td className="px-4 py-3 whitespace-nowrap w-[15%]">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                                <i className="ri-microscope-line text-[10px]" />
                                {it.parameters.length} param{it.parameters.length !== 1 ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap w-[12%]">{SAMPLING_LABEL[it.samplingPlan]}</td>
                            <td className="px-4 py-3 whitespace-nowrap w-[10%]">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleStatus(it.id); }}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${it.isActive ? 'bg-[#4f46e5]' : 'bg-slate-300'}`}
                              >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${it.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                              </button>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openEdit(it); }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 transition-colors cursor-pointer"
                                  title="Edit"
                                >
                                  <i className="ri-edit-line" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); confirmDelete(it.id); }}
                                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                  title="Delete"
                                >
                                  <i className="ri-delete-bin-line" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="px-4 py-3 bg-slate-50/60 border-t border-slate-100">
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-xs text-slate-500 font-medium mr-1 self-center">Parameters:</span>
                                  {paramNames.length > 0 ? paramNames.map((p) => {
                                    const tb = QP_TYPE_BADGE[p.type] || { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Text' };
                                    return (
                                      <span
                                        key={p.id}
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tb.bg} ${tb.text}`}
                                      >
                                        <span className="font-mono text-[10px] opacity-70">{p.code}</span>
                                        {p.name}
                                      </span>
                                    );
                                  }) : (
                                    <span className="text-xs text-slate-400">No parameters assigned</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3 rounded-full bg-slate-50">
                      <i className="ri-inbox-line text-xl text-slate-300" />
                    </div>
                    <p className="text-sm">No inspection checklists found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 text-right mt-1 px-4 sm:hidden">
          ← Scroll to see more →
        </p>
        <div className="px-4 py-3 border-t border-slate-200 text-xs text-slate-500">
          Showing {filtered.length} of {items.length} checklists
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Checklist' : 'Add Checklist'}</h2>
              <button onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 cursor-pointer">
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto space-y-4">
              {formError && (
                <div className="px-3 py-2.5 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700 flex items-center gap-2">
                  <i className="ri-error-warning-line" /> {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Checklist Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Raw Material Incoming Check"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.code ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. CL-RM-IN"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Applicable To <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.applicableTo ?? 'INCOMING'}
                    onChange={(e) => setForm((f) => ({ ...f, applicableTo: e.target.value as InspectionChecklist['applicableTo'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
                  >
                    {APPLICABLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Item Type Target <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.itemTypeTarget ?? 'RAW_MATERIAL'}
                    onChange={(e) => setForm((f) => ({ ...f, itemTypeTarget: e.target.value as InspectionChecklist['itemTypeTarget'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
                  >
                    {ITEM_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Sampling Plan <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.samplingPlan ?? 'ALL'}
                    onChange={(e) => setForm((f) => ({ ...f, samplingPlan: e.target.value as InspectionChecklist['samplingPlan'] }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
                  >
                    {SAMPLING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected parameter chips */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Quality Parameters <span className="text-red-500">*</span>
                  <span className="text-xs text-slate-400 font-normal ml-1">({(form.parameters ?? []).length} selected)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3 min-h-[36px]">
                  {(form.parameters ?? []).length === 0 && (
                    <span className="text-xs text-slate-400 italic py-1">Select at least one parameter below</span>
                  )}
                  {(form.parameters ?? []).map((pid) => {
                    const p = qualityParameters.find((qp) => qp.id === pid) || {
                      id: pid,
                      name: 'Parameter is currently not available',
                      code: 'UNAVAILABLE',
                      type: 'MISSING',
                      isActive: false,
                    };
                    const tb = QP_TYPE_BADGE[p.type] || { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Text' };
                    return (
                      <span
                        key={pid}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tb.bg} ${tb.text}`}
                      >
                        <span className="font-mono text-[10px] opacity-70">{p.code}</span>
                        {p.name}
                        <button
                          type="button"
                          onClick={() => removeParam(pid)}
                          className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-black/10 transition-colors cursor-pointer ml-0.5"
                        >
                          <i className="ri-close-line text-[10px]" />
                        </button>
                      </span>
                    );
                  })}
                </div>

                {/* Parameter selector list */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <div className="bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500 border-b border-slate-200">
                    Available Parameters ({activeParameters.length} active)
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {activeParameters.map((p) => {
                      const selected = (form.parameters ?? []).includes(p.id);
                      const tb = QP_TYPE_BADGE[p.type] || { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Text' };
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleParam(p.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors cursor-pointer ${
                            selected ? 'bg-indigo-50 hover:bg-indigo-100' : 'hover:bg-slate-50'
                          } ${selected ? 'border-l-2 border-l-[#4f46e5]' : 'border-l-2 border-l-transparent'}`}
                        >
                          <div className={`w-5 h-5 flex items-center justify-center rounded border transition-all shrink-0 ${
                            selected ? 'bg-[#4f46e5] border-[#4f46e5]' : 'border-slate-300'
                          }`}>
                            {selected && <i className="ri-check-line text-white text-xs" />}
                          </div>
                          <span className="font-mono text-[11px] text-slate-500 shrink-0">{p.code}</span>
                          <span className="text-slate-900 font-medium">{p.name}</span>
                          <span className={`ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${tb.bg} ${tb.text}`}>
                            {tb.label}
                          </span>
                        </button>
                      );
                    })}
                    {activeParameters.length === 0 && (
                      <div className="px-3 py-4 text-center text-xs text-slate-400">
                        No active quality parameters available
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-slate-700">Active</span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-[#4f46e5]' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
              <button type="button" onClick={save} disabled={isSaving} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#4f46e5] text-white hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                {isSaving && <i className="ri-loader-4-line animate-spin" />}
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Checklist?"
        message="This inspection checklist will be permanently removed."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
    </AppLayout>
  );
}