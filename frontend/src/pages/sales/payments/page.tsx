import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AxiosError } from 'axios';
import AppLayout from '@/components/feature/AppLayout';
import { isBackendAvailable } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { mockSalesInvoices } from '@/mocks/billing';
import { salesService } from '@/services/salesService';
import { salesPaymentService } from '@/services/salesPaymentService';
import {
  mockPaymentReceipts,
  type PaymentMode,
  type ChequeStatus,
} from '@/mocks/payments';
import { formatINR } from '@/utils/format';
import { useWarehouseStore } from '@/stores/warehouseStore';

interface LocationState {
  invoiceId:    string;
  invoiceNumber:string;
  customerId:   string;
  customerName: string;
  invoiceAmount:number;
  balanceDue:   number;
  invoiceDate:  string;
}

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: string }[] = [
  { value: 'CASH',   label: 'Cash',   icon: 'ri-money-rupee-circle-line' },
  { value: 'UPI',    label: 'UPI',    icon: 'ri-smartphone-line'          },
  { value: 'CARD',   label: 'Card',   icon: 'ri-bank-card-line'           },
  { value: 'CHEQUE', label: 'Cheque', icon: 'ri-file-paper-line'          },
  { value: 'NEFT',   label: 'NEFT',   icon: 'ri-exchange-line'            },
  { value: 'RTGS',   label: 'RTGS',   icon: 'ri-bank-line'                },
];

const CHEQUE_STATUSES: { value: ChequeStatus; label: string }[] = [
  { value: 'PENDING',              label: 'Pending'              },
  { value: 'CLEARED',              label: 'Cleared'              },
  { value: 'BOUNCED',              label: 'Bounced'              },
  { value: 'INSUFFICIENT_BALANCE', label: 'Insufficient Balance' },
];

function numberToWords(n: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  if (n === 0) return 'Zero';
  const convert = (num: number): string => {
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + convert(num % 100) : '');
    if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + convert(num % 1000) : '');
    if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + convert(num % 100000) : '');
    return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + convert(num % 10000000) : '');
  };
  return convert(Math.floor(n)) + ' Rupees Only';
}

interface SuccessModalProps { receiptNumber: string; onClose: () => void; onPrint: () => void }
function SuccessModal({ receiptNumber, onClose, onPrint }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
          <i className="ri-checkbox-circle-fill text-3xl text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1e293b] mb-1">Payment Recorded!</h3>
        <p className="text-sm text-slate-500 mb-1">Receipt No: <span className="font-semibold text-[#1e293b]">{receiptNumber}</span></p>
        <p className="text-xs text-slate-400 mb-6">Invoice has been updated accordingly.</p>
        <div className="flex gap-3">
          <button onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors">
            <i className="ri-printer-line" /> Print Receipt
            <kbd className="text-[10px] bg-white/20 px-1 rounded">F10</kbd>
          </button>
          <button onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SalesPaymentPage() {
  const location      = useLocation();
  const navigate      = useNavigate();
  const [searchParams]= useSearchParams();
  const toast         = useToast();
  const state         = location.state as LocationState | null;
  const [invoiceContext, setInvoiceContext] = useState<LocationState | null>(state);
  const redirectedRef = useRef(false);

  const [receiptNo]       = useState(`RCT-${new Date().getFullYear()}-AUTO`);
  const [date, setDate]   = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount]   = useState<number | ''>(0);
  const [paymentMode, setPaymentMode]       = useState<PaymentMode>('CASH');
  const [referenceNo, setReferenceNo]       = useState('');
  const [cardLastFour, setCardLastFour]     = useState('');
  const [bankName, setBankName]             = useState('');
  const [chequeNo, setChequeNo]             = useState('');
  const [chequeDate, setChequeDate]         = useState('');
  const [chequeStatus, setChequeStatus]     = useState<ChequeStatus>('PENDING');
  const [bounceReason, setBounceReason]     = useState('');
  const [notes, setNotes]                   = useState('');
  const [saving, setSaving]                 = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<string | null>(null);
  const [selectionMode, setSelectionMode]   = useState(false);
  const { selectedWarehouseId, selectedWarehouseName } = useWarehouseStore();
  const [adjustAgainstDue, setAdjustAgainstDue] = useState(true);
  const [invoiceSearch, setInvoiceSearch]   = useState('');
  const [invoiceOptions, setInvoiceOptions] = useState<Array<{
    id: string; invoiceNo: string; date: string;
    customerName: string; grandTotal: number; balanceDue: number;
  }>>([]);
  const [loadingInvoiceOptions, setLoadingInvoiceOptions] = useState(false);
  const [loadingInvoiceContext, setLoadingInvoiceContext] = useState(() => Boolean(searchParams.get('invoiceId')));

  // ── Hydrate from query / location state ─────────────────────────────────
  useEffect(() => {
    let mounted = true;
    const hydrateFromQuery = async () => {
      if (state) { setInvoiceContext(state); setLoadingInvoiceContext(false); return; }
      const invoiceId = searchParams.get('invoiceId');
      if (!invoiceId) { setSelectionMode(true); setLoadingInvoiceContext(false); return; }
      setLoadingInvoiceContext(true);
      try {
        const detail = await salesService.getInvoice(invoiceId);
        if (!mounted) return;
        const raw = detail as unknown as {
          id: string; invoiceNo?: string; invoice_no?: string;
          customerId?: string; customer_id?: string;
          partyName?: string; party_name?: string;
          grandTotal?: number; grand_total?: number;
          balanceDue?: number; balance_due?: number;
          date: string;
        };
        const invoiceAmount = Number(raw.grandTotal ?? raw.grand_total ?? 0);
        const balanceDue    = Number(raw.balanceDue ?? raw.balance_due ?? invoiceAmount);
        setInvoiceContext({
          invoiceId:     raw.id,
          invoiceNumber: raw.invoiceNo ?? raw.invoice_no ?? '-',
          customerId:    raw.customerId ?? raw.customer_id ?? '',
          customerName:  raw.partyName ?? raw.party_name ?? 'Customer',
          invoiceAmount, balanceDue, invoiceDate: raw.date,
        });
        setSelectionMode(false);
      } catch {
        if (!mounted) return;
        toast.error('Failed to load invoice details for payment.');
        navigate('/sales/invoices');
      } finally {
        if (mounted) setLoadingInvoiceContext(false);
      }
    };
    hydrateFromQuery();
    return () => { mounted = false; };
  }, [state, searchParams, navigate, toast]);

  useEffect(() => {
    if (invoiceContext) setPaymentAmount(invoiceContext.balanceDue);
  }, [invoiceContext]);

  // ── Load outstanding invoices when in selection mode ────────────────────
  useEffect(() => {
    let mounted = true;
    if (!selectionMode)
      return () => {
        mounted = false;
      };
    const loadOutstanding = async () => {
      try {
        setLoadingInvoiceOptions(true);
        const resp = await salesService.listInvoices({
          page: 1,
          limit: 300,
          warehouseId: selectedWarehouseId || undefined,
        });
        if (!mounted) return;
        const rows = Array.isArray(
          (resp as unknown as { items?: unknown[] }).items,
        )
          ? (resp as unknown as { items: unknown[] }).items
          : [];
        const mapped = rows
          .map((row) => {
            const r = row as {
              id: string;
              invoiceNo?: string;
              invoice_no?: string;
              date?: string;
              invoice_date?: string;
              partyName?: string;
              party_name?: string;
              customerName?: string;
              customer_name?: string;
              grandTotal?: number;
              grand_total?: number;
              balanceDue?: number;
              balance_due?: number;
              paymentStatus?: string;
              payment_status?: string;
            };
            return {
              id: r.id,
              invoiceNo: r.invoiceNo ?? r.invoice_no ?? '-',
              date: r.date ?? r.invoice_date ?? '',
              customerName:
                r.partyName ??
                r.party_name ??
                r.customerName ??
                r.customer_name ??
                '-',
              grandTotal: Number(r.grandTotal ?? r.grand_total ?? 0),
              balanceDue: Number(r.balanceDue ?? r.balance_due ?? 0),
              paymentStatus: (
                r.paymentStatus ??
                r.payment_status ??
                ''
              ).toUpperCase(),
            };
          })
          .filter(
            (r) =>
              r.balanceDue > 0 ||
              r.paymentStatus === 'UNPAID' ||
              r.paymentStatus === 'PARTIAL',
          );
        setInvoiceOptions(mapped);
      } catch {
        if (!mounted) return;
        toast.error('Failed to load outstanding invoices');
        setInvoiceOptions([]);
      } finally {
        if (mounted) setLoadingInvoiceOptions(false);
      }
    };
    void loadOutstanding();
    return () => {
      mounted = false;
    };
  }, [selectionMode, toast, selectedWarehouseId]);

  // ── INVOICE SELECTION SCREEN ─────────────────────────────────────────────
  if (!invoiceContext && selectionMode) {
    const filteredOptions = invoiceOptions.filter((inv) =>
      inv.invoiceNo.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(invoiceSearch.toLowerCase())
    );

    return (
      <AppLayout>
        <div className="p-6 bg-[#f8fafc] min-h-full">
          {/* Header */}
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => navigate('/sales/payments')}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-slate-500 transition-colors cursor-pointer">
              <i className="ri-arrow-left-line" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Available Dues</h1>
              <p className="text-xs text-slate-400">Select an invoice with outstanding balance</p>
            </div>
          </div>

          {/* Full-width card */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#e2e8f0]">
              <div className="relative w-full max-w-md">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  placeholder="Search by invoice no or customer..."
                  className="w-full h-9 pl-8 pr-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                />
              </div>
            </div>

            {loadingInvoiceOptions ? (
              <div className="p-10 text-center text-slate-500 text-sm">Loading outstanding invoices...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm">
                <i className="ri-file-list-3-line text-4xl block mb-2" />
                No outstanding invoices found
              </div>
            ) : (
              /* Full-width scrollable table */
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {['Invoice No', 'Date', 'Customer', 'Total Amount', 'Balance Due', ''].map((h) => (
                        <th key={h}
                          className={`px-5 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap ${h === 'Total Amount' || h === 'Balance Due' ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOptions.map((inv, idx) => (
                      <tr key={inv.id}
                        className={`border-b border-slate-50 hover:bg-indigo-50/30 transition-colors cursor-pointer ${idx % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}
                        onClick={() => navigate(`/sales/payments/new?invoiceId=${encodeURIComponent(inv.id)}`)}
                      >
                        <td className="px-5 py-3.5 font-semibold text-[#4f46e5]">{inv.invoiceNo}</td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                          {inv.date ? new Date(inv.date).toLocaleDateString('en-IN') : inv.date}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[#1e293b]">{inv.customerName}</td>
                        <td className="px-5 py-3.5 text-right text-slate-700">{formatINR(inv.grandTotal)}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-red-600">{formatINR(inv.balanceDue)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/sales/payments/new?invoiceId=${encodeURIComponent(inv.id)}`); }}
                            className="h-8 px-4 rounded-lg bg-[#4f46e5] text-white text-xs font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loadingInvoiceContext) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center bg-[#f8fafc] p-6">
          <div className="flex items-center gap-2 rounded-xl border border-[#e2e8f0] bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            <i className="ri-loader-4-line animate-spin text-[#4f46e5]" />
            Loading payment invoice...
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!invoiceContext) return null;

  // ──Available Dues FORM ──────────────────────────────────────────────────
  const needsRef          = paymentMode === 'UPI' || paymentMode === 'NEFT' || paymentMode === 'RTGS';
  const needsCheque       = paymentMode === 'CHEQUE';
  const needsCard         = paymentMode === 'CARD';
  const needsBounceReason = chequeStatus === 'BOUNCED' || chequeStatus === 'INSUFFICIENT_BALANCE';
  const paymentAmountValue = Number(paymentAmount) || 0;
  const adjustedDue = invoiceContext
    ? Math.max(invoiceContext.balanceDue - (adjustAgainstDue ? paymentAmountValue : 0), 0)
    : 0;

  const validate = (): string | null => {
    if (paymentAmountValue <= 0) return 'Payment amount must be greater than 0';
    if (paymentAmountValue > invoiceContext.balanceDue) return `Amount cannot exceed balance due (${formatINR(invoiceContext.balanceDue)})`;
    if (needsRef && !referenceNo.trim()) return 'Reference number is required for ' + paymentMode;
    if (needsCheque) {
      if (!bankName.trim()) return 'Bank name is required';
      if (!chequeNo.trim()) return 'Cheque number is required';
      if (!chequeDate)       return 'Cheque date is required';
      if (needsBounceReason && !bounceReason.trim()) return 'Bounce reason is required';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    setSaving(true);

    if (isBackendAvailable()) {
      try {
        const created = await salesPaymentService.create({
          invoiceId: invoiceContext.invoiceId,
          date,
          paymentAmount: paymentAmountValue,
          paymentMode,
          referenceNo: referenceNo || undefined,
          cardLastFour: cardLastFour || undefined,
          bankName: bankName || undefined,
          chequeNo: chequeNo || undefined,
          chequeDate: chequeDate || undefined,
          chequeStatus: needsCheque ? chequeStatus : undefined,
          bounceReason: bounceReason || undefined,
          notes: notes || undefined,
          warehouseId: selectedWarehouseId || undefined,
          warehouseName: selectedWarehouseName || undefined,
        });
        setSuccessReceipt(created.receiptNumber);
      } catch (error) {
        const message = error instanceof AxiosError
          ? (error.response?.data as { message?: string } | undefined)?.message || error.message
          : 'Unable to save payment';
        toast.error(message);
      } finally { setSaving(false); }
      return;
    }

    // Offline mock
    setTimeout(() => {
      mockPaymentReceipts.push({
        id: `rct-${Date.now()}`, receiptNumber: receiptNo, date,
        invoiceId: invoiceContext.invoiceId, invoiceNumber: invoiceContext.invoiceNumber,
        customerId: invoiceContext.customerId, customerName: invoiceContext.customerName,
        invoiceAmount: invoiceContext.invoiceAmount, balanceDue: invoiceContext.balanceDue,
        paymentAmount: paymentAmountValue, paymentMode,
        referenceNo: referenceNo || undefined, cardLastFour: cardLastFour || undefined,
        bankName: bankName || undefined, chequeNo: chequeNo || undefined,
        chequeDate: chequeDate || undefined, chequeStatus: needsCheque ? chequeStatus : undefined,
        bounceReason: bounceReason || undefined, notes: notes || undefined,
        createdAt: new Date().toISOString(),
      });
      const invIdx = mockSalesInvoices.findIndex((i) => i.id === invoiceContext.invoiceId);
      if (invIdx !== -1) {
        const inv = mockSalesInvoices[invIdx];
        const newPaid    = (inv.paidAmount ?? 0) + paymentAmountValue;
        const newBalance = inv.grandTotal - newPaid;
        mockSalesInvoices[invIdx] = {
          ...inv, paidAmount: newPaid, balanceDue: Math.max(0, newBalance),
          paymentMode: newBalance <= 0 ? 'CASH' : 'PARTIAL',
          paymentStatus: newBalance <= 0 ? 'PAID' : 'PARTIAL',
        } as typeof inv;
      }
      setSaving(false);
      setSuccessReceipt(receiptNo);
    }, 600);
  };

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Payment Receipt - ${receiptNo}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; color: #1e293b; }
        .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 20px; }
        .company { font-size: 22px; font-weight: bold; }
        .title { font-size: 16px; color: #64748b; margin-top: 4px; }
        .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
        .label { color: #64748b; font-size: 13px; }
        .value { font-weight: 600; font-size: 13px; }
        .amount-box { background: #f0fdf4; border: 2px solid #86efac; border-radius: 8px; padding: 16px; text-align: center; margin: 20px 0; }
        .amount-big { font-size: 28px; font-weight: bold; color: #16a34a; }
        .words { font-size: 12px; color: #64748b; margin-top: 4px; }
        .footer { margin-top: 40px; display: flex; justify-content: space-between; }
        .sign-box { text-align: center; border-top: 1px solid #1e293b; padding-top: 8px; width: 160px; font-size: 12px; color: #64748b; }
      </style></head><body>
      <div class="header">
        <div class="company">InvenPro</div>
        <div class="title">PAYMENT RECEIPT</div>
      </div>
      <div class="row"><span class="label">Receipt No</span><span class="value">${receiptNo}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${date}</span></div>
      <div class="row"><span class="label">Customer</span><span class="value">${invoiceContext.customerName}</span></div>
      <div class="row"><span class="label">Invoice No</span><span class="value">${invoiceContext.invoiceNumber}</span></div>
      <div class="row"><span class="label">Invoice Amount</span><span class="value">${formatINR(invoiceContext.invoiceAmount)}</span></div>
      <div class="row"><span class="label">Payment Mode</span><span class="value">${paymentMode}</span></div>
      ${referenceNo ? `<div class="row"><span class="label">Reference No</span><span class="value">${referenceNo}</span></div>` : ''}
      ${needsCheque ? `<div class="row"><span class="label">Bank / Cheque</span><span class="value">${bankName} · ${chequeNo} · ${chequeDate}</span></div>` : ''}
      <div class="amount-box">
        <div class="amount-big">${formatINR(paymentAmountValue)}</div>
        <div class="words">${numberToWords(paymentAmountValue)}</div>
      </div>
      ${notes ? `<p style="font-size:12px;color:#64748b;">Notes: ${notes}</p>` : ''}
      <div class="footer">
        <div class="sign-box">Received By</div>
        <div class="sign-box">Authorised Signatory</div>
      </div>
      </body></html>
    `;
    const w = window.open('', '_blank');
    if (w) { w.document.write(printContent); w.document.close(); w.print(); }
  };

  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => navigate('/sales/invoices')}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-slate-500 transition-colors cursor-pointer">
              <i className="ri-arrow-left-line" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Available Dues</h1>
              <p className="text-xs text-slate-400">Receipt number is generated automatically on save</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Invoice details card */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Invoice Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div><p className="text-xs text-slate-400">Invoice No</p><p className="text-sm font-semibold text-[#4f46e5]">{invoiceContext.invoiceNumber}</p></div>
                <div><p className="text-xs text-slate-400">Customer</p><p className="text-sm font-semibold text-[#1e293b]">{invoiceContext.customerName}</p></div>
                <div><p className="text-xs text-slate-400">Invoice Amount</p><p className="text-sm font-semibold text-[#1e293b]">{formatINR(invoiceContext.invoiceAmount)}</p></div>
                <div><p className="text-xs text-slate-400">Balance Due</p><p className="text-sm font-bold text-red-600">{formatINR(invoiceContext.balanceDue)}</p></div>
              </div>
            </div>

            {/* Receipt info */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Receipt Info</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Receipt Number</label>
                  <input type="text" value={receiptNo} readOnly
                    className="w-full h-9 px-3 text-sm bg-slate-50 border border-[#e2e8f0] rounded-lg text-slate-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Payment Date</label>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]" />
                </div>
              </div>
            </div>

            {/* Payment Amount */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Payment Amount</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                <input
                  type="number"
                  value={paymentAmount}
                  placeholder="0"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '') { setPaymentAmount(''); return; }
                    const clamped = Math.min(invoiceContext.balanceDue, Math.max(0, Number(v) || 0));
                    setPaymentAmount(clamped);
                  }}
                  onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                  min={1}
                  max={invoiceContext.balanceDue}
                  className="w-full h-11 pl-7 pr-3 text-lg font-bold border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              
              {paymentAmountValue > 0 && <p className="text-xs text-slate-400 mt-1">{numberToWords(paymentAmountValue)}</p>}
            </div>

            {/* Payment Mode */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Payment Mode</p>
              <div className="grid grid-cols-3 gap-2">
                {PAYMENT_MODES.map((m) => (
                  <button key={m.value} onClick={() => setPaymentMode(m.value)}
                    className={`flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      paymentMode === m.value ? 'bg-[#4f46e5] text-white border-[#4f46e5]' : 'bg-white text-slate-600 border-[#e2e8f0] hover:border-[#4f46e5] hover:text-[#4f46e5]'
                    }`}>
                    <i className={`${m.icon} text-sm`} />{m.label}
                  </button>
                ))}
              </div>

              {needsRef && (
                <div className="mt-4">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Reference No <span className="text-red-500">*</span></label>
                  <input type="text" value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder={paymentMode === 'UPI' ? 'UPI Transaction ID' : 'NEFT/RTGS Reference No'}
                    className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]" />
                </div>
              )}

              {needsCard && (
                <div className="mt-4">
                  <label className="text-xs font-medium text-slate-600 block mb-1">Last 4 Digits (optional)</label>
                  <input type="text" value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="XXXX" maxLength={4}
                    className="w-40 h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] font-mono tracking-widest" />
                </div>
              )}

              {needsCheque && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Bank Name <span className="text-red-500">*</span></label>
                      <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                        placeholder="e.g. HDFC Bank"
                        className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Cheque No <span className="text-red-500">*</span></label>
                      <input type="text" value={chequeNo} onChange={(e) => setChequeNo(e.target.value)}
                        placeholder="CHQ-XXXXXX"
                        className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Cheque Date <span className="text-red-500">*</span></label>
                      <input type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)}
                        className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Cheque Status</label>
                      <select value={chequeStatus} onChange={(e) => setChequeStatus(e.target.value as ChequeStatus)}
                        className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] bg-white">
                        {CHEQUE_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                  {needsBounceReason && (
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Reason <span className="text-red-500">*</span></label>
                      <input type="text" value={bounceReason} onChange={(e) => setBounceReason(e.target.value)}
                        placeholder="Reason for bounce / insufficient balance..."
                        className="w-full h-9 px-3 text-sm border border-red-200 rounded-lg focus:outline-none focus:border-red-400 bg-red-50" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] resize-none" />
            </div>

            {/* Save button */}
            <button onClick={handleSave} disabled={saving}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5] text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap transition-colors">
              {saving
                ? <><i className="ri-loader-4-line animate-spin" /> Saving...</>
                : <><i className="ri-save-3-line" /> Save Payment <kbd className="text-[10px] bg-white/20 px-1.5 rounded ml-1">F9</kbd></>}
            </button>
          </div>
        </div>
      </div>

      {successReceipt && (
        <SuccessModal
          receiptNumber={successReceipt}
          onClose={() => navigate('/sales/invoices')}
          onPrint={() => { handlePrint(); navigate('/sales/invoices'); }}
        />
      )}
    </AppLayout>
  );
}