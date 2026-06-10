import { apiClient, type ApiResponse } from './client';

export interface ShiftPayload {
  name: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  breakMinutes: number;
  workingDays: string[];
  isActive?: boolean;
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
}

const BASE = '/api/v1/shifts';

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
  };
  const { data } = await apiClient.post<ApiResponse<ShiftResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

export async function getAllShifts(): Promise<
  ApiResponse<ShiftResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<ShiftResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

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
  };
  const { data } = await apiClient.put<ApiResponse<ShiftResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

export async function deleteShift(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
