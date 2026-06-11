import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { MasterFilters, MasterSummaryCards, MasterStatsRow } from '@/pages/masters/common/CommonComponets';
import {
    createMachine,
    getAllMachines,
    updateMachine,
    deleteMachine,
    type MachineResponse
} from '@/api/machine.api';
import { getAllWorkCenters } from '@/api/workcenter.api';

type MachineStatus = 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'BREAKDOWN';

interface Machine {
    id: string;
    name: string;
    model: string;
    workCenterId: string;
    workCenterName?: string | null;
    capacityPerHour: number;
    status: MachineStatus;
    lastMaintenanceDate: string | null;
    maintenanceFrequencyDays: number | null;
    isActive: boolean;
}

interface WorkCenterOption {
    id: string;
    name: string;
    type: string;
    isActive: boolean;
}

interface MachineForm {
    name: string;
    model: string;
    workCenterId: string;
    capacityPerHour: string;
    status: MachineStatus;
    lastMaintenanceDate: string;
    maintenanceFrequencyDays: string;
    isActive: boolean;
}

const STATUS_OPTIONS: { value: MachineStatus; label: string }[] = [
    { value: 'RUNNING', label: 'Running' },
    { value: 'IDLE', label: 'Idle' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'BREAKDOWN', label: 'Breakdown' },
];

const STATUS_BADGE: Record<MachineStatus, { label: string; cls: string }> = {
    RUNNING: { label: 'Running', cls: 'bg-green-50 text-green-700 border-green-200' },
    IDLE: { label: 'Idle', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
    MAINTENANCE: { label: 'Maintenance', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    BREAKDOWN: { label: 'Breakdown', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const emptyForm: MachineForm = {
    name: '', model: '', workCenterId: '', capacityPerHour: '', status: 'IDLE',
    lastMaintenanceDate: '', maintenanceFrequencyDays: '', isActive: true,
};

function isMaintenanceOverdue(m: Machine): boolean {
    if (!m.lastMaintenanceDate || !m.maintenanceFrequencyDays || m.maintenanceFrequencyDays <= 0) return false;
    const last = new Date(m.lastMaintenanceDate);
    const due = new Date(last);
    due.setDate(due.getDate() + m.maintenanceFrequencyDays);
    return new Date() > due;
}

// ─── Slide-Over Form ──────────────────────────────────────────────────────────
interface SlideOverProps {
    open: boolean;
    editing: Machine | null;
    onClose: () => void;
    onSave: (form: MachineForm) => Promise<void>;
    workCenters: WorkCenterOption[];
}

function MachineSlideOver({ open, editing, onClose, onSave, workCenters }: SlideOverProps) {
    const [form, setForm] = useState<MachineForm>({ ...emptyForm });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        if (editing) {
            setForm({
                name: editing?.name || '',
                model: editing?.model || '',
                workCenterId: editing?.workCenterId || '',
                capacityPerHour: editing?.capacityPerHour?.toString() || '',
                status: editing?.status || 'IDLE',
                lastMaintenanceDate: editing?.lastMaintenanceDate ?? '',
                maintenanceFrequencyDays: editing?.maintenanceFrequencyDays?.toString() || '',
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

    const update = (field: keyof MachineForm, value: string | boolean) => {
        setForm((p) => ({ ...p, [field]: value }));
        if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Machine name is required';
        if (!form.workCenterId) e.workCenterId = 'Work center is required';
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

    const activeWorkCenters = workCenters.filter((wc) => wc.isActive);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[600] flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg flex flex-col h-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                    <div>
                        <h3 className="text-base font-semibold text-[#1e293b]">
                            {editing ? 'Edit Machine' : 'Add Machine'}
                        </h3>
                        <p className="text-xs text-[#64748b] mt-0.5">
                            {editing ? 'Update machine details' : 'Register a new machine'}
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
                            Machine Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={firstInputRef}
                            type="text" value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                            placeholder="e.g. CNC Machine 1"
                            className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Model */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Model Number</label>
                        <input
                            type="text" value={form.model}
                            onChange={(e) => update('model', e.target.value)}
                            placeholder="e.g. HAAS VF-2"
                            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                        />
                    </div>

                    {/* Work Center */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Work Center <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.workCenterId}
                            onChange={(e) => update('workCenterId', e.target.value)}
                            className={`w-full h-10 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 transition-colors cursor-pointer ${errors.workCenterId ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        >
                            <option value="">— Select Work Center —</option>
                            {activeWorkCenters.map((wc) => (
                                <option key={wc.id} value={wc.id}>{wc.name}</option>
                            ))}
                        </select>
                        {errors.workCenterId && <p className="text-xs text-red-500">{errors.workCenterId}</p>}
                    </div>

                    {/* Capacity */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Capacity per Hour</label>
                        <input
                            type="number" min="0"
                            value={form.capacityPerHour}
                            onChange={(e) => update('capacityPerHour', e.target.value)}
                            placeholder="Units this machine produces per hour"
                            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Current Status <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {STATUS_OPTIONS.map((s) => {
                                const badge = STATUS_BADGE[s.value];
                                const isSelected = form.status === s.value;
                                return (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => update('status', s.value)}
                                        className={`flex items-center gap-1.5 h-9 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${isSelected
                                            ? `${badge.cls} border-current ring-2 ring-current/20`
                                            : 'border-[#e2e8f0] text-[#64748b] hover:border-[#4f46e5]/40 hover:text-[#4f46e5]'
                                            }`}
                                    >
                                        {s.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Maintenance row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Last Maintenance Date</label>
                            <input
                                type="date"
                                value={form.lastMaintenanceDate}
                                onChange={(e) => update('lastMaintenanceDate', e.target.value)}
                                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Maintenance every X days</label>
                            <input
                                type="number" min="1"
                                value={form.maintenanceFrequencyDays}
                                onChange={(e) => update('maintenanceFrequencyDays', e.target.value)}
                                placeholder="e.g. 90"
                                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                            />
                        </div>
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
                            {form.isActive ? 'Active — machine is in use' : 'Inactive — machine is disabled'}
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
export default function MachinesPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [machines, setMachines] = useState<Machine[]>([]);
    const [workCenters, setWorkCenters] = useState<WorkCenterOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<MachineStatus | 'ALL'>('ALL');
    const [wcFilter, setWcFilter] = useState<string>('ALL');
    const [slideOver, setSlideOver] = useState<{ open: boolean; editing: Machine | null }>({ open: false, editing: null });
    const [deleteConfirm, setDeleteConfirm] = useState<Machine | null>(null);

    const mapApiToMachine = (m: MachineResponse): Machine => ({
        id: m.id,
        name: m.name,
        model: m.model || '',
        workCenterId: m.work_center_id || '',
        workCenterName: m.work_center_name || '',
        capacityPerHour: Number(m.capacity_per_hour || 0),
        status: m.status,
        lastMaintenanceDate: m.last_maintenance_date ? m.last_maintenance_date.split('T')[0] : null,
        maintenanceFrequencyDays: m.maintenance_frequency_days ? Number(m.maintenance_frequency_days) : null,
        isActive: m.is_active,
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [mcRes, wcRes] = await Promise.all([
                getAllMachines(),
                getAllWorkCenters()
            ]);
            if (wcRes.success && wcRes.data) {
                setWorkCenters(
                    wcRes.data.map((wc) => ({
                        id: wc.id,
                        name: wc.name,
                        type: wc.type,
                        isActive: wc.is_active,
                    }))
                );
            }
            if (mcRes.success && mcRes.data) {
                setMachines(mcRes.data.map(mapApiToMachine));
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to load data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filtered = machines.filter((m) => {
        const q = search.toLowerCase();
        const matchSearch = !q || m.name.toLowerCase().includes(q) || m.model.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'ALL' || m.status === statusFilter;
        const matchWc = wcFilter === 'ALL' || m.workCenterId === wcFilter;
        return matchSearch && matchStatus && matchWc;
    });

    const openAdd = () => setSlideOver({ open: true, editing: null });
    const openEdit = (m: Machine) => setSlideOver({ open: true, editing: m });
    const closeSlideOver = () => setSlideOver({ open: false, editing: null });

    const handleSave = async (form: MachineForm) => {
        try {
            if (slideOver.editing) {
                const res = await updateMachine(slideOver.editing.id, {
                    name: form.name,
                    model: form.model || null,
                    workCenterId: form.workCenterId || null,
                    capacityPerHour: form.capacityPerHour ? Number(form.capacityPerHour) : null,
                    status: form.status,
                    lastMaintenanceDate: form.lastMaintenanceDate || null,
                    maintenanceFrequencyDays: form.maintenanceFrequencyDays ? Number(form.maintenanceFrequencyDays) : null,
                    isActive: form.isActive,
                });
                if (res.success && res.data) {
                    setMachines((prev) =>
                        prev.map((m) =>
                            m.id === slideOver.editing!.id
                                ? mapApiToMachine(res.data!)
                                : m,
                        ),
                    );
                    toast.success('Machine updated successfully');
                }
            } else {
                const res = await createMachine({
                    name: form.name,
                    model: form.model || null,
                    workCenterId: form.workCenterId || null,
                    capacityPerHour: form.capacityPerHour ? Number(form.capacityPerHour) : null,
                    status: form.status,
                    lastMaintenanceDate: form.lastMaintenanceDate || null,
                    maintenanceFrequencyDays: form.maintenanceFrequencyDays ? Number(form.maintenanceFrequencyDays) : null,
                    isActive: form.isActive,
                });
                if (res.success && res.data) {
                    setMachines((prev) => [mapApiToMachine(res.data!), ...prev]);
                    toast.success('Machine created successfully');
                }
            }
            closeSlideOver();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save machine');
            throw err;
        }
    };

    const handleToggleActive = async (m: Machine) => {
        // Optimistic update
        setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, isActive: !x.isActive } : x));
        try {
            await updateMachine(m.id, { isActive: !m.isActive });
            toast.success(`${m.name} ${m.isActive ? 'deactivated' : 'activated'}`);
        } catch (err) {
            // Rollback
            setMachines((prev) => prev.map((x) => x.id === m.id ? { ...x, isActive: m.isActive } : x));
            toast.error(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteMachine(deleteConfirm.id);
            setMachines((prev) => prev.filter((m) => m.id !== deleteConfirm.id));
            toast.success(`"${deleteConfirm.name}" removed`);
            setDeleteConfirm(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete machine');
        }
    };

    const getWorkCenterName = (id: string) => {
        const wc = workCenters.find((w) => w.id === id);
        return wc ? wc.name : id;
    };

    const getWorkCenterType = (id: string): string | null => {
        const wc = workCenters.find((w) => w.id === id);
        return wc ? wc.type : null;
    };

    // Status counts
    const statusCounts = STATUS_OPTIONS.map((s) => ({
        ...s,
        count: machines.filter((m) => m.status === s.value).length,
        badge: STATUS_BADGE[s.value],
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
                            <h2 className="text-xl font-bold text-[#1e293b]">Machines</h2>
                            <p className="text-sm text-[#64748b] mt-0.5">Manage machines, maintenance schedules &amp; work center assignments</p>
                        </div>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
                        <i className="ri-add-line" /> Add Machine
                    </button>
                </div>

                {/* Filters */}
                <MasterFilters
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search machines..."
                    filters={[
                        {
                            value: statusFilter,
                            onChange: (val) => setStatusFilter(val),
                            options: [
                                { value: 'ALL', label: 'All Status' },
                                ...STATUS_OPTIONS,
                            ],
                        },
                        {
                            value: wcFilter,
                            onChange: (val) => setWcFilter(val),
                            options: [
                                { value: 'ALL', label: 'All Work Centers' },
                                ...workCenters.filter((wc) => wc.isActive).map((wc) => ({ value: wc.id, label: wc.name })),
                            ],
                        },
                    ]}
                    hasActiveFilters={!!(search || statusFilter !== 'ALL' || wcFilter !== 'ALL')}
                    onClearFilters={() => {
                        setSearch('');
                        setStatusFilter('ALL');
                        setWcFilter('ALL');
                    }}
                />

                {/* Summary cards */}
                <MasterSummaryCards
                    items={statusCounts.map((s) => ({
                        value: s.value,
                        count: s.count,
                        label: s.badge.label,
                        badgeClass: s.badge.cls,
                    }))}
                    activeFilterValue={statusFilter}
                    onFilterChange={(val) => setStatusFilter(val)}
                />

                {/* Stats row */}
                <MasterStatsRow
                    stats={[
                        { label: 'Total Machines', value: machines.length, icon: 'ri-settings-3-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
                        { label: 'Active', value: machines.filter((m) => m.isActive).length, icon: 'ri-checkbox-circle-line', bg: 'bg-green-50', color: 'text-green-600' },
                        { label: 'Needs Maintenance', value: machines.filter((m) => isMaintenanceOverdue(m)).length, icon: 'ri-alert-line', bg: 'bg-amber-50', color: 'text-amber-600' },
                    ]}
                />

                {/* Table */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
                        <table className="w-full min-w-[800px] text-sm border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                    {['Machine Name', 'Model', 'Work Center', 'Capacity/hr', 'Status', 'Last Maintenance', ''].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <i className="ri-loader-4-line text-4xl text-[#4f46e5] animate-spin block mb-2" />
                                            <p className="text-[#94a3b8] text-sm">Loading machines...</p>
                                        </td>
                                    </tr>
                                ) : filtered.map((m, idx) => {
                                    const badge = STATUS_BADGE[m.status];
                                    const overdue = isMaintenanceOverdue(m);
                                    const wcType = getWorkCenterType(m.workCenterId);
                                    return (
                                        <tr key={m.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${badge.cls} border`}>
                                                        <i className="ri-settings-3-line text-sm" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[#1e293b] whitespace-nowrap">{m.name}</p>
                                                        {m.model && <p className="text-xs text-[#94a3b8]">{m.model}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#64748b] whitespace-nowrap">
                                                {m.model || <span className="text-[#94a3b8] italic">—</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-sm text-[#1e293b]">{getWorkCenterName(m.workCenterId)}</span>
                                                    {wcType && (
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${wcType === 'MACHINE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            wcType === 'LABOR' ? 'bg-green-50 text-green-700 border-green-200' :
                                                                'bg-purple-50 text-purple-700 border-purple-200'
                                                            }`}>
                                                            {wcType === 'MACHINE' ? 'M' : wcType === 'LABOR' ? 'L' : 'B'}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">
                                                {m.capacityPerHour ? `${m.capacityPerHour} units/hr` : <span className="text-[#94a3b8] italic font-normal">—</span>}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                                                        {badge.label}
                                                    </span>
                                                    {overdue && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                                            <i className="ri-alert-line text-[10px]" />
                                                            Maintenance Due
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {m.lastMaintenanceDate ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs text-[#1e293b]">{m.lastMaintenanceDate}</span>
                                                        {m.maintenanceFrequencyDays && (
                                                            <span className="text-[10px] text-[#94a3b8]">Every {m.maintenanceFrequencyDays} days</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[#94a3b8] italic">Not recorded</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEdit(m)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer" title="Edit">
                                                        <i className="ri-edit-line text-sm" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(m)}
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
                                            <i className="ri-settings-3-line text-4xl text-[#e2e8f0] block mb-2" />
                                            <p className="text-[#94a3b8] text-sm">No machines found</p>
                                            {(search || statusFilter !== 'ALL' || wcFilter !== 'ALL') && (
                                                <p className="text-xs text-[#94a3b8] mt-1">Try adjusting your filters</p>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-xs text-gray-400 text-right mt-1 px-4 sm:hidden">
                        ← Scroll to see more →
                    </p>
                </div>
            </div>

            <MachineSlideOver
                open={slideOver.open}
                editing={slideOver.editing}
                onClose={closeSlideOver}
                onSave={handleSave}
                workCenters={workCenters}
            />

            <ConfirmDialog
                open={!!deleteConfirm}
                title="Remove Machine"
                message={`Remove "${deleteConfirm?.name}"? This action cannot be undone.`}
                variant="danger"
                confirmLabel="Yes, Remove"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </AppLayout>
    );
}