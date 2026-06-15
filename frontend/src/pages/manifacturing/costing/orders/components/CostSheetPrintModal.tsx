import { mockCostElements } from '@/mocks/costing';
import { mockCompany } from '@/mocks/masters';
import type { MockProductionCost } from '@/mocks/costing';

export default function CostSheetPrintModal({
  cost,
  onClose,
}: {
  cost: MockProductionCost;
  onClose: () => void;
}) {
  const elements = mockCostElements.filter((e) => e.productionCostId === cost.id);
  const materials = elements.filter((e) => e.type === 'MATERIAL');
  const labour = elements.filter((e) => e.type === 'LABOUR');
  const overhead = elements.filter((e) => e.type === 'OVERHEAD');
  const rejection = elements.filter((e) => e.type === 'REJECTION');

  const dateStr = new Date(cost.calculatedAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Cost Sheet Preview</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Printable Area */}
        <div id="cost-sheet-print-area" className="p-8">
          {/* Company Header */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-gray-900">MANUFACTURING COST SHEET</h1>
            <div className="text-sm text-gray-700 mt-1">{mockCompany.name}</div>
            <div className="text-xs text-gray-500">{mockCompany.address}</div>
          </div>

          <div className="border-t border-b border-gray-300 py-3 mb-6">
            <div className="grid grid-cols-2 gap-y-1 text-sm">
              <div><span className="text-gray-500">Production Order:</span> <span className="font-medium text-gray-900">{cost.productionOrderNumber}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-900">{dateStr}</span></div>
              <div><span className="text-gray-500">Product:</span> <span className="font-medium text-gray-900">{cost.productName}</span></div>
              <div><span className="text-gray-500">Method:</span> <span className="font-medium text-gray-900">{cost.costingMethod}</span></div>
              {cost.variantName && (
                <div><span className="text-gray-500">Variant:</span> <span className="font-medium text-gray-900">{cost.variantName}</span></div>
              )}
              <div><span className="text-gray-500">Produced Qty:</span> <span className="font-medium text-gray-900">{cost.producedQty} {cost.unit}</span></div>
            </div>
          </div>

          {/* Material Costs */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
              Material Costs
            </h3>
            {materials.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No material cost recorded</p>
            ) : (
              <div className="space-y-1">
                {materials.map((m) => (
                  <div key={m.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{m.description}</span>
                    <span className="text-gray-900 font-medium">
                      {m.qty} {m.unit} × ₹{m.rate.toLocaleString()} = ₹{m.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1 mt-2">
                  <span className="text-gray-900">Total Materials</span>
                  <span className="text-gray-900">₹{cost.materialCost.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Labour Costs */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
              Labour Costs
            </h3>
            {labour.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No labour cost recorded</p>
            ) : (
              <div className="space-y-1">
                {labour.map((l) => (
                  <div key={l.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{l.description}</span>
                    <span className="text-gray-900 font-medium">
                      {l.qty} {l.unit} × ₹{l.rate}/min = ₹{l.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1 mt-2">
                  <span className="text-gray-900">Total Labour</span>
                  <span className="text-gray-900">₹{cost.labourCost.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Overhead */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
              Overhead
            </h3>
            {overhead.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No overhead cost recorded</p>
            ) : (
              <div className="space-y-1">
                {overhead.map((o) => (
                  <div key={o.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{o.description}</span>
                    <span className="text-gray-900 font-medium">₹{o.amount.toLocaleString()}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1 mt-2">
                  <span className="text-gray-900">Total Overhead</span>
                  <span className="text-gray-900">₹{cost.overheadCost.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Rejection */}
          {cost.rejectionCost > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide border-b border-gray-300 pb-1 mb-3">
                Rejection Cost
              </h3>
              {rejection.map((r) => (
                <div key={r.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">{r.description}</span>
                  <span className="text-gray-900 font-medium">
                    {r.qty} {r.unit} × ₹{r.rate.toLocaleString()} = ₹{r.amount.toLocaleString()}
                  </span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold border-t border-gray-200 pt-1 mt-2">
                <span className="text-gray-900">Total Rejection</span>
                <span className="text-gray-900">₹{cost.rejectionCost.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div className="border-t-2 border-gray-900 pt-4 mt-6 space-y-2">
            <div className="flex justify-between text-base font-bold text-gray-900">
              <span>TOTAL COST</span>
              <span>₹{cost.totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Cost Per Unit</span>
              <span className="font-medium">₹{cost.costPerUnit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-700">
              <span>Sale Price</span>
              <span className="font-medium">₹{cost.salePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>Gross Margin</span>
              <span className="font-medium">
                ₹{cost.margin.toLocaleString()} ({cost.marginPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-gray-300 text-xs text-gray-500 flex justify-between">
            <span>Prepared by: Admin User</span>
            <span>Date: {dateStr}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-printer-line mr-1.5" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}