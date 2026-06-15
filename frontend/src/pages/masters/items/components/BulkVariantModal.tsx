import { useState, useEffect, useRef } from 'react';

interface ParentItem {
  id: string;
  name: string;
  code?: string;
  saleRate: number;
  purchaseRate: number;
  mrp?: number;
  warehouseId: string;
}

interface VariantRow {
  id: string;
  variantName: string;
  sku: string;
  saleRate: number | '';
  purchaseRate: number | '';
  isActive: boolean;
  // Dynamic attribute values
  attributeValues: Record<string, string>;
}

interface BulkVariantModalProps {
  item: ParentItem;
  onClose: () => void;
  onSave: () => Promise<void>;
}

interface GenerateCombinationsModalProps {
  attributes: string[];
  onGenerate: (combinations: Array<Record<string, string>>) => void;
  onClose: () => void;
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

const ATTRIBUTE_SUGGESTIONS = [
  'Size',
  'Color',
  'Grade',
  'Capacity',
  'Flow Rate',
  'Voltage',
  'Power',
  'Length',
  'Diameter',
  'Weight',
  'Material',
  'Model',
];

function makeId() {
  return Math.random().toString(36).slice(2, 8);
}

// Generate Combinations Modal
function GenerateCombinationsModal({
  attributes,
  onGenerate,
  onClose,
}: GenerateCombinationsModalProps) {
  const [values, setValues] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    attributes.forEach((attr) => {
      initial[attr] = [''];
    });
    return initial;
  });

  const addValue = (attr: string) => {
    setValues((prev) => ({
      ...prev,
      [attr]: [...prev[attr], ''],
    }));
  };

  const updateValue = (attr: string, idx: number, val: string) => {
    setValues((prev) => ({
      ...prev,
      [attr]: prev[attr].map((v, i) => (i === idx ? val : v)),
    }));
  };

  const removeValue = (attr: string, idx: number) => {
    if (values[attr].length === 1) return;
    setValues((prev) => ({
      ...prev,
      [attr]: prev[attr].filter((_, i) => i !== idx),
    }));
  };

  const generateCombinations = () => {
    // Filter out empty values
    const cleanValues: Record<string, string[]> = {};
    attributes.forEach((attr) => {
      const filtered = values[attr].filter((v) => v.trim() !== '');
      if (filtered.length > 0) {
        cleanValues[attr] = filtered;
      }
    });

    if (Object.keys(cleanValues).length === 0) {
      return;
    }

    // Generate cartesian product
    const attrs = Object.keys(cleanValues);
    const valueArrays = attrs.map((attr) => cleanValues[attr]);

    const cartesian = (arrays: string[][]): string[][] => {
      if (arrays.length === 0) return [[]];
      const [first, ...rest] = arrays;
      const restProduct = cartesian(rest);
      const result: string[][] = [];
      for (const val of first) {
        for (const product of restProduct) {
          result.push([val, ...product]);
        }
      }
      return result;
    };

    const combinations = cartesian(valueArrays);
    const result = combinations.map((combo) => {
      const obj: Record<string, string> = {};
      attrs.forEach((attr, idx) => {
        obj[attr] = combo[idx];
      });
      return obj;
    });

    onGenerate(result);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-end">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white shadow-2xl w-full max-w-md h-screen overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-start justify-between px-5 pt-5 pb-4 border-b border-[#e2e8f0]">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">
              Generate Combinations
            </h3>
            <p className="text-xs text-[#94a3b8] mt-0.5">
              Define values for each attribute
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
          {attributes.map((attr) => (
            <div key={attr}>
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2 block">
                {attr}
              </label>
              <p className="text-[10px] text-[#94a3b8] mb-2">
                e.g. {attr.toLowerCase()}
              </p>
              <div className="space-y-2">
                {values[attr].map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => updateValue(attr, idx, e.target.value)}
                      placeholder={`Enter ${attr.toLowerCase()} value`}
                      className="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                    />
                    {values[attr].length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeValue(attr, idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-[#94a3b8] hover:text-red-500 cursor-pointer"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addValue(attr)}
                  className="flex items-center gap-1.5 text-xs text-[#4f46e5] font-medium hover:text-indigo-700 cursor-pointer"
                >
                  <i className="ri-add-line" /> Add Value
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white flex items-center justify-end gap-2 px-5 py-4 border-t border-[#e2e8f0]">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={generateCombinations}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer"
          >
            <i className="ri-magic-line" /> Generate
          </button>
        </div>
      </div>
    </div>
  );
}

// Main Bulk Variant Modal
export default function BulkVariantModal({
  item,
  onClose,
  onSave,
}: BulkVariantModalProps) {
  const parentCode = item.code ?? 'ITM';
  const [attributes, setAttributes] = useState<string[]>([]);
  const [attrInput, setAttrInput] = useState('');
  const [rows, setRows] = useState<VariantRow[]>([
    {
      id: makeId(),
      variantName: '',
      sku: `${parentCode}-01`,
      saleRate: '',
      purchaseRate: '',
      isActive: true,
      attributeValues: {},
    },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [existingCount, setExistingCount] = useState(0);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const attrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/item/${item.id}/variants`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const count = d.count ?? d.data?.length ?? 0;
        setExistingCount(count);
        setRows([
          {
            id: makeId(),
            variantName: '',
            sku: `${parentCode}-${String(count + 1).padStart(2, '0')}`,
            saleRate: '',
            purchaseRate: '',
            isActive: true,
            attributeValues: {},
          },
        ]);
      })
      .catch(() => {});
  }, [item.id, parentCode]);

  const addAttribute = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || attributes.includes(trimmed)) return;
    setAttributes((prev) => [...prev, trimmed]);
    setAttrInput('');
    // Add attribute column to all rows
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        attributeValues: { ...row.attributeValues, [trimmed]: '' },
      })),
    );
  };

  const removeAttribute = (attr: string) => {
    setAttributes((prev) => prev.filter((a) => a !== attr));
    setRows((prev) =>
      prev.map((row) => {
        const newValues = { ...row.attributeValues };
        delete newValues[attr];
        return { ...row, attributeValues: newValues };
      }),
    );
  };

  const updateAttributeValue = (rowId: string, attr: string, value: string) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              attributeValues: { ...row.attributeValues, [attr]: value },
            }
          : row,
      ),
    );
  };

  const addRow = () => {
    const nextNum = existingCount + rows.length + 1;
    const newAttributeValues: Record<string, string> = {};
    attributes.forEach((attr) => {
      newAttributeValues[attr] = '';
    });
    setRows((prev) => [
      ...prev,
      {
        id: makeId(),
        variantName: '',
        sku: `${parentCode}-${String(nextNum).padStart(2, '0')}`,
        saleRate: '',
        purchaseRate: '',
        isActive: true,
        attributeValues: newAttributeValues,
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRow = (id: string, field: keyof VariantRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    );
  };

  const handleGenerateCombinations = (
    combinations: Array<Record<string, string>>,
  ) => {
    const startNum = existingCount + rows.length;
    const newRows: VariantRow[] = combinations.map((combo, idx) => {
      const variantName = Object.values(combo).join(' / ');
      const rowNum = startNum + idx + 1;
      return {
        id: makeId(),
        variantName: variantName,
        sku: `${parentCode}-${String(rowNum).padStart(2, '0')}`,
        saleRate: '',
        purchaseRate: '',
        isActive: true,
        attributeValues: combo,
      };
    });
    setRows((prev) => [...prev, ...newRows]);
    setShowGenerateModal(false);
  };

  const validRows = rows.filter((r) => r.variantName.trim());

  const handleSave = async () => {
    if (validRows.length === 0) {
      setError('Add at least one variant name');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const results = await Promise.allSettled(
        validRows.map((row) =>
          fetch(`${BASE_URL}/item/${item.id}/variants`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({
              parentItemId: item.id,
              variantName: row.variantName.trim(),
              code: row.sku.trim(),
              variantSku: row.sku.trim(),
              saleRate:
                row.saleRate === '' ? item.saleRate : Number(row.saleRate),
              purchaseRate:
                row.purchaseRate === ''
                  ? item.purchaseRate
                  : Number(row.purchaseRate),
              isActive: row.isActive,
              warehouseId: item.warehouseId,
              variantAttributes:
                Object.keys(row.attributeValues).length > 0
                  ? row.attributeValues
                  : null,
            }),
          }).then((r) => r.json()),
        ),
      );
      const failed = results.filter(
        (r) =>
          r.status === 'rejected' ||
          (r.status === 'fulfilled' && !r.value?.success),
      );
      if (failed.length > 0)
        throw new Error(`${failed.length} variant(s) failed to save`);
      await onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-start justify-end">
        <div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative bg-white shadow-2xl w-full max-w-[95vw] h-screen overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#e2e8f0]">
            <div>
              <h3 className="text-base font-semibold text-[#1e293b]">
                Add Multiple Variants
              </h3>
              <p className="text-xs text-[#94a3b8] mt-0.5">
                {item.name} · {item.code}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer"
            >
              <i className="ri-close-line" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <i className="ri-error-warning-line" /> {error}
              </div>
            )}

            {/* Step 1 — Attributes */}
            <div>
              <p className="text-sm font-semibold text-[#1e293b] mb-1">
                Step 1 — Define variant attributes
              </p>
              <p className="text-xs text-[#94a3b8] mb-3">
                What makes each variant different? e.g. Flow Rate, Motor Type,
                Color, Size
              </p>

              {attributes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {attributes.map((attr) => (
                    <span
                      key={attr}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium"
                    >
                      {attr}
                      <button
                        type="button"
                        onClick={() => removeAttribute(attr)}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <i className="ri-close-line text-xs" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2 mb-3">
                <input
                  ref={attrInputRef}
                  type="text"
                  value={attrInput}
                  onChange={(e) => setAttrInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAttribute(attrInput);
                    }
                  }}
                  placeholder="Attribute name..."
                  className="flex-1 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
                <button
                  type="button"
                  onClick={() => addAttribute(attrInput)}
                  className="h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
                >
                  + Add Column
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-[#94a3b8] mr-1">
                  Suggestions:
                </span>
                {ATTRIBUTE_SUGGESTIONS.filter(
                  (s) => !attributes.includes(s),
                ).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addAttribute(s)}
                    className="text-xs px-2 py-0.5 rounded-full border border-[#e2e8f0] text-[#64748b] hover:border-[#4f46e5] hover:text-[#4f46e5] cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2 — Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-[#1e293b]">
                    Step 2 — Fill variant details
                  </p>
                  <p className="text-xs text-[#94a3b8]">
                    Each row = one variant. Add as many as needed.
                  </p>
                </div>
                <span className="text-xs text-[#94a3b8]">
                  {validRows.length} valid / {rows.length} rows
                </span>
              </div>

              <div className="rounded-xl border border-[#e2e8f0] overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                        Variant Name
                      </th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                        SKU
                      </th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                        Sale Rate ₹
                      </th>
                      <th className="text-left px-3 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                        Purchase Rate ₹
                      </th>
                      {attributes.map((attr) => (
                        <th
                          key={attr}
                          className="text-left px-3 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide"
                        >
                          {attr}
                        </th>
                      ))}
                      <th className="text-center px-3 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                        Active
                      </th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`border-b border-[#f1f5f9] ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.variantName}
                            onChange={(e) =>
                              updateRow(row.id, 'variantName', e.target.value)
                            }
                            placeholder="e.g. Pump X-100"
                            className="w-full h-8 px-2 rounded-md border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] min-w-[140px]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={row.sku}
                            onChange={(e) =>
                              updateRow(row.id, 'sku', e.target.value)
                            }
                            className="w-full h-8 px-2 rounded-md border border-[#e2e8f0] text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] min-w-[110px]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={row.saleRate}
                            onChange={(e) =>
                              updateRow(
                                row.id,
                                'saleRate',
                                e.target.value === ''
                                  ? ''
                                  : parseFloat(e.target.value),
                              )
                            }
                            placeholder={String(item.saleRate)}
                            className="w-full h-8 px-2 rounded-md border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] min-w-[90px]"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={row.purchaseRate}
                            onChange={(e) =>
                              updateRow(
                                row.id,
                                'purchaseRate',
                                e.target.value === ''
                                  ? ''
                                  : parseFloat(e.target.value),
                              )
                            }
                            placeholder={String(item.purchaseRate)}
                            className="w-full h-8 px-2 rounded-md border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] min-w-[90px]"
                          />
                        </td>
                        {attributes.map((attr) => (
                          <td key={attr} className="px-3 py-2">
                            <input
                              type="text"
                              value={row.attributeValues[attr] || ''}
                              onChange={(e) =>
                                updateAttributeValue(
                                  row.id,
                                  attr,
                                  e.target.value,
                                )
                              }
                              placeholder={attr}
                              className="w-full h-8 px-2 rounded-md border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] min-w-[100px]"
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              updateRow(row.id, 'isActive', !row.isActive)
                            }
                            className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${row.isActive ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${row.isActive ? 'translate-x-4' : 'translate-x-0'}`}
                            />
                          </button>
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(row.id)}
                            disabled={rows.length === 1}
                            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-[#94a3b8] hover:text-red-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={addRow}
                className="mt-2 flex items-center gap-1.5 text-xs text-[#4f46e5] font-medium hover:text-indigo-700 cursor-pointer"
              >
                <i className="ri-add-line" /> Add Row
              </button>

              <p className="mt-2 text-[10px] text-[#94a3b8]">
                ⓘ Sale & Purchase rates default to parent: ₹
                {item.saleRate.toLocaleString()} / ₹
                {item.purchaseRate.toLocaleString()}
                &nbsp;·&nbsp; SKU auto-format: {parentCode}-01, {parentCode}-02…
              </p>
            </div>

            {/* Step 3 — Quick fill */}
            <div>
              <p className="text-sm font-semibold text-[#1e293b] mb-1">
                Step 3 — Quick fill (optional)
              </p>
              <p className="text-xs text-[#94a3b8] mb-3">
                Save time by auto-generating variants
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(true)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:border-[#4f46e5] hover:text-[#4f46e5] cursor-pointer transition-colors"
                >
                  <i className="ri-magic-line text-sm" /> Generate Combinations
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (rows.length > 0) {
                      const template = rows[rows.length - 1];
                      addRow();
                    }
                  }}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:border-[#4f46e5] hover:text-[#4f46e5] cursor-pointer transition-colors"
                >
                  <i className="ri-file-copy-line text-sm" /> Copy Existing as
                  Template
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0]">
            <p className="text-[10px] text-[#94a3b8]">
              Tab/Enter to navigate · Arrow keys move between rows
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || validRows.length === 0}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" /> Saving…
                  </>
                ) : (
                  <>
                    <i className="ri-save-line" /> Save All Variants (
                    {validRows.length})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showGenerateModal && (
        <GenerateCombinationsModal
          attributes={attributes}
          onGenerate={handleGenerateCombinations}
          onClose={() => setShowGenerateModal(false)}
        />
      )}
    </>
  );
}
