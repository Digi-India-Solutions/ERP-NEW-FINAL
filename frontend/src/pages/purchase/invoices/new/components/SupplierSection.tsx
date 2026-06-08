import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';
import { createParty, filterParties, type PartyResponse } from '@/api/party.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

export interface SupplierInfo {
  id: string; name: string; gstin: string;
  phone: string; stateCode: string; address: string;
  creditLimit?: number;
  openingBalance?: number;
  balance?: number;
}

const mapPartyToSupplier = (party: PartyResponse): SupplierInfo => ({
  id: party.id,
  name: party.name,
  gstin: party.gstin ?? '',
  phone: party.phone ?? party.mobile ?? '',
  stateCode: party.stateCode ?? party.state_code ?? '',
  address: party.billingAddress ?? party.billing_address ?? '',
  creditLimit: party.creditLimit ?? party.credit_limit ?? 0,
  openingBalance: party.openingBalance ?? party.opening_balance ?? 0,
  balance: party.balance ?? party.openingBalance ?? party.opening_balance ?? 0,
});

interface Props {
  selected: SupplierInfo | null;
  onSelect: (s: SupplierInfo) => void;
  address: string;
  onAddressChange: (v: string) => void;
  supplierInvoiceNo: string;
  onSupplierInvoiceNoChange: (v: string) => void;
}

// ── Indian states list with GST code ─────────────────────────────────────────
interface StateOption { name: string; code: string }
const INDIAN_STATES: StateOption[] = [
  { name: 'Jammu & Kashmir', code: '01' },
  { name: 'Himachal Pradesh', code: '02' },
  { name: 'Punjab', code: '03' },
  { name: 'Chandigarh', code: '04' },
  { name: 'Uttarakhand', code: '05' },
  { name: 'Haryana', code: '06' },
  { name: 'Delhi', code: '07' },
  { name: 'Rajasthan', code: '08' },
  { name: 'Uttar Pradesh', code: '09' },
  { name: 'Bihar', code: '10' },
  { name: 'Sikkim', code: '11' },
  { name: 'Arunachal Pradesh', code: '12' },
  { name: 'Nagaland', code: '13' },
  { name: 'Manipur', code: '14' },
  { name: 'Mizoram', code: '15' },
  { name: 'Tripura', code: '16' },
  { name: 'Meghalaya', code: '17' },
  { name: 'Assam', code: '18' },
  { name: 'West Bengal', code: '19' },
  { name: 'Jharkhand', code: '20' },
  { name: 'Odisha', code: '21' },
  { name: 'Chhattisgarh', code: '22' },
  { name: 'Madhya Pradesh', code: '23' },
  { name: 'Gujarat', code: '24' },
  { name: 'Daman & Diu', code: '25' },
  { name: 'Dadra & Nagar Haveli', code: '26' },
  { name: 'Maharashtra', code: '27' },
  { name: 'Andhra Pradesh (old)', code: '28' },
  { name: 'Karnataka', code: '29' },
  { name: 'Goa', code: '30' },
  { name: 'Lakshadweep', code: '31' },
  { name: 'Kerala', code: '32' },
  { name: 'Tamil Nadu', code: '33' },
  { name: 'Puducherry', code: '34' },
  { name: 'Andaman & Nicobar', code: '35' },
  { name: 'Telangana', code: '36' },
  { name: 'Andhra Pradesh', code: '37' },
  { name: 'Ladakh', code: '38' },
];

// ── State Dropdown Component ──────────────────────────────────────────────────
function StateDropdown({
  value,
  onChange,
  className,
}: {
  value: StateOption | null;
  onChange: (s: StateOption | null) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = INDIAN_STATES.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.includes(search)
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setSearch(''); }}
        className={`${className} flex items-center justify-between gap-1 text-left`}
      >
        <span className={value ? 'text-slate-800' : 'text-slate-400'}>
          {value ? `${value.name} (${value.code})` : 'Select state...'}
        </span>
        <i className={`ri-arrow-${open ? 'up' : 'down'}-s-line text-slate-400 text-xs shrink-0`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg">
          <div className="p-1.5 border-b border-[#f1f5f9]">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search state..."
              autoFocus
              className="w-full h-7 px-2 text-xs border border-[#e2e8f0] rounded focus:outline-none focus:border-[#4f46e5]"
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {filtered.map((s) => (
              <button
                key={s.code}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s);
                  setOpen(false);
                  setSearch('');
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-indigo-50 transition-colors ${value?.code === s.code ? 'bg-indigo-50 text-[#4f46e5] font-semibold' : 'text-slate-700'}`}
              >
                <span>{s.name}</span>
                <span className="text-slate-400 font-mono">{s.code}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-slate-400">No states found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NewSupplierForm type ──────────────────────────────────────────────────────
interface NewSupplierForm {
  name: string;
  mobile: string;
  email: string;
  gstin: string;
  state: StateOption | null;
  city: string;
}
const emptyForm = (): NewSupplierForm => ({
  name: '', mobile: '', email: '', gstin: '', state: null, city: '',
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function SupplierSection({
  selected, onSelect, address, onAddressChange,
  supplierInvoiceNo, onSupplierInvoiceNoChange,
}: Props) {
  const [query, setQuery] = useState(selected?.name ?? '');
  const [options, setOptions] = useState<SupplierInfo[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<NewSupplierForm>(emptyForm());
  const [savingNew, setSavingNew] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saveError, setSaveError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [allSuppliers, setAllSuppliers] = useState<SupplierInfo[]>([]);

  const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);
  const selectedWarehouseName = useWarehouseStore((s) => s.selectedWarehouseName);
  const { hasPermission } = useAuth();
  const canAddParty = hasPermission(MODULES.PARTIES, 'create');
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Clear list on warehouse change
  useEffect(() => {
    setQuery('');
    setAllSuppliers([]);
    setOptions([]);
    setOpen(false);
  }, [selectedWarehouseId]);

  // Sync query when selected changes externally
  useEffect(() => {
    setQuery(selected?.name ?? '');
  }, [selected?.name]);

  useEffect(() => {
    if (!canAddParty && showNewForm) setShowNewForm(false);
  }, [canAddParty, showNewForm]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchAllSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const warehouseParam = selectedWarehouseId && selectedWarehouseId !== 'ALL'
        ? selectedWarehouseId : undefined;
      const res = await filterParties({ isActive: true, warehouse_id: warehouseParam });
      const mapped = (res.data ?? [])
        .filter((p) => {
          const t = String(p.type || '').toLowerCase();
          return t === 'supplier' || t === 'both';
        })
        .map(mapPartyToSupplier);
      setAllSuppliers(mapped);
      setOptions(mapped);
      setOpen(true);
      setHighlighted(-1);
    } catch (err) {
      console.error(err);
      setAllSuppliers([]);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  const filterSuppliers = useCallback((q: string) => {
    if (!q.trim()) { setOptions(allSuppliers); return; }
    const lo = q.toLowerCase();
    setOptions(allSuppliers.filter((s) =>
      s.name.toLowerCase().includes(lo) ||
      s.phone.toLowerCase().includes(lo) ||
      s.gstin.toLowerCase().includes(lo)
    ));
  }, [allSuppliers]);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (allSuppliers.length > 0) filterSuppliers(val);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || options.length === 0) {
      if (e.key === 'ArrowDown' && allSuppliers.length === 0) fetchAllSuppliers();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault(); setHighlighted((p) => Math.min(p + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault(); setHighlighted((p) => Math.max(p - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault(); select(options[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (highlighted >= 0 && wrapRef.current) {
      const items = wrapRef.current.querySelectorAll('[data-option]');
      items[highlighted]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlighted]);

  const select = useCallback((s: SupplierInfo) => {
    setQuery(s.name);
    setOpen(false);
    setOptions([]);
    onSelect(s);
    setShowNewForm(false);
  }, [onSelect]);

  const handleSaveNew = useCallback(async () => {
    setSaveError('');
    setMobileError('');
    setEmailError('');

    if (!newForm.name.trim()) return;
    if (!newForm.mobile.trim() || newForm.mobile.trim().length !== 10) {
      setMobileError('Mobile must be 10 digits');
      return;
    }
    const emailVal = newForm.email.trim();
    if (!emailVal) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setEmailError('Enter a valid email address');
      return;
    }

    setSavingNew(true);
    try {
      const mobileVal = newForm.mobile.trim();

      // ✅ PRE-CHECK: fetch ALL active parties and check phone + email client-side.
      // We can't rely on the search endpoint for email (backend may not index email).
      // A single unfiltered fetch gives us the full PartyResponse[] including email field.
      const warehouseParam = selectedWarehouseId && selectedWarehouseId !== 'ALL'
        ? selectedWarehouseId : undefined;
      const dupRes = await filterParties({ isActive: true, warehouse_id: warehouseParam });
      const allData = dupRes.data ?? [];

      const phoneExists = allData.some(
        (p) => p.phone === mobileVal || p.mobile === mobileVal,
      );
      const emailExists = allData.some(
        (p) => typeof p.email === 'string' && p.email.toLowerCase() === emailVal.toLowerCase(),
      );

      if (phoneExists || emailExists) {
        if (phoneExists) setMobileError('This mobile number is already registered');
        if (emailExists) setEmailError('This email is already registered');
        return; // abort — no create call
      }

      const created = await createParty({
        name: newForm.name.trim(),
        type: 'Supplier',
        mobile: mobileVal,
        phone: mobileVal,
        email: emailVal,
        gstin: newForm.gstin.trim() || undefined,
        city: newForm.city.trim() || undefined,
        billingAddress: newForm.city.trim() || undefined,
        stateCode: newForm.state?.code || undefined,
        stateName: newForm.state?.name || undefined,
        warehouseId: selectedWarehouseId && selectedWarehouseId !== 'ALL'
          ? selectedWarehouseId : undefined,
        warehouseName: selectedWarehouseId && selectedWarehouseId !== 'ALL'
          ? selectedWarehouseName : undefined,
      });
      if (!created.success || !created.data) {
        throw new Error(created.message || 'Failed to create supplier');
      }
      const newSupplier = mapPartyToSupplier(created.data as PartyResponse);
      setAllSuppliers((prev) => [newSupplier, ...prev]);
      setShowNewForm(false);
      setNewForm(emptyForm());
      setMobileError('');
      setEmailError('');
      setSaveError('');
      select(newSupplier);
    } catch (err: any) {
      console.error(err);
      // Safety net: surface any DB-level constraint errors
      const msg: string = err?.message || '';
      const lo = msg.toLowerCase();
      if (lo.includes('phone') || lo.includes('mobile')) {
        setMobileError('This mobile number is already registered');
      } else if (lo.includes('email')) {
        setEmailError('This email is already registered');
      } else {
        setSaveError(msg || 'Failed to save supplier. Please try again.');
      }
    } finally {
      setSavingNew(false);
    }
  }, [newForm, select, selectedWarehouseId, selectedWarehouseName]);

  const fl = 'w-full h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200';
  const lb = 'block text-xs text-slate-500 mb-0.5';
  console.log("OPTION===>", options)
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Supplier</h3>

      {/* Search row */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative" ref={wrapRef}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (allSuppliers.length === 0) fetchAllSuppliers();
              else setOpen(true);
            }}
            placeholder="Search supplier..."
            className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200 bg-white"
          />
          {loading && (
            <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          )}

          {/* Dropdown */}
          {open && options.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {options.map((s, idx) => (
                <button
                  key={s.id}
                  data-option
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); select(s); }}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${idx === highlighted ? 'bg-indigo-50 text-[#4f46e5]' : 'hover:bg-slate-50 text-[#1e293b]'}`}
                >
                  <span className="font-medium">
                    {s.name}
                    {s?.phone && <p className="text-xs text-slate-500">{s?.phone}</p>}
                  </span>
                  {s.gstin && <span className="text-xs text-slate-400 ml-2 shrink-0">{s.gstin}</span>}
                </button>
              ))}
            </div>
          )}

          {open && !loading && options.length === 0 && query.trim() && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-sm px-3 py-3 text-xs text-slate-400">
              No suppliers found for "{query}"
            </div>
          )}

          {open && loading && allSuppliers.length === 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-sm px-3 py-3 flex items-center gap-2 text-xs text-slate-500">
              <i className="ri-loader-4-line animate-spin" />
              Loading suppliers...
            </div>
          )}
        </div>

        {canAddParty && (
          <button
            type="button"
            onClick={() => setShowNewForm((v) => !v)}
            className="shrink-0 flex items-center gap-1 h-9 px-3 text-xs font-semibold text-[#4f46e5] border border-indigo-200 rounded-lg hover:bg-indigo-50 cursor-pointer whitespace-nowrap transition-colors"
          >
            <i className="ri-user-add-line" />
            {showNewForm ? 'Cancel' : '+ New'}
          </button>
        )}
      </div>

      {/* ── New Supplier Form ─────────────────────────────────────────────────── */}
      {showNewForm && canAddParty && (
        <div className="mb-3 p-3 bg-slate-50 border border-[#e2e8f0] rounded-lg">
          <p className="text-xs font-semibold text-slate-600 mb-2">New Supplier</p>

          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Name */}
            <div>
              <label className={lb}>Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                className={fl}
                placeholder="Supplier name"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className={lb}>Mobile <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={newForm.mobile}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setNewForm((f) => ({ ...f, mobile: val }));
                  setMobileError('');
                }}
                className={`${fl} ${mobileError ? 'border-red-400' : ''}`}
                placeholder="10-digit mobile"
                maxLength={10}
              />
              {mobileError && <p className="text-xs text-red-500 mt-0.5">{mobileError}</p>}
              {newForm.mobile && newForm.mobile.length < 10 && !mobileError && (
                <p className="text-xs text-amber-500 mt-0.5">{newForm.mobile.length}/10 digits</p>
              )}
            </div>

            {/* Email — required */}
            <div>
              <label className={lb}>Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={newForm.email}
                onChange={(e) => { setNewForm((f) => ({ ...f, email: e.target.value })); setEmailError(''); }}
                className={`${fl} ${emailError ? 'border-red-400' : ''}`}
                placeholder="supplier@example.com"
              />
              {emailError && <p className="text-xs text-red-500 mt-0.5">{emailError}</p>}
            </div>

            {/* GSTIN */}
            <div>
              <label className={lb}>GSTIN (optional)</label>
              <input
                type="text"
                value={newForm.gstin}
                onChange={(e) => setNewForm((f) => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                className={fl}
                placeholder="15-char GSTIN"
                maxLength={15}
              />
            </div>

            {/* State — full width */}
            <div className="col-span-2">
              <label className={lb}>State</label>
              <StateDropdown
                value={newForm.state}
                onChange={(s) => setNewForm((f) => ({ ...f, state: s }))}
                className={fl}
              />
            </div>

            {/* City — below state, full width */}
            <div className="col-span-2">
              <label className={lb}>City</label>
              <input
                type="text"
                value={newForm.city}
                onChange={(e) => setNewForm((f) => ({ ...f, city: e.target.value }))}
                className={fl}
                placeholder="City"
              />
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
              <i className="ri-error-warning-line" />{saveError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveNew}
              disabled={savingNew || !newForm.name.trim() || !newForm.mobile.trim() || !newForm.email.trim()}
              className="flex items-center gap-1 h-7 px-3 text-xs font-semibold bg-[#4f46e5] text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {savingNew ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-save-line" />}
              Save &amp; Select
            </button>
            <button
              type="button"
              onClick={() => { setShowNewForm(false); setNewForm(emptyForm()); setMobileError(''); setSaveError(''); }}
              className="flex items-center gap-1 h-7 px-3 text-xs font-medium text-slate-500 border border-[#e2e8f0] rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-close-line" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Selected supplier details */}
      {selected && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={lb}>Mobile</label>
              <div className="h-8 px-2 flex items-center text-sm text-slate-700 bg-slate-50 border border-[#e2e8f0] rounded-lg">
                {selected.phone || '—'}
              </div>
            </div>
            <div>
              <label className={lb}>GSTIN</label>
              <div className="h-8 px-2 flex items-center text-xs text-slate-700 bg-slate-50 border border-[#e2e8f0] rounded-lg truncate">
                {selected.gstin || '—'}
              </div>
            </div>
          </div>
          <div>
            <label className={lb}>Supplier Invoice No</label>
            <input
              type="text"
              value={supplierInvoiceNo}
              onChange={(e) => onSupplierInvoiceNoChange(e.target.value)}
              className={fl}
              placeholder="Supplier's reference number"
            />
          </div>
          <div>
            <label className={lb}>Supplier Address</label>
            <textarea
              value={address}
              onChange={(e) => onAddressChange(e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200 resize-none"
              placeholder="Supplier address"
            />
          </div>
        </div>
      )}
    </div>
  );
}