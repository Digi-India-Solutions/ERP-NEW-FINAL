import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AppLayout from '@/components/feature/AppLayout';
import ChequeStatusModal, {
  type ChequePaymentInfo,
} from '@/components/feature/ChequeStatusModal';
import { formatINR } from '@/utils/format';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'NEFT' | 'RTGS';
type ChequeStatus = 'PENDING' | 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE';
type TxType = 'ALL' | 'PAYMENTS' | 'RETURNS';
type ModeFilter = 'ALL' | PaymentMode | 'CREDIT';

export interface PaymentVoucher {
  id: string;
  type: string;
  voucherNumber: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceAmount: number;
  balanceDue?: number;
  paymentAmount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  cardLastFour?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeStatus?: ChequeStatus;
  bounceReason?: string;
  notes?: string;
}

export interface RefundVoucher {
  id: string;
  refundNumber: string;
  date: string;
  supplierName: string;
  returnNumber: string;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
}

interface PurchaseReturnPaymentRecord {
  id: string;
  returnNumber: string;
  date: string;
  supplierName?: string;
  originalInvoiceNo?: string;
  totalAmount: number;
  paymentHandled: boolean;
  paymentType?: 'refund' | 'credit' | null;
}

// ─── API ──────────────────────────────────────────────────────────────────────

const BASE_URL = `http://localhost:7001

/api/v1/purchase-payment`;

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGetPayments(
  warehouseId?: string,
): Promise<PaymentVoucher[]> {
  let url = BASE_URL;
  if (warehouseId && warehouseId !== 'ALL') {
    url += `?warehouse_id=${warehouseId}`;
  }
  const res = await fetch(url, { headers: { ...getAuthHeader() } });
  if (!res.ok) throw new Error('Failed to fetch payments');
  const json = await res.json();
  return json?.data ?? [];
}

export async function apiGetReturnPayments(
  warehouseId?: string,
): Promise<PurchaseReturnPaymentRecord[]> {
  let url = 'http://localhost:7001/api/v1/purchase-return';
  if (warehouseId && warehouseId !== 'ALL') {
    url += `?warehouse_id=${warehouseId}`;
  }
  const res = await fetch(url, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) throw new Error('Failed to fetch purchase return payments');
  const json = await res.json();
  return json?.data ?? [];
}

export async function apiUpdateChequeStatus(
  id: string,
  chequeStatus: 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE',
  bounceReason?: string,
): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}/cheque-status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
    body: JSON.stringify({
      chequeStatus,
      ...(bounceReason ? { bounceReason } : {}),
    }),
  });
  const json = await res.json();
  if (!res.ok)
    throw new Error(json?.message || 'Failed to update cheque status');
}

export async function apiDeletePayment(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: { ...getAuthHeader() },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.message || 'Failed to delete payment');
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CHEQUE_STATUS_COLORS: Record<ChequeStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  CLEARED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  BOUNCED: 'bg-red-50 text-red-700 border-red-200',
  INSUFFICIENT_BALANCE: 'bg-red-50 text-red-700 border-red-200',
};
const CHEQUE_STATUS_ICONS: Record<ChequeStatus, string> = {
  PENDING: 'ri-time-line',
  CLEARED: 'ri-checkbox-circle-line',
  BOUNCED: 'ri-close-circle-line',
  INSUFFICIENT_BALANCE: 'ri-error-warning-line',
};
const CHEQUE_STATUS_LABELS: Record<ChequeStatus, string> = {
  PENDING: 'Pending',
  CLEARED: 'Cleared',
  BOUNCED: 'Bounced',
  INSUFFICIENT_BALANCE: 'Insuff. Balance',
};
const MODE_COLORS: Record<string, string> = {
  CASH: 'bg-emerald-50 text-emerald-700',
  UPI: 'bg-violet-50 text-violet-700',
  CARD: 'bg-sky-50 text-sky-700',
  CHEQUE: 'bg-amber-50 text-amber-700',
  NEFT: 'bg-indigo-50 text-indigo-700',
  RTGS: 'bg-rose-50 text-rose-700',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDefaultFromDate(): string {
  return '2024-01-01';
}
function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── Normalised row ───────────────────────────────────────────────────────────

interface TxRow {
  type: string;
  id: string;
  number: string;
  date: string;
  partyName: string;
  linkedDoc: string;
  amount: number;
  paymentMode: PaymentMode | 'CREDIT';
  referenceNo?: string;
  chequeNo?: string;
  bankName?: string;
  chequeStatus?: ChequeStatus;
  notes?: string;
  raw: PaymentVoucher | null;
}

function paymentToRow(v: PaymentVoucher): TxRow {
  return {
    type: v.type ?? 'PAYMENT',
    id: v.id,
    number: v.voucherNumber,
    date: v.date,
    partyName: v.supplierName,
    linkedDoc: v.invoiceNumber,
    amount: v.paymentAmount,
    paymentMode: v.paymentMode,
    referenceNo: v.referenceNo,
    chequeNo: v.chequeNo,
    bankName: v.bankName,
    chequeStatus: v.chequeStatus,
    notes: v.notes,
    raw: v,
  };
}

function refundToRow(r: RefundVoucher): TxRow {
  return {
    type: 'REFUND',
    id: r.id,
    number: r.refundNumber,
    date: r.date,
    partyName: r.supplierName,
    linkedDoc: r.returnNumber,
    amount: r.amount,
    paymentMode: r.paymentMode,
    referenceNo: r.referenceNo,
    raw: null,
  };
}

function returnCreditToRow(r: PurchaseReturnPaymentRecord): TxRow {
  return {
    type: 'CREDIT',
    id: r.id,
    number: r.returnNumber,
    date: r.date,
    partyName: r.supplierName ?? '—',
    linkedDoc: r.originalInvoiceNo ?? '—',
    amount: r.totalAmount,
    paymentMode: 'CREDIT',
    notes: 'Supplier credit kept from purchase return',
    raw: null,
  };
}

interface BouncedAlert {
  invoiceNumber: string;
  paymentId: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PurchasePaymentsHistoryPage() {
  const navigate = useNavigate();
  const { hasPermission, hasControl } = useAuth();
  const canCreatePayment = hasPermission(MODULES.PURCHASE_PAYMENT, 'create');
  const canExport = hasControl('exportData');
  const { selectedWarehouseId } = useWarehouseStore();

  // ── Server data ────────────────────────────────────────────────────────────
  const [payments, setPayments] = useState<PaymentVoucher[]>([]);
  const [refunds] = useState<RefundVoucher[]>([]); // kept for compatibility
  const [returnCredits, setReturnCredits] = useState<
    PurchaseReturnPaymentRecord[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [txType, setTxType] = useState<TxType>('ALL');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('ALL');
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getToday());
  const [chequeModal, setChequeModal] = useState<ChequePaymentInfo | null>(
    null,
  );
  const [detailVoucher, setDetailVoucher] = useState<PaymentVoucher | null>(
    null,
  );
  const [bouncedAlert, setBouncedAlert] = useState<BouncedAlert | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadPayments = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [paymentData, returnData] = await Promise.all([
        apiGetPayments(selectedWarehouseId),
        apiGetReturnPayments(selectedWarehouseId),
      ]);
      setPayments(paymentData);
      setReturnCredits(
        (returnData || []).filter(
          (ret) => ret.paymentHandled && ret.paymentType === 'credit',
        ),
      );
    } catch (err) {
      setFetchError(
        err instanceof Error ? err.message : 'Failed to load payments',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedWarehouseId]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  // ── Derived rows ───────────────────────────────────────────────────────────
  const allTransactions = useMemo<TxRow[]>(
    () =>
      [
        ...payments.map(paymentToRow),
        ...refunds.map(refundToRow),
        ...returnCredits.map(returnCreditToRow),
      ].sort((a, b) => b.date.localeCompare(a.date)),
    [payments, refunds, returnCredits],
  );

  const filtered = useMemo(
    () =>
      allTransactions.filter((tx) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          tx.number.toLowerCase().includes(q) ||
          tx.partyName.toLowerCase().includes(q) ||
          tx.linkedDoc.toLowerCase().includes(q) ||
          (tx.referenceNo ?? '').toLowerCase().includes(q) ||
          (tx.chequeNo ?? '').toLowerCase().includes(q);
        const matchType =
          txType === 'ALL' ||
          (txType === 'PAYMENTS' && tx.type === 'PAYMENT') ||
          (txType === 'RETURNS' &&
            (tx.type === 'REFUND' || tx.type === 'CREDIT'));
        const matchMode = modeFilter === 'ALL' || tx.paymentMode === modeFilter;
        const matchFrom = !fromDate || tx.date >= fromDate;
        const matchTo = !toDate || tx.date <= toDate;
        return matchSearch && matchType && matchMode && matchFrom && matchTo;
      }),
    [allTransactions, search, txType, modeFilter, fromDate, toDate],
  );

  // ── Summary totals ─────────────────────────────────────────────────────────
  const totalCount = filtered.length;
  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0);
  const cashTotal = filtered
    .filter((t) => t.paymentMode === 'CASH')
    .reduce((s, t) => s + t.amount, 0);
  const chequeTotal = filtered
    .filter((t) => t.paymentMode === 'CHEQUE')
    .reduce((s, t) => s + t.amount, 0);
  const digitalTotal = filtered
    .filter((t) => ['UPI', 'NEFT', 'RTGS', 'CARD'].includes(t.paymentMode))
    .reduce((s, t) => s + t.amount, 0);
  const totalPaid = filtered
    .filter((t) => t.type === 'PAYMENT')
    .reduce((s, t) => s + t.amount, 0);
  const totalReturnSettlements = filtered
    .filter((t) => t.type === 'REFUND' || t.type === 'CREDIT')
    .reduce((s, t) => s + t.amount, 0);
  const bouncedCount = filtered.filter(
    (t) =>
      t.chequeStatus === 'BOUNCED' || t.chequeStatus === 'INSUFFICIENT_BALANCE',
  ).length;

  // ── Exports ────────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const rows = filtered.map((tx) => ({
      'Voucher No': tx.number,
      Date: tx.date,
      Supplier: tx.partyName,
      'Invoice No': tx.linkedDoc,
      Amount: tx.amount,
      'Payment Mode': tx.paymentMode,
      'Reference No': tx.referenceNo ?? '',
      'Cheque No': tx.chequeNo ?? '',
      'Cheque Status': tx.chequeStatus ?? '',
      Notes: tx.notes ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Transactions');
    XLSX.writeFile(wb, `Purchase-Payments-${fromDate}-${toDate}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Transactions Report', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${fromDate} to ${toDate}`, 14, 26);
    doc.text('Purchase Payments', doc.internal.pageSize.width - 14, 18, {
      align: 'right',
    });
    autoTable(doc, {
      head: [
        [
          'Voucher No',
          'Date',
          'Supplier',
          'Invoice No',
          'Amount',
          'Mode',
          'Reference No',
          'Cheque No',
          'Cheque Status',
          'Notes',
        ],
      ],
      body: filtered.map((tx) => [
        tx.number,
        tx.date,
        tx.partyName,
        tx.linkedDoc,
        formatINR(tx.amount),
        tx.paymentMode,
        tx.referenceNo ?? '',
        tx.chequeNo ?? '',
        tx.chequeStatus ?? '',
        tx.notes ?? '',
      ]),
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: {
        fillColor: [79, 70, 229],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    const pageCount = (
      doc as jsPDF & { internal: { getNumberOfPages: () => number } }
    ).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Generated on ${getToday()} · Total: ${formatINR(totalAmount)} · Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 8,
      );
    }
    doc.save(`Purchase-Payments-${fromDate}-${toDate}.pdf`);
  };

  // ── Cheque modal ───────────────────────────────────────────────────────────
  const openChequeModal = (v: PaymentVoucher) => {
    setChequeModal({
      id: v.id,
      number: v.voucherNumber,
      date: v.date,
      partyName: v.supplierName,
      invoiceNumber: v.invoiceNumber,
      amount: v.paymentAmount,
      bankName: v.bankName,
      chequeNo: v.chequeNo,
      chequeDate: v.chequeDate,
      chequeStatus: v.chequeStatus ?? 'PENDING',
      bounceReason: v.bounceReason,
      partyType: 'SUPPLIER',
    });
  };

  const handleChequeUpdate = async (
    id: string,
    newStatus: 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE',
    reason?: string,
  ) => {
    try {
      await apiUpdateChequeStatus(id, newStatus, reason);

      // Refresh list from server to get accurate state
      await loadPayments();

      if (newStatus === 'CLEARED') {
        showToast('Cheque cleared successfully');
      } else {
        const vou = payments.find((v) => v.id === id);
        if (vou)
          setBouncedAlert({ invoiceNumber: vou.invoiceNumber, paymentId: id });
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to update cheque status',
      );
    } finally {
      setChequeModal(null);
      setDetailVoucher(null);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full space-y-5">
        {/* Toast */}
        {toast && (
          <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2">
            <i className="ri-checkbox-circle-line" /> {toast}
          </div>
        )}

        {/* Bounced alert */}
        {bouncedAlert && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-red-700">
              <i className="ri-error-warning-line text-lg" />
              <span className="text-sm font-semibold">
                Cheque bounced! {bouncedAlert.invoiceNumber} is now UNPAID.
                Record new payment from the invoice list.
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Send to invoices — user picks which invoice to pay from there */}
              <button
                onClick={() => navigate('/purchase/invoices')}
                className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer whitespace-nowrap transition-colors"
              >
                Go to Invoices
              </button>
              <button
                onClick={() => setBouncedAlert(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-400 cursor-pointer transition-colors"
              >
                <i className="ri-close-line text-sm" />
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">
                Purchase Payments
              </h1>
              <p className="text-sm text-slate-500">
                {allTransactions.length} total transactions
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canExport && (
              <button
                onClick={exportExcel}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap transition-colors"
              >
                <i className="ri-file-excel-2-line text-emerald-600" /> Export
                Excel
              </button>
            )}
            {canExport && (
              <button
                onClick={exportPDF}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap transition-colors"
              >
                <i className="ri-file-pdf-2-line text-red-500" /> Export PDF
              </button>
            )}
            {/* Payment requires selecting an invoice first — send to invoice list */}
            {canCreatePayment && (
              <button
                // onClick={() => navigate('/purchase/invoices')}
                onClick={() => navigate('/purchase/payments/news')}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
              >
                <i className="ri-add-line" /> Available Dues
              </button>
            )}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer"
              />
            </div>
            <div className="relative flex-1 min-w-52">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search voucher no, supplier, invoice..."
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
              {(
                [
                  { key: 'ALL', label: 'All Transactions' },
                  { key: 'PAYMENTS', label: 'Invoice Payments' },
                  { key: 'RETURNS', label: 'Return Payments' },
                ] as { key: TxType; label: string }[]
              ).map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTxType(t.key)}
                  className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${txType === t.key ? 'bg-white text-[#1e293b]' : 'text-slate-500 hover:text-[#1e293b]'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
              {(
                [
                  'ALL',
                  'CASH',
                  'UPI',
                  'CARD',
                  'CHEQUE',
                  'NEFT',
                  'RTGS',
                  'CREDIT',
                ] as ModeFilter[]
              ).map((m) => (
                <button
                  key={m}
                  onClick={() => setModeFilter(m)}
                  className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${modeFilter === m ? 'bg-white text-[#1e293b]' : 'text-slate-500 hover:text-[#1e293b]'}`}
                >
                  {m === 'ALL' ? 'All Modes' : m}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">
              Showing{' '}
              <span className="font-semibold text-[#1e293b]">{totalCount}</span>{' '}
              of {allTransactions.length} transactions
            </p>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <i className="ri-loader-4-line animate-spin text-xl" />
            <span className="text-sm">Loading payments…</span>
          </div>
        )}

        {/* Error */}
        {!loading && fetchError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-red-700 text-sm">
              <i className="ri-error-warning-line" /> {fetchError}
            </div>
            <button
              onClick={loadPayments}
              className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer whitespace-nowrap transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !fetchError && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-5 gap-3">
              {[
                {
                  label: 'Total Transactions',
                  value: totalCount,
                  icon: 'ri-list-check-2',
                  color: 'slate',
                },
                {
                  label: 'Total Amount',
                  value: formatINR(totalAmount),
                  icon: 'ri-money-rupee-circle-line',
                  color: 'indigo',
                },
                {
                  label: 'Cash Total',
                  value: formatINR(cashTotal),
                  icon: 'ri-hand-coin-line',
                  color: 'emerald',
                },
                {
                  label: 'Cheque Total',
                  value: formatINR(chequeTotal),
                  icon: 'ri-bank-card-line',
                  color: 'amber',
                },
                {
                  label: 'UPI / NEFT / RTGS',
                  value: formatINR(digitalTotal),
                  icon: 'ri-smartphone-line',
                  color: 'violet',
                },
              ].map((c) => (
                <div
                  key={c.label}
                  className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3"
                >
                  <div
                    className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ${
                      c.color === 'slate'
                        ? 'bg-slate-100'
                        : c.color === 'indigo'
                          ? 'bg-indigo-50'
                          : c.color === 'emerald'
                            ? 'bg-emerald-50'
                            : c.color === 'amber'
                              ? 'bg-amber-50'
                              : 'bg-violet-50'
                    }`}
                  >
                    <i
                      className={`${c.icon} text-base ${
                        c.color === 'slate'
                          ? 'text-slate-600'
                          : c.color === 'indigo'
                            ? 'text-[#4f46e5]'
                            : c.color === 'emerald'
                              ? 'text-emerald-600'
                              : c.color === 'amber'
                                ? 'text-amber-600'
                                : 'text-violet-600'
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-[#1e293b] truncate">
                      {c.value}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{c.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick totals */}
            <div className="flex items-center gap-4 text-sm">
              <span className="text-slate-500">
                Paid Out:{' '}
                <span className="font-bold text-[#4f46e5]">
                  {formatINR(totalPaid)}
                </span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">
                Return Settlements:{' '}
                <span className="font-bold text-emerald-600">
                  {formatINR(totalReturnSettlements)}
                </span>
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500">
                Bounced Cheques:{' '}
                <span className="font-bold text-red-500">{bouncedCount}</span>
              </span>
            </div>

            {/* Table */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
              <div className="w-full overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        'Type',
                        'Number',
                        'Date',
                        'Supplier',
                        'Invoice / Return',
                        'Mode',
                        'Reference / Cheque',
                        'Cheque Status',
                        'Amount',
                        'Actions',
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((tx, i) => (
                      <tr
                        key={tx.id}
                        className={`border-b border-slate-50 transition-colors ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''} ${tx.chequeStatus === 'BOUNCED' || tx.chequeStatus === 'INSUFFICIENT_BALANCE' ? 'bg-red-50/40' : ''}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          {tx.type === 'PAYMENT' && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                              PAYMENT
                            </span>
                          )}
                          {tx.type === 'REFUND' && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              REFUND
                            </span>
                          )}
                          {tx.type === 'CREDIT' && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                              CREDIT
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => tx.raw && setDetailVoucher(tx.raw)}
                            className={`font-semibold whitespace-nowrap ${tx.raw ? 'text-[#4f46e5] hover:underline cursor-pointer' : 'text-slate-500'}`}
                          >
                            {tx.number}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {tx.date}
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1e293b] whitespace-nowrap">
                          {tx.partyName}
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {tx.linkedDoc}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MODE_COLORS[tx.paymentMode] ?? 'bg-slate-100 text-slate-700'}`}
                          >
                            {tx.paymentMode}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {tx.paymentMode === 'CHEQUE' && tx.chequeNo ? (
                            <span className="font-mono text-xs">
                              {tx.chequeNo} · {tx.bankName}
                            </span>
                          ) : tx.referenceNo ? (
                            <span className="font-mono text-xs">
                              {tx.referenceNo}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {tx.chequeStatus ? (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${CHEQUE_STATUS_COLORS[tx.chequeStatus]}`}
                            >
                              <i
                                className={`${CHEQUE_STATUS_ICONS[tx.chequeStatus]} text-xs`}
                              />
                              {CHEQUE_STATUS_LABELS[tx.chequeStatus]}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 font-semibold whitespace-nowrap ${tx.type === 'PAYMENT' ? 'text-[#1e293b]' : 'text-emerald-600'}`}
                        >
                          {tx.type !== 'PAYMENT' ? '+' : ''}
                          {formatINR(tx.amount)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {tx.type === 'PAYMENT' &&
                          tx.paymentMode === 'CHEQUE' &&
                          tx.chequeStatus === 'PENDING' &&
                          tx.raw ? (
                            <button
                              onClick={() => openChequeModal(tx.raw!)}
                              className="h-7 px-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 cursor-pointer whitespace-nowrap transition-colors"
                            >
                              Update
                            </button>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={10}
                          className="px-4 py-12 text-center text-slate-400"
                        >
                          No transactions match your filters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-[#e2e8f0] flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Showing {filtered.length} of {allTransactions.length}{' '}
                  transactions
                </p>
                <p className="text-xs font-semibold text-[#1e293b]">
                  Paid Out: {formatINR(totalPaid)} &nbsp;·&nbsp; Return
                  Settlements:{' '}
                  <span className="text-emerald-600">
                    {formatINR(totalReturnSettlements)}
                  </span>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Payment Detail Modal */}
        {detailVoucher && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                <div>
                  <h2 className="text-base font-bold text-[#1e293b]">
                    {detailVoucher.voucherNumber}
                  </h2>
                  <p className="text-xs text-slate-500">{detailVoucher.date}</p>
                </div>
                <button
                  onClick={() => setDetailVoucher(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors"
                >
                  <i className="ri-close-line text-base" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="bg-[#f8fafc] rounded-xl p-4 space-y-1.5 text-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Supplier
                  </p>
                  <p className="font-semibold text-[#1e293b]">
                    {detailVoucher.supplierName}
                  </p>
                  <p className="text-slate-500">
                    Invoice:{' '}
                    <span className="font-semibold text-[#1e293b]">
                      {detailVoucher.invoiceNumber}
                    </span>
                  </p>
                  <p className="text-slate-500">
                    Invoice Amount:{' '}
                    <span className="font-semibold text-[#1e293b]">
                      {formatINR(detailVoucher.invoiceAmount)}
                    </span>
                  </p>
                </div>
                <div className="bg-[#f8fafc] rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Payment Details
                  </p>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode</span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MODE_COLORS[detailVoucher.paymentMode] ?? 'bg-slate-100 text-slate-700'}`}
                    >
                      {detailVoucher.paymentMode}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-bold text-[#1e293b]">
                      {formatINR(detailVoucher.paymentAmount)}
                    </span>
                  </div>
                  {detailVoucher.referenceNo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reference No</span>
                      <span className="font-mono text-xs font-semibold text-[#1e293b]">
                        {detailVoucher.referenceNo}
                      </span>
                    </div>
                  )}
                  {detailVoucher.notes && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Notes</span>
                      <span className="text-[#1e293b] text-right">
                        {detailVoucher.notes}
                      </span>
                    </div>
                  )}
                </div>
                {detailVoucher.paymentMode === 'CHEQUE' && (
                  <div className="border border-[#e2e8f0] rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                        Cheque Details
                      </p>
                      {detailVoucher.chequeStatus && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${CHEQUE_STATUS_COLORS[detailVoucher.chequeStatus]}`}
                        >
                          <i
                            className={`${CHEQUE_STATUS_ICONS[detailVoucher.chequeStatus]} text-xs`}
                          />
                          {CHEQUE_STATUS_LABELS[detailVoucher.chequeStatus]}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Bank</span>
                      <span className="font-semibold text-[#1e293b]">
                        {detailVoucher.bankName ?? '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cheque No</span>
                      <span className="font-mono text-xs font-semibold text-[#1e293b]">
                        {detailVoucher.chequeNo ?? '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Cheque Date</span>
                      <span className="font-semibold text-[#1e293b]">
                        {detailVoucher.chequeDate ?? '—'}
                      </span>
                    </div>
                    {(detailVoucher.chequeStatus === 'BOUNCED' ||
                      detailVoucher.chequeStatus === 'INSUFFICIENT_BALANCE') &&
                      detailVoucher.bounceReason && (
                        <div className="pt-1 border-t border-[#e2e8f0]">
                          <p className="text-xs text-red-600 font-semibold">
                            Reason: {detailVoucher.bounceReason}
                          </p>
                        </div>
                      )}
                    {detailVoucher.chequeStatus === 'PENDING' && (
                      <div className="pt-2 border-t border-[#e2e8f0]">
                        <button
                          onClick={() => openChequeModal(detailVoucher)}
                          className="w-full h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 cursor-pointer whitespace-nowrap transition-colors"
                        >
                          Update Cheque Status
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] flex justify-end">
                <button
                  onClick={() => setDetailVoucher(null)}
                  className="h-9 px-5 rounded-lg border border-[#e2e8f0] text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer whitespace-nowrap transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cheque Status Modal */}
        {chequeModal && (
          <ChequeStatusModal
            payment={chequeModal}
            onUpdate={handleChequeUpdate}
            onClose={() => setChequeModal(null)}
          />
        )}
      </div>
    </AppLayout>
  );
}
