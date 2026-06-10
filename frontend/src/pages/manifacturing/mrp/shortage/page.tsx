import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { mockMRPRuns, mockMRPResults } from '@/mocks/masters';
import { mockPurchaseOrders as billingPOs } from '@/mocks/billing';
import { formatINR, formatDateIST } from '@/utils/format';

const statusBadges: Record<
  string,
  { bg: string; text: string; label: string; icon: string }
> = {
  SUFFICIENT: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    label: 'Sufficient',
    icon: 'ri-check-line',
  },
  SHORT: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    label: 'Short',
    icon: 'ri-alert-line',
  },
  CRITICAL: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    label: 'Critical',
    icon: 'ri-close-circle-line',
  },
};

const actionBadges: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  NONE: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'None' },
  PURCHASE: { bg: 'bg-sky-50', text: 'text-sky-700', label: 'Buy' },
  PRODUCE: { bg: 'bg-violet-50', text: 'text-violet-700', label: 'Produce' },
  EXPEDITE: { bg: 'bg-red-50', text: 'text-red-700', label: 'Expedite' },
};

const itemTypeFilters = [
  'All',
  'RAW_MATERIAL',
  'SEMI_FINISHED',
  'FINISHED_GOOD',
  'CONSUMABLE',
  'PACKAGING',
];
const statusFilters = ['All', 'SUFFICIENT', 'SHORT', 'CRITICAL'];
const actionFilters = ['All', 'PURCHASE', 'PRODUCE', 'EXPEDITE', 'NONE'];

function itemTypeLabel(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getOrderByUrgency(
  orderByDate: string | undefined,
  today: Date,
): { label: string; cls: string } | null {
  if (!orderByDate) return null;
  const obd = new Date(orderByDate);
  const diffMs = obd.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return {
      label: 'OVERDUE - Order Now!',
      cls: 'bg-red-100 text-red-700 border border-red-200',
    };
  }
  if (diffDays <= 3) {
    return {
      label: `Order in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
      cls: 'bg-amber-100 text-amber-700 border border-amber-200',
    };
  }
  return {
    label: `Order by ${formatDateIST(orderByDate)}`,
    cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  };
}

/** Compute scheduledReceipts from open POs for an item within a date range */
function getScheduledReceipts(
  itemId: string,
  toDate: string,
): { qty: number; details: string[] } {
  const pos = billingPOs.filter(
    (po) =>
      (po.status === 'PENDING' || po.status === 'PARTIAL') &&
      po.expectedDelivery &&
      po.expectedDelivery <= toDate,
  );
  let qty = 0;
  const details: string[] = [];
  pos.forEach((po) => {
    po.items.forEach((item) => {
      if (item.itemId === itemId) {
        const remaining = item.orderedQty - item.receivedQty;
        if (remaining > 0) {
          qty += remaining;
          details.push(
            `${po.poNumber} due ${formatDateIST(po.expectedDelivery!)}`,
          );
        }
      }
    });
  });
  return { qty, details };
}

export default function MaterialShortagePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success } = useToast();
  const today = new Date();

  const runIdParam = searchParams.get('runId');
  const defaultRunId =
    runIdParam ||
    (mockMRPRuns.length > 0 ? mockMRPRuns[mockMRPRuns.length - 1].id : '');

  const [selectedRunId, setSelectedRunId] = useState(defaultRunId);
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionFilter, setActionFilter] = useState('All');
  const [itemTypeFilter, setItemTypeFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedRun = mockMRPRuns.find((r) => r.id === selectedRunId);

  const runResults = useMemo(() => {
    return mockMRPResults.filter((r) => r.mrpRunId === selectedRunId);
  }, [selectedRunId]);

  // Enrich results with scheduled receipts from open POs
  const enrichedResults = useMemo(() => {
    return runResults.map((r) => {
      const scheduled = getScheduledReceipts(
        r.itemId,
        selectedRun?.toDate ?? '2099-12-31',
      );
      const effectiveScheduled = Math.max(r.scheduledReceipts, scheduled.qty);
      const effectiveShortage = Math.max(0, r.finalShortage - scheduled.qty);
      return {
        ...r,
        effectiveScheduledReceipts: effectiveScheduled,
        scheduledDetails: scheduled.details,
        effectiveShortage,
      };
    });
  }, [runResults, selectedRun]);

  const filteredResults = useMemo(() => {
    return enrichedResults.filter((r) => {
      const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
      const matchesAction =
        actionFilter === 'All' || r.suggestedAction === actionFilter;
      const matchesType =
        itemTypeFilter === 'All' || r.itemType === itemTypeFilter;
      const matchesSearch =
        !searchTerm ||
        r.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesAction && matchesType && matchesSearch;
    });
  }, [enrichedResults, statusFilter, actionFilter, itemTypeFilter, searchTerm]);

  const summary = useMemo(() => {
    const critical = filteredResults.filter(
      (r) => r.status === 'CRITICAL',
    ).length;
    const short = filteredResults.filter((r) => r.status === 'SHORT').length;
    const sufficient = filteredResults.filter(
      (r) => r.status === 'SUFFICIENT',
    ).length;
    const totalPurchaseValue = filteredResults
      .filter((r) => r.suggestedAction === 'PURCHASE')
      .reduce((sum, r) => sum + (r.estimatedCost || 0), 0);

    // Immediate ordering: where orderByDate <= today
    const immediateCount = filteredResults.filter((r) => {
      if (!r.requiredDate || !r.supplierLeadTimeDays) return false;
      const reqDate = new Date(r.requiredDate);
      const orderBy = new Date(
        reqDate.getTime() - r.supplierLeadTimeDays * 24 * 60 * 60 * 1000,
      );
      return orderBy <= today;
    }).length;

    return {
      total: filteredResults.length,
      critical,
      short,
      sufficient,
      totalPurchaseValue,
      immediateCount,
    };
  }, [filteredResults, today]);

  const exportToCSV = useCallback(() => {
    if (filteredResults.length === 0) return;
    const headers = [
      'Item',
      'Code',
      'Type',
      'Gross Req',
      'Available',
      'Net Req',
      'Scheduled',
      'Shortage',
      'Lead Time',
      'Order By',
      'Required By',
      'Status',
      'Suggested Action',
    ];
    const rows = filteredResults.map((r) => {
      const reqDate = new Date(r.requiredDate);
      const orderByDate =
        r.supplierLeadTimeDays > 0
          ? new Date(
              reqDate.getTime() - r.supplierLeadTimeDays * 24 * 60 * 60 * 1000,
            )
              .toISOString()
              .split('T')[0]
          : '';
      return [
        r.itemName,
        r.itemCode,
        itemTypeLabel(r.itemType),
        r.grossRequirement,
        r.availableStock,
        r.netRequirement,
        r.effectiveScheduledReceipts,
        r.effectiveShortage,
        r.supplierLeadTimeDays,
        orderByDate,
        r.requiredDate,
        r.status,
        r.suggestedAction,
      ];
    });
    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n',
    );
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MRP-Shortage-${selectedRunId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    success('CSV exported successfully');
  }, [filteredResults, selectedRunId, success]);

  return (
    <AppLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              Material Shortage Report
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {selectedRun ? (
                <>
                  Run{' '}
                  <span className="font-medium text-indigo-600">
                    {selectedRun.runNumber}
                  </span>{' '}
                  — {formatDateIST(selectedRun.runDate)}
                </>
              ) : (
                'Select an MRP run to view shortage analysis'
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/manufacturing/mrp')}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              Back to MRP
            </button>
            <button
              onClick={() =>
                navigate(`/manufacturing/mrp/purchase?runId=${selectedRunId}`)
              }
              className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              View Suggestions
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center flex-wrap">
            <label className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Viewing results for:
            </label>
            <select
              value={selectedRunId}
              onChange={(e) => setSelectedRunId(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[220px]"
            >
              {mockMRPRuns
                .slice()
                .sort(
                  (a, b) =>
                    new Date(b.runDate).getTime() -
                    new Date(a.runDate).getTime(),
                )
                .map((run) => (
                  <option key={run.id} value={run.id}>
                    {run.runNumber} ({formatDateIST(run.runDate)})
                  </option>
                ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {statusFilters.map((f) => (
                <option key={f} value={f}>
                  {f === 'All' ? 'All Status' : f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {actionFilters.map((f) => (
                <option key={f} value={f}>
                  {f === 'All' ? 'All Actions' : f.replace(/_/g, ' ')}
                </option>
              ))}
            </select>

            <select
              value={itemTypeFilter}
              onChange={(e) => setItemTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {itemTypeFilters.map((f) => (
                <option key={f} value={f}>
                  {f === 'All' ? 'All Item Types' : itemTypeLabel(f)}
                </option>
              ))}
            </select>

            <div className="relative flex-1 w-full lg:max-w-xs">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-slate-400">
                <i className="ri-search-line text-sm" />
              </div>
              <input
                type="text"
                placeholder="Search item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={exportToCSV}
              disabled={filteredResults.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-40 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-download-line text-sm" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Total Items</div>
            <div className="text-lg font-bold text-slate-900">
              {summary.total}
            </div>
          </div>
          <div className="bg-white border border-red-100 rounded-lg p-3">
            <div className="text-xs text-red-600 mb-1">Critical</div>
            <div className="text-lg font-bold text-red-700">
              {summary.critical}
            </div>
          </div>
          <div className="bg-white border border-amber-100 rounded-lg p-3">
            <div className="text-xs text-amber-600 mb-1">Short</div>
            <div className="text-lg font-bold text-amber-700">
              {summary.short}
            </div>
          </div>
          <div className="bg-white border border-emerald-100 rounded-lg p-3">
            <div className="text-xs text-emerald-600 mb-1">Sufficient</div>
            <div className="text-lg font-bold text-emerald-700">
              {summary.sufficient}
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg">
            <div className="w-5 h-5 flex items-center justify-center">
              <i className="ri-money-rupee-circle-line text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-indigo-600">Est. Purchase Value</p>
              <p className="text-sm font-bold text-indigo-700">
                {formatINR(summary.totalPurchaseValue)}
              </p>
            </div>
          </div>
          {summary.immediateCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="text-xs text-red-600 mb-1">Order Immediately</div>
              <div className="text-lg font-bold text-red-700">
                {summary.immediateCount}
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Item
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Type
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Gross Req
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Available
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Net Req
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Scheduled
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Shortage
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Lead Time
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Order By
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Required By
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredResults.map((r) => {
                  const statusCfg = statusBadges[r.status];
                  const actionCfg = actionBadges[r.suggestedAction];

                  // Calculate order-by date from required date minus lead time
                  let orderByLabel: { label: string; cls: string } | null =
                    null;
                  if (r.requiredDate && r.supplierLeadTimeDays > 0) {
                    const reqDate = new Date(r.requiredDate);
                    const orderByDate = new Date(
                      reqDate.getTime() -
                        r.supplierLeadTimeDays * 24 * 60 * 60 * 1000,
                    );
                    orderByLabel = getOrderByUrgency(
                      orderByDate.toISOString().split('T')[0],
                      today,
                    );
                  }

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {r.itemName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {r.itemCode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {itemTypeLabel(r.itemType)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 font-medium">
                        {r.grossRequirement}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {r.availableStock}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700 font-medium">
                        {r.netRequirement}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.effectiveScheduledReceipts > 0 ? (
                          <div className="group relative inline-block">
                            <span className="font-medium text-emerald-600">
                              +{r.effectiveScheduledReceipts}
                            </span>
                            {r.scheduledDetails.length > 0 && (
                              <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block z-10 bg-slate-800 text-white text-xs rounded-lg px-2 py-1.5 whitespace-nowrap shadow-lg">
                                {r.scheduledDetails.map((d, i) => (
                                  <div key={i}>{d}</div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.effectiveShortage > 0 ? (
                          <span className="font-medium text-red-600">
                            {r.effectiveShortage}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {r.supplierLeadTimeDays > 0
                          ? `${r.supplierLeadTimeDays} days`
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {orderByLabel ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium whitespace-nowrap ${orderByLabel.cls}`}
                          >
                            {orderByLabel.label}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDateIST(r.requiredDate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          <i className={`${statusCfg.icon} text-xs`} />
                          {statusCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${actionCfg.bg} ${actionCfg.text}`}
                        >
                          {actionCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredResults.length === 0 && (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <i className="ri-error-warning-line text-2xl text-slate-300" />
                        <p>No shortage results found for this run</p>
                        {runResults.length === 0 && (
                          <p className="text-xs">
                            This MRP run has not been processed yet
                          </p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
