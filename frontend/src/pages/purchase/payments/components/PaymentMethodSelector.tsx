
import { PaymentMode, ChequeStatus } from '@/mocks/payments';

interface Props {
  paymentMode: PaymentMode;
  setPaymentMode: (mode: PaymentMode) => void;

  needsRef: boolean;
  needsCheque: boolean;
  needsCard: boolean;
  needsBounceReason: boolean;

  referenceNo: string;
  setReferenceNo: (val: string) => void;

  cardLastFour: string;
  setCardLastFour: (val: string) => void;

  bankName: string;
  setBankName: (val: string) => void;

  chequeNo: string;
  setChequeNo: (val: string) => void;

  chequeDate: string;
  setChequeDate: (val: string) => void;

  chequeStatus: ChequeStatus;
  setChequeStatus: (val: ChequeStatus) => void;

  bounceReason: string;
  setBounceReason: (val: string) => void;
}

const PAYMENT_OPTIONS = [
  { value: 'CASH', label: 'Cash', icon: 'ri-money-rupee-circle-line' },
  { value: 'UPI', label: 'UPI', icon: 'ri-smartphone-line' },
  { value: 'CARD', label: 'Card', icon: 'ri-bank-card-line' },
  { value: 'CHEQUE', label: 'Cheque', icon: 'ri-file-paper-line' },
  { value: 'NEFT', label: 'NEFT', icon: 'ri-exchange-line' },
  { value: 'RTGS', label: 'RTGS', icon: 'ri-bank-line' },
];

const CHEQUE_STATUSES = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CLEARED', label: 'Cleared' },
  { value: 'BOUNCED', label: 'Bounced' },
  { value: 'INSUFFICIENT_BALANCE', label: 'Insufficient Balance' },
];

export default function PaymentMethodSelector({
  paymentMode,
  setPaymentMode,
  needsRef,
  needsCheque,
  needsCard,
  needsBounceReason,
  referenceNo,
  setReferenceNo,
  cardLastFour,
  setCardLastFour,
  bankName,
  setBankName,
  chequeNo,
  setChequeNo,
  chequeDate,
  setChequeDate,
  chequeStatus,
  setChequeStatus,
  bounceReason,
  setBounceReason,
}: Props) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
        Payment Mode
      </p>

      {/* Mode Buttons */}
      <div className="grid grid-cols-3 gap-2">
        {PAYMENT_OPTIONS.map((m) => (
          <button
            key={m.value}
            onClick={() => setPaymentMode(m.value as PaymentMode)}
            className={`flex items-center gap-2 h-10 px-3 rounded-lg border text-sm font-medium ${
              paymentMode === m.value
                ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                : 'bg-white text-slate-600 border-[#e2e8f0] hover:border-[#4f46e5]'
            }`}
          >
            <i className={m.icon} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Reference */}
      {needsRef && (
        <div className="mt-4">
          <label className="text-xs font-medium text-slate-600 block mb-1">
            Reference No *
          </label>
          <input
            value={referenceNo}
            onChange={(e) => setReferenceNo(e.target.value)}
            className="w-full h-9 px-3 text-sm border rounded-lg"
          />
        </div>
      )}

      {/* Card */}
      {needsCard && (
        <div className="mt-4">
          <label className="text-xs text-slate-600 block mb-1">
            Last 4 Digits
          </label>
          <input
            value={cardLastFour}
            onChange={(e) =>
              setCardLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
            className="w-40 h-9 px-3 border rounded-lg"
          />
        </div>
      )}

      {/* Cheque */}
      {needsCheque && (
        <div className="mt-4 space-y-3">
          <input
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="Bank Name"
            className="w-full h-9 px-3 border rounded-lg"
          />

          <input
            value={chequeNo}
            onChange={(e) => setChequeNo(e.target.value)}
            placeholder="Cheque No"
            className="w-full h-9 px-3 border rounded-lg"
          />

          <input
            type="date"
            value={chequeDate}
            onChange={(e) => setChequeDate(e.target.value)}
            className="w-full h-9 px-3 border rounded-lg"
          />

          <select
            value={chequeStatus}
            onChange={(e) =>
              setChequeStatus(e.target.value as ChequeStatus)
            }
            className="w-full h-9 px-3 border rounded-lg"
          >
            {CHEQUE_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {needsBounceReason && (
            <input
              value={bounceReason}
              onChange={(e) => setBounceReason(e.target.value)}
              placeholder="Bounce Reason"
              className="w-full h-9 px-3 border rounded-lg"
            />
          )}
        </div>
      )}
    </div>
  );
}