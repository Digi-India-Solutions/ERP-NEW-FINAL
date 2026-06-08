import { apiClient } from '@/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  ItemDTO,
  ItemSearchResult,
  CreateItemRequest,
  UpdateItemRequest,
  ListParams,
  LowStockItem,
  StockLedgerEntry,
} from '@/api/types';

interface RawItemApiRow {
  id: string;
  name: string;
  code?: string | null;
  gst_rate?: string | number | null;
  taxRate?: number;
  sale_rate?: string | number | null;
  saleRate?: string;
  purchase_rate?: string | number | null;
  purchaseRate?: string;
  stock?: number | string;
  current_stock?: number | string;
  currentStock?: number;
  unit_short_name?: string | null;
  unitShortName?: string | null;
}

interface RawListResponse {
  success: boolean;
  count?: number;
  data?: RawItemApiRow[] | PaginatedResponse<ItemDTO>;
}

const toNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const toSearchResult = (row: RawItemApiRow): ItemSearchResult => ({
  id: row.id,
  name: row.name,
  code: row.code ?? '',
  taxRate: toNumber(row.gst_rate ?? row.taxRate, 0),
  saleRate: String(row.sale_rate ?? row.saleRate ?? '0'),
  purchaseRate: String(row.purchase_rate ?? row.purchaseRate ?? '0'),
  currentStock: toNumber(row.stock ?? row.current_stock ?? row.currentStock, 0),
  unitShortName: row.unit_short_name ?? row.unitShortName ?? '',
});

export const itemService = {
  list: async (params?: ListParams): Promise<PaginatedResponse<ItemDTO>> => {
    const { data } = await apiClient.get<RawListResponse>('/api/v1/item', {
      params: { page: 1, limit: 50, ...params },
    });

    const payload = data.data;
    if (payload && typeof payload === 'object' && Array.isArray((payload as PaginatedResponse<ItemDTO>).items)) {
      return payload as PaginatedResponse<ItemDTO>;
    }

    const rows = Array.isArray(payload) ? (payload as unknown as ItemDTO[]) : [];
    return {
      items: rows,
      total: typeof data.count === 'number' ? data.count : rows.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
    };
  },

  // Used by billing item search dropdown — type 2 chars → instant results
  search: async (q: string, warehouseId?: string): Promise<ItemSearchResult[]> => {
    const query = q.trim();
    if (query.length < 2) return [];

    const { data } = await apiClient.get<ApiResponse<RawItemApiRow[]>>('/api/v1/item/filter', {
      params: { search: query, warehouseId },
    });
    return (data.data || []).map(toSearchResult);
  },

  get: async (id: string): Promise<ItemDTO> => {
    const { data } = await apiClient.get<ApiResponse<ItemDTO>>(`/api/v1/item/${id}`);
    return data.data;
  },

  create: async (payload: CreateItemRequest): Promise<ItemDTO> => {
    const { data } = await apiClient.post<ApiResponse<ItemDTO>>('/api/v1/item', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateItemRequest): Promise<ItemDTO> => {
    const { data } = await apiClient.put<ApiResponse<ItemDTO>>(`/api/v1/item/${id}`, payload);
    return data.data;
  },

  softDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/item/${id}`);
  },

  getLowStock: async (warehouseId?: string): Promise<LowStockItem[]> => {
    const { data } = await apiClient.get<ApiResponse<LowStockItem[]>>(
      '/api/v1/item/low-stock',
      { params: { warehouseId } }
    );
    return data.data;
  },

  getStockLedger: async (
    itemId: string,
    warehouseId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<StockLedgerEntry[]> => {
    const { data } = await apiClient.get<ApiResponse<StockLedgerEntry[]>>(
      `/api/v1/item/${itemId}/ledger`,
      { params: { warehouseId, fromDate, toDate } }
    );
    return data.data;
  },
};
