import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import AutocompleteInput from '@/components/base/AutocompleteInput';
import ReturnItemsTable, { buildReturnRows, type ReturnRow } from '@/pages/billing/components/ReturnItemsTable';
import ReturnDetailModal from './components/ReturnDetailModal';
import { useToast } from '@/contexts/ToastContext';
import { useShortcuts } from '@/hooks/useShortcuts';
import { filterParties, type PartyResponse } from '@/api/party.api';
import type { PaymentMode } from '@/mocks/payments';
import { formatINR } from '@/utils/format';
import { salesService } from '@/services/salesService';
import { isBackendAvailable } from '@/api/client';
import type { InwardGPPrefill } from '@/pages/inventory/gate-pass/inward/page';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';
 
import { deleteData } from "../../../services/FetchNodeServices.js"
import {Eye, Pencil, Trash2} from 'lucide-react';
import { useWarehouseStore } from '@/stores/warehouseStore.js';

let retCounter = 5;

// ─── Payment Status Badge ─────────────────────────────────────────────────────
function PaymentStatusBadge({ ret }: { ret: any }) {
  if (ret.paymentHandled && ret.paymentType === 'refund') {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">Refund Recorded</span>;
  }
  if (ret.paymentHandled && ret.paymentType === 'credit') {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">Credit Kept</span>;
  }
  if (ret.paymentStatus === 'UNPAID' || ret.paymentStatus === 'PARTIAL') {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 whitespace-nowrap">Balance Adjusted</span>;
  }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">Payment Pending</span>;
}

// ─── Handle Payment Modal ─────────────────────────────────────────────────────
interface HandlePaymentModalState {
  open: boolean;
  returnId: string;
  returnNo: string;
  customerId: string;
  customerName: string;
  amount: number;
  // }

  // interface ReturnSettlementModalState {
  //   open: boolean;
  //   returnId: string;
  //   returnNo: string;
  //   customerId: string;
  //   customerName: string;
  creditLimit: number;
  currentDue: number;
  autoAppliedAmount: number;
  remainingAmount: number;
}

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
  const [adjustAgainstDue, setAdjustAgainstDue] = useState(false);
  const canAdjustAgainstDue = adjustAgainstDue && state.currentDue > 0;
  const adjustmentApplied = canAdjustAgainstDue ? Math.min(state.amount, state.currentDue) : 0;
  const adjustedCurrentDue = Math.max(state.currentDue - adjustmentApplied, 0);
  const settlementAmount = Math.max(state.amount - adjustmentApplied, 0);
  const fullySettled = settlementAmount <= 0;

  const applyDueAdjustment = () => {
    if (!adjustmentApplied) return;
    // Backend will handle customer balance updates
  };

  const applyCreditBalance = () => {
    if (!settlementAmount) return;
    // Backend will handle customer balance updates
  };

  const handleCredit = () => {
    applyDueAdjustment();
    applyCreditBalance();
    toast.success(`Credit of ${formatINR(settlementAmount)} added for ${state.customerName}`);
    onDone(state.returnId, 'credit', undefined, settlementAmount, adjustmentApplied);
    setDone(true);
  };

  const handleRefund = () => {
    if ((refundMode === 'UPI' || refundMode === 'NEFT' || refundMode === 'RTGS') && !refundRef.trim()) {
      toast.error('Reference number required for this payment mode');
      return;
    }
    applyDueAdjustment();
    toast.success(`Refund of ${formatINR(settlementAmount)} recorded for ${state.customerName}`);
    onDone(state.returnId, 'refund', undefined, settlementAmount, adjustmentApplied);
    setDone(true);
  };

  const handleSimpleSave = () => {
    applyDueAdjustment();
    toast.success(`Return settled via adjustment of ${formatINR(adjustmentApplied)}`);
    onDone(state.returnId, 'credit', undefined, 0, adjustmentApplied);
    setDone(true);
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
             {fullySettled
              ? 'Return settled successfully.'
              : choice === 'credit'
                ? 'Remaining amount stored as customer credit.'
                : 'Remaining amount refunded successfully.'}
          </p>
          <button onClick={onClose} className="w-full h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
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
            <p className="text-xs text-slate-500">{state.returnNo} · {state.customerName}</p>
          </div>
        </div>

        <div className="grid gap-3 mb-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Customer current due</span>
              <span className="font-semibold text-[#1e293b]">{formatINR(state.currentDue)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Returned product value</span>
              <span className="font-semibold text-[#1e293b]">{formatINR(state.amount)}</span>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <input
                id="adjust-return-handle-payment"
                type="checkbox"
                checked={adjustAgainstDue}
                onChange={(e) => setAdjustAgainstDue(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="adjust-return-handle-payment" className="text-sm text-slate-600 leading-snug cursor-pointer">
                Reduce current due by return value ({formatINR(adjustmentApplied)})
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-emerald-800 font-semibold">Current due after adjustment</span>
              <span className="font-bold text-emerald-700">{formatINR(adjustedCurrentDue)}</span>
            </div>
            <p className="mt-2 text-xs text-emerald-700/80">
              Adjustment consumes the current due first. Any excess return amount stays for refund or credit.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-amber-800 font-semibold">Remaining amount to settle</span>
              <span className="font-bold text-amber-700">{formatINR(settlementAmount)}</span>
            </div>
            <p className="mt-2 text-xs text-amber-800/80">
              This amount can be refunded now or saved as customer credit.
            </p>
          </div>
        </div>

        {/* <p className="text-sm text-slate-600 mb-5">
          How would you like to handle the return amount of <strong>{formatINR(state.amount)}</strong> for <strong>{state.customerName}</strong>?
        </p> */}

        {!fullySettled && (
          <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => setChoice('refund')}
            className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${choice === 'refund' ? 'border-[#4f46e5] bg-indigo-50' : 'border-[#e2e8f0] hover:border-indigo-200'}`}
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-100 mb-2">
              <i className="ri-bank-card-line text-[#4f46e5]" />
            </div>
            {/* <p className="text-sm font-semibold text-[#1e293b]">Record Refund</p>
            <p className="text-xs text-slate-500 mt-0.5">Pay back the customer now</p> */}
            <p className="text-sm font-semibold text-[#1e293b]">Refund Amount</p>
            <p className="text-xs text-slate-500 mt-0.5">Pay the remaining amount back now</p>
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
            Cancel
          </button>
          {fullySettled ? (
            <button onClick={handleSimpleSave} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer whitespace-nowrap">
              Save
            </button>
          ) : choice === 'credit' && (
            <button onClick={handleCredit} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer whitespace-nowrap">
              Store Credit
            </button>
          )}
          {!fullySettled && choice === 'refund' && (
            <button onClick={handleRefund} className="flex-1 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
              Record Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Post-save credit/refund modal ───
interface CreditModalState {
  open: boolean;
  returnNo: string;
  returnId: string;
  customerId: string;
  customerName: string;
  amount: number;
  creditLimit: number;
  currentDue: number;
  autoAppliedAmount: number;
  remainingAmount: number;
}

function CreditRefundModal({
  state,
  onClose,
  onDone,
}: {
  state: CreditModalState;
  onClose: () => void;
  onDone: (returnId: string, type: 'refund' | 'credit', refundId: string | undefined, settledAmount: number, adjustmentAmount: number) => void;
}) {
  const toast = useToast();
  const [choice, setChoice] = useState<'refund' | 'credit' | null>(null);
  const [refundMode, setRefundMode] = useState<PaymentMode>('CASH');
  const [refundRef, setRefundRef] = useState('');
  const [done, setDone] = useState(false);
  const [adjustAgainstDue, setAdjustAgainstDue] = useState(false);
  const canAdjustAgainstDue = adjustAgainstDue && state.currentDue > 0;
  const adjustmentApplied = canAdjustAgainstDue ? Math.min(state.amount, state.currentDue) : 0;
  const adjustedCurrentDue = Math.max(state.currentDue - adjustmentApplied, 0);
  const settlementAmount = Math.max(state.amount - adjustmentApplied, 0);
  const fullySettled = settlementAmount <= 0;

  const applyDueAdjustment = () => {
    if (!adjustmentApplied) return;
    // Backend will handle customer balance updates
  };

  const applyCreditBalance = () => {
    if (!settlementAmount) return;
    // Backend will handle customer balance updates
  };

  const handleCredit = () => {
    applyDueAdjustment();
    applyCreditBalance();
    toast.success(`Credit of ${formatINR(settlementAmount)} stored for ${state.customerName}`);
    onDone(state.returnId, 'credit', undefined, settlementAmount, adjustmentApplied);
    setDone(true);
  };

  const handleRefund = () => {
    if ((refundMode === 'UPI' || refundMode === 'NEFT' || refundMode === 'RTGS') && !refundRef.trim()) {
      toast.error('Reference number required for this payment mode');
      return;
    }
    applyDueAdjustment();
    toast.success(`Refund of ${formatINR(settlementAmount)} recorded for ${state.customerName}`);
    onDone(state.returnId, 'refund', undefined, settlementAmount, adjustmentApplied);
    setDone(true);
  };

  const handleSimpleSave = () => {
    applyDueAdjustment();
    toast.success(`Return settled via adjustment of ${formatINR(adjustmentApplied)}`);
    onDone(state.returnId, 'credit', undefined, 0, adjustmentApplied);
    setDone(true);
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
            {fullySettled
              ? 'Return settled successfully.'
              : choice === 'credit'
                ? 'Surplus amount stored as customer credit.'
                : 'Surplus amount refunded successfully.'}
          </p>
          <button onClick={onClose} className="w-full h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-100">
            <i className="ri-refund-2-line text-xl text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1e293b]">Settle Return Difference</h3>
            <p className="text-xs text-slate-500">Return {state.returnNo} · {state.customerName}</p>
          </div>
        </div>

        <div className="grid gap-3 mb-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Customer current due</span>
              <span className="font-semibold text-[#1e293b]">{formatINR(state.currentDue)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Returned product value</span>
              <span className="font-semibold text-[#1e293b]">{formatINR(state.amount)}</span>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <input
                id="adjust-return-credit-modal"
                type="checkbox"
                checked={adjustAgainstDue}
                onChange={(e) => setAdjustAgainstDue(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="adjust-return-credit-modal" className="text-sm text-slate-600 leading-snug cursor-pointer">
                Reduce current due by return value ({formatINR(adjustmentApplied)})
              </label>
            </div>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-emerald-800 font-semibold">Current due after adjustment</span>
              <span className="font-bold text-emerald-700">{formatINR(adjustedCurrentDue)}</span>
            </div>
            <p className="mt-2 text-xs text-emerald-700/80">
              Adjustment consumes the current due first. Any excess return amount stays for refund or credit.
            </p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-amber-800 font-semibold">Remaining amount to settle</span>
              <span className="font-bold text-amber-700">{formatINR(settlementAmount)}</span>
            </div>
            <p className="mt-2 text-xs text-amber-800/80">
              This amount can be refunded now or saved as customer credit.
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
            <p className="text-xs text-slate-500 mt-0.5">Pay the remaining amount back now</p>
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
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            Skip for now
          </button>
          {fullySettled ? (
            <button onClick={handleSimpleSave} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer whitespace-nowrap">
              Save
            </button>
          ) : choice === 'credit' && (
            <button onClick={handleCredit} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 cursor-pointer whitespace-nowrap">
              Store Credit
            </button>
          )}
          {!fullySettled && choice === 'refund' && (
            <button onClick={handleRefund} className="flex-1 h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
              Record Refund
            </button>
          )}
        </div>
      </div>
    </div>
  );
}



export default function SaleReturnsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [mode, setMode] = useState<'list' | 'new'>('list');
  const [invoiceLookup, setInvoiceLookup] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [returnRows, setReturnRows] = useState<ReturnRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [invoiceItemsMap, setInvoiceItemsMap] = useState<Record<string, { itemId: string; itemName: string; hsnCode: string; qty: number; unit: string; rate: number }[]>>({});
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [loadingInitialData, setLoadingInitialData] = useState(false);
  const {hasPermission} = useAuth();
  const canCreateReturn = hasPermission(MODULES.SALE_RETURN, 'create');
  const canCreatePayment = hasPermission(MODULES.SALES_PAYMENT, 'create');
  const canCreateGP = hasPermission(MODULES.GATE_PASS_INWARD, 'create');
  const [editingReturnDate, setEditingReturnDate] = useState<string>('');
   const { selectedWarehouseId } = useWarehouseStore();
  const enteredViaEditRef = useRef(false);
  const [creditModal, setCreditModal] = useState<CreditModalState>({
    open: false,
    returnNo: '',
    returnId: '',
    customerId: '',
    customerName: '',
    amount: 0,
    creditLimit: 0,
    currentDue: 0,
    autoAppliedAmount: 0,
    remainingAmount: 0,
  });
  const [handlePaymentModal, setHandlePaymentModal] = useState<HandlePaymentModalState>({
    open: false,
    returnId: '',
    returnNo: '',
    customerId: '',
    customerName: '',
    amount: 0,
    creditLimit: 0,
    currentDue: 0,
    autoAppliedAmount: 0,
    remainingAmount: 0,
  });

  const [deleteConfirmReturn, setDeleteConfirmReturn] = useState<any>(null);
  const [editingReturnId, setEditingReturnId] = useState<string | null>(null);
  const isEditingRef = useRef(false);
  const handleDeleteReturn = () => {
    if (!deleteConfirmReturn) return;

    setReturns((prev) => prev.filter((r) => r.id !== deleteConfirmReturn.id));
    toast.success('Return removed (frontend only — API coming soon)');
    setDeleteConfirmReturn(null);
  };

  const handleGenerateInwardGPFromReturn = async (ret: any) => {
    let returnDetail = ret;
    // If items are not loaded, fetch the return detail
    if (!ret.items || ret.items.length === 0) {
      try {
        if (!isBackendAvailable()) {
          toast.error('Cannot fetch return details');
          return;
        }
        const detail = await salesService.getReturn(ret.id);
        const mappedItems = (detail.items ?? []).map((item, index) => {
          const rawItem = item as unknown as {
            id?: string;
            itemName?: string;
            item_name?: string;
            hsnCode?: string;
            hsn_code?: string;
            returnQty?: number;
            return_qty?: number;
            qty?: number;
            unit?: string;
            unit_name?: string;
            rate?: number;
            amount?: number;
            reason?: string;
            customReason?: string;
            custom_reason?: string;
          };

          const qty = Number(rawItem.returnQty ?? rawItem.return_qty ?? rawItem.qty ?? 0);
          const rate = Number(rawItem.rate ?? 0);
          const amount = Number(rawItem.amount ?? qty * rate);

          return {
            id: rawItem.id || `${ret.id}-item-${index}`,
            itemName: String(rawItem.itemName || rawItem.item_name || '—'),
            hsnCode: String(rawItem.hsnCode || rawItem.hsn_code || ''),
            returnQty: qty,
            unit: String(rawItem.unit || rawItem.unit_name || 'Pcs'),
            rate,
            amount,
            reason: String(rawItem.customReason || rawItem.custom_reason || rawItem.reason || '—'),
          };
        });
        returnDetail = { ...ret, items: mappedItems };
      } catch {
        toast.error('Failed to load return details');
        return;
      }
    }

    const prefill: InwardGPPrefill = {
      partyName: returnDetail.partyName,
      linkedDocType: 'SALES_RETURN',
      linkedDocNumber: returnDetail.billNo,
      notes: `Generated from Sale Return ${returnDetail.billNo}`,
      items: (returnDetail.items || []).map((i) => ({
        itemName: i.itemName,
        qty: i.returnQty,
        unit: i.unit || 'Pcs',
        description: `${i.itemName} - Qty: ${i.returnQty}`,
      })),
    };
    navigate('/inventory/gate-pass/inward', { state: { prefill } });
  };

  useEffect(() => {
    if (!selectedInvoiceId) { setReturnRows([]); return; }
    if (isEditingRef.current) { isEditingRef.current = false; return; } 
    const existing = invoiceItemsMap[selectedInvoiceId] ?? [];
    if (existing.length) {
      setReturnRows(buildReturnRows(existing));
      return;
    }

    const loadInvoiceItems = async () => {
      if (!isBackendAvailable()) {
        setReturnRows([]);
        return;
      }
      try {
        const invoice = await salesService.getInvoice(selectedInvoiceId);
        const mapped = (invoice.items || []).map((item) => ({
          itemId: String((item as any).itemId || ''),
          itemName: String((item as any).itemName || ''),
          hsnCode: String((item as any).hsnCode || ''),
          qty: Number((item as any).qty || 0),
          unit: String((item as any).unit || 'Pcs'),
          rate: Number((item as any).rate || 0),
        })).filter((item) => item.itemId && item.itemName && item.qty > 0);

        setInvoiceItemsMap((prev) => ({ ...prev, [selectedInvoiceId]: mapped }));
        setReturnRows(buildReturnRows(mapped));
      } catch {
        setReturnRows([]);
      }
    };

    loadInvoiceItems();
  }, [selectedInvoiceId]);

  useEffect(() => {
    let mounted = true;

    const loadInvoicesAndReturns = async () => {
      if (mounted) setLoadingInitialData(true);
      if (!isBackendAvailable()) {
        if (mounted) setLoadingInitialData(false);
        return;
      }
      try {
        const [invoiceResp, returnResp] = await Promise.all([
          salesService.listInvoices({
            page: 1,
            limit: 200,
            warehouseId: selectedWarehouseId || undefined,
          }),
          salesService.listReturns({
            page: 1,
            limit: 200,
            warehouseId: selectedWarehouseId || undefined,
          }),
        ]);

        if (mounted && invoiceResp.items.length) {
          const mappedInvoices = invoiceResp.items.map((row) => ({
            id: row.id,
            billNo: row.invoiceNo,
            date: row.date,
            partyName: row.partyName || '—',
            warehouseName: row.warehouseName || '—',
            itemCount: row.itemCount || 0,
            grandTotal: row.grandTotal || 0,
            status: (row.status as any) || 'SAVED',
            paymentMode: (row.paymentMode as any) || 'CREDIT',
            customerId:
              (row as any).customerId || (row as any).customer_id || '',
            billingAddress: '',
            isSameState: true,
            items: [],
            subtotal: row.grandTotal || 0,
            totalDiscount: 0,
            taxableAmount: row.grandTotal || 0,
            totalCGST: 0,
            totalSGST: 0,
            totalIGST: 0,
            roundOff: 0,
            paymentStatus:
              'paymentStatus' in row
                ? ((row as any).paymentStatus as any)
                : 'UNPAID',
            paidAmount:
              'paidAmount' in row ? Number((row as any).paidAmount || 0) : 0,
            balanceDue:
              'balanceDue' in row
                ? Number((row as any).balanceDue || 0)
                : Number(row.grandTotal || 0),
          }));
          setInvoices(mappedInvoices as any);
        }

      if (mounted) {
        const mappedReturns: any[] = (returnResp.items || []).map((row) => ({
          id: row.id,
          billNo: row.invoiceNo,
          date: row.date,
          partyName: row.partyName || '—',
          warehouseName: row.warehouseName || '—',
          itemCount: row.itemCount || 0,
          grandTotal: row.grandTotal || 0,
          status: (row.status as any) || 'SAVED',
          originalInvoiceId:
            'originalInvoiceId' in row
              ? String((row as any).originalInvoiceId || '')
              : '',
          originalInvoiceNo:
            'originalInvoiceNo' in row
              ? String((row as any).originalInvoiceNo || '')
              : '',
          items: [],
          paymentHandled:
            'paymentHandled' in row
              ? Boolean((row as any).paymentHandled)
              : false,
          paymentType:
            'paymentType' in row && (row as any).paymentType
              ? (String((row as any).paymentType).toLowerCase() as any)
              : null,
          refundId:
            'refundId' in row ? ((row as any).refundId as string | null) : null,
        }));

        setReturns(mappedReturns);
      }
      } catch {
        // Keep mock fallback
      } finally {
        if (mounted) setLoadingInitialData(false);
      }
    };

    loadInvoicesAndReturns();
    return () => {
      mounted = false;
    };
  }, [selectedWarehouseId]);

  const totalAmount = returnRows.filter((r) => r.selected).reduce((s, r) => s + r.amount, 0);
  const hasErrors = returnRows.some((r) => r.qtyError);
  const isDirty = !!selectedInvoiceId;

  const fetchInvoiceOptions = async (query: string) => {
    const q = query.trim().toLowerCase();
    const savedInvoices = invoices.filter((i) => i.status === 'SAVED');
    if (!q) return savedInvoices.slice(0, 100);

    return savedInvoices
      .filter((i) => {
        const haystack = [
          i.billNo,
          i.partyName,
          i.date,
          i.warehouseName,
          formatINR(i.grandTotal),
        ].join(' ').toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 100);
  };

  const handleCancel = () => {
  const dirty = enteredViaEditRef.current ? false : isDirty;
  if (dirty) {
    setDiscardConfirm(true);
  } else {
    enteredViaEditRef.current = false;
    setEditingReturnId(null);
    setEditingReturnDate('');
    setMode('list');
  }
};

  const handleEditReturn = async (ret: any) => {
  try {
    enteredViaEditRef.current = true;
    setSaving(true);
    const detail = isBackendAvailable() ? await salesService.getReturn(ret.id) : ret;

    // ✅ Step 1: fetch invoice so soldQty is available
    const invoiceDetail = await salesService.getInvoice(detail.originalInvoiceId);
    setEditingReturnDate(
        typeof detail.date === 'string'
          ? detail.date.split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
    const invoiceItemMap = Object.fromEntries(
      (invoiceDetail.items || []).map((i: any) => [String(i.itemId), Number(i.qty)])
    );

    // ✅ Step 2: now build rows with correct soldQty
    const rows: ReturnRow[] = (detail.items || []).map((item: any) => ({
      id: item.id,
      itemId: item.itemId,
      itemName: item.itemName,
      hsnCode: item.hsnCode || '',
      soldQty: invoiceItemMap[item.itemId] ?? item.returnQty,
      returnQty: item.returnQty || 1,
      unit: item.unit || 'Pcs',
      rate: item.rate || 0,
      amount: (item.returnQty || 1) * (item.rate || 0),
      selected: true,
      reason: item.reason || 'Damaged',
      customReason: item.customReason || '',
      qtyError: false,
    }));

    // ✅ Step 3: set ref BEFORE setSelectedInvoiceId to block the useEffect
    isEditingRef.current = true;
    setReturnRows(rows);
    setSelectedInvoiceId(detail.originalInvoiceId);
    setInvoiceLookup(`${detail.originalInvoiceNo} — ${detail.partyName}`);
    setEditingReturnId(ret.id);
    setMode('new');

  } catch {
    toast.error('Failed to load return for editing');
  } finally {
    setSaving(false);
  }
};
  const getCustomerMasterParty = async (customerId: string, customerName: string) => {
    if (!isBackendAvailable()) return null;

    try {
      const res = await filterParties({ type: 'customer', isActive: true, search: customerName || undefined });
      const parties = (res.data ?? []) as PartyResponse[];
      const matched = parties.find((party) => party.id === customerId || party.name === customerName);
      if (!matched) return null;

      return {
        id: matched.id,
        name: matched.name,
        creditLimit: Number(matched.credit_limit ?? 0),
        openingBalance: Number(matched.opening_balance ?? 0),
        balance: Number((matched as unknown as { balance?: number }).balance ?? matched.opening_balance ?? 0),
      };
    } catch {
      return null;
    }
  };

  const getCustomerMasterDue = async (customerId: string, customerName: string) => {
    const party = await getCustomerMasterParty(customerId, customerName);
    return Number((party as { balance?: number; openingBalance?: number } | null)?.balance ?? (party as { openingBalance?: number } | null)?.openingBalance ?? 0);
  };

  const updateReturnPayment = async (returnId: string, type: 'refund' | 'credit', refundId?: string, amountOverride?: number, adjustmentAmount?: number) => {
    if (isBackendAvailable()) {
      try {
        const target = returns.find((r) => r.id === returnId);
        if (target) {
          await salesService.handleReturnPayment(returnId, {
            paymentType: type.toUpperCase() as 'REFUND' | 'CREDIT',
            paymentMode: type === 'refund' ? 'CASH' : undefined,
            amount: amountOverride ?? target.grandTotal,
            adjustmentAmount,
          });
        }
      } catch {
        // Keep local fallback
      }
    }

    setReturns((prev) =>
      prev.map((r) =>
        r.id === returnId
          ? { ...r, paymentHandled: true, paymentType: type, refundId: refundId ?? null }
          : r
      )
    );
  };

  const handleSave = async () => {
    if (editingReturnId) {
    try {
      setSaving(true);

      await salesService.updateReturn(editingReturnId, {
        returnDate: editingReturnDate || new Date().toISOString().split('T')[0],
        items: returnRows
        .filter((r) => r.selected)
        .map((r) => ({
          itemId: r.itemId,
          returnQty: r.returnQty,
          rate: r.rate,
          reason: r.reason,
          customReason: r.reason === 'Other' ? r.customReason : null,
        })),
      });

      toast.success('Sale return updated successfully');

      // refresh
      // ✅ Replace the refresh block in handleSave update branch:
const refreshed = await salesService.listReturns({ page: 1, limit: 200 });
const mappedReturns = refreshed.items.map((row) => ({
  id: row.id,
  billNo: row.invoiceNo,
  date: row.date,
  partyName: row.partyName || '—',
  warehouseName: row.warehouseName || '—',
  itemCount: row.itemCount || 0,
  grandTotal: row.grandTotal || 0,
  status: (row.status as any) || 'SAVED',
  originalInvoiceId: (row as any).originalInvoiceId || '',
  originalInvoiceNo: (row as any).originalInvoiceNo || '',
  items: [],
  paymentHandled: Boolean((row as any).paymentHandled),
  paymentType: (row as any).paymentType
    ? String((row as any).paymentType).toLowerCase() as any
    : null,
  refundId: (row as any).refundId ?? null,
}));
setReturns(mappedReturns);

      // reset
      setEditingReturnId(null);
      setMode('list');
      setSelectedInvoiceId('');
      setInvoiceLookup('');
      setReturnRows([]);
      setEditingReturnDate('');

      return;

    } catch (err: any) {
      toast.error(err.message || 'Failed to update return');
      return;
    } finally {
      setSaving(false);
    }
  }
    if (!selectedInvoiceId) { toast.error('Select an invoice first'); return; }
    const selected = returnRows.filter((r) => r.selected && r.returnQty > 0);
    if (selected.length === 0) { toast.error('Select at least one item to return'); return; }
    if (hasErrors) { toast.error('Fix quantity errors before saving'); return; }
    const needsReason = selected.filter((r) => r.reason === 'Other' && !r.customReason.trim());
    if (needsReason.length > 0) { toast.error('Please specify reason for "Other" items'); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const retNo = `SRTN-2024-00${retCounter++}`;
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    const newReturnId = `sr-new-${Date.now()}`;

    if (inv) {
      const invIdx = invoices.findIndex((i) => i.id === selectedInvoiceId);
      if (invIdx !== -1) {
        const currentBalance = invoices[invIdx].balanceDue ?? invoices[invIdx].grandTotal;
        const currentPaid = invoices[invIdx].paidAmount ?? 0;
        if (invoices[invIdx].paymentStatus === 'UNPAID' || invoices[invIdx].paymentStatus === 'PARTIAL') {
          const newBalance = Math.max(0, currentBalance - totalAmount);
          const newPaid = currentPaid + (currentBalance - newBalance);
          const updatedInvoices = [...invoices];
          updatedInvoices[invIdx] = {
            ...updatedInvoices[invIdx],
            balanceDue: newBalance,
            paidAmount: newPaid,
            paymentStatus: newBalance <= 0 ? 'PAID' : 'PARTIAL',
          };
          setInvoices(updatedInvoices);
        }
      }
    }

    let newReturn: any = {
      id: newReturnId, billNo: retNo, date: new Date().toISOString().split('T')[0],
      partyName: inv?.partyName ?? '', warehouseName: inv?.warehouseName ?? '',
      itemCount: selected.length, grandTotal: totalAmount, status: 'SAVED',
      originalInvoiceId: selectedInvoiceId, originalInvoiceNo: inv?.billNo ?? '',
      paymentHandled: false, paymentType: null, refundId: null,
      items: selected.map((r, idx) => ({
        id: `sri-new-${idx}`, itemName: r.itemName, hsnCode: r.hsnCode,
        returnQty: r.returnQty, unit: r.unit, rate: r.rate, amount: r.amount,
        reason: r.reason === 'Other' ? r.customReason : r.reason,
      })),
    };

    if (isBackendAvailable()) {
      try {
        const created = await salesService.createReturn({
          originalInvoiceId: selectedInvoiceId,
          date: newReturn.date,
          reason: selected[0]?.reason === 'Other' ? (selected[0]?.customReason || 'Other') : (selected[0]?.reason || 'Damaged'),
          items: selected.map((r) => ({
            itemId: r.itemId,
            qty: r.returnQty,
            rate: r.rate,
            reason: r.reason,
            customReason: r.customReason,
          })),
        });

        newReturn = {
          ...newReturn,
          id: created.id,
          billNo: created.invoiceNo,
          date: created.date,
          partyName: created.partyName || newReturn.partyName,
          warehouseName: created.warehouseName || newReturn.warehouseName,
          itemCount: created.itemCount || newReturn.itemCount,
          grandTotal: created.grandTotal || newReturn.grandTotal,
          originalInvoiceId: created.originalInvoiceId || newReturn.originalInvoiceId,
          originalInvoiceNo: created.originalInvoiceNo || newReturn.originalInvoiceNo,
          paymentHandled: created.paymentHandled ?? false,
          paymentType: created.paymentType ? String(created.paymentType).toLowerCase() as any : null,
          refundId: created.refundId ?? null,
        };
      } catch {
        // Keep local fallback
      }
    }

    setReturns((prev) => [newReturn, ...prev]);
    setSaving(false);
    toast.success(`Return ${retNo} saved — ${selected.length} items, ${formatINR(totalAmount)}`);
    setMode('list');
    setSelectedInvoiceId('');
    setInvoiceLookup('');
    setReturnRows([]);
    setSelectedReturn(null);

    const resolvedCustomerId = inv?.customerId || '';
    const customer = await getCustomerMasterParty(resolvedCustomerId, inv?.partyName ?? '');
    const customerDue = await getCustomerMasterDue(resolvedCustomerId, inv?.partyName ?? '');
    const creditLimit = Number((customer as { creditLimit?: number } | null)?.creditLimit ?? (inv as any)?.creditLimit ?? (inv as any)?.credit_limit ?? 0);
    const autoAppliedAmount = Math.min(totalAmount, customerDue);
    const remainingAmount = Math.max(totalAmount - autoAppliedAmount, 0);

    if (totalAmount > 0) {
      // Open modal after a short delay so the list/layout settles
      // (prevents the modal appearing behind other recently-updated elements)
      setTimeout(() => {
        setCreditModal({
          open: true,
          returnNo: retNo,
          // use the finalized id from `newReturn` (might be backend id)
          returnId: newReturn.id,
          customerId: resolvedCustomerId,
          customerName: inv?.partyName ?? '',
          amount: totalAmount,
          creditLimit,
          currentDue: customerDue,
          autoAppliedAmount,
          remainingAmount,
        });
      }, 50);
    }
  };



  useShortcuts('sale-return-new', { F9: handleSave, Escape: handleCancel });

  const needsHandlePayment = (ret: any) => {
    if (ret.paymentHandled) return false;
    const inv = invoices.find((i) => i.id === ret.originalInvoiceId);
    if (inv) return inv.paymentStatus === 'PAID';
    return !ret.paymentHandled;
  };

  const handleViewReturn = async (ret: any) => {
    if (!isBackendAvailable()) {
      setSelectedReturn(ret);
      return;
    }

    try {
      const detail = await salesService.getReturn(ret.id);
      const mappedItems = (detail.items ?? []).map((item, index) => {
        const rawItem = item as unknown as {
          id?: string;
          itemName?: string;
          item_name?: string;
          hsnCode?: string;
          hsn_code?: string;
          returnQty?: number;
          return_qty?: number;
          qty?: number;
          unit?: string;
          unit_name?: string;
          rate?: number;
          amount?: number;
          reason?: string;
          customReason?: string;
          custom_reason?: string;
        };

        const qty = Number(rawItem.returnQty ?? rawItem.return_qty ?? rawItem.qty ?? 0);
        const rate = Number(rawItem.rate ?? 0);
        const amount = Number(rawItem.amount ?? qty * rate);

        return {
          id: rawItem.id || `${ret.id}-item-${index}`,
          itemName: String(rawItem.itemName || rawItem.item_name || '—'),
          hsnCode: String(rawItem.hsnCode || rawItem.hsn_code || ''),
          returnQty: qty,
          unit: String(rawItem.unit || rawItem.unit_name || 'Pcs'),
          rate,
          amount,
          reason: String(rawItem.customReason || rawItem.custom_reason || rawItem.reason || '—'),
        };
      });

      setSelectedReturn({
        ...ret,
        billNo: detail.invoiceNo || ret.billNo,
        date: detail.date || ret.date,
        partyName: detail.partyName || ret.partyName,
        warehouseName: detail.warehouseName || ret.warehouseName,
        itemCount: detail.itemCount || mappedItems.length || ret.itemCount,
        grandTotal: Number(detail.grandTotal || ret.grandTotal),
        originalInvoiceId: detail.originalInvoiceId || ret.originalInvoiceId,
        originalInvoiceNo: detail.originalInvoiceNo || ret.originalInvoiceNo,
        paymentHandled: detail.paymentHandled ?? ret.paymentHandled,
        paymentType: detail.paymentType
          ? String(detail.paymentType).toLowerCase() as any
          : ret.paymentType,
        refundId: detail.refundId ?? ret.refundId,
        items: mappedItems.length ? mappedItems : ret.items,
      });
    } catch {
      toast.error('Failed to load return details');
      setSelectedReturn(ret);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {

    const respons = await deleteData(`api/v1/sale-returns/${invoiceId}`)
    if (respons.success === true) {
      setReturns((prev) => prev.filter((r) => r.id !== invoiceId));
      // setSelectedInvoice(null);
      toast.success('Invoice removed (frontend only)');
    }
  };

  if (mode === 'new') return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 pb-16 bg-[#f8fafc]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-lg font-bold text-[#1e293b]">
              {editingReturnId ? 'Edit Sale Return' : 'New Sale Return'}
            </h1>
              <p className="text-sm text-slate-500 mt-0.5">Select invoice and items to return — stock will be updated (RETURN_IN)</p>
            </div>
            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap transition-colors"
            >
              {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-save-3-line" /> {editingReturnId ? 'Update Return' : 'Save Return'} <kbd className="text-[10px] bg-white/20 px-1 rounded ml-1">F9</kbd></>}
            </button>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Original Sales Invoice <span className="text-red-500">*</span></label>
            <div className="w-full max-w-lg">
              <AutocompleteInput
                value={invoiceLookup}
                onChange={(value) => {
                  setInvoiceLookup(value);
                  if (selectedInvoiceId) {
                    setSelectedInvoiceId('');
                  }
                }}
                fetchOptions={fetchInvoiceOptions}
                onSelect={(invoice) => {
                  setSelectedInvoiceId(invoice.id);
                  setInvoiceLookup(`${invoice.billNo} — ${invoice.partyName}`);
                }}
                getOptionKey={(invoice) => invoice.id}
                getOptionLabel={(invoice) => `${invoice.billNo} — ${invoice.partyName}`}
                minChars={1}
                placeholder="Search and select invoice"
                renderOption={(invoice) => (
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1e293b] truncate">{invoice.billNo} — {invoice.partyName}</p>
                      <p className="text-xs text-slate-500 truncate">{invoice.date} · {invoice.warehouseName || '—'}</p>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 whitespace-nowrap">{formatINR(invoice.grandTotal)}</p>
                  </div>
                )}
                inputClassName="w-full h-10 px-3 pr-8 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {returnRows.length > 0 ? (
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Items to Return</h2>
              <ReturnItemsTable rows={returnRows} onChange={setReturnRows} />
            </div>
          ) : selectedInvoiceId && (
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-10 text-center text-slate-400">
              <i className="ri-box-3-line text-4xl block mb-2" />
              <p>No items found for this invoice</p>
            </div>
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
          onConfirm={() => {enteredViaEditRef.current = false; setDiscardConfirm(false);setEditingReturnId(null); setMode('list'); setSelectedInvoiceId(''); setInvoiceLookup(''); setReturnRows([]); }}
          onCancel={() => setDiscardConfirm(false)}
        />
      </div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Sale Returns</h1>
            <p className="text-sm text-slate-500">{returns.length} returns</p>
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
          {loadingInitialData ? (
            <div className="flex min-h-[260px] items-center justify-center text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <i className="ri-loader-4-line animate-spin text-[#4f46e5]" />
                Loading sale returns...
              </div>
            </div>
          ) : (
          <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Return No', 'Date', 'Customer', 'Original Invoice', 'Items', 'Amount', 'Payment Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {returns.map((r, i) => (
                <tr
                  key={r.id}
                  className={`border-b border-slate-50 hover:bg-indigo-50/20 transition-colors ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}
                >
                  <td className="px-4 py-3 font-medium text-[#4f46e5] cursor-pointer" onClick={() => void handleViewReturn(r)}>{r.billNo}</td>
                  {/* <td className="px-4 py-3 text-slate-600">{r.date}</td> */}
                  <td className="px-4 py-3 text-slate-600">
                  {new Date(r.date).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                  <td className="px-4 py-3 font-medium">{r.partyName}</td>
                  <td className="px-4 py-3 text-slate-500">{r.originalInvoiceNo}</td>
                  <td className="px-4 py-3 text-center text-slate-500">{r.itemCount}</td>
                  <td className="px-4 py-3 font-semibold">{formatINR(r.grandTotal)}</td>
                  <td className="px-4 py-3">
                    <PaymentStatusBadge ret={r} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => void handleViewReturn(r)}
                        className="h-7 px-2.5 rounded-md text-xs font-medium border border-[#e2e8f0] text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => void handleEditReturn(r)}
                        className="h-7 px-2.5 rounded-md text-xs font-medium border border-[#e2e8f0] text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                      >
                       <Pencil className="h-4 w-4" />
                      </button>
                      {/* <button
                        onClick={() => setDeleteConfirmReturn(r)}
                        className="h-7 px-2.5 rounded-md text-xs font-medium border border-[#e2e8f0] text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button> */}

                      {canCreateGP && <button
                        onClick={(e) => { e.stopPropagation(); void handleGenerateInwardGPFromReturn(r); }}
                        className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-pointer whitespace-nowrap"
                      >
                        <i className="ri-file-shield-2-line" />
                        Generate GP
                      </button>}
                      {/* {needsHandlePayment(r) && canCreatePayment &&(
                        <button
                          onClick={() => void handleViewReturn(r)}
                          className="h-7 px-2.5 rounded-md text-xs font-medium border border-[#e2e8f0] text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                        >
                          View
                        </button>
                      )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleGenerateInwardGPFromReturn(r); }}
                          className="flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-pointer whitespace-nowrap"
                        >
                          <i className="ri-file-shield-2-line" />
                          Generate GP
                        </button> */}
                        {needsHandlePayment(r) && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const inv = invoices.find((inv) => inv.id === r.originalInvoiceId);
                              const resolvedCustomerId = inv?.customerId || '';
                              const customer = await getCustomerMasterParty(resolvedCustomerId, r.partyName);
                              const currentDue = await getCustomerMasterDue(resolvedCustomerId, r.partyName);
                              const autoAppliedAmount = Math.min(r.grandTotal, currentDue);
                              const remainingAmount = Math.max(r.grandTotal - autoAppliedAmount, 0);
                              setHandlePaymentModal({
                                open: true,
                                returnId: r.id,
                                returnNo: r.billNo,
                                customerId: resolvedCustomerId,
                                customerName: r.partyName,
                                amount: r.grandTotal,
                                creditLimit: Number((customer as { creditLimit?: number } | null)?.creditLimit ?? (inv as any)?.creditLimit ?? (inv as any)?.credit_limit ?? 0),
                                currentDue,
                                autoAppliedAmount,
                                remainingAmount,
                              });
                            }}
                            className="h-7 px-2.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer whitespace-nowrap"
                          >
                            Handle Payment
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-slate-400">No returns yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>

      {selectedReturn && (
        <ReturnDetailModal onDelete={handleDeleteInvoice} returnRecord={selectedReturn} onClose={() => setSelectedReturn(null)} />
      )}

      {creditModal.open && (
        <CreditRefundModal
          state={creditModal}
          onClose={() => setCreditModal((s) => ({ ...s, open: false }))}
          onDone={(returnId, type, refundId, settledAmount, adjustmentAmount) => {
            void updateReturnPayment(returnId, type, refundId, settledAmount, adjustmentAmount);
            setCreditModal((s) => ({ ...s, open: false }));
          }}
        />
      )}

      {handlePaymentModal.open && (
        <HandlePaymentModal
          state={handlePaymentModal}

          onClose={() => setHandlePaymentModal((s) => ({ ...s, open: false }))}
          onDone={(returnId, type, refundId, settledAmount, adjustmentAmount) => {
            void updateReturnPayment(returnId, type, refundId, settledAmount, adjustmentAmount);
            setHandlePaymentModal((s) => ({ ...s, open: false }));
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleteConfirmReturn}
        title="Delete Sale Return?"
        message={`Remove "${deleteConfirmReturn?.billNo}" from the list? (Frontend only — API coming soon)`}
        variant="danger"
        confirmLabel="Yes, Delete"
        onConfirm={handleDeleteReturn}
        onCancel={() => setDeleteConfirmReturn(null)}
      />
    </AppLayout>
  );
}