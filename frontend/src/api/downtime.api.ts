import { apiClient, type ApiResponse } from './client';

export interface DowntimeEntryPayload {
  machineId: string;
  downtimeCodeId: string;
  date: string;
  startTime: string;
  productionOrderId?: string | null;
  shiftId: string;
  operatorId: string;
  description?: string | null;
  warehouseId?: string | null;
}

export interface DowntimeEntryResponse {
  id: string;
  entry_number: string;
  machine_id: string;
  machine_name: string;
  work_center_id: string | null;
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

export interface DowntimeResolvePayload {
  endTime: string;
  resolvedBy?: string;
  notes?: string;
}

const BASE = '/api/v1/manufacturing/downtime-entries';

// Helper: Convert snake_case API response to camelCase MockDowntimeEntry
export function mapToFrontend(d: DowntimeEntryResponse) {
  // Format date safely
  let dateStr = d.date;
  if (dateStr && dateStr.includes('T')) {
    dateStr = dateStr.split('T')[0];
  }
  return {
    id: d.id,
    entryNumber: d.entry_number,
    machineId: d.machine_id,
    machineName: d.machine_name,
    workCenterId: d.work_center_id ?? '',
    workCenterName: d.work_center_name ?? '',
    downtimeCodeId: d.downtime_code_id,
    downtimeCodeName: d.downtime_code_name,
    category: d.category,
    startTime: d.start_time,
    endTime: d.end_time,
    durationMinutes: d.duration_minutes,
    productionOrderId: d.production_order_id,
    shiftId: d.shift_id,
    shiftName: d.shift_name,
    operatorId: d.operator_id,
    operatorName: d.operator_name,
    description: d.description,
    isResolved: d.is_resolved,
    resolvedBy: d.resolved_by,
    resolvedAt: d.resolved_at,
    date: dateStr,
  };
}

function toSnake(p: DowntimeEntryPayload) {
  return {
    machine_id: p.machineId,
    downtime_code_id: p.downtimeCodeId,
    date: p.date,
    start_time: p.startTime,
    production_order_id: p.productionOrderId || null,
    shift_id: p.shiftId,
    operator_id: p.operatorId,
    description: p.description || null,
    warehouse_id: p.warehouseId || null,
  };
}

export async function createDowntimeEntry(
  payload: DowntimeEntryPayload,
): Promise<ApiResponse<DowntimeEntryResponse>> {
  const { data } = await apiClient.post<ApiResponse<DowntimeEntryResponse>>(
    `${BASE}/create`,
    toSnake(payload),
  );
  return data;
}

export async function getAllDowntimeEntries(warehouseId?: string): Promise<ApiResponse<DowntimeEntryResponse[]>> {
  const url = warehouseId ? `${BASE}?warehouse_id=${warehouseId}` : `${BASE}`;
  const { data } = await apiClient.get<ApiResponse<DowntimeEntryResponse[]>>(url);
  return data;
}

export async function getDowntimeEntryById(id: string): Promise<ApiResponse<DowntimeEntryResponse>> {
  const { data } = await apiClient.get<ApiResponse<DowntimeEntryResponse>>(`${BASE}/${id}`);
  return data;
}

export async function updateDowntimeEntry(
  id: string,
  payload: Partial<DowntimeEntryPayload>,
): Promise<ApiResponse<DowntimeEntryResponse>> {
  const { data } = await apiClient.put<ApiResponse<DowntimeEntryResponse>>(
    `${BASE}/${id}`,
    toSnake(payload as DowntimeEntryPayload),
  );
  return data;
}

export async function resolveDowntimeEntry(
  id: string,
  payload: DowntimeResolvePayload,
): Promise<ApiResponse<DowntimeEntryResponse>> {
  const { data } = await apiClient.patch<ApiResponse<DowntimeEntryResponse>>(
    `${BASE}/${id}/resolve`,
    {
      end_time: payload.endTime,
      resolved_by: payload.resolvedBy,
      notes: payload.notes,
    },
  );
  return data;
}

export async function deleteDowntimeEntry(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
