import { useState } from 'react';
import { type ChequeStatus } from '@/mocks/payments';
import { formatINR } from '@/utils/format';

export interface ChequePaymentInfo {
  id: string;
  number: string;          // receipt/voucher number
  date: string;
  partyName: string;       // customer or supplier
  invoiceNumber: string;
  amount: number;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeStatus: ChequeStatus;
  bounceReason?: string;
  partyType: 'CUSTOMER' | 'SUPPLIER';
}

interface Props {
  payment: ChequePaymentInfo;
  onUpdate: (id: string, newStatus: 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE', reason?: string) => void;
  onClose: () => void;
}

export default function ChequeStatusModal({ payment, onUpdate, onClose }: Props) {
  const [selected, setSelected] = useState<'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE'>('CLEARED');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if ((selected === 'BOUNCED' || selected === 'INSUFFICIENT_BALANCE') && !reason.trim()) {
      setError('Please enter a reason.');
      return;
    }
    setError('');
    onUpdate(payment.id, selected, reason.trim() || undefined);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50">
              <i className="ri-bank-card-line text-amber-600 text-base" />
            </div>
            <h2 className="text-base font-bold text-[#1e293b]">Update Cheque Status</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer transition-colors"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Read-only info */}
          <div className="bg-[#f8fafc] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">{payment.partyType === 'CUSTOMER' ? 'Receipt No' : 'Voucher No'}</span>
              <span className="font-semibold text-[#1e293b]">{payment.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">{payment.partyType === 'CUSTOMER' ? 'Customer' : 'Supplier'}</span>
              <span className="font-semibold text-[#1e293b]">{payment.partyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice No</span>
              <span className="font-semibold text-[#1e293b]">{payment.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount</span>
              <span className="font-bold text-[#1e293b]">{formatINR(payment.amount)}</span>
            </div>
            <div className="border-t border-[#e2e8f0] pt-2 mt-2 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Cheque No</span>
                <span className="font-mono text-xs font-semibold text-[#1e293b]">{payment.chequeNo ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bank</span>
                <span className="font-semibold text-[#1e293b]">{payment.bankName ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cheque Date</span>
                <span className="font-semibold text-[#1e293b]">{payment.chequeDate ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Status options */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">New Status</p>
            {([
              { value: 'CLEARED', label: 'Cleared', desc: 'Cheque has been successfully cleared', icon: 'ri-checkbox-circle-line', color: 'emerald' },
              { value: 'BOUNCED', label: 'Bounced', desc: 'Cheque was returned / bounced', icon: 'ri-close-circle-line', color: 'red' },
              { value: 'INSUFFICIENT_BALANCE', label: 'Insufficient Balance', desc: 'Insufficient funds in account', icon: 'ri-error-warning-line', color: 'red' },
            ] as const).map((opt) => (
              <label
                key={opt.value}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selected === opt.value
                    ? opt.color === 'emerald'
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-red-300 bg-red-50'
                    : 'border-[#e2e8f0] hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="chequeStatus"
                  value={opt.value}
                  checked={selected === opt.value}
                  onChange={() => { setSelected(opt.value); setError(''); setReason(''); }}
                  className="mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    <i className={`${opt.icon} text-sm ${opt.color === 'emerald' ? 'text-emerald-600' : 'text-red-500'}`} />
                    <span className="text-sm font-semibold text-[#1e293b]">{opt.label}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Reason input */}
          {(selected === 'BOUNCED' || selected === 'INSUFFICIENT_BALANCE') && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => { setReason(e.target.value); setError(''); }}
                placeholder={selected === 'BOUNCED' ? 'Enter bounce reason...' : 'Enter reason...'}
                className="w-full h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#e2e8f0] bg-[#f8fafc]">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer whitespace-nowrap transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="h-9 px-5 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
          >
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}
