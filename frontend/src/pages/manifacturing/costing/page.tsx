import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import {
  mockProductionCosts,
  type MockProductionCost,
} from '@/mocks/costing';
import {
  mockProductionOrders,
  mockItems,
} from '@/mocks/masters';

export default function CostingDashboardPage() {
  const navigate = useNavigate();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  /* ── Computed Stats ─────────────────────────────────────────── */

  const finalizedCosts = useMemo(
    () => mockProductionCosts.filter((c) => c.status === 'FINALIZED'),
    []
  );

  // Total production cost (all finalized — mock data is from 2024)
  const totalProdCost = useMemo(
    () => finalizedCosts.reduce((s, c) => s + c.totalCost, 0),
    [finalizedCosts]
  );

  // Average margin
  const avgMargin = useMemo(() => {
    if (finalizedCosts.length === 0) return 0;
    return finalizedCosts.reduce((s, c) => s + c.marginPct, 0) / finalizedCosts.length;
  }, [finalizedCosts]);

  // Cost variances — orders with adverse variance > 10%
  const adverseVarianceCount = useMemo(() => {
    const grouped: Record<string, MockProductionCost[]> = {};
    mockProductionCosts.forEach((c) => {
      if (!grouped[c.productionOrderId]) grouped[c.productionOrderId] = [];
      grouped[c.productionOrderId].push(c);
    });

    let count = 0;
    Object.values(grouped).forEach((costs) => {
      const std = costs.find((c) => c.costingMethod === 'STANDARD');
      const act = costs.find((c) => c.costingMethod === 'ACTUAL');
      if (std && act) {
        const variance = std.totalCost - act.totalCost; // negative = adverse
        const pct = (variance / std.totalCost) * 100;
        if (pct < -10) count++;
      }
    });
    return count;
  }, []);

  // Pending costing: COMPLETED POs without ANY cost record
  const pendingCostingCount = useMemo(() => {
    const costedPOIds = new Set(mockProductionCosts.map((c) => c.productionOrderId));
    return mockProductionOrders.filter(
      (po) => po.status === 'COMPLETED' && !costedPOIds.has(po.id)
    ).length;
  }, []);

  // Donut chart data — aggregate all finalized costs
  const donutData = useMemo(() => {
    const mat = finalizedCosts.reduce((s, c) => s + c.materialCost, 0);
    const lab = finalizedCosts.reduce((s, c) => s + c.labourCost, 0);
    const oh = finalizedCosts.reduce((s, c) => s + c.overheadCost, 0);
    const rej = finalizedCosts.reduce((s, c) => s + c.rejectionCost, 0);
    const total = mat + lab + oh + rej;
    if (total === 0) {
      return [
        { label: 'Material', value: 0, pct: 0, color: '#3B82F6' },
        { label: 'Labour', value: 0, pct: 0, color: '#22C55E' },
        { label: 'Overhead', value: 0, pct: 0, color: '#F59E0B' },
        { label: 'Rejection', value: 0, pct: 0, color: '#EF4444' },
      ];
    }
    const matPct = (mat / total) * 100;
    const labPct = (lab / total) * 100;
    const ohPct = (oh / total) * 100;
    const rejPct = (rej / total) * 100;
    return [
      { label: 'Material', value: mat, pct: matPct, color: '#3B82F6' },
      { label: 'Labour', value: lab, pct: labPct, color: '#22C55E' },
      { label: 'Overhead', value: oh, pct: ohPct, color: '#F59E0B' },
      { label: 'Rejection', value: rej, pct: rejPct, color: '#EF4444' },
    ];
  }, [finalizedCosts]);

  const donutGradient = useMemo(() => {
    let current = 0;
    const stops: string[] = [];
    donutData.forEach((d) => {
      if (d.pct > 0) {
        const end = current + d.pct;
        stops.push(`${d.color} ${current.toFixed(2)}% ${end.toFixed(2)}%`);
        current = end;
      }
    });
    if (stops.length === 0) return 'conic-gradient(#E5E7EB 0% 100%)';
    return `conic-gradient(${stops.join(', ')})`;
  }, [donutData]);

  // Product Cost Matrix
  const productMatrix = useMemo(() => {
    const grouped: Record<string, MockProductionCost[]> = {};
    mockProductionCosts.forEach((c) => {
      if (!grouped[c.productId]) grouped[c.productId] = [];
      grouped[c.productId].push(c);
    });

    return Object.entries(grouped).map(([productId, costs]) => {
      const stdCost = costs.find((c) => c.costingMethod === 'STANDARD');
      const actCost = costs.find((c) => c.costingMethod === 'ACTUAL');
      const latestFinalized = costs
        .filter((c) => c.status === 'FINALIZED')
        .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime())[0];

      const item = mockItems.find((it) => it.id === productId);
      const variance =
        stdCost && actCost ? stdCost.costPerUnit - actCost.costPerUnit : null;

      return {
        productId,
        productName: costs[0]?.productName ?? 'Unknown',
        variantName: costs[0]?.variantName,
        stdCostPerUnit: stdCost?.costPerUnit ?? null,
        actCostPerUnit: actCost?.costPerUnit ?? null,
        variance,
        salePrice: costs[0]?.salePrice ?? 0,
        marginPct: latestFinalized?.marginPct ?? 0,
        lastUpdated: latestFinalized?.calculatedAt ?? costs[0]?.calculatedAt,
        hasFinalized: !!latestFinalized,
      };
    });
  }, []);

  const handleBatchUpdateStandardCost = () => {
    let updated = 0;
    productMatrix.forEach((row) => {
      if (row.hasFinalized && row.actCostPerUnit !== null) {
        const item = mockItems.find((it) => it.id === row.productId);
        if (item) {
          item.standardCost = row.actCostPerUnit;
          updated++;
        }
      }
    });
    showToast(`Updated standard cost for ${updated} product(s)`);
  };

  const handleUpdateProductStandardCost = (productId: string, value: number) => {
    const item = mockItems.find((it) => it.id === productId);
    if (item) {
      item.standardCost = value;
      showToast(`Standard cost updated for ${item.name}`);
    }
  };

  const marginColor = (pct: number) => {
    if (pct > 30) return 'text-green-600';
    if (pct >= 10) return 'text-amber-600';
    return 'text-red-600';
  };

  const varianceColor = (v: number | null) => {
    if (v === null) return 'text-gray-400';
    if (v < 0) return 'text-red-600';
    return 'text-green-600';
  };

  const avgMarginColor = avgMargin >= 30 ? 'text-green-600' : avgMargin >= 10 ? 'text-amber-600' : 'text-red-600';

  return (
    <AppLayout>
      <div className="space-y-6 p-4 md:p-6">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">Manufacturing Costing</h1>
            <p className="text-sm text-gray-500 mt-0.5">Overview of production costs and profitability</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => navigate('/manufacturing/costing/setup')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-settings-3-line" />
              Setup
            </button>
            <button
              onClick={() => navigate('/manufacturing/costing/orders')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-calculator-line" />
              Orders
            </button>
            <button
              onClick={() => navigate('/manufacturing/costing/variance')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-line-chart-line" />
              Variance
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-chart-line" />
              Reports
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Production Cost */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs text-gray-500 mb-1">Total Production Cost</div>
            <div className="text-xl font-bold text-gray-900">₹{totalProdCost.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">All finalized costs</div>
          </div>

          {/* Card 2: Average Margin */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs text-gray-500 mb-1">Average Margin</div>
            <div className={`text-xl font-bold ${avgMarginColor}`}>
              {avgMargin.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-400 mt-1">Across all finalized products</div>
          </div>

          {/* Card 3: Cost Variances */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs text-gray-500 mb-1">Cost Variances</div>
            <div className={`text-xl font-bold ${adverseVarianceCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {adverseVarianceCount}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {adverseVarianceCount > 0 ? 'Orders with adverse variance > 10%' : 'No adverse variances'}
            </div>
          </div>

          {/* Card 4: Pending Costing */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="text-xs text-gray-500 mb-1">Pending Costing</div>
            <div className={`text-xl font-bold ${pendingCostingCount > 0 ? 'text-amber-600' : 'text-green-600'}`}>
              {pendingCostingCount}
            </div>
            <div className="text-xs text-gray-400 mt-1">Completed POs without cost record</div>
          </div>
        </div>

        {/* Cost Breakdown + Donut Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white border border-gray-200 rounded-lg p-5 flex flex-col items-center justify-center">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 self-start">Cost Breakdown</h3>
            <div className="relative">
              <div
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: donutGradient,
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-700">₹{(totalProdCost / 1000).toFixed(0)}K</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs">
              {donutData.map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-gray-600">{d.label}</span>
                  <span className="font-medium text-gray-900">{d.pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Product Cost Matrix</h3>
              <button
                onClick={handleBatchUpdateStandardCost}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-refresh-line" />
                Update All Standard Costs
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Product</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Std Cost</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Act Cost</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Variance</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Sale Price</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-700">Margin</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Last Updated</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productMatrix.map((row) => (
                    <tr key={row.productId} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5">
                        <div className="font-medium text-gray-900">{row.productName}</div>
                        {row.variantName && (
                          <div className="text-xs text-gray-500">{row.variantName}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">
                        {row.stdCostPerUnit !== null ? `₹${row.stdCostPerUnit.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">
                        {row.actCostPerUnit !== null ? `₹${row.actCostPerUnit.toLocaleString()}` : '-'}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium ${varianceColor(row.variance)}`}>
                        {row.variance !== null ? (
                          <>
                            {row.variance < 0 ? '↑' : '↓'} ₹{Math.abs(row.variance).toLocaleString()}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right text-gray-700">
                        ₹{row.salePrice.toLocaleString()}
                      </td>
                      <td className={`px-3 py-2.5 text-right font-medium ${marginColor(row.marginPct)}`}>
                        {row.marginPct.toFixed(1)}%
                      </td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">
                        {new Date(row.lastUpdated).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-3 py-2.5">
                        {row.hasFinalized && row.actCostPerUnit !== null ? (
                          <button
                            onClick={() =>
                              handleUpdateProductStandardCost(row.productId, row.actCostPerUnit!)
                            }
                            className="text-xs text-gray-600 hover:text-gray-900 underline cursor-pointer whitespace-nowrap"
                          >
                            Update Std Cost
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {productMatrix.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-6 text-center text-gray-500 text-sm">
                        No cost data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Recent Cost Records */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Cost Records</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium text-gray-700">PO Number</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Method</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Total Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Cost/Unit</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-700">Margin %</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mockProductionCosts
                  .sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime())
                  .map((cost) => (
                    <tr key={cost.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{cost.productionOrderNumber}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {cost.productName}
                        {cost.variantName && (
                          <div className="text-xs text-gray-500">{cost.variantName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            cost.costingMethod === 'STANDARD'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {cost.costingMethod}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">₹{cost.totalCost.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-700">₹{cost.costPerUnit.toLocaleString()}</td>
                      <td className={`px-4 py-3 text-right font-medium ${marginColor(cost.marginPct)}`}>
                        {cost.marginPct.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            cost.status === 'DRAFT'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-green-50 text-green-700'
                          }`}
                        >
                          {cost.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}