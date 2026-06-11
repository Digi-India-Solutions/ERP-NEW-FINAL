import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import ItemForm from './components/ItemForm';
import ItemDetail from './components/ItemDetail';
import { useToast } from '@/contexts/ToastContext';
import { useDebounce } from '@/utils/debounce';
import { formatINR } from '@/utils/format';
import { MODULES } from '@/utils/permissions.js';
import { useAuth } from '@/contexts/AuthContext';
import {
  filterItems,
  deleteItem,
  updateItem,
  mapApiToItem,
  type ItemResponse,
} from '@/api/item.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item {
  id: string;
  name: string;
  code?: string;
  barcode?: string;
  categoryId?: string;
  categoryName?: string;
  brand?: string;
  hsnCode?: string;
  taxRate: number;
  unitId?: string;
  unitName?: string;
  purchaseRate: number;
  saleRate: number;
  mrp?: number;
  minStockLevel: number;
  articleNo?: string;
  sizeColor?: string;
  imageUrl?: string;
  warehouseId: string;
  isActive: boolean;
  stock: number;
  createdAt?: string;
  updatedAt?: string;
}

type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

// ─── Helper Functions ─────────────────────────────────────────────────────────

function getStockStatus(item: Item): StockStatus {
  const stock = Number(item.stock ?? 0);
  const minStockLevel = Number(item.minStockLevel ?? 0);
  if (stock === 0) return 'OUT_OF_STOCK';
  if (stock < minStockLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}

function stockBadge(item: Item) {
  const status = getStockStatus(item);
  if (status === 'IN_STOCK')
    return { cls: 'bg-green-100 text-green-700', label: 'In Stock' };
  if (status === 'LOW_STOCK')
    return { cls: 'bg-amber-100 text-amber-700', label: 'Low Stock' };
  return { cls: 'bg-red-100 text-red-600', label: 'Out of Stock' };
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function ItemsPage() {
  const navigate = useNavigate();
  const { success, error: toastError } = useToast();
  const { selectedWarehouseId } = useWarehouseStore();
  const { hasPermission } = useAuth();

  const canCreateItem = hasPermission(MODULES.ITEMS, 'create');
  const canEditItem = hasPermission(MODULES.ITEMS, 'edit');
  const canDeleteItem = hasPermission(MODULES.ITEMS, 'delete');

  // ── Data & loading ──
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [totalItems, setTotalItems] = useState(0);

  // ── Search & filters ──
  const [searchInput, setSearchInput] = useState('');
  const search = useDebounce(searchInput, 400);
  const [filterCat, setFilterCat] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | StockStatus>('ALL');
  const [filterActive, setFilterActive] = useState<'ALL' | 'true' | 'false'>(
    'ALL',
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // ── Drawer / modal state ──
  const [slideOpen, setSlideOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // ── Fetch items from API ──
  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};

      if (search.trim()) params.search = search.trim();
      if (filterCat !== 'ALL') params.categoryId = filterCat;
      if (filterStatus !== 'ALL') params.stockStatus = filterStatus;
      if (filterActive !== 'ALL') params.isActive = filterActive;
      if (selectedWarehouseId) params.warehouseId = selectedWarehouseId;

      console.log('Fetching items with params:', params);
      const response = await filterItems(params);
      console.log('API Response:', response);

      if (response.success && response.data) {
        // Map API response to Item interface
        const mappedItems = response.data.map((apiItem: ItemResponse) => {
          const mapped = mapApiToItem(apiItem);
          // Ensure stock is a number
          return {
            ...mapped,
            stock: typeof mapped.stock === 'number' ? mapped.stock : 0,
            warehouseId: (apiItem as any).warehouseid || mapped.warehouseId,
          } as Item;
        });

        setItems(mappedItems);
        setTotalItems(response.count || mappedItems.length);
      } else {
        setItems([]);
        setTotalItems(0);
      }
    } catch (err) {
      console.error('Fetch items error:', err);
      toastError(err instanceof Error ? err.message : 'Failed to load items');
      setItems([]);
      setTotalItems(0);
    } finally {
      setIsLoading(false);
    }
  }, [
    search,
    filterCat,
    filterStatus,
    filterActive,
    selectedWarehouseId,
    toastError,
  ]);

  // Load categories (from your existing category service)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        // Agar aapke paas categoryService hai toh use karo
        // @ts-ignore - replace with your actual category service
        const list = await categoryService.list();
        setCategories(list.map((c: any) => ({ id: c.id, name: c.name })));
      } catch (err) {
        console.error('Failed to load categories', err);
        // Fallback: empty categories
        setCategories([]);
      }
    };
    loadCategories();
  }, []);

  // Fetch items when filters change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // ── Stats ──
  const stats = useMemo(
    () => ({
      total: totalItems,
      active: items.filter((i) => i.isActive).length,
      lowStock: items.filter((i) => getStockStatus(i) === 'LOW_STOCK').length,
      outOfStock: items.filter((i) => getStockStatus(i) === 'OUT_OF_STOCK')
        .length,
    }),
    [items, totalItems],
  );

  // ── Drawer helpers ──
  const openAdd = () => {
    setEditingItem(null);
    setSlideOpen(true);
  };

  const openEdit = (item: Item) => {
    setEditingItem(item);
    setSlideOpen(true);
  };

  const closeDrawer = () => {
    setSlideOpen(false);
    setEditingItem(null);
  };

  const openDetails = (item: Item) => setSelectedItem(item);

  // ── Save handler (refresh list after save) ──
  const handleSave = async () => {
    await fetchItems(); // Refresh the list
    closeDrawer();
  };

  // ── Delete handler ──
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const response = await deleteItem(deleteConfirm.id);
      if (response.success) {
        success('Item deactivated successfully');
        await fetchItems(); // Refresh list
        setDeleteConfirm(null);
      } else {
        throw new Error(response.message || 'Failed to deactivate');
      }
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : 'Failed to deactivate item',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Toggle active status ──
  const handleToggleActive = async (item: Item) => {
    // Optimistic update
    const originalStatus = item.isActive;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i)),
    );

    try {
      await updateItem(item.id, { isActive: !item.isActive });
      success(`${item.name} ${item.isActive ? 'deactivated' : 'activated'}`);
      await fetchItems(); // Refresh to be safe
    } catch (err) {
      // Revert on error
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, isActive: originalStatus } : i,
        ),
      );
      toastError(
        err instanceof Error ? err.message : 'Failed to update status',
      );
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Paginated items
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-4 gap-4">
          {[
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
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${
                stat.color === 'red' && stat.value > 0
                  ? 'border-red-200'
                  : 'border-[#e2e8f0]'
              }`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                  stat.color === 'indigo'
                    ? 'bg-indigo-50'
                    : stat.color === 'green'
                      ? 'bg-green-50'
                      : stat.color === 'amber'
                        ? 'bg-amber-50'
                        : 'bg-red-50'
                }`}
              >
                <i
                  className={`${stat.icon} text-lg ${
                    stat.color === 'indigo'
                      ? 'text-[#4f46e5]'
                      : stat.color === 'green'
                        ? 'text-green-600'
                        : stat.color === 'amber'
                          ? 'text-amber-600'
                          : 'text-red-500'
                  }`}
                />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${
                    stat.color === 'red' && stat.value > 0
                      ? 'text-red-600'
                      : 'text-[#1e293b]'
                  }`}
                >
                  {stat.value}
                </p>
                <p className="text-xs text-[#64748b]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Warehouse indicator ── */}
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

          {/* Category Filter */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] bg-white focus:outline-none focus:border-[#4f46e5] cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          {/* Stock Status Pills */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
            {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    filterStatus === status
                      ? 'bg-white text-[#1e293b] shadow-sm'
                      : 'text-[#64748b] hover:text-[#1e293b]'
                  }`}
                >
                  {status === 'ALL'
                    ? 'All'
                    : status === 'IN_STOCK'
                      ? 'In Stock'
                      : status === 'LOW_STOCK'
                        ? 'Low'
                        : 'Out'}
                </button>
              ),
            )}
          </div>

          {/* Active Status Pills */}
          <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
            {[
              { key: 'ALL', label: 'All Items' },
              { key: 'true', label: 'Active' },
              { key: 'false', label: 'Inactive' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() =>
                  setFilterActive(option.key as 'ALL' | 'true' | 'false')
                }
                className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterActive === option.key
                    ? 'bg-white text-[#1e293b] shadow-sm'
                    : 'text-[#64748b] hover:text-[#1e293b]'
                }`}
              >
                {option.label}
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
            <table className="min-w-[1200px] w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    CODE
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    ITEM NAME
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    CATEGORY
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    HSN
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    GST
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    UNIT
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    PURCHASE
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    SALE
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    STOCK
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    STATUS
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Loading Skeleton */}
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-[#f1f5f9]">
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-[#f1f5f9] rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {/* Data Rows */}
                {!isLoading &&
                  paginatedItems.map((item, idx) => {
                    const badge = stockBadge(item);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => openDetails(item)}
                        className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors cursor-pointer ${
                          idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-[#64748b]">
                            {item.code || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1e293b]">
                            {item.name}
                          </p>
                          {item.barcode && (
                            <p className="text-xs text-[#94a3b8] font-mono">
                              {item.barcode}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#64748b] text-xs whitespace-nowrap">
                          {item.categoryName || '—'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-[#64748b]">
                            {item.hsnCode || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-[#4f46e5]">
                            {item.taxRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#64748b] whitespace-nowrap text-xs">
                          {item.unitName || '—'}
                        </td>
                        <td className="px-4 py-3 text-right text-[#64748b] whitespace-nowrap">
                          {formatINR(item.purchaseRate)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[#1e293b] whitespace-nowrap">
                          {formatINR(item.saleRate)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`font-semibold ${badge.cls}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div
                            className="flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canEditItem && (
                              <button
                                onClick={() => openEdit(item)}
                                className="p-1.5 rounded-md hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer"
                                title="Edit item"
                              >
                                <i className="ri-pencil-line text-sm" />
                              </button>
                            )}
                            {canDeleteItem && item.isActive && (
                              <button
                                onClick={() => setDeleteConfirm(item)}
                                className="p-1.5 rounded-md hover:bg-[#fef2f2] text-[#64748b] hover:text-red-600 transition-colors cursor-pointer"
                                title="Deactivate item"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            )}
                            {canEditItem && (
                              <button
                                onClick={() => handleToggleActive(item)}
                                className={`p-1.5 rounded-md hover:bg-[#f1f5f9] transition-colors cursor-pointer ${
                                  item.isActive
                                    ? 'text-green-600'
                                    : 'text-[#64748b]'
                                }`}
                                title={item.isActive ? 'Active' : 'Inactive'}
                              >
                                <i
                                  className={`${item.isActive ? 'ri-checkbox-circle-line' : 'ri-eye-off-line'} text-sm`}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                {/* Empty State */}
                {!isLoading && items.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center">
                      <i className="ri-box-3-line text-4xl text-[#e2e8f0] block mb-2" />
                      <p className="text-[#94a3b8] text-sm">No items found</p>
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[#e2e8f0]">
              <div className="text-xs text-[#94a3b8]">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalItems)} of{' '}
                {totalItems} items
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded border border-[#e2e8f0] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8fafc] cursor-pointer"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-sm text-[#64748b]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded border border-[#e2e8f0] text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f8fafc] cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Item Form Drawer */}
      <ItemForm
        open={slideOpen}
        isEditing={!!editingItem}
        initialData={editingItem || undefined}
        onClose={closeDrawer}
        onSave={handleSave}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title="Deactivate Item"
        message={`Deactivate "${deleteConfirm?.name}"? It will be hidden from billing but history is preserved.`}
        variant="warning"
        confirmLabel={isDeleting ? 'Deactivating...' : 'Yes, Deactivate'}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}
