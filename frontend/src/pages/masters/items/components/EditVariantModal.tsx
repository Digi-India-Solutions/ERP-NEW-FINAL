import { useState } from 'react';

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

export default function EditVariantModal({
  variant,
  parentItem,
  onClose,
  onSave,
}: any) {
  const [form, setForm] = useState({
    variantName: variant.variant_name ?? '',
    code: variant.code ?? '',
    variantSku: variant.variant_sku ?? '',
    saleRate: parseFloat(variant.sale_rate) || 0,
    purchaseRate: parseFloat(variant.purchase_rate) || 0,
    mrp: parseFloat(variant.mrp) || 0,
    isActive: variant.is_active ?? true,
  });

  const [attributes, setAttributes] = useState<
    { key: string; value: string }[]
  >(
    variant.variant_attributes
      ? Object.entries(variant.variant_attributes).map(([k, v]) => ({
          key: k,
          value: v as string,
        }))
      : [{ key: '', value: '' }],
  );

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.variantName.trim()) {
      setError('Variant name is required');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const attrMap = attributes
        .filter((a) => a.key.trim() && a.value.trim())
        .reduce((acc, a) => ({ ...acc, [a.key.trim()]: a.value.trim() }), {});

      const res = await fetch(
        `${BASE_URL}/item/${variant.parent_item_id}/variants/${variant.id}`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            variantName: form.variantName.trim(),
            variantSku: form.variantSku.trim(),
            saleRate: form.saleRate,
            purchaseRate: form.purchaseRate,
            mrp: form.mrp,
            isActive: form.isActive,
            variantAttributes: Object.keys(attrMap).length > 0 ? attrMap : null,
          }),
        },
      );
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update');
      await onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white shadow-2xl w-full max-w-md h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">
              Edit Variant
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">{variant.code}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <i className="ri-error-warning-line" /> {error}
            </div>
          )}

          {/* Variant Name */}
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
              className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
            />
          </div>

          {/* Code - readonly */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
              Variant Code
            </label>
            <input
              type="text"
              value={form.code}
              readOnly
              className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm font-mono text-[#94a3b8] bg-[#f8fafc] cursor-not-allowed"
            />
            <p className="text-[10px] text-[#94a3b8]">
              Code cannot be changed after creation
            </p>
          </div>

          {/* SKU */}
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
          </div>

          {/* Pricing */}
          <div>
            <p className="text-sm font-semibold text-[#1e293b] mb-3">Pricing</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Purchase Rate ₹
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
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Sale Rate ₹
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
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]"
                />
              </div>
            </div>
            <div className="space-y-1 mt-3">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                MRP ₹
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
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]"
              />
            </div>
          </div>

          {/* Attributes */}
          <div>
            <p className="text-sm font-semibold text-[#1e293b] mb-1">
              Variant Attributes
            </p>
            <div className="space-y-2">
              {attributes.map((attr, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Attribute"
                    value={attr.key}
                    onChange={(e) => {
                      const n = [...attributes];
                      n[i] = { ...n[i], key: e.target.value };
                      setAttributes(n);
                    }}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]"
                  />
                  <span className="text-[#94a3b8]">:</span>
                  <input
                    type="text"
                    placeholder="Value"
                    value={attr.value}
                    onChange={(e) => {
                      const n = [...attributes];
                      n[i] = { ...n[i], value: e.target.value };
                      setAttributes(n);
                    }}
                    className="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]"
                  />
                  {attributes.length > 1 && (
                    <button
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
                onClick={() =>
                  setAttributes([...attributes, { key: '', value: '' }])
                }
                className="flex items-center gap-1.5 text-xs text-[#4f46e5] font-medium cursor-pointer"
              >
                <i className="ri-add-line" /> Add Attribute
              </button>
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))}
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
                <i className="ri-save-line" /> Update Variant
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
