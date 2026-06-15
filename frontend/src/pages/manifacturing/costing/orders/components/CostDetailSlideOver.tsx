import { useMemo } from 'react';
import { mockCostElements } from '@/mocks/costing';
import type { MockProductionCost } from '@/mocks/costing';

export default function CostDetailSlideOver({
  cost,
  onClose,
}: {
  cost: MockProductionCost;
  onClose: () => void;
}) {
  const elements = useMemo(() => {
    return mockCostElements.filter((e) => e.productionCostId === cost.id);
  }, [cost.id]);

  const materialElements = elements.filter((e) => e.type === 'MATERIAL');
  const labourElements = elements.filter((e) => e.type === 'LABOUR');
  const overheadElements = elements.filter((e) => e.type === 'OVERHEAD');
  const rejectionElements = elements.filter((e) => e.type === 'REJECTION');

  const formatMoney = (n: number) => `₹${n.toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cost Breakdown</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {cost.productionOrderNumber} — {cost.productName}
              {cost.variantName ? ` (${cost.variantName})` : ''}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Total Cost</div>
              <div className="text-lg font-semibold text-gray-900">{formatMoney(cost.totalCost)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Cost / Unit</div>
              <div className="text-lg font-semibold text-gray-900">{formatMoney(cost.costPerUnit)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Sale Price</div>
              <div className="text-lg font-semibold text-gray-900">{formatMoney(cost.salePrice)}</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-500">Margin %</div>
              <div className={`text-lg font-semibold ${cost.marginPct >= 30 ? 'text-green-600' : cost.marginPct >= 15 ? 'text-amber-600' : 'text-red-600'}`}>
                {cost.marginPct.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Materials */}
          {materialElements.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                Materials
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Item</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Rate</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {materialElements.map((el) => (
                      <tr key={el.id}>
                        <td className="px-3 py-2 text-gray-700">{el.description}</td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {el.qty} {el.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">₹{el.rate}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          ₹{el.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-3 py-2 text-gray-900" colSpan={3}>Total Materials</td>
                      <td className="px-3 py-2 text-right text-gray-900">
                        ₹{materialElements.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Labour */}
          {labourElements.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Labour
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Description</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Time</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Rate</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {labourElements.map((el) => (
                      <tr key={el.id}>
                        <td className="px-3 py-2 text-gray-700">{el.description}</td>
                        <td className="px-3 py-2 text-right text-gray-700">
                          {el.qty} {el.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">₹{el.rate}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          ₹{el.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-3 py-2 text-gray-900" colSpan={3}>Total Labour</td>
                      <td className="px-3 py-2 text-right text-gray-900">
                        ₹{labourElements.reduce((s, e) => s + e.amount, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Overhead */}
          {overheadElements.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-500" />
                Overhead
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {overheadElements.map((el) => (
                      <tr key={el.id}>
                        <td className="px-3 py-2 text-gray-700">{el.description}</td>
                        <td className="px-3 py-2 text-right text-gray-500">
                          {el.qty} {el.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">₹{el.rate}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          ₹{el.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Rejection */}
          {rejectionElements.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Rejection
              </h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    {rejectionElements.map((el) => (
                      <tr key={el.id}>
                        <td className="px-3 py-2 text-gray-700">{el.description}</td>
                        <td className="px-3 py-2 text-right text-gray-500">
                          {el.qty} {el.unit}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-500">₹{el.rate}</td>
                        <td className="px-3 py-2 text-right font-medium text-gray-900">
                          ₹{el.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Grand Total */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Grand Total</span>
              <span className="text-lg font-bold text-gray-900">{formatMoney(cost.totalCost)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">Cost per unit ({cost.producedQty} {cost.unit})</span>
              <span className="text-sm font-medium text-gray-700">{formatMoney(cost.costPerUnit)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}