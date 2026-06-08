// import { useState, useEffect, useCallback, useRef } from 'react';
// import { useNavigate } from 'react-router-dom';
// import AppLayout from '@/components/feature/AppLayout';
// import ConfirmDialog from '@/components/feature/ConfirmDialog';
// import ItemForm, { type ItemFormData } from './components/ItemForm';
// import ItemDetail from './components/ItemDetail';
// import { categoryService } from '@/services/categoryService';
// import { useToast } from '@/contexts/ToastContext';
// import { useDebounce } from '@/utils/debounce';
// import { formatINR } from '@/utils/format';
// import { MODULES } from '@/utils/permissions.js';
// import { useAuth } from '@/contexts/AuthContext';
// import {
//   createItem,
//   updateItem,
//   deleteItem,
//   filterItems,
//   mapApiToItem,
//   type ItemPayload,
//   type FilterItemsParams,
// } from '@/api/item.api';
// import { useWarehouseStore } from '@/stores/warehouseStore';

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Item extends ItemFormData {
//   id: string;
//   stock: number;
//   // extra optional fields returned by DB but not in the form
//   brand: string;
//   mrp?: number;
//   articleNo: string;
//   sizeColor?: string;
//   warehouseId: string;
//   // imageUrl?: string;
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────

// /**
//  * Map local ItemFormData → API payload
//  * Field names must match exactly what the controller destructures from req.body
//  */
// function mapFormToPayload(form: ItemFormData): ItemPayload {
//   return {
//     name: form.name,
//     code: form.code || undefined,
//     barcode: form.barcode || undefined,
//     categoryId: form.categoryId || undefined,
//     categoryName: form.categoryName || undefined,
//     brand: form.brand || undefined,
//     hsnCode: form.hsnCode || undefined,
//     taxRate: form.taxRate,
//     unitId: form.unitId || undefined,
//     unitName: form.unitName || undefined,
//     purchaseRate: form.purchaseRate,
//     saleRate: form.saleRate,
//     minStockLevel: form.minStockLevel,
//     articleNo: form.articleNo || undefined,
//     isActive: form.isActive,
//     warehouseId: form.warehouseId,
//   };
// }

// // ─── Stock status helpers ─────────────────────────────────────────────────────

// type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

// function getStockStatus(item: Item): StockStatus {
//   const stock = Number(item.stock ?? 0);
//   const minStockLevel = Number(item.minStockLevel ?? 0);

//   if (stock === 0) return 'OUT_OF_STOCK';
//   if (stock < minStockLevel) return 'LOW_STOCK';
//   return 'IN_STOCK';
// }

// function stockBadge(item: Item) {
//   const s = getStockStatus(item);
//   if (s === 'IN_STOCK') return { cls: 'bg-green-100 text-green-700', label: 'In Stock' };
//   if (s === 'LOW_STOCK') return { cls: 'bg-amber-100 text-amber-700', label: 'Low Stock' };
//   return { cls: 'bg-red-100 text-red-600', label: 'Out of Stock' };
// }

// // ─── Page ─────────────────────────────────────────────────────────────────────

// export default function ItemsPage() {
//   const navigate = useNavigate();
//   const { success, error: toastError } = useToast();
//   const { selectedWarehouseId, selectedWarehouseName, setSelectedWarehouse } = useWarehouseStore();
//   const { hasPermission } = useAuth();
//   const canCreateItem = hasPermission(MODULES.ITEMS, 'create');
//   const canEditItem = hasPermission(MODULES.ITEMS, 'edit');
//   const canDeleteItem = hasPermission(MODULES.ITEMS, 'delete');

//   // ── Data & loading ─────────────────────────────────────────────────────────
//   const [items, setItems] = useState<Item[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isDeleting, setIsDeleting] = useState(false);

//   // ── Categories derived from loaded items (for filter dropdown) ─────────────
//   const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

//   // ── Search & filters ───────────────────────────────────────────────────────
//   const [searchInput, setSearchInput] = useState('');
//   const search = useDebounce(searchInput, 400);
//   const [filterCat, setFilterCat] = useState('ALL');
//   const [filterStatus, setFilterStatus] = useState<'ALL' | StockStatus>('ALL');
//   const [filterActive, setFilterActive] = useState<'ALL' | 'true' | 'false'>('ALL');
//   const [filterWarehouseId, setFilterWarehouseId] = useState(selectedWarehouseId);
//   // ── Drawer / modal state ───────────────────────────────────────────────────
//   const [slideOpen, setSlideOpen] = useState(false);
//   const [editingItem, setEditingItem] = useState<Item | null>(null);
//   const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null);
//   const [selectedItem, setSelectedItem] = useState<Item | null>(null);

//   // Prevent duplicate fetches
//   const lastFetchKey = useRef<string>('__init__');

//   // ── Fetch items (server-side filter via GET /api/v1/item/filter) ───────────
//   const fetchItems = useCallback(async (params: FilterItemsParams = {}) => {
//     const key = JSON.stringify(params);
//     if (key === lastFetchKey.current) return;
//     lastFetchKey.current = key;

//     setIsLoading(true);
//     try {
//       const res = await filterItems(params);
//       if (res.success && res.data) {
//         const mapped = res.data.map((r) => mapApiToItem(r) as Item);
//         setItems(mapped);
//       }
//     } catch (err) {
//       toastError(err instanceof Error ? err.message : 'Failed to load items');
//     } finally {
//       setIsLoading(false);
//     }
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   useEffect(() => {
//     void (async () => {
//       try {
//         const list = await categoryService.list();
//         setCategories(
//           list
//             .map((category) => ({ id: category.id, name: category.name }))
//             .sort((a, b) => a.name.localeCompare(b.name)),
//         );
//       } catch (err) {
//         toastError(err instanceof Error ? err.message : 'Failed to load categories');
//       }
//     })();
//   }, [toastError]);

//   // Re-fetch when search or category filter changes
//   // Note: filterStatus (IN_STOCK / LOW_STOCK) is client-side only — the
//   // controller doesn't support it, so we filter locally after fetching.
//   useEffect(() => {
//     const params: FilterItemsParams = {};
//     if (search.trim()) params.search = search.trim();
//     // If filterCat is a UUID send as categoryId, otherwise ignore for server
//     if (filterCat !== 'ALL') params.categoryId = filterCat;
//     if (filterStatus !== 'ALL') params.stockStatus = filterStatus;
//     if (filterActive !== 'ALL') params.isActive = filterActive;
//     if (filterWarehouseId !== 'ALL') params.warehouseId = filterWarehouseId || selectedWarehouseId;
//     void fetchItems(params);
//   }, [search, filterCat, filterStatus, filterActive, fetchItems, filterWarehouseId, selectedWarehouseId]);

//   const filtered = items;

//   // ── Drawer helpers ─────────────────────────────────────────────────────────
//   const openAdd = () => { setEditingItem(null); setSlideOpen(true); };
//   const openEdit = (i: Item) => { setEditingItem(i); setSlideOpen(true); };
//   const closeDrawer = () => setSlideOpen(false);
//   const openDetails = (i: Item) => setSelectedItem(i);

//   // ── Save (create or update) ────────────────────────────────────────────────
//   // Throws on API error so ItemForm can stay open (no error banner in ItemForm
//   // currently, but the throw prevents false success toasts)
//   const handleSave = async (data: ItemFormData) => {
//     const payload = mapFormToPayload(data);

//     if (editingItem) {
//       const res = await updateItem(editingItem.id, payload);
//       if (res.success && res.data) {
//         const updated = mapApiToItem(res.data) as Item;
//         // Preserve stock from local state (not returned by update endpoint)
//         updated.stock = editingItem.stock;
//         setItems((prev) =>
//           prev.map((i) => (i.id === editingItem.id ? updated : i)),
//         );
//         success('Item updated successfully');
//         closeDrawer();
//       }
//     } else {
//       const res = await createItem(payload);
//       if (res.success && res.data) {
//         const created = mapApiToItem(res.data) as Item;
//         setItems((prev) => [created, ...prev]);
//         success('Item added successfully');
//         closeDrawer();
//       }
//     }
//   };

//   // ── Soft delete ────────────────────────────────────────────────────────────
//   const confirmDelete = async () => {
//     if (!deleteConfirm) return;
//     setIsDeleting(true);
//     try {
//       await deleteItem(deleteConfirm.id);
//       // Remove from local list (controller sets is_active=false, getAllItems
//       // filters by is_active=true, so it won't reappear on next fetch)
//       setItems((prev) => prev.filter((i) => i.id !== deleteConfirm.id));
//       success('Item deactivated (soft delete)');
//       setDeleteConfirm(null);
//     } catch (err) {
//       toastError(err instanceof Error ? err.message : 'Failed to deactivate item');
//     } finally {
//       setIsDeleting(false);
//     }
//   };

//   const handleToggleActive = async (item: Item) => {
//     setItems((prev) => prev.map((current) => (
//       current.id === item.id ? { ...current, isActive: !current.isActive } : current
//     )));

//     try {
//       await updateItem(item.id, { isActive: !item.isActive });
//       success(`${item.name} ${item.isActive ? 'deactivated' : 'activated'}`);
//     } catch (err) {
//       setItems((prev) => prev.map((current) => (
//         current.id === item.id ? { ...current, isActive: item.isActive } : current
//       )));
//       toastError(err instanceof Error ? err.message : 'Failed to update status');
//     }
//   };

//   // ── Stats (derived from full unfiltered list) ──────────────────────────────
//   const stats = {
//     total: items.length,
//     active: items.filter((i) => i.isActive).length,
//     lowStock: items.filter((i) => getStockStatus(i) === 'LOW_STOCK').length,
//     outOfStock: items.filter((i) => getStockStatus(i) === 'OUT_OF_STOCK').length,
//   };

//   // ──────────────────────────────────────────────────────────────────────────
//   return (
//     <AppLayout>
//       <div className="p-6 space-y-5">

//         {/* ── Header ─────────────────────────────────────────────────────── */}
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => navigate(-1)}
//               className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
//             >
//               <i className="ri-arrow-left-line text-base" />
//             </button>
//             <div>
//               <h2 className="text-xl font-bold text-[#1e293b]">Item Master</h2>
//               <p className="text-sm text-[#64748b] mt-0.5">Products, goods and inventory items</p>
//             </div>
//           </div>
//           {canCreateItem && (
//             <button
//               onClick={openAdd}
//               className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
//             >
//               <i className="ri-add-line" /> Add Item
//             </button>
//           )}
//         </div>

//         {/* ── Stats ──────────────────────────────────────────────────────── */}
//         <div className="grid grid-cols-4 gap-4">
//           {[
//             { label: 'Total Items', value: stats.total, icon: 'ri-box-3-line', color: 'indigo' },
//             { label: 'Active Items', value: stats.active, icon: 'ri-checkbox-circle-line', color: 'green' },
//             { label: 'Low Stock', value: stats.lowStock, icon: 'ri-alert-line', color: 'amber' },
//             { label: 'Out of Stock', value: stats.outOfStock, icon: 'ri-error-warning-line', color: 'red' },
//           ].map((c) => (
//             <div
//               key={c.label}
//               className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${c.color === 'red' && c.value > 0 ? 'border-red-200' : 'border-[#e2e8f0]'
//                 }`}
//             >
//               <div
//                 className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.color === 'indigo' ? 'bg-indigo-50'
//                   : c.color === 'green' ? 'bg-green-50'
//                     : c.color === 'amber' ? 'bg-amber-50'
//                       : 'bg-red-50'
//                   }`}
//               >
//                 <i
//                   className={`${c.icon} text-lg ${c.color === 'indigo' ? 'text-[#4f46e5]'
//                     : c.color === 'green' ? 'text-green-600'
//                       : c.color === 'amber' ? 'text-amber-600'
//                         : 'text-red-500'
//                     }`}
//                 />
//               </div>
//               <div>
//                 <p
//                   className={`text-2xl font-bold ${c.color === 'red' && c.value > 0 ? 'text-red-600' : 'text-[#1e293b]'
//                     }`}
//                 >
//                   {c.value}
//                 </p>
//                 <p className="text-xs text-[#64748b]">{c.label}</p>
//               </div>
//             </div>
//           ))}
//         </div>

//         {/* ── Filters ────────────────────────────────────────────────────── */}
//         <div className="flex items-center gap-3 flex-wrap">
//           {/* Search */}
//           <div className="relative flex-1 min-w-56">
//             <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
//             <input
//               type="text"
//               value={searchInput}
//               onChange={(e) => setSearchInput(e.target.value)}
//               placeholder="Search by name, code or barcode..."
//               className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
//             />
//           </div>

//           {/* Category dropdown — built from loaded items */}
//           <select
//             value={filterCat}
//             onChange={(e) => setFilterCat(e.target.value)}
//             className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] bg-white focus:outline-none focus:border-[#4f46e5] cursor-pointer"
//           >
//             <option value="ALL">All Categories</option>
//             {categories.map((c) => (
//               <option key={c.id} value={c.id}>{c.name}</option>
//             ))}
//           </select>

//           {/* Stock status pill */}
//           <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
//             {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map((s) => (
//               <button
//                 key={s}
//                 onClick={() => setFilterStatus(s)}
//                 className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${filterStatus === s
//                   ? 'bg-white text-[#1e293b] shadow-sm'
//                   : 'text-[#64748b] hover:text-[#1e293b]'
//                   }`}
//               >
//                 {s === 'ALL' ? 'All' : s === 'IN_STOCK' ? 'In Stock' : s === 'LOW_STOCK' ? 'Low' : 'Out'}
//               </button>
//             ))}
//           </div>

//           <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
//             {([
//               { key: 'ALL', label: 'All Items' },
//               { key: 'true', label: 'Active' },
//               { key: 'false', label: 'Inactive' },
//             ] as const).map((s) => (
//               <button
//                 key={s.key}
//                 onClick={() => setFilterActive(s.key)}
//                 className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${filterActive === s.key
//                   ? 'bg-white text-[#1e293b] shadow-sm'
//                   : 'text-[#64748b] hover:text-[#1e293b]'
//                   }`}
//               >
//                 {s.label}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* ── Table ──────────────────────────────────────────────────────── */}
//         <div className="relative bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
//           <ItemDetail item={selectedItem} onClose={() => setSelectedItem(null)} />

//           <div className=" w-full overflow-x-auto">
//             <table className="min-w-[1100px] w-full text-sm">
//               <thead>
//                 <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
//                   {['Code', 'Item Name', 'Category', 'HSN', 'GST', 'Unit', 'Purchase Rate', 'Sale Rate', 'Stock', 'Status', 'Active', 'Actions'].map(
//                     (h) => (
//                       <th
//                         key={h}
//                         className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
//                       >
//                         {h}
//                       </th>
//                     ),
//                   )}
//                 </tr>
//               </thead>
//               <tbody>

//                 {/* Loading skeleton */}
//                 {isLoading &&
//                   Array.from({ length: 6 }).map((_, i) => (
//                     <tr key={i} className="border-b border-[#f1f5f9]">
//                       {Array.from({ length: 11 }).map((_, j) => (
//                         <td key={j} className="px-4 py-3">
//                           <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
//                         </td>
//                       ))}
//                     </tr>
//                   ))}

//                 {/* Data rows */}
//                 {!isLoading &&
//                   filtered.map((item, idx) => {
//                     const badge = stockBadge(item);
//                     return (
//                       <tr
//                         key={item.id}
//                         onClick={() => openDetails(item)}
//                         role="button"
//                         tabIndex={0}
//                         onKeyDown={(e) => {
//                           if (e.key === 'Enter' || e.key === ' ') {
//                             e.preventDefault();
//                             openDetails(item);
//                           }
//                         }}
//                         className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''
//                           }`}
//                       >
//                         {/* Code */}
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <span className="font-mono text-xs text-[#64748b]">{item.code || '—'}</span>
//                         </td>

//                         {/* Name + barcode */}
//                         <td className="px-4 py-3">
//                           <p className="font-medium text-[#1e293b] whitespace-nowrap">{item.name}</p>
//                           <p className="text-xs text-[#94a3b8]">{item.barcode}</p>
//                         </td>

//                         {/* Category */}
//                         <td className="px-4 py-3 text-[#64748b] text-xs whitespace-nowrap">
//                           {item.categoryName || '—'}
//                         </td>

//                         {/* HSN */}
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <span className="font-mono text-xs text-[#64748b]">{item.hsnCode || '—'}</span>
//                         </td>

//                         {/* GST rate */}
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#4f46e5]">
//                             {item.taxRate}%
//                           </span>
//                         </td>

//                         {/* Unit */}
//                         <td className="px-4 py-3 text-[#64748b] whitespace-nowrap text-xs">
//                           {item.unitName || '—'}
//                         </td>

//                         {/* Purchase rate */}
//                         <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
//                           {formatINR(item.purchaseRate)}
//                         </td>

//                         {/* Sale rate */}
//                         <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">
//                           {formatINR(item.saleRate)}
//                         </td>

//                         {/* Stock / min stock */}
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <span
//                             className={`font-bold ${item.stock <= item.minStockLevel ? 'text-amber-600' : 'text-[#1e293b]'
//                               }`}
//                           >
//                             {item.stock}
//                           </span>
//                           <span className="text-xs text-[#94a3b8] ml-1">/{item.minStockLevel}</span>
//                         </td>

//                         {/* Stock status badge */}
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <span
//                             className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}
//                           >
//                             {badge.label}
//                           </span>
//                         </td>

//                         <td className="px-4 py-3 whitespace-nowrap">
//                           {canEditItem ? (
//                             <button
//                               type="button"
//                               onClick={(e) => {
//                                 e.stopPropagation();
//                                 void handleToggleActive(item);
//                               }}
//                               className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer
//                               focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#4f46e5]/40
//                               ${item.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
//                               title={item.isActive ? 'Click to deactivate' : 'Click to activate'}
//                               aria-label={item.isActive ? 'Deactivate item' : 'Activate item'}
//                             >
//                               <span
//                                 className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm
//                                 transition-transform duration-300 flex items-center justify-center
//                                 ${item.isActive ? 'translate-x-5' : 'translate-x-0'}`}
//                               >
//                                 <i
//                                   className={`text-[8px] transition-all duration-300
//                                   ${item.isActive ? 'ri-check-line text-[#4f46e5]' : 'ri-close-line text-[#94a3b8]'}`}
//                                 />
//                               </span>
//                             </button>
//                           ) : (
//                             <span
//                               className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border
//                               ${item.isActive
//                                   ? 'bg-green-50 text-green-700 border-green-200'
//                                   : 'bg-slate-100 text-slate-500 border-slate-200'
//                                 }`}
//                             >
//                               <span className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-slate-400'}`} />
//                               {item.isActive ? 'Active' : 'Inactive'}
//                             </span>
//                           )}
//                         </td>


//                         {/* Edit / Delete */}
//                         <td className="px-4 py-3 whitespace-nowrap">
//                           <div className="flex items-center gap-1">
//                             {canEditItem && (
//                               <button
//                                 onClick={(e) => { e.stopPropagation(); openEdit(item); }}
//                                 className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
//                                 title="Edit"
//                               >
//                                 <i className="ri-edit-line text-sm" />
//                               </button>)}
//                             {canDeleteItem && (
//                               <button
//                                 onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item); }}
//                                 className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
//                                 title="Deactivate"
//                               >
//                                 <i className="ri-delete-bin-line text-sm" />
//                               </button>
//                             )}
//                           </div>
//                         </td>
//                       </tr>
//                     );
//                   })}

//                 {/* Empty state */}
//                 {!isLoading && filtered.length === 0 && (
//                   <tr>
//                     <td colSpan={11} className="px-4 py-12 text-center">
//                       <i className="ri-box-3-line text-4xl text-[#e2e8f0] block mb-2" />
//                       <p className="text-[#94a3b8] text-sm">No items match your search</p>
//                       {searchInput && (
//                         <p className="text-xs text-[#94a3b8] mt-1">
//                           Try a different search term
//                         </p>
//                       )}
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           </div>
//         </div>

//         {/* Row count */}
//         <div className="px-4 py-3 border-t border-[#e2e8f0]">
//           <p className="text-xs text-[#94a3b8]">
//             Showing {filtered.length} of {items.length} items
//           </p>
//         </div>
//       </div>


//       {/* Slide-over form */}
//       <ItemForm
//         open={slideOpen}
//         isEditing={!!editingItem}
//         initialData={editingItem ?? undefined}
//         onClose={closeDrawer}
//         onSave={handleSave}
//       />

//       {/* Soft-delete confirm */}
//       <ConfirmDialog
//         open={!!deleteConfirm}
//         title="Deactivate Item"
//         message={`Deactivate "${deleteConfirm?.name}"? It will be hidden from billing but history is preserved.`}
//         variant="warning"
//         confirmLabel={isDeleting ? 'Deactivating...' : 'Yes, Deactivate (Y)'}
//         onConfirm={() => void confirmDelete()}
//         onCancel={() => setDeleteConfirm(null)}
//       />
//     </AppLayout>
//   );
// }


import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import ItemForm, { type ItemFormData } from './components/ItemForm';
import ItemDetail from './components/ItemDetail';
import { categoryService } from '@/services/categoryService';
import { useToast } from '@/contexts/ToastContext';
import { useDebounce } from '@/utils/debounce';
import { formatINR } from '@/utils/format';
import { MODULES } from '@/utils/permissions.js';
import { useAuth } from '@/contexts/AuthContext';
import {
  createItem,
  updateItem,
  deleteItem,
  filterItems,
  mapApiToItem,
  type ItemPayload,
  type FilterItemsParams,
} from '@/api/item.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item extends ItemFormData {
  id: string;
  stock: number;
  brand: string;
  mrp?: number;
  articleNo: string;
  sizeColor?: string;
  warehouseId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapFormToPayload(form: ItemFormData): ItemPayload {
  return {
    name: form.name,
    code: form.code || undefined,
    barcode: form.barcode || undefined,
    categoryId: form.categoryId || undefined,
    categoryName: form.categoryName || undefined,
    brand: form.brand || undefined,
    hsnCode: form.hsnCode || undefined,
    taxRate: form.taxRate,
    unitId: form.unitId || undefined,
    unitName: form.unitName || undefined,
    purchaseRate: form.purchaseRate,
    saleRate: form.saleRate,
    minStockLevel: form.minStockLevel,
    articleNo: form.articleNo || undefined,
    isActive: form.isActive,
    warehouseId: form.warehouseId,
  };
}

// ─── Stock status helpers ─────────────────────────────────────────────────────

type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

function getStockStatus(item: Item): StockStatus {
  const stock = Number(item.stock ?? 0);
  const min   = Number(item.minStockLevel ?? 0);
  if (stock === 0)    return 'OUT_OF_STOCK';
  if (stock < min)    return 'LOW_STOCK';
  return 'IN_STOCK';
}

function stockBadge(item: Item) {
  const s = getStockStatus(item);
  if (s === 'IN_STOCK')  return { cls: 'bg-green-100 text-green-700',  label: 'In Stock'      };
  if (s === 'LOW_STOCK') return { cls: 'bg-amber-100 text-amber-700',  label: 'Low Stock'     };
  return                        { cls: 'bg-red-100   text-red-600',    label: 'Out of Stock'  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ItemsPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();

  // FIX: subscribe to selectedWarehouseId so the page reacts when Topbar changes it
  const { selectedWarehouseId } = useWarehouseStore();

  const { hasPermission } = useAuth();
  const canCreateItem = hasPermission(MODULES.ITEMS, 'create');
  const canEditItem = hasPermission(MODULES.ITEMS, 'edit');
  const canDeleteItem = hasPermission(MODULES.ITEMS, 'delete');

  // ── Data & loading ─────────────────────────────────────────────────────────
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );

  // ── Search & filters ───────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [filterCat, setFilterCat] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | StockStatus>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'true' | 'false'>(
    'ALL',
  );

  // ── Drawer / modal state ───────────────────────────────────────────────────
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // ── Fetch items ────────────────────────────────────────────────────────────
  // FIX: toastError added to deps; dedup key removed — it was preventing
  // refetch on warehouse switch from Topbar. React's own batching is sufficient.
  // NAYA
  const fetchItems = useCallback(
    async (params: FilterItemsParams = {}) => {
      setIsLoading(true);
      try {
        // selectedWarehouseId yahan directly inject karo
        const finalParams: FilterItemsParams = {
          ...params,
          warehouseId: selectedWarehouseId || undefined,
        };
        console.log('Sending Params:', finalParams);
        const res = await filterItems(finalParams);
        if (res.success && res.data) {
          setItems(res.data.map((r) => mapApiToItem(r) as Item));
        }
      } catch (err) {
        toastError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setIsLoading(false);
      }
    },
    [toastError, selectedWarehouseId],
  ); // ← selectedWarehouseId add kiya

  useEffect(() => {
    const params: FilterItemsParams = {};
    if (search.trim()) params.search = search.trim();
    if (filterCat !== 'ALL') params.categoryId = filterCat;
    if (filterStatus !== 'ALL') params.stockStatus = filterStatus;
    if (filterActive !== 'ALL') params.isActive = filterActive;
    // warehouseId ab fetchItems ke andar inject ho raha hai
    void fetchItems(params);
  }, [
    search,
    filterCat,
    filterStatus,
    filterActive,
    selectedWarehouseId,
    fetchItems,
  ]);

  // Load categories once
  useEffect(() => {
    void (async () => {
      try {
        const list = await categoryService.list();
        setCategories(
          list
            .map((c) => ({ id: c.id, name: c.name }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
      } catch (err) {
        toastError(
          err instanceof Error ? err.message : 'Failed to load categories',
        );
      }
    })();
  }, [toastError]);

  // FIX: selectedWarehouseId is now a dep — changing the Topbar warehouse
  // automatically re-fetches items for the newly selected warehouse.

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: items.length,
      active: items.filter((i) => i.isActive).length,
      lowStock: items.filter((i) => getStockStatus(i) === 'LOW_STOCK').length,
      outOfStock: items.filter((i) => getStockStatus(i) === 'OUT_OF_STOCK')
        .length,
    }),
    [items],
  );

  // ── Drawer helpers ─────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingItem(null);
    setSlideOpen(true);
  };
  const openEdit = (i: Item) => {
    setEditingItem(i);
    setSlideOpen(true);
  };
  const closeDrawer = () => setSlideOpen(false);
  const openDetails = (i: Item) => setSelectedItem(i);

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async (data: ItemFormData) => {
    const payload = mapFormToPayload(data);

    if (editingItem) {
      const res = await updateItem(editingItem.id, payload);
      if (res.success && res.data) {
        const updated = {
          ...(mapApiToItem(res.data) as Item),
          stock: editingItem.stock,
        };
        setItems((prev) =>
          prev.map((i) => (i.id === editingItem.id ? updated : i)),
        );
        success('Item updated successfully');
        closeDrawer();
      }
    } else {
      const res = await createItem(payload);
      if (res.success && res.data) {
        setItems((prev) => [mapApiToItem(res.data) as Item, ...prev]);
        success('Item added successfully');
        closeDrawer();
      }
    }
  };

  // ── Soft delete ────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await deleteItem(deleteConfirm.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteConfirm.id));
      success('Item deactivated (soft delete)');
      setDeleteConfirm(null);
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : 'Failed to deactivate item',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (item: Item) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((c) => (c.id === item.id ? { ...c, isActive: !c.isActive } : c)),
    );
    try {
      await updateItem(item.id, { isActive: !item.isActive });
      success(`${item.name} ${item.isActive ? 'deactivated' : 'activated'}`);
    } catch (err) {
      // Roll back
      setItems((prev) =>
        prev.map((c) =>
          c.id === item.id ? { ...c, isActive: item.isActive } : c,
        ),
      );
      toastError(
        err instanceof Error ? err.message : 'Failed to update status',
      );
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-[#1e293b]">Item Master</h2>
              <p className="text-sm text-[#64748b] mt-0.5">
                Products, goods and inventory items
              </p>
            </div>
          </div>
          {canCreateItem && (
            <button
              onClick={openAdd}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" /> Add Item
            </button>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-4">
          {(
            [
              {
                label: 'Total Items',
                value: stats.total,
                icon: 'ri-box-3-line',
                color: 'indigo',
              },
              {
                label: 'Active Items',
                value: stats.active,
                icon: 'ri-checkbox-circle-line',
                color: 'green',
              },
              {
                label: 'Low Stock',
                value: stats.lowStock,
                icon: 'ri-alert-line',
                color: 'amber',
              },
              {
                label: 'Out of Stock',
                value: stats.outOfStock,
                icon: 'ri-error-warning-line',
                color: 'red',
              },
            ] as const
          ).map((c) => (
            <div
              key={c.label}
              className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${
                c.color === 'red' && c.value > 0
                  ? 'border-red-200'
                  : 'border-[#e2e8f0]'
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                  c.color === 'indigo'
                    ? 'bg-indigo-50'
                    : c.color === 'green'
                      ? 'bg-green-50'
                      : c.color === 'amber'
                        ? 'bg-amber-50'
                        : 'bg-red-50'
                }`}
              >
                <i
                  className={`${c.icon} text-lg ${
                    c.color === 'indigo'
                      ? 'text-[#4f46e5]'
                      : c.color === 'green'
                        ? 'text-green-600'
                        : c.color === 'amber'
                          ? 'text-amber-600'
                          : 'text-red-500'
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${c.color === 'red' && c.value > 0 ? 'text-red-600' : 'text-[#1e293b]'}`}
                >
                  {c.value}
                </p>
                <p className="text-xs text-[#64748b]">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Warehouse indicator banner ── */}
        {/* FIX: shows which warehouse is active so user knows what they're filtering */}
        {selectedWarehouseId && (
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-xs text-indigo-700 font-medium">
            <i className="ri-store-3-line text-indigo-500" />
            Showing items for warehouse selected in the top bar. To see all
            warehouses, switch the selection above.
          </div>
        )}

        {/* ── Filters ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-56">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, code or barcode..."
              className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
            />
          </div>

          {/* Category */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] bg-white focus:outline-none focus:border-[#4f46e5] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock status pills */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
            {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterStatus === s
                      ? 'bg-white text-[#1e293b] shadow-sm'
                      : 'text-[#64748b] hover:text-[#1e293b]'
                  }`}
                >
                  {s === 'ALL'
                    ? 'All'
                    : s === 'IN_STOCK'
                      ? 'In Stock'
                      : s === 'LOW_STOCK'
                        ? 'Low'
                        : 'Out'}
                </button>
              ),
            )}
          </div>

          {/* Active / inactive pills */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
            {(
              [
                { key: 'ALL', label: 'All Items' },
                { key: 'true', label: 'Active' },
                { key: 'false', label: 'Inactive' },
              ] as const
            ).map((s) => (
              <button
                key={s.key}
                onClick={() => setFilterActive(s.key)}
                className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterActive === s.key
                    ? 'bg-white text-[#1e293b] shadow-sm'
                    : 'text-[#64748b] hover:text-[#1e293b]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <ItemDetail
            item={selectedItem}
            onClose={() => setSelectedItem(null)}
          />

          <div className="w-full overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  {[
                    'Code',
                    'Item Name',
                    'Category',
                    'HSN',
                    'GST',
                    'Unit',
                    'Purchase Rate',
                    'Sale Rate',
                    'Stock',
                    'Status',
                    'Active',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {/* Loading skeleton */}
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f1f5f9]">
                      {/* FIX: 12 skeleton cells to match 12 columns */}
                      {Array.from({ length: 12 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Data rows */}
                {!isLoading &&
                  items.map((item, idx) => {
                    const badge = stockBadge(item);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => openDetails(item)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openDetails(item);
                          }
                        }}
                        className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                          idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''
                        }`}
                      >
                        {/* Code */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-[#64748b]">
                            {item.code || '—'}
                          </span>
                        </td>

                        {/* Name + barcode */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1e293b] whitespace-nowrap">
                            {item.name}
                          </p>
                          {item.barcode && (
                            <p className="text-xs text-[#94a3b8]">
                              {item.barcode}
                            </p>
                          )}
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3 text-[#64748b] text-xs whitespace-nowrap">
                          {item.categoryName || '—'}
                        </td>

                        {/* HSN */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-[#64748b]">
                            {item.hsnCode || '—'}
                          </span>
                        </td>

                        {/* GST */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#4f46e5]">
                            {item.taxRate}%
                          </span>
                        </td>

                        {/* Unit */}
                        <td className="px-4 py-3 text-[#64748b] whitespace-nowrap text-xs">
                          {item.unitName || '—'}
                        </td>

                        {/* Purchase rate */}
                        <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                          {formatINR(item.purchaseRate)}
                        </td>

                        {/* Sale rate */}
                        <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">
                          {formatINR(item.saleRate)}
                        </td>

                        {/* Stock / min stock */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`font-bold ${item.stock <= item.minStockLevel ? 'text-amber-600' : 'text-[#1e293b]'}`}
                          >
                            {item.stock}
                          </span>
                          <span className="text-xs text-[#94a3b8] ml-1">
                            /{item.minStockLevel}
                          </span>
                        </td>

                        {/* Stock status badge */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>

                        {/* Active toggle */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {canEditItem ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleToggleActive(item);
                              }}
                              className={`relative w-11 h-6 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#4f46e5]/40 ${
                                item.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'
                              }`}
                              title={
                                item.isActive
                                  ? 'Click to deactivate'
                                  : 'Click to activate'
                              }
                              aria-label={
                                item.isActive
                                  ? 'Deactivate item'
                                  : 'Activate item'
                              }
                            >
                              <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 flex items-center justify-center ${
                                  item.isActive
                                    ? 'translate-x-5'
                                    : 'translate-x-0'
                                }`}
                              >
                                <i
                                  className={`text-[8px] transition-all duration-300 ${
                                    item.isActive
                                      ? 'ri-check-line text-[#4f46e5]'
                                      : 'ri-close-line text-[#94a3b8]'
                                  }`}
                                />
                              </span>
                            </button>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                item.isActive
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-slate-100 text-slate-500 border-slate-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${item.isActive ? 'bg-green-500' : 'bg-slate-400'}`}
                              />
                              {item.isActive ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>

                        {/* Edit / Delete */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            {canEditItem && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(item);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <i className="ri-edit-line text-sm" />
                              </button>
                            )}
                            {canDeleteItem && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirm(item);
                                }}
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
                                title="Deactivate"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {/* Empty state */}
                {/* FIX: colSpan corrected from 11 → 12 to match all columns */}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-12 text-center">
                      <i className="ri-box-3-line text-4xl text-[#e2e8f0] block mb-2" />
                      <p className="text-[#94a3b8] text-sm">
                        No items match your search
                      </p>
                      {searchInput && (
                        <p className="text-xs text-[#94a3b8] mt-1">
                          Try a different search term
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FIX: Row count moved inside the table container, above its closing tag */}
          <div className="px-4 py-3 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">
              Showing {items.length} item{items.length !== 1 ? 's' : ''}
              {selectedWarehouseId ? ' for selected warehouse' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Slide-over form */}
      <ItemForm
        open={slideOpen}
        isEditing={!!editingItem}
        initialData={editingItem ?? undefined}
        onClose={closeDrawer}
        onSave={handleSave}
      />

      {/* Soft-delete confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Deactivate Item"
        message={`Deactivate "${deleteConfirm?.name}"? It will be hidden from billing but history is preserved.`}
        variant="warning"
        confirmLabel={isDeleting ? 'Deactivating...' : 'Yes, Deactivate (Y)'}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}