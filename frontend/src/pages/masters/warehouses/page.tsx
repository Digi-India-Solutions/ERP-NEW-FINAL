
import { useRef, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useToast } from '@/contexts/ToastContext';

import { formatINR } from '@/utils/format';
import type { WarehouseType } from '@/types/shared';
import { useAuth } from '@/contexts/AuthContext.js';
import { MODULES } from '@/utils/permissions.js';
import {
  createWarehouse,
  getAllWarehouses,
  getAssignedWarehouses,
  updateWarehouse,
  deleteWarehouse,
  searchWarehouses,
  type WarehouseResponse,
  type WarehousePayload,
  getWarehousesForUser
} from '@/api/warehouse.api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  address: string;
  inchargeName: string;
  inchargePhone: string;
  inchargeUserId?: string;
  isActive: boolean;
  itemCount: number;
  totalValue: number;
}

interface WhForm {
  name: string;
  type: WarehouseType;
  address: string;
  inchargeUserId: string;
  inchargeName: string;
  inchargePhone: string;
  isActive: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapApiToWarehouse(w: WarehouseResponse): Warehouse {
  return {
    id: w.id,
    name: w.name,
    type: (w.type || '').toUpperCase() as WarehouseType, 
    address: w.address,
    inchargeName: w.incharge_name ?? '',
    inchargePhone: w.incharge_phone ?? '',
    inchargeUserId: w.incharge_user_id ?? '',
    isActive: w.is_active,
    itemCount: (w as any).item_count ?? 0,
    totalValue: (w as any).total_value ?? 0,
  };
}

function mapFormToPayload(form: WhForm): WarehousePayload {
  return {
    name: form.name,
    type: form.type,
    address: form.address,
    inchargeName: form.inchargeName || undefined,
    inchargePhone: form.inchargePhone || undefined,
    inchargeUserId: form.inchargeUserId || undefined,
    isActive: form.isActive,
  };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const emptyForm: WhForm = {
  name: '',
  type: 'GODOWN',
  address: '',
  inchargeUserId: '',
  inchargeName: '',
  inchargePhone: '',
  isActive: true, // ✅ default to active (was false — bad UX)
};

const WAREHOUSE_TYPES: { value: WarehouseType; label: string }[] = [
  { value: 'OFFICE', label: 'Office' },
  { value: 'FACTORY', label: 'Factory' },
  { value: 'STORE', label: 'Store' },
  { value: 'GODOWN', label: 'Godown' },
  { value: 'BRANCH', label: 'Branch' },
  { value: 'TRANSIT', label: 'Transit' },
];

const TYPE_BADGE: Record<WarehouseType, { label: string; cls: string; icon: string }> = {
  OFFICE: { label: 'Office', cls: 'bg-sky-50 text-sky-700 border-sky-200', icon: 'ri-building-line' },
  FACTORY: { label: 'Factory', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: 'ri-building-4-line' },
  STORE: { label: 'Store', cls: 'bg-green-50 text-green-700 border-green-200', icon: 'ri-store-2-line' },
  GODOWN: { label: 'Godown', cls: 'bg-violet-50 text-violet-700 border-violet-200', icon: 'ri-store-3-line' },
  BRANCH: { label: 'Branch', cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: 'ri-map-pin-line' },
  TRANSIT: { label: 'Transit', cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'ri-truck-line' },
};

// ─── InchargeFields ───────────────────────────────────────────────────────────

interface InchargeFieldsProps {
  name: string;
  phone: string;
  onChange: (name: string, phone: string) => void;
}

interface InchargeFieldsProps {
  name: string;
  phone: string;
  onChange: (name: string, phone: string) => void;
  errors?: { name?: string; phone?: string };
}

function InchargeFields({ name, phone, onChange, errors = {} }: InchargeFieldsProps) {

  const handlePhoneChange = (value: string) => {
    // ✅ Only allow digits, max 10
    const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
    onChange(name, digitsOnly);
  };

  const phoneError = errors.phone
    ?? (phone.length > 0 && phone.length < 10 ? 'Phone number must be exactly 10 digits' : '');

  return (
    <div className="grid grid-cols-2 gap-3">

      {/* In-charge Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
          In-charge Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChange(e.target.value, phone)}
          placeholder="e.g. Rahul Sharma"
          className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white
                      focus:outline-none focus:ring-2 transition-colors
                      ${errors.name
              ? 'border-red-400 focus:ring-red-200'
              : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
            }`}
        />
        {errors.name && (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <i className="ri-error-warning-line" /> {errors.name}
          </p>
        )}
      </div>

      {/* In-charge Phone */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
          In-charge Phone
        </label>
        <div className="relative">
          <input
            type="text"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="e.g. 9876543210"
            maxLength={10}
            inputMode="numeric" // ✅ shows numeric keyboard on mobile
            className={`w-full h-10 px-3 pr-14 rounded-lg border text-sm text-[#1e293b] bg-white
                        focus:outline-none focus:ring-2 transition-colors
                        ${phoneError
                ? 'border-red-400 focus:ring-red-200'
                : phone.length === 10
                  ? 'border-green-400 focus:ring-green-200'  // ✅ green when complete
                  : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
              }`}
          />
          {/* ✅ digit counter */}
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium
                            ${phone.length === 10
              ? 'text-green-500'
              : phone.length > 0
                ? 'text-amber-500'
                : 'text-[#94a3b8]'
            }`}>
            {phone.length}/10
          </span>
        </div>

        {/* ✅ Error or success message */}
        {phoneError ? (
          <p className="text-xs text-red-500 flex items-center gap-1">
            <i className="ri-error-warning-line" /> {phoneError}
          </p>
        ) : phone.length === 10 ? (
          <p className="text-xs text-green-500 flex items-center gap-1">
            <i className="ri-checkbox-circle-line" /> Valid phone number
          </p>
        ) : null}
      </div>

    </div>
  );
}

// ─── WarehouseModal ───────────────────────────────────────────────────────────

interface WarehouseModalProps {
  open: boolean;
  editing: Warehouse | null;
  onClose: () => void;
  onSave: (form: WhForm) => Promise<void>;
  form: WhForm;
  setForm: React.Dispatch<React.SetStateAction<WhForm>>;
  handleNameChange: (value: string) => void;
  handleSelect: (w: any) => void;
  suggestions: any[];
  isSuggestionsLoading: boolean; // ✅ NEW — show spinner while fetching
}

function WarehouseModal({
  open, editing, onClose, form, setForm,
  onSave, handleNameChange, handleSelect,
  suggestions, isSuggestionsLoading,
}: WarehouseModalProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const { focusFirst } = useKeyboardNav(formRef as React.RefObject<HTMLElement>);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ── Reset form when modal opens/closes ──────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        name: editing.name,
        type: editing.type,
        address: editing.address,
        inchargeUserId: editing.inchargeUserId ?? '',
        inchargeName: editing.inchargeName,
        inchargePhone: editing.inchargePhone,
        isActive: editing.isActive,
      });
    } else {
      setForm({ ...emptyForm });
    }
    setErrors({});
    setTimeout(() => focusFirst(), 60);
  }, [open, editing]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'F9' || (e.ctrlKey && e.key === 's')) {
        e.preventDefault();
        void handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, form]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = (field: keyof WhForm, value: string | boolean) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Warehouse name is required';
    if (!form.address.trim()) e.address = 'Address is required';
    if (form.inchargePhone.trim() && !/^\d{10}$/.test(form.inchargePhone.trim())) {
      e.phone = 'Phone number must be exactly 10 digits';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave(form);
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={formRef} className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">
              {editing ? 'Edit Warehouse' : 'Add Warehouse'}
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {editing ? 'Update warehouse details' : 'Create a new storage location'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* ── Warehouse Name + Autocomplete ─────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Warehouse Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Main Warehouse"
                autoComplete="off"
                data-nav-index={0}
                className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white
                            focus:outline-none focus:ring-2 transition-colors
                            ${errors.name
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                  }`}
              />

              {/* ✅ Loading spinner inside input */}
              {isSuggestionsLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <i className="ri-loader-4-line animate-spin text-[#94a3b8] text-sm" />
                </div>
              )}

              {/* ✅ Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-50 bg-white border border-[#e2e8f0]
                                rounded-lg w-full mt-1 shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => handleSelect(w)}
                      className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer text-sm
                                 text-[#1e293b] flex items-center gap-2 border-b border-[#f1f5f9] last:border-0"
                    >
                      <i className="ri-store-3-line text-[#94a3b8] text-xs" />
                      <span>{w?.name}</span>
                      {w?.type && (
                        <span className="ml-auto text-[10px] text-[#94a3b8] font-medium uppercase">
                          {w.type}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* ── Warehouse Type ─────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Type <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {WAREHOUSE_TYPES.map((t) => {
                const badge = TYPE_BADGE[t.value];
                const isSelected = form.type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => update('type', t.value)}
                    className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-semibold
                                transition-all cursor-pointer whitespace-nowrap
                                ${isSelected
                        ? `${badge.cls} border-current ring-2 ring-current/20`
                        : 'border-[#e2e8f0] text-[#64748b] hover:border-[#4f46e5]/40 hover:text-[#4f46e5]'
                      }`}
                  >
                    <i className={`${badge.icon} text-xs`} />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Address ───────────────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="204, Tech Park, Pune..."
              data-nav-index={1}
              className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white
                          focus:outline-none focus:ring-2 transition-colors
                          ${errors.address
                  ? 'border-red-400 focus:ring-red-200'
                  : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                }`}
            />
            {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
          </div>

          {/* ── In-charge Person ──────────────────────────────────────────── */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              In-charge Person
            </label>
            <InchargeFields
              name={form.inchargeName || ''}
              phone={form.inchargePhone || ''}
              errors={{ phone: errors.phone }}
              onChange={(name, phone) =>
                setForm((prev) => ({ ...prev, inchargeName: name, inchargePhone: phone }))
              }
            />
          </div>

          {/* ── Active toggle ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => update('isActive', !form.isActive)}
              data-nav-index={3}
              className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#4f46e5]/40
                ${form.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                  transition-transform duration-300 flex items-center justify-center
                  ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`}
              >
                {/* ✅ icon inside the knob */}
                <i className={`text-[8px] transition-all duration-300
                     ${form.isActive ? 'ri-check-line text-[#4f46e5]' : 'ri-close-line text-[#94a3b8]'}`}
                />
              </span>
            </button>

            {/* ✅ colored status badge instead of plain text */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all
                   ${form.isActive
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${form.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
              {form.isActive ? 'Active — warehouse is operational' : 'Inactive — warehouse is disabled'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0]">
          <p className="text-[11px] text-[#94a3b8]">
            <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">F9</kbd> to save &nbsp;
            <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">Esc</kbd> to cancel
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium
                         text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={isSaving}
              data-nav-index={4}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white
                         text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60
                         transition-colors cursor-pointer whitespace-nowrap"
            >
              {isSaving
                ? <><i className="ri-loader-4-line animate-spin" /> Saving...</>
                : <><i className="ri-save-line" /> {editing ? 'Update' : 'Create Warehouse'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WarehousesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const {hasPermission} = useAuth();
  const canCreateWarehouse = hasPermission(MODULES.WAREHOUSES, 'create');
  const canEditWarehouse = hasPermission(MODULES.WAREHOUSES, 'edit');
  const canDeleteWarehouse = hasPermission(MODULES.WAREHOUSES, 'delete');
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<WarehouseType | 'ALL'>('ALL');
  const [modal, setModal] = useState<{ open: boolean; editing: Warehouse | null }>({
    open: false, editing: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<Warehouse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false); // ✅ NEW

  const {hasControl } = useAuth();
  const canViewAll = hasControl("viewAllWarehouses");

  // ✅ form lifted here so it persists across renders — fixed type to WhForm
  const [form, setForm] = useState<WhForm>({ ...emptyForm });

  // ── Debounce ref for name autocomplete ────────────────────────────────────
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch all warehouses ──────────────────────────────────────────────────
  const fetchWarehouses = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getWarehousesForUser(canViewAll);
      if (res.success && res.data) {
        setWarehouses(res.data.map(mapApiToWarehouse));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load warehouses');
    } finally {
      setIsLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void fetchWarehouses(); }, [fetchWarehouses]);

  // ── Global search (debounced) ─────────────────────────────────────────────
  useEffect(() => {
    if (search.length === 0) { void fetchWarehouses(); return; }
    if (search.length < 2) return;

    const timer = setTimeout(async () => {
      try {
        const res = await searchWarehouses(search);
        if (res.success && res.data) {
          setWarehouses(res.data.map(mapApiToWarehouse));
        }
      } catch { /* silent — keep showing existing list */ }
    }, 400);

    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Name autocomplete — FIXED: uses getData + debounce + loading state ────
  const handleNameChange = useCallback((value: string) => {
    setForm((prev) => ({ ...prev, name: value }));
    setSuggestions([]);

    if (!value.trim()) return;

    // clear previous timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsSuggestionsLoading(true);
      try {
        // ✅ GET request with params — not postData
      const res = await searchWarehouses(value.trim());
        if (res?.success === true) {
          setSuggestions(res?.data ?? []);
        }
      } catch (err) {
        console.error('Warehouse search failed:', err);
        setSuggestions([]);
      } finally {
        setIsSuggestionsLoading(false);
      }
    }, 400); // ✅ 400ms debounce — API fires only after user stops typing
  }, []);

  // ── Handle suggestion select ──────────────────────────────────────────────
  const handleSelect = useCallback((w: any) => {
    // cancel pending debounce so it doesn't overwrite the selection
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    setForm((prev) => ({
      ...prev,
      name: w.name ?? prev.name,
      inchargeName: w.incharge_name ?? '',
      address: w.address ?? '',
      inchargePhone: w.incharge_phone ?? '',
    }));
    setSuggestions([]);
  }, []);

  // ── Client-side type filter ───────────────────────────────────────────────
  const filtered = warehouses.filter((w) =>
    typeFilter === 'ALL' || w.type === typeFilter
  );

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openAdd = () => { setForm({ ...emptyForm }); setModal({ open: true, editing: null }); };
  const openEdit = (wh: Warehouse) => setModal({ open: true, editing: wh });
  const closeModal = () => {
    setModal({ open: false, editing: null });
    setSuggestions([]); // ✅ clear suggestions on close
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async (form: WhForm) => {
    const payload = mapFormToPayload(form);
    try {
      if (modal.editing) {
        const res = await updateWarehouse(modal.editing.id, payload);
        if (res.success && res.data) {
          setWarehouses((prev) =>
            prev.map((w) => w.id === modal.editing!.id ? mapApiToWarehouse(res.data!) : w)
          );
          toast.success('Warehouse updated successfully');
        }
      } else {
        const res = await createWarehouse(payload);
        if (res.success && res.data) {
          setWarehouses((prev) => [mapApiToWarehouse(res.data!), ...prev]);
          toast.success('Warehouse created successfully');
        }
      }
      closeModal();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save warehouse');
      throw err; // keep modal open
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const handleToggleActive = async (wh: Warehouse) => {
    // Optimistic update
    setWarehouses((prev) => prev.map((w) => w.id === wh.id ? { ...w, isActive: !w.isActive } : w));
    try {
      await updateWarehouse(wh.id, { isActive: !wh.isActive });
      toast.success(`${wh.name} ${wh.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      // Roll back
      setWarehouses((prev) => prev.map((w) => w.id === wh.id ? { ...w, isActive: wh.isActive } : w));
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteWarehouse(deleteConfirm.id);
      setWarehouses((prev) => prev.filter((w) => w.id !== deleteConfirm.id));
      toast.success(`"${deleteConfirm.name}" removed`);
      setDeleteConfirm(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete warehouse');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Summary counts ────────────────────────────────────────────────────────
  const typeCounts = WAREHOUSE_TYPES.map((t) => ({
    ...t,
    count: warehouses.filter((w) => w.type === t.value).length,
    badge: TYPE_BADGE[t.value],
  }));

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 space-y-5 w-full">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">Warehouses</h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                Manage storage locations and in-charge staff
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search warehouses..."
                className="h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white
                           focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-52"
              />
            </div>
            {canCreateWarehouse && (<button
              onClick={openAdd}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white
                         text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" /> Add Warehouse
            </button>)}
          </div>
        </div>

        {/* Type summary cards */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
          {typeCounts.map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(typeFilter === t.value ? 'ALL' : t.value)}
              className={`bg-white border rounded-xl p-3 flex flex-col items-center gap-1.5 cursor-pointer transition-all
                          ${typeFilter === t.value
                  ? `${t.badge.cls} border-current ring-2 ring-current/20`
                  : 'border-[#e2e8f0] hover:border-[#4f46e5]/30'
                }`}
            >
              <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${typeFilter === t.value ? 'bg-white/60' : 'bg-[#f8fafc]'}`}>
                <i className={`${t.badge.icon} text-base ${typeFilter === t.value ? '' : 'text-[#64748b]'}`} />
              </div>
              <p className="text-xl font-bold text-[#1e293b]">{t.count}</p>
              <p className="text-[11px] text-[#64748b] font-medium">{t.badge.label}</p>
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
  {[
    {
      label: 'Total Warehouses',
      value: warehouses.length,
      icon: 'ri-store-3-line',
      bg: 'bg-indigo-50',
      color: 'text-[#4f46e5]',
    },
    {
      label: 'Active',
      value: warehouses.filter((w) => w.isActive).length,
      icon: 'ri-checkbox-circle-line',
      bg: 'bg-green-50',
      color: 'text-green-600',
    },
    {
      label: 'Total Items',
      value: warehouses.reduce(
        (a, w) => a + (Number(w.itemCount) || 0),
        0
      ),
      icon: 'ri-box-3-line',
      bg: 'bg-amber-50',
      color: 'text-amber-600',
    },
  ].map((c) => (
    <div
      key={c.label}
      className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3"
    >
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.bg}`}
      >
        <i className={`${c.icon} ${c.color} text-lg`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1e293b]">
          {c.value}
        </p>
        <p className="text-xs text-[#64748b]">
          {c.label}
        </p>
      </div>
    </div>
  ))}
</div>

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="w-full overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {['Warehouse Name', 'Type', 'Address', 'In-charge', 'Items', 'Stock Value', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Loading skeleton */}
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[#f1f5f9]">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

              {/* Data rows */}
              {!isLoading && filtered.map((wh, idx) => {
                const badge = TYPE_BADGE[wh.type];
                return (
                  <tr
                    key={wh.id}
                    className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${badge.cls} border`}>
                          <i className={`${badge.icon} text-sm`} />
                        </div>
                        <span className="font-medium text-[#1e293b] whitespace-nowrap">{wh.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <p className="truncate text-xs text-[#64748b]">{wh.address}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {wh.inchargeName ? (
                        <>
                          <p className="text-[#1e293b] text-xs font-medium">{wh.inchargeName}</p>
                          <p className="text-[#94a3b8] text-xs">{wh.inchargePhone}</p>
                        </>
                      ) : (
                        <span className="text-xs text-[#94a3b8] italic">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">{wh.itemCount}</td>
                    <td className="px-4 py-3 text-[#1e293b] whitespace-nowrap">{formatINR(wh.totalValue)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
  {canEditWarehouse ? (
    <button
      onClick={() => void handleToggleActive(wh)}
      className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#4f46e5]/40
        ${wh.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
      title={wh.isActive ? 'Click to deactivate' : 'Click to activate'}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
          transition-transform duration-300 flex items-center justify-center
          ${wh.isActive ? 'translate-x-5' : 'translate-x-0'}`}
      >
        <i
          className={`text-[8px] transition-all duration-300
            ${wh.isActive ? 'ri-check-line text-[#4f46e5]' : 'ri-close-line text-[#94a3b8]'}`}
        />
      </span>
    </button>
  ) : (
    // read-only badge when no permission
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
        ${wh.isActive
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-slate-100 text-slate-500 border-slate-200'
        }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${wh.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
      {wh.isActive ? 'Active' : 'Inactive'}
    </span>
  )}
</td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {canEditWarehouse && (<button
                          onClick={() => openEdit(wh)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <i className="ri-edit-line text-sm" />
                        </button>)}
                        {canDeleteWarehouse && (<button
                          onClick={() => setDeleteConfirm(wh)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>)}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <i className="ri-store-3-line text-4xl text-[#e2e8f0] block mb-2" />
                    <p className="text-[#94a3b8] text-sm">No warehouses found</p>
                    {search && <p className="text-xs text-[#94a3b8] mt-1">Try a different search term</p>}
                  </td>
                </tr>
              )}
            </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <WarehouseModal
        open={modal.open}
        editing={modal.editing}
        onClose={closeModal}
        onSave={handleSave}
        form={form}
        setForm={setForm}
        handleNameChange={handleNameChange}
        handleSelect={handleSelect}
        suggestions={suggestions}
        isSuggestionsLoading={isSuggestionsLoading}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Remove Warehouse"
        message={`Remove "${deleteConfirm?.name}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel={isDeleting ? 'Removing...' : 'Yes, Remove (Y)'}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}