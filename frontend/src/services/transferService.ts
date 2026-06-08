import { apiClient } from '@/api/client';
import axios from 'axios';
import type {
  ApiResponse,
  CreateTransferRequest,
  TransferDTO,
  TransferDetailDTO,
} from '@/api/types';

export interface TransferListResponse {
  success: boolean;
  count: number;
  data: TransferDTO[];
}

export interface TransferDetailResponse {
  success: boolean;
  data: TransferDetailDTO;
}

export interface TransferCreateResponse {
  success: boolean;
  message: string;
  data: TransferDTO;
}

export interface TransferApproveResponse {
  success: boolean;
  message: string;
  data: TransferDTO;
}

export interface TransferFilterParams {
  search?: string;
  status?: string;
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  from_date?: string;
  to_date?: string;
}

export const transferService = {
  /**
   * Fetch all stock transfers with optional filters
   */
  getAllTransfers: async (
    params?: TransferFilterParams
  ): Promise<TransferDTO[]> => {
    try {
      const { data } = await apiClient.get<TransferListResponse>(
        '/api/v1/transfer',
        { params }
      );
      return data.data || [];
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string } | undefined)?.message;
        throw new Error(message || error.message || 'Failed to fetch transfers');
      }
      throw error;
    }
  },

  /**
   * Fetch a single transfer by ID with all items
   */
  getTransferById: async (id: string): Promise<TransferDetailDTO> => {
    try {
      const { data } = await apiClient.get<TransferDetailResponse>(
        `/api/v1/transfer/${id}`
      );
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string } | undefined)?.message;
        throw new Error(message || error.message || 'Failed to fetch transfer');
      }
      throw error;
    }
  },

  /**
   * Create a new stock transfer
   */
  createTransfer: async (
    payload: CreateTransferRequest
  ): Promise<TransferDTO> => {
    try {
      const { data } = await apiClient.post<TransferCreateResponse>(
        '/api/v1/transfer',
        payload
      );
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string } | undefined)?.message;
        throw new Error(message || error.message || 'Failed to create transfer');
      }
      throw error;
    }
  },

  /**
   * Approve a pending stock transfer
   */
  approveTransfer: async (id: string): Promise<TransferDTO> => {
    try {
      const { data } = await apiClient.patch<TransferApproveResponse>(
        `/api/v1/transfer/${id}/approve`
      );
      return data.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as { message?: string } | undefined)?.message;
        throw new Error(message || error.message || 'Failed to approve transfer');
      }
      throw error;
    }
  },
};
