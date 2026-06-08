import { useEffect, useRef } from 'react';
import { mockCompany } from '@/mocks/masters';
import { LabelSettings, BarcodePrintItem, SIZE_MAP } from './Types';

declare const JsBarcode: (
  el: SVGSVGElement | HTMLImageElement,
  value: string,
  options?: Record<string, unknown>
) => void;

interface LabelPreviewProps {
  settings: LabelSettings;
  item: BarcodePrintItem;
}

const SCALE = 3.2;

export function LabelPreview({ settings, item }: LabelPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { w, h } =
    settings.size === 'custom'
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

  return (
    <div
      className="border-2 border-dashed border-slate-300 bg-white rounded overflow-hidden mx-auto"
      style={{ width: w * SCALE, height: h * SCALE, minWidth: 120, minHeight: 60 }}
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