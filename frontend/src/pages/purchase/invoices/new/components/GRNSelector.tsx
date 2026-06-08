import { useEffect, useState } from 'react';
import { apiGetAllGRNs, mapGRNToMockGRN } from '@/api/grn.api';

export interface GRN {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  warehouseName: string;
  items: GRNItem[];
  totalValue: number;
  piCreated?: boolean;
}
// In GRNSelector.tsx — update GRNItem to match actual API fields
export interface GRNItem {
  itemId: string;
  itemName: string;
  quantity: number;   // ← API uses `quantity`, not `qty`
  qty?: number;       // keep for backwards compat
  rate: number;
  total: number;      // ← API uses `total`
  unitName?: string;
  hsnCode?: string;
  barcode?: string;
  companyBarcode?: string;
}


interface Props {
  supplierId: string;
  selectedGRNId: string | null;
  onSelect: (grn: GRN | null) => void;
}

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}

export default function GRNSelector({ supplierId, selectedGRNId, onSelect }: Props) {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!supplierId) return;

    const fetchGRNs = async () => {
      setLoading(true);
      try {
        const res = await apiGetAllGRNs();

        // Only CONFIRMED GRNs can be linked to an invoice
         const confirmed = res.data.filter((g) => g.status === 'CONFIRMED');
//         const confirmed = res.data.filter(
//   (g) => g.status === 'CONFIRMED' || g.status === 'INVOICED'
// );
       const filtered = confirmed.filter(
            (g) => g.supplierId === supplierId && !g.piCreated
          );

          setGrns(filtered);

      } catch (err) {
        console.error('Failed to fetch GRNs', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGRNs();
  }, [supplierId]);

  if (loading) {
    return <div className="text-xs text-slate-400 mt-2">Loading GRNs...</div>;
  }

  if (grns.length === 0) return null;



  return (
    <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
      <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <i className="ri-inbox-archive-line" />
        Available GRNs from this supplier
      </p>

      <div className="space-y-1.5">
        {/* None option */}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="radio"
            name="grn-select"
            checked={selectedGRNId === null}
            onChange={() => onSelect(null)}
            className="mt-0.5 accent-indigo-600 cursor-pointer"
          />
          <div>
            <span className="text-xs font-semibold text-slate-700">
              None — Direct Purchase Invoice
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Stock will be updated on save
            </p>
          </div>
        </label>

        {grns.map((grn) => {
  const items = Array.isArray(grn.items) ? grn.items : [];

  const totalQty = items.reduce(
  (s, i) => s + (i.quantity ?? i.qty ?? 0),  // already correct in your code ✓
  0
);

  const isSelected = selectedGRNId === grn.id;



          return (
            <label
              key={grn.id}
              className={`flex items-start gap-2.5 cursor-pointer rounded-lg border px-2.5 py-2 ${
                isSelected
                  ? 'bg-white border-indigo-400'
                  : 'bg-white/60 border-indigo-100 hover:border-indigo-300'
              }`}
            >
              <input
                type="radio"
                name="grn-select"
                checked={isSelected}
                onChange={() => onSelect(grn)}
                className="mt-0.5 accent-indigo-600 cursor-pointer"
              />

              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-[#1e293b]">
                    {grn.grnNumber}
                  </span>
                  <span className="text-xs font-semibold text-indigo-700">
                    {formatINR(grn.totalValue)}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 mt-1">
                  {grn.date} · {totalQty} units · {items.length} items · {grn.warehouseName}

                </div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}


