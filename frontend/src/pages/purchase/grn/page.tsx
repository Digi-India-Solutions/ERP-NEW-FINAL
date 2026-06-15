import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { useWarehouseStore } from '@/stores/warehouseStore';
import type { MockGRN } from '@/mocks/billing';
import { mockCompany } from '@/mocks/masters';
import {
  apiGetAllGRNs,
  apiGetGRNById,
  mapGRNToMockGRN,
  type GRNApiRecord,
} from '@/api/grn.api';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { sixMonthsAgoRange } from './utils/grnHelpers';
import SummaryCard from './components/SummaryCard';
import GRNDetailModal from './components/GRNDetailModal';
import PrintGRNView from './components/PrintGRNView';
import { MODULES } from '@/utils/permissions.js';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { deleteData } from '../../../services/FetchNodeServices.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const getGRNTotalQty = (grn: MockGRN, raw?: GRNApiRecord) => {
  if (raw?.totalItemsQty !== undefined) return Number(raw.totalItemsQty || 0);
  return grn.items.reduce((s, i) => s + i.qty, 0);
};

const getPOCounts = (grn: MockGRN, raw?: GRNApiRecord) => {
  if (
    raw &&
    raw.poLinkedCount !== undefined &&
    raw.unmatchedCount !== undefined
  ) {
    return {
      matchedCount: Number(raw.poLinkedCount || 0),
      unmatchedCount: Number(raw.unmatchedCount || 0),
    };
  }

  return {
    matchedCount: grn.items.filter((it) => it.poRef).length,
    unmatchedCount: grn.items.filter((it) => !it.poRef).length,
  };
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GRNListPage() {
  const navigate = useNavigate();
  const range = sixMonthsAgoRange();
  const { success, error: toastError } = useToast();

  const [dateFrom, setDateFrom] = useState(range.from);
  const [dateTo, setDateTo] = useState(range.to);
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [supplierFilter, setSupplierFilter] = useState('');
  const { selectedWarehouseId, selectedWarehouseName } = useWarehouseStore();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Reset supplier filter and page when warehouse changes
  useEffect(() => {
    setSupplierFilter('');
    setPage(1);
  }, [selectedWarehouseId]);
  const [selectedGRN, setSelectedGRN] = useState<MockGRN | null>(null);
  const [printGRN, setPrintGRN] = useState<MockGRN | null>(null);
  const [grnData, setGrnData] = useState<MockGRN[]>([]);
  const [grnById, setGrnById] = useState<Record<string, GRNApiRecord>>({});
  const [loading, setLoading] = useState(true);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { hasPermission, hasControl } = useAuth();
  const canReceiveStock = hasPermission(MODULES.STOCK_RECEIVING, 'create');
  const canExport = hasControl('exportData');

  useEffect(() => {
    let mounted = true;

    const loadGRNs = async () => {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await apiGetAllGRNs();
        const rows = Array.isArray(response.data) ? response.data : [];

        if (!mounted) return;

        setGrnData(rows.map((r) => mapGRNToMockGRN(r)));
        setGrnById(
          rows.reduce<Record<string, GRNApiRecord>>((acc, row) => {
            acc[row.id] = row;
            return acc;
          }, {}),
        );
      } catch (error) {
        if (!mounted) return;
        console.error('Failed to load GRN list:', error);
        setLoadError('Failed to load GRNs from server');
        setGrnData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadGRNs();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCreatePI = async (grn: MockGRN) => {
    setSelectedGRN(null);
    const fullGRN = await ensureGRNDetail(grn);

    // Fetch full supplier details before navigating
    let supplierDetails = {
      id: fullGRN.supplierId,
      name: fullGRN.supplierName,
      gstin: '',
      phone: '',
      stateCode: '',
      address: '',
    };

    try {
      const token = localStorage.getItem('token') ?? '';
      const res = await fetch(
        `http://localhost:7000/api/v1/party/${fullGRN.supplierId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const data = await res.json();
      const s = data?.data ?? data;
      supplierDetails = {
        ...s,
        id: s.id ?? fullGRN.supplierId,
        name: s.name ?? fullGRN.supplierName,
        gstin: s.gstin ?? '',
        phone: s.phone ?? '',
        stateCode: s.state_code ?? s.stateCode ?? '',
        address: s.billing_address ?? s.address ?? '',
      };
    } catch (err) {
      console.error('Failed to fetch supplier details:', err);
    }

    navigate('/purchase/invoices/new', {
      state: {
        fromGRN: {
          grnId: fullGRN.id,
          grnNumber: fullGRN.grnNumber,
          supplierId: fullGRN.supplierId,
          supplierName: fullGRN.supplierName,
          warehouseId: fullGRN.warehouseId,
          warehouseName: fullGRN.warehouseName,
          items: fullGRN.items,
          supplier: supplierDetails, // ← full supplier object
        },
      },
    });
  };

  const ensureGRNDetail = async (grn: MockGRN): Promise<MockGRN> => {
    if (grn.items.length > 0) return grn;

    setLoadingDetailId(grn.id);
    try {
      const response = await apiGetGRNById(grn.id);
      const full = mapGRNToMockGRN(response.data);
      setGrnById((prev) => ({ ...prev, [response.data.id]: response.data }));
      setGrnData((prev) => prev.map((g) => (g.id === full.id ? full : g)));
      return full;
    } catch (error) {
      console.error('Failed to load GRN detail:', error);
      return grn;
    } finally {
      setLoadingDetailId(null);
    }
  };

  const openGRNDetail = async (grn: MockGRN) => {
    const detail = await ensureGRNDetail(grn);
    setSelectedGRN(detail);
  };

  const openGRNPrint = async (grn: MockGRN) => {
    const detail = await ensureGRNDetail(grn);
    setPrintGRN(detail);
  };

  // All GRNs sorted newest first
  const allGRNs = useMemo(
    () => [...grnData].sort((a, b) => b.date.localeCompare(a.date)),
    [grnData],
  );

  // Unique suppliers for filter, scoped to selected warehouse
  const suppliers = useMemo(() => {
    const grnsInWarehouse =
      selectedWarehouseId && selectedWarehouseId !== 'ALL'
        ? allGRNs.filter((g) => g.warehouseId === selectedWarehouseId)
        : allGRNs;
    const names = Array.from(
      new Set(grnsInWarehouse.map((g) => g.supplierName).filter(Boolean)),
    );
    return ['All Suppliers', ...names];
  }, [allGRNs, selectedWarehouseId]);

  // Filtered list — date filter only applied when user explicitly changes dates
  const filtered = useMemo(() => {
    return allGRNs.filter((g) => {
      if (dateFilterActive) {
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        const gDate = new Date(g.date);
        if (gDate < from || gDate > to) return false;
      }
      if (
        supplierFilter &&
        supplierFilter !== 'All Suppliers' &&
        g.supplierName !== supplierFilter
      )
        return false;
      if (
        selectedWarehouseId &&
        selectedWarehouseId !== 'ALL' &&
        g.warehouseId !== selectedWarehouseId
      )
        return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !g.grnNumber.toLowerCase().includes(q) &&
          !g.supplierName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [
    allGRNs,
    dateFrom,
    dateTo,
    dateFilterActive,
    supplierFilter,
    selectedWarehouseId,
    search,
  ]);

  // Summary stats — this month
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthCount = allGRNs.filter(
    (g) => new Date(g.date) >= thisMonthStart,
  ).length;
  const totalItemsReceived = allGRNs.reduce(
    (s, g) => s + getGRNTotalQty(g, grnById[g.id]),
    0,
  );
  const totalUnmatched = allGRNs.reduce(
    (s, g) => s + getPOCounts(g, grnById[g.id]).unmatchedCount,
    0,
  );

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleFilter = () => setPage(1);

  const handleExportExcel = () => {
    const rows = filtered.map((g) => ({
      grnNumber: g.grnNumber,
      date: g.date,
      supplierName: g.supplierName,
      warehouseName: g.warehouseName,
      totalItems: g.totalItems,
      totalQty: getGRNTotalQty(g, grnById[g.id]),
      poLinked: getPOCounts(g, grnById[g.id]).matchedCount,
      unmatched: getPOCounts(g, grnById[g.id]).unmatchedCount,
      createdBy: g.createdBy,
    }));
    exportToExcel(
      rows as unknown as Record<string, unknown>[],
      [
        { header: 'GRN No', key: 'grnNumber', width: 18 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Supplier', key: 'supplierName', width: 22 },
        { header: 'Warehouse', key: 'warehouseName', width: 20 },
        { header: 'Items Count', key: 'totalItems', width: 12 },
        { header: 'Total Qty', key: 'totalQty', width: 12 },
        { header: 'PO Linked', key: 'poLinked', width: 12 },
        { header: 'Unmatched', key: 'unmatched', width: 12 },
        { header: 'Created By', key: 'createdBy', width: 18 },
      ],
      `GRN-Report-${dateFrom}-${dateTo}`,
      'GRN Report',
    );
  };

  const handleExportPDF = () => {
    const rows = filtered.map((g) => ({
      grnNumber: g.grnNumber,
      date: g.date,
      supplierName: g.supplierName,
      warehouseName: g.warehouseName,
      totalItems: g.totalItems,
      totalQty: getGRNTotalQty(g, grnById[g.id]),
      poLinked: getPOCounts(g, grnById[g.id]).matchedCount,
      unmatched: getPOCounts(g, grnById[g.id]).unmatchedCount,
      createdBy: g.createdBy,
    }));
    exportToPDF(
      rows as unknown as Record<string, unknown>[],
      [
        { header: 'GRN No', key: 'grnNumber', width: 20 },
        { header: 'Date', key: 'date', width: 14 },
        { header: 'Supplier', key: 'supplierName', width: 24 },
        { header: 'Warehouse', key: 'warehouseName', width: 20 },
        { header: 'Items', key: 'totalItems', width: 10 },
        { header: 'Total Qty', key: 'totalQty', width: 12 },
        { header: 'PO Linked', key: 'poLinked', width: 12 },
        { header: 'Unmatched', key: 'unmatched', width: 12 },
        { header: 'Created By', key: 'createdBy', width: 18 },
      ],
      `GRN Report — ${dateFrom} to ${dateTo}`,
      `GRN-Report-${dateFrom}-${dateTo}`,
      `${mockCompany.name} | Generated on ${new Date().toLocaleDateString('en-IN')}`,
    );
  };

  const lb = 'block text-xs font-semibold text-slate-500 mb-1';
  const inp =
    'w-full h-9 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]';

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      const respons = await deleteData(`api/v1/grn/${deleteConfirm?.id}`);
      if (respons.success === true) {
        setGrnData((prev) => prev.filter((c) => c.id !== deleteConfirm?.id));
        success('Item deactivated (soft delete)');
        setDeleteConfirm(null);
      }
    } catch (err) {
      toastError(
        err instanceof Error ? err.message : 'Failed to deactivate item',
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full space-y-5">
        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">
              Goods Receipt Notes (GRN)
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track all stock received from suppliers
            </p>
          </div>
          {canReceiveStock && (
            <button
              onClick={() => navigate('/inventory/receiving')}
              className="flex items-center gap-2 h-9 px-4 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
            >
              <i className="ri-add-line" />
              New Receiving
            </button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            icon="ri-inbox-archive-line"
            label="Total GRNs"
            value={allGRNs.length}
            sub="All time"
            color="bg-indigo-50 text-[#4f46e5]"
          />
          <SummaryCard
            icon="ri-calendar-check-line"
            label="This Month"
            value={thisMonthCount}
            sub="GRNs created"
            color="bg-emerald-50 text-emerald-600"
          />
          <SummaryCard
            icon="ri-stack-line"
            label="Total Items Received"
            value={totalItemsReceived.toLocaleString('en-IN')}
            sub="Across all GRNs"
            color="bg-sky-50 text-sky-600"
          />
          <SummaryCard
            icon="ri-alert-line"
            label="Unmatched Items"
            value={totalUnmatched}
            sub="Not linked to any PO"
            color="bg-amber-50 text-amber-600"
          />
        </div>

        {/* Filter bar */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div>
              <label className={lb}>Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setDateFilterActive(true);
                  setPage(1);
                }}
                className={inp}
              />
            </div>
            <div>
              <label className={lb}>Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setDateFilterActive(true);
                  setPage(1);
                }}
                className={inp}
              />
            </div>
            <div>
              <label className={lb}>Supplier</label>
              <select
                value={supplierFilter || 'All Suppliers'}
                onChange={(e) => {
                  setSupplierFilter(e.target.value);
                  setPage(1);
                }}
                className={inp}
              >
                {suppliers.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {/* <div>
              <label className={lb}>Warehouse</label>
              <select
                value={warehouseFilter}
                onChange={(e) => {
                  setWarehouseFilter(e.target.value);
                  setPage(1);
                }}
                className={inp}
              >
                {warehouses.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div> */}
            <div>
              <label className={lb}>Search</label>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                  placeholder="GRN No / Supplier..."
                  className="w-full h-9 pl-8 pr-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                />
              </div>
            </div>
          </div>
          {/* Export buttons row */}
          <div className="flex items-center justify-between pt-1 border-t border-[#f1f5f9]">
            <p className="text-xs text-slate-400">
              Showing{' '}
              <strong className="text-[#1e293b]">{filtered.length}</strong> of{' '}
              <strong className="text-[#1e293b]">{allGRNs.length}</strong> GRNs
            </p>
            {canExport && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-file-excel-2-line text-emerald-600" />
                  Export Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-file-pdf-2-line text-red-500" />
                  Export PDF
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
            <p className="text-sm font-semibold text-[#1e293b]">
              {filtered.length} GRN{filtered.length !== 1 ? 's' : ''} found
              {filtered.length !== allGRNs.length && (
                <span className="ml-1.5 text-xs font-normal text-slate-400">
                  (filtered from {allGRNs.length} total)
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400">
              Sorted by date (newest first)
            </p>
          </div>

          {loading && (
            <div className="px-5 py-8 text-sm text-slate-500">
              Loading GRNs...
            </div>
          )}

          {!loading && loadError && (
            <div className="px-5 py-8 text-sm text-red-600">{loadError}</div>
          )}

          {!loading && !loadError && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      'GRN No',
                      'Date',
                      'Supplier',
                      'Warehouse',
                      'Items',
                      'Total Qty',
                      'PO Linked',
                      'PI Status',
                      'Created By',
                      '',
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap ${
                          ['Items', 'Total Qty'].includes(h)
                            ? 'text-center'
                            : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((grn, i) => {
                    const totalQty = getGRNTotalQty(grn, grnById[grn.id]);
                    const { matchedCount, unmatchedCount } = getPOCounts(
                      grn,
                      grnById[grn.id],
                    );

                    return (
                      <tr
                        key={grn.id}
                        className={`border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors ${
                          i % 2 === 1 ? 'bg-[#f8fafc]' : ''
                        }`}
                        onClick={() => void openGRNDetail(grn)}
                      >
                        <td className="px-4 py-3 font-semibold text-[#4f46e5] whitespace-nowrap">
                          {grn.grnNumber}
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {grn.date}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1e293b]">
                          {grn.supplierName}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {grn.warehouseName}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600">
                          {grn.totalItems}
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-[#1e293b]">
                          {totalQty}
                        </td>
                        <td className="px-4 py-3">
                          {matchedCount > 0 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
                              <i className="ri-file-list-3-line mr-1" />
                              {matchedCount} item{matchedCount !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                        {/* <td className="px-4 py-3">
                        {matchedCount > 0 ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
                            <i className="ri-file-list-3-line mr-1" />{matchedCount}/{grn.items.length}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td> */}
                        <td className="px-4 py-3">
                          {grn.piCreated ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
                              <i className="ri-checkbox-circle-line mr-1" />
                              PI: {grn.linkedPINumber}
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium whitespace-nowrap">
                              <i className="ri-time-line mr-1" />
                              PI Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {grn.createdBy}
                        </td>
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => void openGRNDetail(grn)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#4f46e5] rounded cursor-pointer"
                              title="View"
                            >
                              <i className="ri-eye-line text-sm" />
                            </button>
                            <button
                              onClick={() => void openGRNPrint(grn)}
                              className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#4f46e5] rounded cursor-pointer"
                              title="Print"
                            >
                              <i className="ri-printer-line text-sm" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(grn)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer"
                              title="Deactivate"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !loadError && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <i className="ri-inbox-archive-line text-4xl mb-2 block" />
              <p className="text-sm">No GRNs found for the selected filters</p>
            </div>
          )}

          {/* Pagination */}
          {!loading && !loadError && totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#e2e8f0]">
              <p className="text-xs text-slate-400">
                Showing {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of{' '}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <i className="ri-arrow-left-s-line" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium cursor-pointer ${
                        p === page
                          ? 'bg-[#4f46e5] text-white'
                          : 'border border-[#e2e8f0] text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-slate-500 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <i className="ri-arrow-right-s-line" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GRN Detail Modal */}
      {selectedGRN && (
        <GRNDetailModal
          grn={selectedGRN}
          onClose={() => setSelectedGRN(null)}
          onPrint={(g) => {
            setSelectedGRN(null);
            setPrintGRN(g);
          }}
          onCreatePI={handleCreatePI}
        />
      )}

      {loadingDetailId && (
        <div className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs shadow-lg">
          Loading GRN details...
        </div>
      )}

      {/* Print View */}
      {printGRN && (
        <PrintGRNView grn={printGRN} onClose={() => setPrintGRN(null)} />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete GRN"
        message={`Are you sure you want to delete GRN "${deleteConfirm?.grnNumber ?? deleteConfirm?.id}"? This action cannot be undone.`}
        variant="danger"
        confirmLabel={isDeleting ? 'Deleting...' : 'Yes, Delete'}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}
