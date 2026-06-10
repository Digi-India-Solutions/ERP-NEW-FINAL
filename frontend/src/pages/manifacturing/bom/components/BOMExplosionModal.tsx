import { useState, useMemo } from 'react';
import {
  mockBOMItems,
  mockWarehouseStock,
  type MockBOM,
} from '@/mocks/masters';
import { formatINR } from '@/utils/format';
import { useToast } from '@/contexts/ToastContext';

interface ExplosionItem {
  id: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  itemType: string;
  effectiveQty: number;
  standardCost: number;
  unit: string;
  level: number;
}

interface BOMExplosionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bom: MockBOM;
  customItems?: ExplosionItem[];
}

export default function BOMExplosionModal({
  isOpen,
  onClose,
  bom,
  customItems,
}: BOMExplosionModalProps) {
  const toast = useToast();
  const [productionQty, setProductionQty] = useState(1);

  const bomItems = useMemo(() => {
    if (customItems) return customItems;
    return mockBOMItems.filter((bi) => bi.bomId === bom.id);
  }, [bom.id, customItems]);

  // Leaf items only — exclude SEMI_FINISHED
  const leafItems = useMemo(
    () =>
      bomItems.filter((bi) => bi.level > 0 && bi.itemType !== 'SEMI_FINISHED'),
    [bomItems],
  );

  const stockMap = mockWarehouseStock['wh-001'] || {};

  const rows = useMemo(() => {
    return leafItems.map((item) => {
      const requiredQty = item.effectiveQty * productionQty;
      const stock = stockMap[item.itemId] || 0;
      const diff = stock - requiredQty;
      const isShort = diff < 0;
      const cost = requiredQty * item.standardCost;
      return { ...item, requiredQty, stock, diff, isShort, cost };
    });
  }, [leafItems, productionQty, stockMap]);

  const totalMaterialCost = rows.reduce((s, r) => s + r.cost, 0);
  const shortageCount = rows.filter((r) => r.isShort).length;
  const sufficientCount = rows.length - shortageCount;

  if (!isOpen) return null;

  const title =
    bom.isVariantBOM && bom.variantName
      ? `BOM Explosion — ${bom.variantName}`
      : `BOM Explosion — ${bom.productName}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-[#1e293b]">{title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {bom.code} · v{bom.version}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Production qty */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[#1e293b]">
              Production Quantity:
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={productionQty}
              onChange={(e) =>
                setProductionQty(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-24 h-9 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] text-right"
            />
            <span className="text-xs text-slate-500">units</span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto px-5 py-3">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b">
                  Item
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b">
                  Code
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b">
                  Type
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 border-b">
                  Req. Qty
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b">
                  Unit
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 border-b">
                  Stock
                </th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-slate-500 border-b">
                  Short/Surplus
                </th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-slate-500 border-b">
                  Cost
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-50 hover:bg-slate-50/50"
                >
                  <td className="px-3 py-2.5 text-sm text-[#1e293b]">
                    {row.itemName}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-500">
                    {row.itemCode}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[11px] font-medium border ${typeBadge(row.itemType)}`}
                    >
                      {typeLabel(row.itemType)}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-medium text-[#1e293b]">
                    {row.requiredQty.toFixed(3)}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">
                    {row.unit}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm text-slate-600">
                    {row.stock}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {row.isShort ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                        <i className="ri-close-circle-line" />
                        {row.diff.toFixed(3)} short
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <i className="ri-check-line" />+{row.diff.toFixed(3)}{' '}
                        surplus
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right text-sm font-medium text-[#1e293b]">
                    {formatINR(row.cost)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-sm text-slate-400"
                  >
                    No leaf items found for explosion
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-4 text-sm">
              <span className="text-slate-600">
                Total Raw Material Cost:{' '}
                <strong className="text-[#1e293b]">
                  {formatINR(totalMaterialCost)}
                </strong>
              </span>
              <span className="text-red-600">
                Items with Shortage: <strong>{shortageCount}</strong>
              </span>
              <span className="text-emerald-600">
                Items Sufficient: <strong>{sufficientCount}</strong>
              </span>
            </div>
            <button
              onClick={() => {
                toast.success('Purchase suggestions available in MRP module');
              }}
              className="h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <i className="ri-shopping-cart-line" />
              Generate Purchase Suggestions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function typeBadge(type: string) {
  const map: Record<string, string> = {
    RAW_MATERIAL: 'bg-amber-100 text-amber-700 border-amber-200',
    SEMI_FINISHED: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CONSUMABLE: 'bg-sky-100 text-sky-700 border-sky-200',
    PACKAGING: 'bg-slate-100 text-slate-600 border-slate-200',
    FINISHED_GOOD: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return map[type] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function typeLabel(type: string) {
  const map: Record<string, string> = {
    RAW_MATERIAL: 'Raw',
    SEMI_FINISHED: 'Semi',
    CONSUMABLE: 'Consumable',
    PACKAGING: 'Packaging',
    FINISHED_GOOD: 'Finished',
  };
  return map[type] || type;
}
