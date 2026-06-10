import { useMemo } from 'react';
import { mockBOMItems, type MockBOM, mockItems } from '@/mocks/masters';
import { formatINR } from '@/utils/format';

interface PrintItem {
  id: string;
  parentId: string | null;
  itemName: string;
  itemCode: string;
  qtyPerUnit: number;
  unit: string;
  scrapPct: number;
  level: number;
  itemType: string;
}

interface BOMPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  bom: MockBOM;
  customItems?: PrintItem[];
}

export default function BOMPrintModal({
  isOpen,
  onClose,
  bom,
  customItems,
}: BOMPrintModalProps) {
  const bomItems = useMemo(() => {
    if (customItems) return customItems;
    return mockBOMItems
      .filter((bi) => bi.bomId === bom.id)
      .sort((a, b) => {
        if (a.level !== b.level) return a.level - b.level;
        return 0;
      });
  }, [bom.id, customItems]);

  // Build parent→children map for tree display
  const childrenMap = useMemo(() => {
    const map = new Map<string, typeof bomItems>();
    bomItems.forEach((item) => {
      if (item.parentId) {
        if (!map.has(item.parentId)) map.set(item.parentId, []);
        map.get(item.parentId)!.push(item);
      }
    });
    return map;
  }, [bomItems]);

  const roots = bomItems.filter((bi) => bi.parentId === null);

  const variantItem = bom.isVariantBOM
    ? mockItems.find((m) => m.id === bom.productId)
    : null;

  const variantTags = useMemo(() => {
    if (!variantItem?.variantAttributes) return [];
    return Object.entries(variantItem.variantAttributes).map(
      ([k, v]) => `${k}: ${v}`,
    );
  }, [variantItem]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 print:hidden">
          <h2 className="text-lg font-bold text-[#1e293b]">Print BOM</h2>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-[#4338ca] cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <i className="ri-printer-line" />
              Print
            </button>
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
            >
              Close
            </button>
          </div>
        </div>

        {/* Print preview */}
        <div className="flex-1 overflow-auto p-8" id="bom-print-content">
          <div className="max-w-2xl mx-auto">
            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-xl font-bold text-[#1e293b] uppercase tracking-wider">
                Bill of Materials
              </h1>
              <div className="w-16 h-0.5 bg-[#1e293b] mx-auto mt-2" />
            </div>

            {/* BOM Header Info */}
            <div className="mb-6 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-[#1e293b]">
                  {bom.productName}
                </span>
              </div>
              {bom.isVariantBOM && bom.variantName && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Variant:</span>
                    <span className="font-semibold text-[#1e293b]">
                      {bom.variantName}
                    </span>
                  </div>
                  {variantTags.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Attributes:</span>
                      <span className="font-medium text-[#1e293b]">
                        {variantTags.join(' · ')}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">BOM Code:</span>
                <span className="font-medium text-[#1e293b]">{bom.code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Version:</span>
                <span className="font-medium text-[#1e293b]">
                  v{bom.version}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-medium text-[#1e293b]">{bom.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Effective From:</span>
                <span className="font-medium text-[#1e293b]">
                  {bom.effectiveFrom || '—'}
                </span>
              </div>
              {bom.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Notes:</span>
                  <span className="font-medium text-[#1e293b] max-w-xs text-right">
                    {bom.notes}
                  </span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t-2 border-[#1e293b] mb-4" />

            {/* Tree Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-[#1e293b]">
                  <th className="py-2 text-left font-semibold w-10">#</th>
                  <th className="py-2 text-left font-semibold">Item Name</th>
                  <th className="py-2 text-right font-semibold w-20">Qty</th>
                  <th className="py-2 text-left font-semibold w-16">Unit</th>
                  <th className="py-2 text-right font-semibold w-20">Scrap</th>
                </tr>
              </thead>
              <tbody>
                {roots.map((root, idx) => (
                  <PrintTreeRow
                    key={root.id}
                    item={root}
                    index={idx + 1}
                    level={0}
                    childrenMap={childrenMap}
                  />
                ))}
              </tbody>
            </table>

            {/* Footer */}
            <div className="border-t-2 border-[#1e293b] mt-4 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">
                  Total Material Cost
                </span>
                <span className="text-lg font-bold text-[#1e293b]">
                  {formatINR(bom.totalMaterialCost)}
                </span>
              </div>
            </div>

            {/* Print footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-400 text-center">
              <p>Generated from InvenPro Solutions Pvt. Ltd.</p>
              <p>
                {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PrintTreeRow({
  item,
  index,
  level,
  childrenMap,
}: {
  item: PrintItem;
  index: number;
  level: number;
  childrenMap: Map<string, PrintItem[]>;
}) {
  const children = childrenMap.get(item.id) || [];
  const indent = level * 24;
  const prefix = level > 0 ? '└ ' : '';

  return (
    <>
      <tr className="border-b border-slate-100">
        <td className="py-2 text-slate-500">{level === 0 ? index : ''}</td>
        <td className="py-2" style={{ paddingLeft: indent }}>
          <span
            className={
              level === 0 ? 'font-semibold text-[#1e293b]' : 'text-[#1e293b]'
            }
          >
            {prefix}
            {item.itemName}
          </span>
        </td>
        <td className="py-2 text-right font-medium">{item.qtyPerUnit}</td>
        <td className="py-2 text-slate-600">{item.unit}</td>
        <td className="py-2 text-right text-slate-500">
          {item.scrapPct > 0 ? `${item.scrapPct}%` : '—'}
        </td>
      </tr>
      {children.map((child, cidx) => (
        <PrintTreeRow
          key={child.id}
          item={child}
          index={cidx + 1}
          level={level + 1}
          childrenMap={childrenMap}
        />
      ))}
    </>
  );
}
