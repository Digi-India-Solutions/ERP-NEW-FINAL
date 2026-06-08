import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse, ListParams } from '@/api/types';

export interface PurchaseInvoicePayload {
  supplierId: string; warehouseId: string; date: string;
  supplierInvoiceNo?: string; linkedPoId?: string; notes?: string;
  items: Array<{
    itemId: string; qty: number; rate: number;
    discount: number; taxRate: number; hsnCode: string;
  }>;
}

export interface PurchaseInvoiceRecord {
  id: string; invoiceNo: string; date: string;
  partyName: string; warehouseName: string;
  itemCount: number; grandTotal: number; status: string;
  supplierInvoiceNo?: string;
}

export interface PurchaseReturnPayload {
  originalInvoiceId: string; date: string; reason: string;
  items: Array<{ itemId: string; qty: number; rate: number }>;
}

export const purchaseService = {
  listInvoices: async (params?: ListParams): Promise<PaginatedResponse<PurchaseInvoiceRecord>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<PurchaseInvoiceRecord>>>(
      '/api/v1/purchase-invoice', { params: { page: 1, limit: 50, ...params } }
    );
    return data.data;
  },


  
  getInvoice: async (id: string): Promise<PurchaseInvoiceRecord> => {
    const { data } = await apiClient.get<ApiResponse<PurchaseInvoiceRecord>>(`/api/v1/purchase-invoice/${id}`);
    return data.data;
  },

  createInvoice: async (payload: PurchaseInvoicePayload): Promise<PurchaseInvoiceRecord> => {
    const { data } = await apiClient.post<ApiResponse<PurchaseInvoiceRecord>>('/api/v1/purchase-invoice', payload);
    return data.data;
  },

  createReturn: async (payload: PurchaseReturnPayload): Promise<PurchaseInvoiceRecord> => {
    const { data } = await apiClient.post<ApiResponse<PurchaseInvoiceRecord>>('/api/v1/purchase-returns', payload);
    return data.data;
  },

  listReturns: async (params?: ListParams): Promise<PaginatedResponse<PurchaseInvoiceRecord>> => {
    const { data } = await apiClient.get<ApiResponse<PaginatedResponse<PurchaseInvoiceRecord>>>(
      '/api/v1/purchase-returns', { params: { page: 1, limit: 50, ...params } }
    );
    return data.data;
  },

  getInvoiceForEdit: async (id: string) => {
  const { data } = await apiClient.get<ApiResponse<any>>(
    `/api/v1/purchase-invoice/${id}`
  );
  return data.data;
},

  duplicateInvoice: async (id: string) => {
  const { data } = await apiClient.post<
    ApiResponse<{ id: string; invoiceNumber: string }>
  >(`/api/v1/purchase-invoice/${id}/duplicate`);

  return data.data;
},

deleteInvoice: async (id: string): Promise<{ message: string }> => {
    const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/api/v1/purchase-invoice/${id}`
    );
    if (!data.success) throw new Error(data.message ?? 'Failed to delete invoice');
    return data.data;
  },

  updateInvoice: async (
    id: string,
    payload: {
      warehouseId: string;
      supplierId: string;
      grnId?: string | null;
      items: Array<{
        itemId: string;
        itemName: string;
        qty: number;
        rate: number;
      }>;
    }
  ): Promise<{ message: string }> => {
    const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
      `/api/v1/purchase-invoice/${id}`,
      payload
    );
    if (!data.success) throw new Error(data.message ?? 'Failed to update invoice');
    return data.data;
  }


};


