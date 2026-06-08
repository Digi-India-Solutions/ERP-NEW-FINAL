import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrintSalesInvoice from '@/components/print/PrintSalesInvoice';
import { printSalesInvoice } from '@/utils/printDocument';
import { formatINR } from '@/utils/format';
import { salesService } from '@/services/salesService';
import type { InvoicePaymentHistoryRow, SalesInvoiceDetail } from '@/services/salesService';
import type { OutwardGPPrefill } from '@/pages/inventory/gate-pass/outward/page';

interface Props {
  invoice: SalesInvoiceDetail;
  onClose: () => void;
  onCreateChallan?: (invoice: SalesInvoiceDetail) => void;
  /** Called after frontend-only delete */
  onDelete?: (invoiceId: string) => void;
  /** Called when user wants to edit (frontend only — navigate or open form) */
  onEdit?: (invoice: SalesInvoiceDetail) => void;
}

const STATUS_STYLE: Record<string, string> = {
  SAVED:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT:     'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  PAID:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNPAID:  'bg-red-50 text-red-600 border-red-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
};

const PM_LABEL: Record<string, string> = {
  CASH: 'Cash',
  CREDIT: 'Credit',
  CREDIT_AMOUNT: 'Customer Credit',
  CREDIT_NOTE: 'Customer Credit',
  PARTIAL: 'Partial Payment',
  UPI: 'UPI',
  CARD: 'Card',
  CHEQUE: 'Cheque',
  NEFT: 'NEFT',
  RTGS: 'RTGS',
  IMPS: 'IMPS',
  BANK_TRANSFER: 'Bank Transfer',
  DD: 'Demand Draft',
  ONLINE: 'Online Payment',
  WALLET: 'Wallet',
  CRYPTOCURRENCY: 'Cryptocurrency',
};

const getPaymentModeLabel = (mode: string): string => {
  if (!mode) return 'Cash';
  // Try uppercase version first
  const upper = mode.toUpperCase();
  if (PM_LABEL[upper]) return PM_LABEL[upper];
  // Try exact match
  if (PM_LABEL[mode]) return PM_LABEL[mode];
  // Return formatted version
  return mode.charAt(0).toUpperCase() + mode.slice(1).toLowerCase();
};

function amountInWords(amount: number): string {
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens  = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  function toWords(n: number): string {
    if (n === 0)       return '';
    if (n < 20)        return units[n];
    if (n < 100)       return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
    if (n < 1000)      return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + toWords(n % 100) : '');
    if (n < 100000)    return toWords(Math.floor(n / 1000))    + ' Thousand' + (n % 1000   !== 0 ? ' ' + toWords(n % 1000)    : '');
    if (n < 10000000)  return toWords(Math.floor(n / 100000))  + ' Lakh'     + (n % 100000 !== 0 ? ' ' + toWords(n % 100000)  : '');
    return                    toWords(Math.floor(n / 10000000)) + ' Crore'    + (n % 10000000 !== 0 ? ' ' + toWords(n % 10000000) : '');
  }
  const rupees = Math.floor(amount);
  const paise  = Math.round((amount - rupees) * 100);
  let words = 'Rupees ' + (toWords(rupees) || 'Zero');
  if (paise > 0) words += ' and ' + toWords(paise) + ' Paise';
  return words + ' Only';
}

export default function InvoiceDetailModal({ invoice, onClose, onCreateChallan, onDelete, onEdit }: Props) {
  const navigate = useNavigate();
  // In InvoiceDetailModal, right after the component starts
  
  // Controls whether payment section shows in modal AND in print
  const [showPayment, setShowPayment]             = useState(true);
  const [printOpen, setPrintOpen]                 = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [paymentHistory, setPaymentHistory]       = useState<InvoicePaymentHistoryRow[]>([]);

  const paymentStatus: string =
    invoice.paymentStatus
    ?? (invoice.paymentMode === 'CASH' ? 'PAID' : invoice.paymentMode === 'PARTIAL' ? 'PARTIAL' : 'UNPAID');

  const normalizedPaymentHistory = paymentHistory
    .filter((row) => Number(row.amount || 0) > 0)
    .map((row) => ({
      id: row.id,
      paymentMode: row.paymentMode,
      amount: Number(row.amount || 0),
      paymentStatus: row.paymentStatus || paymentStatus,
    }));

  const paymentModeBreakdown = Object.values(
    normalizedPaymentHistory.reduce((acc, row) => {
      const key = (row.paymentMode || 'UNKNOWN').toUpperCase();
      if (!acc[key]) {
        acc[key] = {
          id: key,
          paymentMode: key,
          amount: 0,
          paymentStatus: row.paymentStatus,
        };
      }
      acc[key].amount += Number(row.amount || 0);
      if (acc[key].paymentStatus !== row.paymentStatus) {
        acc[key].paymentStatus = 'MIXED';
      }
      return acc;
    }, {} as Record<string, { id: string; paymentMode: string; amount: number; paymentStatus: string }>)
  );

  // Load payment history from backend via typed service
  useEffect(() => {
    let alive = true;

    const loadPaymentHistory = async () => {
      try {
        const rows = await salesService.getInvoicePaymentHistory(invoice.id);
        if (alive) {
          setPaymentHistory(Array.isArray(rows) ? rows : []);
        }
      } catch {
        if (alive) {
          setPaymentHistory([]);
        }
      }
    };

    if (invoice?.id) {
      loadPaymentHistory();
    }

    return () => {
      alive = false;
    };
  }, [invoice?.id]);

   const handleGenerateOutwardGP = (
  invoice: any,
  navigate: any
) => {
  const prefill = {
    partyName: invoice.partyName,
    linkedDocType: 'SALES_INVOICE',
    linkedDocNumber: invoice.id,
    notes: `Generated from Sales Invoice ${invoice.billNo}`,
    items: invoice.items.map((i: any) => ({
      itemName: i.itemName,
      qty: i.qty,
      unit: i.unit || 'Pcs',
    })),   
  };

  navigate('/inventory/gate-pass/outward', {
    state: { prefill },
  });
};
  

  const handleDelete = () => {
    onDelete?.(invoice.id);
    onClose();
  };

  // Tax slab summary
  const taxSlabs = [0, 5, 12, 18, 28].map((rate) => {
    const slabItems = invoice.items.filter((i) => i.taxRate === rate);
    if (!slabItems.length) return null;
    const taxable = slabItems.reduce((s, i) => s + i.taxableAmount, 0);
    const cgst    = slabItems.reduce((s, i) => s + i.cgst, 0);
    const sgst    = slabItems.reduce((s, i) => s + i.sgst, 0);
    const igst    = slabItems.reduce((s, i) => s + i.igst, 0);
    return { rate, taxable, cgst, sgst, igst, total: cgst + sgst + igst };
  }).filter(Boolean) as { rate: number; taxable: number; cgst: number; sgst: number; igst: number; total: number }[];

  const buildPrintData = () => ({
    invoiceNo:        invoice.billNo,
    date:             invoice.date,
    customerName:     invoice.partyName,
    customerGstin:    invoice.customerGstin,
    billingAddress:   invoice.billingAddress,
    shippingAddress:  invoice.shippingAddress,
    paymentMode:      getPaymentModeLabel(invoice.paymentMode || 'CASH'),
    paymentStatus,
    paidAmount:       invoice.paidAmount ?? 0,
    balanceDue:       invoice.balanceDue ?? 0,
    isSameState:      invoice.isSameState,
    subtotal:         invoice.subtotal,
    totalDiscount:    invoice.totalDiscount,
    taxableAmount:    invoice.taxableAmount,
    cgst:             invoice.totalCGST,
    sgst:             invoice.totalSGST,
    igst:             invoice.totalIGST,
    roundOff:         invoice.roundOff,
    grandTotal:       invoice.grandTotal,
    showPaymentTable: showPayment,   // ← passed to print component
    paymentModes:     paymentModeBreakdown.map((p) => ({
      mode: getPaymentModeLabel(p.paymentMode),
      amount: Number(p.amount || 0),
      status: p.paymentStatus || paymentStatus,
    })),
    remainingDue:     Number(invoice.balanceDue || 0),
    items: invoice.items.map((item, idx) => ({
      sr: idx + 1, name: item.itemName, hsn: item.hsnCode,
      qty: item.qty, unit: item.unit, rate: item.rate,
      discount: item.discount, taxable: item.taxableAmount,
      taxRate: item.taxRate, taxAmt: item.cgst + item.sgst + item.igst,
      total: item.total, cgst: item.cgst, sgst: item.sgst, igst: item.igst,
    })),
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">

          {/* ── HEADER ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#1e293b]">Tax Invoice</h2>
                <span className="text-lg font-bold text-[#4f46e5]">— {invoice.billNo}</span>
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PAYMENT_STATUS_STYLE[paymentStatus] ?? STATUS_STYLE.SAVED}`}>
                  {paymentStatus}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[invoice.status]}`}>
                  {invoice.status}
                </span>
                <span className="text-xs text-slate-500">{invoice.date}</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs text-slate-500">{getPaymentModeLabel(invoice.paymentMode || 'CASH')}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-slate-500 cursor-pointer">
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* ── BODY ───────────────────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">

            {/* Bill To / Ship To */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Bill To</p>
                <p className="font-semibold text-[#1e293b]">{invoice.partyName}</p>
                {invoice.customerGstin && <p className="text-xs text-slate-500 mt-1">GSTIN: {invoice.customerGstin}</p>}
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{invoice.billingAddress}</p>
              </div>
              <div className="bg-[#f8fafc] rounded-lg p-4 border border-[#e2e8f0]">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Ship To</p>
                <p className="font-semibold text-[#1e293b]">{invoice.partyName}</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{invoice.shippingAddress ?? invoice.billingAddress}</p>
              </div>
            </div>

            {/* Items table */}
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Items</h3>
              <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      {['#', 'Item', 'HSN', 'Qty', 'Unit', 'Rate', 'Disc%', 'Taxable', 'GST%', 'Tax Amt', 'Total'].map((h, i) => (
                        <th key={h} className={`px-3 py-2.5 text-left font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap ${i >= 3 ? 'text-right' : ''}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => {
                      const taxAmt = item.cgst + item.sgst + item.igst;
                      return (
                        <tr key={item.id ?? idx} className={`border-b border-slate-50 ${idx % 2 === 1 ? 'bg-[#fafafa]' : ''}`}>
                          <td className="px-3 py-2 text-slate-400 text-center">{idx + 1}</td>
                          <td className="px-3 py-2 font-medium text-[#1e293b]">{item.itemName}</td>
                          <td className="px-3 py-2 text-slate-500">{item.hsnCode}</td>
                          <td className="px-3 py-2 text-right">{item.qty}</td>
                          <td className="px-3 py-2 text-slate-500">{item.unit}</td>
                          <td className="px-3 py-2 text-right">{formatINR(item.rate)}</td>
                          <td className="px-3 py-2 text-right">{item.discount > 0 ? `${item.discount}%` : '—'}</td>
                          <td className="px-3 py-2 text-right">{formatINR(item.taxableAmount)}</td>
                          <td className="px-3 py-2 text-right">{item.taxRate}%</td>
                          <td className="px-3 py-2 text-right">{formatINR(taxAmt)}</td>
                          <td className="px-3 py-2 text-right font-semibold text-[#1e293b]">{formatINR(item.total)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GST Summary + Totals */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">GST Summary (Rate-wise)</h3>
                <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-slate-500 border-b border-[#e2e8f0]">GST Rate</th>
                        <th className="px-3 py-2 text-right font-semibold text-slate-500 border-b border-[#e2e8f0]">Taxable</th>
                        {invoice.isSameState ? (
                          <>
                            <th className="px-3 py-2 text-right font-semibold text-slate-500 border-b border-[#e2e8f0]">CGST</th>
                            <th className="px-3 py-2 text-right font-semibold text-slate-500 border-b border-[#e2e8f0]">SGST</th>
                          </>
                        ) : (
                          <th className="px-3 py-2 text-right font-semibold text-slate-500 border-b border-[#e2e8f0]">IGST</th>
                        )}
                        <th className="px-3 py-2 text-right font-semibold text-slate-500 border-b border-[#e2e8f0]">Total Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxSlabs.map((slab) => (
                        <tr key={slab.rate} className="border-b border-slate-50">
                          <td className="px-3 py-2 font-medium">{slab.rate}%</td>
                          <td className="px-3 py-2 text-right">{formatINR(slab.taxable)}</td>
                          {invoice.isSameState ? (
                            <>
                              <td className="px-3 py-2 text-right">{formatINR(slab.cgst)}</td>
                              <td className="px-3 py-2 text-right">{formatINR(slab.sgst)}</td>
                            </>
                          ) : (
                            <td className="px-3 py-2 text-right">{formatINR(slab.igst)}</td>
                          )}
                          <td className="px-3 py-2 text-right font-semibold">{formatINR(slab.total)}</td>
                        </tr>
                      ))}
                      {taxSlabs.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-3 text-center text-slate-400">No tax applicable</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {showPayment && paymentModeBreakdown.length > 0 && (
                  <div className="mt-3">
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Payment Breakdown</h3>
                    <div className="border border-emerald-200 rounded-lg overflow-hidden bg-emerald-50">
                      <div className="grid grid-cols-3 px-4 py-2 bg-emerald-100 border-b border-emerald-200 text-[11px] font-semibold text-emerald-900">
                        <span>Mode</span>
                        <span className="text-center">Status</span>
                        <span className="text-right">Amount</span>
                      </div>
                      {paymentModeBreakdown.map((payment) => (
                        <div key={payment.id} className="grid grid-cols-3 px-4 py-2.5 border-b border-emerald-100 text-xs last:border-0 items-center">
                          <span className="text-emerald-700 font-medium">{getPaymentModeLabel(payment.paymentMode)}</span>
                          <span className="text-center text-emerald-800 font-medium">{payment.paymentStatus || paymentStatus}</span>
                          <span className="text-right font-semibold text-emerald-900">{formatINR(Number(payment.amount || 0))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Amount in Words</p>
                  <p className="text-xs font-medium text-[#1e293b] italic">{amountInWords(invoice.grandTotal)}</p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Invoice Totals */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Invoice Totals</h3>
                  <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                    {[
                      { label: 'Subtotal',       value: formatINR(invoice.subtotal) },
                      { label: 'Total Discount',  value: invoice.totalDiscount > 0 ? `- ${formatINR(invoice.totalDiscount)}` : '—' },
                      { label: 'Taxable Amount',  value: formatINR(invoice.taxableAmount) },
                      ...(invoice.isSameState
                        ? [{ label: 'CGST', value: formatINR(invoice.totalCGST) }, { label: 'SGST', value: formatINR(invoice.totalSGST) }]
                        : [{ label: 'IGST', value: formatINR(invoice.totalIGST) }]),
                      { label: 'Round Off',       value: invoice.roundOff !== 0 ? formatINR(Math.abs(invoice.roundOff)) : '—' },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between px-4 py-2.5 border-b border-[#f1f5f9] text-xs last:border-0">
                        <span className="text-slate-500">{row.label}</span>
                        <span className="font-medium text-[#1e293b]">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 bg-[#4f46e5] text-white">
                      <span className="font-bold text-sm">Grand Total</span>
                      <span className="font-bold text-sm">{formatINR(invoice.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {showPayment && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Payment Details</h3>
                    <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                      {[
                       // { label: 'Payment Mode', value: getPaymentModeLabel(invoice.paymentMode || 'CREDIT') },
                        { label: 'Payment Status', value: paymentStatus },
                        { label: 'Invoice Amount', value: formatINR(invoice.grandTotal ?? 0) },
                        { label: 'Amount Paid', value: formatINR(invoice.paidAmount ?? 0) },
                         { label: 'Balance Due', value: formatINR(invoice.balanceDue ?? 0), red: (invoice.balanceDue ?? 0) > 0 },
                      ].map((row) => (
                        <div key={row.label} className="flex justify-between px-4 py-2.5 border-b border-[#f1f5f9] text-xs last:border-0">
                          <span className="text-slate-500">{row.label}</span>
                          <span className={`font-semibold ${row.red ? 'text-red-600' : 'text-[#1e293b]'}`}>{row.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ── FOOTER ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc] shrink-0">
            {/* Left */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400">
                Warehouse: <span className="font-medium text-slate-600">{invoice.warehouseName}</span>
              </span>

              {/* Payment in Print toggle */}
              <button
                type="button"
                onClick={() => setShowPayment((v) => !v)}
                className={`flex items-center gap-1.5 h-7 px-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all select-none ${
                  showPayment
                    ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                    : 'bg-white text-slate-500 border-[#e2e8f0] hover:border-[#4f46e5] hover:text-[#4f46e5]'
                }`}
                title="Toggle payment details visibility in modal and print"
              >
                <i className={`${showPayment ? 'ri-eye-line' : 'ri-eye-off-line'} text-xs`} />
                Payment in Print
              </button>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPrintOpen(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#1e293b] hover:bg-[#f1f5f9] cursor-pointer whitespace-nowrap transition-colors"
              >
                <i className="ri-printer-line" /> Print Invoice
              </button>

              <button
                onClick={() => handleGenerateOutwardGP(invoice, navigate)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              >
                <i className="ri-file-shield-2-line" /> Outward GP
              </button>

              {invoice.status !== 'CANCELLED' && !invoice.hasChallan && onCreateChallan && (
                <button
                  onClick={() => onCreateChallan(invoice)}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-truck-line" /> Create Challan
                </button>
              )}
              {invoice.hasChallan && (
                <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium whitespace-nowrap">
                  <i className="ri-checkbox-circle-line" />Challan Created
                </span>
              )}

              {/* Edit — frontend only */}
              {onEdit && (
                <button
                  onClick={() => onEdit(invoice)}
                  title="Edit invoice (API coming soon)"
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] text-slate-600 hover:bg-slate-50 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-edit-line" /> Edit
                </button>
              )}

              {/* Delete — frontend only */}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete invoice (API coming soon)"
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
                >
                  <i className="ri-delete-bin-line" />
                </button>
              )}

              <button
                onClick={onClose}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 shrink-0">
                <i className="ri-delete-bin-line text-red-600 text-xl" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1e293b]">Delete Invoice {invoice.billNo}?</p>
                <p className="text-xs text-slate-500 mt-0.5">Removes it from the list. API integration coming soon.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer">Cancel</button>
              <button onClick={handleDelete} className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 cursor-pointer">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {printOpen && (
        <PrintSalesInvoice
          data={buildPrintData()}
          onClose={() => setPrintOpen(false)}
          onPrint={() => printSalesInvoice(buildPrintData())}
        />
      )}
    </>
  );
}
