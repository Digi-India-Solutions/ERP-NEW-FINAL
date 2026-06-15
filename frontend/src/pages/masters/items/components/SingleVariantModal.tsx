import { useState, useEffect } from 'react';

interface ParentItem {
  id: string;
  name: string;
  code?: string;
  hsnCode?: string;
  taxRate?: number;
  categoryName?: string;
  itemType?: string;
  unitName?: string;
  enableSerialTracking?: boolean;
  enableBatchTracking?: boolean;
  saleRate: number;
  purchaseRate: number;
  mrp?: number;
  warehouseId: string;
}

interface SingleVariantModalProps {
  item: ParentItem;
  onClose: () => void;
  onSave: () => Promise<void>;
}

const BASE_URL = 'http://localhost:7000/api/v1';
function getToken() {
  return localStorage.getItem('token') ?? '';
}
function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function SingleVariantModal({
  item,
  onClose,
  onSave,
}: SingleVariantModalProps) {
  const parentCode = item.code ?? 'ITM';
  const [variantCount, setVariantCount] = useState(1);
  const autoCode = `${parentCode}-${String(variantCount + 1).padStart(3, '0')}`;
  const autoSku = `${parentCode}-V${variantCount + 1}`;

  const [form, setForm] = useState({
    variantName: '',
    variantCode: autoCode,
    variantSku: autoSku,
    saleRate: item.saleRate,
    purchaseRate: item.purchaseRate,
    mrp: item.mrp ?? 0,
    initialStock: 0,
    isActive: true,
  });

  const [attributes, setAttributes] = useState<
    { key: string; value: string }[]
  >([{ key: '', value: '' }]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Fetch existing variant count
  useEffect(() => {
    fetch(`${BASE_URL}/item/${item.id}/variants`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const count = d.count ?? d.data?.length ?? 0;
        setVariantCount(count);
        const newCode = `${parentCode}-${String(count + 1).padStart(3, '0')}`;
        const newSku = `${parentCode}-V${count + 1}`;
        setForm((f) => ({ ...f, variantCode: newCode, variantSku: newSku }));
      })
      .catch(() => {});
  }, [item.id, parentCode]);

  const trackingLabel = item.enableSerialTracking
    ? 'Serial'
    : item.enableBatchTracking
      ? 'Batch'
      : '—';

  // Calculate margin percentage and profit
  const marginPercent = form.saleRate
    ? ((form.saleRate - form.purchaseRate) / form.saleRate) * 100
    : 0;
  const profitPerUnit = form.saleRate - form.purchaseRate;

  const handleSave = async () => {
    if (!form.variantName.trim()) {
      setError('Variant name is required');
      return;
    }
    if (!form.variantCode.trim()) {
      setError('Variant code is required');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const attrMap = attributes
        .filter((a) => a.key.trim() && a.value.trim())
        .reduce((acc, a) => ({ ...acc, [a.key.trim()]: a.value.trim() }), {});

      const payload = {
        parentItemId: item.id,
        variantName: form.variantName.trim(),
        code: form.variantCode.trim(),
        variantSku: form.variantSku.trim(),
        saleRate: form.saleRate,
        purchaseRate: form.purchaseRate,
        mrp: form.mrp,
        initialStock: form.initialStock,
        isActive: form.isActive,
        variantAttributes: Object.keys(attrMap).length > 0 ? attrMap : null,
        warehouseId: item.warehouseId,
      };

      const res = await fetch(`${BASE_URL}/item/${item.id}/variants`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.message || 'Failed to save variant');
      await onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal - full height on right side */}
      <div className="relative bg-white shadow-2xl w-full max-w-md h-screen overflow-y-auto">
        {/* Header - no top padding/gap */}
        <div className="sticky top-0 bg-white z-10 flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">
              Add Variant of {item.name}
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Create a new product variant with custom attributes
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <i className="ri-error-warning-line" /> {error}
            </div>
          )}

          {/* Inherited from parent */}
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
            <div className="flex items-center gap-2 mb-3">
              <i className="ri-lock-line text-[#94a3b8] text-sm" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#94a3b8]">
                Inherited from Parent
              </span>
            </div>
            <p className="text-sm font-semibold text-[#1e293b] mb-3">
              {item.name}{' '}
              <span className="text-[#94a3b8] font-mono text-xs">
                ({item.code})
              </span>
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                  HSN CODE
                </p>
                <p className="text-xs font-medium text-[#1e293b] mt-0.5">
                  {item.hsnCode || '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                  TAX RATE
                </p>
                <p className="text-xs font-medium text-[#1e293b] mt-0.5">
                  {item.taxRate ?? 18}%
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                  CATEGORY
                </p>
                <p className="text-xs font-medium text-[#1e293b] mt-0.5">
                  {item.categoryName || '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                  ITEM TYPE
                </p>
                <p className="text-xs font-medium text-[#1e293b] mt-0.5">
                  {(item.itemType || '—').toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                  UNIT
                </p>
                <p className="text-xs font-medium text-[#1e293b] mt-0.5">
                  {item.unitName || '—'}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-widest text-[#94a3b8]">
                  TRACKING
                </p>
                <p className="text-xs font-medium text-[#1e293b] mt-0.5">
                  {trackingLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Variant Identity */}
          <div>
            <p className="text-sm font-semibold text-[#1e293b] mb-3">
              Variant Identity
            </p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Variant Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.variantName}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, variantName: e.target.value }))
                  }
                  placeholder="e.g. Pump X-100, 100 LPM Model"
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Variant Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.variantCode}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, variantCode: e.target.value }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
                <p className="text-[10px] text-[#94a3b8]">
                  Auto-generated from parent code. You can override.
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Variant SKU
                </label>
                <input
                  type="text"
                  value={form.variantSku}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, variantSku: e.target.value }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
                <p className="text-[10px] text-[#94a3b8]">
                  Auto-generated SKU. Falls back to code if empty.
                </p>
              </div>
            </div>
          </div>

          {/* Variant Attributes */}
          <div>
            <p className="text-sm font-semibold text-[#1e293b] mb-1">
              Variant Attributes
            </p>
            <p className="text-xs text-[#94a3b8] mb-3">
              e.g. Flow Rate: 100 LPM
            </p>
            <div className="space-y-2">
              {attributes.map((attr, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Attribute name (e.g. Flow Rate)"
                    value={attr.key}
                    onChange={(e) => {
                      const next = [...attributes];
                      next[i] = { ...next[i], key: e.target.value };
                      setAttributes(next);
                    }}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5]"
                  />
                  <span className="text-[#94a3b8] text-sm">:</span>
                  <input
                    type="text"
                    placeholder="Value (e.g. 100 LPM)"
                    value={attr.value}
                    onChange={(e) => {
                      const next = [...attributes];
                      next[i] = { ...next[i], value: e.target.value };
                      setAttributes(next);
                    }}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5]"
                  />
                  {attributes.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setAttributes(attributes.filter((_, j) => j !== i))
                      }
                      className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-[#94a3b8] hover:text-red-500 cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setAttributes([...attributes, { key: '', value: '' }])
                }
                className="flex items-center gap-1.5 text-xs text-[#4f46e5] font-medium hover:text-indigo-700 cursor-pointer"
              >
                <i className="ri-add-line" /> Add Attribute
              </button>
            </div>
          </div>

          {/* Variant Pricing */}
          <div>
            <p className="text-sm font-semibold text-[#1e293b] mb-3">
              Variant Pricing
            </p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  PURCHASE RATE (₹)
                </label>
                <input
                  type="number"
                  value={form.purchaseRate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      purchaseRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
                <p className="text-[10px] text-[#94a3b8]">
                  Parent: ₹{item.purchaseRate?.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  SALE RATE (₹)
                </label>
                <input
                  type="number"
                  value={form.saleRate}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      saleRate: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
                <p className="text-[10px] text-[#94a3b8]">
                  Parent: ₹{item.saleRate?.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                MRP (₹)
              </label>
              <input
                type="number"
                value={form.mrp}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    mrp: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              />
              <p className="text-[10px] text-[#94a3b8]">
                Parent: ₹{item.mrp?.toLocaleString()}
              </p>
            </div>

            {/* Margin & Profit Display */}
            {form.saleRate > 0 && form.purchaseRate > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <p className="text-sm font-medium text-green-700">
                  Margin: {marginPercent.toFixed(1)}% | Profit: ₹
                  {profitPerUnit.toLocaleString()} per unit
                </p>
              </div>
            )}
          </div>

          {/* BOM Status */}
          <div className="rounded-xl border border-[#e2e8f0] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#1e293b]">BOM Status</p>
                <p className="text-xs text-[#94a3b8]">
                  No BOM — will inherit parent BOM
                </p>
              </div>
              <button className="text-xs text-[#4f46e5] font-medium hover:text-indigo-700 cursor-pointer">
                Create variant-specific BOM
              </button>
            </div>
          </div>

          {/* Stock & Status */}
          <div>
            <div className="space-y-1 mb-4">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                INITIAL STOCK
              </label>
              <input
                type="number"
                value={form.initialStock}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    initialStock: parseInt(e.target.value) || 0,
                  }))
                }
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm((f) => ({ ...f, isActive: !f.isActive }))
                }
                className={`relative w-10 h-6 rounded-full transition-colors duration-200 cursor-pointer ${form.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
              >
                <span
                  className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${form.isActive ? 'translate-x-4' : 'translate-x-0'}`}
                />
              </button>
              <label className="text-sm text-[#64748b]">
                {form.isActive ? 'Active Variant' : 'Inactive Variant'}
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white flex items-center justify-end gap-2 px-5 py-4 border-t border-[#e2e8f0]">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
          >
            {isSaving ? (
              <>
                <i className="ri-loader-4-line animate-spin" /> Saving…
              </>
            ) : (
              <>
                <i className="ri-save-line" /> Save Variant
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
