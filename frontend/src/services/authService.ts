import { apiClient } from '@/api/client';
import type { ApiResponse, LoginResponse, MeResponse } from '@/api/types';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>('/api/v1/auth/login', {
      email,
      password,
    });
    return data.data;
  },

  me: async (): Promise<MeResponse> => {
    const { data } = await apiClient.get<ApiResponse<MeResponse>>('/api/v1/auth/me');
    return data.data;
  },

  refresh: async (): Promise<string> => {
    const { data } = await apiClient.post<ApiResponse<{ accessToken: string }>>('/api/v1/auth/refresh');
    return data.data.accessToken;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/v1/auth/logout');
  },
};
