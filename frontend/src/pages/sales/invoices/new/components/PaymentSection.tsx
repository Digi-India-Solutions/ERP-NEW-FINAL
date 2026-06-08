import { useCallback, useRef } from 'react';
import { formatINR } from '@/utils/format';

export interface PaymentBreakdown {
  cash: number;
  upi: number;
  card: number;
  cheque: number;
  chequeBankName: string;
  chequeNo: string;
  chequeDate: string;
  chequeBranch: string;
}

interface Props {
  payment: PaymentBreakdown;
  onChange: (p: PaymentBreakdown) => void;
  invoiceTotal: number;
  customerCreditLimit?: number;
  customerBalance?: number;
  availableCreditAdjustment?: number;
  creditApplied?: boolean;
  onApplyCreditAdjustment: () => void;
  onRemoveCreditAdjustment: () => void;
}

export default function PaymentSection({
  payment,
  onChange,
  invoiceTotal,
  customerCreditLimit,
  customerBalance,
  availableCreditAdjustment = 0,
  creditApplied = false,
  onApplyCreditAdjustment,
  onRemoveCreditAdjustment,
}: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  type PaymentModeKey = 'cash' | 'upi' | 'card' | 'cheque';

  const set = useCallback(
    (patch: Partial<PaymentBreakdown>) => onChange({ ...payment, ...patch }),
    [payment, onChange],
  );

  const totalPaid = payment.cash + payment.upi + payment.card + payment.cheque;
  const fallbackUsableCredit = Math.max(0, (Number(customerCreditLimit) || 0) + (Number(customerBalance) || 0));
  const usableCredit = Math.max(0, Number(availableCreditAdjustment) || fallbackUsableCredit);
  const appliedCredit = creditApplied ? Math.min(usableCredit, invoiceTotal) : 0;
  const payableAfterCredit = Math.max(0, invoiceTotal - appliedCredit);
  const amountDueAfterAdjustment = Math.max(0, payableAfterCredit - totalPaid);
  const fullyPaid = amountDueAfterAdjustment <= 0 && invoiceTotal > 0;
  const canAdjustCredit = usableCredit > 0 && invoiceTotal > 0;
  const customerBalanceValue = customerBalance ?? 0;
  const customerBalanceLabel = customerBalanceValue >= 0 ? 'Receivable' : 'Payable';

  const setPaymentAmount = useCallback(
    (key: PaymentModeKey, rawValue: string) => {
      const entered = Math.max(0, parseFloat(rawValue) || 0);
      const otherPaid = totalPaid - payment[key];
      const maxAllowedForField = Math.max(0, invoiceTotal - appliedCredit - otherPaid);
      set({ [key]: Math.min(entered, maxAllowedForField) } as Partial<PaymentBreakdown>);
    },
    [appliedCredit, invoiceTotal, payment, set, totalPaid],
  );

  const handlePayKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();

    if (e.key === 'ArrowDown') {
      if (idx === 3 && payment.cheque > 0) {
        const chequeFirst = sectionRef.current?.querySelector('[data-cheque-index="0"]') as HTMLInputElement | null;
        chequeFirst?.focus();
        return;
      }
      const next = sectionRef.current?.querySelector(`[data-pay-index="${idx + 1}"]`) as HTMLInputElement | null;
      next?.focus();
      return;
    }

    const prev = sectionRef.current?.querySelector(`[data-pay-index="${idx - 1}"]`) as HTMLInputElement | null;
    prev?.focus();
  };

  const inputCls = 'w-full h-8 px-2 text-sm text-right bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

  return (
    <div ref={sectionRef} className="bg-white border border-[#e2e8f0] rounded-xl p-4 h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Payment</h3>

      <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-white border border-slate-200 px-2.5 py-2">
            <p className="text-slate-500 mb-0.5">Credit Limit</p>
            <p className="text-sm font-semibold text-slate-800">{formatINR(customerCreditLimit ?? 0)}</p>
          </div>
          <div className="rounded-lg bg-white border border-slate-200 px-2.5 py-2">
            <p className="text-slate-500 mb-0.5">Balance</p>
            <p className={`text-sm font-semibold ${customerBalanceValue >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {customerBalanceValue >= 0 ? '+' : '-'}{formatINR(Math.abs(customerBalanceValue))}
            </p>
          </div>
        </div>
        <div className="mt-2 rounded-lg bg-white border border-slate-200 px-2.5 py-2">
          <p className="text-slate-500 text-xs mb-0.5">Total Usable Credit</p>
          <p className="text-sm font-semibold text-indigo-700">{formatINR(usableCredit)}</p>
        </div>
        <p className="mt-2 text-[11px] text-slate-500">
          {customerBalanceLabel} {customerBalanceValue >= 0 ? 'from customer' : 'to customer'}
        </p>
      </div>

      <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
        <div className="flex items-start justify-between gap-3">
          {/* <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Adjustment</p>
            <p className="text-sm text-amber-900 mt-0.9">
              {canAdjustCredit
                ? `Up to ${formatINR(Math.min(usableCredit, invoiceTotal))} can be adjusted from available customer credit.`
                : 'No adjustment credit is available for this invoice.'}
            </p>
          </div> */}
          <label className={`shrink-0 inline-flex items-center gap-2 text-xs font-semibold select-none ${canAdjustCredit ? 'text-amber-800 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}>
            <input
              type="checkbox"
              checked={creditApplied}
              disabled={!canAdjustCredit}
              onChange={(e) => {
                if (e.target.checked) onApplyCreditAdjustment();
                else onRemoveCreditAdjustment();
              }}
              className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
            />
            Use Credit 
            {/* ({formatINR(Math.min(usableCredit, invoiceTotal))}) */}
          </label>
        </div>
        {/* {creditApplied && canAdjustCredit && (
          <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <span className="font-semibold">Adjustment applied:</span> -{formatINR(appliedCredit)}
          </div>
        )} */}

      </div>

      <div className="space-y-2">
        {/* Cash */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 w-28 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-sm font-medium text-slate-700">Cash</span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={payment.cash || ''}
            onChange={(e) => setPaymentAmount('cash', e.target.value)}
           onKeyDown={(e) => handlePayKeyDown(e, 0)}
            data-pay-index={0}
            placeholder="0.00"
            className={inputCls}
          />
        </div>

        {/* UPI */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 w-28 shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
            <span className="text-sm font-medium text-slate-700">UPI / Online</span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={payment.upi || ''}
            onChange={(e) => setPaymentAmount('upi', e.target.value)}
            onKeyDown={(e) => handlePayKeyDown(e, 1)}
            data-pay-index={1}
            placeholder="0.00"
            className={inputCls}
          />
        </div>

        {/* Card */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 w-28 shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <span className="text-sm font-medium text-slate-700">Card</span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={payment.card || ''}
            onChange={(e) => setPaymentAmount('card', e.target.value)}
            onKeyDown={(e) => handlePayKeyDown(e, 2)}
            data-pay-index={2}
            placeholder="0.00"
            className={inputCls}
          />
        </div>

        {/* Cheque */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 w-28 shrink-0">
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span className="text-sm font-medium text-slate-700">Cheque</span>
          </div>
          <input
            type="number"
            min="0"
            step="any"
            value={payment.cheque || ''}
            onChange={(e) => setPaymentAmount('cheque', e.target.value)}
            onKeyDown={(e) => handlePayKeyDown(e, 3)}
            data-pay-index={3}
            placeholder="0.00"
            className={inputCls}
          />
        </div>

        {/* Cheque details panel */}
        {payment.cheque > 0 && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs font-semibold text-amber-700 mb-2">Cheque Details</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Bank Name</label>
                <input
                  type="text"
                  value={payment.chequeBankName}
                  onChange={(e) => set({ chequeBankName: e.target.value })}
                  data-cheque-index={0}
                  placeholder="Bank name"
                  className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Cheque No</label>
                <input
                  type="text"
                  value={payment.chequeNo}
                  onChange={(e) => set({ chequeNo: e.target.value })}
                  data-cheque-index={1}
                  placeholder="Cheque number"
                  className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Cheque Date</label>
                <input
                  type="date"
                  value={payment.chequeDate}
                  onChange={(e) => set({ chequeDate: e.target.value })}
                  data-cheque-index={2}
                  className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-0.5">Branch</label>
                <input
                  type="text"
                  value={payment.chequeBranch}
                  onChange={(e) => set({ chequeBranch: e.target.value })}
                  data-cheque-index={3}
                  placeholder="Branch name"
                  className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 rounded-xl border border-[#e2e8f0] bg-white p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-600">Invoice Total</span>
          <span className="font-semibold text-slate-800">{formatINR(invoiceTotal)}</span>
        </div>
        {appliedCredit > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600">Adjustment</span>
            <span className="font-semibold text-emerald-600">-{formatINR(appliedCredit)}</span>
          </div>
        )} 
        {appliedCredit > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600">Payable After Credit</span>
            <span className="font-semibold text-slate-800">{formatINR(payableAfterCredit)}</span>
          </div>
        )}
        {totalPaid > 0 && (
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-600">Paid Now</span>
            <span className="font-semibold text-slate-800">{formatINR(totalPaid)}</span>
          </div>
        )}
        <div className="mt-3 pt-3 border-t border-[#e2e8f0] flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Balance to Pay</span>
          {fullyPaid ? (
            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
              <i className="ri-checkbox-circle-fill" /> Fully Paid
            </span>
          ) : (
            <span className={`text-sm font-bold ${amountDueAfterAdjustment > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {amountDueAfterAdjustment > 0 ? formatINR(amountDueAfterAdjustment) : 'Fully Paid'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
