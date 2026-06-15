import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useToast } from '@/contexts/ToastContext';
import { MasterFilters, MasterSummaryCards, MasterStatsRow } from '@/pages/masters/common/CommonComponets';
import {
  createRejectionCode,
  getAllRejectionCodes,
  updateRejectionCode,
  deleteRejectionCode,
  type RejectionCodeResponse,
  type RejectionCategory
} from '@/api/rejectioncode.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

type RCCategory = RejectionCategory;
type RCApplicable = 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'ALL';

interface RejectionCode {
  id: string;
  code: string;
  description: string;
  category: RCCategory;
  applicableTo: RCApplicable;
  isActive: boolean;
  warehouseId?: string | null;
}

interface RCForm {
  code: string;
  description: string;
  category: RCCategory;
  applicableTo: RCApplicable;
  isActive: boolean;
}

const emptyForm: RCForm = {
  code: '', description: '', category: 'MATERIAL', applicableTo: 'ALL', isActive: true,
};

const CATEGORY_OPTIONS: { value: RCCategory; label: string }[] = [
  { value: 'MATERIAL', label: 'Material' },
  { value: 'MACHINE', label: 'Machine' },
  { value: 'OPERATOR', label: 'Operator' },
  { value: 'PROCESS', label: 'Process' },
  { value: 'DESIGN', label: 'Design' },
];

const APPLICABLE_OPTIONS: { value: RCApplicable; label: string }[] = [
  { value: 'INCOMING', label: 'Incoming QC' },
  { value: 'IN_PROCESS', label: 'In-Process QC' },
  { value: 'FINAL', label: 'Final QC' },
  { value: 'ALL', label: 'All Stages' },
];

const CATEGORY_BADGE: Record<RCCategory, { label: string; cls: string }> = {
  MATERIAL: { label: 'Material',  cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  MACHINE:  { label: 'Machine',   cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  OPERATOR: { label: 'Operator',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  PROCESS:  { label: 'Process',   cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  DESIGN:   { label: 'Design',    cls: 'bg-green-50 text-green-700 border-green-200' },
};

const APPLICABLE_LABEL: Record<RCApplicable, string> = {
  INCOMING: 'Incoming QC',
  IN_PROCESS: 'In-Process QC',
  FINAL: 'Final QC',
  ALL: 'All Stages',
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface RCModalProps {
  open: boolean;
  editing: RejectionCode | null;
  onClose: () => void;
  onSave: (form: RCForm) => Promise<void>;
}

function RCModal({ open, editing, onClose, onSave }: RCModalProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const { focusFirst } = useKeyboardNav(formRef as React.RefObject<HTMLElement>);

  const [form, setForm] = useState<RCForm>({ ...emptyForm });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (editing) {
        setForm({
          code: editing?.code || '',
          description: editing?.description || '',
          category: editing?.category || 'MATERIAL',
          applicableTo: editing?.applicableTo || 'ALL',
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

  const update = (field: keyof RCForm, value: string | boolean) => {
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
              {editing ? 'Edit Rejection Code' : 'Add Rejection Code'}
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {editing ? 'Update rejection code details' : 'Create a new rejection code'}
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
              placeholder="e.g. RC-DIM" data-nav-index={0}
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
              placeholder="e.g. Dimensional Error" data-nav-index={1}
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

          {/* Applicable To */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Applicable To</label>
            <select
              value={form.applicableTo}
              onChange={(e) => update('applicableTo', e.target.value)}
              data-nav-index={2}
              className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer"
            >
              {APPLICABLE_OPTIONS.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
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
export default function RejectionCodesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [items, setItems] = useState<RejectionCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<RCCategory | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [modal, setModal] = useState<{ open: boolean; editing: RejectionCode | null }>({ open: false, editing: null });
  const [deleteConfirm, setDeleteConfirm] = useState<RejectionCode | null>(null);

  const { selectedWarehouseId } = useWarehouseStore();

  const mapApiToRejectionCode = (r: RejectionCodeResponse): RejectionCode => ({
    id: r.id,
    code: r.code,
    description: r.description,
    category: r.category,
    applicableTo: r.applicable_to as RCApplicable,
    isActive: r.is_active,
    warehouseId: r.warehouse_id || null,
  });

  const fetchRejectionCodes = async () => {
    setIsLoading(true);
    try {
      const res = await getAllRejectionCodes();
      if (res.success && res.data) {
        setItems(res.data.map(mapApiToRejectionCode));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to fetch rejection codes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectionCodes();
  }, []);

  const warehouseRejectionCodes = useMemo(() => {
    if (!selectedWarehouseId) return items;
    return items.filter((rc) => rc.warehouseId === selectedWarehouseId);
  }, [items, selectedWarehouseId]);

  const filtered = useMemo(() => {
    return warehouseRejectionCodes.filter((rc) => {
      const q = search.toLowerCase();
      const matchSearch = !q || rc.code.toLowerCase().includes(q) || rc.description.toLowerCase().includes(q);
      const matchCategory = categoryFilter === 'ALL' || rc.category === categoryFilter;
      const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? rc.isActive : !rc.isActive);
      return matchSearch && matchCategory && matchStatus;
    });
  }, [warehouseRejectionCodes, search, categoryFilter, statusFilter]);

  const openAdd = () => setModal({ open: true, editing: null });
  const openEdit = (rc: RejectionCode) => setModal({ open: true, editing: rc });
  const closeModal = () => setModal({ open: false, editing: null });

  const handleSave = async (form: RCForm) => {
    try {
      if (modal.editing) {
        const res = await updateRejectionCode(modal.editing.id, {
          code: form.code.trim(),
          description: form.description.trim(),
          category: form.category,
          applicableTo: form.applicableTo,
          isActive: form.isActive,
        });
        if (res.success && res.data) {
          setItems((prev) =>
            prev.map((rc) =>
              rc.id === modal.editing!.id
                ? mapApiToRejectionCode(res.data!)
                : rc,
            ),
          );
          toast.success('Rejection code updated successfully');
        }
      } else {
        const res = await createRejectionCode({
          code: form.code.trim(),
          description: form.description.trim(),
          category: form.category,
          applicableTo: form.applicableTo,
          isActive: form.isActive,
          warehouseId: selectedWarehouseId || null,
        });
        if (res.success && res.data) {
          setItems((prev) => [mapApiToRejectionCode(res.data!), ...prev]);
          toast.success('Rejection code created successfully');
        }
      }
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save rejection code');
      throw err;
    }
  };

  const handleToggleActive = async (rc: RejectionCode) => {
    // Optimistic update
    setItems((prev) => prev.map((i) => i.id === rc.id ? { ...i, isActive: !i.isActive } : i));
    try {
      await updateRejectionCode(rc.id, { isActive: !rc.isActive });
      toast.success(`${rc.code} ${rc.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      // Rollback
      setItems((prev) => prev.map((i) => i.id === rc.id ? { ...i, isActive: rc.isActive } : i));
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteRejectionCode(deleteConfirm.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteConfirm.id));
      toast.success(`"${deleteConfirm.code}" removed`);
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete rejection code');
    }
  };

  // Summary
  const categoryCounts = useMemo(() => {
    return CATEGORY_OPTIONS.map((c) => ({
      ...c,
      count: warehouseRejectionCodes.filter((rc) => rc.category === c.value).length,
      badge: CATEGORY_BADGE[c.value],
    }));
  }, [warehouseRejectionCodes]);

  const mostCommonCategory = useMemo(() => {
    if (warehouseRejectionCodes.length === 0) return CATEGORY_OPTIONS[0];
    return CATEGORY_OPTIONS.reduce((a, b) =>
      warehouseRejectionCodes.filter((rc) => rc.category === a.value).length >= warehouseRejectionCodes.filter((rc) => rc.category === b.value).length ? a : b
    );
  }, [warehouseRejectionCodes]);

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
              <h2 className="text-xl font-bold text-[#1e293b]">Rejection Codes</h2>
              <p className="text-sm text-[#64748b] mt-0.5">Manage quality rejection reason codes for all QC stages</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rejection codes..."
                className="h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-52"
              />
            </div>
            <button onClick={openAdd}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-add-line" /> Add Rejection Code
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
          onFilterChange={(val) => setCategoryFilter(val as RCCategory | 'ALL')}
        />

        {/* Stats row */}
        <MasterStatsRow
          stats={[
            { label: 'Total Codes', value: warehouseRejectionCodes.length, icon: 'ri-close-circle-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
            { label: 'Active', value: warehouseRejectionCodes.filter((i) => i.isActive).length, icon: 'ri-checkbox-circle-line', bg: 'bg-green-50', color: 'text-green-600' },
            { label: 'Most Common Category', value: CATEGORY_BADGE[mostCommonCategory.value].label, icon: 'ri-bar-chart-line', bg: 'bg-amber-50', color: 'text-amber-600' },
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
                {['Code', 'Description', 'Category', 'Applicable To', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <i className="ri-loader-4-line text-4xl text-[#4f46e5] animate-spin block mb-2" />
                    <p className="text-[#94a3b8] text-sm">Loading rejection codes...</p>
                  </td>
                </tr>
              ) : filtered.map((rc, idx) => {
                const badge = CATEGORY_BADGE[rc.category];
                return (
                  <tr key={rc.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1e293b] whitespace-nowrap">{rc.code}</td>
                    <td className="px-4 py-3">
                      <span className="text-[#1e293b] whitespace-nowrap">{rc.description}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs text-[#64748b]">{APPLICABLE_LABEL[rc.applicableTo]}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button onClick={() => handleToggleActive(rc)} className="cursor-pointer" title="Click to toggle status">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${rc.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${rc.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                          {rc.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(rc)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer" title="Edit">
                          <i className="ri-edit-line text-sm" />
                        </button>
                        <button onClick={() => setDeleteConfirm(rc)}
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
                    <i className="ri-close-circle-line text-4xl text-[#e2e8f0] block mb-2" />
                    <p className="text-[#94a3b8] text-sm">No rejection codes found</p>
                    {search && <p className="text-xs text-[#94a3b8] mt-1">Try a different search term</p>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RCModal
        open={modal.open}
        editing={modal.editing}
        onClose={closeModal}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remove Rejection Code"
        message={`Remove "${deleteConfirm?.code}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel="Yes, Remove (Y)"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}