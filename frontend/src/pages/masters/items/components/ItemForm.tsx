import { useState, useRef, useCallback, useEffect } from 'react';
import { filterItems, mapApiToItem } from '@/api/item.api';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { getWarehousesForUser } from '@/api/warehouse.api';
import { useAuth } from '@/contexts/AuthContext';

// ─── Config ───────────────────────────────────────────────────────────────────
const BASE_URL =
  (import.meta.env.VITE_API_URL as string) ||
  'http://localhost:7000';

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}
function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

// ─── Types ────────────────────────────────────────────────────────────────────
type WarehouseType = 'MAIN' | 'TRANSIT' | 'RETURN' | 'COLD' | string;

interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  isActive: boolean;
}

export interface WarehouseResponse {
  id: string;
  company_id: string;
  name: string;
  type: WarehouseType;
  address: string;
  incharge_name: string;
  incharge_phone: string;
  incharge_user_id: string | null;
  color: string | null;
  is_active: boolean;
  is_primary?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

const TYPE_BADGE: Record<string, { label: string; icon: string; cls: string }> =
  {
    MAIN: {
      label: 'Main',
      icon: 'ri-store-3-line',
      cls: 'bg-indigo-100 text-indigo-600',
    },
    TRANSIT: {
      label: 'Transit',
      icon: 'ri-truck-line',
      cls: 'bg-amber-100  text-amber-600',
    },
    RETURN: {
      label: 'Return',
      icon: 'ri-arrow-go-back-line',
      cls: 'bg-rose-100   text-rose-600',
    },
    COLD: {
      label: 'Cold',
      icon: 'ri-temp-cold-line',
      cls: 'bg-sky-100    text-sky-600',
    },
  };

const ITEM_TYPES = [
  'Raw Material',
  'Finished Good',
  'Semi-Finished',
  'Consumable',
  'Service',
  'Asset',
];

// ─── SearchableSelect ─────────────────────────────────────────────────────────
interface SelectOption {
  id: string;
  name: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (id: string) => void;
  options: SelectOption[];
  placeholder?: string;
  loading?: boolean;
  error?: boolean;
  navIndex?: number;
  disabled?: boolean;
}

function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Search…',
  loading,
  error,
  navIndex,
  disabled,
}: SearchableSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = query.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };
  const handleOpen = () => {
    if (disabled || loading) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className="relative" data-nav-index={navIndex}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled || loading}
        className={`w-full h-10 px-3 rounded-lg border text-sm text-left flex items-center justify-between bg-white focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
        }`}
      >
        <span className={selected ? 'text-[#1e293b]' : 'text-[#94a3b8]'}>
          {loading ? 'Loading…' : selected ? selected.name : placeholder}
        </span>
        <i
          className={`ri-arrow-down-s-line text-[#94a3b8] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#e2e8f0] rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#f1f5f9]">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                    setQuery('');
                  }
                  if (e.key === 'Enter' && filtered.length === 1)
                    handleSelect(filtered[0].id);
                }}
                placeholder="Type to filter…"
                className="w-full h-8 px-3 pl-7 rounded-md border border-[#e2e8f0] text-sm text-[#1e293b] focus:outline-none focus:border-[#4f46e5]"
              />
              <i className="ri-search-line absolute left-2 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
            </div>
          </div>

          <ul className="max-h-48 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => handleSelect('')}
                className="w-full px-3 py-2 text-sm text-left text-[#94a3b8] hover:bg-[#f8fafc] cursor-pointer"
              >
                — None —
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-center text-[#94a3b8]">
                No results for "{query}"
              </li>
            ) : (
              filtered.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(o.id)}
                    className={`w-full px-3 py-2 text-sm text-left flex items-center justify-between hover:bg-[#f1f5f9] cursor-pointer transition-colors ${
                      o.id === value
                        ? 'bg-[#eef2ff] text-[#4f46e5] font-medium'
                        : 'text-[#1e293b]'
                    }`}
                  >
                    {o.name}
                    {o.id === value && (
                      <i className="ri-check-line text-[#4f46e5]" />
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>

          <div className="px-3 py-1.5 border-t border-[#e2e8f0] text-[10px] text-[#94a3b8]">
            {filtered.length} of {options.length} shown
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WarehouseSelect ──────────────────────────────────────────────────────────
interface WarehouseSelectProps {
  value: string;
  onChange: (id: string, name: string) => void;
  warehouses: Warehouse[];
  loading?: boolean;
  error?: boolean;
}

function WarehouseSelect({
  value,
  onChange,
  warehouses,
  loading,
  error,
}: WarehouseSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = warehouses.find((w) => w.id === value);
  const selectedBadge = selected ? (TYPE_BADGE[selected.type] ?? null) : null;

  const filtered = query.trim()
    ? warehouses.filter(
        (w) =>
          w.name.toLowerCase().includes(query.toLowerCase()) ||
          w.type.toLowerCase().includes(query.toLowerCase()),
      )
    : warehouses;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (wh: Warehouse) => {
    onChange(wh.id, wh.name);
    setOpen(false);
    setQuery('');
  };
  const handleOpen = () => {
    if (loading) return;
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className={`w-full h-10 px-3 rounded-lg border text-sm text-left flex items-center gap-2 bg-white hover:border-[#4f46e5] hover:bg-indigo-50 focus:outline-none focus:ring-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
          error
            ? 'border-red-400 focus:ring-red-200'
            : 'border-[#e2e8f0] focus:ring-[#4f46e5]/20'
        }`}
      >
        {selectedBadge ? (
          <div
            className={`w-6 h-6 flex items-center justify-center rounded-md shrink-0 ${selectedBadge.cls}`}
          >
            <i className={`${selectedBadge.icon} text-xs`} />
          </div>
        ) : (
          <div className="w-6 h-6 flex items-center justify-center rounded-md shrink-0 bg-slate-100">
            <i className="ri-store-3-line text-[#94a3b8] text-xs" />
          </div>
        )}
        <span
          className={`flex-1 truncate font-medium ${selected ? 'text-[#1e293b]' : 'text-[#94a3b8]'}`}
        >
          {loading
            ? 'Loading warehouses…'
            : selected
              ? selected.name
              : 'Select warehouse…'}
        </span>
        {selectedBadge && (
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${selectedBadge.cls}`}
          >
            {selectedBadge.label}
          </span>
        )}
        <i
          className={`ri-arrow-down-s-line text-[#94a3b8] shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#e2e8f0] rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#f1f5f9]">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setOpen(false);
                    setQuery('');
                  }
                  if (e.key === 'Enter' && filtered.length === 1)
                    handleSelect(filtered[0]);
                }}
                placeholder="Search warehouse or type…"
                className="w-full h-8 px-3 pl-7 rounded-md border border-[#e2e8f0] text-sm text-[#1e293b] focus:outline-none focus:border-[#4f46e5]"
              />
              <i className="ri-search-line absolute left-2 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
            </div>
          </div>

          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-sm text-center text-[#94a3b8]">
                No warehouses match "{query}"
              </li>
            ) : (
              filtered.map((wh) => {
                const badge = TYPE_BADGE[wh.type] ?? null;
                const isSelected = wh.id === value;
                return (
                  <li key={wh.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(wh)}
                      className={`w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-[#f8fafc] cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50' : ''
                      }`}
                    >
                      <div
                        className={`w-7 h-7 flex items-center justify-center rounded-lg shrink-0 ${badge?.cls ?? 'bg-slate-100 text-slate-500'}`}
                      >
                        <i
                          className={`${badge?.icon ?? 'ri-store-3-line'} text-sm`}
                        />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p
                          className={`text-sm font-medium truncate ${isSelected ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}
                        >
                          {wh.name}
                        </p>
                        <p className="text-[10px] text-[#94a3b8]">
                          {badge?.label ?? wh.type}
                        </p>
                      </div>
                      {isSelected && (
                        <i className="ri-check-line text-[#4f46e5] shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          <div className="px-3 py-1.5 border-t border-[#e2e8f0] text-[10px] text-[#94a3b8]">
            {filtered.length} of {warehouses.length} warehouses
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toggle Row ───────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div>
        <p className="text-sm font-medium text-[#1e293b]">{label}</p>
        <p className="text-xs text-[#94a3b8] mt-0.5">{hint}</p>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative w-10 h-6 rounded-full shrink-0 mt-0.5 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 ${
          value ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
            value ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

// ─── ItemForm types ───────────────────────────────────────────────────────────
export interface ItemFormData {
  // Basic Info
  name: string;
  code: string;
  barcode: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  hsnCode: string;
  taxRate: number;
  unitId: string;
  unitName: string;
  purchaseRate: number;
  saleRate: number;
  minStockLevel: number;
  articleNo: string;
  isActive: boolean;
  warehouseId: string;
  // Manufacturing
  itemType: string;
  itemGroup: string;
  drawingNumber: string;
  specifications: string;
  productionUnit: string;
  standardCost: number;
  supplierLeadTime: number;
  reorderPoint: number;
  reorderQty: number;
  // Tracking
  enableBatchTracking: boolean;
  enableSerialTracking: boolean;
  requiresIncomingQC: boolean;
  requiresFinalQC: boolean;
}

interface ItemFormProps {
  open: boolean;
  initialData?: Partial<ItemFormData>;
  isEditing: boolean;
  onClose: () => void;
  onSave: (data: ItemFormData) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GST_RATES = [0, 5, 12, 18, 28];

const defaultForm: ItemFormData = {
  name: '',
  code: '',
  barcode: '',
  categoryId: '',
  categoryName: '',
  brand: '',
  hsnCode: '',
  taxRate: 18,
  unitId: '',
  unitName: '',
  purchaseRate: 0,
  saleRate: 0,
  minStockLevel: 5,
  articleNo: '',
  isActive: true,
  warehouseId: '',
  // Manufacturing
  itemType: 'Raw Material',
  itemGroup: '',
  drawingNumber: '',
  specifications: '',
  productionUnit: '',
  standardCost: 0,
  supplierLeadTime: 0,
  reorderPoint: 0,
  reorderQty: 0,
  // Tracking
  enableBatchTracking: false,
  enableSerialTracking: false,
  requiresIncomingQC: false,
  requiresFinalQC: false,
};

type ActiveTab = 'basic' | 'manufacturing' | 'tracking';

// ─── ItemForm ─────────────────────────────────────────────────────────────────
export default function ItemForm({
  open,
  initialData,
  isEditing,
  onClose,
  onSave,
}: ItemFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const barcodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { selectedWarehouseId, setSelectedWarehouse } = useWarehouseStore();
  const { hasControl } = useAuth();
  const canViewAll = hasControl('viewAllWarehouses');

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ActiveTab>('basic');
  const [form, setForm] = useState<ItemFormData>(() => ({
    ...defaultForm,
    ...initialData,
    warehouseId: isEditing
      ? (initialData?.warehouseId ?? '')
      : (selectedWarehouseId ?? ''),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [autoCode, setAutoCode] = useState(!isEditing);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [barcodeMsg, setBarcodeMsg] = useState<{
    type: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [units, setUnits] = useState<SelectOption[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [dropdownsLoading, setDropdownsLoading] = useState(false);
  const [warehousesLoading, setWarehousesLoading] = useState(false);

  // ── Fetch categories + units ───────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setDropdownsLoading(true);
    void (async () => {
      try {
        const [catRes, unitRes] = await Promise.all([
          fetch(`${BASE_URL}/api/v1/categories/all`, {
            headers: authHeaders(),
          }),
          fetch(`${BASE_URL}/api/v1/unit/all`, { headers: authHeaders() }),
        ]);
        const [catData, unitData] = await Promise.all([
          catRes.json(),
          unitRes.json(),
        ]);
        if (!mounted) return;
        setCategories(catData.data ?? []);
        setUnits(unitData.data ?? []);
      } catch {
        // silent
      } finally {
        if (mounted) setDropdownsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ── Fetch warehouses ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setWarehousesLoading(true);
    void (async () => {
      try {
        const res = await getWarehousesForUser(canViewAll);
        if (!mounted) return;
        const rows: Warehouse[] = (res.data ?? []).map(
          (w: WarehouseResponse) => ({
            id: w.id,
            name: w.name,
            type: w.type,
            isActive: w.is_active,
          }),
        );
        setWarehouses(rows.filter((w) => w.isActive));
      } catch {
        if (mounted) setWarehouses([]);
      } finally {
        if (mounted) setWarehousesLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [canViewAll]);

  // ── Reset on open ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const warehouseId = isEditing
      ? (initialData?.warehouseId ?? '')
      : (selectedWarehouseId ?? '');

    setForm({ ...defaultForm, ...initialData, warehouseId });
    setAutoCode(!isEditing);
    setActiveTab('basic');
    setErrors({});
    setApiError('');
    setBarcodeMsg(null);
    setDuplicateWarning(null);
    setTimeout(() => barcodeRef.current?.focus(), 80);
  }, [open, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Stable field updater ───────────────────────────────────────────────────
  const update = useCallback(
    (field: keyof ItemFormData, value: string | number | boolean) => {
      setForm((p) => ({ ...p, [field]: value }));
      setApiError('');
      setErrors((e) => {
        if (!e[field]) return e;
        const n = { ...e };
        delete n[field];
        return n;
      });
    },
    [],
  );

  const clearError = useCallback((field: string) => {
    setErrors((e) => {
      if (!e[field]) return e;
      const n = { ...e };
      delete n[field];
      return n;
    });
  }, []);

  const onCategoryChange = useCallback(
    (catId: string) => {
      setForm((p) => {
        const cat = categories.find((c) => c.id === catId);
        return { ...p, categoryId: catId, categoryName: cat?.name ?? '' };
      });
      clearError('categoryId');
    },
    [categories, clearError],
  );

  const onUnitChange = useCallback(
    (unitId: string) => {
      setForm((p) => {
        const unit = units.find((u) => u.id === unitId);
        return { ...p, unitId, unitName: unit?.name ?? '' };
      });
      clearError('unitId');
    },
    [units, clearError],
  );

  const onWarehouseChange = useCallback(
    (id: string, name: string) => {
      setForm((p) => ({ ...p, warehouseId: id }));
      setSelectedWarehouse(id, name);
      clearError('warehouseId');
    },
    [setSelectedWarehouse, clearError],
  );

  // ── Barcode search ─────────────────────────────────────────────────────────
  const handleBarcodeChange = useCallback(
    async (val: string) => {
      setForm((p) => ({ ...p, barcode: val }));
      setDuplicateWarning(null);
      setApiError('');
      if (!val.trim() || val.trim().length < 3) return;

      if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current);
      barcodeDebounceRef.current = setTimeout(async () => {
        try {
          const res = await filterItems({ search: val.trim() });
          const found = (res.data ?? []).find(
            (r: any) => r.barcode === val.trim() || r.code === val.trim(),
          );
          if (!found) return;
          const mapped = mapApiToItem(found);
          setForm((prev) => ({ ...prev, ...mapped, barcode: val.trim() }));
          setAutoCode(false);
          const isSelf = isEditing && found.code === initialData?.code;
          if (isSelf) {
            setBarcodeMsg({
              type: 'success',
              text: `Item found: ${mapped.name}`,
            });
            setTimeout(() => setBarcodeMsg(null), 3000);
          } else {
            setDuplicateWarning(
              `Barcode already used by: "${found.name}" (Code: ${found.code})`,
            );
          }
        } catch {
          /* silent */
        }
      }, 400);
    },
    [isEditing, initialData?.code],
  );

  // ── Name duplicate check ───────────────────────────────────────────────────
  const handleNameChange = useCallback(
    async (val: string) => {
      setForm((p) => ({ ...p, name: val }));
      setDuplicateWarning(null);
      setApiError('');
      if (!val.trim() || val.trim().length < 3) return;

      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
      nameDebounceRef.current = setTimeout(async () => {
        try {
          const res = await filterItems({ search: val.trim() });
          const found = (res.data ?? []).find(
            (r: any) => r.name.toLowerCase() === val.trim().toLowerCase(),
          );
          if (!found) return;
          const mapped = mapApiToItem(found);
          setForm((prev) => ({ ...prev, ...mapped, name: val.trim() }));
          setAutoCode(false);
          const isSelf = isEditing && found.code === initialData?.code;
          if (isSelf) {
            setBarcodeMsg({
              type: 'success',
              text: `Item found: ${mapped.name}`,
            });
            setTimeout(() => setBarcodeMsg(null), 3000);
          } else {
            setDuplicateWarning(
              `An item named "${found.name}" already exists (Code: ${found.code})`,
            );
          }
        } catch {
          /* silent */
        }
      }, 400);
    },
    [isEditing, initialData?.code],
  );

  // Cleanup debounces on unmount
  useEffect(
    () => () => {
      if (barcodeDebounceRef.current) clearTimeout(barcodeDebounceRef.current);
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    },
    [],
  );

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (currentForm: ItemFormData) => {
    const e: Record<string, string> = {};
    if (!currentForm.name.trim()) e.name = 'Item name is required';
    if (!autoCode && !currentForm.code.trim()) e.code = 'Item code is required';
    if (!currentForm.hsnCode.trim()) e.hsnCode = 'HSN code is required';
    if (!currentForm.warehouseId) e.warehouseId = 'Please select a warehouse';
    if (
      currentForm.saleRate > 0 &&
      currentForm.purchaseRate > 0 &&
      currentForm.saleRate < currentForm.purchaseRate
    ) {
      e.saleRate = 'Sale rate is lower than purchase rate';
    }
    setErrors(e);
    // If error is on basic tab, switch to it
    if (e.name || e.code || e.hsnCode || e.warehouseId || e.saleRate) {
      setActiveTab('basic');
    }
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    let snapshot!: ItemFormData;
    setForm((f) => {
      snapshot = f;
      return f;
    });
    await new Promise<void>((r) => setTimeout(r, 0));
    setForm((f) => {
      snapshot = f;
      return f;
    });
    if (!validate(snapshot)) return;

    setIsSaving(true);
    setApiError('');
    try {
      await onSave(snapshot);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const margin =
    form.purchaseRate > 0 && form.saleRate > 0
      ? (
          ((form.saleRate - form.purchaseRate) / form.purchaseRate) *
          100
        ).toFixed(1)
      : null;
  const marginVal = margin !== null ? parseFloat(margin) : null;

  const selectedWarehouse = warehouses.find((w) => w.id === form.warehouseId);
  const selectedWHBadge = selectedWarehouse
    ? (TYPE_BADGE[selectedWarehouse.type] ?? null)
    : null;

  const TABS: { key: ActiveTab; label: string; icon: string }[] = [
    { key: 'basic', label: 'Basic Info', icon: 'ri-information-line' },
    {
      key: 'manufacturing',
      label: 'Manufacturing',
      icon: 'ri-settings-3-line',
    },
    { key: 'tracking', label: 'Tracking', icon: 'ri-radar-line' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={formRef}
        className="relative ml-auto h-full w-full max-w-lg bg-white shadow-2xl flex flex-col"
      >
        {/* ── Header ── */}
        <div className="px-6 pt-4 pb-0 border-b border-[#e2e8f0] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-[#1e293b]">
                {isEditing ? 'Edit Item' : 'Add New Item'}
              </h3>
              <p className="text-xs text-[#64748b] mt-0.5">
                Scan barcode or fill details manually
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer transition-colors"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="flex gap-0">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 h-9 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-[#4f46e5] text-[#4f46e5]'
                    : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
                }`}
              >
                <i className={`${tab.icon} text-sm`} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Error banner ── */}
        {apiError && (
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm shrink-0">
            <i className="ri-error-warning-line text-base shrink-0 mt-0.5" />
            <p>{apiError}</p>
          </div>
        )}

        {/* ── Duplicate warning ── */}
        {duplicateWarning && (
          <div className="mx-6 mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm shrink-0">
            <i className="ri-error-warning-line text-base shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Duplicate item detected</p>
              <p>{duplicateWarning}</p>
              <p className="mt-1 text-xs text-amber-600">
                Details have been auto-filled. Clear the name/barcode to create
                a new item.
              </p>
            </div>
          </div>
        )}

        {/* ── Form body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* ════════════════════════════════════════
              BASIC INFO TAB
          ════════════════════════════════════════ */}
          {activeTab === 'basic' && (
            <>
              {/* ── WAREHOUSE ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide flex items-center gap-2">
                  Warehouse <span className="text-red-500">*</span>
                  {warehousesLoading && (
                    <i className="ri-loader-4-line animate-spin text-[#94a3b8]" />
                  )}
                </label>
                <WarehouseSelect
                  value={form.warehouseId}
                  onChange={onWarehouseChange}
                  warehouses={warehouses}
                  loading={warehousesLoading}
                  error={!!errors.warehouseId}
                />
                {errors.warehouseId && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <i className="ri-error-warning-line" /> {errors.warehouseId}
                  </p>
                )}
              </div>

              <div className="border-t border-[#f1f5f9]" />

              {/* ── BARCODE ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide flex items-center gap-2">
                  Barcode
                  <span className="flex items-center gap-1 text-[10px] text-green-600 font-medium normal-case">
                    <span className="relative flex w-1.5 h-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full w-1.5 h-1.5 bg-green-500" />
                    </span>
                    Scan or type
                  </span>
                </label>
                <div className="relative">
                  <input
                    ref={barcodeRef}
                    type="text"
                    value={form.barcode}
                    onChange={(e) => void handleBarcodeChange(e.target.value)}
                    placeholder="Scan barcode or type manually"
                    data-nav-index={0}
                    className="w-full h-10 px-3 pl-9 rounded-lg border border-[#e2e8f0] text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                  />
                  <i className="ri-barcode-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-base" />
                </div>
                {barcodeMsg && (
                  <p
                    className={`text-xs flex items-center gap-1 ${
                      barcodeMsg.type === 'success'
                        ? 'text-green-600'
                        : barcodeMsg.type === 'error'
                          ? 'text-red-500'
                          : 'text-amber-600'
                    }`}
                  >
                    <i
                      className={
                        barcodeMsg.type === 'success'
                          ? 'ri-checkbox-circle-fill'
                          : barcodeMsg.type === 'error'
                            ? 'ri-error-warning-line'
                            : 'ri-information-line'
                      }
                    />
                    {barcodeMsg.text}
                  </p>
                )}
              </div>

              {/* ── NAME ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => void handleNameChange(e.target.value)}
                  placeholder='Laptop 15" Core i7'
                  data-nav-index={1}
                  className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                    errors.name
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* ── CODE ── */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    Item Code <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !autoCode;
                      setAutoCode(next);
                      if (next) update('code', '');
                    }}
                    className="text-[10px] text-[#4f46e5] font-medium cursor-pointer hover:text-indigo-700"
                  >
                    {autoCode ? 'Switch to Manual' : 'Auto-generate'}
                  </button>
                </div>
                <input
                  type="text"
                  value={autoCode ? 'Auto-generated' : form.code}
                  onChange={(e) => update('code', e.target.value.toUpperCase())}
                  readOnly={autoCode}
                  placeholder="ITM-0301"
                  data-nav-index={2}
                  className={`w-full h-10 px-3 rounded-lg border text-sm font-mono focus:outline-none focus:ring-2 transition-colors ${
                    autoCode
                      ? 'bg-[#f8fafc] text-slate-400 cursor-default'
                      : 'bg-white text-[#1e293b]'
                  } ${
                    errors.code
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                  }`}
                />
                {errors.code && (
                  <p className="text-xs text-red-500">{errors.code}</p>
                )}
              </div>

              {/* ── CATEGORY ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide flex items-center gap-2">
                  Category
                  {dropdownsLoading && (
                    <i className="ri-loader-4-line animate-spin text-[#94a3b8]" />
                  )}
                </label>
                <SearchableSelect
                  value={form.categoryId}
                  onChange={onCategoryChange}
                  options={categories}
                  placeholder={`Select category… (${categories.length} available)`}
                  loading={dropdownsLoading}
                  navIndex={3}
                />
              </div>

              {/* ── BRAND ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Brand
                </label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={(e) => update('brand', e.target.value)}
                  placeholder="Brand name"
                  data-nav-index={4}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
              </div>

              {/* ── HSN ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  HSN Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.hsnCode}
                  onChange={(e) => update('hsnCode', e.target.value)}
                  placeholder="84713010"
                  data-nav-index={5}
                  className={`w-full h-10 px-3 rounded-lg border text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                    errors.hsnCode
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                  }`}
                />
                {errors.hsnCode && (
                  <p className="text-xs text-red-500">{errors.hsnCode}</p>
                )}
              </div>

              {/* ── ARTICLE NO ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Article No.
                </label>
                <input
                  type="text"
                  value={form.articleNo}
                  onChange={(e) => update('articleNo', e.target.value)}
                  placeholder="ART-1001"
                  data-nav-index={6}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
              </div>

              {/* ── PURCHASE + SALE RATE ── */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    Purchase Rate (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.purchaseRate || ''}
                    onChange={(e) =>
                      update('purchaseRate', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    data-nav-index={7}
                    className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    Sale Rate (₹)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.saleRate || ''}
                    onChange={(e) =>
                      update('saleRate', parseFloat(e.target.value) || 0)
                    }
                    placeholder="0"
                    data-nav-index={8}
                    className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                      errors.saleRate
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                    }`}
                  />
                  {errors.saleRate && (
                    <p className="text-xs text-red-500">{errors.saleRate}</p>
                  )}
                </div>
              </div>

              {/* Margin indicator */}
              {marginVal !== null && (
                <div
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg ${
                    marginVal < 0
                      ? 'bg-red-50 text-red-600'
                      : marginVal < 10
                        ? 'bg-amber-50 text-amber-600'
                        : 'bg-green-50 text-green-600'
                  }`}
                >
                  <i
                    className={
                      marginVal < 0 ? 'ri-arrow-down-line' : 'ri-arrow-up-line'
                    }
                  />
                  Margin: {margin}%&nbsp;&nbsp;|&nbsp;&nbsp;Profit: ₹
                  {(form.saleRate - form.purchaseRate).toLocaleString()} per
                  unit
                </div>
              )}

              {/* ── GST RATE ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  GST Rate <span className="text-red-500">*</span>
                </label>
                <div
                  tabIndex={0}
                  data-nav-index={9}
                  onKeyDown={(e) => {
                    const idx = GST_RATES.indexOf(form.taxRate);
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      update(
                        'taxRate',
                        GST_RATES[Math.min(idx + 1, GST_RATES.length - 1)],
                      );
                    }
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      update('taxRate', GST_RATES[Math.max(idx - 1, 0)]);
                    }
                  }}
                  className="flex gap-1.5 rounded-lg p-0.5 focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30"
                >
                  {GST_RATES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => update('taxRate', r)}
                      className={`flex-1 h-10 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        form.taxRate === r
                          ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                          : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]'
                      }`}
                    >
                      {r}%
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#94a3b8]">
                  Use ← → arrow keys to change when focused
                </p>
              </div>

              {/* ── UNIT ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide flex items-center gap-2">
                  Unit <span className="text-red-500">*</span>
                  {dropdownsLoading && (
                    <i className="ri-loader-4-line animate-spin text-[#94a3b8]" />
                  )}
                </label>
                <SearchableSelect
                  value={form.unitId}
                  onChange={onUnitChange}
                  options={units}
                  placeholder={`Select unit… (${units.length} available)`}
                  loading={dropdownsLoading}
                  error={!!errors.unitId}
                  navIndex={10}
                />
                {errors.unitId && (
                  <p className="text-xs text-red-500">{errors.unitId}</p>
                )}
              </div>

              {/* ── MIN STOCK ── */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Min Stock Level
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.minStockLevel}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    update('minStockLevel', val === '' ? 0 : parseInt(val, 10));
                  }}
                  data-nav-index={11}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
              </div>

              {/* ── ACTIVE TOGGLE ── */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => update('isActive', !form.isActive)}
                  className={`relative w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/30 ${
                    form.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'
                  }`}
                >
                  <span
                    className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                      form.isActive ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
                <label className="text-sm text-[#64748b] select-none">
                  {form.isActive ? 'Active Item' : 'Inactive Item'}
                </label>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
              MANUFACTURING TAB
          ════════════════════════════════════════ */}
          {activeTab === 'manufacturing' && (
            <>
              {/* Classification */}
              <div>
                <p className="text-[11px] font-bold text-[#1e293b] uppercase tracking-widest mb-3">
                  Classification
                </p>
                <div className="space-y-4">
                  {/* Item Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Item Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={form.itemType}
                      onChange={(e) => update('itemType', e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 cursor-pointer"
                    >
                      {ITEM_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Item Group */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Item Group
                    </label>
                    <input
                      type="text"
                      value={form.itemGroup}
                      onChange={(e) => update('itemGroup', e.target.value)}
                      placeholder="e.g. Metals, Electronics, Plastics"
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                    />
                  </div>

                  {/* Drawing Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Drawing Number
                    </label>
                    <input
                      type="text"
                      value={form.drawingNumber}
                      onChange={(e) => update('drawingNumber', e.target.value)}
                      placeholder="e.g. DWG-001-A"
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                    />
                  </div>

                  {/* Specifications */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Specifications
                    </label>
                    <textarea
                      value={form.specifications}
                      onChange={(e) => update('specifications', e.target.value)}
                      placeholder="Technical specs, dimensions, grade, tolerances..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-[#f1f5f9]" />

              {/* Production Details */}
              <div>
                <p className="text-[11px] font-bold text-[#1e293b] uppercase tracking-widest mb-3">
                  Production Details
                </p>
                <div className="space-y-4">
                  {/* Production Unit */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Production Unit
                    </label>
                    <input
                      type="text"
                      value={form.productionUnit}
                      onChange={(e) => update('productionUnit', e.target.value)}
                      placeholder="Unit in production e.g. grams, ml"
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                    />
                  </div>

                  {/* Standard Cost */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Standard Cost (₹)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.standardCost || ''}
                      onChange={(e) =>
                        update('standardCost', parseFloat(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                    />
                  </div>

                  {/* Supplier Lead Time + Reorder Point */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                        Supplier Lead Time
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.supplierLeadTime || ''}
                        onChange={(e) =>
                          update(
                            'supplierLeadTime',
                            parseInt(e.target.value) || 0,
                          )
                        }
                        placeholder="0"
                        className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                        Reorder Point
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={form.reorderPoint || ''}
                        onChange={(e) =>
                          update('reorderPoint', parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                      />
                      <p className="text-[10px] text-[#94a3b8]">
                        Alert triggered when stock hits this level
                      </p>
                    </div>
                  </div>

                  {/* Reorder Qty */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                      Reorder Qty
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form.reorderQty || ''}
                      onChange={(e) =>
                        update('reorderQty', parseInt(e.target.value) || 0)
                      }
                      placeholder="0"
                      className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                    />
                    <p className="text-[10px] text-[#94a3b8]">
                      Standard qty to reorder when triggered
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════
              TRACKING TAB
          ════════════════════════════════════════ */}
          {activeTab === 'tracking' && (
            <>
              {/* Batch and Lot Tracking */}
              <div>
                <p className="text-[11px] font-bold text-[#1e293b] uppercase tracking-widest mb-1">
                  Batch and Lot Tracking
                </p>
                <div className="divide-y divide-[#f1f5f9]">
                  <ToggleRow
                    label="Enable Batch Tracking"
                    hint="Recommended: food, pharma, chemicals, garments"
                    value={form.enableBatchTracking}
                    onChange={() =>
                      update('enableBatchTracking', !form.enableBatchTracking)
                    }
                  />
                  <ToggleRow
                    label="Enable Serial Tracking"
                    hint="Recommended: electronics, machinery, vehicles"
                    value={form.enableSerialTracking}
                    onChange={() =>
                      update('enableSerialTracking', !form.enableSerialTracking)
                    }
                  />
                </div>
              </div>

              <div className="border-t border-[#f1f5f9]" />

              {/* Quality Control */}
              <div>
                <p className="text-[11px] font-bold text-[#1e293b] uppercase tracking-widest mb-1">
                  Quality Control
                </p>
                <div className="divide-y divide-[#f1f5f9]">
                  <ToggleRow
                    label="Requires Incoming QC"
                    hint="QC check triggered after GRN save"
                    value={form.requiresIncomingQC}
                    onChange={() =>
                      update('requiresIncomingQC', !form.requiresIncomingQC)
                    }
                  />
                  <ToggleRow
                    label="Requires Final QC"
                    hint="QC check required before dispatch"
                    value={form.requiresFinalQC}
                    onChange={() =>
                      update('requiresFinalQC', !form.requiresFinalQC)
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-[#e2e8f0] shrink-0">
          {/* Warehouse quick-info pill */}
          {selectedWarehouse && (
            <div
              className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md shrink-0 ${
                selectedWHBadge?.cls ?? 'bg-slate-100 text-slate-500'
              }`}
            >
              <i
                className={`${selectedWHBadge?.icon ?? 'ri-store-3-line'} text-xs`}
              />
              <span className="truncate max-w-[120px]">
                {selectedWarehouse.name}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel (Esc)
            </button>
            <button
              onClick={() => void handleSave()}
              disabled={isSaving || !!duplicateWarning}
              data-nav-index={12}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  void handleSave();
                }
              }}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/40"
            >
              {isSaving ? (
                <>
                  <i className="ri-loader-4-line animate-spin" /> Saving…
                </>
              ) : (
                <>
                  <i className="ri-save-line" />{' '}
                  {isEditing ? 'Update Item' : 'Save Item'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
