interface Props {
  poNumber: string;
  poDate: string;
  billingAddress: string; // ← add this
  deliveryAddress: string;
  onDeliveryAddressChange: (v: string) => void;
  paymentTerms: string;
  onPaymentTermsChange: (v: string) => void;
}

export default function POInfoPanel({
  poNumber,
  poDate,
  billingAddress, // ← add this
  deliveryAddress,
  onDeliveryAddressChange,
  paymentTerms,
  onPaymentTermsChange,
}: Props) {
  const lb = 'block text-xs text-slate-500 mb-0.5';
  const inp = 'w-full h-9 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]';
  const preparedBy = 'Admin User';

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">PO Info</h3>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-xs font-semibold text-[#4f46e5] bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
          {poNumber}
        </span>
        <span className="text-xs text-slate-500 bg-slate-50 border border-[#e2e8f0] px-2.5 py-1 rounded-full">
          {poDate}
        </span>
        <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
          PENDING
        </span>
      </div>

      <div className="space-y-3">
        {/* Delivery Address */}
        <div>
          {/* ── Label row with "Same as Billing" button ── */}
          <div className="flex items-center justify-between mb-0.5">
            <label className="text-xs text-slate-500">Delivery Address</label>
            <button
              type="button"
              disabled={!billingAddress}
              onClick={() => onDeliveryAddressChange(billingAddress)}
              className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full hover:bg-indigo-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-file-copy-line text-[10px]" />
              Same as Billing
            </button>
          </div>
          <textarea
            value={deliveryAddress}
            onChange={(e) => onDeliveryAddressChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] resize-none"
            placeholder="Delivery address..."
          />
        </div>

        {/* Payment Terms */}
        <div>
          <label className={lb}>Payment Terms</label>
          <select
            value={paymentTerms}
            onChange={(e) => onPaymentTermsChange(e.target.value)}
            className={inp}
          >
            {['Immediate', '30 Days', '60 Days', '90 Days'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Prepared By */}
        <div>
          <label className={lb}>Prepared By</label>
          <div className="h-9 px-3 flex items-center text-sm text-slate-600 bg-slate-50 border border-[#e2e8f0] rounded-lg">
            <i className="ri-user-line mr-2 text-slate-400" />
            {preparedBy}
          </div>
        </div>
      </div>
    </div>
  );
}