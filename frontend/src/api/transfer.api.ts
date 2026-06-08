import { apiClient } from './client';

export async function apiGetAllTransfers() {
  const { data } = await apiClient.get('/api/v1/transfer');
  return data;
}