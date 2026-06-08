

function VoucherInfo({ voucherNo, date, setDate }) {
  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Voucher Info</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Voucher Number</label>
          <input
            type="text"
            value={voucherNo}
            readOnly
            className="w-full h-9 px-3 text-sm bg-slate-50 border border-[#e2e8f0] rounded-lg text-slate-500 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Payment Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
          />
        </div>
      </div>
    </div>
  )
}

export default VoucherInfo;