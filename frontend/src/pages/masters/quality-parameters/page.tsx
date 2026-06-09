import { useState, useMemo, useCallback } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import {
  mockQualityParameters,
  MockQualityParameter,
} from '@/mocks/masters';

const TYPE_OPTIONS: { value: MockQualityParameter['type']; label: string }[] = [
  { value: 'PASS_FAIL', label: 'Pass / Fail' },
  { value: 'NUMERIC', label: 'Numeric' },
  { value: 'TEXT', label: 'Text' },
];

const APPLICABLE_OPTIONS: { value: MockQualityParameter['applicableTo']; label: string }[] = [
  { value: 'INCOMING', label: 'Incoming' },
  { value: 'IN_PROCESS', label: 'In-Process' },
  { value: 'FINAL', label: 'Final' },
  { value: 'ALL', label: 'All' },
];

const TYPE_BADGE: Record<MockQualityParameter['type'], { bg: string; text: string; label: string }> = {
  PASS_FAIL: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Pass / Fail' },
  NUMERIC:   { bg: 'bg-blue-100',    text: 'text-blue-700',    label: 'Numeric' },
  TEXT:      { bg: 'bg-slate-100',   text: 'text-slate-700',   label: 'Text' },
};

const APPLICABLE_LABEL: Record<MockQualityParameter['applicableTo'], string> = {
  INCOMING: 'Incoming',
  IN_PROCESS: 'In-Process',
  FINAL: 'Final',
  ALL: 'All Stages',
};

function getRangeDisplay(p: MockQualityParameter): string {
  if (p.type === 'PASS_FAIL') return 'Pass / Fail';
  if (p.type === 'TEXT') return '—';
  const unit = p.unit ? ` ${p.unit}` : '';
  if (p.minValue != null && p.maxValue != null) return `${p.minValue} - ${p.maxValue}${unit}`;
  if (p.minValue != null) return `≥ ${p.minValue}${unit}`;
  if (p.maxValue != null) return `≤ ${p.maxValue}${unit}`;
  return `Any value${unit}`;
}

let nextId = 9;

export default function QualityParametersPage() {
  const toast = useToast();
  const [items, setItems] = useState<MockQualityParameter[]>([...mockQualityParameters]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | MockQualityParameter['type']>('ALL');
  const [applicableFilter, setApplicableFilter] = useState<'ALL' | MockQualityParameter['applicableTo']>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MockQualityParameter>>({ type: 'PASS_FAIL', applicableTo: 'ALL', isActive: true, unit: null, minValue: null, maxValue: null });
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || it.name.toLowerCase().includes(q) || it.code.toLowerCase().includes(q);
      const matchesType = typeFilter === 'ALL' || it.type === typeFilter;
      const matchesApplicable = applicableFilter === 'ALL' || it.applicableTo === applicableFilter;
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? it.isActive : !it.isActive);
      return matchesSearch && matchesType && matchesApplicable && matchesStatus;
    });
  }, [items, search, typeFilter, applicableFilter, statusFilter]);

  const stats = useMemo(() => {
    const total = items.length;
    const active = items.filter((i) => i.isActive).length;
    const passFail = items.filter((i) => i.type === 'PASS_FAIL').length;
    const numeric = items.filter((i) => i.type === 'NUMERIC').length;
    return { total, active, inactive: total - active, passFail, numeric };
  }, [items]);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm({ type: 'PASS_FAIL', applicableTo: 'ALL', isActive: true, unit: null, minValue: null, maxValue: null });
    setFormError(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((it: MockQualityParameter) => {
    setEditingId(it.id);
    setForm({
      ...it,
      type: it?.type ?? 'PASS_FAIL',
      applicableTo: it?.applicableTo ?? 'ALL',
      isActive: it?.isActive ?? true,
      unit: it?.unit ?? null,
      minValue: it?.minValue ?? null,
      maxValue: it?.maxValue ?? null,
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
    if (!form.name?.trim()) { setFormError('Parameter name is required'); return false; }
    if (!form.code?.trim()) { setFormError('Code is required'); return false; }
    const dup = items.find((i) => i.code.trim().toUpperCase() === form.code!.trim().toUpperCase() && i.id !== editingId);
    if (dup) { setFormError(`Code "${form.code}" already exists`); return false; }
    if (form.type === 'NUMERIC') {
      if (form.minValue != null && form.maxValue != null && form.minValue > form.maxValue) {
        setFormError('Min value cannot be greater than max value'); return false;
      }
    }
    setFormError(null);
    return true;
  }, [form, items, editingId]);

  const save = useCallback(() => {
    if (!validate()) return;
    const payload: MockQualityParameter = {
      id: editingId ?? `qp-00${nextId++}`,
      name: form.name!.trim(),
      code: form.code!.trim().toUpperCase(),
      type: form.type!,
      unit: form.type === 'NUMERIC' ? (form.unit?.trim() || null) : null,
      minValue: form.type === 'NUMERIC' ? (form.minValue ?? null) : null,
      maxValue: form.type === 'NUMERIC' ? (form.maxValue ?? null) : null,
      applicableTo: form.applicableTo!,
      isActive: form.isActive ?? true,
    };
    if (editingId) {
      setItems((prev) => prev.map((i) => (i.id === editingId ? payload : i)));
      toast.success('Quality parameter updated');
    } else {
      setItems((prev) => [...prev, payload]);
      toast.success('Quality parameter added');
    }
    closeModal();
  }, [form, editingId, validate, closeModal, toast]);

  const toggleStatus = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isActive: !i.isActive } : i)));
    toast.success('Status updated');
  }, [toast]);

  const confirmDelete = useCallback((id: string) => setDeleteId(id), []);
  const doDelete = useCallback(() => {
    if (!deleteId) return;
    setItems((prev) => prev.filter((i) => i.id !== deleteId));
    toast.success('Quality parameter deleted');
    setDeleteId(null);
  }, [deleteId, toast]);

  const isNumeric = form.type === 'NUMERIC';

  return (
    <AppLayout>
    <div className="p-6 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900">Quality Parameters</h1>
          <p className="text-sm text-slate-500 mt-1">Define inspection criteria and measurement standards</p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4f46e5] text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors whitespace-nowrap cursor-pointer"
        >
          <i className="ri-add-line" />
          Add Parameter
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {[
          { label: 'Total', value: stats.total, icon: 'ri-microscope-line', color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Active', value: stats.active, icon: 'ri-check-line', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Pass/Fail', value: stats.passFail, icon: 'ri-toggle-line', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Numeric', value: stats.numeric, icon: 'ri-bar-chart-box-line', color: 'text-blue-600', bg: 'bg-blue-50' },
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
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
        >
          <option value="ALL">All Types</option>
          <option value="PASS_FAIL">Pass / Fail</option>
          <option value="NUMERIC">Numeric</option>
          <option value="TEXT">Text</option>
        </select>
        <select
          value={applicableFilter}
          onChange={(e) => setApplicableFilter(e.target.value as typeof applicableFilter)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
        >
          <option value="ALL">All Stages</option>
          <option value="INCOMING">Incoming</option>
          <option value="IN_PROCESS">In-Process</option>
          <option value="FINAL">Final</option>
          <option value="ALL">All</option>
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
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Unit</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Range</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Applicable To</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((it) => {
                const badge = TYPE_BADGE[it.type];
                return (
                  <tr key={it.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{it.code}</td>
                    <td className="px-4 py-3 text-slate-900 font-medium whitespace-nowrap">{it.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{it.unit ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{getRangeDisplay(it)}</td>
                    <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">{APPLICABLE_LABEL[it.applicableTo]}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => toggleStatus(it.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${it.isActive ? 'bg-[#4f46e5]' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${it.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(it)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <i className="ri-edit-line" />
                        </button>
                        <button
                          onClick={() => confirmDelete(it.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="w-12 h-12 flex items-center justify-center mx-auto mb-3 rounded-full bg-slate-50">
                      <i className="ri-inbox-line text-xl text-slate-300" />
                    </div>
                    <p className="text-sm">No quality parameters found</p>
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
          Showing {filtered.length} of {items.length} parameters
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">{editingId ? 'Edit Parameter' : 'Add Parameter'}</h2>
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Parameter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name ?? ''}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Dimensional Check"
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
                  placeholder="e.g. QP-DIM"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Type <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setForm((f) => ({ ...f, type: opt.value, unit: opt.value === 'NUMERIC' ? f.unit : null, minValue: opt.value === 'NUMERIC' ? f.minValue : null, maxValue: opt.value === 'NUMERIC' ? f.maxValue : null }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${
                        form.type === opt.value
                          ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {isNumeric && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Unit (optional)</label>
                    <input
                      type="text"
                      value={form.unit ?? ''}
                      onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                      placeholder="e.g. mm, kg, HRC"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Min Value</label>
                      <input
                        type="number"
                        step="any"
                        value={form.minValue ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, minValue: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                        placeholder="e.g. 9.8"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Max Value</label>
                      <input
                        type="number"
                        step="any"
                        value={form.maxValue ?? ''}
                        onChange={(e) => setForm((f) => ({ ...f, maxValue: e.target.value === '' ? null : parseFloat(e.target.value) }))}
                        placeholder="e.g. 10.2"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5]"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                    Range preview: <span className="font-medium text-slate-700">{getRangeDisplay({ ...form, id: '', name: '', code: '', applicableTo: 'ALL', isActive: true } as MockQualityParameter)}</span>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Applicable To <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.applicableTo ?? 'ALL'}
                  onChange={(e) => setForm((f) => ({ ...f, applicableTo: e.target.value as MockQualityParameter['applicableTo'] }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 focus:border-[#4f46e5] cursor-pointer"
                >
                  {APPLICABLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-sm font-medium text-slate-700">Active</span>
                <button
                  onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${form.isActive ? 'bg-[#4f46e5]' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">Cancel</button>
              <button onClick={save} className="px-4 py-2 rounded-lg text-sm font-medium bg-[#4f46e5] text-white hover:bg-indigo-700 transition-colors cursor-pointer">
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Parameter?"
        message="This quality parameter will be permanently removed."
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={doDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
    </AppLayout>
  );
}