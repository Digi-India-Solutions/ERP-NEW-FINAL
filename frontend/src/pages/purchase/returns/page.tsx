import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { useWarehouseStore } from '@/stores/warehouseStore';
import ShortcutBar from '@/components/feature/ShortcutBar';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import SearchableSelect from '@/components/SearchableSelect';
import ReturnItemsTable, {
  buildReturnRows,
  type ReturnRow,
} from '@/pages/billing/components/ReturnItemsTable';
import PurchaseReturnDetailModal, {
  type PurchaseReturn,
  type PurchaseReturnItem,
} from './components/PurchaseReturnDetailModal';
import { useToast } from '@/contexts/ToastContext';
import { useShortcuts } from '@/hooks/useShortcuts';
import { formatINR } from '@/utils/format';
import { HandlePaymentModalState } from './components/HandlePaymentModal';
import HandlePaymentModal from './components/HandlePaymentModal';
import type { OutwardGPPrefill } from '@/pages/inventory/gate-pass/outward/page';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions.js';
import { apiClient } from '@/api/client';
import { filterParties } from '@/api/party.api';
import {
  apiCreateReturn,
  apiGetAllReturns,
  apiGetReturnById,
  apiUpdatePurchaseReturn,
  apiDeletePurchaseReturn,
  PurchaseReturnDTO
} from '@/api/purchasereturn.api';
import { Eye, Pencil, Trash2 } from 'lucide-react';

// ─── Local API helpers ────────────────────────────────────────────────────────

async function apiGetPurchaseInvoices() {
  const { data } = await apiClient.get('/api/v1/purchase-invoice/active');
  return data;
}

async function apiGetInvoiceItems(invoiceId: string) {
  const { data } = await apiClient.get(`/api/v1/purchase-invoice/${invoiceId}`);
  return data;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type ReturnRecord = PurchaseReturn & {
  itemCount: number;
  grandTotal: number;
  settlementAmount: number;
  adjustmentAmount: number;
  status: string;
  supplierId: string;
  paymentHandled: boolean;
  paymentType: 'refund' | 'credit' | null;
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL';
  refundId: string | null;
  warehouseId?: string;
};

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapApiReturn(row: any): ReturnRecord {
  const items: PurchaseReturnItem[] = (row.items ?? []).map((item: any) => ({
    itemName: item.itemName ?? item.item_name ?? '—',
    hsnCode: item.hsnCode ?? item.hsn_code ?? '',
    returnQty: Number(item.qty ?? item.returnQty ?? item.return_qty ?? 0),
    unit: item.unitName ?? item.unit ?? '',
    rate: Number(item.rate ?? 0),
    amount: Number(item.totalAmount ?? item.amount ?? 0),
    reason: item.reason ?? '',
  }));

  const grandTotal =
    row.totalAmount ?? row.grand_total ?? row.grandTotal ??
    items.reduce((s, i) => s + i.amount, 0);

  const paymentHandled = row.paymentHandled ?? row.payment_handled ?? false;
  const paymentType = row.paymentType ?? row.payment_type ?? null;

  return {
    id: row.id,
    billNo: row.returnNumber ?? row.return_number ?? row.billNo ?? row.id,
    date: (row.date ?? row.createdAt ?? '').slice(0, 10),
    partyName: row.supplierName ?? row.supplier_name ?? row.partyName ?? '—',
    warehouseName: row.warehouseName ?? row.warehouse_name ?? '—',
    originalInvoiceNo: row.originalInvoiceNo ?? row.original_invoice_no ?? '—',
    originalInvoiceId: row.originalInvoiceId ?? row.original_invoice_id ?? '',
    items,
    itemCount: items.length,
    grandTotal,
    settlementAmount: Number(row.settlementAmount ?? row.settlement_amount ?? grandTotal),
    adjustmentAmount: Number(row.adjustmentAmount ?? row.adjustment_amount ?? 0),
    status: row.status ?? 'SAVED',
    supplierId: row.supplierId ?? row.supplier_id ?? '',
    paymentHandled,
    paymentType,
    paymentStatus: paymentHandled ? 'PAID' : 'UNPAID',
    refundId: row.refundId ?? row.refund_id ?? null,
    warehouseId: row.warehouseId ?? row.warehouse_id ?? '',
  };
}

// ─── Known reasons (must match ReturnItemsTable) ──────────────────────────────

const KNOWN_REASONS = ['Damaged', 'Wrong Item', 'Expired', 'Quality Issue', 'Other'];

// ─── Badge ────────────────────────────────────────────────────────────────────

function PaymentStatusBadge({ ret }: { ret: ReturnRecord }) {
  if (ret.paymentHandled && ret.paymentType === 'refund') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium whitespace-nowrap">
        Refund Received
      </span>
    );
  }
  if (ret.paymentHandled && ret.paymentType === 'credit') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium whitespace-nowrap">
        Credit Kept
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-medium whitespace-nowrap">
      Payment Pending
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PurchaseReturnsPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [mode, setMode] = useState<'list' | 'new'>('list');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [returnRows, setReturnRows] = useState<ReturnRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<ReturnRecord | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<ReturnRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Edit state ────────────────────────────────────────────────────────────
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);
  const [editingReturnDate, setEditingReturnDate] = useState<string>('');
  const isEditingRef = useRef(false);
  const enteredViaEditRef = useRef(false);

  const [handlePaymentModal, setHandlePaymentModal] = useState<HandlePaymentModalState>({
    open: false, returnId: '', returnNo: '', supplierId: '',
    supplierName: '', invoiceId: '', amount: 0,
    currentDue: 0, autoAppliedAmount: 0, remainingAmount: 0,
  });

  const { selectedWarehouseId } = useWarehouseStore();

  const filteredReturns = useMemo(() => {
    if (!selectedWarehouseId || selectedWarehouseId === 'ALL') {
      return returns;
    }
    return returns.filter((r) => r.warehouseId === selectedWarehouseId);
  }, [returns, selectedWarehouseId]);

  const filteredInvoices = useMemo(() => {
    if (!selectedWarehouseId || selectedWarehouseId === 'ALL') {
      return invoices;
    }
    return invoices.filter((inv) => inv.warehouseId === selectedWarehouseId);
  }, [invoices, selectedWarehouseId]);

  // Reset form when warehouse changes
  useEffect(() => {
    resetForm();
  }, [selectedWarehouseId]);

  const { hasPermission } = useAuth();
  const canCreateReturn = hasPermission(MODULES.PURCHASE_RETURN, 'create');
  const canCreateGP = hasPermission(MODULES.GATE_PASS_OUTWARD, 'create');
  const canCreatePayment = hasPermission(MODULES.PURCHASE_PAYMENT, 'create');

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadReturns = async () => {
    setLoading(true);
    try {
      const resp = await apiGetAllReturns();
      setReturns((resp.data ?? []).map(mapApiReturn));
    } catch {
      toast.error('Could not load purchase returns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReturns(); }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await apiGetPurchaseInvoices();
        setInvoices(resp.data ?? []);
      } catch { toast.error('Failed to load invoices'); }
    };
    load();
  }, []);

  // ── Load items when invoice selected (skip during edit) ───────────────────

  useEffect(() => {
    if (!selectedInvoiceId) { setReturnRows([]); return; }
    // Guard: if we just set this from handleEditReturn, skip the fetch
    if (isEditingRef.current) { isEditingRef.current = false; return; }

    const load = async () => {
      try {
        const resp = await apiGetInvoiceItems(selectedInvoiceId);
        setReturnRows(buildReturnRows(resp.data?.items ?? []));
      } catch { toast.error('Failed to load invoice items'); }
    };
    load();
  }, [selectedInvoiceId]);

  // ── Helpers ───────────────────────────────────────────────────────────────

  const totalAmount = returnRows.filter((r) => r.selected).reduce((s, r) => s + r.amount, 0);
  const hasErrors = returnRows.some((r) => r.qtyError);

  const resetForm = () => {
    setSelectedInvoiceId('');
    setReturnRows([]);
    setEditingReturnId(null);
    setEditingReturnDate('');
    isEditingRef.current = false;
    enteredViaEditRef.current = false;
  };

  const goToList = () => { resetForm(); setMode('list'); };

  const updateReturnInList = (
    returnId: string,
    type: 'refund' | 'credit',
    refundId?: string,
    settledAmount?: number,
    adjustmentAmount?: number,
  ) => {
    setReturns((prev) =>
      prev.map((r) =>
        r.id === returnId
          ? { ...r, paymentHandled: true, paymentType: type,
              refundId: refundId ?? null,
              settlementAmount: settledAmount ?? r.settlementAmount,
              adjustmentAmount: adjustmentAmount ?? r.adjustmentAmount }
          : r
      )
    );
  };

  const needsHandlePayment = (ret: ReturnRecord) =>
    !ret.paymentHandled && ret.paymentType === null;

  const getSupplierCurrentDue = async (supplierId: string, supplierName: string) => {
    try {
      const res = await filterParties({ type: 'supplier', isActive: true, search: supplierName || undefined });
      const matched = (res.data ?? []).find(
        (p: any) => p.id === supplierId || p.name === supplierName
      );
      return Number(matched?.opening_balance ?? matched?.balance ?? 0);
    } catch { return 0; }
  };

  const openSettlementModal = async (ret: ReturnRecord, invoiceId: string) => {
    const currentDue = await getSupplierCurrentDue(ret.supplierId, ret.partyName);
    const autoAppliedAmount = currentDue < 0
      ? Math.min(ret.grandTotal, Math.abs(currentDue))
      : 0;

    setHandlePaymentModal({
      open: true,
      returnId: ret.id,
      returnNo: ret.billNo,
      supplierId: ret.supplierId,
      supplierName: ret.partyName,
      invoiceId,
      amount: ret.grandTotal,
      currentDue,
      autoAppliedAmount,
      remainingAmount: Math.max(ret.grandTotal - autoAppliedAmount, 0),
    });
  };

  const handleGenerateOutwardGP = (ret: ReturnRecord) => {
    const prefill: OutwardGPPrefill = {
      partyName: ret.partyName,
      linkedDocType: 'PURCHASE_RETURN',
      linkedDocNumber: ret.billNo,
      notes: `Generated from Purchase Return ${ret.billNo}`,
      items: (ret.items ?? []).map((i) => ({
        itemName: i.itemName, qty: i.returnQty, unit: i.unit || 'Pcs',
      })),
    };
    navigate('/inventory/gate-pass/outward', { state: { prefill } });
  };

  // ── Edit ──────────────────────────────────────────────────────────────────

  const handleEditReturn = async (ret: ReturnRecord) => {
    try {
      setSaving(true);

      // 1. Fetch full return detail
      const detailResp = await apiGetReturnById(ret.id);
      const detail: PurchaseReturnDTO = detailResp.data!;

      // 2. Fetch original invoice so soldQty is correct
      const invoiceResp = await apiGetInvoiceItems(
        detail.originalInvoiceId ?? detail.original_invoice_id
      );
      const invoiceItems: any[] = invoiceResp.data?.items ?? [];
      const invoiceItemMap = Object.fromEntries(
        invoiceItems.map((i: any) => [String(i.itemId ?? i.item_id), Number(i.qty ?? 0)])
      );

      // 3. Build rows with correct soldQty and reason
      const rows: ReturnRow[] = (detail.items ?? []).map((item: any) => {
        const isKnown = KNOWN_REASONS.includes(item.reason);
        return {
          id: item.id,
          itemId: item.itemId ?? item.item_id,
          itemName: item.itemName ?? item.item_name ?? '—',
          hsnCode: item.hsnCode ?? item.hsn_code ?? '',
          soldQty: invoiceItemMap[String(item.itemId ?? item.item_id)] ?? item.returnQty ?? 1,
          returnQty: Number(item.returnQty ?? item.return_qty ?? 1),
          unit: item.unit ?? item.unitName ?? 'Pcs',
          rate: Number(item.rate ?? 0),
          amount: Number(item.returnQty ?? 1) * Number(item.rate ?? 0),
          selected: true,
          reason: isKnown ? item.reason : 'Other',
          customReason: isKnown ? '' : (item.customReason ?? item.reason ?? ''),
          qtyError: false,
        };
      });

      // 4. Set ref BEFORE setSelectedInvoiceId to block the useEffect
      isEditingRef.current = true;
      enteredViaEditRef.current = true;
      setReturnRows(rows);
      setSelectedInvoiceId(detail.originalInvoiceId ?? detail.original_invoice_id);
      setEditingReturnId(ret.id);
      setEditingReturnDate((detail.date ?? ret.date ?? '').slice(0, 10));
      setMode('new');

    } catch {
      toast.error('Failed to load return for editing');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    try {
      await apiDeletePurchaseReturn(deleteConfirm.id);
      // ✅ was setReturnRows — now correctly removes from returns list
      setReturns((prev) => prev.filter((r) => r.id !== deleteConfirm.id));
      toast.success('Purchase return deleted successfully');
      setDeleteConfirm(null);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to delete return');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Save (create + update) ────────────────────────────────────────────────

  const handleSave = async () => {

    // ── UPDATE path ──────────────────────────────────────────────────────
    if (editingReturnId) {
      const selected = returnRows.filter((r) => r.selected && r.returnQty > 0);
      if (!selected.length) { toast.error('Select at least one item'); return; }
      if (hasErrors) { toast.error('Fix quantity errors first'); return; }
      const needsReason = selected.filter(
        (r) => r.reason === 'Other' && !r.customReason.trim()
      );
      if (needsReason.length) { toast.error('Specify "Other" reasons'); return; }

      setSaving(true);
      try {
        await apiUpdatePurchaseReturn(editingReturnId, {
          date: editingReturnDate || new Date().toISOString().split('T')[0],
          reason: selected[0]?.reason === 'Other'
            ? selected[0]?.customReason || 'Other'
            : selected[0]?.reason || 'Damaged',
          items: selected.map((r) => ({
            itemId: r.itemId,
            qty: r.returnQty,
            rate: r.rate,
            hsnCode: r.hsnCode,
            reason: r.reason === 'Other' ? r.customReason : r.reason,  // ← reason sent
          })),
        });

        toast.success('Purchase return updated successfully');

        // Refresh list with correct mapping
        const refreshed = await apiGetAllReturns();
        setReturns((refreshed.data ?? []).map(mapApiReturn));

        goToList();
      } catch (err: any) {
        toast.error(err?.message ?? 'Failed to update return');
      } finally {
        setSaving(false);
      }
      return;
    }

    // ── CREATE path ──────────────────────────────────────────────────────
    if (!selectedInvoiceId) { toast.error('Select an invoice first'); return; }
    const selected = returnRows.filter((r) => r.selected && r.returnQty > 0);
    if (!selected.length) { toast.error('Select at least one item to return'); return; }
    if (hasErrors) { toast.error('Fix quantity errors first'); return; }
    const needsReason = selected.filter(
      (r) => r.reason === 'Other' && !r.customReason.trim()
    );
    if (needsReason.length) { toast.error('Specify "Other" reasons'); return; }

    setSaving(true);
    try {
      const invoiceResp = await apiGetInvoiceItems(selectedInvoiceId);
      const invoiceData = invoiceResp?.data ?? invoiceResp;
      const supplierCurrentDue = await getSupplierCurrentDue(
        invoiceData?.supplierId ?? invoiceData?.supplier_id ?? '',
        invoiceData?.supplierName ?? invoiceData?.supplier_name ?? ''
      );

      const payload = {
        originalInvoiceId: selectedInvoiceId,
        date: new Date().toISOString().split('T')[0],
        reason: selected[0]?.reason === 'Other'
          ? selected[0]?.customReason || 'Other'
          : selected[0]?.reason || 'Damaged items received',
        items: selected.map((r) => ({
          itemId: r.itemId,
          qty: r.returnQty,
          rate: r.rate,
          reason: r.reason === 'Other' ? r.customReason : r.reason,
        })),
      };

      const created = await apiCreateReturn(payload);
      const returnId = created?.data?.id ?? created?.id;
      if (!returnId) throw new Error('No return ID in response');

      const detail = await apiGetReturnById(returnId);
      const newRecord = mapApiReturn(detail.data ?? detail);

      setReturns((prev) => [newRecord, ...prev]);
      toast.success(
        `Return ${newRecord.billNo} saved — ${selected.length} item${selected.length !== 1 ? 's' : ''}, ${formatINR(newRecord.grandTotal)}`
      );

      setMode('list');
      resetForm();

      const autoAppliedAmount = supplierCurrentDue < 0
        ? Math.min(newRecord.grandTotal, Math.abs(supplierCurrentDue))
        : 0;

      setTimeout(() => {
        setHandlePaymentModal({
          open: true,
          returnId: newRecord.id,
          returnNo: newRecord.billNo,
          supplierId: newRecord.supplierId,
          supplierName: newRecord.partyName,
          invoiceId: selectedInvoiceId,
          amount: newRecord.grandTotal,
          currentDue: supplierCurrentDue,
          autoAppliedAmount,
          remainingAmount: Math.max(newRecord.grandTotal - autoAppliedAmount, 0),
        });
      }, 50);

    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to save return');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Don't prompt discard if we entered via edit without making changes
    const dirty = enteredViaEditRef.current ? false : !!selectedInvoiceId;
    if (dirty) {
      setDiscardConfirm(true);
    } else {
      goToList();
    }
  };

  useShortcuts('purchase-return-new', { F9: handleSave, Escape: handleCancel });

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <AppLayout>

      {/* ── NEW / EDIT MODE ───────────────────────────────────────────────── */}
      {mode === 'new' && (
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-6 pb-16 bg-[#f8fafc]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-bold text-[#1e293b]">
                  {editingReturnId ? 'Edit Purchase Return' : 'New Purchase Return'}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Select invoice and items — stock updated (RETURN_OUT)
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {saving ? (
                  <><i className="ri-loader-4-line animate-spin" /> Saving…</>
                ) : (
                  <>
                    <i className="ri-save-3-line" />
                    {editingReturnId ? 'Update Return' : 'Save Return'}
                    <kbd className="text-[10px] bg-white/20 px-1 rounded ml-1">F9</kbd>
                  </>
                )}
              </button>
            </div>

            {/* Invoice selector — disabled when editing */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Original Purchase Invoice <span className="text-red-500">*</span>
              </label>
              {editingReturnId ? (
                // Show read-only label during edit — invoice cannot change
                <div className="h-10 px-3 flex items-center text-sm text-slate-600 bg-slate-50 border border-[#e2e8f0] rounded-lg">
                  {invoices.find((i) => i.id === selectedInvoiceId)?.invoiceNumber
                    ?? invoices.find((i) => i.id === selectedInvoiceId)?.billNo
                    ?? selectedInvoiceId}
                  <span className="ml-2 text-xs text-slate-400">(locked during edit)</span>
                </div>
              ) : (
                <SearchableSelect
                  options={filteredInvoices.map((inv) => ({
                    id: inv.id,
                    value: inv.id,
                    label: `${inv.invoiceNumber ?? inv.billNo ?? inv.bill_no} — ${inv.supplierName ?? inv.supplier_name} (${formatINR(inv.totalAmount ?? inv.grandTotal ?? 0)})`,
                  }))}
                  value={selectedInvoiceId}
                  onChange={setSelectedInvoiceId}
                  placeholder="— Search Invoice —"
                />
              )}
            </div>

            {/* Items table */}
            {returnRows.length > 0 ? (
              <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
                  Items to Return
                </h2>
                <ReturnItemsTable rows={returnRows} onChange={setReturnRows} />
              </div>
            ) : (
              selectedInvoiceId && (
                <div className="bg-white border border-[#e2e8f0] rounded-xl p-10 text-center text-slate-400">
                  <i className="ri-box-3-line text-4xl block mb-2" />
                  <p>No items found for this invoice</p>
                </div>
              )
            )}
          </div>

          <ShortcutBar onSave={handleSave} onBack={handleCancel} saving={saving} hidePrint />

          <ConfirmDialog
            open={discardConfirm}
            title="Cancel Return?"
            message="Discard this return? No changes will be saved."
            variant="warning"
            confirmLabel="Yes, Discard (Y)"
            cancelLabel="Keep Editing (N)"
            onConfirm={() => { setDiscardConfirm(false); goToList(); }}
            onCancel={() => setDiscardConfirm(false)}
          />
        </div>
      )}

      {/* ── LIST MODE ─────────────────────────────────────────────────────── */}
      {mode === 'list' && (
        <div className="p-6 bg-[#f8fafc] min-h-full">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Purchase Returns</h1>
              <p className="text-sm text-slate-500">
                {loading ? 'Loading…' : `${filteredReturns.length} returns`}
              </p>
            </div>
            {canCreateReturn && (
              <button
                onClick={() => setMode('new')}
                className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line" /> New Return
              </button>
            )}
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20 text-slate-400 gap-2">
                <i className="ri-loader-4-line animate-spin text-xl" />
                <span>Loading returns…</span>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[1100px] text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Return No', 'Date', 'Supplier', 'Original Invoice', 'Items', 'Amount', 'Payment Status', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReturns.map((r, i) => (
                      <tr
                        key={r.id}
                        className={`border-b border-slate-50 hover:bg-indigo-50/20 transition-colors ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}
                      >
                        <td
                          className="px-4 py-3 font-semibold text-[#4f46e5] cursor-pointer hover:underline"
                          onClick={() => setSelectedReturn(r)}
                        >
                          {r.billNo}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.date}</td>
                        <td className="px-4 py-3 font-medium text-[#1e293b]">{r.partyName}</td>
                        <td className="px-4 py-3 text-slate-500">{r.originalInvoiceNo}</td>
                        <td className="px-4 py-3 text-center">{r.itemCount}</td>
                        <td className="px-4 py-3 font-semibold">{formatINR(r.grandTotal)}</td>
                        <td className="px-4 py-3"><PaymentStatusBadge ret={r} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 flex-nowrap">

                            <button
                              onClick={() => setSelectedReturn(r)}
                              className="h-7 px-2.5 rounded-md text-xs font-medium border border-[#e2e8f0] text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            {/* Edit — only if payment not yet handled */}
                            {!r.paymentHandled && (
                              <button
                                onClick={() => void handleEditReturn(r)}
                                className="h-7 px-2.5 rounded-md text-xs font-medium border border-[#e2e8f0] text-slate-600 hover:bg-slate-50 cursor-pointer"
                                title="Edit return"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => setDeleteConfirm(r)}
                              className="h-7 px-2.5 rounded-md text-xs font-medium border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer"
                              title="Delete return"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>

                            {canCreateGP && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleGenerateOutwardGP(r); }}
                                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer whitespace-nowrap"
                              >
                                <i className="ri-file-shield-2-line" /> Generate GP
                              </button>
                            )}

                            {needsHandlePayment(r) && canCreatePayment && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void openSettlementModal(r, r.originalInvoiceId);
                                }}
                                className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                              >
                                Handle Payment
                              </button>
                            )}

                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!loading && filteredReturns.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <i className="ri-arrow-go-back-line text-4xl mb-2 block" />
                <p className="text-sm">No purchase returns yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODALS (always outside mode blocks) ───────────────────────────── */}

      {selectedReturn && (
        <PurchaseReturnDetailModal
          ret={selectedReturn}
          onClose={() => setSelectedReturn(null)}
        />
      )}

      {handlePaymentModal.open && (
        <HandlePaymentModal
          state={handlePaymentModal}
          onClose={() => setHandlePaymentModal((s) => ({ ...s, open: false }))}
          onDone={(returnId, type, refundId, settledAmount, adjustmentAmount) => {
            updateReturnInList(returnId, type, refundId, settledAmount, adjustmentAmount);
            setHandlePaymentModal((s) => ({ ...s, open: false }));
          }}
        />
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Purchase Return?"
        message={`Remove "${deleteConfirm?.billNo}"? This will reverse stock movements and cannot be undone.`}
        variant="danger"
        confirmLabel={isDeleting ? 'Deleting...' : 'Yes, Delete'}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteConfirm(null)}
      />

    </AppLayout>
  );
}