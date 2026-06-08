import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import PageHeader from './components/PageHeader';
import SummarySection from './components/SummarySection';
import FilterBar from './components/FilterBar';
import PurchaseTable from './components/PurchaseTable';
import PODetailModal from './components/PODetailModal';
import PrintPOView from './components/PrintPOView';
import { useToast } from '@/contexts/ToastContext';
import {
  apiGetAllPOs,
  apiGetPOById,
  apiDeletePO,
  apiCancelPO,
  type APIPO,
} from '@/api/purchaseOrderApi';
import { toDateStr, sixMonthsAgoRange } from './utils/POHelpers';
import { useCompanyState } from '@/hooks/useCompanyState';
import { getSuppliers } from '@/api/party.api.js';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const PAGE_SIZE = 50;
export type POStatus = 'ALL' | 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'CANCELLED';

function resolveGstType(
  po: APIPO | null,
  companyStateCode: string | null,
): 'CGST_SGST' | 'IGST' {
  if (!po || !companyStateCode) return 'CGST_SGST';
  const supplierState =
    (po as any).supplier?.stateCode ??
    (po as any).supplierStateCode ??
    null;
  if (!supplierState) return 'CGST_SGST';
  return supplierState === companyStateCode ? 'CGST_SGST' : 'IGST';
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const range = sixMonthsAgoRange();
  const toast = useToast();
  const companyStateCode = useCompanyState();
  const { selectedWarehouseId } = useWarehouseStore();

  // ── Filter state ───────────────────────────────────────────────────────────
  const [dateFrom, setDateFrom] = useState(range.from);
  const [dateTo, setDateTo] = useState(range.to);
  const [supplierFilter, setSupplierFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<POStatus>('ALL');
  const [search, setSearch] = useState('');
  const [dateFilterActive, setDateFilterActive] = useState(false);
  const [page, setPage] = useState(1);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<APIPO[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Modal state ────────────────────────────────────────────────────────────
  const [selectedPO, setSelectedPO] = useState<APIPO | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [printPO, setPrintPO] = useState<APIPO | null>(null);

  const activeGstType = useMemo(
    () => resolveGstType(selectedPO ?? printPO, companyStateCode),
    [selectedPO, printPO, companyStateCode],
  );

  // ── Compute stats from the already-filtered orders list ───────────────────
  const stats = useMemo(() => ({
    total:     orders.length,
    pending:   orders.filter((o) => o.status === 'PENDING').length,
    partial:   orders.filter((o) => o.status === 'PARTIAL').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
    overdue:   orders.filter((o) => o.isOverdue && o.status !== 'CANCELLED' && o.status !== 'COMPLETED').length,
  }), [orders]);

  // ── Fetch orders ───────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    setError(null);
    try {
      const res = await apiGetAllPOs({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        supplier_id: supplierFilter !== 'ALL' ? supplierFilter : undefined,
        warehouse_id: selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : undefined,
        from_date: dateFilterActive ? dateFrom : undefined,
        to_date: dateFilterActive ? dateTo : undefined,
      });
      if (res.success) {
        setOrders(res.data);
        setPage(1);
      } else {
        setError('Failed to load purchase orders');
      }
    } catch (err) {
      console.error('Orders fetch error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoadingOrders(false);
    }
  }, [search, statusFilter, supplierFilter, selectedWarehouseId, dateFilterActive, dateFrom, dateTo]);



  useEffect(() => {
    const timer = setTimeout(() => { fetchOrders(); }, search ? 400 : 0);
    return () => clearTimeout(timer);
  }, [fetchOrders, search]);

  // ── Open PO detail ─────────────────────────────────────────────────────────
  const handleOpenDetail = useCallback(async (po: APIPO) => {
    setSelectedPO(null);
    setDetailLoading(true);
    try {
      const res = await apiGetPOById(po.id);
      if (res.success) setSelectedPO(res.data);
    } catch (err) {
      console.error('PO detail fetch error:', err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  // ── Suppliers dropdown ─────────────────────────────────────────────────────
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([
    { id: 'ALL', name: 'All Suppliers' },
  ]);

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await getSuppliers(
        selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : undefined,
      );
      if (res.success && res.data) {
        setSuppliers([
          { id: 'ALL', name: 'All Suppliers' },
          ...res.data.map((s: any) => ({ id: s.id, name: s.name })),
        ]);
      }
    } catch (err) {
      console.error('Supplier fetch error:', err);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    setSupplierFilter('ALL');
    fetchSuppliers();
  }, [selectedWarehouseId, fetchSuppliers]);

  // ── Pagination ─────────────────────────────────────────────────────────────
  const filtered = orders;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const todayStr = toDateStr(new Date());

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancel = async (id: string) => {
    try {
      const res = await apiCancelPO(id);
      if (!res.success) throw new Error(res.message);
      toast.success('PO cancelled successfully');
      fetchOrders();
      setSelectedPO((prev) =>
        prev && prev.id === id ? { ...prev, status: 'CANCELLED' } : prev,
      );
    } catch {
      toast.error('Failed to cancel PO');
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  /**
   * Navigate to the edit page.
   * We close any open detail modal first so it doesn't linger behind the new route.
   */
  const handleEditPO = useCallback((po: APIPO) => {
    setSelectedPO(null);
    navigate(`/purchase-orders/edit/${po.id}`);
  }, [navigate]);

  // ── Delete ─────────────────────────────────────────────────────────────────
  /**
   * Uses apiDeletePO (typed, Bearer-auth) instead of the old deleteData helper.
   * Backend already handles the "cancel-if-stock-received" logic, so we just
   * reflect whatever the API says back to the user.
   */
  const handleDeletePO = useCallback(async (id: string) => {
    try {
      const res = await apiDeletePO(id);
      if (!res.success) throw new Error(res.message);
      // Backend may have cancelled (stock received) rather than hard-deleted
      const wasCancelled = res.message?.toLowerCase().includes('cancelled');
      toast.success(res.message ?? 'PO removed successfully');
      if (wasCancelled) {
        // Update status in-place instead of removing from list
        setOrders((prev) =>
          prev.map((o) => o.id === id ? { ...o, status: 'CANCELLED' } : o),
        );
      } else {
        setOrders((prev) => prev.filter((o) => o.id !== id));
      }
      // Close detail modal if it was showing this PO
      setSelectedPO((prev) => (prev?.id === id ? null : prev));
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to delete PO');
    }
  }, [toast]);

  // ── Receive stock ──────────────────────────────────────────────────────────
  const [receivingId, setReceivingId] = useState<string | null>(null);

  const handleReceive = useCallback(async (po: APIPO) => {
    setSelectedPO(null);
    setReceivingId(po.id);

    let fullPO = po;
    if (!po.items || po.items.length === 0) {
      try {
        const res = await apiGetPOById(po.id);
        if (res.success) fullPO = res.data;
      } catch (err) {
        console.error('Failed to fetch PO items:', err);
      }
    }
    setReceivingId(null);

    const pendingItems = (fullPO.items ?? [])
      .filter((item) => item.orderedQty - item.receivedQty > 0)
      .map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        hsnCode: item.hsnCode,
        qty: item.orderedQty - item.receivedQty,
        unit: item.unitName,
        rate: item.rate,
        poRef: fullPO.poNumber,
      }));

    navigate('/inventory/receiving', {
      state: {
        fromPO: {
          poId: fullPO.id,
          poNumber: fullPO.poNumber,
          supplierId: fullPO.supplierId,
          supplierName: fullPO.supplierName,
          items: pendingItems,
        },
      },
    });
  }, [navigate]);

  // ── Print ──────────────────────────────────────────────────────────────────
  const [printingId, setPrintingId] = useState<string | null>(null);

  const handlePrint = useCallback(async (po: APIPO) => {
    if (po.items && po.items.length > 0) { setPrintPO(po); return; }
    setPrintingId(po.id);
    try {
      const res = await apiGetPOById(po.id);
      if (res.success) setPrintPO(res.data);
    } catch (err) {
      console.error('Failed to fetch PO for print:', err);
    } finally {
      setPrintingId(null);
    }
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full space-y-5">
        <PageHeader />
        <SummarySection stats={stats} loading={loadingOrders} />

        <FilterBar
          dateFrom={dateFrom}
          dateTo={dateTo}
          setDateFrom={setDateFrom}
          setDateTo={setDateTo}
          setDateFilterActive={setDateFilterActive}
          supplierFilter={supplierFilter}
          setSupplierFilter={setSupplierFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          suppliers={suppliers}
          search={search}
          setSearch={setSearch}
          filtered={filtered}
          allPOs={orders}
          setPage={setPage}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <i className="ri-error-warning-line" />
            {error}
            <button
              onClick={fetchOrders}
              className="ml-auto text-red-600 underline text-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {loadingOrders ? (
          <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24 text-slate-400">
            <i className="ri-loader-4-line animate-spin text-2xl mr-2" />
            <span className="text-sm">Loading purchase orders...</span>
          </div>
        ) : (
          <PurchaseTable
            paginated={paginated}
            filtered={filtered}
            allPOs={orders}
            setPage={setPage}
            page={page}
            setSelectedPO={handleOpenDetail}
            handleReceive={handleReceive}
            setPrintPO={handlePrint}
            todayStr={todayStr}
            totalPages={totalPages}
            receivingId={receivingId}
            printingId={printingId}
            onEdit={handleEditPO}        // ← NEW prop
            onDelete={handleDeletePO}
            onCancel={handleCancel}
          />
        )}
      </div>

      {/* ── PO Detail Modal ────────────────────────────────────────────────── */}
      {selectedPO && (
        <PODetailModal
          po={selectedPO}
          loading={detailLoading}
          gstType={activeGstType}
          onClose={() => setSelectedPO(null)}
          onPrint={(p) => { setSelectedPO(null); setPrintPO(p); }}
          onReceive={handleReceive}
          onEdit={handleEditPO}          // ← NEW prop (wire into your modal if needed)
        />
      )}

      {/* ── Print View ─────────────────────────────────────────────────────── */}
      {printPO && (
        <PrintPOView
          po={printPO}
          gstType={activeGstType}
          onClose={() => setPrintPO(null)}
        />
      )}
    </AppLayout>
  );
}