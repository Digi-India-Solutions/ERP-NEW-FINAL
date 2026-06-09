import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import {
  mockProductionOrders,
  mockBOMItems,
  mockItems,
} from '@/mocks/masters';
import { mockProductionCosts, mockCostElements } from '@/mocks/costing';
import { mockProductionEntries } from '@/mocks/masters';

function formatCurrency(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function formatDate(d: string | null) {
  if (!d) return '-';
  const date = new Date(d);
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers.join(','), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function ManufacturingReportsPage() {
  const navigate = useNavigate();

  const [dateFrom, setDateFrom] = useState('2024-04-01');
  const [dateTo, setDateTo] = useState('2024-04-30');
  const [poStatusFilter, setPoStatusFilter] = useState('All');
  const [poTypeFilter, setPoTypeFilter] = useState('All');

  // ── Filter orders by date range ──
  const filteredOrders = useMemo(() => {
    return mockProductionOrders.filter((po) => {
      const poStart = po.plannedStartDate;
      const poEnd = po.plannedEndDate || po.plannedStartDate;
      const inRange = poStart >= dateFrom && poEnd <= dateTo;
      if (!inRange) return false;
      if (poStatusFilter !== 'All') {
        const filterMap: Record<string, string> = {
          Draft: 'DRAFT',
          Planned: 'PLANNED',
          'In Progress': 'IN_PROGRESS',
          Completed: 'COMPLETED',
        };
        if (po.status !== filterMap[poStatusFilter]) return false;
      }
      if (poTypeFilter !== 'All' && po.type !== poTypeFilter) return false;
      return true;
    });
  }, [dateFrom, dateTo, poStatusFilter, poTypeFilter]);

  // ── Production Summary data ──
  const prodSummary = useMemo(() => {
    const totalPlanned = filteredOrders.reduce((s, o) => s + o.plannedQty, 0);
    const totalCompleted = filteredOrders.reduce((s, o) => s + o.completedQty, 0);
    const avgCompletion = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;
    const completedCount = filteredOrders.filter((o) => o.status === 'COMPLETED').length;
    return { totalPlanned, totalCompleted, avgCompletion, completedCount };
  }, [filteredOrders]);

  function getCompletionColor(pct: number) {
    if (pct >= 100) return 'text-emerald-600';
    if (pct >= 50) return 'text-amber-600';
    return 'text-rose-600';
  }

  function getStatusBadge(status: string) {
    const map: Record<string, string> = {
      DRAFT: 'bg-slate-100 text-slate-700',
      PLANNED: 'bg-sky-100 text-sky-700',
      IN_PROGRESS: 'bg-amber-100 text-amber-700',
      COMPLETED: 'bg-emerald-100 text-emerald-700',
      ON_HOLD: 'bg-rose-100 text-rose-700',
      CANCELLED: 'bg-gray-100 text-gray-500',
    };
    return map[status] || 'bg-slate-100 text-slate-700';
  }

  // ── Material Consumption data ──
  const materialData = useMemo(() => {
    // Build map of itemId -> total actual consumed across all production entries
    const actualConsumed: Record<string, { qty: number; cost: number }> = {};

    // Sum production entries by item
    // We need to map production entries to items. For this report, we'll use
    // material cost elements from finalized production costs as the source of actual consumption
    mockProductionCosts
      .filter((pc) => pc.status === 'FINALIZED')
      .forEach((pc) => {
        const elems = mockCostElements.filter((ce) => ce.productionCostId === pc.id && ce.type === 'MATERIAL');
        elems.forEach((ce) => {
          // Try to find item by description matching
          const item = mockItems.find(
            (it) => it.name === ce.description || ce.description.includes(it.name)
          );
          if (item) {
            const existing = actualConsumed[item.id] || { qty: 0, cost: 0 };
            actualConsumed[item.id] = {
              qty: existing.qty + ce.qty,
              cost: existing.cost + ce.amount,
            };
          }
        });
      });

    // Also factor in production entries if they have item-level data
    // For items referenced in production entries, add producedQty as proxy for consumption
    mockProductionEntries.forEach((pe) => {
      // Find the BOM items for this production order
      const po = mockProductionOrders.find((o) => o.id === pe.productionOrderId);
      if (po) {
        const bomItems = mockBOMItems.filter((bi) => bi.bomId === po.bomId && bi.level > 0);
        bomItems.forEach((bi) => {
          const factor = pe.producedQty / po.plannedQty;
          const consumedQty = bi.qtyPerUnit * pe.producedQty;
          const existing = actualConsumed[bi.itemId] || { qty: 0, cost: 0 };
          const item = mockItems.find((it) => it.id === bi.itemId);
          const rate = item?.purchaseRate || item?.standardCost || 0;
          actualConsumed[bi.itemId] = {
            qty: existing.qty + consumedQty,
            cost: existing.cost + consumedQty * rate,
          };
        });
      }
    });

    // Build report rows from all BOM items (level > 0) that are raw materials / consumables
    const rows = mockBOMItems
      .filter((bi) => bi.level > 0)
      .map((bi) => {
        const item = mockItems.find((it) => it.id === bi.itemId);
        const act = actualConsumed[bi.itemId] || { qty: 0, cost: 0 };
        // Standard = total planned across all POs using this BOM item
        const totalPlannedQty = mockProductionOrders
          .filter((po) => po.bomId === bi.bomId)
          .reduce((s, po) => s + bi.qtyPerUnit * po.plannedQty, 0);
        const variance = act.qty - totalPlannedQty;
        const variancePct = totalPlannedQty > 0 ? (variance / totalPlannedQty) * 100 : 0;
        const unitCost = item?.purchaseRate || item?.standardCost || bi.standardCost || 0;
        const varianceValue = variance * unitCost;
        return {
          itemName: item?.name || bi.itemName,
          itemType: item?.itemType || bi.itemType,
          bomQtyPerUnit: bi.qtyPerUnit,
          unit: bi.unit,
          plannedQty: totalPlannedQty,
          actualQty: act.qty,
          variance,
          variancePct,
          unitCost,
          varianceValue,
          standardCost: bi.standardCost,
        };
      })
      .filter((r) => r.plannedQty > 0 || r.actualQty > 0);

    const totalMaterialCost = rows.reduce((s, r) => s + r.actualQty * r.unitCost, 0);
    const totalVarianceValue = rows.reduce((s, r) => s + r.varianceValue, 0);

    return { rows, totalMaterialCost, totalVarianceValue };
  }, []);

  // ── Export handlers ──
  const exportProductionCSV = () => {
    const headers = ['PO Number', 'Product', 'Variant', 'Type', 'Planned Qty', 'Completed Qty', 'Rejected Qty', 'Completion %', 'Status', 'Start Date', 'End Date'];
    const rows = filteredOrders.map((o) => [
      o.poNumber,
      o.productName,
      o.variantName || '-',
      o.type,
      o.plannedQty,
      o.completedQty,
      o.rejectedQty,
      o.plannedQty > 0 ? ((o.completedQty / o.plannedQty) * 100).toFixed(1) + '%' : '0%',
      o.status,
      o.plannedStartDate,
      o.plannedEndDate,
    ]);
    downloadCSV('production-summary.csv', headers, rows);
  };

  const exportMaterialCSV = () => {
    const headers = ['Item Name', 'Item Type', 'BOM Qty/Unit', 'Unit', 'Planned Qty', 'Actual Consumed', 'Variance', 'Variance %', 'Unit Cost', 'Variance Value'];
    const rows = materialData.rows.map((r) => [
      r.itemName,
      r.itemType,
      r.bomQtyPerUnit,
      r.unit,
      r.plannedQty.toFixed(2),
      r.actualQty.toFixed(2),
      r.variance.toFixed(2),
      r.variancePct.toFixed(1) + '%',
      formatCurrency(r.unitCost),
      formatCurrency(r.varianceValue),
    ]);
    downloadCSV('material-consumption.csv', headers, rows);
  };

  const exportAllCSV = () => {
    const headers = ['Report Type', 'PO Number / Item', 'Product / Type', 'Qty / Variance', 'Status / Value'];
    const rows: (string | number)[][] = [];
    filteredOrders.forEach((o) => {
      rows.push([
        'Production',
        o.poNumber,
        o.productName,
        o.plannedQty,
        o.status,
      ]);
    });
    materialData.rows.forEach((r) => {
      rows.push([
        'Material',
        r.itemName,
        r.itemType,
        r.variance.toFixed(2),
        formatCurrency(r.varianceValue),
      ]);
    });
    downloadCSV('manufacturing-report-all.csv', headers, rows);
  };

  return (
    <AppLayout>
      <div className="p-6">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Manufacturing Reports</h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Production, quality and efficiency reports
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-[#64748b]">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm border border-[#e2e8f0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
              />
              <label className="text-xs text-[#64748b]">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm border border-[#e2e8f0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4f46e5]"
              />
              <button
                onClick={() => {}}
                className="text-sm bg-[#4f46e5] text-white px-4 py-1.5 rounded-lg hover:bg-[#4338ca] transition-colors cursor-pointer whitespace-nowrap"
              >
                Apply
              </button>
            </div>
            <button
              onClick={exportAllCSV}
              className="text-sm border border-[#e2e8f0] text-[#475569] px-4 py-1.5 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <i className="ri-download-line" />
              Export All CSV
            </button>
          </div>
        </div>

        {/* ── Section 1: Production Summary ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-[#1e293b]">Production Summary</h3>
            <div className="flex items-center gap-3">
              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="text-xs border border-[#e2e8f0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4f46e5] cursor-pointer"
              >
                <option>All</option>
                <option>Draft</option>
                <option>Planned</option>
                <option>In Progress</option>
                <option>Completed</option>
              </select>
              <select
                value={poTypeFilter}
                onChange={(e) => setPoTypeFilter(e.target.value)}
                className="text-xs border border-[#e2e8f0] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#4f46e5] cursor-pointer"
              >
                <option>All</option>
                <option>MTO</option>
                <option>MTS</option>
              </select>
              <button
                onClick={exportProductionCSV}
                className="text-xs border border-[#e2e8f0] text-[#475569] px-3 py-1.5 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              >
                <i className="ri-download-line" />
                Export CSV
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">PO Number</th>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-left px-4 py-3 font-medium">Variant</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-right px-4 py-3 font-medium">Planned Qty</th>
                  <th className="text-right px-4 py-3 font-medium">Completed Qty</th>
                  <th className="text-right px-4 py-3 font-medium">Rejected Qty</th>
                  <th className="text-right px-4 py-3 font-medium">Completion %</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Start Date</th>
                  <th className="text-left px-4 py-3 font-medium">End Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((po) => {
                  const completion = po.plannedQty > 0 ? (po.completedQty / po.plannedQty) * 100 : 0;
                  return (
                    <tr key={po.id} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="px-5 py-3 font-medium text-[#1e293b]">{po.poNumber}</td>
                      <td className="px-4 py-3 text-[#475569]">{po.productName}</td>
                      <td className="px-4 py-3 text-[#475569]">{po.variantName || '-'}</td>
                      <td className="px-4 py-3 text-[#475569]">{po.type}</td>
                      <td className="px-4 py-3 text-right text-[#475569]">{po.plannedQty}</td>
                      <td className="px-4 py-3 text-right text-[#475569]">{po.completedQty}</td>
                      <td className="px-4 py-3 text-right text-[#475569]">{po.rejectedQty}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${getCompletionColor(completion)}`}>
                        {completion.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${getStatusBadge(po.status)}`}>
                          {po.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#475569]">{formatDate(po.plannedStartDate)}</td>
                      <td className="px-4 py-3 text-[#475569]">{formatDate(po.plannedEndDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f8fafc] border-t-2 border-[#e2e8f0] font-semibold text-[#1e293b]">
                  <td className="px-5 py-3" colSpan={4}>
                    Total ({filteredOrders.length} orders)
                  </td>
                  <td className="px-4 py-3 text-right">{prodSummary.totalPlanned}</td>
                  <td className="px-4 py-3 text-right">{prodSummary.totalCompleted}</td>
                  <td className="px-4 py-3 text-right">
                    {filteredOrders.reduce((s, o) => s + o.rejectedQty, 0)}
                  </td>
                  <td className={`px-4 py-3 text-right ${getCompletionColor(prodSummary.avgCompletion)}`}>
                    {prodSummary.avgCompletion.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    Completed: {prodSummary.completedCount} / {filteredOrders.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Section 2: Material Consumption vs BOM ── */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
            <h3 className="text-sm font-semibold text-[#1e293b]">Material Consumption vs BOM</h3>
            <button
              onClick={exportMaterialCSV}
              className="text-xs border border-[#e2e8f0] text-[#475569] px-3 py-1.5 rounded-lg hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <i className="ri-download-line" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] text-[#64748b] text-xs uppercase tracking-wider">
                  <th className="text-left px-5 py-3 font-medium">Item Name</th>
                  <th className="text-left px-4 py-3 font-medium">Item Type</th>
                  <th className="text-right px-4 py-3 font-medium">BOM Qty/Unit</th>
                  <th className="text-right px-4 py-3 font-medium">Actual Consumed</th>
                  <th className="text-right px-4 py-3 font-medium">Variance</th>
                  <th className="text-right px-4 py-3 font-medium">Variance %</th>
                  <th className="text-right px-4 py-3 font-medium">Unit Cost</th>
                  <th className="text-right px-4 py-3 font-medium">Variance Value</th>
                </tr>
              </thead>
              <tbody>
                {materialData.rows.map((row) => {
                  const isOver = row.variance > 0;
                  const isUnder = row.variance < 0;
                  const isExact = row.variance === 0;
                  return (
                    <tr key={row.itemName} className="border-t border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td className="px-5 py-3 font-medium text-[#1e293b]">{row.itemName}</td>
                      <td className="px-4 py-3 text-[#475569]">{row.itemType}</td>
                      <td className="px-4 py-3 text-right text-[#475569]">{row.bomQtyPerUnit.toFixed(2)} {row.unit}</td>
                      <td className="px-4 py-3 text-right text-[#475569]">{row.actualQty.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${isOver ? 'text-rose-600' : isUnder ? 'text-emerald-600' : 'text-[#64748b]'}`}>
                        {isOver ? '↑' : isUnder ? '↓' : ''} {Math.abs(row.variance).toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${isOver ? 'text-rose-600' : isUnder ? 'text-emerald-600' : 'text-[#64748b]'}`}>
                        {isExact ? '0.0%' : `${row.variancePct.toFixed(1)}%`}
                      </td>
                      <td className="px-4 py-3 text-right text-[#475569]">{formatCurrency(row.unitCost)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${isOver ? 'text-rose-600' : isUnder ? 'text-emerald-600' : 'text-[#64748b]'}`}>
                        {isOver ? '+' : isUnder ? '' : ''}{formatCurrency(row.varianceValue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[#f8fafc] border-t-2 border-[#e2e8f0] font-semibold text-[#1e293b]">
                  <td className="px-5 py-3" colSpan={2}>
                    Total ({materialData.rows.length} items)
                  </td>
                  <td className="px-4 py-3 text-right" colSpan={3} />
                  <td className="px-4 py-3 text-right" />
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(materialData.totalMaterialCost)}
                  </td>
                  <td className={`px-4 py-3 text-right ${materialData.totalVarianceValue > 0 ? 'text-rose-600' : materialData.totalVarianceValue < 0 ? 'text-emerald-600' : ''}`}>
                    {materialData.totalVarianceValue > 0 ? '+' : ''}{formatCurrency(materialData.totalVarianceValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ── Section 3: Quick Links to Existing Reports ── */}
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b] mb-4">Quick Links</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                title: 'Machine Utilization & OEE',
                desc: 'View real-time OEE, availability and performance metrics',
                icon: 'ri-dashboard-line',
                iconColor: 'text-sky-600',
                iconBg: 'bg-sky-50',
                path: '/manufacturing/live',
              },
              {
                title: 'Quality & Inspection Reports',
                desc: 'Incoming, in-process and final QC pass rates and trends',
                icon: 'ri-shield-check-line',
                iconColor: 'text-emerald-600',
                iconBg: 'bg-emerald-50',
                path: '/manufacturing/qc/incoming',
              },
              {
                title: 'Rejection & NCR Analysis',
                desc: 'NCR trends, rejection by stage and supplier scorecards',
                icon: 'ri-file-warning-line',
                iconColor: 'text-amber-600',
                iconBg: 'bg-amber-50',
                path: '/manufacturing/qc/ncr',
              },
              {
                title: 'Cost Variance & Profitability',
                desc: 'Standard vs actual cost comparison and margin by product',
                icon: 'ri-bar-chart-line',
                iconColor: 'text-rose-600',
                iconBg: 'bg-rose-50',
                path: '/manufacturing/costing/variance',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white border border-[#e2e8f0] rounded-xl p-5 hover:border-[#4f46e5]/30 hover:bg-[#f8fafc] transition-all"
              >
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center mb-3`}>
                  <i className={`${card.icon} text-lg ${card.iconColor}`} />
                </div>
                <h4 className="text-sm font-semibold text-[#1e293b] mb-1">{card.title}</h4>
                <p className="text-xs text-[#64748b] leading-relaxed mb-4">{card.desc}</p>
                <button
                  onClick={() => navigate(card.path)}
                  className="text-xs font-medium text-[#4f46e5] hover:text-[#4338ca] transition-colors cursor-pointer flex items-center gap-1"
                >
                  View Report <i className="ri-arrow-right-line" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}