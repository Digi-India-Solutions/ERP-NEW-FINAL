// import { useState, useMemo, useEffect } from 'react';
// import { mockItems, mockCategories } from '@/mocks/masters';
// import { useBarcodeCartStore } from '@/stores/barcodeCartStore';
// import { getData } from "../../../../services/FetchNodeServices.js"
// const ITEMS_PER_PAGE = 50;

// export default function BarcodeItemsTable() {
//   const [search, setSearch] = useState('');
//   const [categoryFilter, setCategoryFilter] = useState('');
//   const [brandFilter, setBrandFilter] = useState('');
//   const [warehouseFilter, setWarehouseFilter] = useState('');
//   const [page, setPage] = useState(1);
//   const [itemList, setItemList] = useState([])

//   const { addToCart, removeFromCart, isInCart } = useBarcodeCartStore();

//   useEffect(() => {
//     const fetchItemsList = async () => {
//       try {
//         const respon = await getData("api/v1/item/")
//         console.log("ITEM RESPONS === >", respon.data)
//         setItemList(respon.data)
//       } catch (e) {
//         console.log(e)
//       }
//     }
//     fetchItemsList()
//   }, [])
//   const brands = useMemo(() => {
//     const set = new Set(itemList.map((i) => i.brand));
//     return Array.from(set).sort();
//   }, []);

//   const filtered = useMemo(() => {
//     const q = search.toLowerCase();
//     return itemList.filter((item) => {
//       const matchSearch =
//         !q ||
//         item.name.toLowerCase().includes(q) ||
//         (item.barcode && item.barcode.includes(q)) ||
//         item.code.toLowerCase().includes(q);
//       const matchCat = !categoryFilter || item.categoryId === categoryFilter;
//       const matchBrand = !brandFilter || item.brand === brandFilter;
//       return matchSearch && matchCat && matchBrand;
//     });
//   }, [search, categoryFilter, brandFilter, warehouseFilter]);

//   const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
//   const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

//   const handleFilterChange = () => setPage(1);

//   const handleAddToggle = (item: typeof itemList[0]) => {
//     if (!item.barcode) return;
//     if (isInCart(item.id)) {
//       removeFromCart(item.id);
//     } else {
//       addToCart({
//         itemId: item.id,
//         name: item.name,
//         brand: item.brand,
//         category: item.categoryName,
//         barcode: item.barcode,
//         mrp: item.mrp,
//         saleRate: item.saleRate,
//         labelQty: 1,
//       });
//     }
//   };

//   return (
//     <div className="bg-white rounded-lg border border-slate-200">
//       {/* Filter bar */}
//       <div className="flex items-center gap-3 p-4 border-b border-slate-100 flex-wrap">
//         <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
//           <div className="w-4 h-4 flex items-center justify-center text-slate-400">
//             <i className="ri-search-line text-sm" />
//           </div>
//           <input
//             type="text"
//             placeholder="Search by name or barcode..."
//             value={search}
//             onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
//             className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
//           />
//         </div>
//         <select
//           value={categoryFilter}
//           onChange={(e) => { setCategoryFilter(e.target.value); handleFilterChange(); }}
//           className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 text-slate-700 outline-none cursor-pointer"
//         >
//           <option value="">All Categories</option>
//           {mockCategories.map((c) => (
//             <option key={c.id} value={c.id}>{c.name}</option>
//           ))}
//         </select>
//         <select
//           value={brandFilter}
//           onChange={(e) => { setBrandFilter(e.target.value); handleFilterChange(); }}
//           className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 text-slate-700 outline-none cursor-pointer"
//         >
//           <option value="">All Brands</option>
//           {brands.map((b) => (
//             <option key={b} value={b}>{b}</option>
//           ))}
//         </select>
//         <select
//           value={warehouseFilter}
//           onChange={(e) => { setWarehouseFilter(e.target.value); handleFilterChange(); }}
//           className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 text-slate-700 outline-none cursor-pointer"
//         >
//           <option value="">All Warehouses</option>
//           <option value="wh-001">Main Warehouse</option>
//           <option value="wh-002">North Branch</option>
//           <option value="wh-003">South Depot</option>
//           <option value="wh-006">Retail Store</option>
//         </select>
//         <span className="text-xs text-slate-400 whitespace-nowrap">{filtered.length} items</span>
//       </div>

//       {/* Table */}
//       <div className="overflow-x-auto">
//         <table className="w-full text-sm">
//           <thead>
//             <tr className="bg-slate-50 border-b border-slate-100">
//               <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item Name</th>
//               <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Brand</th>
//               <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
//               <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Barcode No</th>
//               <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">MRP</th>
//               <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sale Rate</th>
//               <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
//               <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-slate-50">
//             {paginated.map((item) => {
//               const inCart = isInCart(item.id);
//               const hasBarcode = !!item.barcode;
//               return (
//                 <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
//                   <td className="px-4 py-3">
//                     <div className="font-medium text-slate-800">{item.name}</div>
//                     <div className="text-xs text-slate-400">{item.code}</div>
//                   </td>
//                   <td className="px-4 py-3 text-slate-600">{item.brand}</td>
//                   <td className="px-4 py-3 text-slate-600">{item.categoryName}</td>
//                   <td className="px-4 py-3">
//                     {hasBarcode ? (
//                       <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
//                         {item.barcode}
//                       </span>
//                     ) : (
//                       <span className="text-xs text-slate-400 italic">No barcode</span>
//                     )}
//                   </td>
//                   <td className="px-4 py-3 text-right text-slate-700">
//                     ₹{item.mrp.toLocaleString('en-IN')}
//                   </td>
//                   <td className="px-4 py-3 text-right text-slate-700">
//                     ₹{item.saleRate.toLocaleString('en-IN')}
//                   </td>
//                   <td className="px-4 py-3 text-right">
//                     <span className={`text-sm font-medium ${item.stock <= item.minStockLevel ? 'text-red-500' : 'text-slate-700'}`}>
//                       {item.stock}
//                     </span>
//                   </td>
//                   <td className="px-4 py-3 text-center">
//                     {!hasBarcode ? (
//                       <button
//                         disabled
//                         className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed whitespace-nowrap"
//                       >
//                         No Barcode
//                       </button>
//                     ) : inCart ? (
//                       <button
//                         onClick={() => handleAddToggle(item)}
//                         className="text-xs px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
//                       >
//                         <i className="ri-check-line mr-1" />
//                         In Print List
//                       </button>
//                     ) : (
//                       <button
//                         onClick={() => handleAddToggle(item)}
//                         className="text-xs px-3 py-1.5 rounded-md border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer whitespace-nowrap"
//                       >
//                         <i className="ri-add-line mr-1" />
//                         Add to Print
//                       </button>
//                     )}
//                   </td>
//                 </tr>
//               );
//             })}
//             {paginated.length === 0 && (
//               <tr>
//                 <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
//                   No items match your filters
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Pagination */}
//       {totalPages > 1 && (
//         <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
//           <span className="text-xs text-slate-500">
//             Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
//           </span>
//           <div className="flex items-center gap-1">
//             <button
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//               disabled={page === 1}
//               className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
//             >
//               <i className="ri-arrow-left-s-line text-sm" />
//             </button>
//             {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
//               <button
//                 key={p}
//                 onClick={() => setPage(p)}
//                 className={`w-7 h-7 flex items-center justify-center rounded border text-xs cursor-pointer ${p === page
//                   ? 'bg-indigo-600 border-indigo-600 text-white'
//                   : 'border-slate-200 text-slate-600 hover:bg-slate-50'
//                   }`}
//               >
//                 {p}
//               </button>
//             ))}
//             <button
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//               disabled={page === totalPages}
//               className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
//             >
//               <i className="ri-arrow-right-s-line text-sm" />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

import { useState, useMemo, useEffect } from 'react';
import { useBarcodeCartStore } from '@/stores/barcodeCartStore';
import { getData } from "../../../../services/FetchNodeServices.js";

const ITEMS_PER_PAGE = 50;

interface Item {
  id: string;
  company_id: string;
  name: string;
  code: string;
  barcode: string | null;
  category_id: string;
  category: string | null;
  brand: string | null;
  hsn_code: string;
  gst_rate: string;
  primary_unit_id: string;
  purchase_rate: string;
  sale_rate: string;
  mrp: string;
  min_stock_level: string;
  article_no: string | null;
  size_color: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  unit_name: string | null;
  stock: number;
}

export default function BarcodeItemsTable() {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [page, setPage] = useState(1);
  const [itemList, setItemList] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addToCart, removeFromCart, isInCart } = useBarcodeCartStore();

  useEffect(() => {
    const fetchItemsList = async () => {
      try {
        setLoading(true);
        setError(null);
        const respon = await getData("api/v1/item/");
        setItemList(respon.data || []);
      } catch (e) {
        console.error(e);
        setError("Failed to load items. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchItemsList();
  }, []);

  // Derive unique categories from real data
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    itemList.forEach((i) => {
      if (i.category_id && i.category) {
        map.set(i.category_id, i.category);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [itemList]);

  // Derive unique brands from real data
  const brands = useMemo(() => {
    const set = new Set(itemList.map((i) => i.brand).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [itemList]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return itemList.filter((item) => {
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        (item.barcode && item.barcode.toLowerCase().includes(q)) ||
        item.code.toLowerCase().includes(q);
      const matchCat = !categoryFilter || item.category_id === categoryFilter;
      const matchBrand = !brandFilter || item.brand === brandFilter;
      return matchSearch && matchCat && matchBrand;
    });
  }, [itemList, search, categoryFilter, brandFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleFilterChange = () => setPage(1);

  const handleAddToggle = (item: Item) => {
    if (!item.barcode) return;
    if (isInCart(item.id)) {
      removeFromCart(item.id);
    } else {
      addToCart({
        itemId: item.id,
        name: item.name,
        brand: item.brand,
        category: item.category,
        barcode: item.barcode,
        mrp: parseFloat(item.mrp) || 0,
        saleRate: parseFloat(item.sale_rate) || 0,
        labelQty: 1,
      });
    }
  };

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '₹0';
    return '₹' + num.toLocaleString('en-IN');
  };

  const isLowStock = (item: Item) => item.stock <= parseFloat(item.min_stock_level);

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Filter bar */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-100 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
          <div className="w-4 h-4 flex items-center justify-center text-slate-400">
            <i className="ri-search-line text-sm" />
          </div>
          <input
            type="text"
            placeholder="Search by name, code or barcode..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); handleFilterChange(); }}
            className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none"
          />
          {search && (
            <button onClick={() => { setSearch(''); handleFilterChange(); }} className="text-slate-400 hover:text-slate-600">
              <i className="ri-close-line text-sm" />
            </button>
          )}
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); handleFilterChange(); }}
          className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={brandFilter}
          onChange={(e) => { setBrandFilter(e.target.value); handleFilterChange(); }}
          className="text-sm border border-slate-200 rounded-md px-3 py-2 bg-slate-50 text-slate-700 outline-none cursor-pointer"
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400 whitespace-nowrap">{filtered.length} items</span>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-2">
          <i className="ri-loader-4-line animate-spin text-lg" />
          Loading items...
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <i className="ri-error-warning-line text-2xl text-red-400" />
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 mt-1"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Item Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Brand</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Barcode No</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">MRP</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sale Rate</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map((item) => {
                const inCart = isInCart(item.id);
                const hasBarcode = !!item.barcode;
                const lowStock = isLowStock(item);
                return (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.code}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{item.brand || <span className="text-slate-300 italic text-xs">—</span>}</td>
                    <td className="px-4 py-3 text-slate-600">{item.category || <span className="text-slate-300 italic text-xs">—</span>}</td>
                    <td className="px-4 py-3">
                      {hasBarcode ? (
                        <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {item.barcode}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No barcode</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(item.mrp)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {formatCurrency(item.sale_rate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${item.stock < 0 ? 'text-red-600' : lowStock ? 'text-amber-500' : 'text-slate-700'}`}>
                        {item.stock}
                      </span>
                      {item.stock < 0 && (
                        <div className="text-xs text-red-400">Negative</div>
                      )}
                      {item.stock >= 0 && lowStock && (
                        <div className="text-xs text-amber-400">Low</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {!hasBarcode ? (
                        <button
                          disabled
                          className="text-xs px-3 py-1.5 rounded-md border border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed whitespace-nowrap"
                        >
                          No Barcode
                        </button>
                      ) : inCart ? (
                        <button
                          onClick={() => handleAddToggle(item)}
                          className="text-xs px-3 py-1.5 rounded-md border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-check-line mr-1" />
                          In Print List
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToggle(item)}
                          className="text-xs px-3 py-1.5 rounded-md border border-indigo-300 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-add-line mr-1" />
                          Add to Print
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400 text-sm">
                    No items match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <i className="ri-arrow-left-s-line text-sm" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-7 h-7 flex items-center justify-center rounded border text-xs cursor-pointer ${
                  p === page
                    ? 'bg-indigo-600 border-indigo-600 text-white'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              <i className="ri-arrow-right-s-line text-sm" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}