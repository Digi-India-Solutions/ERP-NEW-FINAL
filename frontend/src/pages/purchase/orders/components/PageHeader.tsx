import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';

export default function PageHeader() {
  const {hasPermission} = useAuth();
  const canCreatePO = hasPermission(MODULES.PURCHASE_ORDER, 'create');
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-[#1e293b]">Purchase Orders</h1>
        <p className="text-sm text-slate-500 mt-0.5">Track and manage all purchase orders</p>
      </div>
      {canCreatePO && <button
        type="button"
        onClick={() => navigate('/purchase/orders/new')}
        className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
      >
      <i className="ri-add-line" />
        New Purchase Order
      </button>}
    </div>
  );
}