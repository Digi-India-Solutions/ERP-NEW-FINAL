import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { useAuthStore } from '@/stores/authStore';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';

const API_BASE = 'http://localhost:7000/api/v1';

// ── Types ──────────────────────────────────────────────────────────────────
interface DocType {
  type: string;
  label: string;
  prefix: string;
  startNo: string;
  currentValue?: string;
  nextNo: string;
}

interface BarcodeSettings {
  format: 'EAN13' | 'CODE128';
  length: number;
  prefix: string;
  startingNumber: number;
  lastUsedNumber: number;
}

// ── Map DB doc_type keys → display labels ──────────────────────────────────
const DOC_TYPE_LABELS: Record<string, string> = {
  SALES_INVOICE: 'Sales Invoice',
  PURCHASE_INVOICE: 'Purchase Invoice',
  DELIVERY_CHALLAN: 'Delivery Challan',
  SALE_RETURN: 'Sale Return',
  PURCHASE_RETURN: 'Purchase Return',
  QUOTATION: 'Quotation',
  // The backend also has: ADJ, DSE, GP_IN, GP_OUT, GRN, PAY, PI, PRTN, SRTN, TRF
  ADJ: 'Adjustment',
  DSE: 'Direct Stock Entry',
  GP_IN: 'Gate Pass In',
  GP_OUT: 'Gate Pass Out',
  GRN: 'GRN',
  PAY: 'Payment',
  PI: 'Proforma Invoice',
  TRF: 'Transfer',
};

const DEFAULT_BARCODE: BarcodeSettings = {
  format: 'CODE128',
  length: 13,
  prefix: '',
  startingNumber: 1,
  lastUsedNumber: 0,
};

export default function InvoiceSettingsTab() {
  const toast = useToast();
  const token = localStorage.getItem('token');

  // ── State ──
  const [docTypes, setDocTypes] = useState<DocType[]>([]);
  const [barcode, setBarcode] = useState<BarcodeSettings>(DEFAULT_BARCODE);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [loadingBarcode, setLoadingBarcode] = useState(true);
  const [savingDocs, setSavingDocs] = useState(false);
  const [savingBarcode, setSavingBarcode] = useState(false);
  const [resettingBarcode, setResettingBarcode] = useState(false);

  const { hasPermission } = useAuth();
  const canEditSettings = hasPermission(MODULES.SETTINGS, 'edit');

  // ── Auth header ──
  const authHeader = useCallback(
    () => ({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }),
    [token],
  );

  // ── Derived barcode preview ──
  const barcodePreview = (() => {
    const totalLen = barcode.format === 'EAN13' ? 13 : barcode.length;
    const padLen = Math.max(0, totalLen - barcode.prefix.length);
    return (
      barcode.prefix + barcode.startingNumber.toString().padStart(padLen, '0')
    );
  })();

  // ── Fetch document settings ──
  const fetchDocSettings = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`${API_BASE}/invoice-settings/get-doc-settings`, {
        headers: authHeader(),
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error(await res.text());
        toast.error('Failed to load invoice settings');
        return;
      }

      const json = await res.json();

      const docs = json.data || [];

      setDocTypes(
        docs.map((d: any) => {
          const type = d.doc_type || d.type;

          return {
            type,
            label: DOC_TYPE_LABELS[type] ?? type,

            prefix: d.prefix ?? '', // if backend doesn’t send → default
            startNo: String(d.start_no ?? 1001),

            currentValue: String(d.current_value ?? ''),

            nextNo: d.next_no,
          };
        }),
      );
    } catch (err) {
      console.error(err);
      toast.error('Network error loading invoice settings');
    } finally {
      setLoadingDocs(false);
    }
  }, [authHeader, toast]);

  // ── Fetch barcode settings ──
  const fetchBarcodeSettings = useCallback(async () => {
    setLoadingBarcode(true);
    try {
      const res = await fetch(
        `${API_BASE}/invoice-settings/get-barcode-settings`,
        { headers: authHeader() },
      );
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        setBarcode({
          format: (d.format as 'EAN13' | 'CODE128') ?? 'CODE128',
          length: Number(d.length ?? 13),
          prefix: d.prefix ?? '',
          startingNumber: Number(d.starting_number ?? 1),
          lastUsedNumber: Number(d.last_used_number ?? 0),
        });
      }
    } catch {
      /* silent — defaults remain */
    } finally {
      setLoadingBarcode(false);
    }
  }, [authHeader]);

  // ── Initial load ──
  useEffect(() => {
    fetchDocSettings();
    fetchBarcodeSettings();
  }, []);

  // ── Update a doc type field ──
  const updateDocType = (
    type: string,
    field: 'prefix' | 'startNo',
    value: string,
  ) => {
    setDocTypes((prev) =>
      prev.map((d) => {
        if (d.type !== type) return d;
        const updated = { ...d, [field]: value };
        updated.nextNo = `${updated.prefix}-${updated.startNo}`;
        return updated;
      }),
    );
  };

  // ── Save doc settings ──
  const handleSaveDocs = async () => {
    setSavingDocs(true);
    try {
      const payload = {
        docTypes: docTypes.map((d) => ({
          type: d.type,
          prefix: d.prefix,
          startNo: Number(d.startNo) || 1001,
        })),
      };
      const res = await fetch(
        `${API_BASE}/invoice-settings/update-doc-settings`,
        {
          method: 'PUT',
          headers: authHeader(),
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Failed to save document settings');
        return;
      }
      toast.success('Invoice settings saved successfully');
      await fetchDocSettings(); // refresh to get updated next_no
    } catch {
      toast.error('Network error saving invoice settings');
    } finally {
      setSavingDocs(false);
    }
  };

  // ── Save barcode settings ──
  const handleSaveBarcode = async () => {
    setSavingBarcode(true);
    try {
      const payload = {
        format: barcode.format,
        length: barcode.length,
        prefix: barcode.prefix,
        startingNumber: barcode.startingNumber,
        lastUsedNumber: barcode.lastUsedNumber,
      };
      const res = await fetch(
        `${API_BASE}/invoice-settings/update-barcode-settings`,
        {
          method: 'PUT',
          headers: authHeader(),
          body: JSON.stringify(payload),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Failed to save barcode settings');
        return;
      }
      toast.success('Barcode settings saved successfully');
    } catch {
      toast.error('Network error saving barcode settings');
    } finally {
      setSavingBarcode(false);
    }
  };

  // ── Reset barcode counter ──
  const handleResetBarcode = async () => {
    setResettingBarcode(true);
    try {
      const res = await fetch(`${API_BASE}/invoice-settings/reset-barcode`, {
        method: 'PUT',
        headers: authHeader(),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Failed to reset barcode counter');
        return;
      }
      toast.success('Barcode counter reset to 0');
      setBarcode((p) => ({ ...p, lastUsedNumber: 0 }));
    } catch {
      toast.error('Network error resetting barcode');
    } finally {
      setResettingBarcode(false);
    }
  };

  const fieldCls =
    'w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 text-[#1e293b]';
  const labelCls =
    'block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide';

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════
          INVOICE NUMBER SETTINGS
      ══════════════════════════════ */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-[#1e293b]">
            Invoice Number Settings
          </h3>
          {canEditSettings && (
            <button
              onClick={handleSaveDocs}
              disabled={savingDocs || loadingDocs}
              className="flex items-center gap-2 h-8 px-4 rounded-lg bg-[#4f46e5] text-white text-xs font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {savingDocs ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <i className="ri-save-line" />
                  Save
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-[#64748b] mb-5">
          Configure prefix and starting number for each document type.
        </p>

        {loadingDocs ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 bg-slate-100 rounded-lg" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-hidden border border-[#e2e8f0] rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    {[
                      'Document Type',
                      // 'Prefix',
                      'Starting Number',
                      'Preview (Next No)',
                      'Current Count',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {docTypes.map((doc, i) => (
                    <tr
                      key={doc.type}
                      className={`border-b border-[#f1f5f9] ${i % 2 === 1 ? 'bg-[#fafbff]' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-[#1e293b]">
                        <div className="flex items-center gap-2">
                          <i className="ri-file-text-line text-[#4f46e5] text-base" />
                          {doc.label}
                        </div>
                      </td>
                      {/* <td className="px-4 py-3">
                        <input
                          type="text"
                          value={doc.prefix}
                          onChange={(e) =>
                            updateDocType(
                              doc.type,
                              'prefix',
                              e.target.value.toUpperCase(),
                            )
                          }
                          maxLength={8}
                          className="w-24 h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] font-mono"
                        />
                      </td> */}
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={doc.startNo}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // remove non-numbers
                            updateDocType(doc.type, 'startNo', value);
                          }}
                          min={1}
                          className="w-28 h-8 px-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] font-mono"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 bg-indigo-50 text-[#4f46e5] rounded-lg font-mono text-xs font-bold">
                          {doc.nextNo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748b] text-xs font-mono">
                        {doc.currentValue ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <i className="ri-information-line text-amber-600 text-sm mt-0.5" />
              <p className="text-xs text-amber-700">
                Changing the starting number affects all future documents.
                Existing documents will not be renumbered. Changes take effect
                immediately after saving.
              </p>
            </div>
          </>
        )}
      </div>

      {/* ══════════════════════════════
          BARCODE SETTINGS
      ══════════════════════════════ */}
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <i className="ri-barcode-line text-[#4f46e5] text-base" />
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Barcode Settings
            </h3>
          </div>
          {canEditSettings && (
            <button
              onClick={handleSaveBarcode}
              disabled={savingBarcode || loadingBarcode}
              className="flex items-center gap-2 h-8 px-4 rounded-lg bg-[#4f46e5] text-white text-xs font-medium hover:bg-indigo-700 cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {savingBarcode ? (
                <>
                  <i className="ri-loader-4-line animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <i className="ri-save-line" />
                  Save
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-[#64748b] mb-5">
          Configure how barcodes are auto-generated when saving purchase
          invoices.
        </p>

        {loadingBarcode ? (
          <div className="animate-pulse grid grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-slate-100 rounded w-1/3" />
                <div className="h-10 bg-slate-200 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Default Format</label>
                <div className="flex gap-2">
                  {[
                    { val: 'EAN13' as const, label: 'EAN-13 · 13 digits' },
                    { val: 'CODE128' as const, label: 'Code128 · Flexible' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setBarcode((p) => ({
                          ...p,
                          format: val,
                          length: val === 'EAN13' ? 13 : p.length,
                        }))
                      }
                      className={`flex-1 h-9 px-3 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
                        barcode.format === val
                          ? 'bg-[#4f46e5] border-[#4f46e5] text-white'
                          : 'bg-white border-[#e2e8f0] text-[#64748b] hover:border-[#4f46e5]/40'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {barcode.format === 'CODE128' && (
                <div>
                  <label className={labelCls}>Default Length (digits)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={barcode.length}
                    min={6}
                    max={20}
                    onChange={(e) =>
                      setBarcode((p) => ({
                        ...p,
                        length: Math.min(
                          20,
                          Math.max(6, parseInt(e.target.value) || 13),
                        ),
                      }))
                    }
                    className={fieldCls}
                  />
                  <p className="text-xs text-[#94a3b8] mt-1">
                    Min 6, max 20 digits
                  </p>
                </div>
              )}

              {/* <div>
                <label className={labelCls}>
                  Prefix{' '}
                  <span className="text-[#94a3b8] font-normal normal-case">
                    (optional, max 4 chars)
                  </span>
                </label>
                <input
                  type="text"
                  value={barcode.prefix}
                  maxLength={4}
                  placeholder="e.g. BC"
                  onChange={(e) =>
                    setBarcode((p) => ({
                      ...p,
                      prefix: e.target.value.toUpperCase(),
                    }))
                  }
                  className={`${fieldCls} font-mono`}
                />
              </div> */}

              <div>
                <label className={labelCls}>Starting Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={barcode.startingNumber}
                  min={1}
                  onChange={(e) =>
                    setBarcode((p) => ({
                      ...p,
                      startingNumber: Math.max(
                        1,
                        parseInt(e.target.value) || 1,
                      ),
                    }))
                  }
                  className={`${fieldCls} font-mono`}
                />
              </div>
            </div>

            {/* Right */}
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Live Preview</label>
                <div className="h-10 px-3 flex items-center bg-indigo-50 border border-indigo-200 rounded-lg">
                  <span className="font-mono text-sm font-bold text-[#4f46e5] tracking-widest">
                    {barcodePreview}
                  </span>
                </div>
                <p className="text-xs text-[#94a3b8] mt-1">
                  Next barcode that will be generated
                </p>
              </div>

              <div>
                <label className={labelCls}>Last Generated</label>
                <div className="h-10 px-3 flex items-center justify-between bg-slate-50 border border-[#e2e8f0] rounded-lg">
                  <span className="font-mono text-sm text-[#64748b]">
                    {barcode.lastUsedNumber === 0
                      ? 'None yet'
                      : barcode.prefix +
                        barcode.lastUsedNumber
                          .toString()
                          .padStart(
                            Math.max(
                              0,
                              (barcode.format === 'EAN13'
                                ? 13
                                : barcode.length) - barcode.prefix.length,
                            ),
                            '0',
                          )}
                  </span>
                  {barcode.lastUsedNumber > 0 && (
                    <span className="text-xs text-[#94a3b8]">
                      #{barcode.lastUsedNumber}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Reset Counter</label>
                {canEditSettings && (
                  <button
                    type="button"
                    onClick={handleResetBarcode}
                    disabled={resettingBarcode}
                    className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-slate-50 cursor-pointer whitespace-nowrap disabled:opacity-60"
                  >
                    {resettingBarcode ? (
                      <>
                        <i className="ri-loader-4-line animate-spin text-sm" />
                        Resetting…
                      </>
                    ) : (
                      <>
                        <i className="ri-refresh-line text-sm" />
                        Reset to 0
                      </>
                    )}
                  </button>
                )}
                <p className="text-xs text-[#94a3b8] mt-1">
                  Next barcode will start from Starting Number
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
