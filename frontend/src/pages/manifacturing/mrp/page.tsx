import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import {
  mockItems,
  mockMRPRuns,
  mockMRPResults,
  mockMRPSuggestions,
  mockProductionOrders,
  mockBOMItems,
  mockWarehouseStock,
  mockMaterialReservations,
  type MockMRPRun,
  type MockMRPResult,
  type MockMRPSuggestion,
} from '@/mocks/masters';
import { mockPurchaseOrders } from '@/mocks/billing';
import { formatINR, formatDateIST, toInputDate } from '@/utils/format';

const statusConfig: Record<
  string,
  { bg: string; text: string; dot: string; label: string }
> = {
  RUNNING: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
    label: 'Running',
  },
  COMPLETED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
    label: 'Completed',
  },
  FAILED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    dot: 'bg-red-500',
    label: 'Failed',
  },
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatRunDate(d: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d));
}

export default function MRPRunPage() {
  const navigate = useNavigate();
  const { success } = useToast();
  const [runs, setRuns] = useState<MockMRPRun[]>([...mockMRPRuns]);
  const [results, setResults] = useState<MockMRPResult[]>([...mockMRPResults]);
  const [suggestions, setSuggestions] = useState<MockMRPSuggestion[]>([
    ...mockMRPSuggestions,
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simRunning, setSimRunning] = useState(false);
  const [emailAlertModal, setEmailAlertModal] = useState(false);
  const [lastRunCriticalCount, setLastRunCriticalCount] = useState(0);

  const today = useMemo(() => new Date(), []);
  const [fromDate, setFromDate] = useState(toInputDate(today));
  const [toDate, setToDate] = useState(toInputDate(addDays(today, 30)));
  const [includeSales, setIncludeSales] = useState(true);
  const [includeProduction, setIncludeProduction] = useState(true);
  const [includeSafety, setIncludeSafety] = useState(true);
  const [includeReorder, setIncludeReorder] = useState(true);
  const [autoPO, setAutoPO] = useState(false);
  const [autoProd, setAutoProd] = useState(false);
  const [considerReceipts, setConsiderReceipts] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const latestRun = useMemo(() => {
    return runs.length > 0 ? runs[runs.length - 1] : null;
  }, [runs]);

  const latestResults = useMemo(() => {
    if (!latestRun) return [];
    return results.filter((r) => r.mrpRunId === latestRun.id);
  }, [results, latestRun]);

  const latestSuggestions = useMemo(() => {
    if (!latestRun) return [];
    return suggestions.filter((s) => s.mrpRunId === latestRun.id);
  }, [suggestions, latestRun]);

  const filteredRuns = useMemo(() => {
    return runs
      .filter((run) => {
        const matchesSearch =
          !searchTerm ||
          run.runNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          run.runBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
          run.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          '';
        const matchesStatus =
          statusFilter === 'All' || run.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort(
        (a, b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime(),
      );
  }, [runs, searchTerm, statusFilter]);

  const openModal = useCallback(() => {
    setFromDate(toInputDate(today));
    setToDate(toInputDate(addDays(today, 30)));
    setIncludeSales(true);
    setIncludeProduction(true);
    setIncludeSafety(true);
    setIncludeReorder(true);
    setAutoPO(false);
    setAutoProd(false);
    setConsiderReceipts(true);
    setModalOpen(true);
  }, [today]);

  const runSequence = useMemo(() => {
    const year = new Date().getFullYear();
    const existing = runs.filter((r) => r.runNumber.startsWith(`MRP-${year}`));
    const seq = existing.length + 1;
    return String(seq).padStart(3, '0');
  }, [runs]);

  const simulateMRP = useCallback(async () => {
    setSimRunning(true);
    setSimStep(1);
    await new Promise((r) => setTimeout(r, 500));
    setSimStep(2);
    await new Promise((r) => setTimeout(r, 500));
    setSimStep(3);
    await new Promise((r) => setTimeout(r, 500));
    setSimStep(4);
    await new Promise((r) => setTimeout(r, 500));
    setSimStep(5);
    await new Promise((r) => setTimeout(r, 500));
    setSimStep(6);
    await new Promise((r) => setTimeout(r, 500));

    const year = new Date().getFullYear();
    const seq = String(
      runs.filter((r) => r.runNumber.startsWith(`MRP-${year}`)).length + 1,
    ).padStart(3, '0');
    const runNumber = `MRP-${year}-${seq}`;
    const runId = `mrp-${Date.now()}`;
    const runDate = toInputDate(new Date());

    // Build gross requirements from active production orders
    const grossReq: Record<string, number> = {};
    const activeProductionOrders = mockProductionOrders.filter(
      (po) => po.status !== 'COMPLETED' && po.status !== 'CANCELLED',
    );

    activeProductionOrders.forEach((po) => {
      // Add requirement for the product itself (finished good)
      if (po.productId) {
        grossReq[po.productId] = (grossReq[po.productId] || 0) + po.plannedQty;
      }
      // Explode BOM for components
      const bomItems = mockBOMItems.filter(
        (bi) => bi.bomId === po.bomId && bi.level > 0,
      );
      bomItems.forEach((bi) => {
        const qty = po.plannedQty * bi.effectiveQty;
        grossReq[bi.itemId] = (grossReq[bi.itemId] || 0) + qty;
      });
    });

    // Include reorder point triggers
    if (includeReorder) {
      mockItems.forEach((item) => {
        const stock = mockWarehouseStock['wh-001']?.[item.id] || 0;
        if (stock <= item.reorderPoint) {
          grossReq[item.id] =
            (grossReq[item.id] || 0) + (item.reorderQty || 10);
        }
      });
    }

    // Include safety stock
    if (includeSafety) {
      mockItems.forEach((item) => {
        const minStock = item.minStockLevel || 0;
        if (minStock > 0) {
          grossReq[item.id] = (grossReq[item.id] || 0) + minStock * 0.5;
        }
      });
    }

    const newResults: MockMRPResult[] = [];
    const newSuggestions: MockMRPSuggestion[] = [];
    let shortageCount = 0;
    let purchaseSuggestionCount = 0;
    let productionSuggestionCount = 0;
    let totalPurchaseValue = 0;

    mockItems.forEach((item) => {
      if (!item.isActive) return;
      const currentStock = mockWarehouseStock['wh-001']?.[item.id] || 0;
      const reservedStock = mockMaterialReservations
        .filter((mr) => mr.itemId === item.id && mr.status !== 'RELEASED')
        .reduce((sum, mr) => sum + mr.reservedQty, 0);
      const availableStock = Math.max(0, currentStock - reservedStock);
      const gross = Math.round((grossReq[item.id] || 0) * 100) / 100;
      const netRequirement = Math.max(0, gross - availableStock);
      const scheduledReceipts = 0;
      const finalShortage = netRequirement;

      // (status/suggestedAction computed below after scheduled receipts adjustment)

      // Calculate scheduled receipts from open POs (PENDING or PARTIAL)
      let scheduledReceiptsQty = 0;
      if (considerReceipts) {
        mockPurchaseOrders
          .filter(
            (po) =>
              (po.status === 'PENDING' || po.status === 'PARTIAL') &&
              po.expectedDelivery &&
              po.expectedDelivery <= toDate,
          )
          .forEach((po) => {
            po.items.forEach((poItem) => {
              if (poItem.itemId === item.id) {
                scheduledReceiptsQty += poItem.orderedQty - poItem.receivedQty;
              }
            });
          });
      }

      // Recalculate with scheduled receipts
      const netReqWithReceipts = Math.max(
        0,
        gross - availableStock - scheduledReceiptsQty,
      );
      const finalShortageWithReceipts = netReqWithReceipts;

      // Update local variables to use receipts-adjusted values
      const finalNetReq = netReqWithReceipts;
      const finalShortageAdj = finalShortageWithReceipts;

      // Re-evaluate status with adjusted values
      let adjStatus: MockMRPResult['status'] = 'SUFFICIENT';
      let adjSuggestedAction: MockMRPResult['suggestedAction'] = 'NONE';
      let adjSuggestedQty = 0;
      let adjEstimatedCost = 0;

      if (finalShortageAdj > 0) {
        shortageCount++;
        if (currentStock <= item.reorderPoint) {
          adjStatus = 'CRITICAL';
        } else {
          adjStatus = 'SHORT';
        }
        if (
          item.itemType === 'FINISHED_GOOD' ||
          item.itemType === 'SEMI_FINISHED'
        ) {
          adjSuggestedAction = 'PRODUCE';
          adjSuggestedQty = Math.ceil(finalShortageAdj);
          adjEstimatedCost =
            adjSuggestedQty * (item.standardCost || item.purchaseRate || 0);
          productionSuggestionCount++;
        } else {
          adjSuggestedAction = 'PURCHASE';
          adjSuggestedQty = Math.ceil(finalShortageAdj);
          adjEstimatedCost =
            adjSuggestedQty * (item.purchaseRate || item.standardCost || 0);
          purchaseSuggestionCount++;
          totalPurchaseValue += adjEstimatedCost;
        }
      } else if (finalShortageAdj === 0 && finalShortage > 0) {
        // Was going to be short but scheduled receipts cover it
        adjStatus = 'SUFFICIENT';
      }

      // Override the previously calculated counters for this item (undo double-count)
      // Note: we only add to counts in the adj block above, so we need to reset the old ones

      const resultId = `mrp-res-${Date.now()}-${item.id}`;
      newResults.push({
        id: resultId,
        mrpRunId: runId,
        itemId: item.id,
        itemName: item.name,
        itemCode: item.code,
        itemType: item.itemType,
        isVariant: item.isVariant,
        variantName: item.variantName,
        unit: item.unitName,
        grossRequirement: gross,
        currentStock,
        reservedStock,
        availableStock,
        netRequirement: finalNetReq,
        scheduledReceipts: scheduledReceiptsQty,
        finalShortage: finalShortageAdj,
        supplierLeadTimeDays: item.leadTimeDays || 0,
        orderDate: runDate,
        requiredDate: toDate,
        status: adjStatus,
        suggestedAction: adjSuggestedAction,
        suggestedQty: adjSuggestedQty,
        estimatedCost: adjEstimatedCost,
      });

      if (adjSuggestedQty > 0) {
        const sugId = `sug-${Date.now()}-${item.id}`;
        newSuggestions.push({
          id: sugId,
          mrpRunId: runId,
          type: adjSuggestedAction === 'PURCHASE' ? 'PURCHASE' : 'PRODUCTION',
          itemId: item.id,
          itemName: item.name,
          itemCode: item.code,
          variantName: item.variantName,
          suggestedQty: adjSuggestedQty,
          unit: item.unitName,
          requiredDate: toDate,
          orderByDate: toInputDate(
            addDays(new Date(), Math.max(0, (item.leadTimeDays || 0) - 2)),
          ),
          estimatedCost: adjEstimatedCost,
          supplierId: null,
          supplierName: null,
          leadTimeDays: item.leadTimeDays || 0,
          priority: adjStatus === 'CRITICAL' ? 'URGENT' : 'NORMAL',
          status: 'PENDING',
          convertedDocId: null,
          convertedDocNumber: null,
          notes: null,
        });
      }
    });

    // Auto-create draft orders
    if (autoPO) {
      newSuggestions
        .filter((s) => s.type === 'PURCHASE')
        .forEach((s) => {
          s.status = 'CONVERTED';
          s.convertedDocNumber = `PO-${year}-${String(Math.floor(Math.random() * 900) + 100)}`;
        });
      success(
        `${newSuggestions.filter((s) => s.type === 'PURCHASE').length} draft purchase orders created`,
      );
    }
    if (autoProd) {
      newSuggestions
        .filter((s) => s.type === 'PRODUCTION')
        .forEach((s) => {
          s.status = 'CONVERTED';
          s.convertedDocNumber = `PRD-${year}-${String(Math.floor(Math.random() * 900) + 100)}`;
        });
      success(
        `${newSuggestions.filter((s) => s.type === 'PRODUCTION').length} draft production orders created`,
      );
    }

    const newRun: MockMRPRun = {
      id: runId,
      runNumber,
      runDate,
      runBy: 'Admin User',
      fromDate,
      toDate,
      status: 'COMPLETED',
      demandOrders:
        activeProductionOrders.filter((po) => po.salesOrderId).length +
        (includeSafety ? 1 : 0) +
        (includeReorder ? 1 : 0),
      productionOrders: activeProductionOrders.length,
      itemsAnalyzed: newResults.length,
      shortageItems: shortageCount,
      purchaseSuggestions: purchaseSuggestionCount,
      productionSuggestions: productionSuggestionCount,
      totalPurchaseValue,
      notes: null,
      completedAt: new Date().toISOString(),
    };

    mockMRPRuns.push(newRun);
    mockMRPResults.push(...newResults);
    mockMRPSuggestions.push(...newSuggestions);

    setRuns([...mockMRPRuns]);
    setResults([...mockMRPResults]);
    setSuggestions([...mockMRPSuggestions]);

    setSimRunning(false);
    setSimStep(0);
    setModalOpen(false);
    success(`MRP run ${runNumber} completed successfully`);

    // Show email alert if critical items exist
    if (shortageCount > 0) {
      setLastRunCriticalCount(shortageCount);
      setEmailAlertModal(true);
    }
  }, [
    runs,
    fromDate,
    toDate,
    includeSafety,
    includeReorder,
    autoPO,
    autoProd,
    success,
  ]);

  const steps = [
    'Analyzing demand...',
    'Checking current stock...',
    'Calculating net requirements...',
    'Generating suggestions...',
    'Creating draft orders...',
    'MRP Run Complete!',
  ];

  return (
    <AppLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              Material Requirements Planning
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Plan production and procurement based on demand
            </p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap shadow-sm"
          >
            <div className="w-4 h-4 flex items-center justify-center">
              <i className="ri-play-fill text-sm" />
            </div>
            Run MRP Now
          </button>
        </div>

        {/* Last Run Summary Card */}
        {latestRun && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 md:p-6 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">Last Run</div>
                <div className="text-lg font-bold text-slate-900">
                  {latestRun.runNumber} on {formatRunDate(latestRun.runDate)}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <div className="w-4 h-4 flex items-center justify-center text-slate-400">
                      <i className="ri-stack-line text-xs" />
                    </div>
                    {latestRun.itemsAnalyzed} items
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-4 h-4 flex items-center justify-center text-amber-500">
                      <i className="ri-error-warning-line text-xs" />
                    </div>
                    {latestRun.shortageItems} shortages
                  </span>
                  <span className="flex items-center gap-1.5">
                    <div className="w-4 h-4 flex items-center justify-center text-indigo-500">
                      <i className="ri-lightbulb-line text-xs" />
                    </div>
                    {latestRun.purchaseSuggestions +
                      latestRun.productionSuggestions}{' '}
                    suggestions
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  COMPLETED
                </span>
                <button
                  onClick={() =>
                    navigate(
                      `/manufacturing/mrp/shortage?runId=${latestRun.id}`,
                    )
                  }
                  className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                >
                  View Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="relative flex-1 w-full sm:max-w-xs">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400">
                <i className="ri-search-line text-sm" />
              </div>
              <input
                type="text"
                placeholder="Search by run number or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="RUNNING">Running</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
            {(searchTerm || statusFilter !== 'All') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('All');
                }}
                className="text-sm text-slate-500 hover:text-slate-700 cursor-pointer whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Mini Trend Chart — last 5 runs shortage counts */}
        {runs.length >= 2 &&
          (() => {
            const last5 = [...runs]
              .sort(
                (a, b) =>
                  new Date(a.runDate).getTime() - new Date(b.runDate).getTime(),
              )
              .slice(-5);
            const maxShortage = Math.max(
              ...last5.map((r) => r.shortageItems),
              1,
            );
            return (
              <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">
                    Shortage Trend (Last {last5.length} Runs)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Bar height = shortage count
                  </span>
                </div>
                <div className="flex items-end gap-3 h-16">
                  {last5.map((run, idx) => {
                    const heightPct =
                      maxShortage > 0
                        ? (run.shortageItems / maxShortage) * 100
                        : 0;
                    const prevRun = idx > 0 ? last5[idx - 1] : null;
                    let barColor = 'bg-slate-300';
                    if (run.shortageItems > 0)
                      barColor =
                        run.shortageItems >= 5 ? 'bg-red-400' : 'bg-amber-400';
                    else barColor = 'bg-emerald-400';
                    return (
                      <div
                        key={run.id}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div className="flex items-center gap-0.5 text-xs">
                          <span className="font-semibold text-slate-600">
                            {run.shortageItems}
                          </span>
                          {prevRun &&
                            (run.shortageItems > prevRun.shortageItems ? (
                              <i className="ri-arrow-up-line text-red-500 text-[10px]" />
                            ) : run.shortageItems < prevRun.shortageItems ? (
                              <i className="ri-arrow-down-line text-emerald-500 text-[10px]" />
                            ) : (
                              <i className="ri-arrow-right-line text-slate-400 text-[10px]" />
                            ))}
                        </div>
                        <div
                          className="w-full flex items-end"
                          style={{ height: '40px' }}
                        >
                          <div
                            className={`w-full rounded-sm transition-all ${barColor}`}
                            style={{ height: `${Math.max(heightPct, 5)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 truncate w-full text-center">
                          {run.runNumber.split('-').slice(-1)[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

        {/* History Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Run #
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Date
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Horizon
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Items
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Shortages
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Suggestions
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRuns.map((run) => {
                  const cfg = statusConfig[run.status];
                  // Find the previous run chronologically for comparison
                  const allSortedRuns = [...runs].sort(
                    (a, b) =>
                      new Date(a.runDate).getTime() -
                      new Date(b.runDate).getTime(),
                  );
                  const runPosInAll = allSortedRuns.findIndex(
                    (r) => r.id === run.id,
                  );
                  const prevRunInAll =
                    runPosInAll > 0 ? allSortedRuns[runPosInAll - 1] : null;
                  const shortageChange = prevRunInAll
                    ? run.shortageItems - prevRunInAll.shortageItems
                    : null;
                  return (
                    <tr
                      key={run.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-medium text-indigo-600">
                          {run.runNumber}
                        </span>
                        {run.notes && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {run.notes}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDateIST(run.runDate)}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDateIST(run.fromDate)} —{' '}
                        {formatDateIST(run.toDate)}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {run.itemsAnalyzed}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {run.shortageItems > 0 ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700">
                              {run.shortageItems}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                          {shortageChange !== null &&
                            (shortageChange > 0 ? (
                              <span className="text-red-500 text-xs font-medium flex items-center gap-0.5">
                                <i className="ri-arrow-up-line text-xs" />+
                                {shortageChange}
                              </span>
                            ) : shortageChange < 0 ? (
                              <span className="text-emerald-600 text-xs font-medium flex items-center gap-0.5">
                                <i className="ri-arrow-down-line text-xs" />
                                {shortageChange}
                              </span>
                            ) : (
                              <i className="ri-arrow-right-line text-slate-400 text-xs" />
                            ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {run.purchaseSuggestions + run.productionSuggestions}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
                          />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              navigate(
                                `/manufacturing/mrp/shortage?runId=${run.id}`,
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                          >
                            View Results
                          </button>
                          <button
                            onClick={() =>
                              navigate(
                                `/manufacturing/mrp/purchase?runId=${run.id}`,
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                          >
                            View Suggestions
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredRuns.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 flex items-center justify-center text-slate-300">
                          <i className="ri-calculator-line text-2xl" />
                        </div>
                        <p>No MRP runs found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Run MRP Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Configure MRP Run
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* Planning Horizon */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3 block">
                  Planning Horizon
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  {[30, 60, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() =>
                        setToDate(
                          toInputDate(addDays(new Date(fromDate), days)),
                        )
                      }
                      className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Include in Demand */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3 block">
                  Include in Demand
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSales}
                      onChange={(e) => setIncludeSales(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Open Sales Orders (pending invoices)
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeProduction}
                      onChange={(e) => setIncludeProduction(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Production Orders (material needs)
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeSafety}
                      onChange={(e) => setIncludeSafety(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Safety Stock Requirements
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeReorder}
                      onChange={(e) => setIncludeReorder(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Reorder Point Triggers
                    </span>
                  </label>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3 block">
                  Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoPO}
                      onChange={(e) => setAutoPO(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Auto-create Draft Purchase Orders for shortages
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoProd}
                      onChange={(e) => setAutoProd(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Auto-create Draft Production Orders for shortages
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={considerReceipts}
                      onChange={(e) => setConsiderReceipts(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700">
                      Consider scheduled receipts (open POs)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={simulateMRP}
                disabled={simRunning}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-play-fill text-sm" />
                </div>
                Run MRP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Alert Modal */}
      {emailAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">
                Send Shortage Alert?
              </h3>
              <button
                onClick={() => setEmailAlertModal(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 shrink-0">
                  <i className="ri-alarm-warning-line text-red-600 text-lg" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {lastRunCriticalCount} critical item
                    {lastRunCriticalCount !== 1 ? 's' : ''} need
                    {lastRunCriticalCount === 1 ? 's' : ''} immediate attention.
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Send email notification to purchase team?
                  </p>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-600">
                <i className="ri-mail-line mr-1.5" />
                <span>purchase@company.com</span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100">
              <button
                onClick={() => setEmailAlertModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setEmailAlertModal(false);
                  success('Alert sent to purchase@company.com');
                }}
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="ri-send-plane-line" />
                Send Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulation Overlay */}
      {simRunning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl p-8 w-full max-w-sm mx-4 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
              <div className="w-6 h-6 flex items-center justify-center">
                <i className="ri-loader-4-line text-xl text-indigo-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">
              Running MRP...
            </h3>
            <div className="space-y-3 mt-5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                      simStep > idx + 1
                        ? 'bg-emerald-500 text-white'
                        : simStep === idx + 1
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {simStep > idx + 1 ? (
                      <i className="ri-check-line text-xs" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <span
                    className={`text-sm ${simStep >= idx + 1 ? 'text-slate-800 font-medium' : 'text-slate-400'}`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
