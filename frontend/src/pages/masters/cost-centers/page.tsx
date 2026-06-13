import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useToast } from '@/contexts/ToastContext';
import { formatINR } from '@/utils/format';
import { MasterFilters, MasterSummaryCards, MasterStatsRow } from '@/pages/masters/common/CommonComponets';
import {
    createCostCenter,
    getAllCostCenters,
    updateCostCenter,
    deleteCostCenter,
    type CostCenterResponse,
    type CostCenterType
} from '@/api/costcenter.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

interface CostCenter {
    id: string;
    name: string;
    code: string;
    type: CostCenterType;
    managerId: string | null;
    managerName: string | null;
    budgetMonthly: number;
    isActive: boolean;
    warehouseId?: string | null;
}

interface CCForm {
    name: string;
    code: string;
    type: CostCenterType;
    managerName: string;
    budgetMonthly: string;
    isActive: boolean;
}

const emptyForm: CCForm = {
    name: '', code: '', type: 'PRODUCTION', managerName: '', budgetMonthly: '', isActive: true,
};

const TYPE_OPTIONS: { value: CostCenterType; label: string }[] = [
    { value: 'PRODUCTION', label: 'Production' },
    { value: 'ADMIN', label: 'Administration' },
    { value: 'SALES', label: 'Sales' },
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'QUALITY', label: 'Quality Control' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
];

const TYPE_BADGE: Record<CostCenterType, { label: string; cls: string }> = {
    PRODUCTION: { label: 'Production', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    ADMIN: { label: 'Admin', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    SALES: { label: 'Sales', cls: 'bg-green-50 text-green-700 border-green-200' },
    PURCHASE: { label: 'Purchase', cls: 'bg-teal-50 text-teal-700 border-teal-200' },
    QUALITY: { label: 'Quality', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    MAINTENANCE: { label: 'Maintenance', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
};

// ─── Modal ────────────────────────────────────────────────────────────────────
interface CCModalProps {
    open: boolean;
    editing: CostCenter | null;
    onClose: () => void;
    onSave: (form: CCForm) => Promise<void>;
}

function CCModal({ open, editing, onClose, onSave }: CCModalProps) {
    const formRef = useRef<HTMLDivElement>(null);
    const { focusFirst } = useKeyboardNav(formRef as React.RefObject<HTMLElement>);

    const [form, setForm] = useState<CCForm>({ ...emptyForm });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (open) {
            if (editing) {
                setForm({
                    name: editing?.name || '',
                    code: editing?.code || '',
                    type: editing?.type || 'PRODUCTION',
                    managerName: editing?.managerName ?? '',
                    budgetMonthly: editing?.budgetMonthly?.toString() || '0',
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

    const update = (field: keyof CCForm, value: string | boolean) => {
        setForm((p) => ({ ...p, [field]: value }));
        if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Cost center name is required';
        if (!form.code.trim()) e.code = 'Code is required';
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
                            {editing ? 'Edit Cost Center' : 'Add Cost Center'}
                        </h3>
                        <p className="text-xs text-[#64748b] mt-0.5">
                            {editing ? 'Update cost center details' : 'Create a new cost center'}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer">
                        <i className="ri-close-line" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">

                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Cost Center Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                            placeholder="e.g. Production Floor" data-nav-index={0}
                            className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Code */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" value={form.code}
                            onChange={(e) => update('code', e.target.value)}
                            placeholder="e.g. CC-PROD" data-nav-index={1}
                            className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.code ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        />
                        {errors.code && <p className="text-xs text-red-500">{errors.code}</p>}
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {TYPE_OPTIONS.map((t) => {
                                const badge = TYPE_BADGE[t.value];
                                const isSelected = form.type === t.value;
                                return (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => update('type', t.value)}
                                        className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${isSelected
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

                    {/* Manager */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Manager Name</label>
                        <input
                            type="text" value={form.managerName}
                            onChange={(e) => update('managerName', e.target.value)}
                            placeholder="e.g. Rajesh Nair" data-nav-index={2}
                            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                        />
                    </div>

                    {/* Budget */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Monthly Budget (₹)</label>
                        <input
                            type="number" min="0"
                            value={form.budgetMonthly}
                            onChange={(e) => update('budgetMonthly', e.target.value)}
                            placeholder="e.g. 500000" data-nav-index={3}
                            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                        />
                    </div>

                    {/* Active toggle */}
                    <div className="flex items-center gap-3 pt-1">
                        <button type="button"
                            onClick={() => update('isActive', !form.isActive)}
                            data-nav-index={4}
                            className={`relative w-10 h-6 rounded-full transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 ${form.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
                        >
                            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                        <label className="text-sm text-[#64748b]">
                            {form.isActive ? 'Active — cost center is operational' : 'Inactive — cost center is disabled'}
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
                            onClick={() => void handleSave()} disabled={isSaving} data-nav-index={5}
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
export default function CostCentersPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [items, setItems] = useState<CostCenter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<CostCenterType | 'ALL'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [modal, setModal] = useState<{ open: boolean; editing: CostCenter | null }>({ open: false, editing: null });
    const [deleteConfirm, setDeleteConfirm] = useState<CostCenter | null>(null);

    const { selectedWarehouseId } = useWarehouseStore();

    const mapApiToCostCenter = (c: CostCenterResponse): CostCenter => ({
        id: c.id,
        name: c.name,
        code: c.code,
        type: c.type,
        managerId: c.manager_id,
        managerName: c.manager_name,
        budgetMonthly: Number(c.budget_monthly || 0),
        isActive: c.is_active,
        warehouseId: c.warehouse_id || null,
    });

    const fetchCostCenters = async () => {
        setIsLoading(true);
        try {
            const res = await getAllCostCenters();
            if (res.success && res.data) {
                setItems(res.data.map(mapApiToCostCenter));
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to fetch cost centers');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCostCenters();
    }, []);

    const warehouseCostCenters = useMemo(() => {
        if (!selectedWarehouseId) return items;
        return items.filter((cc) => cc.warehouseId === selectedWarehouseId);
    }, [items, selectedWarehouseId]);

    const filtered = useMemo(() => {
        return warehouseCostCenters.filter((cc) => {
            const q = search.toLowerCase();
            const matchSearch = !q || cc.name.toLowerCase().includes(q) || cc.code.toLowerCase().includes(q) || (cc.managerName ?? '').toLowerCase().includes(q);
            const matchType = typeFilter === 'ALL' || cc.type === typeFilter;
            const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? cc.isActive : !cc.isActive);
            return matchSearch && matchType && matchStatus;
        });
    }, [warehouseCostCenters, search, typeFilter, statusFilter]);

    const openAdd = () => setModal({ open: true, editing: null });
    const openEdit = (cc: CostCenter) => setModal({ open: true, editing: cc });
    const closeModal = () => setModal({ open: false, editing: null });

    const handleSave = async (form: CCForm) => {
        try {
            if (modal.editing) {
                const res = await updateCostCenter(modal.editing.id, {
                    name: form.name.trim(),
                    code: form.code.trim(),
                    type: form.type,
                    managerName: form.managerName.trim() || null,
                    budgetMonthly: Number(form.budgetMonthly) || 0,
                    isActive: form.isActive,
                });
                if (res.success && res.data) {
                    setItems((prev) =>
                        prev.map((cc) =>
                            cc.id === modal.editing!.id
                                ? mapApiToCostCenter(res.data!)
                                : cc,
                        ),
                    );
                    toast.success('Cost center updated successfully');
                }
            } else {
                const res = await createCostCenter({
                    name: form.name.trim(),
                    code: form.code.trim(),
                    type: form.type,
                    managerName: form.managerName.trim() || null,
                    budgetMonthly: Number(form.budgetMonthly) || 0,
                    isActive: form.isActive,
                    warehouseId: selectedWarehouseId || null,
                });
                if (res.success && res.data) {
                    setItems((prev) => [mapApiToCostCenter(res.data!), ...prev]);
                    toast.success('Cost center created successfully');
                }
            }
            closeModal();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save cost center');
            throw err;
        }
    };

    const handleToggleActive = async (cc: CostCenter) => {
        // Optimistic update
        setItems((prev) => prev.map((i) => i.id === cc.id ? { ...i, isActive: !i.isActive } : i));
        try {
            await updateCostCenter(cc.id, { isActive: !cc.isActive });
            toast.success(`${cc.name} ${cc.isActive ? 'deactivated' : 'activated'}`);
        } catch (err) {
            // Rollback
            setItems((prev) => prev.map((i) => i.id === cc.id ? { ...i, isActive: cc.isActive } : i));
            toast.error(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteCostCenter(deleteConfirm.id);
            setItems((prev) => prev.filter((i) => i.id !== deleteConfirm.id));
            toast.success(`"${deleteConfirm.name}" removed`);
            setDeleteConfirm(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete cost center');
        }
    };

    // Summary
    const typeCounts = useMemo(() => {
        return TYPE_OPTIONS.map((t) => ({
            ...t,
            count: warehouseCostCenters.filter((cc) => cc.type === t.value).length,
            badge: TYPE_BADGE[t.value],
        }));
    }, [warehouseCostCenters]);

    const totalBudget = useMemo(() => {
        return warehouseCostCenters.filter((i) => i.isActive).reduce((a, cc) => a + cc.budgetMonthly, 0);
    }, [warehouseCostCenters]);

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
                            <h2 className="text-xl font-bold text-[#1e293b]">Cost Centers</h2>
                            <p className="text-sm text-[#64748b] mt-0.5">Manage department-level cost tracking and budgets</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search cost centers..."
                                className="h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-52"
                            />
                        </div>
                        <button onClick={openAdd}
                            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
                            <i className="ri-add-line" /> Add Cost Center
                        </button>
                    </div>
                </div>

                {/* Type summary cards */}
                <MasterSummaryCards
                    items={typeCounts.map((t) => ({
                        value: t.value,
                        count: t.count,
                        label: t.label,
                        badgeClass: t.badge.cls,
                    }))}
                    activeFilterValue={typeFilter}
                    onFilterChange={(val) => setTypeFilter(val as CostCenterType | 'ALL')}
                />

                {/* Stats row */}
                <MasterStatsRow
                    stats={[
                        { label: 'Total Cost Centers', value: warehouseCostCenters.length, icon: 'ri-building-4-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
                        { label: 'Active', value: warehouseCostCenters.filter((i) => i.isActive).length, icon: 'ri-checkbox-circle-line', bg: 'bg-green-50', color: 'text-green-600' },
                        { label: 'Total Monthly Budget', value: formatINR(totalBudget), icon: 'ri-money-rupee-circle-line', bg: 'bg-amber-50', color: 'text-amber-600' },
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
                    hasActiveFilters={!!(typeFilter !== 'ALL' || statusFilter !== 'ALL' || search)}
                    onClearFilters={() => {
                        setTypeFilter('ALL');
                        setStatusFilter('ALL');
                        setSearch('');
                    }}
                />

                {/* Table */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                {['Code', 'Name', 'Type', 'Manager', 'Budget/Month', 'Status', ''].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <i className="ri-loader-4-line text-4xl text-[#4f46e5] animate-spin block mb-2" />
                                        <p className="text-[#94a3b8] text-sm">Loading cost centers...</p>
                                    </td>
                                </tr>
                            ) : filtered.map((cc, idx) => {
                                const badge = TYPE_BADGE[cc.type];
                                return (
                                    <tr key={cc.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}>
                                        <td className="px-4 py-3 font-mono text-xs text-[#64748b] whitespace-nowrap">{cc.code}</td>
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-[#1e293b] whitespace-nowrap">{cc.name}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {cc.managerName ? (
                                                <span className="text-[#1e293b] text-xs font-medium">{cc.managerName}</span>
                                            ) : (
                                                <span className="text-xs text-[#94a3b8] italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-[#1e293b] whitespace-nowrap font-medium">{formatINR(cc.budgetMonthly)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button onClick={() => handleToggleActive(cc)} className="cursor-pointer" title="Click to toggle status">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${cc.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${cc.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                                                    {cc.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(cc)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer" title="Edit">
                                                    <i className="ri-edit-line text-sm" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(cc)}
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
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <i className="ri-building-4-line text-4xl text-[#e2e8f0] block mb-2" />
                                        <p className="text-[#94a3b8] text-sm">No cost centers found</p>
                                        {search && <p className="text-xs text-[#94a3b8] mt-1">Try a different search term</p>}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CCModal
                open={modal.open}
                editing={modal.editing}
                onClose={closeModal}
                onSave={handleSave}
            />

            <ConfirmDialog
                open={!!deleteConfirm}
                title="Remove Cost Center"
                message={`Remove "${deleteConfirm?.name}"? This action cannot be undone.`}
                variant="danger"
                confirmLabel="Yes, Remove (Y)"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </AppLayout>
    );
}