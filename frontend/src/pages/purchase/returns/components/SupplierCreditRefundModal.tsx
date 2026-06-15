import { useToast } from '@/contexts/ToastContext';
import { useState, useEffect } from 'react';
import { formatINR } from '@/utils/format';

export interface CreditModalState {
  open: boolean;
  returnNo: string;
  returnId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  invoiceId: string; // ✅ ADD THIS
}

type PaymentMode = 'CASH' | 'UPI' | 'NEFT' | 'RTGS' | 'CHEQUE';

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE'];

// ─── API ─────────────────────────────────────────────────────────────────────

const BASE = `http://localhost:7001/api/v1/purchase-return`;

function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
  };
}

async function apiHandlePayment(
  returnId: string,
  payload: {
    type: 'refund' | 'credit';
    refundMode?: string;
    referenceNo?: string;
    invoiceId: string; // ✅ ADD THIS
  },
) {
  const res = await fetch(`${BASE}/${returnId}/handle-payment`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message ?? 'Failed to handle payment');
  }
  return res.json();
}

// ─── Component ────────────────────────────────────────────────────────────────

function SupplierCreditRefundModal({
  state,
  onClose,
  onDone,
}: {
  state: CreditModalState;
  onClose: () => void;
  onDone: (
    returnId: string,
    type: 'refund' | 'credit',
    refundId?: string,
  ) => void;
}) {
  const toast = useToast();
  const [choice, setChoice] = useState<'refund' | 'credit' | null>(null);
  const [refundMode, setRefundMode] = useState<PaymentMode>('NEFT');
  const [refundRef, setRefundRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [finalType, setFinalType] = useState<'refund' | 'credit' | null>(null);

  const needsRef =
    refundMode === 'UPI' || refundMode === 'NEFT' || refundMode === 'RTGS';

  useEffect(() => {
    if (state.open) {
      setChoice(null);
      setRefundMode('NEFT');
      setRefundRef('');
      setDone(false);
    }
  }, [state.open]);

  // ── Keep as Credit ───────────────────────────────────────────────────────

  const handleCredit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      await apiHandlePayment(state.returnId, {
        type: 'credit',
        invoiceId: state.invoiceId, // ✅ ADD THIS
      });

      toast.success(
        `Supplier credit of ${formatINR(state.amount)} stored for ${state.supplierName}`,
      );
      onDone(state.returnId, 'credit');
      setFinalType('credit');

      setDone(true);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to store credit');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Record Refund ────────────────────────────────────────────────────────

  const handleRefund = async () => {
    if (submitting) return;

    if (needsRef && !refundRef.trim()) {
      toast.error('Reference number required');
      return;
    }

    setSubmitting(true);
    try {
      const resp = await apiHandlePayment(state.returnId, {
        type: 'refund',
        refundMode,
        referenceNo: refundRef.trim() || undefined,
        invoiceId: state.invoiceId, // ✅ ADD THIS
      });

      const refundId =
        resp?.data?.refundId || resp?.data?.id || resp?.id || null;

      toast.success(`Refund recorded from ${state.supplierName}`);
      onDone(state.returnId, 'refund', refundId);
      setFinalType('refund');
      setDone(true);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to record refund');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Done screen ──────────────────────────────────────────────────────────

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
            <i className="ri-check-line text-2xl text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-[#1e293b] mb-1">Done!</h3>
          <p className="text-sm text-slate-500 mb-6">
            {finalType === 'credit'
              ? 'Supplier credit stored for future use.'
              : 'Refund received from supplier recorded.'}
          </p>
          <button
            onClick={onClose}
            className="w-full h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // ── Main modal ───────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100">
            <i className="ri-refund-2-line text-xl text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1e293b]">
              Invoice Already Paid
            </h3>
            <p className="text-xs text-slate-500">
              Return {state.returnNo} · {formatINR(state.amount)}
            </p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-5">
          The original purchase invoice was fully paid. How would you like to
          handle the return amount of <strong>{formatINR(state.amount)}</strong>{' '}
          from <strong>{state.supplierName}</strong>?
        </p>

        {/* Choice cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setChoice('refund')}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              choice === 'refund'
                ? 'border-[#4f46e5] bg-indigo-50'
                : 'border-[#e2e8f0] hover:border-indigo-200'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-100 mb-2">
              <i className="ri-bank-card-line text-[#4f46e5]" />
            </div>
            <p className="text-sm font-semibold text-[#1e293b]">
              Record Refund
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Supplier pays back now
            </p>
          </button>

          <button
            onClick={() => setChoice('credit')}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
              choice === 'credit'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-[#e2e8f0] hover:border-emerald-200'
            }`}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 mb-2">
              <i className="ri-wallet-3-line text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-[#1e293b]">
              Keep as Credit
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Adjust in next purchase
            </p>
          </button>
        </div>

        {/* Refund details */}
        {choice === 'refund' && (
          <div className="bg-[#f8fafc] rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                Payment Mode
              </label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setRefundMode(m)}
                    className={`h-7 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
                      refundMode === m
                        ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                        : 'bg-white text-slate-600 border-[#e2e8f0] hover:border-indigo-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {needsRef && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                  Reference No <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={refundRef}
                  onChange={(e) => setRefundRef(e.target.value)}
                  placeholder="Transaction / UTR reference"
                  className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            Skip for Now
          </button>

          {choice === 'credit' && (
            <button
              onClick={handleCredit}
              disabled={submitting}
              className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin" /> Saving…
                </>
              ) : (
                'Store Credit'
              )}
            </button>
          )}

          {choice === 'refund' && (
            <button
              onClick={handleRefund}
              disabled={submitting}
              className="flex-1 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5"
            >
              {submitting ? (
                <>
                  <i className="ri-loader-4-line animate-spin" /> Saving…
                </>
              ) : (
                'Record Refund'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SupplierCreditRefundModal;
