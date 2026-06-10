import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { MasterFilters, MasterStatsRow } from '@/pages/masters/common/CommonComponets';
import {
    createShift,
    getAllShifts,
    updateShift,
    deleteShift,
    type ShiftResponse
} from '@/api/shift.api';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

interface Shift {
    id: string;
    name: string;
    startTime: string; // HH:MM
    endTime: string; // HH:MM
    breakMinutes: number;
    workingDays: string[];
    isActive: boolean;
}

interface ShiftForm {
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes: string;
    workingDays: string[];
    isActive: boolean;
}

const emptyForm: ShiftForm = {
    name: '', startTime: '', endTime: '', breakMinutes: '30', workingDays: [...DAYS], isActive: true,
};

function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return 0;
    return h * 60 + m;
}

function formatDuration(minutes: number): string {
    if (minutes <= 0) return '0 hrs 0 min';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}min`;
}

function calcEffectiveMinutes(start: string, end: string, breakMins: number): number {
    const s = timeToMinutes(start);
    let e = timeToMinutes(end);
    if (e < s) e += 24 * 60;
    return e - s - breakMins;
}

// ─── Slide-Over Form ──────────────────────────────────────────────────────────
interface SlideOverProps {
    open: boolean;
    editing: Shift | null;
    onClose: () => void;
    onSave: (form: ShiftForm) => Promise<void>;
}

function ShiftSlideOver({ open, editing, onClose, onSave }: SlideOverProps) {
    const [form, setForm] = useState<ShiftForm>({ ...emptyForm });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        if (editing) {
            setForm({
                name: editing?.name || '',
                startTime: editing?.startTime || '06:00',
                endTime: editing?.endTime || '14:00',
                breakMinutes: editing?.breakMinutes?.toString() || '30',
                workingDays: editing?.workingDays ? [...editing.workingDays] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                isActive: editing?.isActive ?? true,
            });
        } else {
            setForm({ ...emptyForm, workingDays: [...DAYS] });
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

    const update = (field: keyof ShiftForm, value: string | string[] | boolean) => {
        setForm((p) => ({ ...p, [field]: value }));
        if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    };

    const toggleDay = (day: string) => {
        setForm((p) => {
            const has = p.workingDays.includes(day);
            if (has && p.workingDays.length === 1) return p;
            const next = has ? p.workingDays.filter((d) => d !== day) : [...p.workingDays, day];
            return { ...p, workingDays: next };
        });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Shift name is required';
        if (!form.startTime) e.startTime = 'Start time is required';
        if (!form.endTime) e.endTime = 'End time is required';
        if (!form.breakMinutes.trim() || Number(form.breakMinutes) < 0) e.breakMinutes = 'Break duration is required';
        if (form.workingDays.length === 0) e.workingDays = 'Select at least one working day';
        const eff = calcEffectiveMinutes(form.startTime, form.endTime, Number(form.breakMinutes));
        if (form.startTime && form.endTime && eff <= 0) e.endTime = 'Effective hours must be positive — adjust break or end time';
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

    const effectiveMins = calcEffectiveMinutes(form.startTime, form.endTime, Number(form.breakMinutes || 0));
    const isOvernight = form.startTime && form.endTime && timeToMinutes(form.endTime) < timeToMinutes(form.startTime);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[600] flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg flex flex-col h-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                    <div>
                        <h3 className="text-base font-semibold text-[#1e293b]">{editing ? 'Edit Shift' : 'Add Shift'}</h3>
                        <p className="text-xs text-[#64748b] mt-0.5">{editing ? 'Update shift details' : 'Create a new work shift'}</p>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer">
                        <i className="ri-close-line" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Shift Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={firstInputRef}
                            type="text" value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                            placeholder="e.g. Morning Shift, Night Shift"
                            className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Time row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time" value={form.startTime}
                                onChange={(e) => update('startTime', e.target.value)}
                                className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.startTime ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                            />
                            {errors.startTime && <p className="text-xs text-red-500">{errors.startTime}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                End Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time" value={form.endTime}
                                onChange={(e) => update('endTime', e.target.value)}
                                className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.endTime ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                            />
                            {errors.endTime && <p className="text-xs text-red-500">{errors.endTime}</p>}
                        </div>
                    </div>
                    {isOvernight && (
                        <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200">
                            <i className="ri-moon-line text-base" />
                            <span>This is an <strong>overnight shift</strong>. Duration calculated across days.</span>
                        </div>
                    )}

                    {/* Break Duration */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Break Duration (minutes) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number" min="0"
                            value={form.breakMinutes}
                            onChange={(e) => update('breakMinutes', e.target.value)}
                            className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.breakMinutes ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        />
                        {errors.breakMinutes && <p className="text-xs text-red-500">{errors.breakMinutes}</p>}
                    </div>

                    {/* Working Days */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Working Days <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS.map((day) => {
                                const selected = form.workingDays.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`h-9 px-3 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${selected
                                                ? 'bg-[#4f46e5] text-white border-[#4f46e5] shadow-sm'
                                                : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]/40 hover:text-[#4f46e5]'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                        {errors.workingDays && <p className="text-xs text-red-500">{errors.workingDays}</p>}
                    </div>

                    {/* Effective Hours — read only */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Effective Working Hours</label>
                        <div className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-2 text-sm text-[#1e293b]">
                            <i className="ri-time-line text-[#64748b]" />
                            <span className="font-semibold">{formatDuration(effectiveMins)}</span>
                            <span className="text-xs text-[#94a3b8]">(End - Start - Break)</span>
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
                            {form.isActive ? 'Active — shift is operational' : 'Inactive — shift is disabled'}
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
export default function ShiftsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [slideOver, setSlideOver] = useState<{ open: boolean; editing: Shift | null }>({ open: false, editing: null });
    const [deleteConfirm, setDeleteConfirm] = useState<Shift | null>(null);

    const parseTime = (t: string): string => {
        if (!t) return '';
        const parts = t.split(':');
        if (parts.length >= 2) {
            return `${parts[0]}:${parts[1]}`;
        }
        return t;
    };

    const mapApiToShift = (s: ShiftResponse): Shift => ({
        id: s.id,
        name: s.name,
        startTime: parseTime(s.start_time),
        endTime: parseTime(s.end_time),
        breakMinutes: Number(s.break_minutes || 0),
        workingDays: s.working_days || [],
        isActive: s.is_active,
    });

    const fetchShifts = async () => {
        setIsLoading(true);
        try {
            const res = await getAllShifts();
            if (res.success && res.data) {
                setShifts(res.data.map(mapApiToShift));
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to fetch shifts');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const filtered = shifts.filter((s) => {
        const q = search.toLowerCase();
        const matchSearch = !q || s.name.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? s.isActive : !s.isActive);
        return matchSearch && matchStatus;
    });

    const openAdd = () => setSlideOver({ open: true, editing: null });
    const openEdit = (s: Shift) => setSlideOver({ open: true, editing: s });
    const closeSlideOver = () => setSlideOver({ open: false, editing: null });

    const handleSave = async (form: ShiftForm) => {
        try {
            if (slideOver.editing) {
                const res = await updateShift(slideOver.editing.id, {
                    name: form.name,
                    startTime: form.startTime,
                    endTime: form.endTime,
                    breakMinutes: Number(form.breakMinutes),
                    workingDays: form.workingDays,
                    isActive: form.isActive,
                });
                if (res.success && res.data) {
                    setShifts((prev) =>
                        prev.map((s) =>
                            s.id === slideOver.editing!.id
                                ? mapApiToShift(res.data!)
                                : s,
                        ),
                    );
                    toast.success('Shift updated successfully');
                }
            } else {
                const res = await createShift({
                    name: form.name,
                    startTime: form.startTime,
                    endTime: form.endTime,
                    breakMinutes: Number(form.breakMinutes),
                    workingDays: form.workingDays,
                    isActive: form.isActive,
                });
                if (res.success && res.data) {
                    setShifts((prev) => [mapApiToShift(res.data!), ...prev]);
                    toast.success('Shift created successfully');
                }
            }
            closeSlideOver();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to save shift');
            throw err;
        }
    };

    const handleToggleActive = async (s: Shift) => {
        // Optimistic update
        setShifts((prev) => prev.map((x) => x.id === s.id ? { ...x, isActive: !x.isActive } : x));
        try {
            await updateShift(s.id, { isActive: !s.isActive });
            toast.success(`${s.name} ${s.isActive ? 'deactivated' : 'activated'}`);
        } catch (err) {
            // Rollback
            setShifts((prev) => prev.map((x) => x.id === s.id ? { ...x, isActive: s.isActive } : x));
            toast.error(err instanceof Error ? err.message : 'Failed to update status');
        }
    };

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        try {
            await deleteShift(deleteConfirm.id);
            setShifts((prev) => prev.filter((s) => s.id !== deleteConfirm.id));
            toast.success(`"${deleteConfirm.name}" removed`);
            setDeleteConfirm(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete shift');
        }
    };

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
                            <h2 className="text-xl font-bold text-[#1e293b]">Shifts</h2>
                            <p className="text-sm text-[#64748b] mt-0.5">Manage work shifts and schedule configuration</p>
                        </div>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
                        <i className="ri-add-line" /> Add Shift
                    </button>
                </div>

                {/* Filters */}
                <MasterFilters
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search shifts..."
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
                    hasActiveFilters={!!(search || statusFilter !== 'ALL')}
                    onClearFilters={() => {
                        setSearch('');
                        setStatusFilter('ALL');
                    }}
                />

                {/* Stats row */}
                <MasterStatsRow
                    stats={[
                        { label: 'Total Shifts', value: shifts.length, icon: 'ri-time-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
                        { label: 'Active', value: shifts.filter((s) => s.isActive).length, icon: 'ri-checkbox-circle-line', bg: 'bg-green-50', color: 'text-green-600' },
                        { label: 'Overnight', value: shifts.filter((s) => timeToMinutes(s.endTime) < timeToMinutes(s.startTime)).length, icon: 'ri-moon-line', bg: 'bg-indigo-50', color: 'text-indigo-600' },
                    ]}
                />

                {/* Table */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                {['Shift Name', 'Start Time', 'End Time', 'Break', 'Working Days', 'Duration', 'Status', ''].map((h) => (
                                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <i className="ri-loader-4-line text-4xl text-[#4f46e5] animate-spin block mb-2" />
                                        <p className="text-[#94a3b8] text-sm">Loading shifts...</p>
                                    </td>
                                </tr>
                            ) : filtered.map((s, idx) => {
                                const effMins = calcEffectiveMinutes(s.startTime, s.endTime, s.breakMinutes);
                                const isOvernight = timeToMinutes(s.endTime) < timeToMinutes(s.startTime);
                                return (
                                    <tr key={s.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 text-[#4f46e5]">
                                                    <i className="ri-time-line text-sm" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-[#1e293b] whitespace-nowrap">{s.name}</p>
                                                    {isOvernight && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-200">
                                                            <i className="ri-moon-line text-[10px]" /> Overnight
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#1e293b] whitespace-nowrap font-mono">{s.startTime}</td>
                                        <td className="px-4 py-3 text-sm text-[#1e293b] whitespace-nowrap font-mono">{s.endTime}</td>
                                        <td className="px-4 py-3 text-sm text-[#64748b] whitespace-nowrap">{s.breakMinutes} min</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {DAYS.map((day) => {
                                                    const active = s.workingDays.includes(day);
                                                    return (
                                                        <span
                                                            key={day}
                                                            className={`inline-flex items-center justify-center w-7 h-7 rounded text-[10px] font-semibold border transition-colors ${active
                                                                    ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                                                                    : 'bg-[#f1f5f9] text-[#94a3b8] border-[#e2e8f0]'
                                                                }`}
                                                            title={active ? `${day} — working` : `${day} — off`}
                                                        >
                                                            {day}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-semibold text-[#1e293b] whitespace-nowrap">
                                            {formatDuration(effMins)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <button onClick={() => handleToggleActive(s)} className="cursor-pointer" title="Click to toggle status">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${s.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${s.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                                                    {s.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(s)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer" title="Edit">
                                                    <i className="ri-edit-line text-sm" />
                                                </button>
                                                <button onClick={() => setDeleteConfirm(s)}
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
                                    <td colSpan={8} className="px-4 py-12 text-center">
                                        <i className="ri-time-line text-4xl text-[#e2e8f0] block mb-2" />
                                        <p className="text-[#94a3b8] text-sm">No shifts found</p>
                                        {(search || statusFilter !== 'ALL') && (
                                            <p className="text-xs text-[#94a3b8] mt-1">Try adjusting your filters</p>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ShiftSlideOver
                open={slideOver.open}
                editing={slideOver.editing}
                onClose={closeSlideOver}
                onSave={handleSave}
            />

            <ConfirmDialog
                open={!!deleteConfirm}
                title="Remove Shift"
                message={`Remove "${deleteConfirm?.name}"? This action cannot be undone.`}
                variant="danger"
                confirmLabel="Yes, Remove"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </AppLayout>
    );
}