import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { mockWorkCenters, mockWarehouses, type MockWorkCenter } from '@/mocks/masters';
import { useToast } from '@/contexts/ToastContext';
import { MasterFilters, MasterSummaryCards, MasterStatsRow } from '@/pages/masters/common/CommonComponets';

type WCType = 'MACHINE' | 'LABOR' | 'BOTH';

interface WCForm {
  name: string;
  type: WCType;
  capacityPerHour: string;
  warehouseId: string;
  description: string;
  isActive: boolean;
}

const TYPE_OPTIONS: { value: WCType; label: string }[] = [
  { value: 'MACHINE', label: 'Machine — uses machinery only' },
  { value: 'LABOR', label: 'Labor — manual work only' },
  { value: 'BOTH', label: 'Both — machine + labor combined' },
];

const TYPE_BADGE: Record<WCType, { label: string; cls: string }> = {
  MACHINE: { label: 'Machine', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  LABOR: { label: 'Labor', cls: 'bg-green-50 text-green-700 border-green-200' },
  BOTH: { label: 'Both', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
};

const emptyForm: WCForm = {
  name: '', type: 'MACHINE', capacityPerHour: '', warehouseId: '', description: '', isActive: true,
};

// ─── Slide-Over Form ──────────────────────────────────────────────────────────
interface SlideOverProps {
  open: boolean;
  editing: MockWorkCenter | null;
  onClose: () => void;
  onSave: (form: WCForm) => void;
}

function WorkCenterSlideOver({ open, editing, onClose, onSave }: SlideOverProps) {
  const [form, setForm] = useState<WCForm>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing?.name || '',
        type: editing?.type || 'MACHINE',
        capacityPerHour: editing?.capacityPerHour?.toString() || '',
        warehouseId: editing?.warehouseId ?? '',
        description: editing?.description ?? '',
        isActive: editing?.isActive ?? true,
      });
    } else {
      setForm({ ...emptyForm });
    }
    setErrors({});
    setTimeout(() => firstInputRef.current?.focus(), 60);
  }, [open, editing]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const update = (field: keyof WCForm, value: string | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Work center name is required';
    if (!form.capacityPerHour.trim()) e.capacityPerHour = 'Capacity per hour is required';
    else if (Number(form.capacityPerHour) <= 0) e.capacityPerHour = 'Capacity must be greater than 0';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    setTimeout(() => {
      onSave(form);
      setIsSaving(false);
    }, 300);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[600] flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg flex flex-col h-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">
              {editing ? 'Edit Work Center' : 'Add Work Center'}
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {editing ? 'Update work center details' : 'Create a new work center'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer">
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Work Center Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text" value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Cutting Area, Assembly Line 1"
              className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((t) => {
                const badge = TYPE_BADGE[t.value as WCType];
                const isSelected = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('type', t.value)}
                    className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${isSelected
                      ? `${badge.cls} border-current ring-2 ring-current/20`
                      : 'border-[#e2e8f0] text-[#64748b] hover:border-[#4f46e5]/40 hover:text-[#4f46e5]'
                      }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Capacity */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Standard Capacity (units/hour) <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="0"
              value={form.capacityPerHour}
              onChange={(e) => update('capacityPerHour', e.target.value)}
              placeholder="e.g. 120"
              className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.capacityPerHour ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
            />
            {errors.capacityPerHour && <p className="text-xs text-red-500">{errors.capacityPerHour}</p>}
          </div>

          {/* Warehouse */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Warehouse / Location</label>
            <select
              value={form.warehouseId}
              onChange={(e) => update('warehouseId', e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer"
            >
              <option value="">— Select Warehouse —</option>
              {mockWarehouses.filter((w) => w.isActive).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Brief description of this work center"
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none"
            />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 pt-2">
            <button type="button"
              onClick={() => update('isActive', !form.isActive)}
              className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 ${form.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm text-[#64748b]">
              {form.isActive ? 'Active — work center is operational' : 'Inactive — work center is disabled'}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
          <button onClick={onClose}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-white transition-colors cursor-pointer whitespace-nowrap">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap">
            {isSaving
              ? <><i className="ri-loader-4-line animate-spin" /> Saving...</>
              : <><i className="ri-save-line" /> {editing ? 'Update' : 'Save'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkCentersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [workCenters, setWorkCenters] = useState<MockWorkCenter[]>([...mockWorkCenters]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<WCType | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [slideOver, setSlideOver] = useState<{ open: boolean; editing: MockWorkCenter | null }>({ open: false, editing: null });
  const [deleteConfirm, setDeleteConfirm] = useState<MockWorkCenter | null>(null);

  const filtered = workCenters.filter((wc) => {
    const q = search.toLowerCase();
    const matchSearch = !q || wc.name.toLowerCase().includes(q) || (wc.description && wc.description.toLowerCase().includes(q));
    const matchType = typeFilter === 'ALL' || wc.type === typeFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? wc.isActive : !wc.isActive);
    return matchSearch && matchType && matchStatus;
  });

  const openAdd = () => setSlideOver({ open: true, editing: null });
  const openEdit = (wc: MockWorkCenter) => setSlideOver({ open: true, editing: wc });
  const closeSlideOver = () => setSlideOver({ open: false, editing: null });

  const handleSave = (form: WCForm) => {
    if (slideOver.editing) {
      setWorkCenters((prev) =>
        prev.map((wc) =>
          wc.id === slideOver.editing!.id
            ? {
              ...wc,
              name: form.name,
              type: form.type,
              capacityPerHour: Number(form.capacityPerHour),
              warehouseId: form.warehouseId || null,
              description: form.description,
              isActive: form.isActive,
            }
            : wc,
        ),
      );
      toast.success('Work center updated successfully');
    } else {
      const newWc: MockWorkCenter = {
        id: `wc-${Date.now()}`,
        name: form.name,
        type: form.type,
        capacityPerHour: Number(form.capacityPerHour),
        warehouseId: form.warehouseId || null,
        description: form.description,
        isActive: form.isActive,
      };
      setWorkCenters((prev) => [...prev, newWc]);
      toast.success('Work center created successfully');
    }
    closeSlideOver();
  };

  const handleToggleActive = (wc: MockWorkCenter) => {
    setWorkCenters((prev) => prev.map((w) => w.id === wc.id ? { ...w, isActive: !w.isActive } : w));
    toast.success(`${wc.name} ${wc.isActive ? 'deactivated' : 'activated'}`);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    setWorkCenters((prev) => prev.filter((w) => w.id !== deleteConfirm.id));
    toast.success(`"${deleteConfirm.name}" removed`);
    setDeleteConfirm(null);
  };

  const getWarehouseName = (id: string | null) => {
    if (!id) return '—';
    const wh = mockWarehouses.find((w) => w.id === id);
    return wh ? wh.name : id;
  };

  // Type counts
  const typeCounts = TYPE_OPTIONS.map((t) => ({
    ...t,
    count: workCenters.filter((w) => w.type === t.value).length,
    badge: TYPE_BADGE[t.value],
  }));

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer">
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">Work Centers</h2>
              <p className="text-sm text-[#64748b] mt-0.5">Manage production work centers and their capacity</p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
            <i className="ri-add-line" /> Add Work Center
          </button>
        </div>

        {/* Filters */}
        <MasterFilters
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search work centers..."
          filters={[
            {
              value: typeFilter,
              onChange: (val) => setTypeFilter(val),
              options: [
                { value: 'ALL', label: 'All Types' },
                { value: 'MACHINE', label: 'Machine' },
                { value: 'LABOR', label: 'Labor' },
                { value: 'BOTH', label: 'Both' },
              ],
            },
            {
              value: statusFilter,
              onChange: (val) => setStatusFilter(val),
              options: [
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ],
            },
          ]}
          hasActiveFilters={!!(search || typeFilter !== 'ALL' || statusFilter !== 'ALL')}
          onClearFilters={() => {
            setSearch('');
            setTypeFilter('ALL');
            setStatusFilter('ALL');
          }}
        />

        {/* Summary cards */}
        <MasterSummaryCards
          items={typeCounts.map((t) => ({
            value: t.value,
            count: t.count,
            label: t.badge.label,
            badgeClass: t.badge.cls,
          }))}
          activeFilterValue={typeFilter}
          onFilterChange={(val) => setTypeFilter(val)}
        />

        {/* Stats row */}
        <MasterStatsRow
          stats={[
            { label: 'Total Work Centers', value: workCenters.length, icon: 'ri-building-2-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
            { label: 'Active', value: workCenters.filter((w) => w.isActive).length, icon: 'ri-checkbox-circle-line', bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Avg Capacity', value: Math.round(workCenters.reduce((a, w) => a + w.capacityPerHour, 0) / (workCenters.length || 1)), icon: 'ri-speed-line', bg: 'bg-blue-50', color: 'text-blue-600' },
          ]}
        />

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {['Work Center Name', 'Type', 'Capacity/hr', 'Warehouse', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((wc, idx) => {
                const badge = TYPE_BADGE[wc.type];
                return (
                  <tr key={wc.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${badge.cls} border`}>
                          <i className="ri-building-2-line text-sm" />
                        </div>
                        <div>
                          <p className="font-medium text-[#1e293b] whitespace-nowrap">{wc.name}</p>
                          {wc.description && <p className="text-xs text-[#94a3b8] truncate max-w-[200px]">{wc.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">
                      {wc.capacityPerHour} <span className="text-xs font-normal text-[#94a3b8]">units/hr</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#64748b] whitespace-nowrap">
                      {getWarehouseName(wc.warehouseId)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => handleToggleActive(wc)} className="cursor-pointer" title="Click to toggle status">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${wc.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${wc.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {wc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(wc)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer" title="Edit">
                          <i className="ri-edit-line text-sm" />
                        </button>
                        <button onClick={() => setDeleteConfirm(wc)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer" title="Delete">
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <i className="ri-building-2-line text-4xl text-[#e2e8f0] block mb-2" />
                    <p className="text-[#94a3b8] text-sm">No work centers found</p>
                    {(search || typeFilter !== 'ALL' || statusFilter !== 'ALL') && (
                      <p className="text-xs text-[#94a3b8] mt-1">Try adjusting your filters</p>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <WorkCenterSlideOver
        open={slideOver.open}
        editing={slideOver.editing}
        onClose={closeSlideOver}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remove Work Center"
        message={`Remove "${deleteConfirm?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Yes, Remove"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}