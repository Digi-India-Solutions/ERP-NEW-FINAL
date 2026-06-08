import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import { useToast } from '@/contexts/ToastContext';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useWarehouseList } from '@/hooks/useWarehouses';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';
import { getWarehousesForUser } from '@/api/warehouse.api';
import {
  stockService,
  type StockViewItem,
  type StockAdjustmentRecord,
} from '@/services/stockService';
import { useWarehouseStore } from '@/stores/warehouseStore';

const INVENTORY_STOCK_UPDATED_EVENT = 'inventory:stock-updated';

interface AdjRecord { id: string; item: string; warehouse: string; type: string; qty: number; reason: string; by: string; date: string; }

interface WarehouseOption {
  id: string;
  name: string;
}

interface StockItem {
  id: string;
  name: string;
  code: string | null;
  unit: string | null;
  totalStock: number;
  warehouseStocks: Array<{
    warehouseId: string;
    warehouseName: string;
    qty: number;
  }>;
}

const mapStockItem = (item: StockViewItem): StockItem => ({
  id: item.id,
  name: item.name,
  code: item.code,
  unit: item.unit,
  totalStock: item.totalStock,
  warehouseStocks: item.warehouseStocks,
});

const mapAdjustmentRecord = (record: StockAdjustmentRecord): AdjRecord => ({
  id: record.id,
  item: record.itemName ?? record.itemCode ?? record.itemId,
  warehouse: record.warehouseName ?? record.warehouseId,
  type: record.type,
  qty: record.quantity,
  reason: record.reason,
  by: record.createdByName || (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.createdBy) ? 'Unknown User' : record.createdBy),
  date: record.adjustmentDate?.split('T')[0] ?? '',
});

export default function StockAdjustmentPage() {
  const { user } = useAuthStore();
  const toast = useToast();
  const { hasPermission, hasControl } = useAuth();
  const canAdjust =
    hasControl('approveStockAdjustment') ||
    hasPermission(MODULES.STOCK_ADJUSTMENT, 'create');
  const formRef = useRef<HTMLDivElement>(null);
  useKeyboardNav(formRef as React.RefObject<HTMLElement>);

  const [mode, setMode] = useState<'list' | 'new'>('list');
  const [adjustments, setAdjustments] = useState<AdjRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [itemId, setItemId] = useState('');
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  const [warehouse, setWarehouse] = useState('');
  const [type, setType] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const canCreateAdjustment =
    hasControl('approveStockAdjustment') ||
    hasPermission(MODULES.STOCK_ADJUSTMENT, 'create');

  const [warehousePage, setWarehousePage] = useState<
    Array<{ id: string; name: string; isActive: boolean }>
  >([]);
  const { selectedWarehouseId } = useWarehouseStore();
  const canViewAll = hasControl('viewAllWarehouses');

  const loadAdjustments = useCallback(async () => {
    try {
      const records = await stockService.getAdjustments({
        warehouse_id: selectedWarehouseId || undefined,
      });
      setAdjustments(records.map(mapAdjustmentRecord));
    } catch (loadError) {
      setAdjustments([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load adjustments',
      );
    }
  }, [selectedWarehouseId]); // ← yeh zaroori hai

  const loadStock = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const stockResult = await stockService.getStock({
        warehouse_id: selectedWarehouseId || undefined,
      });
      setStockItems(stockResult.data.map(mapStockItem));
    } catch (loadError) {
      setStockItems([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load stock data',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    const load = async () => {
      const [, warehouseRes] = await Promise.allSettled([
        loadStock(),
        getWarehousesForUser(canViewAll),
      ]);
      if (warehouseRes.status === 'fulfilled') {
        setWarehousePage(
          (warehouseRes.value.data ?? []).map((w) => ({
            id: w.id,
            name: w.name,
            isActive: w.is_active,
          })),
        );
      }
      void loadAdjustments();
    };
    void load();
  }, [canViewAll,loadStock, selectedWarehouseId]);

const warehouseOptions = useMemo<WarehouseOption[]>(() => {
  return warehousePage
    .filter(
      (w) =>
        w.isActive && (!selectedWarehouseId || w.id === selectedWarehouseId),
    )
    .map((w) => ({ id: w.id, name: w.name }));
}, [warehousePage, selectedWarehouseId]);

  // existing useEffect ke baad add karo
  useEffect(() => {
    void loadAdjustments();
  }, [selectedWarehouseId]);

  useEffect(() => {
    if (
      warehouse &&
      !warehouseOptions.some((option) => option.id === warehouse)
    ) {
      setWarehouse(warehouseOptions[0]?.id ?? '');
    }
  }, [warehouse, warehouseOptions]);

  const selectedItem = stockItems.find((item) => item.id === itemId) ?? null;
  const selectedWarehouse =
    warehouseOptions.find((item) => item.id === warehouse) ?? null;
  const filteredStockItems = useMemo(() => {
    const q = itemSearchQuery.trim().toLowerCase();
    if (!q) return stockItems;

    return stockItems.filter((item) => {
      const code = item.code?.toLowerCase() ?? '';
      const name = item.name.toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [stockItems, itemSearchQuery]);

  const currentStock = selectedItem
    ? (selectedItem.warehouseStocks.find(
        (breakdown) => breakdown.warehouseId === warehouse,
      )?.qty ?? selectedItem.totalStock)
    : 0;
  const newStock = selectedItem
    ? type === 'INCREASE'
      ? currentStock + qty
      : Math.max(0, currentStock - qty)
    : null;

  const handleSave = async () => {
    if (!canCreateAdjustment) {
      toast.error('You do not have permission to adjust stock');
      return;
    }
    if (!itemId) {
      toast.error('Select an item');
      return;
    }
    if (!warehouse) {
      toast.error('Select a warehouse');
      return;
    }
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }
    if (type === 'DECREASE' && selectedItem && qty > currentStock) {
      toast.error(
        `Cannot decrease by more than current stock (${currentStock})`,
      );
      return;
    }

    setSaving(true);
    try {
      const adjustment = await stockService.createAdjustment({
        warehouseId: warehouse,
        itemId,
        type,
        quantity: qty,
        reason: reason.trim(),
      });

      const persistedAdjustment = await stockService.getAdjustmentById(
        adjustment.id,
      );
      setAdjustments((prev) => [
        mapAdjustmentRecord(persistedAdjustment),
        ...prev,
      ]);
      toast.success(
        `${selectedItem?.name} · ${type === 'INCREASE' ? '+' : '-'}${qty} ${selectedItem?.unit ?? 'units'} → New stock: ${typeof adjustment.meta?.updatedWarehouseQty === 'number' ? adjustment.meta.updatedWarehouseQty : (newStock ?? 0)} ${selectedItem?.unit ?? 'units'}`,
      );

      window.dispatchEvent(
        new CustomEvent(INVENTORY_STOCK_UPDATED_EVENT, {
          detail: {
            source: 'adjustment',
            itemId,
          },
        }),
      );

      await loadStock();
      setMode('list');
      setItemId('');
      setItemSearchQuery('');
      setShowItemDropdown(false);
      setWarehouse(warehouseOptions[0]?.id ?? '');
      setQty(1);
      setReason('');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => setMode('list');

  useShortcuts('stock-adjustment-new', {
    F9: handleSave,
    Escape: handleCancel,
  });

  const fl = (disabled?: boolean) =>
    `w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 ${disabled ? 'bg-[#f8fafc] cursor-not-allowed opacity-60' : ''}`;
  const lb =
    'block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  if (mode === 'new')
    return (
      <AppLayout>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 pb-16 bg-[#f8fafc]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-bold text-[#1e293b]">
                  Stock Adjustment
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Manually correct stock quantities with reason
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !canAdjust}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-3-line" /> Save{' '}
                    <kbd className="text-[10px] bg-white/20 px-1 rounded ml-1">
                      F9
                    </kbd>
                  </>
                )}
              </button>
            </div>

            {!canAdjust && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                <i className="ri-lock-line" /> You do not have the permission to
                adjust the stock.
              </div>
            )}

            <div
              ref={formRef}
              className="bg-white border border-[#e2e8f0] rounded-xl p-5 max-w-xl space-y-4"
            >
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Item */}
              <div>
                <label className={lb}>
                  Item <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedItem ? selectedItem.name : itemSearchQuery}
                    onChange={(e) => {
                      setItemId('');
                      setItemSearchQuery(e.target.value);
                      setShowItemDropdown(true);
                    }}
                    onFocus={() => {
                      if (canAdjust) setShowItemDropdown(true);
                    }}
                    onBlur={() => {
                      setTimeout(() => setShowItemDropdown(false), 120);
                    }}
                    placeholder={
                      loading
                        ? 'Loading stock...'
                        : 'Search item by name/code...'
                    }
                    disabled={!canAdjust}
                    data-nav-index={0}
                    className={fl(!canAdjust)}
                  />

                  {selectedItem && canAdjust && (
                    <button
                      type="button"
                      onClick={() => {
                        setItemId('');
                        setItemSearchQuery('');
                        setShowItemDropdown(true);
                      }}
                      className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <i className="ri-close-line text-lg" />
                    </button>
                  )}

                  {showItemDropdown && canAdjust && (
                    <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#e2e8f0] bg-white shadow-lg max-h-56 overflow-y-auto">
                      {filteredStockItems.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500">
                          No items found
                        </div>
                      ) : (
                        filteredStockItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setItemId(item.id);
                              setItemSearchQuery('');
                              setShowItemDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                          >
                            <div className="text-sm font-medium text-slate-700">
                              {item.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {item.code ? `${item.code} · ` : ''}Stock:{' '}
                              {item.totalStock} {item.unit ?? 'units'}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Current stock indicator */}
              {selectedItem && (
                <div className="flex items-center gap-4 p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0] text-sm">
                  <div className="text-center">
                    <p className="text-xl font-bold text-[#1e293b]">
                      {currentStock}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      {selectedItem.unit ?? 'Units'} · Now
                    </p>
                  </div>
                  <i className="ri-arrow-right-line text-[#94a3b8]" />
                  <div className="text-center">
                    <p
                      className={`text-xl font-bold ${type === 'INCREASE' ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {newStock}
                    </p>
                    <p className="text-xs text-[#64748b]">
                      {selectedItem.unit ?? 'Units'} · After
                    </p>
                  </div>
                  <div
                    className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold border ${type === 'INCREASE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                  >
                    {type === 'INCREASE' ? '+' : '-'}
                    {qty} {selectedItem.unit ?? 'units'}
                  </div>
                </div>
              )}

              {/* Warehouse */}
              <div>
                <label className={lb}>
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  disabled={!canAdjust}
                  data-nav-index={1}
                  className={fl(!canAdjust)}
                >
                  <option value="">
                    {loading ? 'Loading warehouses...' : '— Select Warehouse —'}
                  </option>
                  {warehouseOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className={lb}>
                  Adjustment Type <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  {(['INCREASE', 'DECREASE'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      disabled={!canAdjust}
                      className={`flex-1 h-10 rounded-lg text-sm font-medium border transition-colors cursor-pointer whitespace-nowrap ${type === t ? (t === 'INCREASE' ? 'bg-emerald-50 border-emerald-400 text-emerald-700' : 'bg-red-50 border-red-400 text-red-700') : 'bg-white border-[#e2e8f0] text-slate-500 hover:border-slate-300'} disabled:opacity-60`}
                    >
                      <i
                        className={`${t === 'INCREASE' ? 'ri-arrow-up-line text-emerald-500' : 'ri-arrow-down-line text-red-500'} mr-1.5`}
                      />
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className={lb}>
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={qty}
                  onFocus={(e) => {
                    e.currentTarget.select();
                  }}
                  onClick={(e) => {
                    e.currentTarget.select();
                  }}
                  onChange={(e) => {
                    const nextQty = Number.parseInt(e.target.value, 10);
                    setQty(
                      Number.isFinite(nextQty) && nextQty > 0 ? nextQty : 1,
                    );
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                      e.preventDefault();
                    }
                  }}
                  disabled={!canAdjust}
                  data-nav-index={2}
                  className={`${fl(!canAdjust)} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                />
              </div>

              {/* Reason */}
              <div>
                <label className={lb}>
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  maxLength={500}
                  disabled={!canAdjust}
                  data-nav-index={3}
                  placeholder="Physical count correction, damaged goods, expiry..."
                  className={`w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none ${!canAdjust ? 'bg-[#f8fafc] opacity-60 cursor-not-allowed' : 'bg-white'}`}
                />
              </div>
            </div>
          </div>
          <ShortcutBar
            onSave={handleSave}
            onBack={handleCancel}
            saving={saving}
            hidePrint
          />
        </div>
      </AppLayout>
    );

  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">
              Stock Adjustments
            </h1>
            <p className="text-sm text-slate-500">
              {adjustments.length} adjustments
              {selectedWarehouseId
                ? ` · ${useWarehouseStore.getState().selectedWarehouseId?.name}`
                : ' · All Warehouses'}
            </p>
          </div>
          {canCreateAdjustment && (
            <button
              onClick={() => setMode('new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" /> New Adjustment
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  'Date',
                  'Item',
                  'Warehouse',
                  'Type',
                  'Qty',
                  'Reason',
                  'Created By',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adjustments.map((a, i) => (
                <tr
                  key={a.id}
                  className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}
                >
                  <td className="px-4 py-3 text-slate-600">{a.date}</td>
                  <td className="px-4 py-3 font-medium">{a.item}</td>
                  <td className="px-4 py-3 text-slate-500">{a.warehouse}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border font-medium ${a.type === 'INCREASE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}
                    >
                      {a.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">{a.qty}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                    {a.reason}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{a.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
