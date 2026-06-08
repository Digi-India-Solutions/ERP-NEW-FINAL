import type { POSupplier } from '../page';

interface Props {
  supplier: POSupplier | null;
  billingAddress: string;
  onBillingAddressChange: (v: string) => void;
  termsConditions: string;
  onTermsChange: (v: string) => void;
}

export default function POSupplierPanel({
  supplier,
  billingAddress,
  onBillingAddressChange,
  termsConditions,
  onTermsChange,
}: Props) {
  const lb = 'block text-xs text-slate-500 mb-0.5';
  const inp = 'w-full px-2 py-1.5 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] resize-none';

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Supplier Details</h3>

      {supplier ? (
        <div className="space-y-3">
          {/* Supplier card */}
          <div className="bg-slate-50 border border-[#e2e8f0] rounded-xl p-3">
            <p className="font-semibold text-sm text-[#1e293b]">{supplier.name}</p>
            <div className="mt-1.5 space-y-0.5 text-xs text-slate-500">
              {supplier.city && (
                <div className="flex items-center gap-1.5">
                  <i className="ri-map-pin-line text-slate-400" />
                  <span>{supplier.city}</span>
                </div>
              )}
              {supplier.phone && (
                <div className="flex items-center gap-1.5">
                  <i className="ri-phone-line text-slate-400" />
                  <span>{supplier.phone}</span>
                </div>
              )}
              {supplier.gstin && (
                <div className="flex items-center gap-1.5">
                  <i className="ri-government-line text-slate-400" />
                  <span className="font-mono">{supplier.gstin}</span>
                </div>
              )}
            </div>
          </div>

          {/* Billing address */}
          <div>
            <label className={lb}>Billing Address</label>
            <textarea
              value={billingAddress}
              onChange={(e) => onBillingAddressChange(e.target.value)}
              rows={3}
              className={inp}
              placeholder="Billing address..."
            />
          </div>

          {/* Terms & Conditions */}
          <div>
            <label className={lb}>Terms &amp; Conditions</label>
            <textarea
              value={termsConditions}
              onChange={(e) => onTermsChange(e.target.value)}
              rows={3}
              className={inp}
              placeholder="Payment terms, delivery conditions..."
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-slate-300">
          <i className="ri-store-2-line text-3xl mb-2" />
          <p className="text-xs">Select a supplier to see details</p>
        </div>
      )}
    </div>
  );
}
