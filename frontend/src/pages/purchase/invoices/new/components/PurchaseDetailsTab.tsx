import { useRef, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PurchaseRow } from '@/types/billing';
import { calcPurchaseRowAmount } from '@/types/billing';


interface Props {
  rows: PurchaseRow[];
  onChange: (rows: PurchaseRow[]) => void;
  onRowComplete: (rowIdx: number) => void;
  onBarcodeEnter: (rowIdx: number, value: string) => Promise<boolean>;
  focusedRowIndex: number;
  setFocusedRowIndex: (idx: number) => void;
  itemOptions: { id: string; name: string }[];
  onItemSelect: (idx: number, nameQuery: string) => void;
}


const EDITABLE_COLS = ['itemName', 'size', 'hsnCode', 'taxRate', 'group', 'brand', 'articleNo', 'color', 'markUpPct', 'companyBarcode'] as const;
type EditableCol = typeof EDITABLE_COLS[number];

const COL_LABELS: Record<EditableCol, string> = {
  itemName: 'Name',
  size: 'Size',
  hsnCode: 'HSN',
  taxRate: 'GST%',
  group: 'Group',
  brand: 'Brand',
  articleNo: 'Article No',
  color: 'Color',
  markUpPct: 'Mark Up%',
  companyBarcode: 'Company Barcode',
};

const COL_WIDTHS: Record<EditableCol, string> = {
  companyBarcode: 'w-36',
  itemName: 'w-44',
  size: 'w-20',
  hsnCode: 'w-24',
  taxRate: 'w-16',
  group: 'w-24',
  brand: 'w-24',
  articleNo: 'w-24',
  color: 'w-20',
  markUpPct: 'w-20',
};

function focusCell(rowIdx: number, col: string) {
  const el = document.querySelector<HTMLElement>(`[data-pd-row="${rowIdx}"][data-pd-col="${col}"]`);
  if (el) el.focus();
}

function isRowEmpty(row: PurchaseRow): boolean {
  return !row.companyBarcode && !row.itemName && (!row.qty || row.qty <= 0);
}

export default function PurchaseDetailsTab({ rows, onChange, onRowComplete, onBarcodeEnter, focusedRowIndex, setFocusedRowIndex, itemOptions, onItemSelect }: Props) {
  const blurTimerRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const nameInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const [dropdownRow, setDropdownRow] = useState<number | null>(null);
  const [searchMap, setSearchMap] = useState<Record<number, string>>({});
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 256 });

  // categories from api
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [groupDropdownRow, setGroupDropdownRow] = useState<number | null>(null);
  const [groupSearchMap, setGroupSearchMap] = useState<Record<number, string>>({});
  const [groupDropdownPos, setGroupDropdownPos] = useState({ top: 0, left: 0, width: 256 });
  const [groupHighlight, setGroupHighlight] = useState(0);
  const groupInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:7000';
  const getToken = () => localStorage.getItem('token') ?? '';

  useEffect(() => {
    let mounted = true;
    fetch(`${BASE_URL}/api/v1/categories/all`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // Filter out sub-categories (only keep categories where parentId/parent_id is null/undefined)
        const parentCategories = (data?.data ?? [])
          .filter((c: any) => !c.parentId && !c.parent_id)
          .map((c: any) => ({
            id: c.id,
            name: c.name,
          }));
        setCategories(parentCategories);
      })
      .catch(() => { });
    return () => {
      mounted = false;
    };
  }, []);

  const updateDropdownPos = useCallback((rowIdx: number) => {
    const input = nameInputRefs.current[rowIdx];
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 256),
    });
  }, []);

  const updateGroupDropdownPos = useCallback((rowIdx: number) => {
    const input = groupInputRefs.current[rowIdx];
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setGroupDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 256),
    });
  }, []);

  useEffect(() => {
    if (groupDropdownRow === null) return;
    updateGroupDropdownPos(groupDropdownRow);
    const handleReposition = () => updateGroupDropdownPos(groupDropdownRow);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [groupDropdownRow, updateGroupDropdownPos]);

  useEffect(() => {
    if (dropdownRow === null) return;
    updateDropdownPos(dropdownRow);
    const handleReposition = () => updateDropdownPos(dropdownRow);
    window.addEventListener('scroll', handleReposition, true);
    window.addEventListener('resize', handleReposition);
    return () => {
      window.removeEventListener('scroll', handleReposition, true);
      window.removeEventListener('resize', handleReposition);
    };
  }, [dropdownRow, updateDropdownPos]);

  const updateRow = useCallback((idx: number, patch: Partial<PurchaseRow>) => {
    const updated = { ...rows[idx], ...patch };
    updated.amount = calcPurchaseRowAmount(updated);
    onChange(rows.map((r, i) => i === idx ? updated : r));
  }, [rows, onChange]);

  // FIX 2 + 3: Delete row — shared rows array, both tabs update
  const deleteRow = useCallback((idx: number) => {
    if (rows.length === 1) {
      // Only 1 row: clear all fields instead of removing
      onChange(rows.map((r, i) => i === idx ? {
        ...r,
        companyBarcode: '', itemId: '', itemName: '', size: '',
        hsnCode: '', taxRate: 0, group: '', brand: '', articleNo: '',
        color: '', markUpPct: 0, nol: '', qty: 1, purRate: 0,
        purExpPct: 0, saleDisPct: 0, mrp: 0, saleRate: 0, amount: 0,
        isKnownItem: false, itemBarcode: '',
      } : r));
    } else {
      onChange(rows.filter((_, i) => i !== idx));
    }
  }, [rows, onChange]);

  // FIX 1: Barcode lookup on Enter — works on first keypress
  const handleBarcodeEnter = useCallback(async (idx: number, value: string) => {
    const trimmed = value.trim();

    if (!trimmed) {
      focusCell(idx, 'itemName');
      return;
    }

    const found = await onBarcodeEnter(idx, trimmed); // wait

    setTimeout(() => {
      if (found) {
        focusCell(idx, 'markUpPct'); // known item
      } else {
        focusCell(idx, 'itemName'); // new item
      }
    }, 50);

  }, [onBarcodeEnter]);

  // Select a category from the group dropdown and move focus to next cell
  const selectGroup = useCallback((rowIdx: number, name: string) => {
    setGroupSearchMap((prev) => { const n = { ...prev }; delete n[rowIdx]; return n; });
    updateRow(rowIdx, { group: name });
    setGroupDropdownRow(null);
    setTimeout(() => focusCell(rowIdx, 'brand'), 30);
  }, [updateRow]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    col: EditableCol,
  ) => {
    const colIdx = EDITABLE_COLS.indexOf(col);

    // ── Group dropdown keyboard navigation ──────────────────────────────────
    if (col === 'group' && groupDropdownRow === rowIdx) {
      const filtered = categories
        .filter((c) =>
          c.name.toLowerCase().includes(
            (groupSearchMap[rowIdx] ?? rows[rowIdx]?.group ?? '').toLowerCase()
          )
        )
        .slice(0, 8);

      if (filtered.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setGroupHighlight((p) => Math.min(p + 1, filtered.length - 1));
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setGroupHighlight((p) => Math.max(p - 1, 0));
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          e.stopPropagation();
          // Read the current highlight directly from state via functional update
          setGroupHighlight((p) => {
            if (filtered[p]) selectGroup(rowIdx, filtered[p].name);
            return p;
          });
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setGroupDropdownRow(null);
        return;
      }
    }

    // FIX 2: Delete/Backspace on empty row → delete row, focus previous
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const row = rows[rowIdx];
      if (isRowEmpty(row) && rows.length > 1) {
        e.preventDefault();
        deleteRow(rowIdx);
        const prevIdx = Math.max(0, rowIdx - 1);
        setTimeout(() => focusCell(prevIdx, col), 30);
        return;
      }
      // Row has data → normal browser behaviour (don't intercept)
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      if (col === 'companyBarcode') {
        // FIX 1: Always trigger barcode lookup on Enter in barcode field
        handleBarcodeEnter(rowIdx, (e.target as HTMLInputElement).value);
        return;
      }
      if (col === 'markUpPct') {
        onRowComplete(rowIdx);
        return;
      }
      const nextCol = EDITABLE_COLS[colIdx + 1];
      if (nextCol) focusCell(rowIdx, nextCol);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (col === 'markUpPct') return;
      const nextCol = EDITABLE_COLS[colIdx + 1];
      if (nextCol) focusCell(rowIdx, nextCol);
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (col === 'companyBarcode') return;
      const prevCol = EDITABLE_COLS[colIdx - 1];
      if (prevCol) focusCell(rowIdx, prevCol);
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
  }, [rows, deleteRow, handleBarcodeEnter, onRowComplete, categories, groupDropdownRow, groupSearchMap, selectGroup]);

  const handleFocus = useCallback((rowIdx: number) => {
    if (blurTimerRef.current[rowIdx]) clearTimeout(blurTimerRef.current[rowIdx]);
    setFocusedRowIndex(rowIdx);
  }, [setFocusedRowIndex]);

  const handleBlur = useCallback((rowIdx: number) => {
    if (blurTimerRef.current[rowIdx]) clearTimeout(blurTimerRef.current[rowIdx]);
    blurTimerRef.current[rowIdx] = setTimeout(() => {
      const row = document.querySelector(`[data-pd-row="${rowIdx}"]`);
      if (!row?.contains(document.activeElement)) {
        setFocusedRowIndex(-1);
      }
    }, 80);
  }, [setFocusedRowIndex]);

  const ic = 'w-full h-7 px-1.5 text-xs bg-transparent focus:outline-none focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-300 rounded text-[#1e293b] placeholder:text-slate-300';

  return (
    <div className="overflow-visible">
      <table className="w-full text-xs border-collapse min-w-[900px]">
        <thead>
          <tr className="bg-slate-50 border-b border-[#e2e8f0]">
            <th className="w-8 px-2 py-2 text-left text-slate-500 font-semibold">#</th>
            {EDITABLE_COLS.map((col) => (
              <th key={col} className={`${COL_WIDTHS[col]} px-1.5 py-2 text-left text-slate-500 font-semibold whitespace-nowrap`}>
                {COL_LABELS[col]}
              </th>
            ))}
            {/* Delete column header */}
            <th className="w-8 px-1 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={row.id}
              className={`group border-b border-[#f1f5f9] transition-colors ${focusedRowIndex === idx ? 'bg-indigo-50/40' : 'hover:bg-slate-50/60'}`}
            >
              <td className="px-2 py-1 text-slate-400 text-center">{idx + 1}</td>


              {/* Name */}
              <td className="px-1 py-1 relative">
                <input
                  ref={(el) => {
                    nameInputRefs.current[idx] = el;
                  }}
                  type="text"
                  value={searchMap[idx] ?? row.itemName}
                  onChange={(e) => {
                    const val = e.target.value;

                    setSearchMap((prev) => ({
                      ...prev,
                      [idx]: val,
                    }));

                    setDropdownRow(idx);
                    updateDropdownPos(idx);

                    // optional sync to row
                    updateRow(idx, { itemName: val });
                  }}
                  onFocus={() => {
                    handleFocus(idx);
                    setDropdownRow(idx);
                    updateDropdownPos(idx);
                  }}
                  onBlur={() => {
                    handleBlur(idx);
                    setTimeout(() => setDropdownRow(null), 150);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'itemName')}
                  placeholder="Search item..."
                  data-pd-row={idx}
                  data-pd-col="itemName"
                  className={ic}
                />

                {/* DROPDOWN */}
                {dropdownRow === idx && createPortal(
                  <div
                    className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto"
                    style={{
                      position: 'absolute',
                      top: dropdownPos.top,
                      left: dropdownPos.left,
                      width: dropdownPos.width,
                      zIndex: 9999,
                    }}
                  >
                    {itemOptions
                      .filter((item) =>
                        item.name
                          .toLowerCase()
                          .includes((searchMap[idx] || row.itemName || '').toLowerCase())
                      )
                      .slice(0, 8)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="px-2 py-1 text-xs hover:bg-indigo-50 cursor-pointer"
                          onMouseDown={(e) => {
                            e.preventDefault();

                            setSearchMap((prev) => {
                              const next = { ...prev };
                              delete next[idx];
                              return next;
                            });
                            onItemSelect(idx, item.name);
                            setDropdownRow(null);
                            setTimeout(() => focusCell(idx, 'size'), 30);
                          }}
                        >
                          {item.name}
                        </div>
                      ))}
                  </div>,
                  document.body
                )}
              </td>


              {/* Size */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.size}
                  onChange={(e) => updateRow(idx, { size: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'size')}
                  onFocus={() => handleFocus(idx)}
                  onBlur={() => handleBlur(idx)}
                  placeholder="Size"
                  data-pd-row={idx}
                  data-pd-col="size"
                  className={ic}
                />
              </td>

              {/* HSN */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.hsnCode}
                  onChange={(e) => updateRow(idx, { hsnCode: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'hsnCode')}
                  onFocus={() => handleFocus(idx)}
                  onBlur={() => handleBlur(idx)}
                  placeholder="HSN"
                  data-pd-row={idx}
                  data-pd-col="hsnCode"
                  className={ic}
                />
              </td>

              {/* GST% */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.taxRate}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Allow digits + one decimal point
                    if (/^\d*\.?\d*$/.test(value)) {
                      updateRow(idx, { taxRate: parseFloat(value) || 0 });
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateRow(idx, { taxRate: val });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'taxRate')}
                  onFocus={() => handleFocus(idx)}
                  data-pd-row={idx}
                  data-pd-col="taxRate"
                  className={ic}
                />
              </td>


              {/* Group */}
              <td className="px-1 py-1 relative">
                <input
                  ref={(el) => {
                    groupInputRefs.current[idx] = el;
                  }}
                  type="text"
                  value={groupSearchMap[idx] ?? row.group}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGroupSearchMap((prev) => ({ ...prev, [idx]: val }));
                    setGroupDropdownRow(idx);
                    setGroupHighlight(0);
                    updateGroupDropdownPos(idx);
                    updateRow(idx, { group: val });
                  }}
                  onFocus={() => {
                    handleFocus(idx);
                    setGroupDropdownRow(idx);
                    setGroupHighlight(0);
                    updateGroupDropdownPos(idx);
                  }}
                  onBlur={() => {
                    handleBlur(idx);
                    setTimeout(() => setGroupDropdownRow(null), 150);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'group')}
                  placeholder="Group"
                  data-pd-row={idx}
                  data-pd-col="group"
                  className={ic}
                />

                {/* GROUP DROPDOWN */}
                {groupDropdownRow === idx && createPortal(
                  <div
                    className="bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-auto"
                    style={{
                      position: 'absolute',
                      top: groupDropdownPos.top,
                      left: groupDropdownPos.left,
                      width: groupDropdownPos.width,
                      zIndex: 9999,
                    }}
                  >
                    {categories
                      .filter((cat) =>
                        cat.name
                          .toLowerCase()
                          .includes((groupSearchMap[idx] ?? row.group ?? '').toLowerCase())
                      )
                      .slice(0, 8)
                      .map((cat, catIdx) => (
                        <div
                          key={cat.id}
                          className={`px-2 py-1 text-xs cursor-pointer transition-colors ${
                            catIdx === groupHighlight
                              ? 'bg-indigo-100 text-indigo-700 font-medium'
                              : 'hover:bg-indigo-50 text-[#1e293b]'
                          }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectGroup(idx, cat.name);
                          }}
                          onMouseEnter={() => setGroupHighlight(catIdx)}
                        >
                          {cat.name}
                        </div>
                      ))}
                  </div>,
                  document.body
                )}
              </td>

              {/* Brand */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.brand}
                  onChange={(e) => updateRow(idx, { brand: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'brand')}
                  onFocus={() => handleFocus(idx)}
                  onBlur={() => handleBlur(idx)}
                  placeholder="Brand"
                  data-pd-row={idx}
                  data-pd-col="brand"
                  className={ic}
                />
              </td>

              {/* Article No */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.articleNo}
                  onChange={(e) => updateRow(idx, { articleNo: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'articleNo')}
                  onFocus={() => handleFocus(idx)}
                  onBlur={() => handleBlur(idx)}
                  placeholder="Article No"
                  data-pd-row={idx}
                  data-pd-col="articleNo"
                  className={ic}
                />
              </td>

              {/* Color */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.color}
                  onChange={(e) => updateRow(idx, { color: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'color')}
                  onFocus={() => handleFocus(idx)}
                  onBlur={() => handleBlur(idx)}
                  placeholder="Color"
                  data-pd-row={idx}
                  data-pd-col="color"
                  className={ic}
                />
              </td>

              {/* Mark Up% */}
              <td className="px-1 py-1">
                <input
                  type="text"
                  value={row.markUpPct}
                  onChange={(e) => {
                    const value = e.target.value;

                    // Allow digits + one decimal point
                    if (/^\d*\.?\d*$/.test(value)) {
                      updateRow(idx, { markUpPct: parseFloat(value) || 0 });
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateRow(idx, { markUpPct: val });
                  }}
                  onKeyDown={(e) => handleKeyDown(e, idx, 'markUpPct')}
                  onFocus={() => handleFocus(idx)}
                  data-pd-row={idx}
                  data-pd-col="markUpPct"
                  className={ic}
                />
              </td>


              {/* Company Barcode — FIX 1 */}
              <td className="px-1 py-1">
                <div className="relative">
                  <input
                    type="text"
                    value={row.companyBarcode}
                    onChange={(e) => updateRow(idx, { companyBarcode: e.target.value })}
                    onKeyDown={(e) => handleKeyDown(e, idx, 'companyBarcode')}
                    onFocus={() => handleFocus(idx)}
                    onBlur={() => handleBlur(idx)}
                    placeholder="Scan / type..."
                    data-pd-row={idx}
                    data-pd-col="companyBarcode"
                    className={ic}
                  />
                  {focusedRowIndex === idx && row.companyBarcode && (
                    <span className={`absolute -top-5 left-0 text-[10px] px-1.5 py-0.5 rounded font-medium whitespace-nowrap z-10 ${row.isKnownItem ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {row.isKnownItem ? 'Known item — details auto-filled' : 'New item — fill details manually'}
                    </span>
                  )}
                </div>
              </td>

              {/* FIX 2: Delete button — visible on row hover */}
              <td className="px-1 py-1 text-center">
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
