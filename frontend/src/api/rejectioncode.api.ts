import { apiClient, type ApiResponse } from './client';

export type RejectionCategory = 'MATERIAL' | 'MACHINE' | 'OPERATOR' | 'PROCESS' | 'DESIGN';

export interface RejectionCodePayload {
  code: string;
  description: string;
  category: RejectionCategory;
  applicableTo: string;
  isActive?: boolean;
}

export interface RejectionCodeResponse {
  id: string;
  code: string;
  description: string;
  category: RejectionCategory;
  applicable_to: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/v1/rejection-codes';

export async function createRejectionCode(
  payload: RejectionCodePayload,
): Promise<ApiResponse<RejectionCodeResponse>> {
  const formattedPayload = {
    code: payload.code,
    description: payload.description,
    category: payload.category,
    applicable_to: payload.applicableTo,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.post<ApiResponse<RejectionCodeResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

export async function getAllRejectionCodes(): Promise<
  ApiResponse<RejectionCodeResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<RejectionCodeResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

export async function updateRejectionCode(
  id: string,
  payload: Partial<RejectionCodePayload>,
): Promise<ApiResponse<RejectionCodeResponse>> {
  const formattedPayload = {
    code: payload.code,
    description: payload.description,
    category: payload.category,
    applicable_to: payload.applicableTo,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.put<ApiResponse<RejectionCodeResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

export async function deleteRejectionCode(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
