import { apiClient, type ApiResponse } from './client';

export type QualityType = 'PASS_FAIL' | 'NUMERIC' | 'TEXT';
export type QualityApplicable = 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'ALL';

export interface QualityParameterPayload {
  name: string;
  code: string;
  type: QualityType;
  unit?: string | null;
  minValue?: number | null;
  maxValue?: number | null;
  applicableTo: QualityApplicable;
  isActive?: boolean;
}

export interface QualityParameterResponse {
  id: string;
  name: string;
  code: string;
  type: QualityType;
  unit: string | null;
  min_value: string | number | null;
  max_value: string | number | null;
  applicable_to: QualityApplicable;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BASE = '/api/v1/quality-parameters';

export async function createQualityParameter(
  payload: QualityParameterPayload,
): Promise<ApiResponse<QualityParameterResponse>> {
  const formattedPayload = {
    name: payload.name,
    code: payload.code,
    type: payload.type,
    unit: payload.unit,
    min_value: payload.minValue,
    max_value: payload.maxValue,
    applicable_to: payload.applicableTo,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.post<ApiResponse<QualityParameterResponse>>(
    `${BASE}/create`,
    formattedPayload,
  );
  return data;
}

export async function getAllQualityParameters(): Promise<
  ApiResponse<QualityParameterResponse[]>
> {
  const { data } = await apiClient.get<ApiResponse<QualityParameterResponse[]>>(
    `${BASE}/`,
  );
  return data;
}

export async function updateQualityParameter(
  id: string,
  payload: Partial<QualityParameterPayload>,
): Promise<ApiResponse<QualityParameterResponse>> {
  const formattedPayload = {
    name: payload.name,
    code: payload.code,
    type: payload.type,
    unit: payload.unit,
    min_value: payload.minValue,
    max_value: payload.maxValue,
    applicable_to: payload.applicableTo,
    is_active: payload.isActive,
  };
  const { data } = await apiClient.put<ApiResponse<QualityParameterResponse>>(
    `${BASE}/${id}`,
    formattedPayload,
  );
  return data;
}

export async function deleteQualityParameter(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}
