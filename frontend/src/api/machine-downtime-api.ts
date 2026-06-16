import { apiClient, type ApiResponse } from './client';

export interface DowntimeEntryPayload {
  machine_id: string;
  downtime_code_id: string;
  date: string;
  start_time: string;
  production_order_id?: string | null;
  shift_id: string;
  operator_id: string;
  description?: string | null;
  warehouse_id?: string | null;
}

export interface ResolveDowntimePayload {
  end_time: string;
  resolved_by?: string;
  notes?: string | null;
}

export interface DowntimeEntryResponse {
  id: string;
  entry_number: string;
  machine_id: string;
  machine_name: string;
  work_center_name: string | null;
  downtime_code_id: string;
  downtime_code_name: string;
  category: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number | null;
  production_order_id: string | null;
  shift_id: string;
  shift_name: string;
  operator_id: string;
  operator_name: string;
  description: string | null;
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  date: string;
  warehouse_id: string | null;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/v1/downtime-entries';

// ✅ CREATE DOWNTIME ENTRY
export async function createDowntimeEntry(
  payload: DowntimeEntryPayload,
): Promise<ApiResponse<DowntimeEntryResponse>> {
  const { data } = await apiClient.post<ApiResponse<DowntimeEntryResponse>>(
    `${BASE}/create`,
    payload,
  );
  return data;
}

// ✅ GET ALL DOWNTIME ENTRIES
export async function getAllDowntimeEntries(filters?: {
  date_from?: string;
  date_to?: string;
  machine_id?: string;
  category?: string;
  status?: 'ALL' | 'ACTIVE' | 'RESOLVED';
}): Promise<ApiResponse<DowntimeEntryResponse[]>> {
  const queryParams = new URLSearchParams();
  if (filters?.date_from) queryParams.append('date_from', filters.date_from);
  if (filters?.date_to) queryParams.append('date_to', filters.date_to);
  if (filters?.machine_id) queryParams.append('machine_id', filters.machine_id);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.status && filters.status !== 'ALL') {
    queryParams.append('status', filters.status);
  }

  const url = queryParams.toString() ? `${BASE}/?${queryParams}` : `${BASE}/`;
  const { data } =
    await apiClient.get<ApiResponse<DowntimeEntryResponse[]>>(url);
  return data;
}

// ✅ GET DOWNTIME ENTRY BY ID
export async function getDowntimeEntryById(
  id: string,
): Promise<ApiResponse<DowntimeEntryResponse>> {
  const { data } = await apiClient.get<ApiResponse<DowntimeEntryResponse>>(
    `${BASE}/${id}`,
  );
  return data;
}

// ✅ UPDATE DOWNTIME ENTRY
export async function updateDowntimeEntry(
  id: string,
  payload: Partial<DowntimeEntryPayload>,
): Promise<ApiResponse<DowntimeEntryResponse>> {
  const { data } = await apiClient.put<ApiResponse<DowntimeEntryResponse>>(
    `${BASE}/${id}`,
    payload,
  );
  return data;
}

// ✅ RESOLVE DOWNTIME ENTRY
export async function resolveDowntimeEntry(
  id: string,
  payload: ResolveDowntimePayload,
): Promise<ApiResponse<DowntimeEntryResponse>> {
  const { data } = await apiClient.patch<ApiResponse<DowntimeEntryResponse>>(
    `${BASE}/${id}/resolve`,
    payload,
  );
  return data;
}

// ✅ DELETE DOWNTIME ENTRY
export async function deleteDowntimeEntry(
  id: string,
): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
