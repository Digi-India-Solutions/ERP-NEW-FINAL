import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse } from '@/api/types';
import type { ChequeStatus, MockPaymentReceipt, PaymentMode } from '@/mocks/payments';

export interface SalesPaymentListParams {
  page?: number;
  limit?: number;
  fromDate?: string;
  toDate?: string;
  search?: string;
  paymentMode?: PaymentMode | 'ALL';
  warehouseId?: string | number;
}

export interface CreateSalesPaymentPayload {
  invoiceId: string;
  date: string;
  paymentAmount: number;
  paymentMode: PaymentMode;
  referenceNo?: string;
  cardLastFour?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeStatus?: ChequeStatus;
  bounceReason?: string;
  notes?: string;
  warehouseId?: string;
   warehouseName?: string;
}

export const salesPaymentService = {
  list: async (params?: SalesPaymentListParams): Promise<PaginatedResponse<MockPaymentReceipt>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<MockPaymentReceipt>>>(
      '/api/v1/sales-payments/payments/receipts',
      { params: { page: 1, limit: 200, ...params } }
    );
    return data.data;
  },

  listReturnSettlements: async (params?: SalesPaymentListParams): Promise<PaginatedResponse<MockPaymentReceipt>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<MockPaymentReceipt>>>(
      '/api/v1/sales-payments/returns/receipts',
      { params: { page: 1, limit: 200, ...params } }
    );
    return data.data;
  },

  create: async (payload: CreateSalesPaymentPayload): Promise<MockPaymentReceipt> => {
    const { data } = await apiClient.post<ApiResponse<MockPaymentReceipt>>('/api/v1/sales-payments/payments/receipts', payload);
    return data.data;
  },

  updateChequeStatus: async (
    id: string,
    chequeStatus: 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE',
    bounceReason?: string
  ): Promise<{ id: string; chequeStatus: string; bounceReason?: string }> => {
    const { data } = await apiClient.patch<ApiResponse<{ id: string; chequeStatus: string; bounceReason?: string }>>(
      `/api/v1/sales-payments/payments/receipts/${id}/cheque-status`,
      { chequeStatus, bounceReason }
    );
    return data.data;
  },
};
