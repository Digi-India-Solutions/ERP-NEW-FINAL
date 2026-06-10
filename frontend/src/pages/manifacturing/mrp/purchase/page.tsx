import { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import {
  mockMRPRuns,
  mockMRPSuggestions,
  mockItems,
  mockProductionOrders,
  type MockMRPSuggestion,
} from '@/mocks/masters';
import { mockPurchaseOrders } from '@/mocks/billing';
import { formatINR, formatDateIST } from '@/utils/format';

const statusBadges: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: 'bg-slate-100', text: 'text-slate-700' },
  APPROVED: { bg: 'bg-blue-50', text: 'text-blue-700' },
  REJECTED: { bg: 'bg-red-50', text: 'text-red-700' },
  CONVERTED: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
};

const priorityBadges: Record<string, { bg: string; text: string }> = {
  LOW: { bg: 'bg-slate-100', text: 'text-slate-600' },
  NORMAL: { bg: 'bg-blue-50', text: 'text-blue-600' },
  HIGH: { bg: 'bg-amber-50', text: 'text-amber-700' },
  URGENT: { bg: 'bg-red-50', text: 'text-red-700' },
};

function isPastToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

function getItemPurchaseRate(itemId: string): number {
  const item = mockItems.find((i) => i.id === itemId);
  return item?.purchaseRate ?? 0;
}

function getItemBOMId(itemId: string): string | null {
  const item = mockItems.find((i) => i.id === itemId);
  return item?.bomId ?? null;
}

function getItemRoutingId(itemId: string): string | null {
  const item = mockItems.find((i) => i.id === itemId);
  return item?.bomId ?? null;
}

export default function PurchaseSuggestionsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { success, error } = useToast();

  const runIdParam = searchParams.get('runId');
  const defaultRunId =
    runIdParam ||
    (mockMRPRuns?.length > 0 ? mockMRPRuns[mockMRPRuns.length - 1].id : '');

  const [selectedRunId, setSelectedRunId] = useState(defaultRunId);
  const [typeFilter, setTypeFilter] = useState<
    'All' | 'PURCHASE' | 'PRODUCTION'
  >('All');
  const [statusFilter, setStatusFilter] = useState<
    'All' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED'
  >('All');
  const [priorityFilter, setPriorityFilter] = useState<
    'All' | 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  >('All');
  const [activeTab, setActiveTab] = useState<'PURCHASE' | 'PRODUCTION'>(
    'PURCHASE',
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editedQtys, setEditedQtys] = useState<Record<string, number>>({});
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingIds, setRejectingIds] = useState<string[]>([]);
  const [convertSummaryOpen, setConvertSummaryOpen] = useState(false);
  const [convertedDocs, setConvertedDocs] = useState<
    { type: string; number: string }[]
  >([]);
  const [suggestions, setSuggestions] = useState<MockMRPSuggestion[]>(() => {
    return mockMRPSuggestions || [];
  });

  const runSuggestions = useMemo(() => {
    return (suggestions || []).filter((s) => s?.mrpRunId === selectedRunId);
  }, [suggestions, selectedRunId]);

  const filteredSuggestions = useMemo(() => {
    return (runSuggestions || []).filter((s) => {
      const matchesType = typeFilter === 'All' || s?.type === typeFilter;
      const matchesStatus =
        statusFilter === 'All' || s?.status === statusFilter;
      const matchesPriority =
        priorityFilter === 'All' || s?.priority === priorityFilter;
      const matchesTab = s?.type === activeTab;
      return matchesType && matchesStatus && matchesPriority && matchesTab;
    });
  }, [runSuggestions, typeFilter, statusFilter, priorityFilter, activeTab]);

  const summary = useMemo(() => {
    const total = (runSuggestions || []).length;
    const pending = (runSuggestions || []).filter(
      (s) => s?.status === 'PENDING',
    ).length;
    const approved = (runSuggestions || []).filter(
      (s) => s?.status === 'APPROVED',
    ).length;
    const converted = (runSuggestions || []).filter(
      (s) => s?.status === 'CONVERTED',
    ).length;
    const rejected = (runSuggestions || []).filter(
      (s) => s?.status === 'REJECTED',
    ).length;
    const totalPurchaseValue = (runSuggestions || [])
      .filter(
        (s) =>
          s?.type === 'PURCHASE' &&
          (s?.status === 'PENDING' || s?.status === 'APPROVED'),
      )
      .reduce((sum, s) => sum + (s?.estimatedCost || 0), 0);
    return {
      total,
      pending,
      approved,
      converted,
      rejected,
      totalPurchaseValue,
    };
  }, [runSuggestions]);

  const tabCounts = useMemo(() => {
    const purchase = (runSuggestions || []).filter(
      (s) => s?.type === 'PURCHASE',
    ).length;
    const production = (runSuggestions || []).filter(
      (s) => s?.type === 'PRODUCTION',
    ).length;
    return { purchase, production };
  }, [runSuggestions]);

  const allTabSelected = useMemo(() => {
    const visibleIds = filteredSuggestions.map((s) => s.id);
    return (
      visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id))
    );
  }, [filteredSuggestions, selectedIds]);

  const toggleSelectAll = useCallback(() => {
    const visibleIds = filteredSuggestions.map((s) => s.id);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allTabSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [filteredSuggestions, allTabSelected]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const updateSuggestionStatus = useCallback(
    (ids: string[], status: MockMRPSuggestion['status'], notes?: string) => {
      ids.forEach((id) => {
        const idx = mockMRPSuggestions.findIndex((s) => s?.id === id);
        if (idx !== -1) {
          mockMRPSuggestions[idx] = {
            ...mockMRPSuggestions[idx],
            status,
            ...(notes ? { notes } : {}),
          };
        }
      });
      setSuggestions([...mockMRPSuggestions]);
    },
    [],
  );

  const handleApprove = useCallback(
    (id: string) => {
      const idx = mockMRPSuggestions.findIndex((s) => s?.id === id);
      if (idx !== -1) {
        mockMRPSuggestions[idx] = {
          ...mockMRPSuggestions[idx],
          status: 'APPROVED',
        };
        setSuggestions([...mockMRPSuggestions]);
        success('Suggestion approved');
      }
    },
    [success],
  );

  const handleApproveSelected = useCallback(() => {
    const toApprove = Array.from(selectedIds).filter((id) => {
      const s = suggestions.find((x) => x.id === id);
      return s && s.status === 'PENDING';
    });
    if (toApprove.length === 0) {
      error('No pending suggestions selected');
      return;
    }
    updateSuggestionStatus(toApprove, 'APPROVED');
    success(`${toApprove.length} suggestion(s) approved`);
    setSelectedIds(new Set());
  }, [selectedIds, suggestions, updateSuggestionStatus, success, error]);

  const openRejectModal = useCallback((ids: string[]) => {
    setRejectingIds(ids);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const handleRejectConfirm = useCallback(() => {
    if (!rejectReason.trim()) {
      error('Please enter a rejection reason');
      return;
    }
    updateSuggestionStatus(rejectingIds, 'REJECTED', rejectReason.trim());
    success(`${rejectingIds.length} suggestion(s) rejected`);
    setRejectModalOpen(false);
    setSelectedIds(new Set());
    setRejectingIds([]);
  }, [rejectingIds, rejectReason, updateSuggestionStatus, success, error]);

  const handleRejectSingle = useCallback(
    (id: string) => {
      openRejectModal([id]);
    },
    [openRejectModal],
  );

  const handleRejectSelected = useCallback(() => {
    const toReject = Array.from(selectedIds).filter((id) => {
      const s = suggestions.find((x) => x.id === id);
      return s && (s.status === 'PENDING' || s.status === 'APPROVED');
    });
    if (toReject.length === 0) {
      error('No eligible suggestions selected');
      return;
    }
    openRejectModal(toReject);
  }, [selectedIds, suggestions, openRejectModal, error]);

  const convertToPO = useCallback(
    (suggestionIds: string[]) => {
      const toConvert = (suggestions || []).filter(
        (s) =>
          suggestionIds.includes(s?.id) &&
          s?.type === 'PURCHASE' &&
          s?.status === 'APPROVED',
      );
      if (toConvert.length === 0) {
        error('No approved purchase suggestions to convert');
        return;
      }

      const createdDocs: { type: string; number: string }[] = [];
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      toConvert.forEach((s) => {
        const qty =
          editedQtys && editedQtys[s.id] != null
            ? editedQtys[s.id]
            : (s?.suggestedQty ?? 0);
        const rate = getItemPurchaseRate(s?.itemId || '');
        const newPO = {
          id: `po-mrp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          poNumber: `PO-MRP-${now.getFullYear()}-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`,
          supplierId: s?.supplierId || 'pty-002',
          supplierName: s?.supplierName || 'Auto Select',
          date: todayStr,
          expectedDelivery: s?.requiredDate || todayStr,
          status: 'PENDING' as const,
          items: [
            {
              itemId: s?.itemId || '',
              itemName: s?.itemName || '',
              hsnCode:
                (mockItems || []).find((i) => i?.id === s?.itemId)?.hsnCode ||
                '',
              orderedQty: qty,
              receivedQty: 0,
              unit: s?.unit || 'Pcs',
              rate,
            },
          ],
        };
        mockPurchaseOrders.push(newPO);
        createdDocs.push({ type: 'Purchase Order', number: newPO.poNumber });

        const sugIdx = mockMRPSuggestions.findIndex((x) => x?.id === s?.id);
        if (sugIdx >= 0) {
          mockMRPSuggestions[sugIdx].status = 'CONVERTED';
          mockMRPSuggestions[sugIdx].convertedDocId = newPO.id;
          mockMRPSuggestions[sugIdx].convertedDocNumber = newPO.poNumber;
        }
      });

      setSuggestions([...mockMRPSuggestions]);
      setConvertedDocs(createdDocs);
      setConvertSummaryOpen(true);
      setSelectedIds(new Set());
      success(
        `${toConvert.length} Purchase Order(s) created from MRP suggestions`,
      );
    },
    [suggestions, editedQtys, error, success],
  );

  const convertToProductionOrder = useCallback(
    (suggestionIds: string[]) => {
      const toConvert = (suggestions || []).filter(
        (s) =>
          suggestionIds.includes(s?.id) &&
          s?.type === 'PRODUCTION' &&
          s?.status === 'APPROVED',
      );
      if (toConvert.length === 0) {
        error('No approved production suggestions to convert');
        return;
      }

      const createdDocs: { type: string; number: string }[] = [];
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      toConvert.forEach((s) => {
        const qty =
          editedQtys && editedQtys[s.id] != null
            ? editedQtys[s.id]
            : (s?.suggestedQty ?? 0);
        const bomId = getItemBOMId(s?.itemId || '');
        const routingId = getItemRoutingId(s?.itemId || '');
        const item = (mockItems || []).find((i) => i?.id === s?.itemId);

        const plannedEnd = new Date(now);
        plannedEnd.setDate(plannedEnd.getDate() + (s?.leadTimeDays || 7));

        const newPO = {
          id: `prod-mrp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          poNumber: `PRD-MRP-${now.getFullYear()}-${String(mockProductionOrders.length + 1).padStart(3, '0')}`,
          type: 'MTS' as const,
          status: 'PLANNED' as const,
          priority: s?.priority || 'NORMAL',
          productId: s?.itemId || '',
          productName: s?.itemName || '',
          productCode: s?.itemCode || '',
          isVariant: !!s?.variantName,
          variantName: s?.variantName || null,
          bomId: bomId || '',
          bomVersion: item?.bomVersion || '1.0',
          plannedQty: qty,
          completedQty: 0,
          rejectedQty: 0,
          unit: s?.unit || 'Pcs',
          plannedStartDate: todayStr,
          plannedEndDate: plannedEnd.toISOString().split('T')[0],
          actualStartDate: null,
          actualEndDate: null,
          salesOrderRef: null,
          salesOrderId: null,
          warehouseId: 'wh-005',
          warehouseName: 'Manufacturing Plant',
          routingId,
          notes: `Auto-created from MRP Run ${(mockMRPRuns || []).find((r) => r?.id === selectedRunId)?.runNumber || ''}`,
          createdBy: 'Admin User',
          createdAt: now.toISOString(),
        };
        mockProductionOrders.push(newPO);
        createdDocs.push({ type: 'Production Order', number: newPO.poNumber });

        const sugIdx = mockMRPSuggestions.findIndex((x) => x?.id === s?.id);
        if (sugIdx >= 0) {
          mockMRPSuggestions[sugIdx].status = 'CONVERTED';
          mockMRPSuggestions[sugIdx].convertedDocId = newPO.id;
          mockMRPSuggestions[sugIdx].convertedDocNumber = newPO.poNumber;
        }
      });

      setSuggestions([...mockMRPSuggestions]);
      setConvertedDocs(createdDocs);
      setConvertSummaryOpen(true);
      setSelectedIds(new Set());
      success(
        `${toConvert.length} Production Order(s) created from MRP suggestions`,
      );
    },
    [suggestions, editedQtys, selectedRunId, error, success],
  );

  const handleConvertSelected = useCallback(() => {
    const selected = Array.from(selectedIds);
    const purchaseIds = selected.filter((id) => {
      const s = (suggestions || []).find((x) => x?.id === id);
      return s && s.type === 'PURCHASE' && s.status === 'APPROVED';
    });
    const productionIds = selected.filter((id) => {
      const s = (suggestions || []).find((x) => x?.id === id);
      return s && s.type === 'PRODUCTION' && s.status === 'APPROVED';
    });

    if (purchaseIds.length === 0 && productionIds.length === 0) {
      error('No approved suggestions selected for conversion');
      return;
    }

    const allDocs: { type: string; number: string }[] = [];

    if (purchaseIds.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      purchaseIds.forEach((id) => {
        const s = (suggestions || []).find((x) => x?.id === id);
        if (!s) return;
        const qty =
          editedQtys && editedQtys[s.id] != null
            ? editedQtys[s.id]
            : (s?.suggestedQty ?? 0);
        const rate = getItemPurchaseRate(s?.itemId || '');
        const newPO = {
          id: `po-mrp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          poNumber: `PO-MRP-${now.getFullYear()}-${String(mockPurchaseOrders.length + 1).padStart(3, '0')}`,
          supplierId: s?.supplierId || 'pty-002',
          supplierName: s?.supplierName || 'Auto Select',
          date: todayStr,
          expectedDelivery: s?.requiredDate || todayStr,
          status: 'PENDING' as const,
          items: [
            {
              itemId: s?.itemId || '',
              itemName: s?.itemName || '',
              hsnCode:
                (mockItems || []).find((i) => i?.id === s?.itemId)?.hsnCode ||
                '',
              orderedQty: qty,
              receivedQty: 0,
              unit: s?.unit || 'Pcs',
              rate,
            },
          ],
        };
        mockPurchaseOrders.push(newPO);
        allDocs.push({ type: 'Purchase Order', number: newPO.poNumber });
        const sugIdx = mockMRPSuggestions.findIndex((x) => x?.id === s?.id);
        if (sugIdx >= 0) {
          mockMRPSuggestions[sugIdx].status = 'CONVERTED';
          mockMRPSuggestions[sugIdx].convertedDocId = newPO.id;
          mockMRPSuggestions[sugIdx].convertedDocNumber = newPO.poNumber;
        }
      });
    }

    if (productionIds.length > 0) {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      productionIds.forEach((id) => {
        const s = (suggestions || []).find((x) => x?.id === id);
        if (!s) return;
        const qty =
          editedQtys && editedQtys[s.id] != null
            ? editedQtys[s.id]
            : (s?.suggestedQty ?? 0);
        const bomId = getItemBOMId(s?.itemId || '');
        const routingId = getItemRoutingId(s?.itemId || '');
        const item = (mockItems || []).find((i) => i?.id === s?.itemId);
        const plannedEnd = new Date(now);
        plannedEnd.setDate(plannedEnd.getDate() + (s?.leadTimeDays || 7));
        const newPO = {
          id: `prod-mrp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          poNumber: `PRD-MRP-${now.getFullYear()}-${String(mockProductionOrders.length + 1).padStart(3, '0')}`,
          type: 'MTS' as const,
          status: 'PLANNED' as const,
          priority: s?.priority || 'NORMAL',
          productId: s?.itemId || '',
          productName: s?.itemName || '',
          productCode: s?.itemCode || '',
          isVariant: !!s?.variantName,
          variantName: s?.variantName || null,
          bomId: bomId || '',
          bomVersion: item?.bomVersion || '1.0',
          plannedQty: qty,
          completedQty: 0,
          rejectedQty: 0,
          unit: s?.unit || 'Pcs',
          plannedStartDate: todayStr,
          plannedEndDate: plannedEnd.toISOString().split('T')[0],
          actualStartDate: null,
          actualEndDate: null,
          salesOrderRef: null,
          salesOrderId: null,
          warehouseId: 'wh-005',
          warehouseName: 'Manufacturing Plant',
          routingId,
          notes: `Auto-created from MRP Run ${(mockMRPRuns || []).find((r) => r?.id === selectedRunId)?.runNumber || ''}`,
          createdBy: 'Admin User',
          createdAt: now.toISOString(),
        };
        mockProductionOrders.push(newPO);
        allDocs.push({ type: 'Production Order', number: newPO.poNumber });
        const sugIdx = mockMRPSuggestions.findIndex((x) => x?.id === s?.id);
        if (sugIdx >= 0) {
          mockMRPSuggestions[sugIdx].status = 'CONVERTED';
          mockMRPSuggestions[sugIdx].convertedDocId = newPO.id;
          mockMRPSuggestions[sugIdx].convertedDocNumber = newPO.poNumber;
        }
      });
    }

    setSuggestions([...mockMRPSuggestions]);
    setConvertedDocs(allDocs);
    setConvertSummaryOpen(true);
    setSelectedIds(new Set());
    success(`${allDocs.length} order(s) created from MRP suggestions`);
  }, [selectedIds, suggestions, editedQtys, selectedRunId, error, success]);

  const selectedRun = mockMRPRuns.find((r) => r.id === selectedRunId);

  return (
    <AppLayout>
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              MRP Suggestions
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Purchase + Production suggestions from MRP
              {selectedRun && (
                <span>
                  {' '}
                  —{' '}
                  <span className="font-medium text-indigo-600">
                    {selectedRun.runNumber}
                  </span>
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleApproveSelected}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-check-line text-sm" />
              </div>
              Approve Selected
            </button>
            <button
              onClick={handleRejectSelected}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-close-line text-sm" />
              </div>
              Reject Selected
            </button>
            <button
              onClick={handleConvertSelected}
              disabled={selectedIds.size === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-refresh-line text-sm" />
              </div>
              Convert to Orders
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">
              Total Purchase Value
            </div>
            <div className="text-lg font-bold text-slate-900">
              {formatINR(summary.totalPurchaseValue)}
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Total Suggestions</div>
            <div className="text-lg font-bold text-slate-900">
              {summary.total}
            </div>
          </div>
          <div className="bg-white border border-slate-100 rounded-lg p-3">
            <div className="text-xs text-slate-500 mb-1">Pending</div>
            <div className="text-lg font-bold text-slate-600">
              {summary.pending}
            </div>
          </div>
          <div className="bg-white border border-blue-100 rounded-lg p-3">
            <div className="text-xs text-blue-600 mb-1">Approved</div>
            <div className="text-lg font-bold text-blue-700">
              {summary.approved}
            </div>
          </div>
          <div className="bg-white border border-emerald-100 rounded-lg p-3">
            <div className="text-xs text-emerald-600 mb-1">Converted</div>
            <div className="text-lg font-bold text-emerald-700">
              {summary.converted}
            </div>
          </div>
          <div className="bg-white border border-red-100 rounded-lg p-3">
            <div className="text-xs text-red-600 mb-1">Rejected</div>
            <div className="text-lg font-bold text-red-700">
              {summary.rejected}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
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
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value as typeof typeFilter);
                if (e.target.value !== 'All')
                  setActiveTab(e.target.value as typeof activeTab);
              }}
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="PURCHASE">Purchase</option>
              <option value="PRODUCTION">Production</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as typeof statusFilter)
              }
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CONVERTED">Converted</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(e.target.value as typeof priorityFilter)
              }
              className="px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="All">All Priority</option>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>

            <button
              onClick={() => {
                setTypeFilter('All');
                setStatusFilter('All');
                setPriorityFilter('All');
              }}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-4">
          <button
            onClick={() => setActiveTab('PURCHASE')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'PURCHASE'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Purchase Suggestions
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
              {tabCounts.purchase}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('PRODUCTION')}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'PRODUCTION'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Production Suggestions
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
              {tabCounts.production}
            </span>
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={allTabSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Item
                  </th>
                  {activeTab === 'PURCHASE' && (
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      Supplier
                    </th>
                  )}
                  {activeTab === 'PRODUCTION' && (
                    <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      Routing
                    </th>
                  )}
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Qty
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Unit
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Order By
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Required By
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Est. Cost
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Lead Time
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Priority
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(filteredSuggestions || []).map((s) => {
                  const statusCfg = statusBadges[s?.status || 'PENDING'];
                  const priorityCfg = priorityBadges[s?.priority || 'NORMAL'];
                  const orderByPast = isPastToday(s?.orderByDate || '');
                  const isSelected = selectedIds.has(s?.id || '');
                  const canApprove = s?.status === 'PENDING';
                  const canReject =
                    s?.status === 'PENDING' || s?.status === 'APPROVED';
                  const canConvert = s?.status === 'APPROVED';

                  return (
                    <tr
                      key={s?.id || Math.random()}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(s?.id || '')}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {s?.itemName || '—'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {s?.itemCode || '—'}
                          {s?.variantName && (
                            <span className="ml-1 text-slate-500">
                              — {s.variantName}
                            </span>
                          )}
                        </div>
                      </td>
                      {activeTab === 'PURCHASE' && (
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {s?.supplierName || (
                            <span className="text-slate-400 italic">
                              — Auto Select —
                            </span>
                          )}
                        </td>
                      )}
                      {activeTab === 'PRODUCTION' && (
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {getItemRoutingId(s?.itemId || '') ? (
                            <span className="text-indigo-600">Available</span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right">
                        {s?.status === 'CONVERTED' ||
                        s?.status === 'REJECTED' ? (
                          <span className="text-slate-600">
                            {editedQtys && editedQtys[s?.id || ''] != null
                              ? editedQtys[s?.id || '']
                              : (s?.suggestedQty ?? 0)}
                          </span>
                        ) : (
                          <input
                            type="number"
                            min={1}
                            value={
                              editedQtys && editedQtys[s?.id || ''] != null
                                ? editedQtys[s?.id || '']
                                : (s?.suggestedQty ?? 0)
                            }
                            onChange={(e) =>
                              setEditedQtys((prev) => ({
                                ...prev,
                                [s?.id || '']: parseFloat(e.target.value) || 0,
                              }))
                            }
                            className="w-20 text-right px-2 py-1 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {s?.unit || 'Pcs'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={
                            orderByPast
                              ? 'text-red-600 font-medium'
                              : 'text-slate-600'
                          }
                        >
                          {formatDateIST(s?.orderByDate || '')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDateIST(s?.requiredDate || '')}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-700">
                        {formatINR(s?.estimatedCost || 0)}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">
                        {s?.leadTimeDays ?? 0} days
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${priorityCfg.bg} ${priorityCfg.text}`}
                        >
                          {s?.priority || 'NORMAL'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.bg} ${statusCfg.text}`}
                        >
                          {s?.status || 'PENDING'}
                        </span>
                        {s?.convertedDocNumber && (
                          <div className="text-xs text-emerald-600 mt-1">
                            {s.convertedDocNumber}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {canApprove && (
                            <button
                              onClick={() => handleApprove(s?.id || '')}
                              title="Approve"
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-emerald-50 text-emerald-600 transition-colors cursor-pointer"
                            >
                              <i className="ri-check-line" />
                            </button>
                          )}
                          {canReject && (
                            <button
                              onClick={() => handleRejectSingle(s?.id || '')}
                              title="Reject"
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                            >
                              <i className="ri-close-line" />
                            </button>
                          )}
                          {canConvert && activeTab === 'PURCHASE' && (
                            <button
                              onClick={() => convertToPO([s?.id || ''])}
                              title="Convert to PO"
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                            >
                              <i className="ri-file-list-3-line" />
                            </button>
                          )}
                          {canConvert && activeTab === 'PRODUCTION' && (
                            <button
                              onClick={() =>
                                convertToProductionOrder([s?.id || ''])
                              }
                              title="Convert to Production Order"
                              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-indigo-50 text-indigo-600 transition-colors cursor-pointer"
                            >
                              <i className="ri-settings-3-line" />
                            </button>
                          )}
                          {s?.status === 'CONVERTED' && (
                            <span className="text-xs text-emerald-600 px-2">
                              Done
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(filteredSuggestions || []).length === 0 && (
                  <tr>
                    <td
                      colSpan={activeTab === 'PURCHASE' ? 13 : 13}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 flex items-center justify-center text-slate-300">
                          <i className="ri-error-warning-line text-2xl" />
                        </div>
                        <p>No suggestions found for this filter</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Reject Suggestion
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              You are rejecting {rejectingIds.length} suggestion(s). Please
              provide a reason.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              maxLength={500}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
            />
            <div className="text-xs text-slate-400 mt-1 text-right">
              {rejectReason.length}/500
            </div>
            <div className="flex items-center justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setRejectModalOpen(false);
                  setRejectingIds([]);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Convert Summary Modal */}
      {convertSummaryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                <i className="ri-check-double-line text-emerald-600 text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Orders Created
                </h3>
                <p className="text-sm text-slate-500">
                  {convertedDocs.length} document(s) generated
                </p>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {convertedDocs.map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 flex items-center justify-center text-emerald-500">
                      <i className="ri-file-list-3-line text-sm" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">
                      {doc.type}
                    </span>
                  </div>
                  <span className="text-sm text-indigo-600 font-medium">
                    {doc.number}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 mt-5">
              <button
                onClick={() => setConvertSummaryOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setConvertSummaryOpen(false);
                  navigate('/purchase/orders');
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              >
                View Orders
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
