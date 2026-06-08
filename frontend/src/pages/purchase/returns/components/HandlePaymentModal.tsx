import { useState, useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { formatINR } from '@/utils/format';
import { apiClient } from '@/api/client';

export interface HandlePaymentModalState {
  open: boolean;
  returnId: string;
  returnNo: string;
  invoiceId: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  currentDue: number;
  autoAppliedAmount: number;
  remainingAmount: number;
}

type PaymentMode = 'CASH' | 'UPI' | 'NEFT' | 'RTGS' | 'CHEQUE';

const PAYMENT_MODES: PaymentMode[] = ['CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE'];

function HandlePaymentModal({
  state,
  onClose,
  onDone,
}: {
  state: HandlePaymentModalState;
  onClose: () => void;
  onDone: (returnId: string, type: 'refund' | 'credit', refundId: string | undefined, settledAmount: number, adjustmentAmount: number) => void;
}) {
  const toast = useToast();
  const [choice, setChoice] = useState<'refund' | 'credit' | null>(null);
  const [refundMode, setRefundMode] = useState<PaymentMode>('CASH');
  const [refundRef, setRefundRef] = useState('');
  const [done, setDone] = useState(false);
  const [finalType, setFinalType] = useState<'refund' | 'credit' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [adjustAgainstDue, setAdjustAgainstDue] = useState(false);

  const canAdjustAgainstDue = adjustAgainstDue && state.currentDue < 0;
  const adjustmentApplied = canAdjustAgainstDue ? Math.min(state.amount, Math.abs(state.currentDue)) : 0;
  const adjustedCurrentDue = state.currentDue + adjustmentApplied;
  const settlementAmount = Math.max(state.amount - adjustmentApplied, 0);
  const fullySettled = settlementAmount <= 0;

  useEffect(() => {
    if (state.open) {
      setChoice(null);
      setRefundMode('CASH');
      setRefundRef('');
      setDone(false);
      setFinalType(null);
      setAdjustAgainstDue(false);
    }
  }, [state.open]);

  const handleSimpleSave = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await apiClient.post(`/api/v1/purchase-return/${state.returnId}/handle-payment`, {
        paymentType: 'CREDIT',
        invoiceId: state.invoiceId,
        amount: 0,
        adjustmentAmount: adjustmentApplied,
      });

      toast.success(`Return settled via adjustment of ${formatINR(adjustmentApplied)}`);
      onDone(state.returnId, 'credit', undefined, 0, adjustmentApplied);
      setFinalType('credit');
      setDone(true);

    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to settle return');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCredit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      await apiClient.post(`/api/v1/purchase-return/${state.returnId}/handle-payment`, {
        paymentType: 'CREDIT',
        invoiceId: state.invoiceId,
        amount: settlementAmount,
        adjustmentAmount: adjustmentApplied,
      });

      toast.success(`Supplier credit of ${formatINR(settlementAmount)} stored for ${state.supplierName}`);
      onDone(state.returnId, 'credit', undefined, settlementAmount, adjustmentApplied);
      setFinalType('credit');
      setDone(true);

    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to store credit');
    } finally {
      setSubmitting(false);
    }
  };


const handleRefund = async () => {
  if (submitting) return;

  if (
    (refundMode === 'UPI' || refundMode === 'NEFT' || refundMode === 'RTGS') &&
    !refundRef.trim()
  ) {
    toast.error('Reference number required for this payment mode');
    return;
  }

  setSubmitting(true);

  try {
    const { data } = await apiClient.post(`/api/v1/purchase-return/${state.returnId}/handle-payment`, {
      paymentType: 'REFUND',
      invoiceId: state.invoiceId,
      amount: settlementAmount,
      adjustmentAmount: adjustmentApplied,
      paymentMode: refundMode,
      referenceNo: refundRef.trim() || undefined,
    });

    toast.success(`Refund of ${formatINR(settlementAmount)} recorded from ${state.supplierName}`);
    onDone(state.returnId, 'refund', data?.data?.refundId, settlementAmount, adjustmentApplied);
    setFinalType('refund');
    setDone(true);

  } catch (err: any) {
    toast.error(err?.response?.data?.message ?? err?.message ?? 'Failed to record refund');
  } finally {
    setSubmitting(false);
  }
};

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
            ? 'Remaining amount stored as supplier credit.'
            : 'Remaining amount refunded successfully.'}
        </p>
        <button
          onClick={onClose}
          className="w-full h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100">
            <i className="ri-refund-2-line text-xl text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1e293b]">Settle Return Difference</h3>
            <p className="text-xs text-slate-500">{state.returnNo} · {state.supplierName}</p>
          </div>
        </div>

        <div className="grid gap-3 mb-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Supplier current due</span>
              <span className="font-semibold text-[#1e293b]">{formatINR(state.currentDue)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Returned product value</span>
              <span className="font-semibold text-[#1e293b]">{formatINR(state.amount)}</span>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <input
                id="adjust-purchase-return-due"
                type="checkbox"
                checked={canAdjustAgainstDue}
                onChange={(e) => setAdjustAgainstDue(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="adjust-purchase-return-due" className="text-sm text-slate-600 leading-snug cursor-pointer">
                Adjust amount against negative due ({formatINR(adjustmentApplied)})
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-emerald-800 font-semibold">Current due after adjustment</span>
              <span className="font-bold text-emerald-700">{formatINR(adjustedCurrentDue)}</span>
            </div>
            <p className="mt-2 text-xs text-emerald-700/80">
              Adjustment consumes the supplier due first. Any excess return amount stays for refund or credit.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-amber-800 font-semibold">Remaining amount to settle</span>
              <span className="font-bold text-amber-700">{formatINR(settlementAmount)}</span>
            </div>
            <p className="mt-2 text-xs text-amber-800/80">
              This amount can be refunded now or saved as supplier credit.
            </p>
          </div>
        </div>

        {!fullySettled && (
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              onClick={() => setChoice('refund')}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${choice === 'refund' ? 'border-[#4f46e5] bg-indigo-50' : 'border-[#e2e8f0] hover:border-indigo-200'}`}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-100 mb-2">
                <i className="ri-bank-card-line text-[#4f46e5]" />
              </div>
              <p className="text-sm font-semibold text-[#1e293b]">Refund Amount</p>
              <p className="text-xs text-slate-500 mt-0.5">Receive the remaining amount now</p>
            </button>
            <button
              onClick={() => setChoice('credit')}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${choice === 'credit' ? 'border-emerald-500 bg-emerald-50' : 'border-[#e2e8f0] hover:border-emerald-200'}`}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-emerald-100 mb-2">
                <i className="ri-wallet-3-line text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-[#1e293b]">Keep as Credit</p>
              <p className="text-xs text-slate-500 mt-0.5">Apply the remaining amount to future invoices</p>
            </button>
          </div>
        )}

        {!fullySettled && choice === 'refund' && (
          <div className="bg-[#f8fafc] rounded-xl p-4 mb-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Payment Mode</label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_MODES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setRefundMode(m)}
                    className={`h-7 px-3 rounded-full text-xs font-semibold border transition-colors cursor-pointer whitespace-nowrap ${refundMode === m ? 'bg-[#4f46e5] text-white border-[#4f46e5]' : 'bg-white text-slate-600 border-[#e2e8f0] hover:border-indigo-300'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            {(refundMode === 'UPI' || refundMode === 'NEFT' || refundMode === 'RTGS') && (
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Reference No <span className="text-red-500">*</span></label>
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

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap">
            {fullySettled ? 'Cancel' : 'Skip for now'}
          </button>
          {fullySettled ? (
            <button onClick={handleSimpleSave} disabled={submitting} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer whitespace-nowrap">
              Save
            </button>
          ) : choice === 'credit' && (
            <button onClick={handleCredit} disabled={submitting} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer whitespace-nowrap">
              Store Credit
            </button>
          )} 
          {!fullySettled && choice === 'refund' && (
            <button onClick={handleRefund} disabled={submitting} className="flex-1 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
              Record Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default HandlePaymentModal;
