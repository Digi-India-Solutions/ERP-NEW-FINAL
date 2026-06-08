import { useEffect, useState } from "react";
import { getData } from '../../../services/FetchNodeServices.js';
import { useNavigate } from "react-router-dom";


interface LowStockItem {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  reorderLevel: number;
  currentStock: number;
}

export default function LowStockAlert() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate()

  useEffect(() => {
    const fetchLowStock = async () => {
      try {
        setLoading(true);
        const res = await getData("api/v1/dashboard/low-stock");
        console.log("DDDDD::=>SSSSSSS", res)
        if (res?.success === true) {
          setItems(res.data);
        }
      } catch (err) {
        console.error("LowStockAlert fetch error:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchLowStock();
  }, []);

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden" style={{overflowY:'scroll' , height:'50vh'}}>
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e2e8f0]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <i className="ri-alert-line text-amber-500 text-base" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">Low Stock Alerts</h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {loading ? "Loading..." : `${items.length} items need reorder`}
            </p>
          </div>
        </div>
        <button onClick={()=>navigate("/reports/low-stock")} className="text-xs font-medium text-[#4f46e5] hover:text-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
          view all
        </button>
      </div>

      {loading ? (
        <div className="px-5 py-8 text-center text-sm text-[#64748b]">Loading...</div>
      ) : error ? (
        <div className="px-5 py-8 text-center text-sm text-red-500">Failed to load data</div>
      ) : items.length === 0 ? (
        <div className="px-5 py-8 text-center text-sm text-[#64748b]">All items are sufficiently stocked ✓</div>
      ) : (
        <ul className="divide-y divide-[#f1f5f9]">
          {items.map((item) => {
            const pct = item.reorderLevel > 0
              ? Math.round((item.currentStock / item.reorderLevel) * 100)
              : 0;
            return (
              <li key={item.id} className="px-5 py-3 hover:bg-[#f8fafc] transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs text-[#64748b] whitespace-nowrap">{item.code}</span>
                    <span className="text-sm font-medium text-[#1e293b] truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-3">
                    <span className="text-sm font-bold text-red-500">{item.currentStock}</span>
                    <span className="text-xs text-[#64748b]">/ {item.reorderLevel} {item.unit}</span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}