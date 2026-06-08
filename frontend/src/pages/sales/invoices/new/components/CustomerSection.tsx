import { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  createParty,
  filterParties,
  type PartyPayload,
  type PartyResponse,
} from '@/api/party.api';
import { MODULES } from '@/utils/permissions';
import { useWarehouseStore } from '@/stores/warehouseStore';

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

export interface CustomerInfo {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  stateCode: string;
  billingAddress: string;
  shippingAddress: string;
  creditLimit?: number;
  openingBalance?: number;
  balance?: number;
  warehouse_id?: string;
  warehouse_name?: string;
}

interface Props {
  selected: CustomerInfo | null;
  onSelect: (c: CustomerInfo) => void;
  billingAddress: string;
  shippingAddress: string;
  onBillingAddressChange: (v: string) => void;
  onShippingAddressChange: (v: string) => void;
}

interface NewCustomerForm {
  name: string;
  mobile: string;
  email: string;
  gstin: string;
  state: StateOption | null;
  city: string;
}

const emptyForm = (): NewCustomerForm => ({
  name: '',
  mobile: '',
  email: '',
  gstin: '',
  state: null,
  city: '',
});

const mapPartyToCustomer = (party: PartyResponse): CustomerInfo => ({
  id: party.id,
  name: party.name,
  gstin: party.gstin ?? '',
  phone: party.phone ?? '',
  stateCode: party.state_code ?? '',
  billingAddress: party.billing_address ?? '',
  shippingAddress: party.shipping_address ?? party.billing_address ?? '',

  creditLimit: party.credit_limit ?? 0,
  openingBalance: party.opening_balance ?? 0,

  warehouse_id: party.warehouse_id ?? '',

  // warehouse name
  warehouse_name:
    (party as any).warehouse_name ??
    (party as any).warehouseName ??
    (party as any).warehouse?.name ??
    '',

  balance:
    (party as unknown as { balance?: number }).balance ??
    party.opening_balance ??
    0,
});

export default function CustomerSection({
  selected,
  onSelect,
  billingAddress,
  shippingAddress,
  onBillingAddressChange,
  onShippingAddressChange,
}: Props) {
  const [query, setQuery] = useState(selected?.name ?? '');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newForm, setNewForm] = useState<NewCustomerForm>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [mobileError, setMobileError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [saveError, setSaveError] = useState('');
  const { hasPermission } = useAuth();
  const canAddParty = hasPermission(MODULES.PARTIES, 'create');
  // Dropdown state
  const [options, setOptions] = useState<CustomerInfo[]>([]);
  const [allCustomers, setAllCustomers] = useState<CustomerInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(-1);
  const { selectedWarehouseId, selectedWarehouseName, setSelectedWarehouse } =
    useWarehouseStore();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toast = useToast();

  useEffect(() => {
    setQuery(selected?.name ?? '');
  }, [selected?.id, selected?.name]);

  console.log('Selected Warehouse ID:', selectedWarehouseId);
  console.log('Selected Warehouse Name:', selectedWarehouseName);


  useEffect(() => {
    console.log('Warehouse Changed:', selectedWarehouseId);
    setAllCustomers([]);
    setOptions([]);
    setShowDropdown(false);
    setQuery('');
  }, [selectedWarehouseId]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
        setHighlightedIdx(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch all customers (for initial dropdown)
  const fetchAllCustomers = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const response = await filterParties({ isActive: true });
      console.log('API Response:', response.data);
      const wearehouseFiltr = (response.data ?? []).filter(
        (user) => user.warehouse_id === selectedWarehouseId,
      );
      const mapped = wearehouseFiltr
        .filter((party: PartyResponse) => {
          const type = String(party.type || '').toLowerCase();
          return type === 'customer' || type === 'both';
        })
        .map(mapPartyToCustomer);
      console.log('selectedWarehouseId===>', mapped, selectedWarehouseId);
      setAllCustomers(mapped);
      setOptions(mapped);
      setShowDropdown(true);
      setHighlightedIdx(-1);
    } catch {
      setAllCustomers([]);
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [selectedWarehouseId]);

  // Filter customers based on search query
  const filterCustomers = useCallback(
    (q: string) => {
      if (!q.trim()) {
        setOptions(allCustomers);
        return;
      }
      const searchLower = q.toLowerCase();
      const filtered = allCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(searchLower) ||
          c.phone.toLowerCase().includes(searchLower) ||
          (c.gstin.toLowerCase().includes(searchLower) &&
            c.warehouse_id === selectedWarehouseId),
      );
      setOptions(filtered);
    },
    [allCustomers, selectedWarehouseId],
  );

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (allCustomers.length > 0) {
        filterCustomers(val);
      }
    }, 300);
  };

  const handleSelect = useCallback(
    (c: CustomerInfo) => {
      setQuery(c.name);
      setOptions([]);
      setShowDropdown(false);
      setHighlightedIdx(-1);
      onSelect(c);
      setShowNewForm(false);
    },
    [onSelect],
  );

  // Arrow key navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || options.length === 0) {
      if (e.key === 'ArrowDown' && allCustomers.length === 0) {
        fetchAllCustomers();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.min(prev + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIdx >= 0 && options[highlightedIdx]) {
        handleSelect(options[highlightedIdx]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setHighlightedIdx(-1);
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIdx >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-option]');
      items[highlightedIdx]?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIdx]);

  // Mobile validation: must be exactly 10 digits
  const validateMobile = (val: string): string => {
    if (!val.trim()) return 'Mobile number is required';
    if (!/^\d{10}$/.test(val.trim()))
      return 'Mobile number must be exactly 10 digits';
    return '';
  };

  const handleSaveNew = useCallback(async () => {
    setSaveError('');
    setMobileError('');
    setEmailError('');

    if (!newForm.name.trim()) return;

    const mobileVal = newForm.mobile.trim();
    if (!mobileVal || mobileVal.length !== 10) {
      setMobileError('Mobile must be exactly 10 digits');
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

    setSaving(true);
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
        name: newForm.name.trim(),
        type: 'Customer',
        mobile: mobileVal,
        phone: mobileVal,
        email: emailVal,
        gstin: newForm.gstin.trim() || undefined,
        city: newForm.city.trim() || undefined,
        billingAddress: newForm.city.trim() || undefined,
        shippingAddress: newForm.city.trim() || undefined,
        stateCode: newForm.state?.code || undefined,
        stateName: newForm.state?.name || undefined,
        warehouseId: selectedWarehouseId && selectedWarehouseId !== 'ALL'
          ? selectedWarehouseId : undefined,
        warehouseName: selectedWarehouseId && selectedWarehouseId !== 'ALL'
          ? selectedWarehouseName : undefined,
        isActive: true,
      });

      if (!created.success || !created.data) {
        throw new Error(created.message || 'Failed to create customer');
      }

      const newCustomer = mapPartyToCustomer(created.data);
      setShowNewForm(false);
      setNewForm(emptyForm());
      setMobileError('');
      setEmailError('');
      setSaveError('');
      handleSelect(newCustomer);
      toast.success('Customer added and selected');
    } catch (err: any) {
      console.error(err);
      const msg: string = err?.message || '';
      const lo = msg.toLowerCase();
      if (lo.includes('phone') || lo.includes('mobile')) {
        setMobileError('This mobile number is already registered');
      } else if (lo.includes('email')) {
        setEmailError('This email is already registered');
      } else {
        setSaveError(msg || 'Failed to save customer. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }, [newForm, handleSelect, selectedWarehouseId, selectedWarehouseName, toast]);

  const fl =
    'w-full h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200';
  const lb = 'block text-xs text-slate-500 mb-0.5';

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
        Customer
      </h3>

      {/* Search + New */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 relative" ref={dropdownRef}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (showNewForm) return;
              if (allCustomers.length === 0) {
                fetchAllCustomers();
              } else {
                setShowDropdown(true);
              }
            }}
            placeholder="Search customer..."
            className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200"
          />
          {loadingOptions && (
            <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          )}

          {/* Dropdown */}
          {showDropdown && options.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {options.map((c, idx) => (
                <button
                  key={c.id}
                  data-option
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(c);
                  }}
                  onMouseEnter={() => setHighlightedIdx(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 text-left text-sm transition-colors ${
                    idx === highlightedIdx
                      ? 'bg-indigo-50 text-[#4f46e5]'
                      : 'hover:bg-slate-50 text-[#1e293b]'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{c.name}</span>

                    {/* Phone Number */}
                    <span className="text-xs text-slate-500">{c.phone}</span>
                  </div>

                  {/* Warehouse Name */}
                  {/* <span className="text-[11px] text-indigo-500">
                    {c.warehouse_name}
                  </span> */}

                  {c.gstin && (
                    <span className="text-xs text-slate-400 ml-2 shrink-0">
                      {c.gstin}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {showDropdown &&
            !loadingOptions &&
            options.length === 0 &&
            query.trim() && (
              <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg px-3 py-3 text-xs text-slate-400">
                No customers found for "{query}"
              </div>
            )}

          {showDropdown && loadingOptions && allCustomers.length === 0 && (
            <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg px-3 py-3 flex items-center gap-2 text-xs text-slate-500">
              <i className="ri-loader-4-line animate-spin" />
              Loading customers...
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowNewForm((v) => !v)}
          className="shrink-0 flex items-center gap-1 h-9 px-3 text-xs font-semibold text-[#4f46e5] border border-indigo-200 rounded-lg hover:bg-indigo-50 cursor-pointer whitespace-nowrap transition-colors"
        >
          <i className="ri-user-add-line" />
          {showNewForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {/* New customer form */}
      {showNewForm && canAddParty && (
        <div className="mb-3 p-3 bg-slate-50 border border-[#e2e8f0] rounded-lg">
          <p className="text-xs font-semibold text-slate-600 mb-2">
            New Customer
          </p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {/* Name */}
            <div>
              <label className={lb}>
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newForm.name}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, name: e.target.value }))
                }
                className={fl}
                placeholder="Customer name"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className={lb}>
                Mobile <span className="text-red-500">*</span>
              </label>
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
              {mobileError && (
                <p className="text-xs text-red-500 mt-0.5">{mobileError}</p>
              )}
              {newForm.mobile && newForm.mobile.length < 10 && !mobileError && (
                <p className="text-xs text-amber-500 mt-0.5">
                  {newForm.mobile.length}/10 digits
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className={lb}>
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={newForm.email}
                onChange={(e) => {
                  setNewForm((f) => ({ ...f, email: e.target.value }));
                  setEmailError('');
                }}
                placeholder="customer@example.com"
                className={`${fl} ${emailError ? 'border-red-400' : ''}`}
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
                value={newForm.gstin}
                onChange={(e) =>
                  setNewForm((f) => ({
                    ...f,
                    gstin: e.target.value.toUpperCase(),
                  }))
                }
                className={fl}
                placeholder="15-char GSTIN"
                maxLength={15}
              />
            </div>

            {/* State */}
            <div className="col-span-2">
              <label className={lb}>State</label>
              <StateDropdown
                value={newForm.state}
                onChange={(s) => setNewForm((f) => ({ ...f, state: s }))}
                className={fl}
              />
            </div>

            {/* City */}
            <div className="col-span-2">
              <label className={lb}>City</label>
              <input
                type="text"
                value={newForm.city}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, city: e.target.value }))
                }
                className={fl}
                placeholder="City"
              />
            </div>
          </div>

          {saveError && (
            <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
              <i className="ri-error-warning-line" /> {saveError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSaveNew}
              disabled={
                saving || !newForm.name.trim() || !newForm.mobile.trim() || !newForm.email.trim()
              }
              className="flex items-center gap-1 h-7 px-3 text-xs font-semibold bg-[#4f46e5] text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {saving ? (
                <i className="ri-loader-4-line animate-spin" />
              ) : (
                <i className="ri-save-line" />
              )}
              Save &amp; Select
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewForm(false);
                setNewForm(emptyForm());
                setMobileError('');
                setEmailError('');
                setSaveError('');
              }}
              className="flex items-center gap-1 h-7 px-3 text-xs font-medium text-slate-500 border border-[#e2e8f0] rounded-lg hover:bg-slate-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-close-line" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Selected customer details */}
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
            <label className={lb}>Billing Address</label>
            <textarea
              value={billingAddress}
              onChange={(e) => onBillingAddressChange(e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200 resize-none"
              placeholder="Billing address"
            />
          </div>
          <div>
            <label className={lb}>Shipping Address</label>
            <textarea
              value={shippingAddress}
              onChange={(e) => onShippingAddressChange(e.target.value)}
              rows={2}
              className="w-full px-2 py-1.5 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200 resize-none"
              placeholder="Same as billing"
            />
          </div>
        </div>
      )}
    </div>
  );
}
