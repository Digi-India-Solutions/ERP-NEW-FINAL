import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useToast } from '@/contexts/ToastContext';
import { MasterFilters, MasterSummaryCards, MasterStatsRow } from '@/pages/masters/common/CommonComponets';
import {
  createDowntimeCode,
  getAllDowntimeCodes,
  updateDowntimeCode,
  deleteDowntimeCode,
  type DowntimeCodeResponse,
  type DowntimeCategory
} from '@/api/downtimecode.api';

type DTCategory = DowntimeCategory;

interface DowntimeCode {
  id: string;
  code: string;
  description: string;
  category: DTCategory;
  affectsMachine: boolean;
  isActive: boolean;
}

interface DTForm {
  code: string;
  description: string;
  category: DTCategory;
  affectsMachine: boolean;
  isActive: boolean;
}

const emptyForm: DTForm = {
  code: '', description: '', category: 'OTHER', affectsMachine: false, isActive: true,
};

const CATEGORY_OPTIONS: { value: DTCategory; label: string }[] = [
  { value: 'BREAKDOWN', label: 'Breakdown' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'MATERIAL', label: 'Material' },
  { value: 'POWER', label: 'Power' },
  { value: 'OPERATOR', label: 'Operator' },
  { value: 'SETUP', label: 'Setup' },
  { value: 'OTHER', label: 'Other' },
];

const CATEGORY_BADGE: Record<DTCategory, { label: string; cls: string }> = {
  BREAKDOWN: { label: 'Breakdown', cls: 'bg-red-50 text-red-700 border-red-200' },
  PLANNED:   { label: 'Planned',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  MATERIAL:  { label: 'Material',  cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  POWER:     { label: 'Power',     cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  OPERATOR:  { label: 'Operator',  cls: 'bg-teal-50 text-teal-700 border-teal-200' },
  SETUP:     { label: 'Setup',     cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  OTHER:     { label: 'Other',     cls: 'bg-slate-100 text-slate-600 border-slate-200' },
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface DTModalProps {
  open: boolean;
  editing: DowntimeCode | null;
  onClose: () => void;
  onSave: (form: DTForm) => Promise<void>;
}

function DTModal({ open, editing, onClose, onSave }: DTModalProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const { focusFirst } = useKeyboardNav(formRef as React.RefObject<HTMLElement>);

  const [form, setForm] = useState<DTForm>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          code: editing?.code || '',
          description: editing?.description || '',
          category: editing?.category || 'BREAKDOWN',
          affectsMachine: editing?.affectsMachine ?? true,
          isActive: editing?.isActive ?? true,
        });
      } else {
        setForm({ ...emptyForm });
      }
      setErrors({});
      setTimeout(() => focusFirst(), 60);
    }
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'F9') || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (field: keyof DTForm, value: string | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.code.trim()) e.code = 'Code is required';
    if (!form.description.trim()) e.description = 'Description is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave(form);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={formRef} className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">

        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">
              {editing ? 'Edit Downtime Code' : 'Add Downtime Code'}
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {editing ? 'Update downtime code details' : 'Create a new downtime reason code'}
            </p>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer">
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.code}
              onChange={(e) => update('code', e.target.value)}
              placeholder="e.g. DT-BRK" data-nav-index={0}
              className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.code ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
            />
            {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Description <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="e.g. Machine Breakdown" data-nav-index={1}
              className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.description ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((c) => {
                const badge = CATEGORY_BADGE[c.value];
                const isSelected = form.category === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => update('category', c.value)}
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? `${badge.cls} border-current ring-2 ring-current/20`
                        : 'border-[#e2e8f0] text-[#64748b] hover:border-[#4f46e5]/40 hover:text-[#4f46e5]'
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Affects Machine toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button type="button"
              onClick={() => update('affectsMachine', !form.affectsMachine)}
              data-nav-index={2}
              className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 ${form.affectsMachine ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.affectsMachine ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm text-[#64748b]">
              {form.affectsMachine ? 'Affects Machine — stops machine production' : 'Does Not Affect Machine — non-machine downtime'}
            </label>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button type="button"
              onClick={() => update('isActive', !form.isActive)}
              data-nav-index={3}
              className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 ${form.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
            </button>
            <label className="text-sm text-[#64748b]">
              {form.isActive ? 'Active — code is available for use' : 'Inactive — code is disabled'}
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0]">
          <p className="text-[11px] text-[#94a3b8]">
            <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">F9</kbd> to save &nbsp;
            <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">Esc</kbd> to cancel
          </p>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap">
              Cancel
            </button>
            <button
              onClick={() => void handleSave()} disabled={isSaving} data-nav-index={4}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); void handleSave(); } }}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap">
              {isSaving
                ? <><i className="ri-loader-4-line animate-spin" /> Saving...</>
                : <><i className="ri-save-line" /> {editing ? 'Update' : 'Create'}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export default function DowntimeCodesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState<DowntimeCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DTCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [modal, setModal] = useState<{ open: boolean; editing: DowntimeCode | null }>({ open: false, editing: null });
  const [deleteConfirm, setDeleteConfirm] = useState<DowntimeCode | null>(null);

  const mapApiToDowntimeCode = (d: DowntimeCodeResponse): DowntimeCode => ({
    id: d.id,
    code: d.code,
    description: d.description,
    category: d.category,
    affectsMachine: d.affects_machine,
    isActive: d.is_active,
  });

  const fetchDowntimeCodes = async () => {
    setIsLoading(true);
    try {
      const res = await getAllDowntimeCodes();
      if (res.success && res.data) {
        setItems(res.data.map(mapApiToDowntimeCode));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch downtime codes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDowntimeCodes();
  }, []);

  const filtered = items.filter((dt) => {
    const q = search.toLowerCase();
    const matchSearch = !q || dt.code.toLowerCase().includes(q) || dt.description.toLowerCase().includes(q);
    const matchCategory = categoryFilter === 'ALL' || dt.category === categoryFilter;
    const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? dt.isActive : !dt.isActive);
    return matchSearch && matchCategory && matchStatus;
  });

  const openAdd = () => setModal({ open: true, editing: null });
  const openEdit = (dt: DowntimeCode) => setModal({ open: true, editing: dt });
  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (form: DTForm) => {
    try {
      if (modal.editing) {
        const res = await updateDowntimeCode(modal.editing.id, {
          code: form.code.trim(),
          description: form.description.trim(),
          category: form.category,
          affectsMachine: form.affectsMachine,
          isActive: form.isActive,
        });
        if (res.success && res.data) {
          setItems((prev) =>
            prev.map((dt) =>
              dt.id === modal.editing!.id
                ? mapApiToDowntimeCode(res.data!)
                : dt,
            ),
          );
          toast.success('Downtime code updated successfully');
        }
      } else {
        const res = await createDowntimeCode({
          code: form.code.trim(),
          description: form.description.trim(),
          category: form.category,
          affectsMachine: form.affectsMachine,
          isActive: form.isActive,
        });
        if (res.success && res.data) {
          setItems((prev) => [mapApiToDowntimeCode(res.data!), ...prev]);
          toast.success('Downtime code created successfully');
        }
      }
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save downtime code');
      throw err;
    }
  };

  const handleToggleActive = async (dt: DowntimeCode) => {
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === dt.id ? { ...i, isActive: !i.isActive } : i));
    try {
      await updateDowntimeCode(dt.id, { isActive: !dt.isActive });
      toast.success(`${dt.code} ${dt.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      // Rollback
      setItems((prev) => prev.map((i) => i.id === dt.id ? { ...i, isActive: dt.isActive } : i));
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteDowntimeCode(deleteConfirm.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteConfirm.id));
      toast.success(`"${deleteConfirm.code}" removed`);
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete downtime code');
    }
  };

  // Summary
  const categoryCounts = CATEGORY_OPTIONS.map((c) => ({
    ...c,
    count: items.filter((dt) => dt.category === c.value).length,
    badge: CATEGORY_BADGE[c.value],
  }));

  const affectsMachineCount = items.filter((i) => i.affectsMachine).length;

  return (
    <AppLayout>
      <div className="p-6 space-y-5 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer">
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">Downtime Codes</h2>
              <p className="text-sm text-[#64748b] mt-0.5">Manage production downtime reason codes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search downtime codes..."
                className="h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-52"
              />
            </div>
            <button onClick={openAdd}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-add-line" /> Add Downtime Code
            </button>
          </div>
        </div>

        {/* Category summary cards */}
        <MasterSummaryCards
          items={categoryCounts.map((c) => ({
            value: c.value,
            count: c.count,
            label: c.label,
            badgeClass: c.badge.cls,
          }))}
          activeFilterValue={categoryFilter}
          onFilterChange={(val) => setCategoryFilter(val as DTCategory | 'ALL')}
        />

        {/* Stats row */}
        <MasterStatsRow
          stats={[
            { label: 'Total Codes', value: items.length, icon: 'ri-timer-flash-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
            { label: 'Active', value: items.filter((i) => i.isActive).length, icon: 'ri-checkbox-circle-line', bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Affects Machine', value: affectsMachineCount, icon: 'ri-settings-3-line', bg: 'bg-amber-50', color: 'text-amber-600' },
          ]}
        />

        {/* Filters */}
        <MasterFilters
          filters={[
            {
              value: statusFilter,
              onChange: (val) => setStatusFilter(val as 'ALL' | 'ACTIVE' | 'INACTIVE'),
              options: [
                { value: 'ALL', label: 'All Status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ],
            },
          ]}
          hasActiveFilters={!!(categoryFilter !== 'ALL' || statusFilter !== 'ALL' || search)}
          onClearFilters={() => {
            setCategoryFilter('ALL');
            setStatusFilter('ALL');
            setSearch('');
          }}
        />

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {['Code', 'Description', 'Category', 'Affects Machine', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <i className="ri-loader-4-line text-4xl text-[#4f46e5] animate-spin block mb-2" />
                    <p className="text-[#94a3b8] text-sm">Loading downtime codes...</p>
                  </td>
                </tr>
              ) : filtered.map((dt, idx) => {
                const badge = CATEGORY_BADGE[dt.category];
                return (
                  <tr key={dt.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1e293b] whitespace-nowrap">{dt.code}</td>
                    <td className="px-4 py-3">
                      <span className="text-[#1e293b] whitespace-nowrap">{dt.description}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${dt.affectsMachine ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${dt.affectsMachine ? 'bg-green-500' : 'bg-slate-400'}`} />
                        {dt.affectsMachine ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => handleToggleActive(dt)} className="cursor-pointer" title="Click to toggle status">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${dt.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dt.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {dt.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(dt)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer" title="Edit">
                          <i className="ri-edit-line text-sm" />
                        </button>
                        <button onClick={() => setDeleteConfirm(dt)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer" title="Delete">
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <i className="ri-timer-flash-line text-4xl text-[#e2e8f0] block mb-2" />
                    <p className="text-[#94a3b8] text-sm">No downtime codes found</p>
                    {search && <p className="text-xs text-[#94a3b8] mt-1">Try a different search term</p>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DTModal
        open={modal.open}
        editing={modal.editing}
        onClose={closeModal}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remove Downtime Code"
        message={`Remove "${deleteConfirm?.code}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Yes, Remove (Y)"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}