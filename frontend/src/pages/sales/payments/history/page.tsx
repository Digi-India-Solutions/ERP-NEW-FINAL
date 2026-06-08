import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AxiosError } from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AppLayout from '@/components/feature/AppLayout';
import ChequeStatusModal, { type ChequePaymentInfo } from '@/components/feature/ChequeStatusModal';
import { salesPaymentService } from '@/services/salesPaymentService';
import { type ChequeStatus, type MockPaymentReceipt } from '@/mocks/payments';
import { formatINR } from '@/utils/format';
import { MODULES } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouseStore } from '@/stores/warehouseStore';


type TxType = 'ALL' | 'PAYMENTS' | 'REFUNDS';
type ModeFilter = 'ALL' | 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'NEFT' | 'RTGS' | 'CREDIT' | 'CREDIT_AMOUNT';

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
  CREDIT: 'bg-cyan-50 text-cyan-700',
  CREDIT_AMOUNT: 'bg-cyan-50 text-cyan-700',
};

const formatModeLabel = (mode: string): string => {
  if (mode === 'CREDIT_AMOUNT') return 'CREDIT AMOUNT';
  return mode;
};

function getDefaultFromDate(): string {
  return '2024-01-01';
}
function getToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface BouncedAlert { invoiceNumber: string; paymentId: string; }

interface ReturnSettlementRow {
  id: string;
  receiptNumber: string;
  date: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  invoiceAmount: number;
  balanceDue: number;
  paymentAmount: number;
  paymentMode: string;
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

const normalizePaymentReceipt = (row: any): MockPaymentReceipt => ({
  id: String(row?.id ?? ''),
  receiptNumber: row?.receiptNumber ?? row?.receipt_number ?? '—',
  date: row?.date ?? row?.payment_date ?? '',
  invoiceId: row?.invoiceId ?? row?.invoice_id ?? '',
  invoiceNumber: row?.invoiceNumber ?? row?.invoice_number ?? '—',
  customerId: row?.customerId ?? row?.customer_id ?? '',
  customerName: row?.customerName ?? row?.customer_name ?? '—',
  invoiceAmount: Number(row?.invoiceAmount ?? row?.invoice_amount ?? 0),
  balanceDue: Number(row?.balanceDue ?? row?.balance_due ?? 0),
  paymentAmount: Number(row?.paymentAmount ?? row?.payment_amount ?? 0),
  paymentMode: (row?.paymentMode ?? row?.payment_mode ?? 'CASH') as MockPaymentReceipt['paymentMode'],
  referenceNo: row?.referenceNo ?? row?.reference_no ?? undefined,
  cardLastFour: row?.cardLastFour ?? row?.card_last_four ?? undefined,
  bankName: row?.bankName ?? row?.bank_name ?? undefined,
  chequeNo: row?.chequeNo ?? row?.cheque_no ?? undefined,
  chequeDate: row?.chequeDate ?? row?.cheque_date ?? undefined,
  chequeStatus: ((row?.chequeStatus ?? row?.cheque_status ?? (String(row?.paymentMode ?? row?.payment_mode ?? '').toUpperCase() === 'CHEQUE' ? 'PENDING' : undefined)) as MockPaymentReceipt['chequeStatus']),
  bounceReason: row?.bounceReason ?? row?.bounce_reason ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.createdAt ?? row?.created_at ?? new Date().toISOString(),
});

const normalizeReturnSettlement = (row: any): ReturnSettlementRow => ({
  id: String(row?.id ?? ''),
  receiptNumber: row?.receiptNumber ?? row?.receipt_number ?? '—',
  date: row?.date ?? row?.createdAt ?? row?.created_at ?? '',
  invoiceId: row?.invoiceId ?? row?.invoice_id ?? '',
  invoiceNumber: row?.invoiceNumber ?? row?.invoice_number ?? row?.linkedDoc ?? row?.linked_doc ?? '—',
  customerId: row?.customerId ?? row?.customer_id ?? '',
  customerName: row?.customerName ?? row?.customer_name ?? '—',
  invoiceAmount: Number(row?.invoiceAmount ?? row?.invoice_amount ?? row?.amount ?? 0),
  balanceDue: Number(row?.balanceDue ?? row?.balance_due ?? 0),
  paymentAmount: Number(row?.paymentAmount ?? row?.payment_amount ?? row?.amount ?? 0),
  paymentMode: String(row?.paymentMode ?? row?.payment_mode ?? 'CREDIT').toUpperCase(),
  referenceNo: row?.referenceNo ?? row?.reference_no ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.createdAt ?? row?.created_at ?? new Date().toISOString(),
});

export default function SalesPaymentsHistoryPage() {
  const navigate = useNavigate();
   const { selectedWarehouseId } = useWarehouseStore(); 
  const [receipts, setReceipts] = useState<MockPaymentReceipt[]>([]);
  const [returnSettlements, setReturnSettlements] = useState<ReturnSettlementRow[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [txType, setTxType] = useState<TxType>('ALL');
  const [modeFilter, setModeFilter] = useState<ModeFilter>('ALL');
  const [fromDate, setFromDate] = useState(getDefaultFromDate());
  const [toDate, setToDate] = useState(getToday());
  const [chequeModal, setChequeModal] = useState<ChequePaymentInfo | null>(null);
  const [detailPayment, setDetailPayment] = useState<MockPaymentReceipt | null>(null);
  const [bouncedAlert, setBouncedAlert] = useState<BouncedAlert | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(search);
  }, 500); // debounce delay

  return () => clearTimeout(timer);
}, [search]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3500); };
  const { hasPermission, hasControl } = useAuth();
  const canCreatePayment = hasPermission(MODULES.SALES_PAYMENT, 'create');
  const canExport = hasControl('exportData');
  
  useEffect(() => {
  let mounted = true;

  const loadPayments = async () => {
    try {
      const paymentResult = await salesPaymentService.list({
        page: 1,
        limit: 500,
        search: debouncedSearch,
        fromDate,
        toDate,
        paymentMode: modeFilter,
        warehouseId: selectedWarehouseId,
      });
      console.log('selectedWarehouseId:', selectedWarehouseId);

      const returnResult = await salesPaymentService.listReturnSettlements({
        page: 1,
        limit: 500,
        search: debouncedSearch,
        fromDate,
        toDate,
        paymentMode: modeFilter,
        warehouseId: selectedWarehouseId,
      });

      if (!mounted) return;

      setReceipts(
        (paymentResult.items ?? []).map(normalizePaymentReceipt)
      );

      setReturnSettlements(
        (returnResult.items ?? []).map(normalizeReturnSettlement)
      );

    } catch (error) {
      const message =
        error instanceof AxiosError
          ? (error.response?.data as { message?: string } | undefined)?.message ||
            error.message
          : 'Failed to load payments';

      showToast(message);
    }
  };

  loadPayments();

  return () => {
    mounted = false;
  };
}, [debouncedSearch, fromDate, toDate, modeFilter, selectedWarehouseId]);

  const allTransactions = useMemo(() => {
    const payments = receipts.map((r) => ({
      type: 'PAYMENT' as const,
      id: r.id,
      number: r.receiptNumber,
      date: r.date,
      partyName: r.customerName,
      linkedDoc: r.invoiceNumber,
      amount: r.paymentAmount,
      paymentMode: r.paymentMode,
      referenceNo: r.referenceNo,
      chequeNo: r.chequeNo,
      bankName: r.bankName,
      chequeStatus: r.chequeStatus,
      notes: r.notes,
      raw: r,
    }));
    const refunds: Array<{
      type: 'REFUND';
      id: string;
      number: string;
      date: string;
      partyName: string;
      linkedDoc: string;
      amount: number;
      paymentMode: string;
      referenceNo?: string;
      chequeNo?: string;
      bankName?: string;
      chequeStatus?: ChequeStatus;
      notes?: string;
      raw: MockPaymentReceipt | null;
    }> = returnSettlements.map((r) => ({
        type: 'REFUND' as const,
        id: r.id,
        number: r.receiptNumber,
        date: r.date,
        partyName: r.customerName,
        linkedDoc: r.invoiceNumber,
        amount: r.paymentAmount,
        paymentMode: r.paymentMode,
        referenceNo: r.referenceNo,
        notes: r.notes,
        raw: null,
      }));
    return [...payments, ...refunds].sort((a, b) => b.date.localeCompare(a.date));
  }, [receipts]);

  const filtered = useMemo(() => {
  return allTransactions.filter((tx) => {
    const matchType =
      txType === 'ALL' ||
      (txType === 'PAYMENTS' && tx.type === 'PAYMENT') ||
      (txType === 'REFUNDS' && tx.type === 'REFUND');

    return matchType;
  });
}, [allTransactions, txType]);
  // Summary totals
  const totalCount = filtered.length;
  const totalAmount = filtered.reduce((s, t) => s + t.amount, 0);
  const cashTotal = filtered.filter((t) => t.paymentMode === 'CASH').reduce((s, t) => s + t.amount, 0);
  const chequeTotal = filtered.filter((t) => t.paymentMode === 'CHEQUE').reduce((s, t) => s + t.amount, 0);
  const digitalTotal = filtered.filter((t) => ['UPI', 'NEFT', 'RTGS', 'CARD'].includes(t.paymentMode)).reduce((s, t) => s + t.amount, 0);
  const totalCollected = filtered.filter((t) => t.type === 'PAYMENT').reduce((s, t) => s + t.amount, 0);
  const totalRefunded = filtered.filter((t) => t.type === 'REFUND').reduce((s, t) => s + t.amount, 0);
  const bouncedCount = filtered.filter((t) => t.chequeStatus === 'BOUNCED' || t.chequeStatus === 'INSUFFICIENT_BALANCE').length;

  // Export Excel
  const exportExcel = () => {
    const rows = filtered.map((tx) => ({
      'Receipt No': tx.number,
      'Date': tx.date,
      'Customer': tx.partyName,
      'Invoice No': tx.linkedDoc,
      'Amount': tx.amount,
      'Payment Mode': formatModeLabel(tx.paymentMode),
      'Reference No': tx.referenceNo ?? '',
      'Cheque No': tx.chequeNo ?? '',
      'Cheque Status': tx.chequeStatus ?? '',
      'Notes': tx.notes ?? '',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment Transactions');
    XLSX.writeFile(wb, `Sales-Payments-${fromDate}-${toDate}.xlsx`);
  };

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Transactions Report', 14, 18);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${fromDate} to ${toDate}`, 14, 26);
    doc.text('Sales Payments', doc.internal.pageSize.width - 14, 18, { align: 'right' });

    const rows = filtered.map((tx) => [
      tx.number,
      tx.date,
      tx.partyName,
      tx.linkedDoc,
      formatINR(tx.amount),
      formatModeLabel(tx.paymentMode),
      tx.referenceNo ?? '',
      tx.chequeNo ?? '',
      tx.chequeStatus ?? '',
      tx.notes ?? '',
    ]);

    autoTable(doc, {
      head: [['Receipt No', 'Date', 'Customer', 'Invoice No', 'Amount', 'Mode', 'Reference No', 'Cheque No', 'Cheque Status', 'Notes']],
      body: rows,
      startY: 32,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Generated on ${getToday()} · Total: ${formatINR(totalAmount)} · Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 8
      );
    }
    doc.save(`Sales-Payments-${fromDate}-${toDate}.pdf`);
  };

  const openChequeModal = (r: MockPaymentReceipt) => {
    setChequeModal({
      id: r.id, number: r.receiptNumber, date: r.date, partyName: r.customerName,
      invoiceNumber: r.invoiceNumber, amount: r.paymentAmount, bankName: r.bankName,
      chequeNo: r.chequeNo, chequeDate: r.chequeDate, chequeStatus: r.chequeStatus ?? 'PENDING',
      bounceReason: r.bounceReason, partyType: 'CUSTOMER',
    });
  };

  const handleChequeUpdate = (id: string, newStatus: 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE', reason?: string) => {
    const applyLocalUpdate = () => {
      setReceipts((prev) => prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, chequeStatus: newStatus, bounceReason: reason };
      }));
      if (newStatus === 'CLEARED') {
        showToast('Cheque cleared successfully');
      } else {
        const rec = receipts.find((r) => r.id === id);
        if (rec) setBouncedAlert({ invoiceNumber: rec.invoiceNumber, paymentId: id });
      }
      setChequeModal(null);
      setDetailPayment(null);
    };

    void (async () => {
      try {
        await salesPaymentService.updateChequeStatus(id, newStatus, reason);
        applyLocalUpdate();
      } catch (error) {
        const message =
          error instanceof AxiosError
            ? (error.response?.data as { message?: string } | undefined)?.message || error.message
            : 'Failed to update cheque status';
        showToast(message);
      }
    })();
  };

  const handleOpenLinkedInvoice = (tx: { type: 'PAYMENT' | 'REFUND'; linkedDoc: string; raw: MockPaymentReceipt | null }) => {
    if (tx.type !== 'PAYMENT') return;
    navigate('/sales/invoices', {
      state: {
        openInvoiceId: tx.raw?.invoiceId || undefined,
        openInvoiceNo: tx.linkedDoc,
      },
    });
  };

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
              <span className="text-sm font-semibold">Cheque bounced! {bouncedAlert.invoiceNumber} is now UNPAID. Customer must pay again.</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/sales/payments/new')} className="h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 cursor-pointer whitespace-nowrap transition-colors">Record New Payment</button>
              <button onClick={() => setBouncedAlert(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 text-red-400 cursor-pointer transition-colors"><i className="ri-close-line text-sm" /></button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer">
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Sales Payments</h1>
              <p className="text-sm text-slate-500">{allTransactions.length} total transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {canExport && (
              <>
                <button onClick={exportExcel} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-file-excel-2-line text-emerald-600" /> Export Excel
                </button>
                <button onClick={exportPDF} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap transition-colors">
                  <i className="ri-file-pdf-2-line text-red-500" /> Export PDF
                </button>
              </>
            )}
            { canCreatePayment &&
            <button onClick={() => navigate('/sales/payments/new')} className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors">
              <i className="ri-add-line" /> Available Dues
            </button>
            }
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date range */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">From</label>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">To</label>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 cursor-pointer" />
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-52">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search receipt no, customer, invoice..."
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100" />
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Tx type */}
            <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
              {([{ key: 'ALL', label: 'All Transactions' }, { key: 'PAYMENTS', label: 'Invoice Payments' }, { key: 'REFUNDS', label: 'Return Refunds' }] as { key: TxType; label: string }[]).map((t) => (
                <button key={t.key} onClick={() => setTxType(t.key)}
                  className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${txType === t.key ? 'bg-white text-[#1e293b]' : 'text-slate-500 hover:text-[#1e293b]'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Mode filter */}
            <div className="flex items-center gap-1 bg-[#f1f5f9] rounded-lg p-1">
              {(['ALL', 'CASH', 'UPI', 'CARD', 'CHEQUE', 'NEFT', 'RTGS', 'CREDIT', 'CREDIT_AMOUNT'] as ModeFilter[]).map((m) => (
                <button key={m} onClick={() => setModeFilter(m)}
                  className={`h-7 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${modeFilter === m ? 'bg-white text-[#1e293b]' : 'text-slate-500 hover:text-[#1e293b]'}`}>
                  {m === 'ALL' ? 'All Modes' : m === 'CREDIT_AMOUNT' ? 'Credit Amount' : m}
                </button>
              ))}
            </div>

            <p className="text-xs text-slate-400 ml-auto whitespace-nowrap">Showing <span className="font-semibold text-[#1e293b]">{totalCount}</span> of {allTransactions.length} transactions</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Total Transactions', value: totalCount, icon: 'ri-list-check-2', color: 'slate', isCount: true },
            { label: 'Total Amount', value: formatINR(totalAmount), icon: 'ri-money-rupee-circle-line', color: 'indigo' },
            { label: 'Cash Total', value: formatINR(cashTotal), icon: 'ri-hand-coin-line', color: 'emerald' },
            { label: 'Cheque Total', value: formatINR(chequeTotal), icon: 'ri-bank-card-line', color: 'amber' },
            { label: 'UPI / NEFT / RTGS', value: formatINR(digitalTotal), icon: 'ri-smartphone-line', color: 'violet' },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3">
              <div className={`w-9 h-9 flex items-center justify-center rounded-xl shrink-0 ${
                c.color === 'slate' ? 'bg-slate-100' : c.color === 'indigo' ? 'bg-indigo-50' : c.color === 'emerald' ? 'bg-emerald-50' : c.color === 'amber' ? 'bg-amber-50' : 'bg-violet-50'
              }`}>
                <i className={`${c.icon} text-base ${
                  c.color === 'slate' ? 'text-slate-600' : c.color === 'indigo' ? 'text-[#4f46e5]' : c.color === 'emerald' ? 'text-emerald-600' : c.color === 'amber' ? 'text-amber-600' : 'text-violet-600'
                }`} />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold text-[#1e293b] truncate">{c.value}</p>
                <p className="text-xs text-slate-500 truncate">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Collected / Refunded quick row */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">Collected: <span className="font-bold text-emerald-600">{formatINR(totalCollected)}</span></span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">Refunded: <span className="font-bold text-amber-600">{formatINR(totalRefunded)}</span></span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">Bounced Cheques: <span className="font-bold text-red-500">{bouncedCount}</span></span>
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
           <div className="w-full overflow-x-auto">
    
    <table className="w-full min-w-[1200px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Type', 'Number', 'Date', 'Customer', 'Invoice / Return', 'Mode', 'Reference / Cheque', 'Cheque Status', 'Amount', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx, i) => (
                <tr key={tx.id} className={`border-b border-slate-50 transition-colors ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''} ${(tx.chequeStatus === 'BOUNCED' || tx.chequeStatus === 'INSUFFICIENT_BALANCE') ? 'bg-red-50/40' : ''}`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {tx.type === 'PAYMENT'
                      ? <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">PAYMENT</span>
                      : <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">REFUND</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => tx.raw && setDetailPayment(tx.raw)}
                      className={`font-semibold whitespace-nowrap ${tx.raw ? 'text-[#4f46e5] hover:underline cursor-pointer' : 'text-slate-500'}`}>
                      {tx.number}
                    </button>
                  </td>
                  {/* <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{tx.date}</td> */}
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                  {new Date(tx.date).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                  <td className="px-4 py-3 font-medium text-[#1e293b] whitespace-nowrap">{tx.partyName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {tx.type === 'PAYMENT' && tx.linkedDoc && tx.linkedDoc !== '—' ? (
                      <button
                        onClick={() => handleOpenLinkedInvoice(tx)}
                        className="text-[#4f46e5] hover:underline font-medium cursor-pointer"
                      >
                        {tx.linkedDoc}
                      </button>
                    ) : (
                      <span className="text-slate-500">{tx.linkedDoc}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MODE_COLORS[tx.paymentMode] ?? 'bg-slate-100 text-slate-700'}`}>{formatModeLabel(tx.paymentMode)}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                    {tx.paymentMode === 'CHEQUE' && tx.chequeNo
                      ? <span className="font-mono text-xs">{tx.chequeNo} · {tx.bankName}</span>
                      : tx.referenceNo ? <span className="font-mono text-xs">{tx.referenceNo}</span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {tx.chequeStatus
                      ? <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${CHEQUE_STATUS_COLORS[tx.chequeStatus]}`}>
                          <i className={`${CHEQUE_STATUS_ICONS[tx.chequeStatus]} text-xs`} />
                          {CHEQUE_STATUS_LABELS[tx.chequeStatus]}
                        </span>
                      : <span className="text-slate-300">—</span>}
                  </td>
                  <td className={`px-4 py-3 font-semibold whitespace-nowrap ${tx.type === 'REFUND' ? 'text-amber-600' : 'text-[#1e293b]'}`}>
                    {tx.type === 'REFUND' ? '-' : ''}{formatINR(tx.amount)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {tx.type === 'PAYMENT' && tx.paymentMode === 'CHEQUE' && tx.chequeStatus === 'PENDING' && tx.raw
                      ? <button onClick={() => openChequeModal(tx.raw!)}
                          className="h-7 px-3 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 cursor-pointer whitespace-nowrap transition-colors">
                          Update
                        </button>
                      : <span className="text-slate-300">—</span>}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-4 py-12 text-center text-slate-400">No transactions match your filters</td></tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#e2e8f0] flex items-center justify-between">
            <p className="text-xs text-slate-400">Showing {filtered.length} of {allTransactions.length} transactions</p>
            <p className="text-xs font-semibold text-[#1e293b]">
              Collected: {formatINR(totalCollected)} &nbsp;·&nbsp; Refunded: <span className="text-amber-600">{formatINR(totalRefunded)}</span>
            </p>
          </div>
        </div>

        {/* Payment Detail Modal */}
        {detailPayment && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-2xl w-full max-w-lg mx-4 overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
                <div>
                  <h2 className="text-base font-bold text-[#1e293b]">{detailPayment.receiptNumber}</h2>
                  <p className="text-xs text-slate-500">{detailPayment.date}</p>
                </div>
                <button onClick={() => setDetailPayment(null)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors">
                  <i className="ri-close-line text-base" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="bg-[#f8fafc] rounded-xl p-4 space-y-1.5 text-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Customer</p>
                  <p className="font-semibold text-[#1e293b]">{detailPayment.customerName}</p>
                  <p className="text-slate-500">Invoice: <span className="font-semibold text-[#1e293b]">{detailPayment.invoiceNumber}</span></p>
                  <p className="text-slate-500">Invoice Amount: <span className="font-semibold text-[#1e293b]">{formatINR(detailPayment.invoiceAmount)}</span></p>
                </div>
                <div className="bg-[#f8fafc] rounded-xl p-4 space-y-2 text-sm">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Payment Details</p>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mode</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${MODE_COLORS[detailPayment.paymentMode] ?? 'bg-slate-100 text-slate-700'}`}>{detailPayment.paymentMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Amount Paid</span>
                    <span className="font-bold text-[#1e293b]">{formatINR(detailPayment.paymentAmount)}</span>
                  </div>
                  {detailPayment.referenceNo && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Reference No</span>
                      <span className="font-mono text-xs font-semibold text-[#1e293b]">{detailPayment.referenceNo}</span>
                    </div>
                  )}
                  {detailPayment.notes && (
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-500 shrink-0">Notes</span>
                      <span className="text-[#1e293b] text-right">{detailPayment.notes}</span>
                    </div>
                  )}
                </div>
                {detailPayment.paymentMode === 'CHEQUE' && (
                  <div className="border border-[#e2e8f0] rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Cheque Details</p>
                      {detailPayment.chequeStatus && (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${CHEQUE_STATUS_COLORS[detailPayment.chequeStatus]}`}>
                          <i className={`${CHEQUE_STATUS_ICONS[detailPayment.chequeStatus]} text-xs`} />
                          {CHEQUE_STATUS_LABELS[detailPayment.chequeStatus]}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between"><span className="text-slate-500">Bank</span><span className="font-semibold text-[#1e293b]">{detailPayment.bankName ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Cheque No</span><span className="font-mono text-xs font-semibold text-[#1e293b]">{detailPayment.chequeNo ?? '—'}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Cheque Date</span><span className="font-semibold text-[#1e293b]">{detailPayment.chequeDate ?? '—'}</span></div>
                    {(detailPayment.chequeStatus === 'BOUNCED' || detailPayment.chequeStatus === 'INSUFFICIENT_BALANCE') && detailPayment.bounceReason && (
                      <div className="pt-1 border-t border-[#e2e8f0]"><p className="text-xs text-red-600 font-semibold">Reason: {detailPayment.bounceReason}</p></div>
                    )}
                    {detailPayment.chequeStatus === 'PENDING' && (
                      <div className="pt-2 border-t border-[#e2e8f0]">
                        <button onClick={() => openChequeModal(detailPayment)}
                          className="w-full h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold hover:bg-amber-100 cursor-pointer whitespace-nowrap transition-colors">
                          Update Cheque Status
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

 </div>

            </div>
          
        )}

        {/* Cheque Status Modal */}
        {chequeModal && (
          <ChequeStatusModal payment={chequeModal} onUpdate={handleChequeUpdate} onClose={() => setChequeModal(null)} />
        )}
      </div>
      </div>
    </AppLayout>
  );
}
