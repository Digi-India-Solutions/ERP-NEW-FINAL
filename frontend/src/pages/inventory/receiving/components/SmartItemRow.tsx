import { useState, useCallback, useRef, useEffect } from 'react';
import AutocompleteInput from '@/components/base/AutocompleteInput';
import { filterItems, mapApiToItem } from '@/api/item.api';

export interface SmartItemOption {
  id: string;
  name: string;
  code: string;
  barcode: string;
  unitName: string;
  hsnCode: string;
  purchaseRate: number;
  currentStock: number;
}

export interface SmartRowData {
  id: string;
  itemId: string;
  itemName: string;
  hsnCode: string;
  barcode: string;
  qty: number;
  unit: string;
  rate: number;
  total: number;
}

export const makeSmartRow = (): SmartRowData => ({
  id: `row-${Date.now()}-${Math.random()}`,
  itemId: '',
  itemName: '',
  hsnCode: '',
  barcode: '',
  qty: 1,
  unit: '',
  rate: 0,
  total: 0,
});

interface SmartItemRowProps {
  row: SmartRowData;
  rowIdx: number;
  onUpdate: (id: string, patch: Partial<SmartRowData>) => void;
  onRemove: (id: string) => void;
  /** Called when user presses Enter on Rate field (last nav step) */
  onEnterOnRate: () => void;
  isLast: boolean;
  /** Warehouse ID — items are scoped to this warehouse when provided */
  warehouseId?: string;
  /** Optional extra column content (e.g. PO Ref badge) */
  extraColumn?: React.ReactNode;
  /** Expose the smart input ref for external focus */
  smartInputRef?: (el: HTMLInputElement | null) => void;
}

const isBarcode = (val: string) => /^\d{8,13}$/.test(val.trim());

export default function SmartItemRow({
  row,
  rowIdx,
  onUpdate,
  onRemove,
  onEnterOnRate,
  isLast,
  warehouseId,
  extraColumn,
  smartInputRef,
}: SmartItemRowProps) {
  const [inputVal, setInputVal] = useState(row.itemName || '');
  const [barcodeMsg, setBarcodeMsg] = useState<{ type: 'ok' | 'warn'; text: string } | null>(null);
  const [itemOptions, setItemOptions] = useState<SmartItemOption[]>([]);
  const [qtyDisplay, setQtyDisplay] = useState(String(row.qty));
  const qtyRef = useRef<HTMLInputElement>(null);
  const rateRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (row.itemName) setInputVal(row.itemName);
  }, [row.itemName]);

  useEffect(() => {
    let active = true;

    const loadItems = async () => {
      try {
        // Use filterItems with warehouseId when available so only items
        // belonging to the selected warehouse appear in the search dropdown.
        const response = await filterItems(
          warehouseId && warehouseId !== 'ALL'
            ? { warehouseId }
            : {},
        );
        const mapped = (response.data || []).map((item) => {
          const normalized = mapApiToItem(item);
          return {
            id: normalized.id,
            name: normalized.name,
            code: normalized.code,
            barcode: normalized.barcode,
            unitName: normalized.unitName,
            hsnCode: normalized.hsnCode,
            purchaseRate: normalized.purchaseRate,
            currentStock: normalized.stock ?? 0,
          };
        });

        if (active) {
          setItemOptions(mapped);
        }
      } catch {
        if (active) {
          setItemOptions([]);
        }
      }
    };

    void loadItems();

    return () => {
      active = false;
    };
  }, [warehouseId]);

  useEffect(() => {
    setQtyDisplay(String(row.qty));
  }, [row.qty]);

  const applyItem = useCallback(
    (item: SmartItemOption) => {
      const total = row.qty * item.purchaseRate;
      onUpdate(row.id, {
        itemId: item.id,
        itemName: item.name,
        hsnCode: item.hsnCode,
        barcode: item.barcode,
        unit: item.unitName,
        rate: item.purchaseRate,
        total,
      });
      setInputVal(item.name);
      setBarcodeMsg(null);
      setTimeout(() => qtyRef.current?.focus(), 60);
    },
    [row.id, row.qty, onUpdate]
  );

  // Called by AutocompleteInput's externalKeyDown when dropdown is closed
  const handleSmartKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return;
      const val = inputVal.trim();
      if (!val) return;
      if (isBarcode(val)) {
        e.preventDefault();
        const found = itemOptions.find((i) => i.barcode === val);
        if (found) {
          applyItem(found);
          setBarcodeMsg({ type: 'ok', text: `Found: ${found.name}` });
          setTimeout(() => setBarcodeMsg(null), 2500);
        } else {
          setBarcodeMsg({ type: 'warn', text: 'Item not found — add to masters first' });
          setTimeout(() => setBarcodeMsg(null), 3500);
          setInputVal('');
        }
      }
    },
    [inputVal, applyItem, itemOptions]
  );

  const fetchItems = useCallback(async (q: string) => {
    const lower = q.toLowerCase();
    return itemOptions.filter(
      (i) =>
        i.name.toLowerCase().includes(lower) ||
        i.code.toLowerCase().includes(lower) ||
        i.barcode.toLowerCase().includes(lower)
    );
  }, [itemOptions]);

  const handleQtyChange = (val: number) => {
    const qty = Math.max(1, val);
    onUpdate(row.id, { qty, total: qty * row.rate });
  };

  const handleRateChange = (val: number) => {
    const rate = val < 0 ? 0 : val;
    onUpdate(row.id, { rate, total: row.qty * rate });
  };

  const clearItem = () => {
    onUpdate(row.id, { itemId: '', itemName: '', hsnCode: '', barcode: '', unit: '', rate: 0, total: 0 });
    setInputVal('');
    setBarcodeMsg(null);
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/50 group">
      <td className="px-3 py-2 text-xs text-slate-400 text-center w-8">{rowIdx + 1}</td>

      {/* Smart Item Input */}
      <td className="px-2 py-1.5" style={{ minWidth: 420 }}>
        {row.itemId ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-[#1e293b] font-medium truncate flex-1">{row.itemName}</span>
            <button
              type="button"
              onClick={clearItem}
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500 cursor-pointer shrink-0"
            >
              <i className="ri-close-line text-xs" />
            </button>
          </div>
        ) : (
          <div className="w-full">
            <AutocompleteInput<SmartItemOption>
              value={inputVal}
              onChange={setInputVal}
              onSelect={applyItem}
              fetchOptions={fetchItems}
              placeholder="Scan barcode or type item name..."
              renderOption={(item) => (
                <div>
                  <div className="font-medium text-xs">{item.name}</div>
                  <div className="text-[10px] text-slate-400">{item.code} · Stock: {item.currentStock} {item.unitName}</div>
                </div>
              )}
              getOptionKey={(i) => i.id}
              getOptionLabel={(i) => i.name}
              minChars={2}
              className="w-full"
              inputClassName="w-full h-8 px-3 pr-7 text-sm"
              onKeyDown={handleSmartKeyDown}
              inputRef={smartInputRef}
            />
            {barcodeMsg && (
              <p className={`text-[10px] font-medium mt-0.5 ${barcodeMsg.type === 'ok' ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                <i className={`mr-0.5 ${barcodeMsg.type === 'ok' ? 'ri-checkbox-circle-line' : 'ri-alert-line'}`} />
                {barcodeMsg.text}
              </p>
            )}
          </div>
        )}
      </td>

      {/* Qty */}
      <td className="px-2 py-1.5 w-24">
        <input
          ref={qtyRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={qtyDisplay}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, '');
            setQtyDisplay(raw); // allow empty string while typing
            if (raw !== '') {
              const parsed = parseInt(raw, 10);
              if (parsed >= 1) handleQtyChange(parsed);
            }
          }}
          onBlur={() => {
            // On blur, if empty or 0, snap back to 1
            const parsed = parseInt(qtyDisplay, 10);
            const safe = !qtyDisplay || isNaN(parsed) || parsed < 1 ? 1 : parsed;
            setQtyDisplay(String(safe));
            handleQtyChange(safe);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
            } else if (e.key === 'Enter') {
              e.preventDefault();
              // Commit before moving focus
              const parsed = parseInt(qtyDisplay, 10);
              const safe = !qtyDisplay || isNaN(parsed) || parsed < 1 ? 1 : parsed;
              setQtyDisplay(String(safe));
              handleQtyChange(safe);
              rateRef.current?.focus();
            }
          }}
          placeholder="1"
          className="w-full h-8 px-2 text-sm text-right border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
        />
      </td>

      {/* Unit (read-only) */}
      <td className="px-2 py-1.5 w-20">
        <span className="text-sm text-slate-500">{row.unit || '—'}</span>
      </td>

      {/* Rate (editable, optional) */}
      <td className="px-2 py-1.5 w-28">
        <input
          ref={rateRef}
          type="text"
          inputMode="decimal"
          pattern="[0-9]*(\.[0-9]*)?"
          value={row.rate === 0 ? '' : row.rate}
          onChange={(e) => {
            const val = e.target.value.replace(/[^\d.]/g, '');
            if (val === '') {
              onUpdate(row.id, { rate: 0, total: 0 });
            } else {
              handleRateChange(parseFloat(val) || 0);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault();
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (isLast) onEnterOnRate();
            }
          }}
          placeholder="0.00"
          className="w-full h-8 px-2 text-sm text-right border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
        />
      </td>

      {/* Extra column (PO Ref for supplier mode) */}
      {extraColumn !== undefined && (
        <td className="px-2 py-1.5 w-36">{extraColumn}</td>
      )}

      {/* Total (read-only, blank if rate is 0 or qty is 0) */}
      <td className="px-2 py-1.5 w-28 text-right">
        <span className="text-sm font-medium text-[#1e293b]">
          {row.itemId && row.rate > 0 && row.qty > 0
            ? `₹${(row.qty * row.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : '—'}
        </span>
      </td>

      {/* Delete */}
      <td className="px-2 py-1.5 w-10">
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-red-500 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <i className="ri-delete-bin-line text-sm" />
        </button>
      </td>
    </tr>
  );
}
