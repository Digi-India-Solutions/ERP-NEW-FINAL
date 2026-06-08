import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useDebouncedValue } from '@/utils/debounce';
import { filterItems, type ItemResponse } from '@/api/item.api';
import { formatINR } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
export interface SelectedItem {
  id: string; name: string; code: string;
  hsnCode: string; taxRate: number;
  purchaseRate: number; saleRate: number;
  currentStock: number; unit: string; unitId: string;
  categoryId?: string;
  isActive?: boolean;
}

interface DropdownPos {
  top: number;
  left: number;
  width: number;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  onSelect: (item: SelectedItem) => void;
  warehouseId?: string;
  placeholder?: string;
  rateType?: 'sale' | 'purchase';
  'data-nav-index'?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** When provided, shows "+ Add New Item" at the bottom of the dropdown */
  onAddNew?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

const mapItemToSelected = (item: ItemResponse): SelectedItem => ({
  id: item.id,
  name: item.name,
  code: item.code ?? '',
  hsnCode: item.hsn_code ?? '',
  taxRate: Number(item.gst_rate ?? 18),
  purchaseRate: Number(item.purchase_rate ?? 0),
  saleRate: Number(item.sale_rate ?? 0),
  currentStock: Number((item as ItemResponse & { stock?: number }).stock ?? 0),
  unit: item.unit_name ?? 'Pcs',
  unitId: item.primary_unit_id ?? '',
  categoryId: item.category_id ?? '',
  isActive: item.is_active ?? true,
});

export default function ItemSearchInput({
  value, onChange, onSelect, warehouseId,
  placeholder = 'Search item...', rateType = 'sale',
  onKeyDown, onAddNew, onFocus: onFocusProp, onBlur: onBlurProp, ...rest
}: Props) {
  const navigate = useNavigate();
  const [results, setResults] = useState<SelectedItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(-1);
  const [dropPos, setDropPos] = useState<DropdownPos>({ top: 0, left: 0, width: 240 });
  const [inactiveWarning, setInactiveWarning] = useState<SelectedItem | null>(null);
  const {hasPermission} = useAuth();
  const canAddItem = hasPermission(MODULES.ITEMS, 'create')
  const debounced = useDebouncedValue(value, 300);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef(false);
  const userTypingRef = useRef(false);

  // Stable refs for callbacks to use inside effects without stale closures
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  // ── Calculate dropdown position from input rect ──────────────────────────
  const calcDropPos = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 320),
    });
  }, []);

  // ── Fetch results ─────────────────────────────────────────────────────────
  useEffect(() => {
    // Avoid opening dropdown when value is restored from tab draft/hydration.
    if (!isFocusedRef.current && !userTypingRef.current) {
      setResults([]);
      setOpen(false);
      return;
    }

    if (debounced.length < 2) { setResults([]); setOpen(false); return; }

    // ── Barcode detection: all digits, 8-13 characters ──────────────────────
    const isBarcode = /^\d{8,13}$/.test(debounced.trim());

    setLoading(true);
    const search = async () => {
      try {
        const response = await filterItems({
          search: debounced.trim(),
          categoryId: 'ALL',
          categoryName: 'ALL',
          warehouseId,
        });

        const mapped = (response.data ?? []).map(mapItemToSelected);

        if (isBarcode && mapped.length > 0) {
          const exact = mapped.find((item) => item.code === debounced.trim());
          if (exact) {
            onSelectRef.current(exact);
            setOpen(false);
            setHighlightIdx(-1);
            setResults([]);
            return;
          }
        }

        setResults(mapped);
        calcDropPos();
        setOpen(true);
        setHighlightIdx(-1);
      } finally {
        setLoading(false);
        userTypingRef.current = false;
      }
    };
    void search();
  }, [debounced, calcDropPos]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideInput = inputRef.current?.contains(target);
      const insideDrop = dropdownRef.current?.contains(target);
      if (!insideInput && !insideDrop) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  // ── Recalculate position on scroll/resize ─────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const update = () => calcDropPos();
    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [open, calcDropPos]);

  // ── Select item ───────────────────────────────────────────────────────────
  const selectItem = useCallback((item: SelectedItem) => {
    // Check if item is inactive - block selection
    if (!item.isActive) {
      setInactiveWarning(item);
      return;
    }
    onSelect(item);
    setOpen(false);
    setHighlightIdx(-1);
  }, [onSelect]);

  // ── Keyboard handler ──────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIdx((i) => Math.min(i + 1, results.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIdx((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        if (highlightIdx >= 0 && results[highlightIdx]) {
          e.preventDefault();
          e.stopPropagation();
          selectItem(results[highlightIdx]);
          return;
        }
        // No highlight — let nav system handle
        setOpen(false);
      }
      if (e.key === 'Escape') {
        e.stopPropagation();
        setOpen(false);
        setHighlightIdx(-1);
        return;
      }
    }
    onKeyDown?.(e);
  };

  // ── Dropdown element (rendered via portal) ────────────────────────────────
  const hasOptions = results.length > 0 || !!onAddNew;
  const dropdown = open && hasOptions ? createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 9999,
      }}
      className="bg-white border border-[#e2e8f0] rounded-lg shadow-xl max-h-52 overflow-y-auto"
    >
      {results.length > 0 && (
        <div className="grid grid-cols-4 px-3 py-1.5 text-[10px] font-semibold uppercase text-slate-400 border-b border-slate-100 bg-slate-50 sticky top-0">
          <span>Item</span>
          <span className="text-right">Code</span>
          <span className="text-right">Stock</span>
          <span className="text-right">Rate</span>
        </div>
      )}
      {results.map((item, idx) => (
        <button
          key={item.id}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); selectItem(item); }}
          className={`w-full grid grid-cols-4 px-3 py-2 text-sm text-left cursor-pointer transition-colors ${
            idx === highlightIdx
              ? 'bg-indigo-50 text-[#4f46e5]'
              : 'hover:bg-slate-50 text-[#1e293b]'
          } ${!item.isActive ? 'opacity-50' : ''}`}
          title={!item.isActive ? 'Item is inactive - click to activate' : ''}
        >
          <span className="truncate font-medium flex items-center gap-1.5">
            {item.name}
            {!item.isActive && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold whitespace-nowrap">
                Inactive
              </span>
            )}
          </span>
          <span className="text-right text-slate-400 text-xs">{item.code}</span>
          <span className={`text-right text-xs ${item.currentStock < 10 ? 'text-red-500' : 'text-slate-500'}`}>
            {item.currentStock}
          </span>
          <span className="text-right text-xs font-medium">
            {formatINR(rateType === 'sale' ? item.saleRate : item.purchaseRate)}
          </span>
        </button>
      ))}
      {onAddNew && canAddItem && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen(false);
            onAddNew();
          }}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[#4f46e5] font-semibold hover:bg-indigo-50 cursor-pointer border-t border-slate-100 transition-colors"
        >
          <i className="ri-add-circle-line text-base" />
          Add New Item
        </button>
      )}
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onInput={() => { userTypingRef.current = true; }}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          isFocusedRef.current = true;
          if (results.length > 0) {
            calcDropPos();
            setOpen(true);
          }
          onFocusProp?.();
        }}
        onBlur={() => {
          isFocusedRef.current = false;
          onBlurProp?.();
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full h-9 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 text-[#1e293b]"
        {...(rest['data-nav-index'] !== undefined ? { 'data-nav-index': rest['data-nav-index'] } : {})}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {dropdown}

      {/* Inactive Item Warning Dialog */}
      {inactiveWarning && (
        <ConfirmDialog
          open={!!inactiveWarning}
          title="Inactive Item"
          message={`"${inactiveWarning.name}" is currently inactive. Please activate this item first.`}
          variant="danger"
          confirmLabel="Go to Items Master"
          cancelLabel="Cancel"
          onConfirm={() => {
              setInactiveWarning(null);
              navigate('/masters/items', { state: { searchId: inactiveWarning.id } });
          }}
          onCancel={() => {
            setInactiveWarning(null);
            // Keep dropdown open to select another item
            if (results.length > 0) {
              setOpen(true);
            }
          }}
        />
      )}
    </div>
  );
}
