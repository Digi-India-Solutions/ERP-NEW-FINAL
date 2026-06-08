import { useBarcodeCartStore } from '@/stores/barcodeCartStore';

interface PrintCartProps {
  onDesignAndPrint: () => void;
  onQuickPrint: () => void;
}

export default function PrintCart({ onDesignAndPrint, onQuickPrint }: PrintCartProps) {
  const { items, removeFromCart, clearCart, updateQty } = useBarcodeCartStore();

  const totalLabels = items.reduce((sum, i) => sum + i.labelQty, 0);

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      {/* Cart header */}
      <div className="bg-indigo-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center text-white">
            <i className="ri-shopping-cart-2-line text-base" />
          </div>
          <span className="text-white font-semibold text-sm">Print List</span>
          {items.length > 0 && (
            <span className="bg-white text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-indigo-200 hover:text-white text-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Cart body */}
      {items.length === 0 ? (
        <div className="bg-white px-4 py-8 text-center text-slate-400 text-sm">
          <div className="w-10 h-10 flex items-center justify-center mx-auto mb-2 text-slate-300">
            <i className="ri-barcode-line text-3xl" />
          </div>
          <p>No items in cart. Add items from the table above.</p>
        </div>
      ) : (
        <>
          {/* Items grid */}
          <div className="bg-white p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((item) => (
              <div
                key={item.itemId}
                className="border border-slate-200 rounded-lg p-3 bg-slate-50/50"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm leading-tight truncate">{item.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{item.brand} · {item.category}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.itemId)}
                    className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
                  >
                    <i className="ri-close-line text-sm" />
                  </button>
                </div>
                <p className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded mb-3 truncate">
                  {item.barcode}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Labels qty:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.itemId, item.labelQty - 1)}
                      className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <i className="ri-subtract-line text-xs" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      value={item.labelQty}
                      onChange={(e) => updateQty(item.itemId, parseInt(e.target.value) || 1)}
                      className="w-12 text-center text-sm border border-slate-200 rounded py-0.5 outline-none focus:border-indigo-400"
                    />
                    <button
                      onClick={() => updateQty(item.itemId, item.labelQty + 1)}
                      className="w-6 h-6 flex items-center justify-center border border-slate-200 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                    >
                      <i className="ri-add-line text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <span>
                <span className="font-semibold text-slate-800">{items.length}</span> items
              </span>
              <span className="text-slate-300">|</span>
              <span>
                <span className="font-semibold text-slate-800">{totalLabels}</span> total labels
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onQuickPrint}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-emerald-400 text-emerald-700 text-sm font-medium hover:bg-emerald-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-printer-line text-sm" />
                </div>
                Quick Print
              </button>
              <button
                onClick={onDesignAndPrint}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-layout-2-line text-sm" />
                </div>
                Design &amp; Print Labels
                <i className="ri-arrow-right-line text-sm" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
