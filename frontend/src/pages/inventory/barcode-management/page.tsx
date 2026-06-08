import { useState, useCallback } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import { useBarcodeCartStore } from '@/stores/barcodeCartStore';
import BarcodeItemsTable from './components/BarcodeItemsTable';
import PrintCart from './components/PrintCart';
import LabelDesignerModal from './components/LabelDesignerModal';
import { mockCompany } from '@/mocks/masters';

declare const JsBarcode: (el: SVGSVGElement | HTMLImageElement, value: string, options?: Record<string, unknown>) => void;

const STORAGE_KEY = 'barcode_label_settings';

type ActiveStep = 1 | 2 | 3;

export default function BarcodeManagementPage() {
  const [activeStep, setActiveStep] = useState<ActiveStep>(1);
  const [showDesigner, setShowDesigner] = useState(false);
  const { items } = useBarcodeCartStore();

  const steps = [
    { num: 1, label: 'Browse & Add Items' },
    { num: 2, label: 'Review Cart' },
    { num: 3, label: 'Design & Print' },
  ];

  const buildQuickPrintLabel = useCallback((item: typeof items[0], w: number, h: number, format: string): string => {
    const barcodeId = `bc-${item.itemId}-${Math.random().toString(36).slice(2)}`;
    return `
      <div class="label" style="width:${w}mm;height:${h}mm;box-sizing:border-box;padding:2mm;border:0.5pt solid #ccc;display:flex;flex-direction:column;overflow:hidden;page-break-inside:avoid;break-inside:avoid;">
        <div style="font-weight:700;font-size:7pt;overflow:hidden;white-space:nowrap;">${mockCompany.name}</div>
        <div style="font-weight:600;font-size:8pt;overflow:hidden;white-space:nowrap;">${item.name}</div>
        <div style="font-size:6.5pt;color:#555;overflow:hidden;white-space:nowrap;">${item.brand}</div>
        <div style="display:flex;gap:8px;margin-top:auto;">
          <span style="font-size:7pt;font-weight:600;">MRP: ₹${item.mrp}</span>
          <span style="font-size:7pt;font-weight:700;color:#4f46e5;">₹${item.saleRate}</span>
        </div>
        <svg id="${barcodeId}" style="width:100%;max-height:28px;"></svg>
        <div style="text-align:center;font-family:monospace;font-size:6pt;color:#444;">${item.barcode}</div>
        <script>
          (function() {
            var el = document.getElementById('${barcodeId}');
            if (el && typeof JsBarcode !== 'undefined') {
              try { JsBarcode(el, '${item.barcode}', { format: '${format}', width: 1.2, height: 28, displayValue: false, margin: 0 }); } catch(e) {}
            }
          })();
        <\/script>
      </div>`;
  }, []);

  const handleQuickPrint = useCallback(() => {
    if (items.length === 0) return;

    let savedSettings = { size: '75x37', format: 'CODE128', customW: 80, customH: 40 };
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) savedSettings = { ...savedSettings, ...JSON.parse(raw) };
    } catch { /* ignore */ }

    const sizeMap: Record<string, { w: number; h: number }> = {
      '50x25': { w: 50, h: 25 },
      '75x37': { w: 75, h: 37 },
      '100x50': { w: 100, h: 50 },
      custom: { w: savedSettings.customW, h: savedSettings.customH },
    };
    const { w, h } = sizeMap[savedSettings.size] ?? { w: 75, h: 37 };
    const fmt = savedSettings.format === 'EAN13' ? 'EAN13' : 'CODE128';

    const labelsHTML = items.flatMap((item) =>
      Array.from({ length: item.labelQty }, () => buildQuickPrintLabel(item, w, h, fmt))
    ).join('');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Quick Print Labels</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #fff; }
    .labels-grid { display: flex; flex-wrap: wrap; gap: 2mm; padding: 5mm; }
    @media print { body { margin: 0; } .labels-grid { padding: 3mm; gap: 1mm; } }
  </style>
</head>
<body>
  <div class="labels-grid">${labelsHTML}</div>
  <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 1000); };<\/script>
</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); }
  }, [items, buildQuickPrintLabel]);

  const handleDesignAndPrint = () => {
    setShowDesigner(true);
    setActiveStep(3);
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-slate-50">
        {/* Page header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-slate-800">Barcode Management</h1>
              <p className="text-xs text-slate-400 mt-0.5">Browse items, build a print cart, and design labels</p>
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                <div className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-shopping-cart-2-line text-sm" />
                </div>
                {items.length} item{items.length !== 1 ? 's' : ''} in cart
              </div>
            )}
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-0 mt-4">
            {steps.map((step, idx) => (
              <div key={step.num} className="flex items-center">
                <button
                  onClick={() => setActiveStep(step.num as ActiveStep)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    activeStep === step.num
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold ${
                    activeStep === step.num ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {step.num}
                  </span>
                  {step.label}
                </button>
                {idx < steps.length - 1 && (
                  <div className="w-8 h-px bg-slate-200 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <BarcodeItemsTable />
          <PrintCart
            onDesignAndPrint={handleDesignAndPrint}
            onQuickPrint={handleQuickPrint}
          />
        </div>

        {/* Label Designer Modal */}
        {showDesigner && (
          <LabelDesignerModal onClose={() => { setShowDesigner(false); setActiveStep(1); }} />
        )}
      </div>
    </AppLayout>
  );
}
