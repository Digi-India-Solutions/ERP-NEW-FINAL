import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import {
  mockProductionCosts,
  mockCostElements,
  type MockProductionCost,
} from '@/mocks/costing';
import { mockProductionOrders, mockItems } from '@/mocks/masters';
import CalculateCostModal from './components/CalculateCostModal';
import CostDetailSlideOver from './components/CostDetailSlideOver';
import CostSheetPrintModal from './components/CostSheetPrintModal';

export default function OrderCostingPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'STANDARD' | 'ACTUAL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'FINALIZED'>('ALL');
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [detailCost, setDetailCost] = useState<MockProductionCost | null>(null);
  const [printCost, setPrintCost] = useState<MockProductionCost | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showFinalizePrompt, setShowFinalizePrompt] = useState<MockProductionCost | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const combined = useMemo(() => {
    return mockProductionOrders.map((po) => {
      const cost = mockProductionCosts.find((c) => c.productionOrderId === po.id);
      return { po, cost };
    });
  }, []);

  const filtered = useMemo(() => {
    return combined.filter(({ po, cost }) => {
      if (search) {
        const q = search.toLowerCase();
        const match =
          po.poNumber.toLowerCase().includes(q) ||
          po.productName.toLowerCase().includes(q) ||
          (po.variantName ?? '').toLowerCase().includes(q);
        if (!match) return false;
      }
      if (cost) {
        if (methodFilter !== 'ALL' && cost.costingMethod !== methodFilter) return false;
        if (statusFilter !== 'ALL' && cost.status !== statusFilter) return false;
      }
      return true;
    });
  }, [combined, search, methodFilter, statusFilter]);

  const totals = useMemo(() => {
    const withCost = filtered.filter(({ cost }) => !!cost);
    return {
      count: withCost.length,
      material: withCost.reduce((s, { cost }) => s + (cost?.materialCost ?? 0), 0),
      labour: withCost.reduce((s, { cost }) => s + (cost?.labourCost ?? 0), 0),
      overhead: withCost.reduce((s, { cost }) => s + (cost?.overheadCost ?? 0), 0),
      rejection: withCost.reduce((s, { cost }) => s + (cost?.rejectionCost ?? 0), 0),
      total: withCost.reduce((s, { cost }) => s + (cost?.totalCost ?? 0), 0),
    };
  }, [filtered]);

  const handleSaveCost = (
    cost: MockProductionCost,
    elements: {
      type: 'MATERIAL' | 'LABOUR' | 'OVERHEAD' | 'REJECTION';
      description: string;
      qty: number;
      unit: string;
      rate: number;
      amount: number;
      sourceType: 'BOM' | 'PRODUCTION_ENTRY' | 'WORK_ORDER' | 'MANUAL';
      sourceId: string | null;
    }[]
  ) => {
    mockProductionCosts.push(cost);
    elements.forEach((el, idx) => {
      mockCostElements.push({
        id: `ce-${String(mockCostElements.length + idx + 1).padStart(3, '0')}`,
        productionCostId: cost.id,
        type: el.type,
        description: el.description,
        qty: el.qty,
        unit: el.unit,
        rate: el.rate,
        amount: el.amount,
        sourceType: el.sourceType,
        sourceId: el.sourceId,
      });
    });
    setShowCalcModal(false);
    showToast(`Cost record ${cost.id} saved successfully`);
  };

  const handleFinalize = (cost: MockProductionCost) => {
    cost.status = 'FINALIZED';
    setShowFinalizePrompt(cost);
  };

  const handleConfirmUpdateStandardCost = (update: boolean) => {
    if (update && showFinalizePrompt) {
      const item = mockItems.find((it) => it.id === showFinalizePrompt.productId);
      if (item) {
        item.standardCost = showFinalizePrompt.costPerUnit;
        showToast(`Standard cost updated for ${item.name}: ₹${showFinalizePrompt.costPerUnit.toLocaleString()}`);
      }
    } else {
      showToast(`Cost ${showFinalizePrompt?.id} finalized`);
    }
    setShowFinalizePrompt(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        {/* Finalize Prompt */}
        {showFinalizePrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Update Standard Cost?</h3>
              <p className="text-sm text-gray-600 mb-6">
                Update standard cost on Item Master for <span className="font-medium">{showFinalizePrompt.productName}</span>?
                <br />
                Current standard cost will be replaced with ₹{showFinalizePrompt.costPerUnit.toLocaleString()} per unit.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => handleConfirmUpdateStandardCost(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
                >
                  No, Keep Existing
                </button>
                <button
                  onClick={() => handleConfirmUpdateStandardCost(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer whitespace-nowrap"
                >
                  Yes, Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Production Order Costing</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/manufacturing/costing/setup')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-settings-4-line" />
              Settings
            </button>
            <button
              onClick={() => setShowCalcModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" />
              Calculate Cost
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">POs Costed</div>
            <div className="text-lg font-semibold text-gray-900">{totals.count}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Material</div>
            <div className="text-lg font-semibold text-orange-600">₹{totals.material.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Labour</div>
            <div className="text-lg font-semibold text-blue-600">₹{totals.labour.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Overhead</div>
            <div className="text-lg font-semibold text-violet-600">₹{totals.overhead.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Rejection</div>
            <div className="text-lg font-semibold text-red-600">₹{totals.rejection.toLocaleString()}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total</div>
            <div className="text-lg font-semibold text-gray-900">₹{totals.total.toLocaleString()}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search PO number, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as typeof methodFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer"
          >
            <option value="ALL">All Methods</option>
            <option value="STANDARD">Standard</option>
            <option value="ACTUAL">Actual</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 cursor-pointer"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="FINALIZED">Finalized</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">PO Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Product</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Method</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Material</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Labour</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Overhead</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Rejection</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Total Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Cost/Unit</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Sale Price</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Margin %</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(({ po, cost }) => {
                  const marginColor =
                    !cost ? '' :
                    cost.marginPct > 30 ? 'text-green-600' :
                    cost.marginPct >= 10 ? 'text-amber-600' : 'text-red-600';

                  return (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{po.poNumber}</td>
                      <td className="px-4 py-3 text-gray-700 min-w-[160px]">
                        <div>{po.productName}</div>
                        {po.variantName && (
                          <div className="text-xs text-gray-500">{po.variantName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {po.plannedQty} {po.unit}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cost ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              cost.costingMethod === 'STANDARD'
                                ? 'bg-sky-50 text-sky-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {cost.costingMethod}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {cost ? `₹${cost.materialCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {cost ? `₹${cost.labourCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {cost ? `₹${cost.overheadCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {cost ? `₹${cost.rejectionCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                        {cost ? `₹${cost.totalCost.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {cost ? `₹${cost.costPerUnit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {cost ? `₹${cost.salePrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {cost ? (
                          <span className={`text-xs font-semibold ${marginColor}`}>
                            {cost.marginPct.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {cost ? (
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              cost.status === 'DRAFT'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-green-50 text-green-700'
                            }`}
                          >
                            {cost.status}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Not costed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {!cost && (
                            <button
                              onClick={() => setShowCalcModal(true)}
                              className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap"
                              title="Calculate Cost"
                            >
                              <i className="ri-bar-chart-box-line" />
                            </button>
                          )}
                          {cost && (
                            <button
                              onClick={() => setDetailCost(cost)}
                              className="text-xs text-gray-600 hover:text-gray-900 cursor-pointer whitespace-nowrap"
                              title="View Detail"
                            >
                              <i className="ri-eye-line" />
                            </button>
                          )}
                          {cost?.status === 'DRAFT' && (
                            <button
                              onClick={() => handleFinalize(cost)}
                              className="text-xs text-green-600 hover:text-green-800 cursor-pointer whitespace-nowrap"
                              title="Finalize"
                            >
                              <i className="ri-check-double-line" />
                            </button>
                          )}
                          {cost && (
                            <button
                              onClick={() => setPrintCost(cost)}
                              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer whitespace-nowrap"
                              title="Print Cost Sheet"
                            >
                              <i className="ri-printer-line" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                      No production orders match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCalcModal && (
        <CalculateCostModal
          onClose={() => setShowCalcModal(false)}
          onSave={handleSaveCost}
        />
      )}

      {detailCost && (
        <CostDetailSlideOver
          cost={detailCost}
          onClose={() => setDetailCost(null)}
        />
      )}

      {printCost && (
        <CostSheetPrintModal
          cost={printCost}
          onClose={() => setPrintCost(null)}
        />
      )}
    </AppLayout>
  );
}