import { numberToWords } from '../page'

function PaymentAmount({ paymentAmount, setPaymentAmount, state }) {
  const balanceDue = Number(state?.balanceDue ?? 0);
  const isOverBalance = Number(paymentAmount || 0) > balanceDue;

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Payment Amount</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">₹</span>
                <input
                  type="text"
                  value={paymentAmount}
                  onChange={(e) => {
                    const val = e.target.value;

                    // allow only numbers (no letters, no symbols)
                    if (/^\d*\.?\d*$/.test(val)) {
                      const nextAmount = Number(val || 0);
                      if (nextAmount <= balanceDue) {
                        setPaymentAmount(val);
                      }
                    }
                  }}
                  className={`w-full h-11 pl-7 pr-3 text-lg font-bold border rounded-lg focus:outline-none ${
                    isOverBalance
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-[#e2e8f0] focus:border-[#4f46e5]'
                  }`}
                />

              </div>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-400">Balance due: ₹{balanceDue.toLocaleString('en-IN')}</p>
                {isOverBalance && (
                  <p className="text-xs font-medium text-red-600">Cannot exceed balance due</p>
                )}
              </div>
              {paymentAmount > 0 && (
                <p className="text-xs text-slate-400 mt-1">{numberToWords(paymentAmount)}</p>
              )}
            </div>
  )
}

export default PaymentAmount;
