import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import {
  mockItems,
  mockBOMs,
  mockProductionOrders,
  mockWarehouseStock,
  type MockItem,
} from '@/mocks/masters';

interface SuggestedItem {
  item: MockItem;
  currentStock: number;
  reorderPoint: number;
  suggestQty: number;
  bomId: string | null;
  checked: boolean;
}

interface MTSSuggestModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function generatePONumber(): string {
  const year = new Date().getFullYear();
  const existing = mockProductionOrders.filter((po) =>
    po.poNumber.startsWith(`PRD-${year}-`),
  );
  const maxSeq = existing.reduce((max, po) => {
    const parts = po.poNumber.split('-');
    const seq = parseInt(parts[parts.length - 1], 10);
    return Math.max(max, isNaN(seq) ? 0 : seq);
  }, 0);
  return `PRD-${year}-${String(maxSeq + 1).padStart(3, '0')}`;
}

export default function MTSSuggestModal({
  onClose,
  onCreated,
}: MTSSuggestModalProps) {
  const toast = useToast();
  const navigate = useNavigate();

  const suggestions = useMemo<SuggestedItem[]>(() => {
    const eligible = mockItems.filter(
      (m) => m.itemType === 'FINISHED_GOOD' && m.isActive,
    );
    const whStock = mockWarehouseStock['wh-001'] || {};
    const result: SuggestedItem[] = [];

    eligible.forEach((item) => {
      const currentStock = whStock[item.id] || 0;
      if (currentStock <= item.reorderPoint) {
        const bomId =
          item.bomId ||
          mockBOMs.find(
            (b) => b.productId === item.id && b.status !== 'OBSOLETE',
          )?.id ||
          null;
        result.push({
          item,
          currentStock,
          reorderPoint: item.reorderPoint,
          suggestQty: item.reorderQty,
          bomId,
          checked: true,
        });
      }
    });

    return result;
  }, []);

  const [items, setItems] = useState<SuggestedItem[]>(suggestions);
  const [creating, setCreating] = useState(false);

  const toggleCheck = useCallback((itemId: string) => {
    setItems((prev) =>
      prev.map((si) =>
        si.item.id === itemId ? { ...si, checked: !si.checked } : si,
      ),
    );
  }, []);

  const toggleAll = useCallback(() => {
    const allChecked = items.every((si) => si.checked);
    setItems((prev) => prev.map((si) => ({ ...si, checked: !allChecked })));
  }, [items]);

  const updateQty = useCallback((itemId: string, qty: number) => {
    setItems((prev) =>
      prev.map((si) =>
        si.item.id === itemId ? { ...si, suggestQty: Math.max(1, qty) } : si,
      ),
    );
  }, []);

  const checkedItems = items.filter((si) => si.checked && si.bomId);

  const handleCreate = useCallback(() => {
    if (checkedItems.length === 0) {
      toast.error('Please select at least one item with an active BOM');
      return;
    }

    setCreating(true);
    let seq = 0;
    const baseSeq = mockProductionOrders
      .filter((po) =>
        po.poNumber.startsWith(`PRD-${new Date().getFullYear()}-`),
      )
      .reduce((max, po) => {
        const parts = po.poNumber.split('-');
        const s = parseInt(parts[parts.length - 1], 10);
        return Math.max(max, isNaN(s) ? 0 : s);
      }, 0);

    checkedItems.forEach((si, i) => {
      const leadDays = si.item.leadTimeDays || 7;
      const poNumber = `PRD-${new Date().getFullYear()}-${String(baseSeq + i + 1).padStart(3, '0')}`;
      const newPO = {
        id: `prod-mts-${Date.now()}-${i}`,
        poNumber,
        type: 'MTS' as const,
        status: 'DRAFT' as const,
        priority: 'NORMAL' as const,
        productId: si.item.id,
        productName: si.item.name,
        productCode: si.item.code,
        isVariant: si.item.isVariant,
        variantName: si.item.isVariant
          ? si.item.variantName || si.item.name
          : null,
        bomId: si.bomId!,
        bomVersion: mockBOMs.find((b) => b.id === si.bomId)?.version || '1.0',
        plannedQty: si.suggestQty,
        completedQty: 0,
        rejectedQty: 0,
        unit: si.item.unitName || 'Pcs',
        plannedStartDate: new Date().toISOString().split('T')[0],
        plannedEndDate: new Date(Date.now() + leadDays * 86400000)
          .toISOString()
          .split('T')[0],
        actualStartDate: null,
        actualEndDate: null,
        salesOrderRef: null,
        salesOrderId: null,
        warehouseId: 'wh-005',
        warehouseName: 'Manufacturing Plant',
        routingId: null,
        notes: `Auto-suggested: stock ${si.currentStock} <= reorder ${si.reorderPoint}`,
        createdBy: 'Admin User',
        createdAt: new Date().toISOString(),
      };
      mockProductionOrders.push(newPO);
      seq++;
    });

    setCreating(false);
    toast.success(`${seq} MTS Production Orders created`);
    onCreated();
    onClose();
  }, [checkedItems, toast, onCreated, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-[780px] max-w-[95vw] max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              MTS Production Suggestions
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Items below reorder point that need replenishment
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-3">
                <i className="ri-check-double-line text-xl text-emerald-500" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                All stock levels are healthy
              </p>
              <p className="text-xs text-gray-500 mt-1">
                No finished goods are below their reorder point
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={items.every((si) => si.checked)}
                    onChange={toggleAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#4f46e5] focus:ring-indigo-500"
                  />
                  <span className="text-xs font-medium">
                    Select all ({items.filter((si) => si.checked).length}/
                    {items.length})
                  </span>
                </label>
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                  {items.filter((si) => !si.bomId).length} item(s) lack BOM —
                  will be skipped
                </span>
              </div>

              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 w-10"></th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                      Item
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                      Variant
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">
                      Current Stock
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">
                      Reorder Point
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-500">
                      Suggested Qty
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((si) => (
                    <tr
                      key={si.item.id}
                      className={`border-b border-slate-50 ${!si.bomId ? 'opacity-50' : 'hover:bg-slate-50/50'}`}
                    >
                      <td className="px-3 py-2.5">
                        <input
                          type="checkbox"
                          checked={si.checked}
                          onChange={() => toggleCheck(si.item.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#4f46e5] focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="text-sm font-medium text-gray-800">
                          {si.item.name}
                        </div>
                        <div className="text-[11px] text-gray-400">
                          {si.item.code}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {si.item.isVariant && si.item.variantName ? (
                          <span className="text-xs text-gray-600">
                            {si.item.variantName}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm text-rose-600 font-medium">
                        {si.currentStock}
                      </td>
                      <td className="px-3 py-2.5 text-right text-sm text-gray-600">
                        {si.reorderPoint}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <input
                          type="number"
                          min={1}
                          value={si.suggestQty}
                          onChange={(e) =>
                            updateQty(
                              si.item.id,
                              parseInt(e.target.value, 10) || 1,
                            )
                          }
                          className="w-20 text-right text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-left text-sm text-gray-600">
                        {si.item.unitName || 'Pcs'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
          >
            Cancel
          </button>
          {items.length > 0 && (
            <button
              onClick={handleCreate}
              disabled={creating || checkedItems.length === 0}
              className="px-4 py-2 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              {creating ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <i className="ri-add-line" />
                  Create Selected Orders ({checkedItems.length})
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
