import { apiClient } from '@/api/client';
import type { ApiResponse, CategoryDTO, CreateCategoryRequest } from '@/api/types';
import { getData } from "../services/FetchNodeServices.js"
export const categoryService = {
  list: async (): Promise<CategoryDTO[]> => {
    const { data } = await getData('api/v1/categories/all');
    // console.log("SXS=>data", data)
    return data;
  },

  create: async (payload: CreateCategoryRequest): Promise<CategoryDTO> => {
    const { data } = await apiClient.post<ApiResponse<CategoryDTO>>('/api/v1/categories/create', payload);
    return data.data;
  },

  update: async (id: string, name: string): Promise<CategoryDTO> => {
    const { data } = await apiClient.put<ApiResponse<CategoryDTO>>(`/api/v1/categories/update/${id}`, {
      name,
    });
    return data.data;
  },

  softDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/categories/delete/${id}`);
  },
};
