import { apiClient } from '@/api/client';
import type { ApiResponse, UnitDTO, CreateUnitRequest } from '@/api/types';

export const unitService = {
  list: async (): Promise<UnitDTO[]> => {
    const { data } = await apiClient.get<ApiResponse<UnitDTO[]>>('/api/v1/units');
    return data.data;
  },

  create: async (payload: CreateUnitRequest): Promise<UnitDTO> => {
    const { data } = await apiClient.post<ApiResponse<UnitDTO>>('/api/v1/units', payload);
    return data.data;
  },

  update: async (id: string, payload: CreateUnitRequest): Promise<UnitDTO> => {
    const { data } = await apiClient.patch<ApiResponse<UnitDTO>>(`/api/v1/units/${id}`, payload);
    return data.data;
  },

  softDelete: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/v1/units/${id}`, { isActive: false });
  },
};
