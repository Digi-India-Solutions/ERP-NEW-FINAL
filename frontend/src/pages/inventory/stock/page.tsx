// import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
// import AppLayout from '@/components/feature/AppLayout';
// import { useToast } from '@/contexts/ToastContext';
// import { useKeyboardNav } from '@/utils/keyboardNav';
// import { useWarehouseList } from '@/hooks/useWarehouses';
// import { stockService, type StockStatus, type StockViewItem } from '@/services/stockService';
// import { useAuth } from '@/contexts/AuthContext';
// import { MODULES } from '@/utils/permissions';
// import { useWarehouseStore } from '@/stores/warehouseStore';


// const INVENTORY_STOCK_UPDATED_EVENT = 'inventory:stock-updated';

// interface WarehouseBreakdown {
//   warehouseId: string;
//   warehouseName: string;
//   qty: number;
// }

// interface StockItem {
//   id: string;
//   name: string;
//   code: string | null;
//   unit: string | null;
//   categoryName: string | null;
//   brand: string | null;
//   minStockLevel: number;
//   totalStock: number;
//   status: StockStatus;
//   warehouseStocks: WarehouseBreakdown[];
// }

// interface WarehouseOption {
//   id: string;
//   name: string;
// }

// interface StockStats {
//   totalItems: number;
//   outOfStock: number;
//   lowStock: number;
//   normal: number;
//   totalStockQty: number;
// }

// const mapStockItem = (item: StockViewItem): StockItem => ({
//   id: item.id,
//   name: item.name,
//   code: item.code,
//   unit: item.unit,
//   categoryName: item.categoryName,
//   brand: item.brand,
//   minStockLevel: item.minStockLevel,
//   totalStock: item.totalStock,
//   status: item.status,
//   warehouseStocks: item.warehouseStocks,
// });

// const getStatus = (qty: number, min: number) => {
//   if (qty === 0) return { label: 'Out of Stock', dot: 'bg-red-500', cls: 'bg-red-50 text-red-700 border-red-200' };
//   if (qty < min) return { label: 'Low Stock', dot: 'bg-red-400', cls: 'bg-red-50 text-red-600 border-red-100' };
//   if (qty === min) return { label: 'At Minimum', dot: 'bg-amber-400', cls: 'bg-amber-50 text-amber-700 border-amber-100' };
//   return { label: 'Normal', dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
// };

// const getWHStatus = (qty: number, min: number) => {
//   if (qty === 0) return { icon: 'ri-close-circle-fill', color: 'text-red-500', label: 'Empty' };
//   if (qty < min) return { icon: 'ri-error-warning-fill', color: 'text-amber-500', label: 'Low' };
//   return { icon: 'ri-checkbox-circle-fill', color: 'text-emerald-500', label: 'OK' };
// };

// interface AdjustModalProps {
//   item: StockItem;
//   warehouseOptions: WarehouseOption[];
//   defaultWarehouseId?: string;
//   onClose: () => void;
//   onSave: (warehouseId: string, type: 'INCREASE' | 'DECREASE', qty: number, reason: string) => Promise<void>;
// }

// function AdjustStockModal({ item, warehouseOptions, defaultWarehouseId, onClose, onSave }: AdjustModalProps) {
//   const formRef = useRef<HTMLDivElement>(null);
//   useKeyboardNav(formRef);

//   const [type, setType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
//   const [warehouseId, setWarehouseId] = useState(defaultWarehouseId ?? item.warehouseStocks[0]?.warehouseId ?? warehouseOptions[0]?.id ?? '');
//   const [qty, setQty] = useState(1);
//   const [reason, setReason] = useState('');
//   const [error, setError] = useState('');
//   const [saving, setSaving] = useState(false);

//   const whStock = item.warehouseStocks.find((w) => w.warehouseId === warehouseId);
//   const currentQty = whStock?.qty ?? 0;
//   const afterQty = type === 'INCREASE' ? currentQty + qty : Math.max(0, currentQty - qty);

//   const handleSave = async () => {
//     setError('');

//     if (!warehouseId) {
//       setError('Select a warehouse');
//       return;
//     }
//     if (qty <= 0) {
//       setError('Quantity must be greater than 0');
//       return;
//     }
//     if (!reason.trim()) {
//       setError('Reason is required');
//       return;
//     }
//     if (type === 'DECREASE' && qty > currentQty) {
//       setError(`Cannot reduce by more than current stock in this warehouse (${currentQty})`);
//       return;
//     }

//     setSaving(true);
//     try {
//       await onSave(warehouseId, type, qty, reason.trim());
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Failed to apply adjustment');
//     } finally {
//       setSaving(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
//       <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
//         <div className="mb-4 flex items-center justify-between">
//           <div>
//             <h3 className="text-base font-semibold text-[#1e293b]">Adjust Stock</h3>
//             <p className="mt-0.5 max-w-[240px] truncate text-xs text-[#64748b]">{item.name}</p>
//           </div>
//           <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer">
//             <i className="ri-close-line" />
//           </button>
//         </div>

//         <div className="mb-4 flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3">
//           <div className="text-center">
//             <p className="text-2xl font-bold text-[#1e293b]">{currentQty}</p>
//             <p className="text-xs text-[#64748b]">{item.unit ?? 'Units'} · Before</p>
//           </div>
//           <div className="h-px flex-1 bg-[#e2e8f0]" />
//           <i className="ri-arrow-right-line text-[#94a3b8]" />
//           <div className="text-center">
//             <p className={`text-2xl font-bold ${type === 'INCREASE' ? 'text-emerald-600' : 'text-red-600'}`}>
//               {afterQty}
//             </p>
//             <p className="text-xs text-[#64748b]">{item.unit ?? 'Units'} · After</p>
//           </div>
//         </div>

//         <div ref={formRef} className="space-y-3">
//           <div className="flex gap-2">
//             {(['INCREASE', 'DECREASE'] as const).map((currentType) => (
//               <button
//                 key={currentType}
//                 type="button"
//                 onClick={() => setType(currentType)}
//                 className={`flex-1 h-9 whitespace-nowrap rounded-lg border text-sm font-medium transition-colors cursor-pointer ${type === currentType
//                   ? (currentType === 'INCREASE' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-700')
//                   : 'border-[#e2e8f0] bg-white text-slate-500 hover:border-slate-300'}`}
//               >
//                 <i className={`${currentType === 'INCREASE' ? 'ri-arrow-up-line text-emerald-500' : 'ri-arrow-down-line text-red-500'} mr-1`} />
//                 {currentType === 'INCREASE' ? 'Add Stock' : 'Reduce Stock'}
//               </button>
//             ))}
//           </div>

//           <div>
//             <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">Warehouse</label>
//             <select
//               value={warehouseId}
//               onChange={(e) => setWarehouseId(e.target.value)}
//               data-nav-index={0}
//               className="h-10 w-full cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm focus:border-[#4f46e5] focus:outline-none"
//             >
//               {warehouseOptions.length === 0 && <option value="">No warehouses available</option>}
//               {warehouseOptions.map((warehouse) => (
//                 <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">
//               Quantity <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="number"
//               min="1"
//               value={qty}
//               onChange={(e) => {
//                 setQty(parseInt(e.target.value, 10) || 1);
//                 setError('');
//               }}
//               data-nav-index={1}
//               className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
//             />
//           </div>

//           <div>
//             <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">
//               Reason <span className="text-red-500">*</span>
//             </label>
//             <input
//               type="text"
//               value={reason}
//               onChange={(e) => {
//                 setReason(e.target.value);
//                 setError('');
//               }}
//               data-nav-index={2}
//               placeholder="Physical count, damage, purchase..."
//               className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
//             />
//           </div>

//           {error && <p className="flex items-center gap-1 text-xs text-red-500"><i className="ri-error-warning-line" />{error}</p>}
//         </div>

//         <div className="mt-5 flex gap-2">
//           <button
//             onClick={onClose}
//             className="h-9 flex-1 whitespace-nowrap rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => void handleSave()}
//             disabled={saving}
//             className={`flex h-9 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 cursor-pointer ${type === 'INCREASE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}
//           >
//             {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-check-line" /> Apply</>}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function StockViewPage() {
//   const toast = useToast();
//   const { selectedWarehouseId, selectedWarehouseName, setSelectedWarehouse } = useWarehouseStore();
//   const [stockItems, setStockItems] = useState<StockItem[]>([]);
//   const [stats, setStats] = useState<StockStats | null>(null);
//   const [search, setSearch] = useState('');
//   const [warehouseFilter, setWarehouseFilter] = useState(selectedWarehouseId || '');
//   const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
//   const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const { hasPermission, hasControl } = useAuth();
//   const canAdjustStock = hasPermission(MODULES.STOCK_ADJUSTMENT, 'create') || hasControl('approveStockAdjustment');

//   const { data: warehousePage } = useWarehouseList({ limit: 200 });

//   const warehouseOptions = useMemo<WarehouseOption[]>(() => {
//     const merged = new Map<string, WarehouseOption>();

//     for (const warehouse of warehousePage?.items ?? []) {
//       if (warehouse.isActive) merged.set(warehouse.id, { id: warehouse.id, name: warehouse.name });
//     }

//     for (const item of stockItems) {
//       for (const breakdown of item.warehouseStocks) {
//         if (!merged.has(breakdown.warehouseId)) {
//           merged.set(breakdown.warehouseId, { id: breakdown.warehouseId, name: breakdown.warehouseName });
//         }
//       }
//     }

//     return Array.from(merged.values());
//   }, [warehousePage, stockItems]);

//   const loadStock = async () => {
//     setLoading(true);
//     setError('');

//     const [stockResult, statsResult] = await Promise.allSettled([
//       stockService.getStock(),
//       stockService.getStockStats(),
//     ]);

//     if (stockResult.status === 'rejected') {
//       const message = stockResult.reason instanceof Error ? stockResult.reason.message : 'Failed to load stock data';
//       setError(message);
//       setStockItems([]);
//       setStats(null);
//       setLoading(false);
//       return;
//     }

//     const stockRows = Array.isArray(stockResult.value?.data) ? stockResult.value.data : [];
//     setStockItems(stockRows.map(mapStockItem));

//     if (statsResult.status === 'fulfilled') {
//       setStats(statsResult.value);
//     } else {
//       setStats(null);
//     }

//     setLoading(false);
//   };

//   useEffect(() => {
//     void loadStock();
//   }, []);

//   useEffect(() => {
//     const handleStockUpdated = () => {
//       void loadStock();
//     };

//     window.addEventListener(INVENTORY_STOCK_UPDATED_EVENT, handleStockUpdated);
//     return () => {
//       window.removeEventListener(INVENTORY_STOCK_UPDATED_EVENT, handleStockUpdated);
//     };
//   }, []);

//   const toggleExpand = (id: string) => {
//     setExpandedRows((prev) => {
//       const next = new Set(prev);
//       if (next.has(id)) next.delete(id);
//       else next.add(id);
//       return next;
//     });
//   };

//   const getDisplayQty = (item: StockItem) => {
//     if (!warehouseFilter) return item.totalStock;
//     return item.warehouseStocks.find((warehouse) => warehouse.warehouseId === warehouseFilter)?.qty ?? 0;
//   };

//   const filteredItems = useMemo(
//     () => stockItems.filter((item) => {
//       const searchValue = search.trim().toLowerCase();
//       if (!searchValue) return true;

//       return [item.name, item.code, item.categoryName, item.brand]
//         .filter(Boolean).some((value) => String(value).toLowerCase().includes(searchValue));
//     }),
//     [stockItems, search],
//   );

//   const filteredItems2 = filteredItems.filter((item)=>item.warehouseId === warehouseFilter)
//   const lowCount = useMemo(
//     () => stockItems.filter((item) => item.totalStock < item.minStockLevel).length,
//     [stockItems],
//   );

//   const handleAdjust = async (warehouseId: string, type: 'INCREASE' | 'DECREASE', qty: number, reason: string) => {
//     if (!adjustItem) throw new Error('Select an item first');

//     const targetItemId = adjustItem.id;

//     const adjustment = await stockService.createAdjustment({
//       warehouseId,
//       itemId: targetItemId,
//       type,
//       quantity: qty,
//       reason,
//     });

//     setStockItems((prev) => prev.map((item) => {
//       if (item.id !== targetItemId) return item;

//       let warehouseFound = false;
//       const nextWarehouseStocks = item.warehouseStocks.map((warehouseStock) => {
//         if (warehouseStock.warehouseId !== warehouseId) return warehouseStock;

//         warehouseFound = true;
//         return {
//           ...warehouseStock,
//           qty: typeof adjustment.meta?.updatedWarehouseQty === 'number'
//             ? adjustment.meta.updatedWarehouseQty
//             : (type === 'INCREASE'
//               ? warehouseStock.qty + qty
//               : Math.max(0, warehouseStock.qty - qty)),
//         };
//       });

//       if (!warehouseFound) {
//         nextWarehouseStocks.push({
//           warehouseId,
//           warehouseName: warehouseOptions.find((warehouse) => warehouse.id === warehouseId)?.name ?? 'Warehouse',
//           qty: typeof adjustment.meta?.updatedWarehouseQty === 'number'
//             ? adjustment.meta.updatedWarehouseQty
//             : (type === 'INCREASE' ? qty : 0),
//         });
//       }

//       const totalStock = typeof adjustment.meta?.updatedItemTotalStock === 'number'
//         ? adjustment.meta.updatedItemTotalStock
//         : nextWarehouseStocks.reduce((sum, current) => sum + current.qty, 0);

//       return { ...item, warehouseStocks: nextWarehouseStocks, totalStock };
//     }));

//     toast.success(`${adjustment.adjustmentNumber} saved for ${adjustment.itemName ?? adjustItem.name}`);

//     try {
//       await loadStock();
//     } catch {
//       // Keep optimistic UI state if refetch fails; next refresh will reconcile.
//     }

//     setAdjustItem(null);
//   };

//   return (
//     <AppLayout>
//       <div className="min-h-full bg-[#f8fafc] p-6">
//         <div className="mb-5 flex items-center justify-between">
//           <div>
//             <h1 className="text-xl font-bold text-[#1e293b]">Stock View</h1>
//             <p className="text-sm text-slate-500">
//               {filteredItems.length} items
//               {stats && <span className="ml-2 text-slate-400">{stats.totalStockQty} total units</span>}
//               {lowCount > 0 && <span className="ml-2 font-medium text-red-600">{lowCount} low stock</span>}
//             </p>
//           </div>
//         </div>

//         <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">
//           <div className="flex flex-wrap items-center gap-3 border-b border-[#e2e8f0] p-4">
//             <div className="relative w-64">
//               <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
//               <input
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search item name, code, category..."
//                 className="h-9 w-full rounded-lg border border-[#e2e8f0] pl-8 pr-3 text-sm focus:border-[#4f46e5] focus:outline-none"
//               />
//             </div>
//             <select
//               value={warehouseFilter}
//               onChange={(e) => setWarehouseFilter(e.target.value)}
//               className="h-9 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm focus:border-[#4f46e5] focus:outline-none"
//             >
//               <option value="">All Warehouses (Total)</option>
//               {warehouseOptions.map((warehouse) => <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>)}
//             </select>
//             {/* {warehouseFilter && (
//               <span className="flex h-7 items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-medium text-[#4f46e5]">
//                 <i className="ri-filter-3-line" />
//                 {warehouseOptions.find((warehouse) => warehouse.id === warehouseFilter)?.name ?? warehouseFilter}
//                 <button onClick={() => setWarehouseFilter('')} className="cursor-pointer hover:text-indigo-800">
//                   <i className="ri-close-line" />
//                 </button>
//               </span>
//             )} */}
//           </div>

//           {error ? (
//             <div className="p-10 text-center text-slate-500">
//               <i className="ri-error-warning-line mb-2 block text-3xl text-red-400" />
//               <p>{error}</p>
//               <button
//                 onClick={() => void loadStock()}
//                 className="mt-4 h-9 rounded-lg bg-[#4f46e5] px-4 text-sm font-medium text-white hover:bg-[#4338ca]"
//               >
//                 Retry
//               </button>
//             </div>
//           ) : loading ? (
//             <div className="p-10 text-center text-slate-500">
//               <i className="ri-loader-4-line mb-2 block animate-spin text-3xl text-[#4f46e5]" />
//               Loading stock data...
//             </div>
//           ) : (
//             <>
//               <table className="w-full text-sm">
//                 <thead className="bg-slate-50">
//                   <tr>
//                     <th className="w-8 border-b border-[#e2e8f0] px-2 py-3" />
//                     <th className="border-b border-[#e2e8f0] px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-slate-500">Item</th>
//                     <th className="border-b border-[#e2e8f0] px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-slate-500">Code</th>
//                     <th className="border-b border-[#e2e8f0] px-4 py-3 text-right text-xs font-semibold whitespace-nowrap text-slate-500">
//                       {warehouseFilter ? `${warehouseOptions.find((warehouse) => warehouse.id === warehouseFilter)?.name ?? 'Warehouse'} Qty` : 'Total Stock'}
//                     </th>
//                     <th className="border-b border-[#e2e8f0] px-4 py-3 text-right text-xs font-semibold whitespace-nowrap text-slate-500">Min Level</th>
//                     <th className="border-b border-[#e2e8f0] px-4 py-3 text-left text-xs font-semibold whitespace-nowrap text-slate-500">Status</th>
//                     <th className="border-b border-[#e2e8f0] px-4 py-3" />
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredItems.map((item, index) => {
//                     const displayQty = getDisplayQty(item);
//                     const status = getStatus(displayQty, item.minStockLevel);
//                     const expanded = expandedRows.has(item.id);

//                     return (
//                       <Fragment key={item.id}>
//                         <tr className={`group border-b border-slate-50 hover:bg-slate-50 ${index % 2 === 1 ? 'bg-[#fafafa]' : ''}`}>
//                           <td className="px-2 py-3 text-center">
//                             <button
//                               onClick={() => toggleExpand(item.id)}
//                               className={`flex h-6 w-6 items-center justify-center rounded transition-all cursor-pointer ${expanded ? 'bg-indigo-100 text-[#4f46e5]' : 'text-slate-400 hover:bg-slate-100'}`}
//                               title={expanded ? 'Hide warehouse breakdown' : 'Show warehouse breakdown'}
//                             >
//                               <i className={`text-xs ${expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}`} />
//                             </button>
//                           </td>
//                           <td className="px-4 py-3">
//                             <div className="font-medium text-[#1e293b]">{item.name}</div>
//                             <div className="text-xs text-slate-400">{item.categoryName ?? item.brand ?? 'Uncategorized'}</div>
//                           </td>
//                           <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.code ?? '—'}</td>
//                           <td className={`px-4 py-3 text-right font-semibold ${displayQty < item.minStockLevel ? 'text-red-600' : 'text-[#1e293b]'}`}>
//                             {displayQty} <span className="text-xs font-normal text-slate-400">{item.unit ?? 'Units'}</span>
//                           </td>
//                           <td className="px-4 py-3 text-right text-slate-500">{item.minStockLevel}</td>
//                           <td className="px-4 py-3">
//                             <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${status.cls}`}>
//                               <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
//                               {status.label}
//                             </span>
//                           </td>
//                           {canAdjustStock && (
//                             <td className="px-4 py-3">
//                               <button
//                                 onClick={() => setAdjustItem(item)}
//                                 className="flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-medium text-[#4f46e5] opacity-0 transition-all hover:bg-indigo-100 cursor-pointer group-hover:opacity-100"
//                               >
//                                 <i className="ri-scales-3-line text-sm" /> Adjust
//                               </button>
//                             </td>)}
//                         </tr>

//                         {expanded && (
//                           <tr className="border-b border-slate-100 bg-[#f8fafc]">
//                             <td />
//                             <td colSpan={6} className="px-4 py-3">
//                               <div className="ml-4 space-y-1.5">
//                                 <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Warehouse Breakdown</p>
//                                 {item.warehouseStocks.length === 0 ? (
//                                   <div className="rounded-lg border border-dashed border-[#e2e8f0] bg-white px-3 py-2 text-sm text-slate-400">
//                                     No warehouse stock recorded yet.
//                                   </div>
//                                 ) : (
//                                   item.warehouseStocks.map((warehouseStock) => {
//                                     const warehouseStatus = getWHStatus(warehouseStock.qty, item.minStockLevel);
//                                     return (
//                                       <div key={warehouseStock.warehouseId} className="flex items-center gap-3 rounded-lg border border-[#e2e8f0] bg-white px-3 py-2">
//                                         <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-50">
//                                           <i className="ri-store-3-line text-xs text-[#4f46e5]" />
//                                         </div>
//                                         <span className="flex-1 text-sm font-medium text-[#1e293b]">{warehouseStock.warehouseName}</span>
//                                         <span className={`text-sm font-semibold ${warehouseStock.qty === 0 ? 'text-red-600' : warehouseStock.qty < item.minStockLevel ? 'text-amber-600' : 'text-[#1e293b]'}`}>
//                                           {warehouseStock.qty} <span className="text-xs font-normal text-slate-400">{item.unit ?? 'Units'}</span>
//                                         </span>
//                                         <div className="flex items-center gap-1 text-xs">
//                                           <i className={`${warehouseStatus.icon} ${warehouseStatus.color} text-base`} />
//                                           <span className={`font-medium ${warehouseStatus.color}`}>{warehouseStatus.label}</span>
//                                         </div>
//                                       </div>
//                                     );
//                                   })
//                                 )}
//                               </div>
//                             </td>
//                           </tr>
//                         )}
//                       </Fragment>
//                     );
//                   })}
//                 </tbody>
//               </table>

//               {filteredItems.length === 0 && (
//                 <div className="py-16 text-center text-slate-400">
//                   <i className="ri-archive-line mb-2 block text-4xl" />
//                   No items found
//                 </div>
//               )}
//             </>
//           )}
//         </div>
//       </div>

//       {adjustItem && (
//         <AdjustStockModal
//           item={adjustItem}
//           warehouseOptions={warehouseOptions}
//           defaultWarehouseId={warehouseFilter || adjustItem.warehouseStocks[0]?.warehouseId || warehouseOptions[0]?.id}
//           onClose={() => setAdjustItem(null)}
//           onSave={handleAdjust}
//         />
//       )}
//     </AppLayout>
//   );
// }


import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useWarehouseList } from '@/hooks/useWarehouses';
import { stockService, type StockStatus, type StockViewItem } from '@/services/stockService';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';
import { useWarehouseStore } from '@/stores/warehouseStore';

const INVENTORY_STOCK_UPDATED_EVENT = 'inventory:stock-updated';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WarehouseBreakdown {
  warehouseId:   string;
  warehouseName: string;
  qty:           number;
}

interface StockItem {
  id:             string;
  name:           string;
  code:           string | null;
  unit:           string | null;
  categoryName:   string | null;
  brand:          string | null;
  minStockLevel:  number;
  totalStock:     number;
  status:         StockStatus;
  warehouseStocks: WarehouseBreakdown[];
}

interface WarehouseOption { id: string; name: string; }

interface StockStats {
  totalItems:    number;
  outOfStock:    number;
  lowStock:      number;
  normal:        number;
  totalStockQty: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getStatus = (qty: number, min: number) => {
  if (qty === 0)  return { label: 'Out of Stock', dot: 'bg-red-500',    cls: 'bg-red-50    text-red-700   border-red-200'    };
  if (qty < min)  return { label: 'Low Stock',    dot: 'bg-red-400',    cls: 'bg-red-50    text-red-600   border-red-100'    };
  if (qty === min)return { label: 'At Minimum',   dot: 'bg-amber-400',  cls: 'bg-amber-50  text-amber-700 border-amber-100'  };
  return              { label: 'Normal',       dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
};

const getWHStatus = (qty: number, min: number) => {
  if (qty === 0) return { icon: 'ri-close-circle-fill',   color: 'text-red-500',     label: 'Empty' };
  if (qty < min) return { icon: 'ri-error-warning-fill',  color: 'text-amber-500',   label: 'Low'   };
  return             { icon: 'ri-checkbox-circle-fill', color: 'text-emerald-500', label: 'OK'    };
};

// ─── AdjustStockModal ─────────────────────────────────────────────────────────

interface AdjustModalProps {
  item: StockItem;
  warehouseOptions: WarehouseOption[];
  defaultWarehouseId?: string;
  onClose: () => void;
  onSave: (warehouseId: string, type: 'INCREASE' | 'DECREASE', qty: number, reason: string) => Promise<void>;
}

function AdjustStockModal({ item, warehouseOptions, defaultWarehouseId, onClose, onSave }: AdjustModalProps) {
  const formRef = useRef<HTMLDivElement>(null);
  useKeyboardNav(formRef);

  const [type,        setType]        = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [warehouseId, setWarehouseId] = useState(
    defaultWarehouseId ?? item.warehouseStocks[0]?.warehouseId ?? warehouseOptions[0]?.id ?? '',
  );
  const [qty,    setQty]    = useState(1);
  const [reason, setReason] = useState('');
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  const whStock    = item.warehouseStocks.find((w) => w.warehouseId === warehouseId);
  const currentQty = whStock?.qty ?? 0;
  const afterQty   = type === 'INCREASE' ? currentQty + qty : Math.max(0, currentQty - qty);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSave = async () => {
    setError('');
    if (!warehouseId)                        return setError('Select a warehouse');
    if (qty <= 0)                            return setError('Quantity must be greater than 0');
    if (!reason.trim())                      return setError('Reason is required');
    if (type === 'DECREASE' && qty > currentQty)
      return setError(`Cannot reduce by more than current stock in this warehouse (${currentQty})`);

    setSaving(true);
    try { await onSave(warehouseId, type, qty, reason.trim()); }
    catch (err) { setError(err instanceof Error ? err.message : 'Failed to apply adjustment'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">

        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">Adjust Stock</h3>
            <p className="mt-0.5 max-w-[240px] truncate text-xs text-[#64748b]">{item.name}</p>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] cursor-pointer">
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Before / After */}
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-[#f8fafc] p-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-[#1e293b]">{currentQty}</p>
            <p className="text-xs text-[#64748b]">{item.unit ?? 'Units'} · Before</p>
          </div>
          <div className="h-px flex-1 bg-[#e2e8f0]" />
          <i className="ri-arrow-right-line text-[#94a3b8]" />
          <div className="text-center">
            <p className={`text-2xl font-bold ${type === 'INCREASE' ? 'text-emerald-600' : 'text-red-600'}`}>{afterQty}</p>
            <p className="text-xs text-[#64748b]">{item.unit ?? 'Units'} · After</p>
          </div>
        </div>

        <div ref={formRef} className="space-y-3">
          {/* Type toggle */}
          <div className="flex gap-2">
            {(['INCREASE', 'DECREASE'] as const).map((t) => (
              <button
                key={t} type="button" onClick={() => setType(t)}
                className={`flex-1 h-9 whitespace-nowrap rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                  type === t
                    ? t === 'INCREASE' ? 'border-emerald-400 bg-emerald-50 text-emerald-700' : 'border-red-400 bg-red-50 text-red-700'
                    : 'border-[#e2e8f0] bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <i className={`${t === 'INCREASE' ? 'ri-arrow-up-line text-emerald-500' : 'ri-arrow-down-line text-red-500'} mr-1`} />
                {t === 'INCREASE' ? 'Add Stock' : 'Reduce Stock'}
              </button>
            ))}
          </div>

          {/* Warehouse */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">Warehouse</label>
            <select
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              data-nav-index={0}
              className="h-10 w-full cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm focus:border-[#4f46e5] focus:outline-none"
            >
              {warehouseOptions.length === 0 && <option value="">No warehouses available</option>}
              {warehouseOptions.map((wh) => <option key={wh.id} value={wh.id}>{wh.name}</option>)}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min="1" value={qty}
              onChange={(e) => { setQty(parseInt(e.target.value, 10) || 1); setError(''); }}
              data-nav-index={1}
              className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
            />
          </div>

          {/* Reason */}
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[#64748b]">
              Reason <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={reason}
              onChange={(e) => { setReason(e.target.value); setError(''); }}
              data-nav-index={2}
              placeholder="Physical count, damage, purchase..."
              className="h-10 w-full rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm focus:border-[#4f46e5] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1 text-xs text-red-500">
              <i className="ri-error-warning-line" />{error}
            </p>
          )}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="h-9 flex-1 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer">
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className={`flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 cursor-pointer ${
              type === 'INCREASE' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-check-line" /> Apply</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StockViewPage() {
  const toast = useToast();

  // FIX: subscribe to global warehouse store — page auto-refetches when
  // the Topbar warehouse changes, same pattern as ItemsPage / PartiesPage
  const { selectedWarehouseId } = useWarehouseStore();

  const [stockItems,      setStockItems]      = useState<StockItem[]>([]);
  const [stats,           setStats]           = useState<StockStats | null>(null);
  const [search,          setSearch]          = useState('');
  // FIX: warehouseFilter is kept in sync with the global store
  const [warehouseFilter, setWarehouseFilter] = useState(selectedWarehouseId ?? '');
  const [expandedRows,    setExpandedRows]    = useState<Set<string>>(new Set());
  const [adjustItem,      setAdjustItem]      = useState<StockItem | null>(null);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState('');

  const { hasPermission, hasControl } = useAuth();
  const canAdjustStock =
    hasPermission(MODULES.STOCK_ADJUSTMENT, 'create') ||
    hasControl('approveStockAdjustment');

  const { data: warehousePage } = useWarehouseList({ limit: 200 });

  // Sync local filter when Topbar warehouse changes
  useEffect(() => {
    setWarehouseFilter(selectedWarehouseId ?? '');
  }, [selectedWarehouseId]);

  // Warehouse options: merge API list + any warehouses seen in stock breakdown
  const warehouseOptions = useMemo<WarehouseOption[]>(() => {
    const merged = new Map<string, WarehouseOption>();
    for (const wh of warehousePage?.items ?? []) {
      if (wh.isActive) merged.set(wh.id, { id: wh.id, name: wh.name });
    }
    for (const item of stockItems) {
      for (const bd of item.warehouseStocks) {
        if (!merged.has(bd.warehouseId))
          merged.set(bd.warehouseId, { id: bd.warehouseId, name: bd.warehouseName });
      }
    }
    return Array.from(merged.values());
  }, [warehousePage, stockItems]);

  const activeWarehouseName = warehouseOptions.find((w) => w.id === warehouseFilter)?.name;

  // ── Load stock ─────────────────────────────────────────────────────────────
  // FIX: warehouse_id passed to both getStock and getStockStats so the backend
  // scopes totals correctly. The original called both with no params.
  // FIX: wrapped in useCallback so it's stable for event listeners.
  const loadStock = useCallback(async (whId?: string) => {
    setLoading(true);
    setError('');

    const params = { warehouse_id: (whId ?? warehouseFilter) || undefined };

    const [stockResult, statsResult] = await Promise.allSettled([
      stockService.getStock(params),
      stockService.getStockStats(params),
    ]);

    if (stockResult.status === 'rejected') {
      const msg = stockResult.reason instanceof Error
        ? stockResult.reason.message
        : 'Failed to load stock data';
      setError(msg);
      setStockItems([]);
      setStats(null);
      setLoading(false);
      return;
    }

    // FIX: cast directly — StockViewItem and StockItem are identical shapes
    setStockItems((stockResult.value.data ?? []) as StockItem[]);

    if (statsResult.status === 'fulfilled') setStats(statsResult.value);
    else setStats(null);

    setLoading(false);
  }, [warehouseFilter]);

  // Initial load
  useEffect(() => {
    void loadStock();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // FIX: re-fetch whenever warehouse filter changes (from Topbar OR local select)
  useEffect(() => {
    void loadStock(warehouseFilter);
  }, [warehouseFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // External stock-update events (receiving, transfer, etc.)
  useEffect(() => {
    const handler = () => void loadStock();
    window.addEventListener(INVENTORY_STOCK_UPDATED_EVENT, handler);
    return () => window.removeEventListener(INVENTORY_STOCK_UPDATED_EVENT, handler);
  }, [loadStock]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // When warehouse is filtered, the API already returns scoped totalStock.
  // getDisplayQty is a safety fallback for the breakdown lookup.
  const getDisplayQty = (item: StockItem): number => {
    if (!warehouseFilter) return item.totalStock;
    const wh = item.warehouseStocks.find((w) => w.warehouseId === warehouseFilter);
    return wh?.qty ?? item.totalStock;
  };

  // Client-side search (instant feedback while user types)
  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return stockItems;
    return stockItems.filter((item) =>
      [item.name, item.code, item.categoryName, item.brand]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    );
  }, [stockItems, search]);

  // FIX: lowCount / outCount use getDisplayQty (warehouse-aware), not totalStock
  const lowCount = useMemo(
    () => filteredItems.filter((item) => {
      const q = getDisplayQty(item);
      return q > 0 && q < item.minStockLevel;
    }).length,
    [filteredItems, warehouseFilter], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const outCount = useMemo(
    () => filteredItems.filter((item) => getDisplayQty(item) === 0).length,
    [filteredItems, warehouseFilter], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // ── Adjustment handler ─────────────────────────────────────────────────────

  const handleAdjust = async (
    warehouseId: string,
    type: 'INCREASE' | 'DECREASE',
    qty: number,
    reason: string,
  ) => {
    if (!adjustItem) throw new Error('Select an item first');
    const targetId = adjustItem.id;

    const adjustment = await stockService.createAdjustment({
      warehouseId, itemId: targetId, type, quantity: qty, reason,
    });

    // Optimistic update
    setStockItems((prev) => prev.map((item) => {
      if (item.id !== targetId) return item;

      let found = false;
      const nextStocks = item.warehouseStocks.map((ws) => {
        if (ws.warehouseId !== warehouseId) return ws;
        found = true;
        return {
          ...ws,
          qty: typeof adjustment.meta?.updatedWarehouseQty === 'number'
            ? adjustment.meta.updatedWarehouseQty
            : (type === 'INCREASE' ? ws.qty + qty : Math.max(0, ws.qty - qty)),
        };
      });

      if (!found) {
        nextStocks.push({
          warehouseId,
          warehouseName: warehouseOptions.find((w) => w.id === warehouseId)?.name ?? 'Warehouse',
          qty: typeof adjustment.meta?.updatedWarehouseQty === 'number'
            ? adjustment.meta.updatedWarehouseQty
            : (type === 'INCREASE' ? qty : 0),
        });
      }

      const totalStock = typeof adjustment.meta?.updatedItemTotalStock === 'number'
        ? adjustment.meta.updatedItemTotalStock
        : nextStocks.reduce((sum, s) => sum + s.qty, 0);

      return { ...item, warehouseStocks: nextStocks, totalStock };
    }));

    toast.success(`${adjustment.adjustmentNumber} saved for ${adjustment.itemName ?? adjustItem.name}`);
    setAdjustItem(null);

    // Background reconcile
    try { await loadStock(); } catch { /* keep optimistic state */ }
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppLayout>
      <div className="min-h-full bg-[#f8fafc] p-6">

        {/* ── Header ── */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Stock View</h1>
            <p className="text-sm text-slate-500 flex items-center gap-2 flex-wrap mt-0.5">
              <span>{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</span>
              {stats && (
                <span className="text-slate-400">
                  {stats.totalStockQty.toLocaleString()} total units
                </span>
              )}
              {lowCount > 0 && (
                <span className="font-medium text-amber-600 flex items-center gap-1">
                  <i className="ri-alert-line text-xs" />{lowCount} low stock
                </span>
              )}
              {outCount > 0 && (
                <span className="font-medium text-red-600 flex items-center gap-1">
                  <i className="ri-error-warning-line text-xs" />{outCount} out of stock
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => void loadStock()}
            disabled={loading}
            className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] hover:bg-[#f1f5f9] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <i className={`ri-refresh-line text-sm ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Warehouse context banner */}
        {warehouseFilter && activeWarehouseName && (
          <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 font-medium">
            <i className="ri-store-3-line text-indigo-500" />
            Showing stock for <strong>{activeWarehouseName}</strong>.
            <button
              onClick={() => setWarehouseFilter('')}
              className="ml-auto flex items-center gap-1 text-indigo-500 hover:text-indigo-700 cursor-pointer"
            >
              <i className="ri-close-line" /> Show all warehouses
            </button>
          </div>
        )}

        <div className="overflow-hidden rounded-xl border border-[#e2e8f0] bg-white">

          {/* Filters toolbar */}
          <div className="flex flex-wrap items-center gap-3 border-b border-[#e2e8f0] p-4">
            <div className="relative w-64">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search item name, code, category..."
                className="h-9 w-full rounded-lg border border-[#e2e8f0] pl-8 pr-3 text-sm focus:border-[#4f46e5] focus:outline-none"
              />
            </div>

            {/* <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-9 cursor-pointer rounded-lg border border-[#e2e8f0] bg-white px-3 text-sm focus:border-[#4f46e5] focus:outline-none"
            >
              <option value="">All Warehouses (Total)</option>
              {warehouseOptions.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select> */}

            {warehouseFilter && activeWarehouseName && (
              <span className="flex h-7 items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-medium text-[#4f46e5]">
                <i className="ri-filter-3-line" />
                {activeWarehouseName}
                <button onClick={() => setWarehouseFilter('')} className="cursor-pointer hover:text-indigo-800">
                  <i className="ri-close-line" />
                </button>
              </span>
            )}
          </div>

          {/* Content */}
          {error ? (
            <div className="p-10 text-center text-slate-500">
              <i className="ri-error-warning-line mb-2 block text-3xl text-red-400" />
              <p>{error}</p>
              <button
                onClick={() => void loadStock()}
                className="mt-4 h-9 rounded-lg bg-[#4f46e5] px-4 text-sm font-medium text-white hover:bg-[#4338ca]"
              >Retry</button>
            </div>
          ) : loading ? (
            <div className="p-10 text-center text-slate-500">
              <i className="ri-loader-4-line mb-2 block animate-spin text-3xl text-[#4f46e5]" />
              Loading stock data...
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-8 border-b border-[#e2e8f0] px-2 py-3" />
                    <th className="border-b border-[#e2e8f0] px-4 py-3 text-left  text-xs font-semibold whitespace-nowrap text-slate-500">Item</th>
                    <th className="border-b border-[#e2e8f0] px-4 py-3 text-left  text-xs font-semibold whitespace-nowrap text-slate-500">Code</th>
                    <th className="border-b border-[#e2e8f0] px-4 py-3 text-right text-xs font-semibold whitespace-nowrap text-slate-500">
                      {warehouseFilter && activeWarehouseName ? `${activeWarehouseName} Qty` : 'Total Stock'}
                    </th>
                    <th className="border-b border-[#e2e8f0] px-4 py-3 text-right text-xs font-semibold whitespace-nowrap text-slate-500">Min Level</th>
                    <th className="border-b border-[#e2e8f0] px-4 py-3 text-left  text-xs font-semibold whitespace-nowrap text-slate-500">Status</th>
                    {canAdjustStock && <th className="border-b border-[#e2e8f0] px-4 py-3" />}
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, index) => {
                    const displayQty = getDisplayQty(item);
                    const status     = getStatus(displayQty, item.minStockLevel);
                    const expanded   = expandedRows.has(item.id);

                    return (
                      <Fragment key={item.id}>
                        <tr className={`group border-b border-slate-50 hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-[#fafafa]' : ''}`}>

                          <td className="px-2 py-3 text-center">
                            <button
                              onClick={() => toggleExpand(item.id)}
                              className={`flex h-6 w-6 items-center justify-center rounded transition-all cursor-pointer ${expanded ? 'bg-indigo-100 text-[#4f46e5]' : 'text-slate-400 hover:bg-slate-100'}`}
                              title={expanded ? 'Hide breakdown' : 'Show warehouse breakdown'}
                            >
                              <i className={`text-xs ${expanded ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}`} />
                            </button>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-[#1e293b]">{item.name}</div>
                            <div className="text-xs text-slate-400">{item.categoryName ?? item.brand ?? 'Uncategorized'}</div>
                          </td>

                          <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.code ?? '—'}</td>

                          <td className={`px-4 py-3 text-right font-semibold ${displayQty < item.minStockLevel ? 'text-red-600' : 'text-[#1e293b]'}`}>
                            {displayQty}
                            <span className="text-xs font-normal text-slate-400 ml-1">{item.unit ?? 'Units'}</span>
                          </td>

                          <td className="px-4 py-3 text-right text-slate-500">{item.minStockLevel}</td>

                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${status.cls}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </td>

                          {canAdjustStock && (
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setAdjustItem(item)}
                                className="flex h-7 items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 text-xs font-medium text-[#4f46e5] opacity-0 transition-all hover:bg-indigo-100 cursor-pointer group-hover:opacity-100"
                              >
                                <i className="ri-scales-3-line text-sm" /> Adjust
                              </button>
                            </td>
                          )}
                        </tr>

                        {/* Warehouse breakdown */}
                        {expanded && (
                          <tr className="border-b border-slate-100 bg-[#f8fafc]">
                            <td />
                            <td colSpan={canAdjustStock ? 6 : 5} className="px-4 py-3">
                              <div className="ml-4 space-y-1.5">
                                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                  Warehouse Breakdown
                                </p>
                                {item.warehouseStocks.length === 0 ? (
                                  <div className="rounded-lg border border-dashed border-[#e2e8f0] bg-white px-3 py-2 text-sm text-slate-400">
                                    No warehouse stock recorded yet.
                                  </div>
                                ) : (
                                  item.warehouseStocks.map((ws) => {
                                    const whStatus = getWHStatus(ws.qty, item.minStockLevel);
                                    const isActive = ws.warehouseId === warehouseFilter;
                                    return (
                                      <div
                                        key={ws.warehouseId}
                                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${
                                          isActive ? 'border-indigo-200 bg-indigo-50/60' : 'border-[#e2e8f0] bg-white'
                                        }`}
                                      >
                                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-indigo-50">
                                          <i className="ri-store-3-line text-xs text-[#4f46e5]" />
                                        </div>
                                        <span className="flex-1 text-sm font-medium text-[#1e293b]">
                                          {ws.warehouseName}
                                          {isActive && (
                                            <span className="ml-2 text-[10px] font-bold text-indigo-500 bg-indigo-100 px-1.5 py-0.5 rounded-full">
                                              Active filter
                                            </span>
                                          )}
                                        </span>
                                        <span className={`text-sm font-semibold ${
                                          ws.qty === 0 ? 'text-red-600'
                                          : ws.qty < item.minStockLevel ? 'text-amber-600'
                                          : 'text-[#1e293b]'
                                        }`}>
                                          {ws.qty}
                                          <span className="text-xs font-normal text-slate-400 ml-1">{item.unit ?? 'Units'}</span>
                                        </span>
                                        <div className="flex items-center gap-1 text-xs">
                                          <i className={`${whStatus.icon} ${whStatus.color} text-base`} />
                                          <span className={`font-medium ${whStatus.color}`}>{whStatus.label}</span>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>

              {filteredItems.length === 0 && (
                <div className="py-16 text-center text-slate-400">
                  <i className="ri-archive-line mb-2 block text-4xl" />
                  <p className="text-sm">No items found</p>
                  {(search || warehouseFilter) && (
                    <p className="text-xs mt-1">
                      Try clearing your{search ? ' search' : ''}{search && warehouseFilter ? ' or' : ''}{warehouseFilter ? ' warehouse filter' : ''}
                    </p>
                  )}
                </div>
              )}

              <div className="border-t border-[#e2e8f0] px-4 py-3">
                <p className="text-xs text-slate-400">
                  Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                  {warehouseFilter && activeWarehouseName
                    ? ` in ${activeWarehouseName}`
                    : ' across all warehouses'}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {adjustItem && (
        <AdjustStockModal
          item={adjustItem}
          warehouseOptions={warehouseOptions}
          defaultWarehouseId={
            warehouseFilter ||
            adjustItem.warehouseStocks[0]?.warehouseId ||
            warehouseOptions[0]?.id
          }
          onClose={() => setAdjustItem(null)}
          onSave={handleAdjust}
        />
      )}
    </AppLayout>
  );
}
