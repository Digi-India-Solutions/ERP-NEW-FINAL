import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { mockProductionCosts, mockCostElements } from '@/mocks/costing';
import type { MockCostElement } from '@/mocks/costing';

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

function varianceDisplay(diff: number): { icon: string; color: string; text: string } {
  if (diff > 0) return { icon: '↑', color: 'text-red-600', text: `↑ ₹${diff.toLocaleString()}` };
  if (diff < 0) return { icon: '↓', color: 'text-emerald-600', text: `↓ ₹${Math.abs(diff).toLocaleString()}` };
  return { icon: '=', color: 'text-gray-500', text: `= ₹${diff.toLocaleString()}` };
}

export default function ActualCostPage() {
  const navigate = useNavigate();
  const [selectedCostId, setSelectedCostId] = useState<string | null>(null);

  // Compute actual cost total as material + labour + overhead (exclude rejection for comparison consistency)
  function actualTotal(cost: typeof mockProductionCosts[number]): number {
    return cost.materialCost + cost.labourCost + cost.overheadCost;
  }

  const actualCosts = useMemo(() => {
    return mockProductionCosts
      .filter((c) => c.costingMethod === 'ACTUAL')
      .sort((a, b) => a.productionOrderNumber.localeCompare(b.productionOrderNumber));
  }, []);

  // Match each actual cost to its standard counterpart
  const actualWithStd = useMemo(() => {
    return actualCosts.map((actual) => {
      const standard = mockProductionCosts.find(
        (c) => c.productionOrderNumber === actual.productionOrderNumber && c.costingMethod === 'STANDARD'
      );
      const actTotal = actualTotal(actual);
      const stdTotal = standard ? standard.materialCost + standard.labourCost + standard.overheadCost : 0;
      const variance = actTotal - stdTotal;
      return { actual, standard, actTotal, stdTotal, variance };
    });
  }, [actualCosts]);

  const summary = useMemo(() => {
    const totalActCost = actualCosts.reduce((s, c) => s + actualTotal(c), 0);
    const totalQty = actualCosts.reduce((s, c) => s + c.producedQty, 0);
    const totalActMaterial = actualCosts.reduce((s, c) => s + c.materialCost, 0);
    const totalActLabourOH = actualCosts.reduce((s, c) => s + c.labourCost + c.overheadCost, 0);

    // Sum standard totals for matching POs
    const totalStdCost = actualCosts.reduce((s, actual) => {
      const standard = mockProductionCosts.find(
        (c) => c.productionOrderNumber === actual.productionOrderNumber && c.costingMethod === 'STANDARD'
      );
      if (standard) {
        return s + standard.materialCost + standard.labourCost + standard.overheadCost;
      }
      return s;
    }, 0);

    const vsStd = totalActCost - totalStdCost;

    return { totalActCost, totalQty, totalActMaterial, totalActLabourOH, totalStdCost, vsStd };
  }, [actualCosts]);

  // --- Slide-over data ---
  const selectedCost = useMemo(() => {
    if (!selectedCostId) return null;
    return mockProductionCosts.find((c) => c.id === selectedCostId) ?? null;
  }, [selectedCostId]);

  const selectedStdCost = useMemo(() => {
    if (!selectedCost) return null;
    return mockProductionCosts.find(
      (c) => c.productionOrderNumber === selectedCost.productionOrderNumber && c.costingMethod === 'STANDARD'
    ) ?? null;
  }, [selectedCost]);

  const selectedActElements = useMemo(() => {
    if (!selectedCostId) return [];
    return mockCostElements.filter((e) => e.productionCostId === selectedCostId);
  }, [selectedCostId]);

  const selectedStdElements = useMemo(() => {
    if (!selectedStdCost) return [];
    return mockCostElements.filter((e) => e.productionCostId === selectedStdCost.id);
  }, [selectedStdCost]);

  // Match elements by description + type between standard and actual
  const matchedElements = useMemo(() => {
    if (!selectedCost || !selectedStdCost) return [];
    const stdMap = new Map<string, MockCostElement>();
    selectedStdElements.forEach((el) => {
      stdMap.set(`${el.description}|${el.type}`, el);
    });

    // Start with all actual elements
    const rows: { description: string; type: string; stdAmount: number; actAmount: number; stdEl: MockCostElement | null; actEl: MockCostElement | null }[] = [];

    selectedActElements.forEach((actEl) => {
      const key = `${actEl.description}|${actEl.type}`;
      const stdEl = stdMap.get(key) ?? null;
      rows.push({
        description: actEl.description,
        type: actEl.type,
        stdAmount: stdEl?.amount ?? 0,
        actAmount: actEl.amount,
        stdEl,
        actEl,
      });
      if (stdEl) stdMap.delete(key);
    });

    // Add standard-only elements
    stdMap.forEach((stdEl) => {
      rows.push({
        description: stdEl.description,
        type: stdEl.type,
        stdAmount: stdEl.amount,
        actAmount: 0,
        stdEl,
        actEl: null,
      });
    });

    return rows;
  }, [selectedCost, selectedStdCost, selectedActElements, selectedStdElements]);

  const comparisonSummary = useMemo(() => {
    if (!selectedCost || !selectedStdCost) return null;
    const stdMat = selectedStdCost.materialCost;
    const stdLab = selectedStdCost.labourCost;
    const stdOH = selectedStdCost.overheadCost;
    const stdTotal = stdMat + stdLab + stdOH;
    const actMat = selectedCost.materialCost;
    const actLab = selectedCost.labourCost;
    const actOH = selectedCost.overheadCost;
    const actTotal = actMat + actLab + actOH;

    return {
      stdMat, stdLab, stdOH, stdTotal,
      actMat, actLab, actOH, actTotal,
      varMat: actMat - stdMat,
      varLab: actLab - stdLab,
      varOH: actOH - stdOH,
      varTotal: actTotal - stdTotal,
    };
  }, [selectedCost, selectedStdCost]);

  const selectedProfitability = useMemo(() => {
    if (!selectedCost || !selectedStdCost) return null;
    const qty = selectedCost.producedQty;
    const salePrice = selectedCost.salePrice;
    const totalRevenue = salePrice * qty;
    const actTotal = actualTotal(selectedCost);
    const stdTotal = selectedStdCost.materialCost + selectedStdCost.labourCost + selectedStdCost.overheadCost;
    const actMargin = totalRevenue - actTotal;
    const actMarginPct = totalRevenue > 0 ? (actMargin / totalRevenue) * 100 : 0;
    const stdMarginPct = totalRevenue > 0 ? ((totalRevenue - stdTotal) / totalRevenue) * 100 : 0;
    const marginDiff = actMarginPct - stdMarginPct;
    const grade = getMarginGrade(actMarginPct);

    return { salePrice, qty, totalRevenue, actTotal, actMargin, actMarginPct, stdMarginPct, marginDiff, grade };
  }, [selectedCost, selectedStdCost]);

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
            <h1 className="text-xl font-semibold text-gray-900">Actual Cost</h1>
            <p className="text-sm text-gray-500 mt-0.5">Recorded cost from actual production data</p>
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
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line" />
              Recalculate All
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Actual Cost */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total Actual Cost</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(summary.totalActCost)}</div>
            <div className="mt-2 text-xs text-gray-500">
              Across {actualCosts.length} production order{actualCosts.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* vs Standard Cost */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">vs Standard Cost</div>
            <div className={`text-lg font-semibold ${summary.vsStd > 0 ? 'text-red-600' : summary.vsStd < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
              {summary.vsStd > 0 ? '↑' : summary.vsStd < 0 ? '↓' : '='} {formatCurrency(Math.abs(summary.vsStd))}
              <span className="text-xs font-normal ml-1">{summary.vsStd > 0 ? 'over' : summary.vsStd < 0 ? 'under' : 'on'} budget</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Standard: {formatCurrency(summary.totalStdCost)}
            </div>
          </div>

          {/* Total Actual Material */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total Actual Material</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(summary.totalActMaterial)}</div>
            <div className="mt-2 text-xs text-gray-500">
              Actual material consumption
            </div>
          </div>

          {/* Total Actual Labour + OH */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-xs text-gray-500 mb-1">Total Actual Labour + OH</div>
            <div className="text-lg font-semibold text-gray-900">{formatCurrency(summary.totalActLabourOH)}</div>
            <div className="mt-2 text-xs text-gray-500">
              Labour + Overhead actual
            </div>
          </div>
        </div>

        {/* Actual Cost Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">Actual Cost Records</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">PO Number</th>
                  <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">Product</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Qty</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Act Material</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Act Labour</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Act Overhead</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Act Total</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Cost / Unit</th>
                  <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">vs Std</th>
                  <th className="px-3 py-2.5 text-center font-medium text-gray-500 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {actualWithStd.map(({ actual, standard, actTotal, stdTotal, variance }) => {
                  const costPerUnit = actual.producedQty > 0 ? Math.round(actTotal / actual.producedQty) : 0;
                  const v = varianceDisplay(variance);
                  return (
                    <tr key={actual.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-900 font-medium whitespace-nowrap">{actual.productionOrderNumber}</td>
                      <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                        {actual.productName}
                        {actual.variantName ? <span className="block text-gray-400 text-[10px]">{actual.variantName}</span> : null}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{actual.producedQty} {actual.unit}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(actual.materialCost)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(actual.labourCost)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(actual.overheadCost)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(actTotal)}</td>
                      <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{formatCurrency(costPerUnit)}/unit</td>
                      <td className="px-3 py-2.5 text-right whitespace-nowrap">
                        <span className={v.color}>
                          {v.text}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedCostId(actual.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                        >
                          <i className="ri-eye-line" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals Row */}
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-200">
                  <td className="px-3 py-2.5 text-gray-900 font-semibold whitespace-nowrap">Total</td>
                  <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">—</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-medium whitespace-nowrap">{summary.totalQty} Pcs</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">{formatCurrency(summary.totalActMaterial)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">
                    {formatCurrency(actualCosts.reduce((s, c) => s + c.labourCost, 0))}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">
                    {formatCurrency(actualCosts.reduce((s, c) => s + c.overheadCost, 0))}
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-900 font-semibold whitespace-nowrap">{formatCurrency(summary.totalActCost)}</td>
                  <td className="px-3 py-2.5 text-right text-gray-400 whitespace-nowrap">—</td>
                  <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${summary.vsStd > 0 ? 'text-red-600' : summary.vsStd < 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                    {summary.vsStd > 0 ? '↑' : summary.vsStd < 0 ? '↓' : '='} {formatCurrency(Math.abs(summary.vsStd))}
                  </td>
                  <td className="px-3 py-2.5 text-center text-gray-400 whitespace-nowrap">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Slide-over: Actual Cost Detail */}
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
                  Actual Cost Details — {selectedCost.productionOrderNumber}
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

                {/* Section 2: Actual Cost Element Breakdown */}
                <section>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Actual Cost Element Breakdown
                    {selectedStdCost && <span className="text-gray-400 ml-1">— vs Standard</span>}
                  </h4>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-3 py-2 text-left font-medium text-gray-500">Element</th>
                          <th className="px-3 py-2 text-center font-medium text-gray-500">Type</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Std Cost</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Act Cost</th>
                          <th className="px-3 py-2 text-right font-medium text-gray-500">Variance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {matchedElements.map((row, idx) => {
                          const diff = row.actAmount - row.stdAmount;
                          const v = varianceDisplay(diff);
                          return (
                            <tr key={`${idx}-${row.description}-${row.type}`}>
                              <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{row.description}</td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${getTypeBadge(row.type)}`}>
                                  {row.type === 'MATERIAL' ? 'MAT' : row.type === 'LABOUR' ? 'LAB' : row.type === 'OVERHEAD' ? 'OVH' : row.type}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right text-gray-600 whitespace-nowrap">
                                {row.stdAmount > 0 ? formatCurrency(row.stdAmount) : '—'}
                              </td>
                              <td className="px-3 py-2 text-right text-gray-900 font-medium whitespace-nowrap">
                                {row.actAmount > 0 ? formatCurrency(row.actAmount) : '—'}
                              </td>
                              <td className={`px-3 py-2 text-right whitespace-nowrap ${v.color}`}>
                                {v.text}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Section 3: Actual vs Standard Summary */}
                {comparisonSummary && (
                  <section>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Actual vs Standard Summary</h4>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-3 py-2 text-left font-medium text-gray-500"></th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Standard</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Actual</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-500">Variance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          <tr>
                            <td className="px-3 py-2 text-gray-900 font-medium">Material</td>
                            <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(comparisonSummary.stdMat)}</td>
                            <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(comparisonSummary.actMat)}</td>
                            <td className={`px-3 py-2 text-right ${varianceDisplay(comparisonSummary.varMat).color}`}>
                              {varianceDisplay(comparisonSummary.varMat).text}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-900 font-medium">Labour</td>
                            <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(comparisonSummary.stdLab)}</td>
                            <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(comparisonSummary.actLab)}</td>
                            <td className={`px-3 py-2 text-right ${varianceDisplay(comparisonSummary.varLab).color}`}>
                              {varianceDisplay(comparisonSummary.varLab).text}
                            </td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2 text-gray-900 font-medium">Overhead</td>
                            <td className="px-3 py-2 text-right text-gray-600">{formatCurrency(comparisonSummary.stdOH)}</td>
                            <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(comparisonSummary.actOH)}</td>
                            <td className={`px-3 py-2 text-right ${varianceDisplay(comparisonSummary.varOH).color}`}>
                              {varianceDisplay(comparisonSummary.varOH).text}
                            </td>
                          </tr>
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td className="px-3 py-2 text-gray-900 font-semibold">TOTAL</td>
                            <td className="px-3 py-2 text-right text-gray-900 font-semibold">{formatCurrency(comparisonSummary.stdTotal)}</td>
                            <td className="px-3 py-2 text-right text-gray-900 font-semibold">{formatCurrency(comparisonSummary.actTotal)}</td>
                            <td className={`px-3 py-2 text-right font-semibold ${varianceDisplay(comparisonSummary.varTotal).color}`}>
                              {varianceDisplay(comparisonSummary.varTotal).text}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </section>
                )}

                {/* Section 4: Profitability at Actual Cost */}
                {selectedProfitability && (
                  <section>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Profitability at Actual Cost</h4>
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
                        <span className="text-gray-600">Actual Cost</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(selectedProfitability.actTotal)}</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2.5 flex items-center justify-between">
                        <span className="text-gray-900 font-semibold">Actual Gross Margin</span>
                        <span className="text-gray-900 font-semibold">
                          {formatCurrency(selectedProfitability.actMargin)}
                          <span className="text-gray-500 ml-1">({selectedProfitability.actMarginPct.toFixed(1)}%)</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">vs Standard Margin ({selectedProfitability.stdMarginPct.toFixed(1)}%)</span>
                        <span className={`${selectedProfitability.marginDiff < 0 ? 'text-red-600' : selectedProfitability.marginDiff > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>
                          {selectedProfitability.marginDiff < 0 ? '↓' : selectedProfitability.marginDiff > 0 ? '↑' : '='}{Math.abs(selectedProfitability.marginDiff).toFixed(1)}%
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