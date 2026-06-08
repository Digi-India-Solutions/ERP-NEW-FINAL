import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import { formatINR } from '@/utils/format';
import PaymentHeader from './components/PaymentHeader';
import InvoiceCard from './components/InvoiceCard';
import VoucherInfo from './components/VoucherInfo';
import PaymentAmount from './components/PaymentAmount';
import PaymentMethodSelector from './components/PaymentMethodSelector';
import { apiClient } from '@/api/client';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'NEFT' | 'RTGS';
type ChequeStatus = 'PENDING' | 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE';

const SESSION_KEY = 'purchase_payment_state';

interface LocationState {
  invoiceId: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceAmount: number;
  balanceDue: number;
  invoiceDate: string;
}

/** Snapshot captured at save-time so print is never stale. */
interface SavedPaymentSnapshot {
  voucherNumber: string;
  date: string;
  paymentAmount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  notes?: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceAmount: number;
}

// ─── API ──────────────────────────────────────────────────────────────────────

/**
 * POST /api/v1/purchase-payment
 *
 * Backend expects:  invoiceId, paymentAmount, paymentMode, date,
 *                   referenceNo?, cardLastFour?, bankName?, chequeNo?,
 *                   chequeDate?, chequeStatus?, bounceReason?, notes?
 *
 * Backend returns:  { success, message, data: { voucherNumber, ... } }
 */

async function apiCreatePayment(payload: {
  invoiceId: string;
  paymentAmount: number;
  paymentMode: PaymentMode;
  date: string;
  referenceNo?: string;
  cardLastFour?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeStatus?: ChequeStatus;
  bounceReason?: string;
  notes?: string;
  warehouseId?: string;
  warehouseName?: string;
}): Promise<{ voucherNumber: string }> {
  const { data } = await apiClient.post('/api/v1/purchase-payment', payload);
  return data.data;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Resolve invoice state from navigation or sessionStorage (survives F5 refresh).
 * Called once synchronously before hooks so useState can use the value.
 */
function resolveState(locationState: unknown): LocationState | null {
  if (locationState) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(locationState)); } catch { /* ignore */ }
    return locationState as LocationState;
  }
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? (JSON.parse(saved) as LocationState) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}

// ─── Number to Words ──────────────────────────────────────────────────────────

export function numberToWords(n: number): string {
  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
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

// ─── Print ────────────────────────────────────────────────────────────────────

function printVoucher(snap: SavedPaymentSnapshot) {
  const html = `
    <html><head><title>Payment Voucher - ${snap.voucherNumber}</title>
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
      <div class="title">PAYMENT VOUCHER</div>
    </div>
    <div class="row"><span class="label">Voucher No</span><span class="value">${snap.voucherNumber}</span></div>
    <div class="row"><span class="label">Date</span><span class="value">${snap.date}</span></div>
    <div class="row"><span class="label">Supplier</span><span class="value">${snap.supplierName}</span></div>
    <div class="row"><span class="label">Invoice No</span><span class="value">${snap.invoiceNumber}</span></div>
    <div class="row"><span class="label">Invoice Amount</span><span class="value">${formatINR(snap.invoiceAmount)}</span></div>
    <div class="row"><span class="label">Payment Mode</span><span class="value">${snap.paymentMode}</span></div>
    ${snap.referenceNo ? `<div class="row"><span class="label">Reference No</span><span class="value">${snap.referenceNo}</span></div>` : ''}
    ${snap.bankName && snap.chequeNo ? `<div class="row"><span class="label">Bank / Cheque</span><span class="value">${snap.bankName} · ${snap.chequeNo} · ${snap.chequeDate}</span></div>` : ''}
    <div class="amount-box">
      <div class="amount-big">${formatINR(snap.paymentAmount)}</div>
      <div class="words">${numberToWords(snap.paymentAmount)}</div>
    </div>
    ${snap.notes ? `<p style="font-size:12px;color:#64748b;">Notes: ${snap.notes}</p>` : ''}
    <div class="footer">
      <div class="sign-box">Prepared By</div>
      <div class="sign-box">Authorised Signatory</div>
    </div>
    </body></html>
  `;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); w.print(); }
}

// ─── Success Modal ────────────────────────────────────────────────────────────

interface SuccessModalProps {
  voucherNumber: string;
  onClose: () => void;
  onPrint: () => void;
}

function SuccessModal({ voucherNumber, onClose, onPrint }: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm text-center">
        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 mx-auto mb-4">
          <i className="ri-checkbox-circle-fill text-3xl text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#1e293b] mb-1">Available Dues!</h3>
        <p className="text-sm text-slate-500 mb-1">
          Voucher No: <span className="font-semibold text-[#1e293b]">{voucherNumber}</span>
        </p>
        <p className="text-xs text-slate-400 mb-6">Invoice has been updated accordingly.</p>
        <div className="flex gap-3">
          <button
            onClick={onPrint}
            className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
          >
            <i className="ri-printer-line" /> Print Voucher
            <kbd className="text-[10px] bg-white/20 px-1 rounded">F10</kbd>
          </button>
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PurchasePaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedWarehouseId, selectedWarehouseName } = useWarehouseStore();

  // Resolve state synchronously before any hooks (handles both navigation and F5 refresh)
  const state = resolveState(location.state);

  // ── State ──────────────────────────────────────────────────────────────────
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState<number>(state?.balanceDue ?? 0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('CASH');
  const [referenceNo, setReferenceNo] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [bankName, setBankName] = useState('');
  const [chequeNo, setChequeNo] = useState('');
  const [chequeDate, setChequeDate] = useState('');
  const [chequeStatus, setChequeStatus] = useState<ChequeStatus>('PENDING');
  const [bounceReason, setBounceReason] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedPaymentSnapshot | null>(null);

  // ── Redirect if no invoice data ────────────────────────────────────────────
  useEffect(() => {
    if (!state) {
      toast.error('No invoice data. Please use Record Payment from invoice list.');
      navigate('/purchase/invoices');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!state) return null;

  // ── Derived flags ──────────────────────────────────────────────────────────
  const needsRef      = paymentMode === 'UPI' || paymentMode === 'NEFT' || paymentMode === 'RTGS';
  const needsCheque   = paymentMode === 'CHEQUE';
  const needsCard     = paymentMode === 'CARD';
  const needsBounceReason = chequeStatus === 'BOUNCED' || chequeStatus === 'INSUFFICIENT_BALANCE';

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): string | null => {
    if (paymentAmount <= 0)
      return 'Payment amount must be greater than 0';
    if (Number(paymentAmount) > Number(state.balanceDue))
      return `Amount cannot exceed balance due (${formatINR(state.balanceDue)})`;
    if (needsRef && !referenceNo.trim())
      return `Reference number is required for ${paymentMode}`;
    if (needsCheque) {
      if (!bankName.trim())  return 'Bank name is required';
      if (!chequeNo.trim())  return 'Cheque number is required';
      if (!chequeDate)       return 'Cheque date is required';
      if (needsBounceReason && !bounceReason.trim()) return 'Bounce reason is required';
    }
    return null;
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSaving(true);
    try {
      // Only send the fields the backend actually reads from req.body
      const payload = {
        invoiceId:     state.invoiceId,
        paymentAmount: Number(paymentAmount),
        paymentMode,
        date,
        referenceNo:   referenceNo   || undefined,
        cardLastFour:  cardLastFour  || undefined,
        bankName:      bankName      || undefined,
        chequeNo:      chequeNo      || undefined,
        chequeDate:    chequeDate    || undefined,
        chequeStatus:  needsCheque   ? chequeStatus : undefined,
        bounceReason:  bounceReason  || undefined,
        notes:         notes         || undefined,
        warehouseId:   selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : undefined,
        warehouseName: selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseName : undefined,
      };
console.log(payload)
      // Returns json.data = { voucherNumber, ... }
      const data = await apiCreatePayment(payload);

      clearSession();

      // Use the server-generated voucher number (e.g. PAY-2026-0001) for the snapshot
      setSavedSnapshot({
        voucherNumber:  data.voucherNumber,
        date,
        paymentAmount:  Number(paymentAmount),
        paymentMode,
        referenceNo:    referenceNo  || undefined,
        bankName:       bankName     || undefined,
        chequeNo:       chequeNo     || undefined,
        chequeDate:     chequeDate   || undefined,
        notes:          notes        || undefined,
        supplierName:   state.supplierName,
        invoiceNumber:  state.invoiceNumber,
        invoiceAmount:  state.invoiceAmount,
      });

      toast.success('Payment saved successfully!');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to save payment');
    } finally {
      setSaving(false);
    }
  }, [
    state, date, paymentAmount, paymentMode,
    referenceNo, cardLastFour, bankName,
    chequeNo, chequeDate, chequeStatus,
    needsCheque, bounceReason, notes, toast,
    selectedWarehouseId, selectedWarehouseName,
  ]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F9') { e.preventDefault(); handleSave(); }
      if (e.key === 'F10' && savedSnapshot) { e.preventDefault(); printVoucher(savedSnapshot); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSave, savedSnapshot]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        <div className="max-w-2xl mx-auto">

          {/* PaymentHeader navigates back internally; just pass voucherNo */}
          <PaymentHeader voucherNo={savedSnapshot?.voucherNumber ?? ''} />

          <div className="space-y-4">

            <InvoiceCard state={state} />

            <VoucherInfo voucherNo={savedSnapshot?.voucherNumber ?? '—'} date={date} setDate={setDate} />

            <PaymentAmount
              paymentAmount={paymentAmount}
              setPaymentAmount={setPaymentAmount}
              state={state}
            />

            <PaymentMethodSelector
              paymentMode={paymentMode}
              setPaymentMode={setPaymentMode}
              needsRef={needsRef}
              needsCheque={needsCheque}
              needsCard={needsCard}
              needsBounceReason={needsBounceReason}
              referenceNo={referenceNo}
              setReferenceNo={setReferenceNo}
              cardLastFour={cardLastFour}
              setCardLastFour={setCardLastFour}
              bankName={bankName}
              setBankName={setBankName}
              chequeNo={chequeNo}
              setChequeNo={setChequeNo}
              chequeDate={chequeDate}
              setChequeDate={setChequeDate}
              chequeStatus={chequeStatus}
              setChequeStatus={setChequeStatus}
              bounceReason={bounceReason}
              setBounceReason={setBounceReason}
            />

            {/* Notes */}
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] resize-none"
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5] text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap transition-colors"
            >
              {saving
                ? <><i className="ri-loader-4-line animate-spin" /> Saving...</>
                : <><i className="ri-save-3-line" /> Save Payment <kbd className="text-[10px] bg-white/20 px-1.5 rounded ml-1">F9</kbd></>
              }
            </button>

          </div>
        </div>
      </div>

      {/* Success modal — shown after API responds with real voucher number */}
      {savedSnapshot && (
        <SuccessModal
          voucherNumber={savedSnapshot.voucherNumber}
          onClose={() => { clearSession(); navigate('/purchase/payments'); }}
          onPrint={() => { printVoucher(savedSnapshot!); clearSession(); navigate('/purchase/payments'); }}
        />
      )}
    </AppLayout>
  );
}
