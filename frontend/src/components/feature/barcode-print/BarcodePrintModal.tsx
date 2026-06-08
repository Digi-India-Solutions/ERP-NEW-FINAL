import { useState, useEffect, useRef, useCallback } from 'react';
import { mockCompany } from '@/mocks/masters';

declare const JsBarcode: (el: SVGSVGElement | HTMLImageElement, value: string, options?: Record<string, unknown>) => void;

/** Generate barcode SVG string using JsBarcode on a real (detached) DOM element */
function generateBarcodeSVG(value: string, format: 'EAN13' | 'CODE128'): string {
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    JsBarcode(svg, value, {
      format: format === 'EAN13' ? 'EAN13' : 'CODE128',
      width: 2,
      height: 50,
      displayValue: true,
      background: '#ffffff',
      lineColor: '#000000',
      margin: 4,
      fontSize: 12,
    });
    return svg.outerHTML;
  } catch {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="60"><rect width="120" height="60" fill="white"/><text x="60" y="35" text-anchor="middle" font-size="10" font-family="monospace" fill="black">${value}</text></svg>`;
  }
}

export interface BarcodePrintItem {
  itemId: string;
  itemName: string;
  brand: string;
  category: string;
  barcode: string | null;
  mrp: number;
  saleRate: number;
  hsnCode?: string;
  articleNo?: string;
  labelQty: number;
}

type LabelSize = '50x25' | '75x37' | '100x50' | 'custom';
type BarcodeFormat = 'EAN13' | 'CODE128' | 'per-item';

interface LabelSettings {
  size: LabelSize;
  customW: number;
  customH: number;
  format: BarcodeFormat;
  fields: {
    companyName: boolean;
    productName: boolean;
    brand: boolean;
    category: boolean;
    mrp: boolean;
    saleRate: boolean;
    hsnCode: boolean;
    articleNo: boolean;
    barcodeImage: boolean;
    barcodeNumber: boolean;
    sizeColor: boolean;
    customText: boolean;
  };
  customText: string;
}

const SIZE_MAP: Record<LabelSize, { w: number; h: number; label: string }> = {
  '50x25': { w: 50, h: 25, label: '50×25mm Small' },
  '75x37': { w: 75, h: 37, label: '75×37mm Medium' },
  '100x50': { w: 100, h: 50, label: '100×50mm Large' },
  custom: { w: 0, h: 0, label: 'Custom' },
};

const STORAGE_KEY = 'invenpro_barcode_settings';

const defaultSettings: LabelSettings = {
  size: '75x37',
  customW: 80,
  customH: 40,
  format: 'CODE128',
  fields: {
    companyName: true,
    productName: true,
    brand: true,
    category: false,
    mrp: true,
    saleRate: true,
    hsnCode: false,
    articleNo: false,
    barcodeImage: true,
    barcodeNumber: true,
    sizeColor: false,
    customText: false,
  },
  customText: '',
};

function loadSettings(): LabelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultSettings;
}

interface LabelPreviewProps {
  settings: LabelSettings;
  item: BarcodePrintItem;
}

function LabelPreview({ settings, item }: LabelPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { w, h } = settings.size === 'custom'
    ? { w: settings.customW, h: settings.customH }
    : SIZE_MAP[settings.size];

  const barcodeVal = item.barcode || '0000000000000';

  useEffect(() => {
    if (!svgRef.current || !settings.fields.barcodeImage) return;
    try {
      const fmt = settings.format === 'per-item' ? 'CODE128' : settings.format;
      JsBarcode(svgRef.current, barcodeVal, {
        format: fmt === 'EAN13' ? 'EAN13' : 'CODE128',
        width: 1.2,
        height: 28,
        displayValue: false,
        margin: 0,
      });
    } catch {
      // invalid barcode for format
    }
  }, [settings.fields.barcodeImage, settings.format, barcodeVal]);

  const scale = 3.2;

  return (
    <div
      className="border-2 border-dashed border-slate-300 bg-white rounded overflow-hidden mx-auto"
      style={{ width: w * scale, height: h * scale, minWidth: 120, minHeight: 60 }}
    >
      <div className="flex flex-col h-full px-1.5 py-1 text-[8px] leading-tight">
        {settings.fields.companyName && (
          <div className="font-bold text-slate-800 truncate" style={{ fontSize: 7 }}>
            {mockCompany.name}
          </div>
        )}
        {settings.fields.productName && (
          <div className="font-semibold text-slate-700 truncate" style={{ fontSize: 7.5 }}>
            {item.itemName}
          </div>
        )}
        {settings.fields.brand && (
          <div className="text-slate-500 truncate" style={{ fontSize: 6.5 }}>
            {item.brand}
          </div>
        )}
        {settings.fields.category && (
          <div className="text-slate-400 truncate" style={{ fontSize: 6 }}>
            {item.category}
          </div>
        )}
        <div className="flex items-center gap-2 mt-auto">
          {settings.fields.mrp && (
            <span className="text-slate-700 font-semibold" style={{ fontSize: 7 }}>
              MRP: ₹{item.mrp}
            </span>
          )}
          {settings.fields.saleRate && (
            <span className="text-indigo-700 font-bold" style={{ fontSize: 7 }}>
              ₹{item.saleRate}
            </span>
          )}
        </div>
        {settings.fields.barcodeImage && (
          <svg ref={svgRef} className="w-full" style={{ maxHeight: 28 }} />
        )}
        {settings.fields.barcodeNumber && (
          <div className="text-center font-mono text-slate-600" style={{ fontSize: 6 }}>
            {barcodeVal}
          </div>
        )}
        {settings.fields.customText && settings.customText && (
          <div className="text-slate-500 truncate" style={{ fontSize: 6 }}>
            {settings.customText}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
  items: BarcodePrintItem[];
}

export default function BarcodePrintModal({ open, onClose, items: initialItems }: Props) {
  const [settings, setSettings] = useState<LabelSettings>(loadSettings);
  const [rememberSettings, setRememberSettings] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [localItems, setLocalItems] = useState<BarcodePrintItem[]>([]);

  useEffect(() => {
  console.log("Barcode items received:", initialItems);
}, [initialItems]);

  useEffect(() => {
    if (open) {
      setLocalItems(initialItems.map((it) => ({ ...it })));
    }
  }, [ initialItems]);

  const updateQty = (itemId: string, qty: number) => {
    setLocalItems((prev) =>
      prev.map((it) => (it.itemId === itemId ? { ...it, labelQty: Math.max(1, qty) } : it))
    );
  };

  const setField = (key: keyof LabelSettings['fields'], val: boolean) => {
    setSettings((prev) => ({ ...prev, fields: { ...prev.fields, [key]: val } }));
  };

  const { w, h } = settings.size === 'custom'
    ? { w: settings.customW, h: settings.customH }
    : SIZE_MAP[settings.size];

  const totalLabels = localItems.reduce((s, i) => s + i.labelQty, 0);
  const itemsWithBarcode = localItems.filter((i) => i.barcode);
  const itemsWithoutBarcode = localItems.filter((i) => !i.barcode);

  const previewItem: BarcodePrintItem = localItems[0] ?? {
    itemId: 'preview',
    itemName: 'Sample Product Name',
    brand: 'Brand',
    category: 'Category',
    barcode: '7612345678901',
    mrp: 1499,
    saleRate: 1200,
    labelQty: 1,
  };

  const buildLabelHTML = useCallback(
    (item: BarcodePrintItem, barcodeSVG: string): string => {
      const barcodeVal = item.barcode || '0000000000000';
      const rowParts: string[] = [];

      if (settings.fields.companyName)
        rowParts.push(`<div style="font-weight:700;font-size:7pt;overflow:hidden;white-space:nowrap;">${mockCompany.name}</div>`);
      if (settings.fields.productName)
        rowParts.push(`<div style="font-weight:600;font-size:8pt;overflow:hidden;white-space:nowrap;">${item.itemName}</div>`);
      if (settings.fields.brand)
        rowParts.push(`<div style="font-size:6.5pt;color:#555;overflow:hidden;white-space:nowrap;">${item.brand}</div>`);
      if (settings.fields.category)
        rowParts.push(`<div style="font-size:6pt;color:#888;overflow:hidden;white-space:nowrap;">${item.category}</div>`);
      if (settings.fields.hsnCode && item.hsnCode)
        rowParts.push(`<div style="font-size:6pt;color:#555;overflow:hidden;white-space:nowrap;">HSN: ${item.hsnCode}</div>`);
      if (settings.fields.articleNo && item.articleNo)
        rowParts.push(`<div style="font-size:6pt;color:#555;overflow:hidden;white-space:nowrap;">Art: ${item.articleNo}</div>`);

      const priceRow: string[] = [];
      if (settings.fields.mrp)
        priceRow.push(`<span style="font-size:7pt;font-weight:600;">MRP: &#8377;${item.mrp}</span>`);
      if (settings.fields.saleRate)
        priceRow.push(`<span style="font-size:7pt;font-weight:700;color:#4f46e5;">&#8377;${item.saleRate}</span>`);
      if (priceRow.length)
        rowParts.push(`<div style="display:flex;gap:8px;margin-top:auto;">${priceRow.join('')}</div>`);

      if (settings.fields.barcodeImage)
        rowParts.push(`<div style="text-align:center;margin:2px 0;">${barcodeSVG}</div>`);
      if (settings.fields.barcodeNumber)
        rowParts.push(`<div style="text-align:center;font-family:monospace;font-size:6pt;color:#444;">${barcodeVal}</div>`);
      if (settings.fields.customText && settings.customText)
        rowParts.push(`<div style="font-size:6pt;color:#666;overflow:hidden;white-space:nowrap;">${settings.customText}</div>`);

      return `<div class="label" style="width:${w}mm;min-height:${h}mm;box-sizing:border-box;padding:2mm;border:1px solid #000;display:inline-flex;flex-direction:column;overflow:hidden;page-break-inside:avoid;break-inside:avoid;background:white;color:black;vertical-align:top;">${rowParts.join('')}</div>`;
    },
    [settings, w, h]
  );

  const handlePrint = () => {
    if (itemsWithBarcode.length === 0) return;
    setPrinting(true);

    if (rememberSettings) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    const fmt = settings.format === 'per-item' ? 'CODE128' : settings.format;

    const labelsHTML = itemsWithBarcode
      .flatMap((item) => {
        const barcodeVal = item.barcode || '0000000000000';
        const barcodeSVG = settings.fields.barcodeImage
          ? generateBarcodeSVG(barcodeVal, fmt)
          : '';
        return Array.from({ length: item.labelQty }, () => buildLabelHTML(item, barcodeSVG));
      })
      .join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Barcode Labels</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact; color-adjust: exact; }
    html, body { background: white !important; color: black !important; font-family: Arial, sans-serif; }
    .labels-grid { display: flex; flex-wrap: wrap; gap: 2mm; padding: 5mm; background: white; }
    .label { page-break-inside: avoid; break-inside: avoid; background: white !important; color: black !important; border: 1px solid #000 !important; }
    .label svg { display: block; max-width: 100%; height: auto; }
    @media print {
      html, body { margin: 0; background: white !important; color: black !important; }
      .labels-grid { padding: 3mm; gap: 1mm; }
    }
  </style>
</head>
<body>
  <div class="labels-grid">
    ${labelsHTML}
  </div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 1500);
    };
  <\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
    setPrinting(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center bg-emerald-100 rounded-lg text-emerald-600">
              <i className="ri-barcode-line text-lg" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800 text-base">Print Barcode Labels</h2>
              <p className="text-xs text-slate-400">
                {localItems.length} item{localItems.length !== 1 ? 's' : ''} · {totalLabels} total labels
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Body — same 2-column layout as LabelDesignerModal */}
        <div className="flex flex-1 overflow-hidden">
          {/* LEFT — Settings panel */}
          <div className="w-80 shrink-0 border-r border-slate-100 overflow-y-auto p-5 space-y-5">
            {/* Label Size */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Label Size</p>
              <div className="grid grid-cols-2 gap-1.5 mb-2">
                {(['50x25', '75x37', '100x50', 'custom'] as LabelSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSettings((p) => ({ ...p, size: s }))}
                    className={`text-xs px-2 py-2 rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                      settings.size === s
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    {SIZE_MAP[s].label}
                  </button>
                ))}
              </div>
              {settings.size === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">Width (mm)</label>
                    <input
                      type="number"
                      value={settings.customW}
                      onChange={(e) =>
                        setSettings((p) => ({ ...p, customW: parseInt(e.target.value) || 80 }))
                      }
                      className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 block mb-1">Height (mm)</label>
                    <input
                      type="number"
                      value={settings.customH}
                      onChange={(e) =>
                        setSettings((p) => ({ ...p, customH: parseInt(e.target.value) || 40 }))
                      }
                      className="w-full border border-slate-200 rounded-md px-2 py-1.5 text-sm outline-none focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Barcode Format */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Barcode Format</p>
              <div className="space-y-1.5">
                {(
                  [
                    { val: 'EAN13', label: 'EAN-13 · 13 digits' },
                    { val: 'CODE128', label: 'Code128 · Alphanumeric' },
                    { val: 'per-item', label: 'User chooses per item' },
                  ] as { val: BarcodeFormat; label: string }[]
                ).map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => setSettings((p) => ({ ...p, format: val }))}
                    className={`w-full text-left text-xs px-3 py-2 rounded-md border transition-colors cursor-pointer ${
                      settings.format === val
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields to Print */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Fields to Print</p>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { key: 'companyName', label: 'Company Name' },
                    { key: 'productName', label: 'Product Name' },
                    { key: 'brand', label: 'Brand' },
                    { key: 'category', label: 'Category' },
                    { key: 'mrp', label: 'MRP' },
                    { key: 'saleRate', label: 'Sale Rate' },
                    { key: 'hsnCode', label: 'HSN Code' },
                    { key: 'articleNo', label: 'Article No' },
                    { key: 'barcodeImage', label: 'Barcode Image' },
                    { key: 'barcodeNumber', label: 'Barcode Number' },
                    { key: 'sizeColor', label: 'Size / Color' },
                    { key: 'customText', label: 'Custom Text' },
                  ] as { key: keyof LabelSettings['fields']; label: string }[]
                ).map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={settings.fields[key]}
                      onChange={(e) => setField(key, e.target.checked)}
                      className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                    />
                    <span className="text-xs text-slate-600 group-hover:text-slate-800 transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
              {settings.fields.customText && (
                <input
                  type="text"
                  placeholder="Enter custom text..."
                  value={settings.customText}
                  onChange={(e) => setSettings((p) => ({ ...p, customText: e.target.value }))}
                  className="mt-2 w-full border border-slate-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                />
              )}
            </div>

            {/* Remember Settings */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberSettings}
                onChange={(e) => setRememberSettings(e.target.checked)}
                className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
              />
              <span className="text-xs text-slate-600">Remember settings for next time</span>
            </label>
          </div>

          {/* RIGHT — Live Preview + Label Quantities */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Live Preview */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Live Preview</p>
              <div className="flex flex-col items-center gap-3">
                <LabelPreview settings={settings} item={previewItem} />
                <p className="text-xs text-slate-400">
                  Preview: {w}mm × {h}mm ·{' '}
                  {settings.format === 'EAN13'
                    ? 'EAN-13'
                    : settings.format === 'CODE128'
                    ? 'Code128'
                    : 'Per Item'}
                </p>
              </div>
            </div>

            {/* Label Quantities table */}
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Label Quantities</p>

              {itemsWithoutBarcode.length > 0 && (
                <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                  <i className="ri-alert-line text-amber-500 text-sm mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    {itemsWithoutBarcode.length} item
                    {itemsWithoutBarcode.length > 1 ? 's' : ''} without barcode will be skipped:{' '}
                    {itemsWithoutBarcode.map((i) => i.itemName).join(', ')}
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
                    {localItems.map((item) => (
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
                            onChange={(e) =>
                              updateQty(item.itemId, parseInt(e.target.value) || 1)
                            }
                            disabled={!item.barcode}
                            className="w-16 text-center border border-slate-200 rounded-md py-1 text-sm outline-none focus:border-indigo-400 disabled:opacity-40"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-right text-xs text-slate-500">
                  Total labels:{' '}
                  <span className="font-semibold text-slate-700">{totalLabels}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
          <span className="text-xs text-slate-500">
            {itemsWithBarcode.length} of {localItems.length} items will be printed · {totalLabels}{' '}
            labels total
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              disabled={printing || itemsWithBarcode.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <i className="ri-printer-line text-sm" />
              </div>
              Print Labels
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
