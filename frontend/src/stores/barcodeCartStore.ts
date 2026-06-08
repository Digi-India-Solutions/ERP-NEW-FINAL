import { create } from 'zustand';

export interface BarcodeCartItem {
  itemId: string;
  name: string;
  brand: string;
  category: string;
  barcode: string;
  mrp: number;
  saleRate: number;
  labelQty: number;
}

interface BarcodeCartState {
  items: BarcodeCartItem[];
  addToCart: (item: BarcodeCartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  updateQty: (itemId: string, qty: number) => void;
  isInCart: (itemId: string) => boolean;
}

export const useBarcodeCartStore = create<BarcodeCartState>((set, get) => ({
  items: [],

  addToCart: (item: BarcodeCartItem) => {
    const { items } = get();
    if (items.find((i) => i.itemId === item.itemId)) return;
    set({ items: [...items, item] });
  },

  removeFromCart: (itemId: string) => {
    set({ items: get().items.filter((i) => i.itemId !== itemId) });
  },

  clearCart: () => set({ items: [] }),

  updateQty: (itemId: string, qty: number) => {
    set({
      items: get().items.map((i) =>
        i.itemId === itemId ? { ...i, labelQty: Math.max(1, qty) } : i
      ),
    });
  },

  isInCart: (itemId: string) => !!get().items.find((i) => i.itemId === itemId),
}));
