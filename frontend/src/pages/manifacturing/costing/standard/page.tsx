import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { mockProductionCosts, mockCostElements } from '@/mocks/costing';
import type { MockProductionCost, MockCostElement } from '@/mocks/costing';

function formatCurrency(value: number): string {
  return `₹${value.toLocaleString()}`;
}

function formatDec(value: number, decimals = 1): string {
  return value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function pctOf(value: number, total: number): string {
  if (total === 0) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
}

function getTypeBadge(type: string) {
  switch (type) {
    case 'MATERIAL':
      return 'bg-blue-100 text-blue-700';
    case 'LABOUR':
      return 'bg-emerald-100 text-emerald-700';
    case 'OVERHEAD':
      return 'bg-purple-100 text-purple-700';
    case 'REJECTION':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function getMarginGrade(marginPct: number): { grade: string; label: string; colorClass: string; bgClass: string } {
  if (marginPct >= 70) {
    return { grade: 'A', label: 'Excellent', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50' };
  }
  if (marginPct >= 40) {
    return { grade: 'B', label: 'Good', colorClass: 'text-blue-700', bgClass: 'bg-blue-50' };
  }
  if (marginPct >= 10) {
    return { grade: 'C', label: 'Average', colorClass: 'text-amber-700', bgClass: 'bg-amber-50' };
  }
  return { grade: 'D', label: 'Poor', colorClass: 'text-red-700', bgClass: 'bg-red-50' };
}

export default function StandardCostPage() {
  const navigate = useNavigate();
  const [selectedCostId, setSelectedCostId] = useState<string | null>(null);

  const standardCosts = useMemo(() => {
    return mockProductionCosts
      .filter((c) => c.costingMethod === 'STANDARD')
      .sort((a, b) => a.productionOrderNumber.localeCompare(b.productionOrderNumber));
  }, []);

  const summary = useMemo(() => {
    const totalStdCost = standardCosts.reduce((s, c) => s + c.totalCost, 0);
    const totalQty = standardCosts.reduce((s, c) => s + c.producedQty, 0);
    const totalMaterial = standardCosts.reduce((s, c) => s + c.materialCost, 0);
    const totalLabourOverhead = standardCosts.reduce((s, c) => s + c.labourCost + c.overheadCost, 0);
    const avgCostPerUnit = totalQty > 0 ? totalStdCost / totalQty : 0;

    return { totalStdCost, avgCostPerUnit, totalMaterial, totalLabourOverhead, totalQty };
  }, [standardCosts]);

  const selectedCost = useMemo(() => {
    if (!selectedCostId) return null;
    return mockProductionCosts.find((c) => c.id === selectedCostId) ?? null;
  }, [selectedCostId]);

  const selectedElements = useMemo(() => {
    if (!selectedCostId) return [];
    return mockCostElements.filter((e) => e.productionCostId === selectedCostId);
  }, [selectedCostId]);

  const selectedElementSummary = useMemo(() => {
    if (!selectedCost || selectedElements.length === 0) return null;
    const matElements = selectedElements.filter((e) => e.type === 'MATERIAL');
    const labElements = selectedElements.filter((e) => e.type === 'LABOUR');
    const ohElements = selectedElements.filter((e) => e.type === 'OVERHEAD');
    const matTotal = matElements.reduce((s, e) => s + e.amount, 0);
    const labTotal = labElements.reduce((s, e) => s + e.amount, 0);
    const ohTotal = ohElements.reduce((s, e) => s + e.amount, 0);
    const total = matTotal + labTotal + ohTotal;
    return { matTotal, labTotal, ohTotal, total, matPct: pctOf(matTotal, total), labPct: pctOf(labTotal, total), ohPct: pctOf(ohTotal, total) };
  }, [selectedCost, selectedElements]);

  const selectedProfitability = useMemo(() => {
    if (!selectedCost) return null;
    const qty = selectedCost.producedQty;
    const totalRevenue = selectedCost.salePrice * qty;
    const totalCost = selectedCost.totalCost;
    const grossMargin = totalRevenue - totalCost;
    const marginPct = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;
    const grade = getMarginGrade(marginPct);
    return { totalRevenue, totalCost, grossMargin, marginPct, grade, salePrice: selectedCost.salePrice, qty };
  }, [selectedCost]);

  const handlePrintAll = () => {
    window.print();
  };

  const handlePrintOrder = (costId: string) => {
    setSelectedCostId(costId);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Standard Cost</h1>
            <p className="text-sm text-gray-500 mt-0.5">Planned cost based on BOM and routing</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/manufacturing/costing')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-arrow-left-line" />
              Back to Dashboard
            </button>
            <button
              onClick={handlePrintAll}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-printer-line" />
              Print All
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Standard Cost */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total Standard Cost</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(summary.totalStdCost)}</div>
            <div className="mt-2 text-xs text-gray-500">
              Across {standardCosts.length} production order{standardCosts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Avg Standard Cost/Unit */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Avg Standard Cost / Unit</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(Math.round(summary.avgCostPerUnit))}</div>
            <div className="mt-2 text-xs text-gray-500">
              Total {summary.totalQty} units across orders
            </div>
          </div>

          {/* Total Material Cost */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total Material Cost</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(summary.totalMaterial)}</div>
            <div className="mt-2 text-xs text-gray-500">
              Across all production orders
            </div>
          </div>

          {/* Total Labour + Overhead */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total Labour + Overhead</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(summary.totalLabourOverhead)}</div>
            <div className="mt-2 text-xs text-gray-500">
              Labour + Overhead combined
            </div>
          </div>
        </div>

        {/* Standard Cost Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Standard Cost Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">PO Number</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">Product</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Qty</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Std Material</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Std Labour</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Std Overhead</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Std Total</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Cost / Unit</th>
                  <th className="px-3 py-2.5 text-center font-medium text-gray-500 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standardCosts.map((cost) => (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 text-gray-900 font-medium whitespace-nowrap">{cost.productionOrderNumber}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                      {cost.productName}
                      {cost.variantName ? <span className="block text-gray-400 text-[10px]">{cost.variantName}</span> : null}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{cost.producedQty} {cost.unit}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(cost.materialCost)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(cost.labourCost)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(cost.overheadCost)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(cost.totalCost)}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(cost.costPerUnit)}/unit</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedCostId(cost.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                        >
                          <i className="ri-eye-line" />
                          View
                        </button>
                        <button
                          onClick={() => handlePrintOrder(cost.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                        >
                          <i className="ri-printer-line" />
                          Print
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals Row */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-3 py-2.5 text-gray-900 font-semibold whitespace-nowrap">Total</td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">—</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-medium whitespace-nowrap">{summary.totalQty} Pcs</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">{formatCurrency(summary.totalMaterial)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">
                    {formatCurrency(standardCosts.reduce((s, c) => s + c.labourCost, 0))}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">
                    {formatCurrency(standardCosts.reduce((s, c) => s + c.overheadCost, 0))}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">{formatCurrency(summary.totalStdCost)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-400 whitespace-nowrap">—</td>
                  <td className="px-3 py-2.5 text-center text-gray-400 whitespace-nowrap">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Slide-over: Standard Cost Detail */}
        {selectedCost && (
          <div className="fixed inset-0 z-50">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSelectedCostId(null)}
            />
            <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-lg overflow-y-auto">
              {/* Slide-over header */}
              <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-900">
                  Standard Cost Details — {selectedCost.productionOrderNumber}
                </h2>
                <button
                  onClick={() => setSelectedCostId(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <i className="ri-close-line text-lg text-gray-500" />
                </button>
              </div>

              <div className="px-5 py-4 space-y-5">
                {/* Section 1: Order Info */}
                <section>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Order Info</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">PO Number</span>
                      <div className="text-gray-900 font-medium mt-0.5">{selectedCost.productionOrderNumber}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Product</span>
                      <div className="text-gray-900 font-medium mt-0.5">
                        {selectedCost.productName}
                        {selectedCost.variantName ? <span className="block text-gray-400">{selectedCost.variantName}</span> : null}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Quantity</span>
                      <div className="text-gray-900 font-medium mt-0.5">{selectedCost.producedQty} {selectedCost.unit}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Status</span>
                      <div className="mt-0.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          selectedCost.status === 'FINALIZED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {selectedCost.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 2: Cost Element Breakdown */}
                <section>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cost Element Breakdown</h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Element</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500">Type</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Qty</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Rate</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Std Cost</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Cost / Unit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedElements.map((el) => (
                          <tr key={el.id}>
                            <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{el.description}</td>
                            <td className="px-3 py-2 text-center whitespace-nowrap">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getTypeBadge(el.type)}`}>
                                {el.type}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                              {el.qty} {el.unit}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                              {formatCurrency(el.rate)}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-900 font-medium whitespace-nowrap">
                              {formatCurrency(el.amount)}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                              {formatCurrency(Math.round(el.amount / selectedCost.producedQty))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 3: Cost Summary */}
                {selectedElementSummary && (
                  <section>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Cost Summary</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Material Total</span>
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(selectedElementSummary.matTotal)}
                          <span className="text-gray-400 ml-1">({selectedElementSummary.matPct} of total)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Labour Total</span>
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(selectedElementSummary.labTotal)}
                          <span className="text-gray-400 ml-1">({selectedElementSummary.labPct})</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Overhead Total</span>
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(selectedElementSummary.ohTotal)}
                          <span className="text-gray-400 ml-1">({selectedElementSummary.ohPct})</span>
                        </span>
                      </div>
                      <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                        <span className="text-gray-900 font-semibold">TOTAL STANDARD COST</span>
                        <span className="text-gray-900 font-semibold">{formatCurrency(selectedElementSummary.total)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Per Unit</span>
                        <span className="text-gray-900 font-medium">
                          {formatCurrency(Math.round(selectedElementSummary.total / selectedCost.producedQty))}
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Section 4: Profitability */}
                {selectedProfitability && (
                  <section>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profitability</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Sale Price</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(selectedProfitability.salePrice)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Revenue ({selectedProfitability.qty} units)</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(selectedProfitability.totalRevenue)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Standard Cost</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(selectedProfitability.totalCost)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                        <span className="text-gray-900 font-semibold">Gross Margin</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(selectedProfitability.grossMargin)}
                          <span className="text-gray-500 ml-1">({selectedProfitability.marginPct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${selectedProfitability.grade.bgClass} ${selectedProfitability.grade.colorClass}`}>
                          Grade {selectedProfitability.grade.grade}
                          <span className="font-normal">{selectedProfitability.grade.label}</span>
                        </span>
                      </div>
                    </div>
                  </section>
                )}

                {/* Print Cost Sheet button */}
                <div className="pt-2 pb-4">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 cursor-pointer whitespace-nowrap w-full justify-center"
                  >
                    <i className="ri-printer-line" />
                    Print Cost Sheet
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}