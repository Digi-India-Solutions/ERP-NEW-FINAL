import { LabelSettings, defaultSettings, STORAGE_KEY } from './Types';

declare const JsBarcode: (
  el: SVGSVGElement | HTMLImageElement,
  value: string,
  options?: Record<string, unknown>
) => void;

/** Generate barcode SVG string using JsBarcode on a real (detached) DOM element */
export function generateBarcodeSVG(value: string, format: 'EAN13' | 'CODE128'): string {
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

export function loadSettings(): LabelSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return defaultSettings;
}