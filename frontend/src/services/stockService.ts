// import { apiClient } from '@/api/client';
// import axios from 'axios';
// import type { ApiResponse, ListParams } from '@/api/types';

// export interface StockWarehouseBreakdown {
//   warehouseId: string;
//   warehouseName: string;
//   qty: number;
// }

// export type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'AT_MINIMUM' | 'NORMAL';

// export interface StockViewItem {
//   id: string;
//   name: string;
//   code: string | null;
//   unit: string | null;
//   categoryName: string | null;
//   brand: string | null;
//   minStockLevel: number;
//   totalStock: number;
//   status: StockStatus;
//   warehouseStocks: StockWarehouseBreakdown[];
//   warehouse_id:string;
// }

// export interface StockListResponse<T> {
//   count: number;
//   data: T;
// }

// export interface StockStats {
//   totalItems: number;
//   outOfStock: number;
//   lowStock: number;
//   normal: number;
//   totalStockQty: number;
//   warehouse_id:string;
// }

// export interface StockAdjustmentPayload {
//   warehouseId: string;
//   itemId: string;
//   type: 'INCREASE' | 'DECREASE';
//   quantity: number;
//   reason: string;
//   adjustmentDate?: string;
// }

// export interface StockAdjustmentRecord {
//   id: string;
//   companyId: string;
//   adjustmentNumber: string;
//   warehouseId: string;
//   warehouseName: string | null;
//   itemId: string;
//   itemName: string | null;
//   itemCode: string | null;
//   adjustmentDate: string;
//   type: 'INCREASE' | 'DECREASE';
//   quantity: number;
//   reason: string;
//   createdBy: string;
//   createdByName?: string | null;
//   approvedBy: string | null;
//   createdAt: string;
//   meta?: {
//     updatedWarehouseQty?: number;
//     updatedItemTotalStock?: number;
//   };
// }

// export interface AdjustmentFilterParams {
//   search?: string;
//   type?: 'INCREASE' | 'DECREASE' | 'ALL';
//   warehouse_id?: string;
//   from_date?: string;
//   to_date?: string;
// }

// interface AdjustmentListResponse {
//   success: boolean;
//   count: number;
//   data: StockAdjustmentRecord[];
// }

// interface AdjustmentDetailResponse {
//   success: boolean;
//   data: StockAdjustmentRecord;
// }

// export interface StockQueryParams extends ListParams {
//   search?: string;
//   warehouse_id?: string;
//   status?: string;
//   category_id?: string;
// }

// interface RawStockListApiResponse {
//   success: boolean;
//   count?: number;
//   data?: StockViewItem[] | StockListResponse<StockViewItem[]>;
// }

// const normalizeStockList = (payload: RawStockListApiResponse): StockListResponse<StockViewItem[]> => {
//   if (Array.isArray(payload.data)) {
//     return {
//       count: typeof payload.count === 'number' ? payload.count : payload.data.length,
//       data: payload.data,
//     };
//   }

//   const nested = payload.data;
//   if (nested && typeof nested === 'object' && Array.isArray((nested as StockListResponse<StockViewItem[]>).data)) {
//     const list = nested as StockListResponse<StockViewItem[]>;
//     return {
//       count: typeof list.count === 'number' ? list.count : list.data.length,
//       data: list.data,
//     };
//   }

//   return { count: 0, data: [] };
// };

// export const stockService = {
//   getStock: async (params?: StockQueryParams): Promise<StockListResponse<StockViewItem[]>> => {
//     const { data } = await apiClient.get<RawStockListApiResponse>(
//       '/api/v1/stock-view',
//       { params }
//     );
//     return normalizeStockList(data);
//   },

//   getLowStock: async (params?: StockQueryParams): Promise<StockListResponse<StockViewItem[]>> => {
//     const { data } = await apiClient.get<RawStockListApiResponse>(
//       '/api/v1/stock-view/low-stock',
//       { params }
//     );
//     return normalizeStockList(data);
//   },

//   getStockStats: async (): Promise<StockStats> => {
//     const { data } = await apiClient.get<ApiResponse<StockStats>>('/api/v1/stock-view/stats');
//     return data.data;
//   },

//   createAdjustment: async (payload: StockAdjustmentPayload): Promise<StockAdjustmentRecord> => {
//     try {
//       const { data } = await apiClient.post<ApiResponse<StockAdjustmentRecord> & { meta?: StockAdjustmentRecord['meta'] }>('/api/v1/adjustment', payload);
//       return {
//         ...data.data,
//         meta: data.meta,
//       };
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         const message = (error.response?.data as { message?: string } | undefined)?.message;
//         throw new Error(message || error.message || 'Failed to create adjustment');
//       }
//       throw error;
//     }
//   },

//   getAdjustments: async (params?: AdjustmentFilterParams): Promise<StockAdjustmentRecord[]> => {
//     try {
//       const { data } = await apiClient.get<AdjustmentListResponse>('/api/v1/adjustment', { params });
//       return data.data || [];
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         const message = (error.response?.data as { message?: string } | undefined)?.message;
//         throw new Error(message || error.message || 'Failed to fetch adjustments');
//       }
//       throw error;
//     }
//   },

//   getAdjustmentById: async (id: string): Promise<StockAdjustmentRecord> => {
//     try {
//       const { data } = await apiClient.get<AdjustmentDetailResponse>(`/api/v1/adjustment/${id}`);
//       return data.data;
//     } catch (error) {
//       if (axios.isAxiosError(error)) {
//         const message = (error.response?.data as { message?: string } | undefined)?.message;
//         throw new Error(message || error.message || 'Failed to fetch adjustment details');
//       }
//       throw error;
//     }
//   },
// };


import { apiClient } from '@/api/client';
import axios from 'axios';
import type { ApiResponse } from '@/api/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StockWarehouseBreakdown {
  warehouseId:   string;
  warehouseName: string;
  qty:           number;
}

// FIX: status now includes AT_MINIMUM to match the backend getStockStatus()
export type StockStatus = 'OUT_OF_STOCK' | 'LOW_STOCK' | 'AT_MINIMUM' | 'NORMAL';

export interface StockViewItem {
  id:             string;
  name:           string;
  code:           string | null;
  unit:           string | null;
  categoryName:   string | null;
  brand:          string | null;
  minStockLevel:  number;
  totalStock:     number;
  status:         StockStatus;
  warehouseStocks: StockWarehouseBreakdown[];
}

export interface StockListResponse<T> {
  count: number;
  data:  T;
}

export interface StockStats {
  totalItems:    number;
  outOfStock:    number;
  lowStock:      number;
  normal:        number;
  totalStockQty: number;
}

export interface StockAdjustmentPayload {
  warehouseId:     string;
  itemId:          string;
  type:            'INCREASE' | 'DECREASE';
  quantity:        number;
  reason:          string;
  adjustmentDate?: string;
}

export interface StockAdjustmentRecord {
  id:               string;
  companyId:        string;
  adjustmentNumber: string;
  warehouseId:      string;
  warehouseName:    string | null;
  itemId:           string;
  itemName:         string | null;
  itemCode:         string | null;
  adjustmentDate:   string;
  type:             'INCREASE' | 'DECREASE';
  quantity:         number;
  reason:           string;
  createdBy:        string;
  createdByName?:   string | null;
  approvedBy:       string | null;
  createdAt:        string;
  meta?: {
    updatedWarehouseQty?:    number;
    updatedItemTotalStock?:  number;
  };
}

export interface AdjustmentFilterParams {
  search?:       string;
  type?:         'INCREASE' | 'DECREASE' | 'ALL';
  warehouse_id?: string;
  from_date?:    string;
  to_date?:      string;
}

// FIX: StockQueryParams uses warehouse_id (snake_case) to match the backend
// query param name. The frontend was passing warehouse_id or warehouseId
// inconsistently — standardised here.
export interface StockQueryParams {
  search?:       string;
  warehouse_id?: string;   // matches backend req.query.warehouse_id
  status?:       string;
  category_id?:  string;
}

// ─── Internal response shape ──────────────────────────────────────────────────

interface RawStockListApiResponse {
  success: boolean;
  count?:  number;
  data?:   StockViewItem[] | StockListResponse<StockViewItem[]>;
}

interface AdjustmentListResponse {
  success: boolean;
  count:   number;
  data:    StockAdjustmentRecord[];
}

interface AdjustmentDetailResponse {
  success: boolean;
  data:    StockAdjustmentRecord;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

const normalizeStockList = (payload: RawStockListApiResponse): StockListResponse<StockViewItem[]> => {
  if (Array.isArray(payload.data)) {
    return {
      count: typeof payload.count === 'number' ? payload.count : payload.data.length,
      data:  payload.data,
    };
  }
  const nested = payload.data as StockListResponse<StockViewItem[]> | undefined;
  if (nested && Array.isArray(nested.data)) {
    return {
      count: typeof nested.count === 'number' ? nested.count : nested.data.length,
      data:  nested.data,
    };
  }
  return { count: 0, data: [] };
};

// ─── Service ──────────────────────────────────────────────────────────────────

export const stockService = {
  getStock: async (
    params?: StockQueryParams,
  ): Promise<StockListResponse<StockViewItem[]>> => {
    const { data } = await apiClient.get<RawStockListApiResponse>(
      '/api/v1/stock-view',
      { params },
    );
    return normalizeStockList(data);
  },

  getLowStock: async (
    params?: StockQueryParams,
  ): Promise<StockListResponse<StockViewItem[]>> => {
    const { data } = await apiClient.get<RawStockListApiResponse>(
      '/api/v1/stock-view/low-stock',
      { params },
    );
    return normalizeStockList(data);
  },

  // FIX: getStockStats now accepts optional params so the page can pass
  // warehouse_id and get warehouse-scoped counts (out of stock, low stock, etc.)
  getStockStats: async (params?: StockQueryParams): Promise<StockStats> => {
    const { data } = await apiClient.get<ApiResponse<StockStats>>(
      '/api/v1/stock-view/stats',
      { params },
    );
    return data.data;
  },

  createAdjustment: async (
    payload: StockAdjustmentPayload,
  ): Promise<StockAdjustmentRecord> => {
    try {
      const { data } = await apiClient.post<
        ApiResponse<StockAdjustmentRecord> & {
          meta?: StockAdjustmentRecord['meta'];
        }
      >('/api/v1/adjustment', payload);
      return { ...data.data, meta: data.meta };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = (error.response?.data as { message?: string } | undefined)
          ?.message;
        throw new Error(msg || error.message || 'Failed to create adjustment');
      }
      throw error;
    }
  },

  getAdjustments: async (
    params?: AdjustmentFilterParams,
  ): Promise<StockAdjustmentRecord[]> => {
    try {
      const query: Record<string, string> = {};

      if (params?.warehouse_id) query.warehouse_id = params.warehouse_id;
      if (params?.search) query.search = params.search;
      if (params?.type) query.type = params.type;
      if (params?.from_date) query.from_date = params.from_date;
      if (params?.to_date) query.to_date = params.to_date;

      const { data } = await apiClient.get<AdjustmentListResponse>(
        '/api/v1/adjustment',
        { params: query },
      );
      return data.data ?? [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = (error.response?.data as { message?: string } | undefined)
          ?.message;
        throw new Error(msg || error.message || 'Failed to fetch adjustments');
      }
      throw error;
    }
  },

  getAdjustmentById: async (id: string): Promise<StockAdjustmentRecord> => {
    try {
      const { data } = await apiClient.get<AdjustmentDetailResponse>(
        `/api/v1/adjustment/${id}`,
      );
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const msg = (error.response?.data as { message?: string } | undefined)
          ?.message;
        throw new Error(
          msg || error.message || 'Failed to fetch adjustment details',
        );
      }
      throw error;
    }
  },
};