export type LabelSize = '50x25' | '75x37' | '100x50' | 'custom';
export type BarcodeFormat = 'EAN13' | 'CODE128' | 'per-item';

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

export interface LabelSettings {
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

export const SIZE_MAP: Record<LabelSize, { w: number; h: number; label: string }> = {
  '50x25': { w: 50, h: 25, label: '50×25mm Small' },
  '75x37': { w: 75, h: 37, label: '75×37mm Medium' },
  '100x50': { w: 100, h: 50, label: '100×50mm Large' },
  custom: { w: 0, h: 0, label: 'Custom' },
};

export const STORAGE_KEY = 'invenpro_barcode_settings';

export const defaultSettings: LabelSettings = {
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