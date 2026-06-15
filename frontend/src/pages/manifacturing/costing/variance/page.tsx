import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { mockProductionCosts, mockCostElements } from '@/mocks/costing';
import VarianceDetailSlideOver from './components/VarianceDetailSlideOver';

type Tab = 'variance' | 'profitability';

interface VarianceRow {
  poNumber: string;
  productName: string;
  variantName: string | null;
  qty: number;
  unit: string;
  stdMaterial: number;
  actMaterial: number;
  matVar: number;
  stdLabour: number;
  actLabour: number;
  labVar: number;
  stdOverhead: number;
  actOverhead: number;
  ohVar: number;
  stdRejection: number;
  actRejection: number;
  rejVar: number;
  stdTotal: number;
  actTotal: number;
  totalVar: number;
  varPct: number;
  standardCostId: string;
  actualCostId: string;
}

interface GradeInfo {
  grade: string;
  label: string;
  colorClass: string;
  bgClass: string;
}

function getGrade(marginPct: number): GradeInfo {
  if (marginPct > 40) {
    return { grade: 'A', label: 'Excellent', colorClass: 'text-emerald-700', bgClass: 'bg-emerald-50' };
  }
  if (marginPct >= 25) {
    return { grade: 'B', label: 'Good', colorClass: 'text-blue-700', bgClass: 'bg-blue-50' };
  }
  if (marginPct >= 10) {
    return { grade: 'C', label: 'Average', colorClass: 'text-amber-700', bgClass: 'bg-amber-50' };
  }
  return { grade: 'D', label: 'Poor', colorClass: 'text-red-700', bgClass: 'bg-red-50' };
}

function varianceDisplay(value: number): { text: string; colorClass: string; arrow: string } {
  if (value > 0) {
    return { text: `↓ ₹${value.toLocaleString()}`, colorClass: 'text-emerald-600', arrow: '↓' };
  }
  if (value < 0) {
    return { text: `↑ ₹${Math.abs(value).toLocaleString()}`, colorClass: 'text-red-600', arrow: '↑' };
  }
  return { text: '₹0', colorClass: 'text-gray-500', arrow: '' };
}

export default function VariancePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('variance');
  const [selectedRow, setSelectedRow] = useState<VarianceRow | null>(null);
  const [sortDesc, setSortDesc] = useState(true);

  const varianceRows = useMemo(() => {
    const byPO = new Map<string, typeof mockProductionCosts>();
    mockProductionCosts.forEach((c) => {
      const list = byPO.get(c.productionOrderId) ?? [];
      list.push(c);
      byPO.set(c.productionOrderId, list);
    });

    const rows: VarianceRow[] = [];
    byPO.forEach((costs) => {
      const std = costs.find((c) => c.costingMethod === 'STANDARD');
      const act = costs.find((c) => c.costingMethod === 'ACTUAL');
      if (std && act) {
        rows.push({
          poNumber: std.productionOrderNumber,
          productName: std.productName,
          variantName: std.variantName,
          qty: std.producedQty,
          unit: std.unit,
          stdMaterial: std.materialCost,
          actMaterial: act.materialCost,
          matVar: std.materialCost - act.materialCost,
          stdLabour: std.labourCost,
          actLabour: act.labourCost,
          labVar: std.labourCost - act.labourCost,
          stdOverhead: std.overheadCost,
          actOverhead: act.overheadCost,
          ohVar: std.overheadCost - act.overheadCost,
          stdRejection: std.rejectionCost,
          actRejection: act.rejectionCost,
          rejVar: std.rejectionCost - act.rejectionCost,
          stdTotal: std.totalCost,
          actTotal: act.totalCost,
          totalVar: std.totalCost - act.totalCost,
          varPct: std.totalCost > 0 ? ((std.totalCost - act.totalCost) / std.totalCost) * 100 : 0,
          standardCostId: std.id,
          actualCostId: act.id,
        });
      }
    });
    return rows;
  }, []);

  const summary = useMemo(() => {
    const totalStdMat = varianceRows.reduce((s, r) => s + r.stdMaterial, 0);
    const totalActMat = varianceRows.reduce((s, r) => s + r.actMaterial, 0);
    const totalStdLab = varianceRows.reduce((s, r) => s + r.stdLabour, 0);
    const totalActLab = varianceRows.reduce((s, r) => s + r.actLabour, 0);
    const totalStdOH = varianceRows.reduce((s, r) => s + r.stdOverhead, 0);
    const totalActOH = varianceRows.reduce((s, r) => s + r.actOverhead, 0);
    const totalStdRej = varianceRows.reduce((s, r) => s + r.stdRejection, 0);
    const totalActRej = varianceRows.reduce((s, r) => s + r.actRejection, 0);
    const totalStdTot = varianceRows.reduce((s, r) => s + r.stdTotal, 0);
    const totalActTot = varianceRows.reduce((s, r) => s + r.actTotal, 0);

    return {
      matVar: totalStdMat - totalActMat,
      labVar: totalStdLab - totalActLab,
      ohVar: totalStdOH - totalActOH,
      rejVar: totalStdRej - totalActRej,
      totalVar: totalStdTot - totalActTot,
      totalStdTot,
      totalActTot,
      varPct: totalStdTot > 0 ? ((totalStdTot - totalActTot) / totalStdTot) * 100 : 0,
    };
  }, [varianceRows]);

  const profitabilityData = useMemo(() => {
    const finalized = mockProductionCosts.filter((c) => c.status === 'FINALIZED');
    return finalized.sort((a, b) => (sortDesc ? b.marginPct - a.marginPct : a.marginPct - b.marginPct));
  }, [sortDesc]);

  const profitabilitySummary = useMemo(() => {
    if (profitabilityData.length === 0) return null;
    const best = profitabilityData[0];
    const worst = profitabilityData[profitabilityData.length - 1];
    const avgMargin = profitabilityData.reduce((s, c) => s + c.marginPct, 0) / profitabilityData.length;
    const totalRevenue = profitabilityData.reduce((s, c) => s + c.salePrice * c.producedQty, 0);
    const totalCost = profitabilityData.reduce((s, c) => s + c.totalCost, 0);
    return { best, worst, avgMargin, totalRevenue, totalCost, totalProfit: totalRevenue - totalCost };
  }, [profitabilityData]);

  const chartProducts = useMemo(() => {
    const seen = new Set<string>();
    const list = mockProductionCosts
      .filter((c) => {
        if (seen.has(c.productId)) return false;
        seen.add(c.productId);
        return true;
      })
      .sort((a, b) => b.marginPct - a.marginPct);
    return list;
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Cost Variance Analysis</h1>
            <p className="text-sm text-gray-500 mt-0.5">Standard vs Actual cost comparison</p>
          </div>
          <button
            onClick={() => navigate('/manufacturing/costing')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap self-start"
          >
            <i className="ri-arrow-left-line" />
            Back to Dashboard
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('variance')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'variance'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Variance Analysis
          </button>
          <button
            onClick={() => setActiveTab('profitability')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'profitability'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Profitability
          </button>
        </div>

        {/* ========== VARIANCE ANALYSIS TAB ========== */}
        {activeTab === 'variance' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Material Variance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Material Variance</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-gray-900">₹{Math.abs(summary.matVar).toLocaleString()}</span>
                  <span className={`text-sm font-medium ${varianceDisplay(summary.matVar).colorClass}`}>
                    {varianceDisplay(summary.matVar).text}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Std: ₹{summary.totalStdTot > 0 ? varianceRows.reduce((s, r) => s + r.stdMaterial, 0).toLocaleString() : '0'} &nbsp;|&nbsp;
                  Act: ₹{varianceRows.reduce((s, r) => s + r.actMaterial, 0).toLocaleString()}
                </div>
              </div>

              {/* Labour Variance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Labour Variance</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-gray-900">₹{Math.abs(summary.labVar).toLocaleString()}</span>
                  <span className={`text-sm font-medium ${varianceDisplay(summary.labVar).colorClass}`}>
                    {varianceDisplay(summary.labVar).text}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Std: ₹{varianceRows.reduce((s, r) => s + r.stdLabour, 0).toLocaleString()} &nbsp;|&nbsp;
                  Act: ₹{varianceRows.reduce((s, r) => s + r.actLabour, 0).toLocaleString()}
                </div>
              </div>

              {/* Overhead Variance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Overhead Variance</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-gray-900">₹{Math.abs(summary.ohVar).toLocaleString()}</span>
                  <span className={`text-sm font-medium ${varianceDisplay(summary.ohVar).colorClass}`}>
                    {varianceDisplay(summary.ohVar).text}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Std: ₹{varianceRows.reduce((s, r) => s + r.stdOverhead, 0).toLocaleString()} &nbsp;|&nbsp;
                  Act: ₹{varianceRows.reduce((s, r) => s + r.actOverhead, 0).toLocaleString()}
                </div>
              </div>

              {/* Total Cost Variance */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-1">Total Cost Variance</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold text-gray-900">₹{Math.abs(summary.totalVar).toLocaleString()}</span>
                  <span className={`text-sm font-medium ${varianceDisplay(summary.totalVar).colorClass}`}>
                    {varianceDisplay(summary.totalVar).text}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Variance %: {summary.varPct.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Variance Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Standard vs Actual Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">PO Number</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">Product</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Qty</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Std Material</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Act Material</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Mat Var</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Std Labour</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Act Labour</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Lab Var</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Std OH</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Act OH</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">OH Var</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Std Total</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Act Total</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Total Var</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Var %</th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-500 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {varianceRows.map((row) => (
                      <tr
                        key={row.poNumber}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => setSelectedRow(row)}
                      >
                        <td className="px-3 py-2.5 text-gray-900 font-medium whitespace-nowrap">{row.poNumber}</td>
                        <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                          {row.productName}
                          {row.variantName ? <span className="block text-gray-400">{row.variantName}</span> : null}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{row.qty} {row.unit}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{row.stdMaterial.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{row.actMaterial.toLocaleString()}</td>
                        <td className={`px-3 py-2.5 text-right font-medium whitespace-nowrap ${row.matVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.matVar >= 0 ? '↓' : '↑'} ₹{Math.abs(row.matVar).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{row.stdLabour.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{row.actLabour.toLocaleString()}</td>
                        <td className={`px-3 py-2.5 text-right font-medium whitespace-nowrap ${row.labVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.labVar >= 0 ? '↓' : '↑'} ₹{Math.abs(row.labVar).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{row.stdOverhead.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{row.actOverhead.toLocaleString()}</td>
                        <td className={`px-3 py-2.5 text-right font-medium whitespace-nowrap ${row.ohVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.ohVar >= 0 ? '↓' : '↑'} ₹{Math.abs(row.ohVar).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{row.stdTotal.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{row.actTotal.toLocaleString()}</td>
                        <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${row.totalVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.totalVar >= 0 ? '↓' : '↑'} ₹{Math.abs(row.totalVar).toLocaleString()}
                        </td>
                        <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${row.totalVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.varPct.toFixed(1)}%
                        </td>
                        <td className="px-3 py-2.5 text-center whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRow(row);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 cursor-pointer"
                          >
                            <i className="ri-eye-line" />
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========== PROFITABILITY TAB ========== */}
        {activeTab === 'profitability' && (
          <div className="space-y-6">
            {/* Profitability Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Profitability Report</h3>
                <button
                  onClick={() => setSortDesc(!sortDesc)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                >
                  {sortDesc ? <i className="ri-arrow-down-line" /> : <i className="ri-arrow-up-line" />}
                  Margin %
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">Product</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">Variant</th>
                      <th className="px-3 py-2.5 text-left font-medium text-gray-500 whitespace-nowrap">PO No</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Qty</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Cost/Unit</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Sale Price</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Margin</th>
                      <th className="px-3 py-2.5 text-right font-medium text-gray-500 whitespace-nowrap">Margin %</th>
                      <th className="px-3 py-2.5 text-center font-medium text-gray-500 whitespace-nowrap">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {profitabilityData.map((cost) => {
                      const grade = getGrade(cost.marginPct);
                      return (
                        <tr key={cost.id} className="hover:bg-gray-50">
                          <td className="px-3 py-2.5 text-gray-900 font-medium whitespace-nowrap">{cost.productName}</td>
                          <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">{cost.variantName ?? '—'}</td>
                          <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{cost.productionOrderNumber}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">{cost.producedQty} {cost.unit}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{cost.costPerUnit.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{cost.salePrice.toLocaleString()}</td>
                          <td className="px-3 py-2.5 text-right text-gray-600 whitespace-nowrap">₹{cost.margin.toLocaleString(undefined, { maximumFractionDigits: 1 })}</td>
                          <td className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${
                            cost.marginPct >= 40 ? 'text-emerald-600' : cost.marginPct >= 25 ? 'text-blue-600' : cost.marginPct >= 10 ? 'text-amber-600' : 'text-red-600'
                          }`}>
                            {cost.marginPct.toFixed(1)}%
                          </td>
                          <td className="px-3 py-2.5 text-center whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${grade.bgClass} ${grade.colorClass}`}>
                              {grade.grade}
                              <span className="text-gray-500 font-normal">{grade.label}</span>
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Footer */}
              {profitabilitySummary && (
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
                    <div>
                      <span className="text-gray-500">Best Margin</span>
                      <div className="text-gray-900 font-medium mt-0.5">
                        {profitabilitySummary.best.productName} at {profitabilitySummary.best.marginPct.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Worst Margin</span>
                      <div className="text-gray-900 font-medium mt-0.5">
                        {profitabilitySummary.worst.productName} at {profitabilitySummary.worst.marginPct.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Average Margin</span>
                      <div className="text-gray-900 font-medium mt-0.5">
                        {profitabilitySummary.avgMargin.toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Revenue</span>
                      <div className="text-gray-900 font-medium mt-0.5">
                        ₹{profitabilitySummary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Cost</span>
                      <div className="text-gray-900 font-medium mt-0.5">
                        ₹{profitabilitySummary.totalCost.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Profit</span>
                      <div className="text-emerald-700 font-medium mt-0.5">
                        ₹{profitabilitySummary.totalProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cost Trend Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Cost vs Sale Price Trend</h3>
              <div className="space-y-4">
                {chartProducts.map((product) => {
                  const costPct = (product.costPerUnit / product.salePrice) * 100;
                  const marginPct = 100 - costPct;
                  return (
                    <div key={product.id} className="flex items-center gap-3 md:gap-4">
                      <div className="w-32 md:w-40 text-xs text-gray-900 font-medium truncate">
                        {product.variantName ?? product.productName}
                      </div>
                      <div className="flex-1 h-7 md:h-8 bg-gray-100 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${Math.min(costPct, 100)}%` }}
                        />
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(marginPct, 100)}%` }}
                        />
                      </div>
                      <div className="w-20 text-right text-xs text-gray-600 whitespace-nowrap">
                        ₹{product.salePrice.toLocaleString()}
                      </div>
                      <div className="w-14 text-right text-xs font-medium text-gray-900 whitespace-nowrap">
                        {product.marginPct.toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                  <span className="text-gray-600">Cost</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
                  <span className="text-gray-600">Margin</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide Over */}
        {selectedRow && (
          <VarianceDetailSlideOver
            isOpen={!!selectedRow}
            onClose={() => setSelectedRow(null)}
            standardCostId={selectedRow.standardCostId}
            actualCostId={selectedRow.actualCostId}
            poNumber={selectedRow.poNumber}
            productName={selectedRow.productName}
            variantName={selectedRow.variantName}
          />
        )}
      </div>
    </AppLayout>
  );
}