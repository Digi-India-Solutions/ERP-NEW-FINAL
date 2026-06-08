import { useCallback } from 'react';
import { mockCompany } from '@/mocks/masters';
import { BarcodePrintItem, LabelSettings, SIZE_MAP, STORAGE_KEY } from './Types';
import { generateBarcodeSVG } from './Utils';

interface UsePrintLabelsOptions {
  settings: LabelSettings;
  items: BarcodePrintItem[];
  rememberSettings: boolean;
}

export function usePrintLabels({ settings, items, rememberSettings }: UsePrintLabelsOptions) {
  const { w, h } =
    settings.size === 'custom'
      ? { w: settings.customW, h: settings.customH }
      : SIZE_MAP[settings.size];

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

  const print = useCallback(() => {
    const itemsWithBarcode = items.filter((i) => i.barcode);
    if (itemsWithBarcode.length === 0) return;

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
  <div class="labels-grid">${labelsHTML}</div>
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
  }, [items, settings, rememberSettings, buildLabelHTML]);

  return { print };
}