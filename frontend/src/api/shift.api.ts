import { apiClient, type ApiResponse } from './client';

export interface ShiftPayload {
  name: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number;
  workingDays: string[];
  isActive?: boolean;
  warehouseId?: string;
  warehouseName?: string;
}

export interface ShiftResponse {
  id: string;
  name: string;
  start_time: string; // HH:MM:SS format from postgres
  end_time: string; // HH:MM:SS format from postgres
  break_minutes: number;
  working_days: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  warehouse_id: string;
  warehouse_name: string;
}

// ✅ Dropdown ke liye interface
export interface ShiftDropdownResponse {
  id: string;
  name: string;
}

const BASE = '/api/v1/shifts';

// ✅ CREATE SHIFT
export async function createShift(
  payload: ShiftPayload,
): Promise<ApiResponse<ShiftResponse>> {
  const formattedPayload = {
    name: payload.name,
    start_time: payload.startTime,
    end_time: payload.endTime,
    break_minutes: payload.breakMinutes,
    working_days: payload.workingDays,
    is_active: payload.isActive,
    warehouse_id: payload.warehouseId,
    warehouse_name: payload.warehouseName,
  };
  const { data } = await apiClient.post<ApiResponse<ShiftResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

// ✅ GET ALL SHIFTS (Complete data)
export async function getAllShifts(): Promise<ApiResponse<ShiftResponse[]>> {
  const { data } = await apiClient.get<ApiResponse<ShiftResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

// ✅ GET SHIFTS FOR DROPDOWN (Only id and name - Active shifts)
export async function getShiftsForDropdown(): Promise<
  ApiResponse<ShiftDropdownResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<ShiftDropdownResponse[]>>(
    `${BASE}/dropdown`,
  );
  return data;
}

// ✅ UPDATE SHIFT
export async function updateShift(
  id: string,
  payload: Partial<ShiftPayload>,
): Promise<ApiResponse<ShiftResponse>> {
  const formattedPayload = {
    name: payload.name,
    start_time: payload.startTime,
    end_time: payload.endTime,
    break_minutes: payload.breakMinutes,
    working_days: payload.workingDays,
    is_active: payload.isActive,
    warehouse_id: payload.warehouseId,
    warehouse_name: payload.warehouseName,
  };
  const { data } = await apiClient.put<ApiResponse<ShiftResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

// ✅ DELETE SHIFT
export async function deleteShift(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
