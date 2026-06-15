// import { useState, useCallback, useRef, useEffect } from 'react';
// import type { RefObject } from 'react';
// import { mockPurchaseInvoices } from '@/mocks/billing';
// import type { POItem } from '../page';
// import React from 'react';

// const api = import.meta.env.VITE_API_URL |http://localhost:7000com';

// function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
//   let timeoutId: ReturnType<typeof setTimeout>;
//   return (...args: Parameters<T>) => {
//     clearTimeout(timeoutId);
//     timeoutId = setTimeout(() => func(...args), delay);
//   };
// }

// interface LastPurchaseInfo { price: number; supplierName: string; date: string }

// function getLastPurchasePrice(itemId: string): LastPurchaseInfo | null {
//   if (!itemId) return null;
//   let best: LastPurchaseInfo | null = null;
//   for (const inv of mockPurchaseInvoices) {
//     for (const it of inv.items) {
//       const itWithId = it as typeof it & { itemId?: string };
//       if (itWithId.itemId === itemId) {
//         if (!best || inv.date > best.date) {
//           best = { price: it.rate, supplierName: inv.partyName, date: inv.date };
//         }
//       }
//     }
//   }
//   return best;
// }

// function formatDate(d: string) {
//   if (!d) return '';
//   return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
// }

// function PriceAlertRow({ item, colSpan, dismissed }: { item: POItem; colSpan: number; dismissed: boolean }) {
//   if (dismissed || !item.itemId || item.lastPrice === null || item.purRate <= 0) return null;
//   const diff = item.purRate - item.lastPrice;
//   const pct = item.lastPrice > 0 ? Math.abs((diff / item.lastPrice) * 100).toFixed(1) : '0.0';
//   if (diff === 0) return null;
//   return (
//     <tr>
//       <td colSpan={colSpan} className="px-0 py-0">
//         <div className={`mx-2 mb-1 px-3 py-2 border rounded-lg text-xs ${diff > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
//           <div className={`flex items-center gap-2 font-semibold ${diff > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
//             <i className={diff > 0 ? 'ri-alert-line' : 'ri-checkbox-circle-line'} />
//             {diff > 0 ? 'Price Alert: Higher than last purchase' : 'Price is within normal range'}
//           </div>
//           <div className={`mt-0.5 ${diff > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
//             Last Purchase: <strong>₹{item.lastPrice.toLocaleString('en-IN')}</strong> from {item.lastSupplier} · {formatDate(item.lastDate)}
//             &nbsp;&nbsp;|&nbsp;&nbsp;
//             {diff > 0 ? 'Increase' : 'Saving'}: <strong>₹{Math.abs(diff).toLocaleString('en-IN')} ({pct}%)</strong>
//           </div>
//         </div>
//       </td>
//     </tr>
//   );
// }

// export interface ItemOption {
//   id: string;
//   name: string;
//   code: string;
//   barcode: string;
//   hsnCode: string;
//   taxRate: number;
//   purchaseRate: number;
//   group: string;
//   brand: string;
//   articleNo: string;
//   size: string;
//   stock: number;
//   unitId?: string;
// }

// // ─── Dropdown styled like the sales invoice item search ───────────────────────
// function ItemSearchInput({
//   value,
//   onChange,
//   onSelect,
//   onAddNew,
//   options,
//   loading,
//   placeholder,
//   dataRow,
//   dataCol,
//   onKeyDown,
//   onOpenChange,
// }: {
//   value: string;
//   onChange: (v: string) => void;
//   onSelect: (opt: ItemOption) => void;
//   onAddNew: (query: string) => void;
//   options: ItemOption[];
//   loading: boolean;
//   placeholder?: string;
//   dataRow: number;
//   dataCol: string;
//   onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
//   onOpenChange?: (open: boolean) => void;
// }) {
//   const [open, setOpen] = useState(false);
//   const [highlighted, setHighlighted] = useState(-1);
//   const wrapRef = useRef<HTMLDivElement>(null);

//   const showDropdown = open && value.length >= 1;
//   const totalOptions = options.length + 1; // +1 for Add New

//   useEffect(() => {
//     if (value.length >= 1) {
//       setOpen(true);
//       onOpenChange?.(true);
//     } else {
//       setOpen(false);
//       onOpenChange?.(false);
//     }
//     setHighlighted(-1);
//   }, [options, loading, value]);

//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
//         setOpen(false);
//         onOpenChange?.(false);
//       }
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, [onOpenChange]);

//   const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
//     if (open) {
//       if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((p) => Math.min(p + 1, totalOptions - 1)); return; }
//       if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((p) => Math.max(p - 1, 0)); return; }
//       if (e.key === 'Enter' && highlighted >= 0) {
//         e.preventDefault();
//         if (highlighted < options.length) select(options[highlighted]);
//         else addNew();
//         return;
//       }
//       if (e.key === 'Escape') { setOpen(false); onOpenChange?.(false); return; }
//     }
//     onKeyDown?.(e);
//   };

//   const select = (opt: ItemOption) => {
//     onChange(opt.name);
//     onSelect(opt);
//     setOpen(false);
//     onOpenChange?.(false);
//   };

//   const addNew = () => {
//     setOpen(false);
//     onOpenChange?.(false);
//     onAddNew(value);
//   };

//   return (
//     <div ref={wrapRef} className="relative">
//       <input
//         type="text"
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         onKeyDown={handleKeyDown}
//         onFocus={() => { if (value.length >= 1) { setOpen(true); onOpenChange?.(true); } }}
//         placeholder={placeholder}
//         data-row={dataRow}
//         data-col={dataCol}
//         className="w-full h-7 px-1.5 text-xs bg-transparent focus:outline-none focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-300 rounded text-[#1e293b] placeholder:text-slate-400 border-0"
//       />

//       {showDropdown && (
//         // ✅ Positioned BELOW the row, matching sales invoice style
//         <div className="absolute z-[9999] left-0 top-full mt-0.5 bg-white border border-[#e2e8f0] rounded-xl shadow-2xl min-w-[320px] overflow-hidden"
//           style={{ maxHeight: '240px', overflowY: 'auto' , }}>

//           {/* Column headers — sales invoice style */}
//           {!loading && options.length > 0 && (
//             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-[#e2e8f0] text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
//               <span className="flex-1">Item</span>
//               <span className="w-20 text-center">Code</span>
//               <span className="w-12 text-center">Stock</span>
//               <span className="w-16 text-right">Rate</span>
//             </div>
//           )}

//           {/* Loading */}
//           {loading && (
//             <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
//               <i className="ri-loader-4-line animate-spin" />Searching items...
//             </div>
//           )}

//           {/* Results — sales invoice card style */}
//           {!loading && options.map((opt, idx) => (
//             <button
//               key={opt.id}
//               type="button"
//               onMouseDown={(e) => { e.preventDefault(); select(opt); }}
//               onMouseEnter={() => setHighlighted(idx)}
//               className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs transition-colors border-b border-slate-50 last:border-0 ${idx === highlighted ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
//             >
//               <div className="flex-1 min-w-0">
//                 <span className="font-medium text-[#1e293b] block truncate">{opt.name}</span>
//                 {opt.barcode && <span className="text-slate-400 font-mono text-[10px]">{opt.barcode}</span>}
//               </div>
//               <span className="w-20 text-center text-slate-400 font-mono text-[10px] shrink-0">{opt.code || '—'}</span>
//               <span className={`w-12 text-center text-[10px] font-semibold shrink-0 ${opt.stock > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
//                 {opt.stock ?? 0}
//               </span>
//               <span className="w-16 text-right text-indigo-600 font-semibold text-[11px] shrink-0">
//                 {opt.purchaseRate > 0 ? `₹${opt.purchaseRate}` : '₹0.00'}
//               </span>
//             </button>
//           ))}

//           {/* No results */}
//           {!loading && options.length === 0 && (
//             <div className="px-3 py-2.5 text-xs text-slate-400">
//               No items found for "<span className="font-medium text-slate-600">{value}</span>"
//             </div>
//           )}

//           {/* Add New Item — always shown */}
//           <button
//             type="button"
//             onMouseDown={(e) => { e.preventDefault(); addNew(); }}
//             onMouseEnter={() => setHighlighted(options.length)}
//             className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-xs font-semibold border-t border-[#e2e8f0] transition-colors ${highlighted === options.length ? 'bg-indigo-50 text-[#4f46e5]' : 'text-[#4f46e5] hover:bg-indigo-50'}`}
//           >
//             <i className="ri-add-circle-line text-sm" />
//             Add New Item{value ? ` "${value}"` : ''}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Main table ───────────────────────────────────────────────────────────────
// interface Props {
//   items: POItem[];
//   tableRef: RefObject<HTMLDivElement | null>;
//   onUpdateItem: (id: string, patch: Partial<POItem>) => void;
//   onRemoveItem: (id: string) => void;
//   onAddRow: () => void;
//   onAddNewItem?: (query: string, rowId: string) => void;
// }

// const COLS = ['item', 'size', 'hsn', 'gst', 'group', 'brand', 'articleNo', 'qty', 'purRate'] as const;
// type ColName = typeof COLS[number];

// function focusCell(tableEl: HTMLElement | null, rowIdx: number, col: string) {
//   if (!tableEl) return;
//   const cell = tableEl.querySelector(`[data-row="${rowIdx}"][data-col="${col}"]`) as HTMLElement | null;
//   if (!cell) return;
//   if (cell.tagName === 'INPUT') { (cell as HTMLInputElement).focus(); return; }
//   const inner = cell.querySelector('input') as HTMLInputElement | null;
//   inner?.focus();
// }

// export default function POItemsTable({ items, tableRef, onUpdateItem, onRemoveItem, onAddRow, onAddNewItem }: Props) {
//   const [itemQueries, setItemQueries] = useState<Record<string, string>>({});
//   const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
//   const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);
//   const [searching, setSearching] = useState(false);
//   const selectedRowsRef = useRef<Set<string>>(new Set());
//   const dropdownOpenRef = useRef<Record<number, boolean>>({});

//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const fetchItems = useCallback(
//     debounce(async (val: string) => {
//       if (val.length < 1) { setItemOptions([]); setSearching(false); return; }
//       setSearching(true);
//       try {
//         const token = localStorage.getItem('token');
//         const res = await fetch(
//           `${api}/api/v1/item/filter?search=${encodeURIComponent(val)}`,
//           { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
//         );
//         const data = await res.json();
//         const mapped: ItemOption[] = (data?.data || []).map((item: any) => ({
//           id: item.id,
//           name: item.name,
//           code: item.code || '',
//           barcode: item.barcode || '',
//           hsnCode: item.hsn_code || '',
//           taxRate: item.gst_rate || 0,
//           purchaseRate: item.purchase_rate || 0,
//           group: item.group || '',
//           brand: item.brand || '',
//           articleNo: item.article_no || '',
//           size: item.size || '',
//           stock: Number(item.stock) || 0,
//           unitId: item.primary_unit_id || '',
//         }));
//         setItemOptions(mapped);
//       } catch (err) {
//         console.error('Item fetch error:', err);
//         setItemOptions([]);
//       } finally {
//         setSearching(false);
//       }
//     }, 300),
//     []
//   );

//   const selectItem = useCallback((rowId: string, opt: ItemOption) => {
//     const lastInfo = getLastPurchasePrice(opt.id);
//     setItemQueries((prev) => ({ ...prev, [rowId]: opt.name }));
//     selectedRowsRef.current.add(rowId);
//     setDismissedAlerts((prev) => { const n = new Set(prev); n.delete(rowId); return n; });
//     onUpdateItem(rowId, {
//       itemId: opt.id,
//       itemName: opt.name,
//       barcode: opt.barcode,
//       size: opt.size,
//       hsnCode: opt.hsnCode,
//       gstRate: opt.taxRate,
//       group: opt.group,
//       brand: opt.brand,
//       articleNo: opt.articleNo,
//       purRate: opt.purchaseRate,
//       unitId: opt.unitId,
//       stock: opt.stock,
//       lastPrice: lastInfo?.price ?? null,
//       lastSupplier: lastInfo?.supplierName ?? '',
//       lastDate: lastInfo?.date ?? '',
//     });
//     setItemOptions([]);
//   }, [onUpdateItem]);

//   const handleItemKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number) => {
//     const isDropdownOpen = dropdownOpenRef.current[rowIdx] === true;
//     if (isDropdownOpen) return;
//     const item = items[rowIdx];
//     const isLastRow = rowIdx === items.length - 1;

//     if (e.key === 'Enter') {
//       const val = (itemQueries[item.id] ?? item.itemName ?? '').trim();
//       if (!val) { e.preventDefault(); e.stopPropagation(); return; }
//       if (item.itemId || selectedRowsRef.current.has(item.id)) {
//         e.preventDefault(); e.stopPropagation();
//         focusCell(tableRef.current, rowIdx, 'size');
//         return;
//       }
//       return;
//     }
//     if (e.key === 'ArrowRight') { e.preventDefault(); focusCell(tableRef.current, rowIdx, 'size'); }
//     else if (e.key === 'ArrowDown' && !isLastRow) { e.preventDefault(); focusCell(tableRef.current, rowIdx + 1, 'item'); }
//     else if (e.key === 'ArrowUp' && rowIdx > 0) { e.preventDefault(); focusCell(tableRef.current, rowIdx - 1, 'item'); }
//   }, [items, itemQueries, tableRef]);

//   const handleCellKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number, col: ColName) => {
//     const colIdx = COLS.indexOf(col);
//     const isLastCol = colIdx === COLS.length - 1;
//     const isLastRow = rowIdx === items.length - 1;

//     switch (e.key) {
//       case 'Enter': {
//         e.preventDefault();
//         if (isLastCol) {
//           const rowId = items[rowIdx].id;
//           setDismissedAlerts((prev) => { const n = new Set(prev); n.add(rowId); return n; });
//           if (isLastRow) { onAddRow(); setTimeout(() => focusCell(tableRef.current, rowIdx + 1, 'item'), 80); }
//           else { focusCell(tableRef.current, rowIdx + 1, 'item'); }
//         } else { focusCell(tableRef.current, rowIdx, COLS[colIdx + 1]); }
//         break;
//       }
//       case 'ArrowRight': if (colIdx < COLS.length - 1) { e.preventDefault(); focusCell(tableRef.current, rowIdx, COLS[colIdx + 1]); } break;
//       case 'ArrowLeft': if (colIdx > 0) { e.preventDefault(); focusCell(tableRef.current, rowIdx, COLS[colIdx - 1]); } break;
//       case 'ArrowDown': if (!isLastRow) { e.preventDefault(); focusCell(tableRef.current, rowIdx + 1, col); } break;
//       case 'ArrowUp': if (rowIdx > 0) { e.preventDefault(); focusCell(tableRef.current, rowIdx - 1, col); } break;
//     }
//   }, [items, onAddRow, tableRef]);

//   const th = 'px-2 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wide border-b border-[#e2e8f0] whitespace-nowrap bg-slate-50';
//   const td = 'px-1 py-1 align-top';
//   const inp = 'w-full h-7 px-1.5 text-xs bg-transparent focus:outline-none focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-300 rounded text-[#1e293b] placeholder:text-slate-400';
//   const roInp = 'w-full h-7 px-1.5 text-xs bg-slate-50 rounded text-slate-500 flex items-center';

//   return (
//     <div ref={tableRef}>
//       <div className="overflow-x-auto" style={{height:'30vh'}}>
//         <table className="w-full text-sm border-collapse">
//           <thead>
//             <tr>
//               <th className={`${th} w-8 text-center`}>#</th>
//               <th className={`${th} min-w-[220px]`}>Item / Barcode</th>
//               <th className={`${th} w-20`}>Size</th>
//               <th className={`${th} w-24`}>HSN</th>
//               <th className={`${th} w-16`}>GST%</th>
//               <th className={`${th} w-24`}>Group</th>
//               <th className={`${th} w-24`}>Brand</th>
//               <th className={`${th} w-28`}>Article/Model</th>
//               <th className={`${th} w-20 text-right`}>Qty</th>
//               <th className={`${th} w-28 text-right`}>Pur Rate</th>
//               <th className={`${th} w-40 text-right`}>Last Price</th>
//               <th className={`${th} w-28 text-right`}>Amount</th>
//               <th className={`${th} w-8`}></th>
//             </tr>
//           </thead>
//           <tbody>
//             {items.map((item, rowIdx) => (
//               <React.Fragment key={item.id || rowIdx}>
//                 <tr className={`group border-b border-[#f1f5f9] transition-colors ${rowIdx % 2 === 1 ? 'bg-[#fafafa]' : ''}`}>
//                   <td className={`${td} text-center text-xs text-slate-400 pt-2`}>{rowIdx + 1}</td>

//                   {/* Item search */}
//                   <td className={td} data-row={rowIdx} data-col="item">
//                     <ItemSearchInput
//                       value={itemQueries[item.id] ?? item.itemName}
//                       onChange={(v: string) => {
//                         setItemQueries((prev) => ({ ...prev, [item.id]: v }));
//                         if (v.length >= 1) {
//                           fetchItems(v);
//                         } else {
//                           setItemOptions([]);
//                           setSearching(false);
//                           selectedRowsRef.current.delete(item.id);
//                           setDismissedAlerts((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
//                           onUpdateItem(item.id, {
//                             itemId: '', itemName: '', barcode: '', size: '',
//                             hsnCode: '', gstRate: 0, group: '', brand: '', articleNo: '',
//                             purRate: 0, lastPrice: null, lastSupplier: '', lastDate: '',
//                           });
//                         }
//                       }}
//                       onSelect={(opt) => selectItem(item.id, opt)}
//                       onAddNew={(query) => onAddNewItem?.(query, item.id)}
//                       options={itemOptions}
//                       loading={searching}
//                       placeholder="Item name or barcode..."
//                       dataRow={rowIdx}
//                       dataCol="item"
//                       onKeyDown={(e) => handleItemKeyDown(e, rowIdx)}
//                       onOpenChange={(open) => { dropdownOpenRef.current[rowIdx] = open; }}
//                     />
//                   </td>

//                   {/* Size */}
//                   <td className={td}>
//                     <input type="text" value={item.size} placeholder="size"
//                       onChange={(e) => onUpdateItem(item.id, { size: e.target.value })}
//                       onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'size')}
//                       className={inp} data-row={rowIdx} data-col="size" />
//                   </td>

//                   {/* HSN */}
//                   <td className={td}>
//                     <input type="text" value={item.hsnCode} placeholder="HSN"
//                       onChange={(e) => onUpdateItem(item.id, { hsnCode: e.target.value })}
//                       onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'hsn')}
//                       className={inp} data-row={rowIdx} data-col="hsn" />
//                   </td>

//                   {/* GST% */}
//                   <td className={td}>
//                     <input type="text"
//                       value={item.gstRate === 0 ? '' : item.gstRate}
//                       onChange={(e) => {
//                         const v = e.target.value;
//                         if (v === '' || /^\d*\.?\d*$/.test(v))
//                           onUpdateItem(item.id, { gstRate: v === '' ? 0 : parseFloat(v) || 0 });
//                       }}
//                       onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return; } handleCellKeyDown(e, rowIdx, 'gst'); }}
//                       placeholder="0"
//                       className={`${inp} text-right`} data-row={rowIdx} data-col="gst" />
//                   </td>

//                   {/* Group */}
//                   <td className={td}>
//                     <input type="text" value={item.group} placeholder="Group"
//                       onChange={(e) => onUpdateItem(item.id, { group: e.target.value })}
//                       onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'group')}
//                       className={inp} data-row={rowIdx} data-col="group" />
//                   </td>

//                   {/* Brand */}
//                   <td className={td}>
//                     <input type="text" value={item.brand} placeholder="Brand"
//                       onChange={(e) => onUpdateItem(item.id, { brand: e.target.value })}
//                       onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'brand')}
//                       className={inp} data-row={rowIdx} data-col="brand" />
//                   </td>

//                   {/* Article/Model */}
//                   <td className={td}>
//                     <input type="text" value={item.articleNo} placeholder="Article/Model"
//                       onChange={(e) => onUpdateItem(item.id, { articleNo: e.target.value })}
//                       onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'articleNo')}
//                       className={inp} data-row={rowIdx} data-col="articleNo" />
//                   </td>

//                   {/* Qty */}
//                   <td className={td}>
//                     <input type="text"
//                       value={item.qty === 0 ? '' : item.qty}
//                       onChange={(e) => {
//                         const v = e.target.value;
//                         if (v === '' || /^\d+$/.test(v))
//                           onUpdateItem(item.id, { qty: v === '' ? 0 : parseInt(v, 10) });
//                       }}
//                       onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return; } handleCellKeyDown(e, rowIdx, 'qty'); }}
//                       placeholder="1"
//                       className={`${inp} text-right`} data-row={rowIdx} data-col="qty" />
//                   </td>

//                   {/* ✅ FIX: purRate — show empty string when 0 so user doesn't need to backspace */}
//                   <td className={td}>
//                     <input type="text"
//                       value={item.purRate === 0 ? '' : item.purRate}
//                       onChange={(e) => {
//                         const v = e.target.value;
//                         if (v === '' || /^\d*\.?\d*$/.test(v)) {
//                           const newRate = v === '' ? 0 : parseFloat(v) || 0;
//                           if (item.lastPrice !== null && newRate !== item.purRate) {
//                             setDismissedAlerts((prev) => { const n = new Set(prev); n.delete(item.id); return n; });
//                           }
//                           onUpdateItem(item.id, { purRate: newRate });
//                         }
//                       }}
//                       onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); return; } handleCellKeyDown(e, rowIdx, 'purRate'); }}
//                       placeholder="0.00"
//                       className={`${inp} text-right`} data-row={rowIdx} data-col="purRate" />
//                   </td>

//                   {/* Last Price */}
//                   <td className={`${td} text-right`}>
//                     {item.lastPrice !== null ? (
//                       <div className="pr-1">
//                         <div className="text-xs font-semibold text-[#1e293b]">₹{item.lastPrice.toLocaleString('en-IN')}</div>
//                         <div className="text-[10px] text-slate-400">{formatDate(item.lastDate)}</div>
//                       </div>
//                     ) : item.itemName ? (
//                       <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
//                         <i className="ri-star-line" />First purchase
//                       </span>
//                     ) : null}
//                   </td>

//                   {/* Amount */}
//                   <td className={`${td} text-right`}>
//                     <div className={`${roInp} justify-end font-semibold text-[#1e293b]`}>
//                       {item.amount > 0 ? `₹${item.amount.toLocaleString('en-IN')}` : '—'}
//                     </div>
//                   </td>

//                   {/* Remove */}
//                   <td className={`${td} text-center`}>
//                     <button type="button" onClick={() => onRemoveItem(item.id)}
//                       className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 rounded cursor-pointer mt-1 opacity-0 group-hover:opacity-100 transition-all" title="Remove row">
//                       <i className="ri-delete-bin-6-line text-xs" />
//                     </button>
//                   </td>
//                 </tr>

//                 <PriceAlertRow key={`alert-${item.id}`} item={item} colSpan={13} dismissed={dismissedAlerts.has(item.id)} />
//               </React.Fragment>
//             ))}
//           </tbody>
//         </table>
//       </div>

//       <div className="border-t border-[#f1f5f9] px-4 py-2">
//         <button type="button" onClick={onAddRow}
//           className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#4f46e5] transition-colors cursor-pointer">
//           <i className="ri-add-circle-line" />Add another row
//         </button>
//       </div>
//     </div>
//   );
// }

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RefObject } from 'react';
import { mockPurchaseInvoices } from '@/mocks/billing';
import type { POItem } from '../page';
import React from 'react';
import { createPortal } from 'react-dom';
import { useWarehouseStore } from '@/stores/warehouseStore';

const api = import.meta.env.VITE_API_URL || 'http://localhost:7000';

function debounce<T extends (...args: any[]) => void>(func: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

interface LastPurchaseInfo {
  price: number;
  supplierName: string;
  date: string;
}

function getLastPurchasePrice(itemId: string): LastPurchaseInfo | null {
  if (!itemId) return null;
  let best: LastPurchaseInfo | null = null;
  for (const inv of mockPurchaseInvoices) {
    for (const it of inv.items) {
      const itWithId = it as typeof it & { itemId?: string };
      if (itWithId.itemId === itemId) {
        if (!best || inv.date > best.date) {
          best = {
            price: it.rate,
            supplierName: inv.partyName,
            date: inv.date,
          };
        }
      }
    }
  }
  return best;
}

function formatDate(d: string) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function PriceAlertRow({
  item,
  colSpan,
  dismissed,
}: {
  item: POItem;
  colSpan: number;
  dismissed: boolean;
}) {
  if (dismissed || !item.itemId || item.lastPrice === null || item.purRate <= 0)
    return null;
  const diff = item.purRate - item.lastPrice;
  const pct =
    item.lastPrice > 0
      ? Math.abs((diff / item.lastPrice) * 100).toFixed(1)
      : '0.0';
  if (diff === 0) return null;
  return (
    <tr>
      <td colSpan={colSpan} className="px-0 py-0">
        <div
          className={`mx-2 mb-1 px-3 py-2 border rounded-lg text-xs ${diff > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}
        >
          <div
            className={`flex items-center gap-2 font-semibold ${diff > 0 ? 'text-amber-700' : 'text-emerald-700'}`}
          >
            <i
              className={diff > 0 ? 'ri-alert-line' : 'ri-checkbox-circle-line'}
            />
            {diff > 0
              ? 'Price Alert: Higher than last purchase'
              : 'Price is within normal range'}
          </div>
          <div
            className={`mt-0.5 ${diff > 0 ? 'text-amber-600' : 'text-emerald-600'}`}
          >
            Last Purchase:{' '}
            <strong>₹{item.lastPrice.toLocaleString('en-IN')}</strong> from{' '}
            {item.lastSupplier} · {formatDate(item.lastDate)}
            &nbsp;&nbsp;|&nbsp;&nbsp;
            {diff > 0 ? 'Increase' : 'Saving'}:{' '}
            <strong>
              ₹{Math.abs(diff).toLocaleString('en-IN')} ({pct}%)
            </strong>
          </div>
        </div>
      </td>
    </tr>
  );
}

export interface ItemOption {
  id: string;
  name: string;
  code: string;
  barcode: string;
  hsnCode: string;
  taxRate: number;
  purchaseRate: number;
  group: string;
  brand: string;
  articleNo: string;
  size: string;
  stock: number;
  unitId?: string;
}

// ─── Dropdown rendered via Portal to escape overflow:hidden/scroll clipping ──
function ItemSearchInput({
  value,
  onChange,
  onSelect,
  onAddNew,
  options,
  loading,
  placeholder,
  dataRow,
  dataCol,
  onKeyDown,
  onOpenChange,
  onAfterSelect,
  alreadySelected,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect: (opt: ItemOption) => void;
  onAddNew: (query: string) => void;
  options: ItemOption[];
  loading: boolean;
  placeholder?: string;
  dataRow: number;
  dataCol: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onOpenChange?: (open: boolean) => void;
  onAfterSelect?: () => void;
  /** When true the row already has a confirmed item — suppress dropdown until user actually types */
  alreadySelected?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Track dropdown position for portal
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const justSelectedRef = useRef(false);
  // ✅ FIX: only show "No items found" after the user has actually triggered a search
  const hasSearchedRef = useRef(false);
  const totalOptions = options.length + 1; // +1 for Add New

  // Compute portal position whenever we open or value changes
  const updatePosition = useCallback(() => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 2,
      left: rect.left,
      width: Math.max(rect.width, 340),
      zIndex: 99999,
    });
  }, []);

  // Open/close based on value — but DON'T watch `options` to avoid re-opening after select
  const openDropdown = useCallback(
    (shouldOpen: boolean) => {
      setOpen(shouldOpen);
      onOpenChange?.(shouldOpen);
      if (shouldOpen) updatePosition();
    },
    [onOpenChange, updatePosition],
  );

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    if (value.length >= 1) {
      // ✅ FIX: Do NOT open on mount/hydration when the row is already confirmed.
      // Only open once the user has actually started a search (hasSearchedRef = true).
      if (!alreadySelected) openDropdown(true);
    } else {
      setOpen(false);
      onOpenChange?.(false);
    }
    setHighlighted(-1);
    // ⚠️ Do NOT put `options` in the dep array — that's what caused re-open after select
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        inputRef.current &&
        !inputRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOpenChange]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return;
    const handler = () => updatePosition();
    window.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      window.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [open, updatePosition]);

  const showDropdown = open && value.length >= 1;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((p) => Math.min(p + 1, totalOptions - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((p) => Math.max(p - 1, 0));
        return;
      }
      if (e.key === 'Enter' && highlighted >= 0) {
        e.preventDefault();
        if (highlighted < options.length) select(options[highlighted]);
        else addNew();
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
        onOpenChange?.(false);
        return;
      }
    }
    onKeyDown?.(e);
  };

  const select = (opt: ItemOption) => {
    justSelectedRef.current = true;
    onSelect(opt);
    // Close immediately — don't let value-change useEffect re-open
    setOpen(false);
    onOpenChange?.(false);
    onAfterSelect?.();
  };

  const addNew = () => {
    setOpen(false);
    onOpenChange?.(false);
    onAddNew(value);
  };

  const dropdown = showDropdown ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden"
    >
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {/* Column headers */}
        {!loading && options.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wide sticky top-0">
            <span className="flex-1">Item</span>
            <span className="w-20 text-center">Code</span>
            <span className="w-12 text-center">Stock</span>
            <span className="w-16 text-right">Rate</span>
          </div>
        )}

        {/* Loading — also marks that a real search has been triggered */}
        {loading &&
          (() => {
            hasSearchedRef.current = true;
            return null;
          })()}
        {loading && (
          <div className="flex items-center gap-2 px-3 py-3 text-xs text-slate-400">
            <i className="ri-loader-4-line animate-spin" /> Searching items...
          </div>
        )}

        {/* Results */}
        {!loading &&
          options.map((opt, idx) => (
            <button
              key={opt.id}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                select(opt);
              }}
              onMouseEnter={() => setHighlighted(idx)}
              className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs transition-colors border-b border-slate-50 last:border-0 ${idx === highlighted ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
            >
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-800 block truncate">
                  {opt.name}
                </span>
                {opt.barcode && (
                  <span className="text-slate-400 font-mono text-[10px]">
                    {opt.barcode}
                  </span>
                )}
              </div>
              <span className="w-20 text-center text-slate-400 font-mono text-[10px] shrink-0">
                {opt.code || '—'}
              </span>
              <span
                className={`w-12 text-center text-[10px] font-semibold shrink-0 ${opt.stock > 0 ? 'text-emerald-600' : 'text-slate-400'}`}
              >
                {opt.stock ?? 0}
              </span>
              <span className="w-16 text-right text-indigo-600 font-semibold text-[11px] shrink-0">
                {opt.purchaseRate > 0 ? `₹${opt.purchaseRate}` : '₹0.00'}
              </span>
            </button>
          ))}

        {/* No results — only shown after the user has actually typed and triggered a search */}
        {!loading && options.length === 0 && hasSearchedRef.current && (
          <div className="px-3 py-3 text-xs text-slate-400">
            No items found for "
            <span className="font-medium text-slate-600">{value}</span>"
          </div>
        )}

        {/* Add New */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            addNew();
          }}
          onMouseEnter={() => setHighlighted(options.length)}
          className={`w-full text-left px-3 py-2.5 flex items-center gap-2 text-xs font-semibold border-t border-slate-200 transition-colors ${highlighted === options.length ? 'bg-indigo-50 text-indigo-600' : 'text-indigo-600 hover:bg-indigo-50'}`}
        >
          <i className="ri-add-circle-line text-sm" />
          Add New Item{value ? ` "${value}"` : ''}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          // ✅ FIX: Don't open dropdown on focus for rows restored from a saved draft.
          // The user must type to start a new search.
          if (value.length >= 1 && !alreadySelected) {
            openDropdown(true);
          }
        }}
        placeholder={placeholder}
        data-row={dataRow}
        data-col={dataCol}
        className="w-full h-7 px-1.5 text-xs bg-transparent focus:outline-none focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-300 rounded text-slate-800 placeholder:text-slate-400 border-0"
      />
      {/* Render dropdown via portal so it's never clipped by overflow:hidden */}
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}

// ─── GroupSearchInput — category dropdown with keyboard navigation ────────────
function GroupSearchInput({
  value,
  onChange,
  categories,
  placeholder,
  dataRow,
  dataCol,
  onCellKeyDown,
}: {
  value: string;
  onChange: (v: string) => void;
  categories: { id: string; name: string }[];
  placeholder?: string;
  dataRow: number;
  dataCol: string;
  /** Forwarded to the generic cell-navigation handler when dropdown is closed */
  onCellKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<React.CSSProperties>({});

  const updatePos = useCallback(() => {
    if (!inputRef.current) return;
    const r = inputRef.current.getBoundingClientRect();
    setPos({
      position: 'fixed',
      top: r.bottom + 2,
      left: r.left,
      width: Math.max(r.width, 240),
      zIndex: 99999,
    });
  }, []);

  // Reposition on scroll / resize while open
  useEffect(() => {
    if (!open) return;
    const h = () => updatePos();
    window.addEventListener('scroll', h, true);
    window.addEventListener('resize', h);
    return () => {
      window.removeEventListener('scroll', h, true);
      window.removeEventListener('resize', h);
    };
  }, [open, updatePos]);

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        !inputRef.current?.contains(e.target as Node) &&
        !listRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = categories
    .filter((c) => c.name.toLowerCase().includes((value || '').toLowerCase()))
    .slice(0, 8);

  const select = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (open && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((p) => Math.min(p + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((p) => Math.max(p - 1, 0));
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        // Use functional setter so we always read the latest highlight value
        setHighlight((p) => {
          if (filtered[p]) select(filtered[p].name);
          return p;
        });
        return;
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    onCellKeyDown?.(e);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        placeholder={placeholder}
        data-row={dataRow}
        data-col={dataCol}
        className="w-full h-7 px-1.5 text-xs bg-transparent focus:outline-none focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-300 rounded text-slate-800 placeholder:text-slate-400 border-0 transition-colors"
        onChange={(e) => {
          onChange(e.target.value);
          updatePos();
          setHighlight(0);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          updatePos();
          setHighlight(0);
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={handleKeyDown}
      />
      {open &&
        filtered.length > 0 &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={listRef}
            style={pos}
            className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden"
          >
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {filtered.map((cat, i) => (
                <div
                  key={cat.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(cat.name);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={`px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                    i === highlight
                      ? 'bg-indigo-100 text-indigo-700 font-medium'
                      : 'hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}

// ─── Main table ───────────────────────────────────────────────────────────────
interface Props {
  items: POItem[];
  tableRef: RefObject<HTMLDivElement | null>;
  onUpdateItem: (id: string, patch: Partial<POItem>) => void;
  onRemoveItem: (id: string) => void;
  onAddRow: () => void;
  onAddNewItem?: (query: string, rowId: string) => void;
}

const COLS = [
  'item',
  'size',
  'hsn',
  'gst',
  'group',
  'brand',
  'articleNo',
  'qty',
  'purRate',
] as const;
type ColName = (typeof COLS)[number];

function focusCell(tableEl: HTMLElement | null, rowIdx: number, col: string) {
  if (!tableEl) return;
  const cell = tableEl.querySelector(
    `[data-row="${rowIdx}"][data-col="${col}"]`,
  ) as HTMLElement | null;
  if (!cell) return;
  if (cell.tagName === 'INPUT') {
    (cell as HTMLInputElement).focus();
    return;
  }
  const inner = cell.querySelector('input') as HTMLInputElement | null;
  inner?.focus();
}

export default function POItemsTable({
  items,
  tableRef,
  onUpdateItem,
  onRemoveItem,
  onAddRow,
  onAddNewItem,
}: Props) {
  // ── Fetch parent categories for Group dropdown ────────────────────────────
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  useEffect(() => {
    let ok = true;
    const token = localStorage.getItem('token') ?? '';
    fetch(`${api}/api/v1/categories/all`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!ok) return;
        setCategories(
          (d?.data ?? [])
            .filter((c: any) => !c.parentId && !c.parent_id)
            .map((c: any) => ({ id: c.id, name: c.name })),
        );
      })
      .catch(() => {});
    return () => {
      ok = false;
    };
  }, []);

  const [itemQueries, setItemQueries] = useState<Record<string, string>>(() => {
    // ✅ FIX: Pre-populate queries for items that were restored from a saved draft
    // so that coming back to the page doesn't show "item not found".
    const init: Record<string, string> = {};
    items.forEach((it) => {
      if (it.itemId && it.itemName) init[it.id] = it.itemName;
    });
    return init;
  });
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set(),
  );

  const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);

  // ✅ FIX: Per-row item options & loading state — prevents cross-row contamination
  const [itemOptions, setItemOptions] = useState<Record<string, ItemOption[]>>(
    {},
  );
  const [searching, setSearching] = useState<Record<string, boolean>>({});

  const selectedRowsRef = useRef<Set<string>>(new Set());
  const dropdownOpenRef = useRef<Record<number, boolean>>({});

  // ✅ FIX: When items are hydrated from a draft (e.g. after navigating back),
  // ensure itemQueries & selectedRowsRef are kept in sync for pre-filled rows.
  useEffect(() => {
    setItemQueries((prev) => {
      const updated = { ...prev };
      let changed = false;
      items.forEach((it) => {
        if (it.itemId && it.itemName && !updated[it.id]) {
          updated[it.id] = it.itemName;
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
    // Mark already-selected rows so keyboard-nav skips the search step
    items.forEach((it) => {
      if (it.itemId) selectedRowsRef.current.add(it.id);
    });
  }, [items]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchItems = useCallback(
    debounce(async (val: string, rowId: string) => {
      if (val.length < 1) {
        setItemOptions((prev) => ({ ...prev, [rowId]: [] }));
        setSearching((prev) => ({ ...prev, [rowId]: false }));
        return;
      }
      setSearching((prev) => ({ ...prev, [rowId]: true }));
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams();
        params.append('search', val);
        if (selectedWarehouseId && selectedWarehouseId !== 'ALL') {
          params.append('warehouseId', selectedWarehouseId);
        }
        const res = await fetch(
          `${api}/api/v1/item/filter?${params.toString()}`,
          { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
        );
        const data = await res.json();
        const mapped: ItemOption[] = (data?.data || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          code: item.code || '',
          barcode: item.barcode || '',
          hsnCode: item.hsn_code || '',
          taxRate: item.gst_rate || 0,
          purchaseRate: item.purchase_rate || 0,
          group:
            item.category_name ||
            item.category ||
            item.group_name ||
            item.group ||
            '',
          brand: item.brand || '',
          articleNo: item.article_no || '',
          size: item.size || '',
          stock: Number(item.stock) || 0,
          unitId: item.primary_unit_id || '',
        }));
        setItemOptions((prev) => ({ ...prev, [rowId]: mapped }));
      } catch (err) {
        console.error('Item fetch error:', err);
        setItemOptions((prev) => ({ ...prev, [rowId]: [] }));
      } finally {
        setSearching((prev) => ({ ...prev, [rowId]: false }));
      }
    }, 300),
    [selectedWarehouseId],
  );

  const selectItem = useCallback(
    (rowId: string, opt: ItemOption) => {
      const lastInfo = getLastPurchasePrice(opt.id);
      // ✅ FIX: Update query display name THEN clear options for this row only
      setItemQueries((prev) => ({ ...prev, [rowId]: opt.name }));
      setItemOptions((prev) => ({ ...prev, [rowId]: [] }));
      // clear so dropdown won't re-open
      setSearching((prev) => ({ ...prev, [rowId]: false }));
      selectedRowsRef.current.add(rowId);
      setDismissedAlerts((prev) => {
        const n = new Set(prev);
        n.delete(rowId);
        return n;
      });
      onUpdateItem(rowId, {
        itemId: opt.id,
        itemName: opt.name,
        barcode: opt.barcode,
        size: opt.size,
        hsnCode: opt.hsnCode,
        gstRate: opt.taxRate,
        group: opt.group,
        brand: opt.brand,
        articleNo: opt.articleNo,
        purRate: opt.purchaseRate,
        unitId: opt.unitId,
        stock: opt.stock,
        lastPrice: lastInfo?.price ?? null,
        lastSupplier: lastInfo?.supplierName ?? '',
        lastDate: lastInfo?.date ?? '',
      });
    },
    [onUpdateItem],
  );

  const handleItemKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, rowIdx: number) => {
      const isDropdownOpen = dropdownOpenRef.current[rowIdx] === true;
      if (isDropdownOpen) return;
      const item = items[rowIdx];
      const isLastRow = rowIdx === items.length - 1;

      if (e.key === 'Enter') {
        const val = (itemQueries[item.id] ?? item.itemName ?? '').trim();
        if (!val) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        if (item.itemId || selectedRowsRef.current.has(item.id)) {
          e.preventDefault();
          e.stopPropagation();
          focusCell(tableRef.current, rowIdx, 'size');
          return;
        }
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        focusCell(tableRef.current, rowIdx, 'size');
      } else if (e.key === 'ArrowDown' && !isLastRow) {
        e.preventDefault();
        focusCell(tableRef.current, rowIdx + 1, 'item');
      } else if (e.key === 'ArrowUp' && rowIdx > 0) {
        e.preventDefault();
        focusCell(tableRef.current, rowIdx - 1, 'item');
      }
    },
    [items, itemQueries, tableRef],
  );

  const handleCellKeyDown = useCallback(
    (
      e: React.KeyboardEvent<HTMLInputElement>,
      rowIdx: number,
      col: ColName,
    ) => {
      const colIdx = COLS.indexOf(col);
      const isLastCol = colIdx === COLS.length - 1;
      const isLastRow = rowIdx === items.length - 1;

      switch (e.key) {
        case 'Enter': {
          e.preventDefault();
          if (isLastCol) {
            const rowId = items[rowIdx].id;
            setDismissedAlerts((prev) => {
              const n = new Set(prev);
              n.add(rowId);
              return n;
            });
            if (isLastRow) {
              onAddRow();
              setTimeout(
                () => focusCell(tableRef.current, rowIdx + 1, 'item'),
                80,
              );
            } else {
              focusCell(tableRef.current, rowIdx + 1, 'item');
            }
          } else {
            focusCell(tableRef.current, rowIdx, COLS[colIdx + 1]);
          }
          break;
        }
        case 'ArrowRight':
          if (colIdx < COLS.length - 1) {
            e.preventDefault();
            focusCell(tableRef.current, rowIdx, COLS[colIdx + 1]);
          }
          break;
        case 'ArrowLeft':
          if (colIdx > 0) {
            e.preventDefault();
            focusCell(tableRef.current, rowIdx, COLS[colIdx - 1]);
          }
          break;
        case 'ArrowDown':
          if (!isLastRow) {
            e.preventDefault();
            focusCell(tableRef.current, rowIdx + 1, col);
          }
          break;
        case 'ArrowUp':
          if (rowIdx > 0) {
            e.preventDefault();
            focusCell(tableRef.current, rowIdx - 1, col);
          }
          break;
      }
    },
    [items, onAddRow, tableRef],
  );

  const th =
    'px-2 py-2.5 text-left text-[10px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 whitespace-nowrap bg-slate-50 select-none';
  const td = 'px-1 py-1 align-middle';
  const inp =
    'w-full h-7 px-1.5 text-xs bg-transparent focus:outline-none focus:bg-indigo-50 focus:ring-1 focus:ring-indigo-300 rounded text-slate-800 placeholder:text-slate-400 border-0 transition-colors';
  const roInp =
    'w-full h-7 px-1.5 text-xs bg-transparent rounded text-slate-500 flex items-center';

  return (
    <div ref={tableRef} className="flex flex-col">
      {/* ✅ FIX: overflow-visible so the portal-based dropdown is never clipped.
          The table scroll container uses overflow-x-auto but overflow-y-visible. */}
      <div
        className="overflow-x-auto overflow-y-visible"
        style={{ maxHeight: '30vh', overflowY: 'auto' }}
      >
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={`${th} w-8 text-center`}>#</th>
              <th className={`${th} min-w-[220px]`}>Item / Barcode</th>
              <th className={`${th} w-20`}>Size</th>
              <th className={`${th} w-24`}>HSN</th>
              <th className={`${th} w-16 text-right`}>GST%</th>
              <th className={`${th} w-24`}>Group</th>
              <th className={`${th} w-24`}>Brand</th>
              <th className={`${th} w-28`}>Article/Model</th>
              <th className={`${th} w-20 text-right`}>Qty</th>
              <th className={`${th} w-28 text-right`}>Pur Rate</th>
              <th className={`${th} w-36 text-right`}>Last Price</th>
              <th className={`${th} w-28 text-right`}>Amount</th>
              <th className={`${th} w-8`}></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, rowIdx) => (
              <React.Fragment key={item.id || rowIdx}>
                <tr
                  className={`group border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${rowIdx % 2 === 1 ? 'bg-slate-50/40' : 'bg-white'}`}
                >
                  {/* # */}
                  <td
                    className={`${td} text-center text-[11px] text-slate-400 font-medium`}
                  >
                    {rowIdx + 1}
                  </td>

                  {/* Item search — uses portal dropdown */}
                  <td className={td} data-row={rowIdx} data-col="item">
                    <ItemSearchInput
                      value={itemQueries[item.id] ?? item.itemName}
                      onChange={(v: string) => {
                        setItemQueries((prev) => ({ ...prev, [item.id]: v }));
                        if (v.length >= 1) {
                          fetchItems(v, item.id);
                        } else {
                          setItemOptions((prev) => ({
                            ...prev,
                            [item.id]: [],
                          }));
                          setSearching((prev) => ({
                            ...prev,
                            [item.id]: false,
                          }));
                          selectedRowsRef.current.delete(item.id);
                          setDismissedAlerts((prev) => {
                            const n = new Set(prev);
                            n.delete(item.id);
                            return n;
                          });
                          onUpdateItem(item.id, {
                            itemId: '',
                            itemName: '',
                            barcode: '',
                            size: '',
                            hsnCode: '',
                            gstRate: 0,
                            group: '',
                            brand: '',
                            articleNo: '',
                            purRate: 0,
                            lastPrice: null,
                            lastSupplier: '',
                            lastDate: '',
                          });
                        }
                      }}
                      onSelect={(opt) => selectItem(item.id, opt)}
                      onAddNew={(query) => onAddNewItem?.(query, item.id)}
                      options={itemOptions[item.id] ?? []}
                      loading={searching[item.id] ?? false}
                      placeholder="Item name or barcode..."
                      dataRow={rowIdx}
                      dataCol="item"
                      onKeyDown={(e) => handleItemKeyDown(e, rowIdx)}
                      onOpenChange={(open) => {
                        dropdownOpenRef.current[rowIdx] = open;
                      }}
                      onAfterSelect={() => {
                        // ✅ NEW
                        setTimeout(
                          () => focusCell(tableRef.current, rowIdx, 'qty'),
                          50,
                        );
                      }}
                      alreadySelected={!!item.itemId}
                    />
                  </td>

                  {/* Size */}
                  <td className={td}>
                    <input
                      type="text"
                      value={item.size}
                      placeholder="size"
                      onChange={(e) =>
                        onUpdateItem(item.id, { size: e.target.value })
                      }
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'size')}
                      className={inp}
                      data-row={rowIdx}
                      data-col="size"
                    />
                  </td>

                  {/* HSN */}
                  <td className={td}>
                    <input
                      type="text"
                      value={item.hsnCode}
                      placeholder="HSN"
                      onChange={(e) =>
                        onUpdateItem(item.id, { hsnCode: e.target.value })
                      }
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'hsn')}
                      className={inp}
                      data-row={rowIdx}
                      data-col="hsn"
                    />
                  </td>

                  {/* GST% */}
                  <td className={td}>
                    <input
                      type="text"
                      value={item.gstRate === 0 ? '' : item.gstRate}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d*$/.test(v))
                          onUpdateItem(item.id, {
                            gstRate: v === '' ? 0 : parseFloat(v) || 0,
                          });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          return;
                        }
                        handleCellKeyDown(e, rowIdx, 'gst');
                      }}
                      placeholder="0"
                      className={`${inp} text-right`}
                      data-row={rowIdx}
                      data-col="gst"
                    />
                  </td>

                  {/* Group — searchable category dropdown with keyboard navigation */}
                  <td className={td}>
                    <GroupSearchInput
                      value={item.group}
                      onChange={(val) => onUpdateItem(item.id, { group: val })}
                      categories={categories}
                      placeholder="Group"
                      dataRow={rowIdx}
                      dataCol="group"
                      onCellKeyDown={(e) =>
                        handleCellKeyDown(e, rowIdx, 'group')
                      }
                    />
                  </td>

                  {/* Brand */}
                  <td className={td}>
                    <input
                      type="text"
                      value={item.brand}
                      placeholder="Brand"
                      onChange={(e) =>
                        onUpdateItem(item.id, { brand: e.target.value })
                      }
                      onKeyDown={(e) => handleCellKeyDown(e, rowIdx, 'brand')}
                      className={inp}
                      data-row={rowIdx}
                      data-col="brand"
                    />
                  </td>

                  {/* Article/Model */}
                  <td className={td}>
                    <input
                      type="text"
                      value={item.articleNo}
                      placeholder="Article/Model"
                      onChange={(e) =>
                        onUpdateItem(item.id, { articleNo: e.target.value })
                      }
                      onKeyDown={(e) =>
                        handleCellKeyDown(e, rowIdx, 'articleNo')
                      }
                      className={inp}
                      data-row={rowIdx}
                      data-col="articleNo"
                    />
                  </td>

                  {/* Qty */}
                  <td className={td}>
                    <input
                      type="text"
                      value={item.qty === 0 ? '' : item.qty}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d+$/.test(v))
                          onUpdateItem(item.id, {
                            qty: v === '' ? 0 : parseInt(v, 10),
                          });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          return;
                        }
                        handleCellKeyDown(e, rowIdx, 'qty');
                      }}
                      placeholder="1"
                      className={`${inp} text-right`}
                      data-row={rowIdx}
                      data-col="qty"
                    />
                  </td>

                  {/* Pur Rate */}
                  <td className={td}>
                    <input
                      type="text"
                      value={item.purRate === 0 ? '' : item.purRate}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '' || /^\d*\.?\d*$/.test(v)) {
                          const newRate = v === '' ? 0 : parseFloat(v) || 0;
                          if (
                            item.lastPrice !== null &&
                            newRate !== item.purRate
                          ) {
                            setDismissedAlerts((prev) => {
                              const n = new Set(prev);
                              n.delete(item.id);
                              return n;
                            });
                          }
                          onUpdateItem(item.id, { purRate: newRate });
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                          e.preventDefault();
                          return;
                        }
                        handleCellKeyDown(e, rowIdx, 'purRate');
                      }}
                      placeholder="0.00"
                      className={`${inp} text-right`}
                      data-row={rowIdx}
                      data-col="purRate"
                    />
                  </td>

                  {/* Last Price */}
                  <td className={`${td} text-right`}>
                    {item.lastPrice !== null ? (
                      <div className="pr-1">
                        <div className="text-xs font-semibold text-slate-800">
                          ₹{item.lastPrice.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatDate(item.lastDate)}
                        </div>
                      </div>
                    ) : item.itemName ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                        <i className="ri-star-line" />
                        First purchase
                      </span>
                    ) : null}
                  </td>

                  {/* Amount */}
                  <td className={`${td} text-right`}>
                    <div
                      className={`${roInp} justify-end font-semibold text-slate-800`}
                    >
                      {item.amount > 0 ? (
                        `₹${item.amount.toLocaleString('en-IN')}`
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </div>
                  </td>

                  {/* Remove */}
                  <td className={`${td} text-center`}>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 rounded cursor-pointer opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove row"
                    >
                      <i className="ri-delete-bin-6-line text-xs" />
                    </button>
                  </td>
                </tr>

                <PriceAlertRow
                  key={`alert-${item.id}`}
                  item={item}
                  colSpan={13}
                  dismissed={dismissedAlerts.has(item.id)}
                />
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-4 py-2.5">
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <i className="ri-add-circle-line text-sm" />
          Add another row
        </button>
      </div>
    </div>
  );
}
