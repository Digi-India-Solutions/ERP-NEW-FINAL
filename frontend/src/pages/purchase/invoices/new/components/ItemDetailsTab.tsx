import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PurchaseRow } from '@/types/billing';
import { calcPurchaseRowAmount } from '@/types/billing';
import { formatINR } from '@/utils/format';

// ─── Barcode helpers ──────────────────────────────────────────────────────────
const BARCODE_SETTINGS_KEY = 'invenpro_barcode_settings';
interface StoredBarcodeSettings {
  format: 'EAN13' | 'CODE128';
  length: number;
  prefix: string;
  startingNumber: number;
  lastUsedNumber: number;
}
function getNextBarcode(): string {
  try {
    const raw = localStorage.getItem(BARCODE_SETTINGS_KEY);
    const defaults: StoredBarcodeSettings = {
      format: 'CODE128',
      length: 13,
      prefix: '',
      startingNumber: 1,
      lastUsedNumber: 0,
    };
    const s: StoredBarcodeSettings = raw
      ? { ...defaults, ...JSON.parse(raw) }
      : defaults;
    const nextNum = (s.lastUsedNumber || 0) + 1;
    const padLen =
      s.format === 'EAN13'
        ? Math.max(0, 13 - s.prefix.length)
        : Math.max(0, (s.length || 13) - s.prefix.length);
    const padded = nextNum.toString().padStart(padLen, '0');
    const barcode = s.prefix + padded;
    localStorage.setItem(
      BARCODE_SETTINGS_KEY,
      JSON.stringify({ ...s, lastUsedNumber: nextNum }),
    );
    return barcode;
  } catch {
    return Date.now().toString().slice(-13);
  }
}

// ─── Unit option type ─────────────────────────────────────────────────────────
interface UnitOption {
  id: string;
  name: string;
  shortName?: string;
}

// ─── Searchable Unit Dropdown (portal-based, matches reference image) ─────────
interface UnitDropdownProps {
  value: string;
  unitId: string;
  units: UnitOption[];
  onChange: (name: string, id: string) => void;
  rowIdx: number;
}

function UnitDropdown({ value, units, onChange, rowIdx }: UnitDropdownProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 220 });

  const filtered = units.filter(
    (u) =>
      u.name.toLowerCase().includes(filter.toLowerCase()) ||
      (u.shortName ?? '').toLowerCase().includes(filter.toLowerCase()),
  );

  // Reset activeIndex when filter text changes
  useEffect(() => {
    setActiveIndex(0);
  }, [filter]);

  // Scroll active item into view
  useEffect(() => {
    if (open && dropdownRef.current && activeIndex >= 0) {
      const activeEl = dropdownRef.current.querySelector(
        `[data-unit-idx="${activeIndex}"]`,
      ) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [activeIndex, open]);

  const openDropdown = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 220),
    });
    setFilter('');
    setOpen(true);
    setTimeout(() => filterRef.current?.focus(), 30);
  };

  const select = (u: UnitOption) => {
    onChange(u.name, u.id);
    setOpen(false);
    setFilter('');
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const dropEl = document.getElementById(`unit-drop-${rowIdx}`);
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropEl?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, rowIdx]);

  const display = value || 'Select unit…';

  return (
    <>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        data-id-row={rowIdx}
        data-id-col="unitName"
        onClick={open ? () => setOpen(false) : openDropdown}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (!open) openDropdown();
          }
        }}
        className={`
          w-full h-7 px-2 flex items-center justify-between gap-1 text-xs rounded border
          transition-colors cursor-pointer select-none
          ${
            open
              ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
              : !value
                ? 'border-amber-300 bg-amber-50/50 text-slate-400'
                : 'border-slate-200 bg-white text-[#1e293b] hover:border-indigo-300 hover:bg-indigo-50/30'
          }
        `}
      >
        <span className="truncate font-medium">{display}</span>
        <i
          className={`ri-arrow-${open ? 'up' : 'down'}-s-line text-slate-400 text-[11px] shrink-0`}
        />
      </button>

      {/* Portal dropdown */}
      {open &&
        createPortal(
          <div
            id={`unit-drop-${rowIdx}`}
            ref={dropdownRef}
            style={{
              position: 'fixed',
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: 280,
              zIndex: 9999,
            }}
            className="bg-white border border-slate-200 rounded-lg shadow-xl flex flex-col overflow-hidden"
          >
            {/* Filter input */}
            <div className="px-2 pt-2 pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5 h-7 px-2 rounded border border-indigo-300 bg-indigo-50/40">
                <i className="ri-search-line text-slate-400 text-[11px] shrink-0" />
                <input
                  ref={filterRef}
                  type="text"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Type to filter..."
                  className="flex-1 text-xs bg-transparent focus:outline-none text-[#1e293b] placeholder:text-slate-400"
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setOpen(false);
                      triggerRef.current?.focus();
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setActiveIndex((prev) =>
                        Math.min(prev + 1, filtered.length - 1),
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setActiveIndex((prev) => Math.max(prev - 1, 0));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      if (filtered[activeIndex]) {
                        select(filtered[activeIndex]);
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-xs text-slate-400 text-center">
                  No units found
                </p>
              ) : (
                filtered.map((u, idx) => (
                  <div
                    key={u.id}
                    data-unit-idx={idx}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(u);
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={`px-3 py-1.5 text-xs cursor-pointer transition-colors
                    ${
                      idx === activeIndex
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-[#1e293b] hover:bg-slate-50'
                    }`}
                  >
                    {u.name}
                    {u.shortName && u.shortName !== u.name && (
                      <span className="ml-1.5 text-slate-400 font-normal">
                        ({u.shortName})
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Count footer */}
            <div className="px-3 py-1 border-t border-slate-100 text-[10px] text-slate-400 bg-slate-50">
              {filtered.length} of {units.length} shown
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  rows: PurchaseRow[];
  onChange: (rows: PurchaseRow[]) => void;
  onRowComplete: (rowIdx: number) => void;
  focusedRowIndex: number;
  setFocusedRowIndex: (idx: number) => void;
  items: any[];
}

// ─── Keyboard-nav columns — unitName is NOT included (handled via dropdown) ───
const EDITABLE_COLS = [
  'itemName',
  'itemBarcode',
  'nol',
  'qty',
  'purRate',
  'purExpPct',
  'saleDisPct',
  'mrp',
  'saleRate',
] as const;
type EditableCol = (typeof EDITABLE_COLS)[number];

const COL_LABELS: Record<EditableCol, string> = {
  itemName: 'Name',
  itemBarcode: 'Barcode',
  nol: 'NOL',
  qty: 'Qty',
  purRate: 'Pur Rate',
  purExpPct: 'Pur Exp%',
  saleDisPct: 'Sale Dis%',
  mrp: 'MRP',
  saleRate: 'Sale Rate',
};

const COL_WIDTHS: Record<EditableCol, string> = {
  itemName: 'w-56',
  itemBarcode: 'w-32',
  nol: 'w-20',
  qty: 'w-16',
  purRate: 'w-24',
  purExpPct: 'w-20',
  saleDisPct: 'w-20',
  mrp: 'w-24',
  saleRate: 'w-24',
};

function focusCell(rowIdx: number, col: string) {
  const el = document.querySelector<HTMLElement>(
    `[data-id-row="${rowIdx}"][data-id-col="${col}"]`,
  );
  if (el) el.focus();
}

function isRowEmpty(row: PurchaseRow): boolean {
  return !row.companyBarcode && !row.itemName && (!row.qty || row.qty <= 0);
}

// ─── API helpers ──────────────────────────────────────────────────────────────
const BASE_URL =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:7000';
const getToken = () => localStorage.getItem('token') ?? '';

// ─── Component ────────────────────────────────────────────────────────────────
export default function ItemDetailsTab({
  rows,
  onChange,
  onRowComplete,
  focusedRowIndex,
  setFocusedRowIndex,
  items: _items,
}: Props) {
  // ── Fetch units once on mount ───────────────────────────────────────────────
  const [units, setUnits] = useState<UnitOption[]>([]);
  useEffect(() => {
    let mounted = true;
    fetch(`${BASE_URL}/api/v1/unit/all`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setUnits(
          (data?.data ?? []).map((u: any) => ({
            id: u.id,
            name: u.name,
            shortName: u.shortName ?? u.short_name ?? '',
          })),
        );
      })
      .catch(() => {
        /* silent — user can still pick 'Pcs' default */
      });
    return () => {
      mounted = false;
    };
  }, []);

  // ── Whether ANY row is a new (unknown) item with a name typed ──────────────
  const hasAnyNewItem = rows.some((r) => r.itemName && !r.isKnownItem);

  // ── Row helpers ─────────────────────────────────────────────────────────────
  const updateRow = useCallback(
    (idx: number, patch: Partial<PurchaseRow>) => {
      const updated = { ...rows[idx], ...patch };
      updated.amount = calcPurchaseRowAmount(updated);
      onChange(rows.map((r, i) => (i === idx ? updated : r)));
    },
    [rows, onChange],
  );

  const deleteRow = useCallback(
    (idx: number) => {
      if (rows.length === 1) {
        onChange(
          rows.map((r, i) =>
            i === idx
              ? {
                  ...r,
                  companyBarcode: '',
                  itemId: '',
                  itemName: '',
                  size: '',
                  hsnCode: '',
                  taxRate: 0,
                  group: '',
                  brand: '',
                  articleNo: '',
                  color: '',
                  markUpPct: 0,
                  unitName: 'Pcs',
                  nol: '',
                  qty: 1,
                  purRate: 0,
                  purExpPct: 0,
                  saleDisPct: 0,
                  mrp: 0,
                  saleRate: 0,
                  amount: 0,
                  isKnownItem: false,
                  itemBarcode: '',
                }
              : r,
          ),
        );
      } else {
        onChange(rows.filter((_, i) => i !== idx));
      }
    },
    [rows, onChange],
  );

  const handleKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      rowIdx: number,
      col: EditableCol,
    ) => {
      const colIdx = EDITABLE_COLS.indexOf(col);

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isRowEmpty(rows[rowIdx]) && rows.length > 1) {
          e.preventDefault();
          deleteRow(rowIdx);
          setTimeout(() => focusCell(Math.max(0, rowIdx - 1), col), 30);
          return;
        }
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        if (col === 'saleRate') {
          onRowComplete(rowIdx);
          return;
        }
        const nextCol = EDITABLE_COLS[colIdx + 1];
        if (nextCol) focusCell(rowIdx, nextCol);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const n = EDITABLE_COLS[colIdx + 1];
        if (n) focusCell(rowIdx, n);
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const p = EDITABLE_COLS[colIdx - 1];
        if (p) focusCell(rowIdx, p);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (rowIdx < rows.length - 1) focusCell(rowIdx + 1, col);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (rowIdx > 0) focusCell(rowIdx - 1, col);
        return;
      }
    },
    [rows, deleteRow, onRowComplete],
  );

  const numVal = (v: number | undefined) => (!v || v === 0 ? '' : String(v));
  const ic =
    'w-full h-7 px-1.5 text-xs bg-transparent focus:outline-none focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-300 rounded text-[#1e293b] placeholder:text-slate-300';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-slate-50 border-b border-[#e2e8f0]">
            <th className="w-8 px-2 py-2 text-left text-slate-500 font-semibold">
              #
            </th>
            <th className="w-56 px-1.5 py-2 text-left text-slate-500 font-semibold">
              Name
            </th>
            <th className="w-32 px-1.5 py-2 text-left text-slate-500 font-semibold">
              Barcode
            </th>
            <th className="w-20 px-1.5 py-2 text-left text-slate-500 font-semibold">
              NOL <span className="text-slate-400 font-normal">(opt)</span>
            </th>
            <th className="w-16 px-1.5 py-2 text-left text-slate-500 font-semibold">
              Qty
            </th>

            {/* Unit column header — appears after Qty, ONLY when a new-item row exists */}
            {hasAnyNewItem && (
              <th className="w-28 px-1.5 py-2 text-left text-slate-500 font-semibold whitespace-nowrap">
                Unit <span className="text-red-400 font-normal">*</span>
              </th>
            )}

            <th className="w-24 px-1.5 py-2 text-left text-slate-500 font-semibold">
              Pur Rate
            </th>
            <th className="w-20 px-1.5 py-2 text-left text-slate-500 font-semibold">
              Pur Exp%
            </th>
            <th className="w-20 px-1.5 py-2 text-left text-slate-500 font-semibold">
              Sale Dis%
            </th>
            <th className="w-24 px-1.5 py-2 text-left text-slate-500 font-semibold">
              MRP
            </th>
            <th className="w-24 px-1.5 py-2 text-left text-slate-500 font-semibold">
              Sale Rate
            </th>
            <th className="w-24 px-1.5 py-2 text-right text-slate-500 font-semibold">
              Amount
            </th>
            <th className="w-8 px-1 py-2" />
          </tr>
        </thead>

        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={`group border-b border-[#f1f5f9] transition-colors ${focusedRowIndex === idx ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'}`}
            >
              <td className="px-2 py-1 text-slate-400 text-center align-top pt-2">
                {idx + 1}
              </td>

              {/* ── Item name ─────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.itemName}
                  onChange={(e) =>
                    updateRow(idx, {
                      itemName: e.target.value,
                      itemId: '',
                      isKnownItem: false,
                    })
                  }
                  onKeyDown={(e) => handleKeyDown(e, idx, 'itemName')}
                  onFocus={() => setFocusedRowIndex(idx)}
                  placeholder="Item name…"
                  data-id-row={idx}
                  data-id-col="itemName"
                  className={`${ic} ${row.isKnownItem ? 'font-medium' : ''}`}
                />
                {/* Known-item badge */}
                {row.isKnownItem && (
                  <div className="flex items-center gap-1 mt-0.5 px-1">
                    <i className="ri-checkbox-circle-fill text-emerald-500 text-[10px]" />
                    <span className="text-[10px] text-emerald-600 truncate max-w-[180px]">
                      {row.group || row.brand
                        ? [row.brand, row.group].filter(Boolean).join(' · ')
                        : 'Matched'}
                    </span>
                  </div>
                )}
              </td>

              {/* ── Barcode ────────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <div className="flex items-center gap-0.5">
                  <input
                    type="text"
                    value={row.itemBarcode}
                    onChange={(e) =>
                      updateRow(idx, { itemBarcode: e.target.value })
                    }
                    onKeyDown={(e) => handleKeyDown(e, idx, 'itemBarcode')}
                    onFocus={() => setFocusedRowIndex(idx)}
                    placeholder={
                      row.companyBarcode
                        ? 'Using company barcode'
                        : 'Enter barcode...'
                    }
                    data-id-row={idx}
                    data-id-col="itemBarcode"
                    className={`flex-1 min-w-0 h-7 px-1.5 text-xs bg-transparent focus:outline-none focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-300 rounded text-[#1e293b] placeholder:text-slate-300 ${!row.itemBarcode && row.companyBarcode ? 'placeholder:text-slate-400 placeholder:italic' : ''}`}
                  />
                  <button
                    type="button"
                    title={
                      row.itemBarcode ? 'Barcode set' : 'Generate next barcode'
                    }
                    disabled={!!row.itemBarcode}
                    onClick={() => {
                      if (!row.itemBarcode)
                        updateRow(idx, { itemBarcode: getNextBarcode() });
                    }}
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors shrink-0 ${row.itemBarcode ? 'text-slate-300 cursor-not-allowed' : 'text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 cursor-pointer'}`}
                  >
                    <i className="ri-refresh-line text-xs" />
                  </button>
                </div>
              </td>

              {/* ── NOL ───────────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.nol}
                  onChange={(e) => updateRow(idx, { nol: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'nol')}
                  onFocus={() => setFocusedRowIndex(idx)}
                  placeholder="NOL"
                  data-id-row={idx}
                  data-id-col="nol"
                  className={ic}
                />
              </td>

              {/* ── Qty ───────────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={numVal(row.qty)}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value))
                      updateRow(idx, {
                        qty: e.target.value === '' ? 0 : Number(e.target.value),
                      });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'qty')}
                  onFocus={() => setFocusedRowIndex(idx)}
                  placeholder="0"
                  data-id-row={idx}
                  data-id-col="qty"
                  className={ic}
                />
              </td>

              {/* ── Unit dropdown — after Qty, ONLY for new items ────────── */}
              {hasAnyNewItem && (
                <td className="px-1 py-1 align-top">
                  {!row.isKnownItem && row.itemName ? (
                    <UnitDropdown
                      value={row.unitName || row.unit || ''}
                      unitId={row.unitId || ''}
                      units={units}
                      onChange={(name, id) =>
                        updateRow(idx, {
                          unitName: name,
                          unit: name,
                          unitId: id,
                        })
                      }
                      rowIdx={idx}
                    />
                  ) : (
                    <span className="block h-7" />
                  )}
                </td>
              )}

              {/* ── Pur Rate ──────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={numVal(row.purRate)}
                  onChange={(e) => {
                    if (/^\d*\.?\d*$/.test(e.target.value))
                      updateRow(idx, {
                        purRate:
                          e.target.value === '' ? 0 : Number(e.target.value),
                      });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'purRate')}
                  onFocus={() => setFocusedRowIndex(idx)}
                  placeholder="0.00"
                  data-id-row={idx}
                  data-id-col="purRate"
                  className={ic}
                />
              </td>

              {/* ── Pur Exp% ──────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={numVal(row.purExpPct)}
                  onChange={(e) => {
                    if (/^\d*\.?\d*$/.test(e.target.value))
                      updateRow(idx, {
                        purExpPct:
                          e.target.value === '' ? 0 : Number(e.target.value),
                      });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'purExpPct')}
                  onFocus={() => setFocusedRowIndex(idx)}
                  placeholder="0"
                  data-id-row={idx}
                  data-id-col="purExpPct"
                  className={ic}
                />
              </td>

              {/* ── Sale Dis% ─────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={numVal(row.saleDisPct)}
                  onChange={(e) => {
                    if (/^\d*\.?\d*$/.test(e.target.value))
                      updateRow(idx, {
                        saleDisPct:
                          e.target.value === '' ? 0 : Number(e.target.value),
                      });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'saleDisPct')}
                  onFocus={() => setFocusedRowIndex(idx)}
                  placeholder="0"
                  data-id-row={idx}
                  data-id-col="saleDisPct"
                  className={ic}
                />
              </td>

              {/* ── MRP ───────────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={numVal(row.mrp)}
                  onChange={(e) => {
                    if (/^\d*\.?\d*$/.test(e.target.value))
                      updateRow(idx, {
                        mrp: e.target.value === '' ? 0 : Number(e.target.value),
                      });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'mrp')}
                  onFocus={() => setFocusedRowIndex(idx)}
                  placeholder="0.00"
                  data-id-row={idx}
                  data-id-col="mrp"
                  className={ic}
                />
              </td>

              {/* ── Sale Rate ─────────────────────────────────────────────── */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={numVal(row.saleRate)}
                  onChange={(e) => {
                    if (/^\d*\.?\d*$/.test(e.target.value))
                      updateRow(idx, {
                        saleRate:
                          e.target.value === '' ? 0 : Number(e.target.value),
                      });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'saleRate')}
                  onFocus={() => setFocusedRowIndex(idx)}
                  placeholder="0.00"
                  data-id-row={idx}
                  data-id-col="saleRate"
                  className={ic}
                />
              </td>

              {/* ── Amount (read-only) ────────────────────────────────────── */}
              <td className="px-1.5 py-1 text-right align-top pt-2">
                <span className="text-xs font-semibold text-[#1e293b]">
                  {row.amount > 0 ? formatINR(row.amount) : '—'}
                </span>
              </td>

              {/* ── Delete ────────────────────────────────────────────────── */}
              <td className="px-1 py-1 text-center align-top pt-1.5">
                <button
                  type="button"
                  onClick={() => deleteRow(idx)}
                  title={rows.length === 1 ? 'Clear row' : 'Delete row'}
                  className="w-6 h-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <i className="ri-delete-bin-6-line text-xs" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
