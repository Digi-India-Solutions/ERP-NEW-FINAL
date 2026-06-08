import { formatINR } from '@/utils/format';

function InvoiceCard({
  state,
}) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Invoice Details</p>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-400">Invoice No</p>
          <p className="text-sm font-semibold text-[#4f46e5]">{state.invoiceNumber}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Supplier</p>
          <p className="text-sm font-semibold text-[#1e293b]">{state.supplierName}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Invoice Amount</p>
          <p className="text-sm font-semibold text-[#1e293b]">{formatINR(state.invoiceAmount)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Balance Due</p>
          <p className="text-sm font-bold text-red-600">{formatINR(state.balanceDue)}</p>
        </div>
      </div>
    </div>
  )
}

export default InvoiceCard;