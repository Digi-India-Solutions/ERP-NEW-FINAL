import { BarcodePrintItem } from './Types';

interface LabelQuantityTableProps {
  items: BarcodePrintItem[];
  onQtyChange: (itemId: string, qty: number) => void;
}

export function LabelQuantityTable({ items, onQtyChange }: LabelQuantityTableProps) {
  const itemsWithoutBarcode = items.filter((i) => !i.barcode);
  const totalLabels = items.reduce((s, i) => s + i.labelQty, 0);

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
        Label Quantities
      </p>

      {itemsWithoutBarcode.length > 0 && (
        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <i className="ri-alert-line text-amber-500 text-sm mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700">
            {itemsWithoutBarcode.length} item{itemsWithoutBarcode.length > 1 ? 's' : ''} without
            barcode will be skipped: {itemsWithoutBarcode.map((i) => i.itemName).join(', ')}
          </p>
        </div>
      )}

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500">
                Item Name
              </th>
              <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-500">
                Labels Qty
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.itemId} className={!item.barcode ? 'opacity-50' : ''}>
                <td className="px-4 py-2.5">
                  <div className="font-medium text-slate-700 text-sm">{item.itemName}</div>
                  {item.barcode ? (
                    <div className="text-xs text-slate-400 font-mono">{item.barcode}</div>
                  ) : (
                    <div className="text-xs text-amber-500">No barcode — will be skipped</div>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  <input
                    type="number"
                    min={1}
                    value={item.labelQty}
                    onChange={(e) => onQtyChange(item.itemId, parseInt(e.target.value) || 1)}
                    disabled={!item.barcode}
                    className="w-16 text-center border border-slate-200 rounded-md py-1 text-sm outline-none focus:border-indigo-400 disabled:opacity-40"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-right text-xs text-slate-500">
          Total labels: <span className="font-semibold text-slate-700">{totalLabels}</span>
        </div>
      </div>
    </div>
  );
}