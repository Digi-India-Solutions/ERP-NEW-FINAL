import { apiClient, type ApiResponse } from './client';

export interface ProductionEntryPayload {
  production_order_id: string;
  work_order_id: string;
  date: string;
  shift_id: string;
  operator_id: string;
  machine_id?: string | null;
  start_time: string;
  end_time: string;
  produced_qty: number;
  rejected_qty?: number;
  rejection_code_id?: string | null;
  notes?: string | null;
  warehouse_id?: string | null;
}

export interface ProductionEntryResponse {
  id: string;
  entry_number: string;
  production_order_id: string;
  production_order_number: string;
  work_order_id: string;
  work_order_number: string;
  stage_name: string;
  work_center_id: string;
  work_center_name: string;
  machine_id: string | null;
  machine_name: string | null;
  operator_id: string;
  operator_name: string;
  shift_id: string;
  shift_name: string;
  date: string;
  produced_qty: number;
  rejected_qty: number;
  unit: string;
  start_time: string;
  end_time: string;
  actual_time_minutes: number;
  notes: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  supervisor_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  warehouse_id: string | null;
}

const BASE = '/api/v1/production-entries';

// ✅ CREATE PRODUCTION ENTRY
export async function createProductionEntry(
  payload: ProductionEntryPayload,
): Promise<ApiResponse<ProductionEntryResponse>> {
  const { data } = await apiClient.post<ApiResponse<ProductionEntryResponse>>(
    `${BASE}/create`,
    payload,
  );
  return data;
}

// ✅ GET ALL PRODUCTION ENTRIES
export async function getAllProductionEntries(filters?: {
  date?: string;
  production_order_id?: string;
  work_center_id?: string;
  operator_id?: string;
  status?: string;
}): Promise<ApiResponse<ProductionEntryResponse[]>> {
  const queryParams = new URLSearchParams();
  if (filters?.date) queryParams.append('date', filters.date);
  if (filters?.production_order_id)
    queryParams.append('production_order_id', filters.production_order_id);
  if (filters?.work_center_id)
    queryParams.append('work_center_id', filters.work_center_id);
  if (filters?.operator_id)
    queryParams.append('operator_id', filters.operator_id);
  if (filters?.status) queryParams.append('status', filters.status);

  const url = queryParams.toString() ? `${BASE}/?${queryParams}` : `${BASE}/`;
  const { data } =
    await apiClient.get<ApiResponse<ProductionEntryResponse[]>>(url);
  return data;
}

// ✅ GET PRODUCTION ENTRY BY ID
export async function getProductionEntryById(
  id: string,
): Promise<ApiResponse<ProductionEntryResponse>> {
  const { data } = await apiClient.get<ApiResponse<ProductionEntryResponse>>(
    `${BASE}/${id}`,
  );
  return data;
}

// ✅ UPDATE PRODUCTION ENTRY
export async function updateProductionEntry(
  id: string,
  payload: Partial<ProductionEntryPayload>,
): Promise<ApiResponse<ProductionEntryResponse>> {
  const { data } = await apiClient.put<ApiResponse<ProductionEntryResponse>>(
    `${BASE}/${id}`,
    payload,
  );
  return data;
}

// ✅ APPROVE PRODUCTION ENTRY
export async function approveProductionEntry(
  id: string,
  supervisor_id?: string,
): Promise<ApiResponse<ProductionEntryResponse>> {
  const { data } = await apiClient.patch<ApiResponse<ProductionEntryResponse>>(
    `${BASE}/${id}/approve`,
    { supervisor_id },
  );
  return data;
}

// ✅ DELETE PRODUCTION ENTRY
export async function deleteProductionEntry(
  id: string,
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
