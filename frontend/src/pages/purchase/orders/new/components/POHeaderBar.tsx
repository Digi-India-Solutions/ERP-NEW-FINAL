import { useState, useCallback, useEffect, useRef } from 'react';
import { createParty, filterParties } from '@/api/party.api';
import { useToast } from '@/contexts/ToastContext';
import { useWarehouseStore } from '@/stores/warehouseStore';
import type { POSupplier } from '../page';

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
    <div className="relative w-full" ref={wrapRef}>
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

const createEmptyNewSupplier = () => ({
  name: '',
  mobile: '',
  email: '',
  gstin: '',
  city: '',
  state: null as StateOption | null,
});

export default function POHeaderBar({
  supplier,
  onSupplierSelect,
  poDate,
  onPoDateChange,
  expectedDelivery,
  onExpectedDeliveryChange,
  poNumber,
  gstType,
}: Props) {
  const toast = useToast();
  const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);
  const selectedWarehouseName = useWarehouseStore((s) => s.selectedWarehouseName);

  // ───────────── State ─────────────
  const [query, setQuery] = useState(supplier?.name ?? '');
  const [options, setOptions] = useState<POSupplier[]>([]);
  const [allSuppliers, setAllSuppliers] = useState<POSupplier[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [showNewForm, setShowNewForm] = useState(false);
  const [savingNew, setSavingNew] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [newSupplier, setNewSupplier] = useState(createEmptyNewSupplier());

  const debounceRef = useRef<any>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(supplier?.name ?? '');
  }, [supplier]);

  // ───────────── Fetch suppliers ─────────────
  const fetchSuppliers = useCallback(
    async (search = '', shouldOpen = false) => {
      setLoading(true);

      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        if (search.trim()) params.append('search', search.trim());
        if (selectedWarehouseId && selectedWarehouseId !== 'ALL') {
          params.append('warehouse_id', selectedWarehouseId);
        }

        const url = `${(import.meta.env.VITE_API_URL || 'http://localhost:7000')}/api/v1/party/suppliers${params.toString() ? `?${params.toString()}` : ''}`;

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        const mapped = (data?.data || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          gstin: p.gstin ?? '',
          phone: p.phone ?? p.mobile ?? '',
          stateCode: p.stateCode ?? p.state_code ?? '',
          address: p.billingAddress ?? p.billing_address ?? '',
          city: p.city ?? p.state_name ?? '',
        }));

        setAllSuppliers(mapped);
        setOptions(mapped);
        if (shouldOpen) {
          setOpen(mapped.length > 0);
        }
        setHighlighted(-1);
      } catch (err) {
        console.error(err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedWarehouseId],
  );

  // When warehouse changes: clear all supplier state locally, reset form, then refetch
  useEffect(() => {
    // Reset local supplier UI state without calling the parent callback with null
    setQuery('');
    setAllSuppliers([]);
    setOptions([]);
    setOpen(false);
    void fetchSuppliers('', false);
  }, [selectedWarehouseId, fetchSuppliers]); // ⚠️ intentionally exclude onSupplierSelect to prevent infinite re-render

  const filterSuppliers = useCallback(
    (search: string) => {
      if (!search.trim()) {
        setOptions(allSuppliers);
        setOpen(allSuppliers.length > 0);
        setHighlighted(-1);
        return;
      }

      const searchLower = search.toLowerCase();
      const filtered = allSuppliers.filter(
        (supplierOption) =>
          supplierOption.name.toLowerCase().includes(searchLower) ||
          supplierOption.phone.toLowerCase().includes(searchLower) ||
          supplierOption.gstin.toLowerCase().includes(searchLower),
      );

      setOptions(filtered);
      setOpen(filtered.length > 0);
      setHighlighted(-1);
    },
    [allSuppliers],
  );

  // ───────────── Handle input change (debounced) ─────────────
  const handleChange = (val: string) => {
    setQuery(val);
    if (showNewForm) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      if (allSuppliers.length > 0) {
        filterSuppliers(val);
      } else {
        void fetchSuppliers(val, true);
      }
    }, 300);
  };

  const handleSaveNewSupplier = useCallback(async () => {
    setSaveError('');
    setMobileError('');
    setEmailError('');

    if (!newSupplier.name.trim()) return;

    const mobileVal = newSupplier.mobile.trim();
    if (!mobileVal || mobileVal.length !== 10) {
      setMobileError('Mobile must be exactly 10 digits');
      return;
    }

    const emailVal = newSupplier.email.trim();
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
      // Pre-check duplicate check
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
        return; // abort
      }

      const created = await createParty({
        name: newSupplier.name.trim(),
        type: 'Supplier',
        mobile: mobileVal,
        phone: mobileVal,
        email: emailVal,
        gstin: newSupplier.gstin.trim() || undefined,
        city: newSupplier.city.trim() || undefined,
        billingAddress: newSupplier.city.trim() || undefined,
        stateCode: newSupplier.state?.code || undefined,
        stateName: newSupplier.state?.name || undefined,
        warehouseId: selectedWarehouseId && selectedWarehouseId !== 'ALL'
          ? selectedWarehouseId : undefined,
        warehouseName: selectedWarehouseId && selectedWarehouseId !== 'ALL'
          ? selectedWarehouseName : undefined,
        isActive: true,
      });

      if (!created.success || !created.data) {
        throw new Error(created.message || 'Failed to create supplier');
      }

      const createdSupplier: POSupplier = {
        id: created.data.id,
        name: created.data.name,
        gstin: created.data.gstin ?? '',
        phone: created.data.phone ?? created.data.mobile ?? '',
        stateCode: created.data.stateCode ?? created.data.state_code ?? '',
        address:
          created.data.billingAddress ?? created.data.billing_address ?? '',
        city: created.data.city ?? created.data.state_name ?? '',
      };

      setAllSuppliers((prev) => [...prev, createdSupplier]);
      setOptions((prev) => [...prev, createdSupplier]);
      setQuery(createdSupplier.name);
      setOpen(false);
      setShowNewForm(false);
      setNewSupplier(createEmptyNewSupplier());
      setMobileError('');
      setEmailError('');
      setSaveError('');
      onSupplierSelect(createdSupplier);
      toast.success(`Supplier "${createdSupplier.name}" created successfully`);
    } catch (err: any) {
      console.error(err);
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
  }, [newSupplier, onSupplierSelect, selectedWarehouseId, selectedWarehouseName, toast]);

  // ───────────── Close dropdown on outside click ─────────────
  useEffect(() => {
    const handler = (e: any) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const inp =
    'h-9 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] w-full';
  const lb =
    'block text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5';

  return (
    <div className="bg-white border-b border-[#e2e8f0] px-4 py-2.5 flex items-end gap-4">
      {/* Supplier */}
      <div className="flex-[2] min-w-0">
        <label className={lb}>
          Supplier <span className="text-red-500">*</span>
        </label>

        <div className="relative" ref={wrapRef}>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => {
                if (showNewForm) return;
                if (allSuppliers.length > 0) {
                  setOptions(allSuppliers);
                  setOpen(true);
                  setHighlighted(-1);
                } else {
                  void fetchSuppliers(query, true);
                }
              }}
              onClick={() => {
                if (showNewForm) return;
                if (allSuppliers.length > 0) {
                  setOptions(allSuppliers);
                  setOpen(true);
                  setHighlighted(-1);
                } else {
                  void fetchSuppliers(query, true);
                }
              }}
              onKeyDown={(e) => {
                if (!open || !options.length) return;

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlighted((p) => Math.min(p + 1, options.length - 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlighted((p) => Math.max(p - 1, 0));
                } else if (e.key === 'Enter' && highlighted >= 0) {
                  e.preventDefault();
                  const s = options[highlighted];
                  setQuery(s.name);
                  setOpen(false);
                  onSupplierSelect(s);
                } else if (e.key === 'Escape') {
                  setOpen(false);
                }
              }}
              placeholder="Search supplier by name, phone or GSTIN..."
              className={inp}
            />

            <button
              type="button"
              onClick={() => {
                if (showNewForm) {
                  setShowNewForm(false);
                  setNewSupplier(createEmptyNewSupplier());
                  setMobileError('');
                  return;
                }

                setNewSupplier(createEmptyNewSupplier());
                setMobileError('');
                setShowNewForm(true);
              }}
              className="shrink-0 h-9 px-3 text-xs font-semibold text-[#4f46e5] border border-indigo-200 rounded-lg hover:bg-indigo-50 whitespace-nowrap transition-colors"
            >
              {showNewForm ? 'Cancel' : '+ New'}
            </button>
          </div>

          {loading && (
            <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          )}

          {open && options.length > 0 && (
            <div className="absolute z-[9999] left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-60 overflow-y-auto overscroll-contain">
              {options.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setQuery(s.name);
                    setOpen(false);
                    onSupplierSelect(s);
                  }}
                  onMouseEnter={() => setHighlighted(idx)}
                  className={`w-full flex justify-between px-3 py-2.5 text-sm ${idx === highlighted
                      ? 'bg-indigo-50 text-[#4f46e5]'
                      : 'hover:bg-slate-50 text-[#1e293b]'
                    }`}
                >
                  <span className="font-medium">
                    {s.name}
                    {s?.phone && <p className="text-xs text-slate-500">{s?.phone}</p>}
                  </span>
                  {s.gstin && (
                    <span className="text-xs text-slate-400">{s.gstin}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {showNewForm && (
            <div className="relative z-[9999] mt-3 rounded-lg border border-[#e2e8f0] bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-600">
                New Supplier
              </p>
              <div className="grid grid-cols-2 gap-2">
                {/* Name */}
                <div>
                  <label className={lb}>Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) =>
                      setNewSupplier((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Supplier name"
                    className="h-8 w-full rounded-lg border border-[#e2e8f0] bg-white px-2 text-sm focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className={lb}>Mobile <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    value={newSupplier.mobile}
                    onChange={(e) => {
                      const nextValue = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10);
                      setNewSupplier((prev) => ({ ...prev, mobile: nextValue }));
                      setMobileError('');
                    }}
                    placeholder="10-digit mobile"
                    maxLength={10}
                    className={`h-8 w-full rounded-lg border bg-white px-2 text-sm focus:outline-none focus:border-[#4f46e5] ${mobileError ? 'border-red-400' : 'border-[#e2e8f0]'}`}
                  />
                  {mobileError && (
                    <p className="text-xs text-red-500 mt-0.5">{mobileError}</p>
                  )}
                  {newSupplier.mobile && newSupplier.mobile.length < 10 && !mobileError && (
                    <p className="text-xs text-amber-500 mt-0.5">{newSupplier.mobile.length}/10 digits</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className={lb}>Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => {
                      setNewSupplier((prev) => ({ ...prev, email: e.target.value }));
                      setEmailError('');
                    }}
                    placeholder="supplier@example.com"
                    className={`h-8 w-full rounded-lg border bg-white px-2 text-sm focus:outline-none focus:border-[#4f46e5] ${emailError ? 'border-red-400' : 'border-[#e2e8f0]'}`}
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 mt-0.5">{emailError}</p>
                  )}
                </div>

                {/* GSTIN */}
                <div>
                  <label className={lb}>GSTIN (optional)</label>
                  <input
                    type="text"
                    value={newSupplier.gstin}
                    onChange={(e) =>
                      setNewSupplier((prev) => ({
                        ...prev,
                        gstin: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="15-char GSTIN"
                    maxLength={15}
                    className="h-8 w-full rounded-lg border border-[#e2e8f0] bg-white px-2 text-sm focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>

                {/* State */}
                <div className="col-span-2">
                  <label className={lb}>State</label>
                  <StateDropdown
                    value={newSupplier.state}
                    onChange={(s) => setNewSupplier((prev) => ({ ...prev, state: s }))}
                    className="h-8 w-full rounded-lg border border-[#e2e8f0] bg-white px-2 text-sm focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>

                {/* City */}
                <div className="col-span-2">
                  <label className={lb}>City</label>
                  <input
                    type="text"
                    value={newSupplier.city}
                    onChange={(e) =>
                      setNewSupplier((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                    placeholder="City"
                    className="h-8 w-full rounded-lg border border-[#e2e8f0] bg-white px-2 text-sm focus:outline-none focus:border-[#4f46e5]"
                  />
                </div>
              </div>

              {saveError && (
                <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                  <i className="ri-error-warning-line" /> {saveError}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveNewSupplier}
                  disabled={
                    savingNew ||
                    !newSupplier.name.trim() ||
                    !newSupplier.mobile.trim() ||
                    !newSupplier.email.trim()
                  }
                  className="h-8 rounded-lg bg-[#4f46e5] px-3 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-1"
                >
                  {savingNew ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <i className="ri-save-line" /> Save &amp; Select
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewForm(false);
                    setNewSupplier(createEmptyNewSupplier());
                    setMobileError('');
                    setEmailError('');
                    setSaveError('');
                  }}
                  className="h-8 rounded-lg border border-[#e2e8f0] px-3 text-xs font-medium text-slate-500 hover:bg-slate-50"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PO Date */}
      <div className="flex-1 min-w-[140px]">
        <label className={lb}>PO Date</label>
        <input
          type="date"
          value={poDate}
          onChange={(e) => onPoDateChange(e.target.value)}
          className={inp}
        />
      </div>

      {/* Expected Delivery */}
      <div className="flex-1 min-w-[140px]">
        <label className={lb}>Expected Delivery</label>
        <input
          type="date"
          value={expectedDelivery}
          onChange={(e) => onExpectedDeliveryChange(e.target.value)}
          className={inp}
        />
      </div>

      {/* PO Number */}
      <div className="flex-1 min-w-[160px]">
        <label className={lb}>PO Number</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-9 px-3 flex items-center text-sm font-semibold text-[#4f46e5] bg-indigo-50 border border-indigo-200 rounded-lg">
            {poNumber}
          </div>
        </div>
      </div>
    </div>
  );
}
