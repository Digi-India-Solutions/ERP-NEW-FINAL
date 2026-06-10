import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { mockOperators, mockShifts, type MockOperator, type MockShift } from '@/mocks/masters';
import { useToast } from '@/contexts/ToastContext';
import { MasterFilters, MasterSummaryCards, MasterStatsRow } from '@/pages/masters/common/CommonComponets';

type Skill = 'WELDER' | 'MACHINIST' | 'ASSEMBLER' | 'QC_INSPECTOR' | 'SUPERVISOR';

interface OperatorForm {
    name: string;
    employeeCode: string;
    skill: Skill;
    shiftId: string;
    wageRatePerHour: string;
    phone: string;
    isActive: boolean;
}

const SKILL_OPTIONS: { value: Skill; label: string }[] = [
    { value: 'WELDER', label: 'Welder' },
    { value: 'MACHINIST', label: 'Machinist' },
    { value: 'ASSEMBLER', label: 'Assembler' },
    { value: 'QC_INSPECTOR', label: 'QC Inspector' },
    { value: 'SUPERVISOR', label: 'Supervisor' },
];

const SKILL_BADGE: Record<Skill, { label: string; cls: string }> = {
    WELDER: { label: 'Welder', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
    MACHINIST: { label: 'Machinist', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    ASSEMBLER: { label: 'Assembler', cls: 'bg-green-50 text-green-700 border-green-200' },
    QC_INSPECTOR: { label: 'QC Inspector', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    SUPERVISOR: { label: 'Supervisor', cls: 'bg-red-50 text-red-700 border-red-200' },
};

const emptyForm: OperatorForm = {
    name: '', employeeCode: '', skill: 'MACHINIST', shiftId: '', wageRatePerHour: '', phone: '', isActive: true,
};

function getShiftLabel(shiftId: string): string {
    const sh = mockShifts.find((s) => s.id === shiftId);
    if (!sh) return shiftId;
    return `${sh.name} (${sh.startTime}-${sh.endTime})`;
}

// ─── Slide-Over Form ──────────────────────────────────────────────────────────
interface SlideOverProps {
    open: boolean;
    editing: MockOperator | null;
    allOperators: MockOperator[];
    onClose: () => void;
    onSave: (form: OperatorForm) => void;
}

function OperatorSlideOver({ open, editing, allOperators, onClose, onSave }: SlideOverProps) {
    const [form, setForm] = useState<OperatorForm>({ ...emptyForm });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSaving, setIsSaving] = useState(false);
    const firstInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) return;
        if (editing) {
            setForm({
                name: editing?.name || '',
                employeeCode: editing?.employeeCode || '',
                skill: editing?.skill || 'MACHINIST',
                shiftId: editing?.shiftId || '',
                wageRatePerHour: editing?.wageRatePerHour?.toString() || '',
                phone: editing?.phone ?? '',
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

    const update = (field: keyof OperatorForm, value: string | boolean) => {
        setForm((p) => ({ ...p, [field]: value }));
        if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!form.name.trim()) e.name = 'Full name is required';
        if (!form.employeeCode.trim()) e.employeeCode = 'Employee code is required';
        else {
            const dup = allOperators.find(
                (op) => op.employeeCode.toLowerCase() === form.employeeCode.trim().toLowerCase() && op.id !== editing?.id,
            );
            if (dup) e.employeeCode = `Code "${form.employeeCode}" already used by ${dup.name}`;
        }
        if (!form.skill) e.skill = 'Primary skill is required';
        if (!form.shiftId) e.shiftId = 'Assigned shift is required';
        if (!form.wageRatePerHour.trim() || Number(form.wageRatePerHour) <= 0) e.wageRatePerHour = 'Wage rate is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        setIsSaving(true);
        setTimeout(() => { onSave(form); setIsSaving(false); }, 300);
    };

    const activeShifts = mockShifts.filter((s) => s.isActive);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[600] flex justify-end">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white w-full max-w-lg flex flex-col h-full shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                    <div>
                        <h3 className="text-base font-semibold text-[#1e293b]">{editing ? 'Edit Operator' : 'Add Operator'}</h3>
                        <p className="text-xs text-[#64748b] mt-0.5">{editing ? 'Update operator details' : 'Register a new operator'}</p>
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
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            ref={firstInputRef}
                            type="text" value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                            placeholder="e.g. Ramesh Yadav"
                            className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    {/* Employee Code */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Employee Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text" value={form.employeeCode}
                            onChange={(e) => update('employeeCode', e.target.value)}
                            placeholder="e.g. EMP-101"
                            className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.employeeCode ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        />
                        {errors.employeeCode && <p className="text-xs text-red-500">{errors.employeeCode}</p>}
                    </div>

                    {/* Primary Skill */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Primary Skill <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SKILL_OPTIONS.map((s) => {
                                const badge = SKILL_BADGE[s.value as Skill];
                                const isSelected = form.skill === s.value;
                                return (
                                    <button
                                        key={s.value}
                                        type="button"
                                        onClick={() => update('skill', s.value)}
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
                        {errors.skill && <p className="text-xs text-red-500">{errors.skill}</p>}
                    </div>

                    {/* Assigned Shift */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Assigned Shift <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.shiftId}
                            onChange={(e) => update('shiftId', e.target.value)}
                            className={`w-full h-10 px-3 rounded-lg border text-sm bg-white focus:outline-none focus:ring-2 transition-colors cursor-pointer ${errors.shiftId ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        >
                            <option value="">— Select Shift —</option>
                            {activeShifts.map((s) => (
                                <option key={s.id} value={s.id}>{getShiftLabel(s.id)}</option>
                            ))}
                        </select>
                        {errors.shiftId && <p className="text-xs text-red-500">{errors.shiftId}</p>}
                    </div>

                    {/* Wage Rate */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Wage Rate per Hour (₹) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number" min="0"
                            value={form.wageRatePerHour}
                            onChange={(e) => update('wageRatePerHour', e.target.value)}
                            placeholder="e.g. 180"
                            className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.wageRatePerHour ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
                        />
                        {errors.wageRatePerHour && <p className="text-xs text-red-500">{errors.wageRatePerHour}</p>}
                    </div>

                    {/* Phone */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Phone</label>
                        <input
                            type="text" value={form.phone}
                            onChange={(e) => update('phone', e.target.value)}
                            placeholder="Mobile number"
                            className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
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
                            {form.isActive ? 'Active — operator is available' : 'Inactive — operator is disabled'}
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
export default function OperatorsPage() {
    const navigate = useNavigate();
    const toast = useToast();
    const [operators, setOperators] = useState<MockOperator[]>([...mockOperators]);
    const [search, setSearch] = useState('');
    const [skillFilter, setSkillFilter] = useState<Skill | 'ALL'>('ALL');
    const [shiftFilter, setShiftFilter] = useState<string>('ALL');
    const [slideOver, setSlideOver] = useState<{ open: boolean; editing: MockOperator | null }>({ open: false, editing: null });
    const [deleteConfirm, setDeleteConfirm] = useState<MockOperator | null>(null);

    const filtered = operators.filter((op) => {
        const q = search.toLowerCase();
        const matchSearch = !q || op.name.toLowerCase().includes(q) || op.employeeCode.toLowerCase().includes(q);
        const matchSkill = skillFilter === 'ALL' || op.skill === skillFilter;
        const matchShift = shiftFilter === 'ALL' || op.shiftId === shiftFilter;
        return matchSearch && matchSkill && matchShift;
    });

    const openAdd = () => setSlideOver({ open: true, editing: null });
    const openEdit = (op: MockOperator) => setSlideOver({ open: true, editing: op });
    const closeSlideOver = () => setSlideOver({ open: false, editing: null });

    const handleSave = (form: OperatorForm) => {
        if (slideOver.editing) {
            setOperators((prev) =>
                prev.map((op) =>
                    op.id === slideOver.editing!.id
                        ? {
                            ...op,
                            name: form.name,
                            employeeCode: form.employeeCode,
                            skill: form.skill,
                            shiftId: form.shiftId,
                            wageRatePerHour: Number(form.wageRatePerHour),
                            phone: form.phone || null,
                            isActive: form.isActive,
                        }
                        : op,
                ),
            );
            toast.success('Operator updated successfully');
        } else {
            const newOp: MockOperator = {
                id: `op-${Date.now()}`,
                name: form.name,
                employeeCode: form.employeeCode,
                skill: form.skill,
                shiftId: form.shiftId,
                wageRatePerHour: Number(form.wageRatePerHour),
                phone: form.phone || null,
                isActive: form.isActive,
            };
            setOperators((prev) => [...prev, newOp]);
            toast.success('Operator created successfully');
        }
        closeSlideOver();
    };

    const handleToggleActive = (op: MockOperator) => {
        setOperators((prev) => prev.map((x) => x.id === op.id ? { ...x, isActive: !x.isActive } : x));
        toast.success(`${op.name} ${op.isActive ? 'deactivated' : 'activated'}`);
    };

    const confirmDelete = () => {
        if (!deleteConfirm) return;
        setOperators((prev) => prev.filter((op) => op.id !== deleteConfirm.id));
        toast.success(`"${deleteConfirm.name}" removed`);
        setDeleteConfirm(null);
    };

    // Skill counts
    const skillCounts = SKILL_OPTIONS.map((s) => ({
        ...s,
        count: operators.filter((op) => op.skill === s.value).length,
        badge: SKILL_BADGE[s.value as Skill],
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
                            <h2 className="text-xl font-bold text-[#1e293b]">Operators</h2>
                            <p className="text-sm text-[#64748b] mt-0.5">Manage operators, skills, wages and shift assignments</p>
                        </div>
                    </div>
                    <button onClick={openAdd}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
                        <i className="ri-add-line" /> Add Operator
                    </button>
                </div>

                {/* Filters */}
                <MasterFilters
                    search={search}
                    onSearchChange={setSearch}
                    searchPlaceholder="Search name or employee code..."
                    searchWidthClass="w-64"
                    filters={[
                        {
                            value: skillFilter,
                            onChange: (val) => setSkillFilter(val),
                            options: [
                                { value: 'ALL', label: 'All Skills' },
                                ...SKILL_OPTIONS,
                            ],
                        },
                        {
                            value: shiftFilter,
                            onChange: (val) => setShiftFilter(val),
                            options: [
                                { value: 'ALL', label: 'All Shifts' },
                                ...mockShifts.filter((s) => s.isActive).map((s) => ({ value: s.id, label: getShiftLabel(s.id) })),
                            ],
                        },
                    ]}
                    hasActiveFilters={!!(search || skillFilter !== 'ALL' || shiftFilter !== 'ALL')}
                    onClearFilters={() => {
                        setSearch('');
                        setSkillFilter('ALL');
                        setShiftFilter('ALL');
                    }}
                />

                {/* Summary cards */}
                <MasterSummaryCards
                    items={skillCounts.map((s) => ({
                        value: s.value,
                        count: s.count,
                        label: s.badge.label,
                        badgeClass: s.badge.cls,
                    }))}
                    activeFilterValue={skillFilter}
                    onFilterChange={(val) => setSkillFilter(val)}
                />

                {/* Stats row */}
                <MasterStatsRow
                    stats={[
                        { label: 'Total Operators', value: operators.length, icon: 'ri-user-settings-line', bg: 'bg-indigo-50', color: 'text-[#4f46e5]' },
                        { label: 'Active', value: operators.filter((op) => op.isActive).length, icon: 'ri-checkbox-circle-line', bg: 'bg-green-50', color: 'text-green-600' },
                        { label: 'Avg Wage/hr', value: `₹${Math.round(operators.reduce((a, op) => a + op.wageRatePerHour, 0) / (operators.length || 1))}`, icon: 'ri-money-rupee-circle-line', bg: 'bg-amber-50', color: 'text-amber-600' },
                    ]}
                />

                {/* Table */}
                <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-260px)]">
                        <table className="w-full min-w-[800px] text-sm border-collapse">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                    {['Employee Code', 'Name', 'Skill', 'Shift', 'Wage Rate/hr', 'Status', ''].map((h) => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((op, idx) => {
                                    const badge = SKILL_BADGE[op.skill];
                                    return (
                                        <tr key={op.id} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#4f46e5] bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                    <i className="ri-barcode-line text-[10px]" />
                                                    {op.employeeCode}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-indigo-50 text-[#4f46e5] text-xs font-bold border border-indigo-100">
                                                        {op.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-[#1e293b] whitespace-nowrap">{op.name}</p>
                                                        {op.phone && <p className="text-xs text-[#94a3b8]">{op.phone}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                                                    {badge.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[#1e293b] whitespace-nowrap">
                                                {getShiftLabel(op.shiftId)}
                                            </td>
                                            <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">
                                                ₹{op.wageRatePerHour}<span className="text-xs font-normal text-[#94a3b8]">/hr</span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button onClick={() => handleToggleActive(op)} className="cursor-pointer" title="Click to toggle status">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${op.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${op.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
                                                        {op.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => openEdit(op)}
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer" title="Edit">
                                                        <i className="ri-edit-line text-sm" />
                                                    </button>
                                                    <button onClick={() => setDeleteConfirm(op)}
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
                                        <td colSpan={7} className="px-4 py-12 text-center">
                                            <i className="ri-user-settings-line text-4xl text-[#e2e8f0] block mb-2" />
                                            <p className="text-[#94a3b8] text-sm">No operators found</p>
                                            {(search || skillFilter !== 'ALL' || shiftFilter !== 'ALL') && (
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

            <OperatorSlideOver
                open={slideOver.open}
                editing={slideOver.editing}
                allOperators={operators}
                onClose={closeSlideOver}
                onSave={handleSave}
            />

            <ConfirmDialog
                open={!!deleteConfirm}
                title="Remove Operator"
                message={`Remove "${deleteConfirm?.name}" (${deleteConfirm?.employeeCode})? This action cannot be undone.`}
                variant="danger"
                confirmLabel="Yes, Remove"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm(null)}
            />
        </AppLayout>
    );
}