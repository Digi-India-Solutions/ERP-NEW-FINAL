import { apiClient } from '@/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  PartyDTO,
  CreatePartyRequest,
  UpdatePartyRequest,
  ListParams,
} from '@/api/types';

export const partyService = {
  list: async (params?: ListParams): Promise<PaginatedResponse<PartyDTO>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<PartyDTO>>>(
      '/api/v1/parties',
      { params: { page: 1, limit: 50, ...params } }
    );
    return data.data;
  },

  search: async (q: string): Promise<PartyDTO[]> => {
    const { data } = await apiClient.get<ApiResponse<PartyDTO[]>>('/api/v1/parties/search', {
      params: { q },
    });
    return data.data;
  },

  get: async (id: string): Promise<PartyDTO> => {
    const { data } = await apiClient.get<ApiResponse<PartyDTO>>(`/api/v1/parties/${id}`);
    return data.data;
  },

  create: async (payload: CreatePartyRequest): Promise<PartyDTO> => {
    const { data } = await apiClient.post<ApiResponse<PartyDTO>>('/api/v1/parties', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdatePartyRequest): Promise<PartyDTO> => {
    const { data } = await apiClient.patch<ApiResponse<PartyDTO>>(`/api/v1/parties/${id}`, payload);
    return data.data;
  },

  softDelete: async (id: string): Promise<void> => {
    await apiClient.patch(`/api/v1/parties/${id}`, { isActive: false });
  },
};
