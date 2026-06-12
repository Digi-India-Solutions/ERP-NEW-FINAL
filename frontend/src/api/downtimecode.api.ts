import { apiClient, type ApiResponse } from './client';

export type DowntimeCategory = 'BREAKDOWN' | 'PLANNED' | 'MATERIAL' | 'POWER' | 'OPERATOR' | 'SETUP' | 'OTHER';

export interface DowntimeCodePayload {
  code: string;
  description: string;
  category: DowntimeCategory;
  affectsMachine?: boolean;
  isActive?: boolean;
}

export interface DowntimeCodeResponse {
  id: string;
  code: string;
  description: string;
  category: DowntimeCategory;
  affects_machine: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/v1/downtime-codes';

export async function createDowntimeCode(
  payload: DowntimeCodePayload,
): Promise<ApiResponse<DowntimeCodeResponse>> {
  const formattedPayload = {
    code: payload.code,
    description: payload.description,
    category: payload.category,
    affects_machine: payload.affectsMachine,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.post<ApiResponse<DowntimeCodeResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

export async function getAllDowntimeCodes(): Promise<
  ApiResponse<DowntimeCodeResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<DowntimeCodeResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

export async function updateDowntimeCode(
  id: string,
  payload: Partial<DowntimeCodePayload>,
): Promise<ApiResponse<DowntimeCodeResponse>> {
  const formattedPayload = {
    code: payload.code,
    description: payload.description,
    category: payload.category,
    affects_machine: payload.affectsMachine,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.put<ApiResponse<DowntimeCodeResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

export async function deleteDowntimeCode(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
