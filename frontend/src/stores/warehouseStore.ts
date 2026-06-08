// src/stores/warehouseStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WarehouseStore {
  selectedWarehouseId: string;
  selectedWarehouseName: string;
  setSelectedWarehouse: (id: string, name: string) => void;
}

export const useWarehouseStore = create<WarehouseStore>()(
  persist(
    (set) => ({
      selectedWarehouseId: '',
      selectedWarehouseName: '',
      setSelectedWarehouse: (id, name) =>
        set({ selectedWarehouseId: id, selectedWarehouseName: name }),
    }),
    { name: 'selected-warehouse' }
  )
);