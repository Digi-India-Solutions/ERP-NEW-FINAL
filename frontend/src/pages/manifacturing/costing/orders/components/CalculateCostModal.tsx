import { useState, useMemo } from 'react';
import {
  mockCostingSettings,
  mockProductionCosts,
  type MockProductionCost,
} from '@/mocks/costing';
import {
  mockProductionOrders,
  mockWorkOrders,
  mockOperators,
  mockBOMItems,
  mockItems,
  type MockProductionOrder,
} from '@/mocks/masters';

interface CalcPreview {
  materialCost: number;
  labourCost: number;
  overheadCost: number;
  rejectionCost: number;
  totalCost: number;
  costPerUnit: number;
  salePrice: number;
  margin: number;
  marginPct: number;
}

interface CostAlert {
  type: 'danger' | 'warning' | 'info';
  message: string;
}

export default function CalculateCostModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (cost: MockProductionCost, elements: {
    type: 'MATERIAL' | 'LABOUR' | 'OVERHEAD' | 'REJECTION';
    description: string;
    qty: number;
    unit: string;
    rate: number;
    amount: number;
    sourceType: 'BOM' | 'PRODUCTION_ENTRY' | 'WORK_ORDER' | 'MANUAL';
    sourceId: string | null;
  }[]) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPO, setSelectedPO] = useState<MockProductionOrder | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'STANDARD' | 'ACTUAL'>('STANDARD');
  const [preview, setPreview] = useState<CalcPreview | null>(null);
  const [elements, setElements] = useState<{
    type: 'MATERIAL' | 'LABOUR' | 'OVERHEAD' | 'REJECTION';
    description: string;
    qty: number;
    unit: string;
    rate: number;
    amount: number;
    sourceType: 'BOM' | 'PRODUCTION_ENTRY' | 'WORK_ORDER' | 'MANUAL';
    sourceId: string | null;
  }[]>([]);

  const eligiblePOs = useMemo(() => {
    const costedIds = new Set(mockProductionCosts.map((c) => c.productionOrderId));
    return mockProductionOrders.filter(
      (po) =>
        !costedIds.has(po.id) &&
        po.status !== 'CANCELLED' &&
        po.status !== 'DRAFT'
    );
  }, []);

  const allowedMethods = useMemo(() => {
    const cm = mockCostingSettings.costingMethod;
    if (cm === 'STANDARD') return ['STANDARD'] as const;
    if (cm === 'ACTUAL') return ['ACTUAL'] as const;
    return ['STANDARD', 'ACTUAL'] as const;
  }, []);

  const costAlerts = useMemo<CostAlert[]>(() => {
    if (!preview || !selectedPO) return [];
    const alerts: CostAlert[] = [];

    // Low margin
    if (preview.marginPct < 10) {
      alerts.push({
        type: 'danger',
        message: `⚠️ Low margin! Cost ₹${Math.round(preview.costPerUnit).toLocaleString()} vs Sale Price ₹${preview.salePrice.toLocaleString()}. Consider price review.`,
      });
    }

    // Actual > Standard by > 15%
    if (selectedMethod === 'ACTUAL') {
      const stdCost = mockProductionCosts.find(
        (c) => c.productionOrderId === selectedPO.id && c.costingMethod === 'STANDARD'
      );
      if (stdCost && preview.totalCost > stdCost.totalCost * 1.15) {
        const pct = (((preview.totalCost - stdCost.totalCost) / stdCost.totalCost) * 100).toFixed(1);
        alerts.push({
          type: 'warning',
          message: `📈 Actual cost exceeds standard by ${pct}%. Review material usage or labour time.`,
        });
      }
    }

    // No sale price
    if (preview.salePrice === 0) {
      alerts.push({
        type: 'info',
        message: 'ℹ️ No sale price found for this product. Set price in Item Master.',
      });
    }

    return alerts;
  }, [preview, selectedPO, selectedMethod]);

  const handleCalculate = () => {
    if (!selectedPO) return;

    const producedQty = selectedPO.completedQty || selectedPO.plannedQty;
    const productItem = mockItems.find((it) => it.id === selectedPO.productId);
    const salePrice = productItem?.saleRate ?? 0;

    // Material cost from BOM
    const bomItems = mockBOMItems.filter(
      (bi) => bi.bomId === selectedPO.bomId && bi.level > 0
    );
    let materialCost = 0;
    const calcElements: typeof elements = [];

    bomItems.forEach((bi) => {
      const item = mockItems.find((it) => it.id === bi.itemId);
      const rate = item?.purchaseRate ?? item?.standardCost ?? 0;
      const qty = bi.effectiveQty * producedQty;
      const amount = qty * rate;
      materialCost += amount;
      calcElements.push({
        type: 'MATERIAL',
        description: bi.itemName,
        qty: Math.round(qty * 100) / 100,
        unit: bi.unit,
        rate: Math.round(rate * 100) / 100,
        amount: Math.round(amount * 100) / 100,
        sourceType: 'BOM',
        sourceId: bi.bomId,
      });
    });

    // Labour cost from work orders
    const wos = mockWorkOrders.filter((wo) => wo.productionOrderId === selectedPO.id);
    let labourCost = 0;

    wos.forEach((wo) => {
      const timeHrs = (wo.actualTimeMinutes || wo.plannedTimeMinutes) / 60;

      if (
        mockCostingSettings.labourBasis === 'OPERATOR' ||
        mockCostingSettings.labourBasis === 'BOTH'
      ) {
        const op = wo.operatorId ? mockOperators.find((o) => o.id === wo.operatorId) : null;
        if (op) {
          const opRate = op.wageRatePerHour;
          const opAmt = timeHrs * opRate;
          labourCost += opAmt;
          calcElements.push({
            type: 'LABOUR',
            description: `${op.name} — ${op.skill}`,
            qty: Math.round(timeHrs * 100) / 100,
            unit: 'Hr',
            rate: opRate,
            amount: Math.round(opAmt * 100) / 100,
            sourceType: 'WORK_ORDER',
            sourceId: wo.id,
          });
        }
      }

      if (
        mockCostingSettings.labourBasis === 'WORK_CENTER' ||
        mockCostingSettings.labourBasis === 'BOTH'
      ) {
        const wcRate = 200; // simplified work center rate
        const wcAmt = timeHrs * wcRate;
        labourCost += wcAmt;
        calcElements.push({
          type: 'LABOUR',
          description: `${wo.workCenterName} — Rate`,
          qty: Math.round(timeHrs * 100) / 100,
          unit: 'Hr',
          rate: wcRate,
          amount: Math.round(wcAmt * 100) / 100,
          sourceType: 'WORK_ORDER',
          sourceId: wo.id,
        });
      }
    });

    // Overhead
    let overheadCost = 0;
    if (mockCostingSettings.overheadMethod === 'PERCENTAGE') {
      overheadCost =
        (materialCost + labourCost) * (mockCostingSettings.overheadPercentage / 100);
    } else if (mockCostingSettings.overheadMethod === 'COST_CENTER') {
      const totalHrs = wos.reduce((s, wo) => s + (wo.actualTimeMinutes || wo.plannedTimeMinutes) / 60, 0);
      overheadCost = totalHrs * 250;
    } else {
      const totalHrs = wos.reduce((s, wo) => s + (wo.actualTimeMinutes || wo.plannedTimeMinutes) / 60, 0);
      overheadCost = totalHrs * 500;
    }

    calcElements.push({
      type: 'OVERHEAD',
      description: `Overhead (${mockCostingSettings.overheadMethod})`,
      qty: 1,
      unit: 'Lot',
      rate: Math.round(overheadCost * 100) / 100,
      amount: Math.round(overheadCost * 100) / 100,
      sourceType: 'MANUAL',
      sourceId: null,
    });

    // Rejection cost
    let rejectionCost = 0;
    if (mockCostingSettings.includeRejectionCost && selectedPO.rejectedQty > 0 && producedQty > 0) {
      const costPerGoodUnit = (materialCost + labourCost + overheadCost) / producedQty;
      rejectionCost = selectedPO.rejectedQty * costPerGoodUnit;
      calcElements.push({
        type: 'REJECTION',
        description: 'Rejected units cost',
        qty: selectedPO.rejectedQty,
        unit: selectedPO.unit,
        rate: Math.round(costPerGoodUnit * 100) / 100,
        amount: Math.round(rejectionCost * 100) / 100,
        sourceType: 'PRODUCTION_ENTRY',
        sourceId: null,
      });
    }

    const totalCost = materialCost + labourCost + overheadCost + rejectionCost;
    const costPerUnit = producedQty > 0 ? totalCost / producedQty : 0;
    const margin = salePrice * producedQty - totalCost;
    const marginPct = salePrice * producedQty > 0 ? (margin / (salePrice * producedQty)) * 100 : 0;

    setPreview({
      materialCost: Math.round(materialCost * 100) / 100,
      labourCost: Math.round(labourCost * 100) / 100,
      overheadCost: Math.round(overheadCost * 100) / 100,
      rejectionCost: Math.round(rejectionCost * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerUnit: Math.round(costPerUnit * 100) / 100,
      salePrice,
      margin: Math.round(margin * 100) / 100,
      marginPct: Math.round(marginPct * 100) / 100,
    });
    setElements(calcElements);
    setStep(3);
  };

  const handleSave = () => {
    if (!selectedPO || !preview) return;
    const nextId = `pc-${String(mockProductionCosts.length + 1).padStart(3, '0')}`;
    const cost: MockProductionCost = {
      id: nextId,
      productionOrderId: selectedPO.id,
      productionOrderNumber: selectedPO.poNumber,
      productId: selectedPO.productId,
      productName: selectedPO.productName,
      variantName: selectedPO.variantName,
      producedQty: selectedPO.completedQty || selectedPO.plannedQty,
      unit: selectedPO.unit,
      costingMethod: selectedMethod,
      materialCost: preview.materialCost,
      labourCost: preview.labourCost,
      overheadCost: preview.overheadCost,
      rejectionCost: preview.rejectionCost,
      totalCost: preview.totalCost,
      costPerUnit: preview.costPerUnit,
      salePrice: preview.salePrice,
      margin: preview.margin,
      marginPct: preview.marginPct,
      status: 'DRAFT',
      calculatedAt: new Date().toISOString(),
    };
    onSave(cost, elements);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Calculate Production Cost</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${step === 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>Step 1</div>
              <div className="text-gray-300">→</div>
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${step === 2 ? 'bg-gray-900 text-white' : step > 2 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>Step 2</div>
              <div className="text-gray-300">→</div>
              <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${step === 3 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>Preview</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Step 1 — Select PO */}
        {step === 1 && (
          <div className="p-6 space-y-4">
            <label className="block text-sm font-medium text-gray-700">Select Production Order</label>
            {eligiblePOs.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">
                No eligible production orders available. All active orders already have cost records.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {eligiblePOs.map((po) => {
                  const active = selectedPO?.id === po.id;
                  return (
                    <button
                      key={po.id}
                      onClick={() => setSelectedPO(po)}
                      className={`w-full text-left p-3 rounded-lg border cursor-pointer transition-all ${
                        active ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-700'}`}>
                          {po.poNumber} — {po.productName}
                          {po.variantName ? ` (${po.variantName})` : ''}
                        </span>
                        <span className="text-xs text-gray-500">
                          {po.completedQty || po.plannedQty} {po.unit}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Status: {po.status} | BOM: {po.bomId}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedPO}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                Next: Select Method →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Select Method */}
        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
              <span className="font-medium">Selected PO:</span> {selectedPO?.poNumber} — {selectedPO?.productName}
              {selectedPO?.variantName ? ` (${selectedPO.variantName})` : ''}
            </div>

            <label className="block text-sm font-medium text-gray-700">Select Costing Method</label>
            <p className="text-xs text-gray-500">
              System setting: {mockCostingSettings.costingMethod}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allowedMethods.map((m) => {
                const active = selectedMethod === m;
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedMethod(m)}
                    className={`text-left p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      active ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`text-sm font-semibold ${active ? 'text-gray-900' : 'text-gray-700'}`}>
                      {m === 'STANDARD' ? 'Standard Cost' : 'Actual Cost'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {m === 'STANDARD'
                        ? 'Uses BOM rates and planned times for cost estimation'
                        : 'Tracks actual material consumed and time spent'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
              >
                ← Back
              </button>
              <button
                onClick={handleCalculate}
                className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 cursor-pointer whitespace-nowrap"
              >
                Calculate Cost →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Preview */}
        {step === 3 && preview && selectedPO && (
          <div className="p-6 space-y-5">
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700">
              <span className="font-medium">{selectedPO.poNumber}</span> — {selectedPO.productName}
              {selectedPO.variantName ? ` (${selectedPO.variantName})` : ''} — {selectedMethod} Cost
            </div>

            {/* Cost Alerts */}
            {costAlerts.length > 0 && (
              <div className="space-y-2">
                {costAlerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg text-sm ${
                      alert.type === 'danger'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : alert.type === 'warning'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }`}
                  >
                    {alert.message}
                  </div>
                ))}
              </div>
            )}

            {/* Cost Breakdown Table */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Category</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Amount</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">Per Unit</th>
                      <th className="text-right px-4 py-2 text-xs font-medium text-gray-500">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr>
                      <td className="px-4 py-2 text-gray-700">Material</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        ₹{preview.materialCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        ₹{preview.costPerUnit > 0 ? Math.round((preview.materialCost / (selectedPO.completedQty || selectedPO.plannedQty)) * 100) / 100 : 0}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">
                        {preview.totalCost > 0 ? ((preview.materialCost / preview.totalCost) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">Labour</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        ₹{preview.labourCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        ₹{preview.costPerUnit > 0 ? Math.round((preview.labourCost / (selectedPO.completedQty || selectedPO.plannedQty)) * 100) / 100 : 0}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">
                        {preview.totalCost > 0 ? ((preview.labourCost / preview.totalCost) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-gray-700">Overhead</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">
                        ₹{preview.overheadCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        ₹{preview.costPerUnit > 0 ? Math.round((preview.overheadCost / (selectedPO.completedQty || selectedPO.plannedQty)) * 100) / 100 : 0}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500">
                        {preview.totalCost > 0 ? ((preview.overheadCost / preview.totalCost) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                    {preview.rejectionCost > 0 && (
                      <tr>
                        <td className="px-4 py-2 text-gray-700">Rejection</td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          ₹{preview.rejectionCost.toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-700">
                          ₹{preview.costPerUnit > 0 ? Math.round((preview.rejectionCost / (selectedPO.completedQty || selectedPO.plannedQty)) * 100) / 100 : 0}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-500">
                          {preview.totalCost > 0 ? ((preview.rejectionCost / preview.totalCost) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    )}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-4 py-2 text-gray-900">TOTAL</td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        ₹{preview.totalCost.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        ₹{preview.costPerUnit.toLocaleString()}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Profitability */}
            <div className="bg-green-50 border border-green-100 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-green-800 mb-2">Profitability</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-xs text-green-600">Sale Price / Unit</div>
                  <div className="font-medium text-green-900">₹{preview.salePrice.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-green-600">Cost / Unit</div>
                  <div className="font-medium text-green-900">₹{preview.costPerUnit.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-green-600">Gross Margin</div>
                  <div className="font-medium text-green-900">
                    ₹{preview.margin.toLocaleString()} ({preview.marginPct.toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                onClick={() => setStep(2)}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
              >
                ← Recalculate
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 cursor-pointer whitespace-nowrap"
                >
                  <i className="ri-save-line mr-1" />
                  Save Cost Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}