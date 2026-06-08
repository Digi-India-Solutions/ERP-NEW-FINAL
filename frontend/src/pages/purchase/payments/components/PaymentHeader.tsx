import { useNavigate } from 'react-router-dom';


function PaymentHeader({ voucherNo }) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3 mb-6">
      <button
        onClick={() => {
          sessionStorage.removeItem('purchase_payment_state'); // ← clear on back
          navigate('/purchase/invoices');
        }}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-slate-500 transition-colors cursor-pointer"
      >
        <i className="ri-arrow-left-line" />
      </button>
      <div>
        <h1 className="text-xl font-bold text-[#1e293b]">Available Dues</h1>
        <p className="text-xs text-slate-400">{voucherNo}</p>
      </div>
    </div>
  );
}

export default PaymentHeader;