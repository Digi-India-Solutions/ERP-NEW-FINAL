import { apiClient } from '@/api/client';
import type {
  ApiResponse,
  PaginatedResponse,
  UserDTO,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateUserPermissionsRequest,
  ListParams,
} from '@/api/types';

export const userService = {
  list: async (params?: ListParams): Promise<PaginatedResponse<UserDTO>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<UserDTO>>>(
      '/api/v1/auth/company-user/all',
      { params: { page: 1, limit: 50, ...params } }
    );
   // console.log('List Users Response:', data);
    return data.data;
  },

  get: async (id: string): Promise<UserDTO> => {
    const { data } = await apiClient.get<ApiResponse<UserDTO>>(`/api/v1/auth/company-user/${id}`);
    return data.data;
  },

  create: async (payload: CreateUserRequest): Promise<UserDTO> => {
    const { data } = await apiClient.post<ApiResponse<UserDTO>>('/api/v1/auth/company-user/create', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateUserRequest): Promise<UserDTO> => {
    const { data } = await apiClient.patch<ApiResponse<UserDTO>>(`/api/v1/auth/company-user/update/${id}`, payload);
    return data.data;
  },

  updatePermissions: async (
    id: string,
    payload: UpdateUserPermissionsRequest
  ): Promise<UserDTO> => {
    const { data } = await apiClient.patch<ApiResponse<UserDTO>>(
      `/api/v1/auth/company-user/${id}/permissions`,
      payload
    );
    return data.data;
  },

  toggleActive: async (id: string, isActive: boolean): Promise<UserDTO> => {
    const { data } = await apiClient.patch<ApiResponse<UserDTO>>(
      `/api/v1/auth/company-user/${id}/active`,
      { isActive }
    );
    return data.data;
  },
};
