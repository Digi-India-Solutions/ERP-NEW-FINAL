import { useState, useEffect, useCallback, useMemo } from 'react';
import { formatINR } from '@/utils/format';

export type PurchaseMode = 'CASH' | 'CREDIT' | 'MIXED';

export interface PaymentRow {
  cash: number;
  upi: number;
  card: number;
  cheque: number;
  chequeBankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeBranch?: string;
}

interface Props {
  invoiceNo: string;
  date: string;
  partyBillNo: string;
  partyBillDate: string;
  purchaseMode: PurchaseMode;
  creditPeriod: number;
  dueDate: string;
  isSameState: boolean;
  grandTotal?: number;
  supplierCreditLimit?: number;
  supplierOpeningBalance?: number;
  supplierCreditAvailable?: number;
  supplierCreditAppliedAmount?: number;
  supplierCreditCount?: number;
  loadingSupplierCredit?: boolean;
  creditApplied?: boolean;
  onDateChange: (v: string) => void;
  onPartyBillNoChange: (v: string) => void;
  onPartyBillDateChange: (v: string) => void;
  onPurchaseModeChange: (v: PurchaseMode) => void;
  onCreditPeriodChange: (v: number) => void;
  onDueDateChange: (v: string) => void;
  onApplyCreditAdjustment?: () => void;
  onRemoveCreditAdjustment?: () => void;
  onPaymentChange?: (totalPaid: number) => void; // bubble paid amount up to page
}

const MODE_OPTS: { value: PurchaseMode; label: string; icon: string }[] = [
  { value: 'CASH', label: 'Cash', icon: 'ri-money-rupee-circle-line' },
  { value: 'CREDIT', label: 'Credit', icon: 'ri-time-line' },
  { value: 'MIXED', label: 'Mixed', icon: 'ri-split-cells-horizontal' },
];

function emptyPayment(): PaymentRow {
  return {
    cash: 0,
    upi: 0,
    card: 0,
    cheque: 0,
    chequeBankName: '',
    chequeNo: '',
    chequeDate: '',
    chequeBranch: '',
  };
}

export default function PurchaseInvoiceInfo({
  invoiceNo, date, partyBillNo, partyBillDate, purchaseMode, creditPeriod, dueDate,
  isSameState, grandTotal = 0,
  supplierCreditLimit = 0,
  supplierOpeningBalance = 0,
  supplierCreditAvailable = 0,
  supplierCreditAppliedAmount = 0,
  supplierCreditCount = 0,
  loadingSupplierCredit = false,
  creditApplied = false,
  onDateChange, onPartyBillNoChange, onPartyBillDateChange, onPurchaseModeChange,
  onCreditPeriodChange, onDueDateChange,
  onApplyCreditAdjustment,
  onRemoveCreditAdjustment,
  onPaymentChange,
}: Props) {
  const [localCreditPeriod, setLocalCreditPeriod] = useState(creditPeriod);
  const [payment, setPayment] = useState<PaymentRow>(() => emptyPayment());

  const fallbackUsableSupplierCredit = Math.max(0, (Number(supplierCreditLimit) || 0) + (Number(supplierOpeningBalance) || 0));
  const usableSupplierCredit = Math.max(0, Number(supplierCreditAvailable) || fallbackUsableSupplierCredit);
  const applicableSupplierCredit = Math.max(0, Math.min(usableSupplierCredit, grandTotal));
  const canAdjustSupplierCredit = usableSupplierCredit > 0 && grandTotal > 0;
  const appliedSupplierCredit = creditApplied ? Math.min(applicableSupplierCredit, grandTotal) : 0;
  const payableAfterCredit = Math.max(0, grandTotal - appliedSupplierCredit);
  const remainingSupplierCredit = Math.max(0, usableSupplierCredit + appliedSupplierCredit);
  const creditModeShortfall = purchaseMode === 'CREDIT' && grandTotal > usableSupplierCredit;

  const totalPaid = useMemo(() => {
    return Number(payment.cash || 0) + Number(payment.upi || 0) + Number(payment.card || 0) + Number(payment.cheque || 0);
  }, [payment]);

  const amountDueAfterAdjustment = Math.max(0, payableAfterCredit - totalPaid);
  const fullyPaid = amountDueAfterAdjustment <= 0 && grandTotal > 0;


  // useEffect(() => {
  //   if ((purchaseMode === 'CREDIT' || purchaseMode === 'MIXED') && date && localCreditPeriod > 0) {
  //     const d = new Date(date);
  //     d.setDate(d.getDate() + localCreditPeriod);
  //     onDueDateChange(d.toISOString().split('T')[0]);
  //   } else {
  //     onDueDateChange('');
  //   }
  // }, [date, localCreditPeriod, purchaseMode]); // eslint-disable-line react-hooks/exhaustive-deps

  //   useEffect(() => {
  //   if (purchaseMode === 'CASH' && paymentRows.length === 1) {
  //     setPaymentRows((prev) =>
  //       prev.map((r, i) => i === 0 ? { ...r, amount: grandTotal } : r)
  //     );
  //   }
  // }, [grandTotal, purchaseMode]);

  useEffect(() => {
    if (purchaseMode !== 'CASH') return;
    if (payableAfterCredit <= 0) return;

    setPayment((prev) => {
      if ((prev.cash || 0) > 0 || (prev.upi || 0) > 0 || (prev.card || 0) > 0 || (prev.cheque || 0) > 0) {
        return prev;
      }
      return { ...prev, cash: payableAfterCredit };
    });
  }, [payableAfterCredit, purchaseMode]);

  useEffect(() => {
    if (purchaseMode === 'CREDIT') return;

    setPayment((prev) => {
      let remaining = Math.max(0, payableAfterCredit);
      let changed = false;

      const cash = Math.min(Number(prev.cash) || 0, remaining);
      if (cash !== (Number(prev.cash) || 0)) changed = true;
      remaining = Math.max(0, remaining - cash);

      const upi = Math.min(Number(prev.upi) || 0, remaining);
      if (upi !== (Number(prev.upi) || 0)) changed = true;
      remaining = Math.max(0, remaining - upi);

      const card = Math.min(Number(prev.card) || 0, remaining);
      if (card !== (Number(prev.card) || 0)) changed = true;
      remaining = Math.max(0, remaining - card);

      const cheque = Math.min(Number(prev.cheque) || 0, remaining);
      if (cheque !== (Number(prev.cheque) || 0)) changed = true;

      if (!changed) return prev;
      return { ...prev, cash, upi, card, cheque };
    });
  }, [payableAfterCredit, purchaseMode]);



  const handleCreditPeriodChange = (v: number) => {
    setLocalCreditPeriod(v);
    onCreditPeriodChange(v);
  };


  const updatePaymentValue = useCallback((key: 'cash' | 'upi' | 'card' | 'cheque', rawValue: string) => {
    const entered = Math.max(0, parseFloat(rawValue) || 0);
    setPayment((prev) => {
      const otherPaid = (Number(prev.cash) || 0) + (Number(prev.upi) || 0) + (Number(prev.card) || 0) + (Number(prev.cheque) || 0) - (Number(prev[key]) || 0);
      const maxAllowed = Math.max(0, payableAfterCredit - otherPaid);
      return { ...prev, [key]: Math.min(entered, maxAllowed) } as PaymentRow;
    });
  }, [payableAfterCredit]);

  // Bubble totalPaid up to page.tsx so the API payload gets the right paidAmount
  useEffect(() => {
    onPaymentChange?.(totalPaid);
  }, [totalPaid]); // eslint-disable-line react-hooks/exhaustive-deps

  const fl = 'w-full h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200';
  const lb = 'block text-xs text-slate-500 mb-0.5';

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 h-full">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Invoice Info</h3>

      {/* Pill badges */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-semibold border border-slate-200">
          {invoiceNo}
        </span>
        <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
          {date ? new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
        </span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${isSameState ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
          {isSameState ? 'CGST+SGST' : 'IGST'}
        </span>
      </div>

      {/* Party Bill No + Date */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className={lb}>Party Bill No</label>
          <input type="text" value={partyBillNo} onChange={(e) => onPartyBillNoChange(e.target.value)} className={fl} placeholder="Supplier bill no" />
        </div>
        <div>
          <label className={lb}>Party Bill Date</label>
          <input type="date" value={partyBillDate} onChange={(e) => onPartyBillDateChange(e.target.value)} className={fl} />
        </div>
      </div>

      {/* Invoice Date */}
      <div className="mb-3">
        <label className={lb}>Invoice Date <span className="text-red-500">*</span></label>
        <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} className={fl} />
      </div>

      {/* Purchase Mode */}
      <div className="mb-3">
        <label className={lb}>Purchase Mode</label>
        <div className="flex gap-1">
          {MODE_OPTS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPurchaseModeChange(opt.value)}
              className={`flex-1 flex items-center justify-center gap-1 h-8 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${purchaseMode === opt.value
                  ? opt.value === 'CASH'
                    ? 'bg-emerald-500 text-white'
                    : opt.value === 'CREDIT'
                      ? 'bg-amber-500 text-white'
                      : 'bg-indigo-500 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
            >
              <i className={`${opt.icon} text-xs`} />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {(purchaseMode === 'CREDIT' || purchaseMode === 'MIXED') && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Adjustment</p>
              {loadingSupplierCredit ? (
                <p className="mt-1 text-sm text-amber-900">Loading supplier credits...</p>
              ) : (
                <p className="mt-1 text-sm text-amber-900">
                  {canAdjustSupplierCredit
                    ? `Up to ${formatINR(applicableSupplierCredit)} can be adjusted from available supplier credit.`
                    : usableSupplierCredit > 0
                      ? 'Supplier credit exists, but invoice has no payable amount right now.'
                      : 'No unused supplier credit available.'}
                </p>
              )}
              {creditModeShortfall && (
                <p className="mt-1 text-xs font-semibold text-red-600">
                  Credit mode blocked: invoice amount is greater than available supplier credit.
                </p>
              )}
            </div>
            <label className={`shrink-0 inline-flex items-center gap-2 text-xs font-semibold select-none ${canAdjustSupplierCredit && !loadingSupplierCredit ? 'text-amber-800 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}>
              <input
                type="checkbox"
                checked={creditApplied}
                disabled={!canAdjustSupplierCredit || loadingSupplierCredit || creditModeShortfall}
                onChange={(e) => {
                  if (e.target.checked) {
                    onApplyCreditAdjustment?.();
                  } else if (purchaseMode !== 'CREDIT') {
                    onRemoveCreditAdjustment?.();
                  }
                }}
                className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 disabled:opacity-50"
              />
              Use Credit
            </label>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-amber-200 bg-white px-2.5 py-2">
              <p className="text-amber-700 mb-0.5">Available</p>
              <p className="text-sm font-semibold text-amber-900">{formatINR(remainingSupplierCredit)}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">{supplierCreditCount} credit note{supplierCreditCount === 1 ? '' : 's'}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-white px-2.5 py-2">
              <p className="text-amber-700 mb-0.5">Applied</p>
              <p className="text-sm font-semibold text-emerald-700">-{formatINR(appliedSupplierCredit)}</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Payable after credit: {formatINR(payableAfterCredit)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── CASH / MIXED: Payment Rows ── */}
      {(purchaseMode === 'CASH' || purchaseMode === 'MIXED') && (
        <div className="mb-3">
          <div className="space-y-2">
            {[
              { key: 'cash' as const, label: 'Cash', dot: 'bg-emerald-500' },
              { key: 'upi' as const, label: 'UPI / Online', dot: 'bg-indigo-500' },
              { key: 'card' as const, label: 'Card', dot: 'bg-amber-500' },
              { key: 'cheque' as const, label: 'Cheque', dot: 'bg-slate-400' },
            ].map((entry) => (
              <div key={entry.key} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 w-28 shrink-0">
                  <span className={`w-2 h-2 rounded-full ${entry.dot} shrink-0`} />
                  <span className="text-sm font-medium text-slate-700">{entry.label}</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={payment[entry.key] || ''}
                  onChange={(e) => updatePaymentValue(entry.key, e.target.value)}
                  placeholder="0.00"
                  className="w-full h-8 px-2 text-sm text-right bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-indigo-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            ))}

            {payment.cheque > 0 && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-700 mb-2">Cheque Details</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Bank Name</label>
                    <input
                      type="text"
                      value={payment.chequeBankName || ''}
                      onChange={(e) => setPayment((prev) => ({ ...prev, chequeBankName: e.target.value }))}
                      placeholder="Bank name"
                      className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Cheque No</label>
                    <input
                      type="text"
                      value={payment.chequeNo || ''}
                      onChange={(e) => setPayment((prev) => ({ ...prev, chequeNo: e.target.value }))}
                      placeholder="Cheque number"
                      className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Cheque Date</label>
                    <input
                      type="date"
                      value={payment.chequeDate || ''}
                      onChange={(e) => setPayment((prev) => ({ ...prev, chequeDate: e.target.value }))}
                      className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Branch</label>
                    <input
                      type="text"
                      value={payment.chequeBranch || ''}
                      onChange={(e) => setPayment((prev) => ({ ...prev, chequeBranch: e.target.value }))}
                      placeholder="Branch name"
                      className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Totals */}
          <div className="mt-2 space-y-1">
            {appliedSupplierCredit > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Credit Adjusted</span>
                <span className="font-semibold text-emerald-700">-{formatINR(appliedSupplierCredit)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Total Paid</span>
              <span className="font-semibold text-slate-700">{formatINR(totalPaid)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Balance Due</span>
              <span className={`font-bold ${fullyPaid ? 'text-emerald-600' : 'text-red-600'}`}>
                {payableAfterCredit <= 0
                  ? 'Settled by Credit ✓'
                  : amountDueAfterAdjustment <= 0
                    ? 'Fully Paid ✓'
                    : formatINR(amountDueAfterAdjustment)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── CREDIT MODE ── */}
      {purchaseMode === 'CREDIT' && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <i className="ri-time-line text-amber-600 text-sm" />
            <span className="text-xs font-semibold text-amber-700">Full amount on supplier credit</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-amber-700 block mb-0.5">Credit Period (days)</label>
              <input
                type="text"
                value={localCreditPeriod}
                onChange={(e) => handleCreditPeriodChange(parseInt(e.target.value) || 0)}
                className="w-full h-7 px-2 text-xs bg-white border border-amber-200 rounded focus:outline-none focus:border-amber-400"
                placeholder="e.g. 30"
                min={0}
              />
            </div>
            <div>
              <label className="text-[10px] text-amber-700 block mb-0.5">Due Date (auto)</label>
              <div className="h-7 px-2 flex items-center text-xs text-amber-700 bg-amber-100 border border-amber-200 rounded font-medium">
                {dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
          {payableAfterCredit > 0 && (
            <div className="mt-2 text-xs text-amber-700 font-medium">
              {formatINR(payableAfterCredit)} due on credit
            </div>
          )}
          {appliedSupplierCredit > 0 && (
            <div className="mt-1 text-[11px] text-emerald-700 font-medium">
              Supplier credit used: {formatINR(appliedSupplierCredit)}
            </div>
          )}
        </div>
      )}

      {/* ── MIXED MODE: Credit portion ── */}
      {purchaseMode === 'MIXED' && (
        <div className="mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="text-[10px] text-indigo-700 block mb-0.5">Credit Period (days)</label>
              <input
                type="text"
                value={localCreditPeriod}
                onChange={(e) => handleCreditPeriodChange(parseInt(e.target.value) || 0)}
                className="w-full h-7 px-2 text-xs bg-white border border-indigo-200 rounded focus:outline-none focus:border-indigo-400"
                min={0}
              />
            </div>
            <div>
              <label className="text-[10px] text-indigo-700 block mb-0.5">Due Date (auto)</label>
              <div className="h-7 px-2 flex items-center text-xs text-indigo-700 bg-indigo-100 border border-indigo-200 rounded font-medium">
                {dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
          <div className="text-xs text-indigo-700 font-medium">
            {payableAfterCredit > 0 && (
              <>
                Paying {formatINR(totalPaid)} now
                {amountDueAfterAdjustment > 0 && <> · {formatINR(amountDueAfterAdjustment)} on credit</>}
              </>
            )}
          </div>
          {appliedSupplierCredit > 0 && (
            <div className="mt-1 text-[11px] text-emerald-700 font-medium">
              Supplier credit used: {formatINR(appliedSupplierCredit)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
