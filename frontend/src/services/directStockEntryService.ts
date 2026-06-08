import { apiClient } from '@/api/client';

export interface DSEListParams {
  warehouse_id?: string;
  reason?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface DSEListRow {
  id: string;
  dse_number: string;
  entry_date: string;
  warehouse_id: string;
  warehouse_name: string | null;
  reason: string;
  custom_reason: string | null;
  reference_no: string | null;
  notes: string | null;
  created_by: string;
  created_by_name: string | null;
  total_qty: number;
  total_value: number;
  total_items: number;
  created_at: string;
}

export interface CreateDSEItemPayload {
  itemId: string;
  quantity: number;
  rate?: number;
  unitName?: string | null;
}

export interface CreateDSEPayload {
  warehouseId: string;
  entryDate?: string;
  reason: string;
  customReason?: string | null;
  referenceNo?: string | null;
  notes?: string | null;
  items: CreateDSEItemPayload[];
}

export interface CreateDSEResponse {
  id: string;
  dse_number: string;
  total_qty: number;
  total_value: number;
}

export interface DSEListResponse {
  data: DSEListRow[];
  total: number;
  page: number;
  limit: number;
}

export interface DSEDetailItem {
  id: string;
  dse_id: string;
  item_id: string;
  item_name: string;
  item_code: string | null;
  quantity: number;
  rate: number;
  display_unit_name: string | null;
}

export interface DSEDetailResponse {
  id: string;
  dse_number: string;
  entry_date: string;
  warehouse_id: string;
  warehouse_name: string | null;
  reason: string;
  custom_reason: string | null;
  reference_no: string | null;
  notes: string | null;
  created_by_name: string | null;
  total_qty: number;
  total_value: number;
  items: DSEDetailItem[];
}

export const directStockEntryService = {
  list: async (params?: DSEListParams): Promise<DSEListResponse> => {
    const { data } = await apiClient.get<DSEListResponse>('/api/v1/entry', {
      params: { page: 1, limit: 100, ...params },
    });

    return {
      data: Array.isArray(data.data) ? data.data : [],
      total: Number(data.total || 0),
      page: Number(data.page || 1),
      limit: Number(data.limit || (params?.limit ?? 100)),
    };
  },

  getById: async (id: string): Promise<DSEDetailResponse> => {
    const { data } = await apiClient.get<DSEDetailResponse>(`/api/v1/entry/${id}`);
    return data;
  },

  create: async (payload: CreateDSEPayload): Promise<CreateDSEResponse> => {
    const { data } = await apiClient.post<{ data: CreateDSEResponse }>('/api/v1/entry', payload);
    return data.data;
  },
};
