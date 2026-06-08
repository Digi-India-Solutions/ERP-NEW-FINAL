import { useAuth } from '@/contexts/AuthContext';
import { getWarehousesForUser, type WarehouseResponse } from '@/api/warehouse.api';
import type { WarehouseType } from '@/types/shared';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PartyFormData {
  name: string;
  type: 'customer' | 'supplier' | 'both';
  gstin: string;
  pan: string;
  phone: string;
  email: string;
  city: string;
  billingAddress: string;
  shippingAddress: string;
  stateCode: string;
  stateName: string;
  warehouseId: string;
  warehouseName: string;
  creditLimit: number;
  creditDays: number;
  openingBalance: number;
  isActive: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PAN_REGEX   = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

export const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '25', name: 'Daman & Diu' },
  { code: '26', name: 'Dadra & Nagar Haveli' },
  { code: '27', name: 'Maharashtra' },
  { code: '28', name: 'Andhra Pradesh (Old)' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

const STATE_CODE_MAP: Record<string, string> = Object.fromEntries(
  INDIAN_STATES.map((s) => [s.code, s.name]),
);

const TYPE_BADGE: Record<WarehouseType, { label: string; cls: string; icon: string }> = {
  OFFICE:  { label: 'Office',  cls: 'bg-sky-100    text-sky-700',    icon: 'ri-building-line'   },
  FACTORY: { label: 'Factory', cls: 'bg-amber-100  text-amber-700',  icon: 'ri-building-4-line' },
  STORE:   { label: 'Store',   cls: 'bg-green-100  text-green-700',  icon: 'ri-store-2-line'    },
  GODOWN:  { label: 'Godown',  cls: 'bg-violet-100 text-violet-700', icon: 'ri-store-3-line'    },
  BRANCH:  { label: 'Branch',  cls: 'bg-indigo-100 text-indigo-700', icon: 'ri-map-pin-line'    },
  TRANSIT: { label: 'Transit', cls: 'bg-slate-100  text-slate-600',  icon: 'ri-truck-line'      },
};

const defaultForm: PartyFormData = {
  name: '', type: 'customer', gstin: '', pan: '', phone: '', email: '',
  city: '', billingAddress: '', shippingAddress: '', stateCode: '', stateName: '',
  warehouseId: '', warehouseName: '',
  creditLimit: 0, creditDays: 30, openingBalance: 0, isActive: true,
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface PartyFormProps {
  open: boolean;
  initialData?: Partial<PartyFormData>;
  isEditing: boolean;
  onClose: () => void;
  onSave: (data: PartyFormData) => Promise<void>;
}

// ─── StateDropdown ────────────────────────────────────────────────────────────

interface StateDropdownProps {
  stateCode: string;
  stateName: string;
  onChange: (code: string, name: string) => void;
  navIndex?: number;
}

function StateDropdown({ stateCode, stateName, onChange, navIndex }: StateDropdownProps) {
  const [query, setQuery] = useState(stateName);
  const [open, setOpen]   = useState(false);
  const containerRef      = useRef<HTMLDivElement>(null);

  // Keep query in sync when stateName changes externally (e.g. GSTIN auto-fill)
  useEffect(() => { setQuery(stateName); }, [stateName]);

  const filtered = useMemo(
    () =>
      INDIAN_STATES.filter(
        (s) =>
          s.name.toLowerCase().includes(query.toLowerCase()) ||
          s.code.includes(query),
      ),
    [query],
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery(stateName); // revert on outside click
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [stateName]);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search state..."
        data-nav-index={navIndex}
        className="w-full h-10 px-3 pr-8 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
      />
      {stateCode && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#4f46e5] bg-indigo-50 px-1.5 py-0.5 rounded">
          {stateCode}
        </span>
      )}
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((s) => (
            <div
              key={s.code}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s.code, s.name);
                setQuery(s.name);
                setOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-[#f8fafc] cursor-pointer text-sm"
            >
              <span className="text-[10px] font-mono font-bold text-[#94a3b8] w-6">{s.code}</span>
              <span className="text-[#1e293b]">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PartyForm ────────────────────────────────────────────────────────────────
// FIX: removed console.log('PartyFormmmmm', PartyForm) that was above the
// function definition — PartyForm didn't exist at that point (would throw ReferenceError).

export default function PartyForm({
  open, initialData, isEditing, onClose, onSave,
}: PartyFormProps) {
  const formRef     = useRef<HTMLDivElement>(null);
  const whDropdownRef = useRef<HTMLDivElement>(null);

  const { selectedWarehouseId, selectedWarehouseName, setSelectedWarehouse } = useWarehouseStore();
  const { user: authUser, hasControl } = useAuth();

  const canViewAll   = hasControl('viewAllWarehouses');
  const isSuperAdmin = authUser?.role === 'SUPER_ADMIN';

  // ── State ──────────────────────────────────────────────────────────────────
  const [form, setForm]                   = useState<PartyFormData>(() => ({
    ...defaultForm,
    ...initialData,
    // FIX: safe optional chaining; edit uses item's own warehouse, add uses store
    warehouseId:   isEditing ? (initialData?.warehouseId   ?? '') : (selectedWarehouseId   ?? ''),
    warehouseName: isEditing ? (initialData?.warehouseName ?? '') : (selectedWarehouseName ?? ''),
  }));
  const [gstRegistered, setGstRegistered] = useState(!!initialData?.gstin);
  const [errors, setErrors]               = useState<Record<string, string>>({});
  const [apiError, setApiError]           = useState('');
  const [isSaving, setIsSaving]           = useState(false);
  const [isDirty, setIsDirty]             = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [sameAddress, setSameAddress]     = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [rawWarehouses, setRawWarehouses] = useState<
    Array<{ id: string; name: string; type: WarehouseType; isPrimary: boolean; isActive: boolean }>
  >([]);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  // ── Fetch warehouses ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setWarehousesLoading(true);
    void (async () => {
      try {
        const res = await getWarehousesForUser(canViewAll);
        if (!mounted) return;
        setRawWarehouses(
          (res.data ?? []).map((w: WarehouseResponse) => ({
            id:        w.id,
            name:      w.name,
            type:      w.type as WarehouseType,
            isPrimary: (w as any).is_primary ?? false,
            isActive:  w.is_active,
          })),
        );
      } catch {
        if (mounted) setRawWarehouses([]);
      } finally {
        if (mounted) setWarehousesLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [canViewAll]);

  // FIX: memoize so reference is stable, avoiding re-render loops
  const accessibleWarehouses = useMemo(
    () => rawWarehouses.filter((w) => w.isActive),
    [rawWarehouses],
  );

  const filteredWarehouses = useMemo(
    () =>
      accessibleWarehouses.filter((wh) =>
        wh.name.toLowerCase().includes(warehouseSearch.toLowerCase()),
      ),
    [accessibleWarehouses, warehouseSearch],
  );

  // ── Reset on open ──────────────────────────────────────────────────────────
  // FIX: ONE useEffect only — the original had two conflicting effects both
  // reacting to [open, initialData]. The second one always ran after and wiped
  // the warehouseId logic from the first. Merged into a single effect.
  useEffect(() => {
    if (!open) return;

    const warehouseId   = isEditing
      ? (initialData?.warehouseId   ?? '')
      : (selectedWarehouseId        ?? '');
    const warehouseName = isEditing
      ? (initialData?.warehouseName ?? '')
      : (selectedWarehouseName      ?? '');

    setForm({ ...defaultForm, ...initialData, warehouseId, warehouseName });
    setGstRegistered(!!initialData?.gstin);
    setErrors({});
    setApiError('');
    setIsDirty(false);
    // FIX: sameAddress initialized from actual data rather than always false
    setSameAddress(
      !!(initialData?.billingAddress &&
        initialData.billingAddress === initialData?.shippingAddress),
    );
  }, [open, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Outside click closes warehouse dropdown ────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!whDropdownRef.current?.contains(e.target as Node)) {
        setShowWarehouseDropdown(false);
        setWarehouseSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedWarehouse = accessibleWarehouses.find((w) => w.id === form.warehouseId);
  const selectedBadge     = selectedWarehouse ? (TYPE_BADGE[selectedWarehouse.type] ?? null) : null;

  // ── Helpers ────────────────────────────────────────────────────────────────
  const update = useCallback(
    (field: keyof PartyFormData, value: string | number | boolean) => {
      setForm((p) => ({ ...p, [field]: value }));
      setIsDirty(true);
      setApiError('');
      setErrors((e) => {
        if (!e[field]) return e;
        const n = { ...e }; delete n[field]; return n;
      });
    },
    [],
  );

  const handleWarehouseSelect = useCallback(
    (id: string, name: string) => {
      setForm((p) => ({ ...p, warehouseId: id, warehouseName: name }));
      setSelectedWarehouse(id, name); // FIX: also sync to global store
      setIsDirty(true);
      setShowWarehouseDropdown(false);
      setWarehouseSearch('');
    },
    [setSelectedWarehouse],
  );

  const handleGstinChange = (val: string) => {
    const upper = val.toUpperCase();
    update('gstin', upper);
    if (upper.length >= 2) {
      const code = upper.slice(0, 2);
      const name = STATE_CODE_MAP[code] ?? '';
      update('stateCode', code);
      update('stateName', name);
    }
  };

  const handleToggleGst = () => {
    const next = !gstRegistered;
    setGstRegistered(next);
    if (!next) update('gstin', '');
    setIsDirty(true);
  };

  const handleClose = useCallback(() => {
    if (isDirty) { setDiscardConfirm(true); }
    else { onClose(); }
  }, [isDirty, onClose]);

  // Esc key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); handleClose(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, handleClose]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())
      e.name = 'Party name is required';
    if (form.phone && !/^\d{10}$/.test(form.phone.trim()))
      e.phone = 'Mobile number must be exactly 10 digits';
    if (form.email && !EMAIL_REGEX.test(form.email.trim()))
      e.email = 'Enter a valid email address';
    if (gstRegistered && form.gstin && !GSTIN_REGEX.test(form.gstin))
      e.gstin = 'Invalid GSTIN format (15 chars, e.g. 27AADCR4849M1ZV)';
    if (form.pan && !PAN_REGEX.test(form.pan))
      e.pan = 'Invalid PAN format (e.g. AADCR4849M)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setApiError('');
    try {
      const payload = { ...form };
      if (!gstRegistered) payload.gstin = '';
      await onSave(payload);
      setIsDirty(false);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to save party');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />

        {/* Panel */}
        <div ref={formRef} className="relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
            <div>
              <h3 className="text-base font-semibold text-[#1e293b]">
                {isEditing ? 'Edit Party' : 'Add New Party'}
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">Customer, Supplier or Both</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer transition-colors"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* ── API error banner ── */}
          {apiError && (
            <div className="mx-6 mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm shrink-0">
              <i className="ri-error-warning-line text-base shrink-0 mt-0.5" />
              <p>{apiError}</p>
            </div>
          )}

          {/* ── Form body ── */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* ── WAREHOUSE ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide flex items-center gap-2">
                Warehouse
                {warehousesLoading && <i className="ri-loader-4-line animate-spin text-[#94a3b8]" />}
              </label>

              <div className="relative" ref={whDropdownRef}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => setShowWarehouseDropdown((p) => !p)}
                  disabled={warehousesLoading}
                  className="w-full flex items-center gap-2 h-11 px-3 rounded-xl border border-[#e2e8f0] text-sm bg-white hover:border-[#4f46e5] hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedBadge?.cls ?? 'bg-slate-100'}`}>
                    <i className={`${selectedBadge?.icon ?? 'ri-store-3-line'} text-sm ${!selectedBadge ? 'text-[#64748b]' : ''}`} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate text-[#1e293b]">
                      {selectedWarehouse?.name ?? 'Select Warehouse'}
                    </p>
                    {selectedBadge && (
                      <p className="text-[10px] text-[#94a3b8]">{selectedBadge.label}</p>
                    )}
                  </div>
                  <i className={`ri-arrow-down-s-line text-[#64748b] text-lg transition-transform duration-200 ${showWarehouseDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown */}
                {showWarehouseDropdown && (
                  <div className="absolute left-0 top-12 w-full bg-white border border-[#e2e8f0] rounded-2xl shadow-xl z-50 overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-[#f1f5f9]">
                      <div className="relative">
                        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
                        <input
                          type="text"
                          value={warehouseSearch}
                          onChange={(e) => setWarehouseSearch(e.target.value)}
                          placeholder="Search warehouse..."
                          className="w-full h-10 pl-10 pr-3 rounded-lg border border-[#e2e8f0] text-sm focus:outline-none focus:border-[#4f46e5]"
                        />
                      </div>
                    </div>

                    <div className="px-3 py-2 border-b border-[#f1f5f9]">
                      <p className="text-[10px] font-bold text-[#94a3b8] uppercase tracking-wide">
                        {isSuperAdmin ? 'All Warehouses' : 'Your Assigned Warehouses'}
                      </p>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                      {filteredWarehouses.length === 0 ? (
                        <div className="p-6 text-center text-sm text-[#94a3b8]">
                          No warehouse found
                        </div>
                      ) : (
                        filteredWarehouses.map((wh) => {
                          const badge      = TYPE_BADGE[wh.type] ?? null;
                          const isSelected = wh.id === form.warehouseId;
                          return (
                            <button
                              type="button"
                              key={wh.id}
                              onClick={() => handleWarehouseSelect(wh.id, wh.name)}
                              className={`w-full text-left px-3 py-3 flex items-center gap-3 hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                                isSelected ? 'bg-indigo-50' : ''
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badge?.cls ?? 'bg-slate-100'}`}>
                                <i className={`${badge?.icon ?? 'ri-store-3-line'} text-sm`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isSelected ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>
                                  {wh.name}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-[#94a3b8]">{badge?.label ?? wh.type}</span>
                                  {wh.isPrimary && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">
                                      Primary
                                    </span>
                                  )}
                                </div>
                              </div>
                              {isSelected && <i className="ri-check-line text-[#4f46e5] text-lg shrink-0" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Party Name ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Party Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Ramesh Electronics"
                data-nav-index={0}
                className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                  errors.name
                    ? 'border-red-400 focus:ring-red-200'
                    : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                }`}
              />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
            </div>

            {/* ── Party Type ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Party Type</label>
              <div className="flex gap-2">
                {(['customer', 'supplier', 'both'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update('type', t)}
                    className={`flex-1 h-9 rounded-lg text-xs font-semibold border transition-colors cursor-pointer capitalize ${
                      form.type === t
                        ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                        : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Mobile + Email ── */}
            <div className="grid grid-cols-2 gap-3">
              {/* Mobile */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Mobile</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9812345670"
                    inputMode="numeric"
                    maxLength={10}
                    data-nav-index={2}
                    className={`w-full h-10 px-3 pr-14 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                      form.phone.length === 10
                        ? 'border-green-400 focus:ring-green-200'
                        : form.phone.length > 0
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                    }`}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                    form.phone.length === 10 ? 'text-green-500'
                    : form.phone.length > 0   ? 'text-amber-500'
                    : 'text-[#94a3b8]'
                  }`}>
                    {form.phone.length}/10
                  </span>
                </div>
                {form.phone.length > 0 && form.phone.length < 10 ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <i className="ri-error-warning-line" /> Must be 10 digits
                  </p>
                ) : form.phone.length === 10 ? (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <i className="ri-checkbox-circle-line" /> Valid mobile number
                  </p>
                ) : null}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="party@company.in"
                    data-nav-index={3}
                    className={`w-full h-10 px-3 pr-8 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                      form.email.length > 0 && !EMAIL_REGEX.test(form.email)
                        ? 'border-red-400 focus:ring-red-200'
                        : form.email.length > 0 && EMAIL_REGEX.test(form.email)
                          ? 'border-green-400 focus:ring-green-200'
                          : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                    }`}
                  />
                  {form.email.length > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {EMAIL_REGEX.test(form.email)
                        ? <i className="ri-checkbox-circle-line text-green-500 text-sm" />
                        : <i className="ri-error-warning-line text-red-400 text-sm" />}
                    </span>
                  )}
                </div>
                {form.email.length > 0 && !EMAIL_REGEX.test(form.email) ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <i className="ri-error-warning-line" /> Enter a valid email
                  </p>
                ) : form.email.length > 0 && EMAIL_REGEX.test(form.email) ? (
                  <p className="text-xs text-green-500 flex items-center gap-1">
                    <i className="ri-checkbox-circle-line" /> Valid email
                  </p>
                ) : null}
              </div>
            </div>

            {/* ── GST Toggle ── */}
            <div className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
              gstRegistered ? 'bg-indigo-50 border-indigo-200' : 'bg-[#f8fafc] border-[#e2e8f0]'
            }`}>
              <button
                type="button"
                onClick={handleToggleGst}
                data-nav-index={4}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#4f46e5]/40 ${
                  gstRegistered ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${
                  gstRegistered ? 'translate-x-5' : 'translate-x-0'
                }`}>
                  <i className={`text-[8px] ${gstRegistered ? 'ri-check-line text-[#4f46e5]' : 'ri-close-line text-[#94a3b8]'}`} />
                </span>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#1e293b]">Registered under GST</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    gstRegistered ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {gstRegistered ? 'Registered' : 'Unregistered'}
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {gstRegistered ? 'GSTIN required for this party' : 'Unregistered — GSTIN not required'}
                </p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                gstRegistered ? 'bg-indigo-100' : 'bg-slate-100'
              }`}>
                <i className={`ri-bill-line text-sm ${gstRegistered ? 'text-[#4f46e5]' : 'text-[#94a3b8]'}`} />
              </div>
            </div>

            {/* ── GSTIN ── */}
            {gstRegistered && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">GSTIN</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    placeholder="27AADCR4849M1ZV"
                    maxLength={15}
                    data-nav-index={5}
                    className={`w-full h-10 px-3 pr-9 rounded-lg border text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors uppercase ${
                      errors.gstin
                        ? 'border-red-400 focus:ring-red-200'
                        : form.gstin && GSTIN_REGEX.test(form.gstin)
                          ? 'border-green-400 focus:ring-green-200'
                          : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                    }`}
                  />
                  {form.gstin && GSTIN_REGEX.test(form.gstin) && (
                    <i className="ri-checkbox-circle-fill absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-base" />
                  )}
                </div>
                {errors.gstin && <p className="text-xs text-red-500">{errors.gstin}</p>}
                {form.gstin && GSTIN_REGEX.test(form.gstin) && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <i className="ri-checkbox-circle-line" /> Valid GSTIN — State auto-filled
                  </p>
                )}
              </div>
            )}

            {/* ── State ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">State</label>
              {gstRegistered ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.stateCode}
                    readOnly
                    className="w-20 h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm font-mono font-bold text-[#4f46e5] bg-[#f8fafc] cursor-default"
                  />
                  <input
                    type="text"
                    value={form.stateName}
                    readOnly
                    data-nav-index={6}
                    className="flex-1 h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-[#f8fafc] cursor-default"
                  />
                </div>
              ) : (
                <StateDropdown
                  stateCode={form.stateCode}
                  stateName={form.stateName}
                  onChange={(code, name) => { update('stateCode', code); update('stateName', name); }}
                  navIndex={6}
                />
              )}
            </div>

            {/* ── City ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Pune"
                data-nav-index={7}
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              />
            </div>

            {/* ── Billing Address ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Billing Address</label>
              <textarea
                value={form.billingAddress}
                onChange={(e) => { update('billingAddress', e.target.value); setSameAddress(false); }}
                rows={2}
                data-nav-index={8}
                placeholder="45, MG Road, Pune 411001"
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none"
              />
            </div>

            {/* ── Shipping Address ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Shipping Address</label>
                <button
                  type="button"
                  onClick={() => { update('shippingAddress', form.billingAddress); setSameAddress(true); }}
                  className="text-xs text-[#4f46e5] font-medium hover:text-indigo-700 cursor-pointer"
                >
                  Copy from Billing
                </button>
              </div>
              <textarea
                value={form.shippingAddress}
                onChange={(e) => { update('shippingAddress', e.target.value); setSameAddress(false); }}
                rows={2}
                placeholder="Same as billing or different"
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none"
              />
              {sameAddress && (
                <p className="text-xs text-[#94a3b8]">Copied from billing address</p>
              )}
            </div>

            {/* ── Credit + Opening Balance ── */}
            <div className="grid grid-cols-3 gap-3">
              {([
                { label: 'Credit Limit (₹)', key: 'creditLimit',    placeholder: '600000', idx: 9  },
                { label: 'Credit Days',       key: 'creditDays',     placeholder: '30',     idx: 10 },
                { label: 'Opening Balance',   key: 'openingBalance', placeholder: '0',      idx: 11 },
              ] as const).map(({ label, key, placeholder, idx }) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">{label}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={(form[key] as number) || ''}
                    onChange={(e) => update(key, parseFloat(e.target.value) || 0)}
                    placeholder={placeholder}
                    data-nav-index={idx}
                    className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                  />
                </div>
              ))}
            </div>

            {/* ── PAN ── */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">PAN</label>
              <div className="relative">
                <input
                  type="text"
                  value={form.pan}
                  onChange={(e) => update('pan', e.target.value.toUpperCase())}
                  placeholder="AADCR4849M"
                  maxLength={10}
                  className={`w-full h-10 px-3 pr-9 rounded-lg border text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                    errors.pan
                      ? 'border-red-400 focus:ring-red-200'
                      : form.pan.length === 10 && PAN_REGEX.test(form.pan)
                        ? 'border-green-400 focus:ring-green-200'
                        : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                  }`}
                />
                {form.pan.length === 10 && PAN_REGEX.test(form.pan) && (
                  <i className="ri-checkbox-circle-fill absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-base" />
                )}
              </div>
              {errors.pan && <p className="text-xs text-red-500">{errors.pan}</p>}
            </div>

            {/* ── Active toggle ── */}
            <div className="flex items-center gap-3 pt-1">
              {/* FIX: original had -translate-x-4/translate-x-1 (broken).
                  Correct: translate-x-0 → translate-x-4 matching left-1 origin */}
              <button
                type="button"
                onClick={() => update('isActive', !form.isActive)}
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 ${
                  form.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'
                }`}
              >
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                  form.isActive ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
              <label className="text-sm text-[#64748b] select-none">
                {form.isActive ? 'Active Party' : 'Inactive Party'}
              </label>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-[#e2e8f0] shrink-0">
            <div>
              {isDirty && (
                <span className="text-xs text-amber-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClose}
                className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel (Esc)
              </button>
              <button
                onClick={() => void handleSave()}
                disabled={isSaving}
                data-nav-index={12}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); void handleSave(); } }}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40"
              >
                {isSaving
                  ? <><i className="ri-loader-4-line animate-spin" /> Saving...</>
                  : <><i className="ri-save-line" /> {isEditing ? 'Update Party' : 'Save Party'}</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Discard confirm */}
      <ConfirmDialog
        open={discardConfirm}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to discard them?"
        variant="warning"
        confirmLabel="Yes, Discard (Y)"
        cancelLabel="No, Keep Editing (N)"
        onConfirm={() => { setDiscardConfirm(false); setIsDirty(false); onClose(); }}
        onCancel={() => setDiscardConfirm(false)}
      />
    </>
  );
}