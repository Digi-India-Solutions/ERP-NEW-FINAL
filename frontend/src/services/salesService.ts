//import { apiClient } from '@/api/client';
import type { ApiResponse, PaginatedResponse, ListParams } from '@/api/types';
import type { InvoiceLineItem } from '@/types/billing';
import {
  getData,
  postData,
  patchData,
  putData,
} from '../services/FetchNodeServices.js';
export type SalesInvoiceStatus = 'SAVED' | 'DRAFT' | 'CANCELLED';
export type SalesPaymentMode =
  | 'CASH'
  | 'CREDIT'
  | 'PARTIAL'
  | 'UPI'
  | 'CARD'
  | 'CHEQUE'
  | 'NEFT'
  | 'RTGS'
  | 'IMPS'
  | 'BANK_TRANSFER'
  | 'DD'
  | 'ONLINE'
  | 'WALLET'
  | 'CRYPTOCURRENCY'
  | 'MIXED'
  | 'CREDIT_AMOUNT';
export type SalesPaymentStatus = 'PAID' | 'UNPAID' | 'PARTIAL';

export interface SalesInvoicePayload {
  customerId: string;
  warehouseId: string;
  date: string;
  billingAddress: string;
  shippingAddress: string;
  paymentMode: string;
  amountReceived?: number;
  useCustomerCredit?: boolean;
  paymentBreakdown?: {
    cash?: number;
    upi?: number;
    card?: number;
    cheque?: number;
    chequeBankName?: string;
    chequeNo?: string;
    chequeDate?: string;
    chequeBranch?: string;
  };
  notes?: string;
  partyName?: string;
  warehouseName?: string;
  items: Array<{
    itemId: string;
    qty: number;
    rate: number;
    discount: number;
    taxRate: number;
    hsnCode: string;
  }>;
}

export interface SalesInvoiceRecord {
  id: string;
  invoiceNo: string;
  date: string;
  partyName: string;
  warehouseName: string;
  itemCount: number;
  grandTotal: number;
  status: SalesInvoiceStatus;
  paymentMode: SalesPaymentMode;
  paymentStatus?: SalesPaymentStatus;
  paidAmount?: number;
  balanceDue?: number;
  hasChallan?: boolean;
  items?: InvoiceLineItem[];
  customerId?: string;
  customerGstin?: string;
  warehouseId?: string;
  vehicleNo?: string;
  driverName?: string;
  lrNo?: string;
  billingAddress?: string;
  shippingAddress?: string;
}

export interface SalesInvoiceDetail extends SalesInvoiceRecord {
  billNo: string;
  isSameState: boolean;
  subtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  roundOff: number;
  items: InvoiceLineItem[];
}

export interface ChallanPayload {
  customerId: string;
  warehouseId: string;
  date: string;
  challanNo?: string;
  vehicleNo: string;
  driverName: string;
  lrNo: string;
  items: Array<{ itemId: string; qty: number; unit: string; rate?: number }>;
}

export interface ReturnPayload {
  originalInvoiceId: string;
  date: string;
  reason: string;
  warehouseId?: string;
  items: Array<{
    itemId: string;
    qty: number;
    rate: number;
    reason?: string;
    customReason?: string;
  }>;
}

export interface UpdateReturnPayload {
  returnDate?: string;
  warehouseId?: string;
  notes?: string;

  items: Array<{
    itemId: string;
    returnQty: number;
    rate: number;
    reason?: string;
    customReason?: string;
  }>;
}

export interface SalesReturnRecord {
  id: string;
  invoiceNo: string;
  date: string;
  partyName: string;
  warehouseName: string;
  itemCount: number;
  grandTotal: number;
  status: string;
  paymentMode?: string;
  originalInvoiceId?: string;
  originalInvoiceNo?: string;
  paymentHandled?: boolean;
  paymentType?: 'REFUND' | 'CREDIT' | null;
  refundId?: string | null;
  items?: Array<{
    id?: string;
    itemId?: string;
    itemName?: string;
    hsnCode?: string;
    qty?: number;
    returnQty?: number;
    unit?: string;
    rate?: number;
    amount?: number;
    reason?: string;
    customReason?: string;
  }>;
}

export interface ReturnPaymentPayload {
  paymentType: 'REFUND' | 'CREDIT';
  paymentMode?: string;
  amount?: number;
  adjustmentAmount?: number;
}

export interface InvoicePaymentHistoryRow {
  id: string;
  paymentDate?: string;
  paymentMode: string;
  amount: number;
  paymentStatus?: string;
}

export const salesService = {
  listInvoices: async (
    params?: ListParams & {
      search?: string;
      paymentType?: string;
      status?: string;
      warehouseId?: string;
    },
  ): Promise<PaginatedResponse<SalesInvoiceRecord>> => {
    // Build query string manually to avoid getData's URL/param mangling
    const qs = new URLSearchParams();
    qs.set('page', String(params?.page ?? 5));
    qs.set('limit', String(params?.limit ?? 50));
    if (params?.search) qs.set('search', params.search);
    if (params?.paymentType) qs.set('paymentType', params.paymentType);
    if (params?.status) qs.set('status', params.status);
    if (params?.warehouseId) qs.set('warehouseId', params.warehouseId);

    const BASE_URL =
      import.meta.env.VITE_API_URL ?? 'https://asvapi.digiindiasolutions.com';
    const token = localStorage.getItem('token'); // adjust to wherever you store it

    const res = await fetch(
      `${BASE_URL}/api/v1/sales-invoices?${qs.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!res.ok) throw new Error(`listInvoices failed: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  getInvoice: async (
    id: string,
    params?: ListParams,
  ): Promise<SalesInvoiceRecord> => {
    const data = await getData(`api/v1/sales-invoices/${id}`, {
      params: { page: 1, limit: 50, ...params },
    });
    return data.data;
  },

  getInvoicePaymentHistory: async (
    id: string,
  ): Promise<InvoicePaymentHistoryRow[]> => {
    const data = await getData(`api/v1/sales-invoices/${id}/payment-history`);
    const rows = Array.isArray(data?.data) ? data.data : [];

    return rows
      .map((row: any, index: number) => ({
        id: String(
          row.id || row.paymentId || row.receiptNumber || `payment-${index}`,
        ),
        paymentDate:
          row.paymentDate ||
          row.payment_date ||
          row.date ||
          row.createdAt ||
          row.created_at,
        paymentMode: String(
          row.paymentMode || row.payment_mode || row.mode || '',
        ),
        amount: Number(
          row.amount ?? row.paymentAmount ?? row.payment_amount ?? 0,
        ),
        paymentStatus: String(
          row.paymentStatus ||
            row.payment_status ||
            row.status ||
            row.chequeStatus ||
            row.cheque_status ||
            'PAID',
        ),
      }))
      .filter(
        (row) =>
          row.paymentMode && Number.isFinite(row.amount) && row.amount > 0,
      );
  },

  createInvoice: async (
    payload: SalesInvoicePayload,
  ): Promise<SalesInvoiceRecord> => {
    console.log('📝 Creating invoice with payload:', payload);
    const data = await postData<ApiResponse<SalesInvoiceRecord>>(
      'api/v1/sales-invoices/',
      payload,
    );

    if (!data?.success) {
      throw new Error(data?.message || 'Failed to save invoice');
    }

    if (!data?.data) {
      throw new Error('Invoice save failed: empty server response');
    }

    console.log('✅ Created invoice response:', data.data);
    return data.data;
  },

  getPrintData: async (id: string): Promise<SalesInvoiceRecord> => {
    //const { data } = await apiClient.get<ApiResponse<SalesInvoiceRecord>>(`/api/v1/sales-invoices/${id}/print`);
    const data = await getData(`api/v1/sales-invoices/${id}/print`);
    return data.data;
  },

  listChallans: async (
    params?: ListParams & { warehouseId?: string },
  ): Promise<PaginatedResponse<SalesInvoiceRecord>> => {
    const qs = new URLSearchParams();

    qs.set('page', String(params?.page ?? 1));
    qs.set('limit', String(params?.limit ?? 50));

    if (params?.warehouseId) {
      qs.set('warehouseId', params.warehouseId);
    }

    const BASE_URL =
      import.meta.env.VITE_API_URL ?? 'https://asvapi.digiindiasolutions.com';

    const token = localStorage.getItem('token');

    const res = await fetch(`${BASE_URL}/api/v1/challans?${qs.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      throw new Error(`listChallans failed: ${res.status}`);
    }

    const json = await res.json();

    return json.data;
  },

  createChallan: async (
    payload: ChallanPayload,
  ): Promise<SalesInvoiceRecord> => {
    //const { data } = await apiClient.post<ApiResponse<SalesInvoiceRecord>>('/api/v1/challans', payload);
    const data = await postData<ApiResponse<SalesInvoiceRecord>>(
      'api/v1/challans',
      payload,
    );
    return data.data;
  },

  getChallan: async (id: string): Promise<SalesInvoiceRecord> => {
    //const { data } = await apiClient.get<ApiResponse<SalesInvoiceRecord>>(`/api/v1/challans/${id}`);
    const data = await getData<ApiResponse<SalesInvoiceRecord>>(
      `api/v1/challans/${id}`,
    );
    return data.data;
  },

  convertChallanToInvoice: async (
    challanId: string,
  ): Promise<SalesInvoiceRecord> => {
    //const { data } = await apiClient.patch<ApiResponse<SalesInvoiceRecord>>(`/api/v1/challans/${challanId}/convert`, {});
    const data = await patchData<ApiResponse<SalesInvoiceRecord>>(
      `api/v1/challans/${challanId}/convert`,
      {},
    );
    return data.data;
  },

  createReturn: async (payload: ReturnPayload): Promise<SalesReturnRecord> => {
    // const { data } = await apiClient.post<ApiResponse<SalesReturnRecord>>('/api/v1/sale-returns', payload);
    const data = await postData<ApiResponse<SalesReturnRecord>>(
      'api/v1/sale-returns',
      payload,
    );
    return data.data;
  },

  // ✅ Isse replace karo
  listReturns: async (
    params?: ListParams & { warehouseId?: string },
  ): Promise<PaginatedResponse<SalesReturnRecord>> => {
    const qs = new URLSearchParams();
    qs.set('page', String(params?.page ?? 1));
    qs.set('limit', String(params?.limit ?? 50));
    if (params?.warehouseId) qs.set('warehouseId', params.warehouseId);

    const BASE_URL =
      import.meta.env.VITE_API_URL ?? 'https://asvapi.digiindiasolutions.com';
    const token = localStorage.getItem('token');

    const res = await fetch(
      `${BASE_URL}/api/v1/sale-returns?${qs.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
    );

    if (!res.ok) throw new Error(`listReturns failed: ${res.status}`);
    const json = await res.json();
    return json.data;
  },

  getReturn: async (id: string): Promise<SalesReturnRecord> => {
    //const { data } = await apiClient.get<ApiResponse<SalesReturnRecord>>(`/api/v1/sale-returns/${id}`);
    const data = await getData<ApiResponse<SalesReturnRecord>>(
      `api/v1/sale-returns/${id}`,
    );
    return data.data;
  },

  handleReturnPayment: async (
    id: string,
    payload: ReturnPaymentPayload,
  ): Promise<{ message: string }> => {
    //const { data } = await apiClient.patch<ApiResponse<{ message: string }>>(`/api/v1/sale-returns/${id}/payment`, payload);
    const data = await patchData<ApiResponse<{ message: string }>>(
      `api/v1/sale-returns/${id}/payment`,
      payload,
    );
    return data.data ?? { message: data.message || 'Return payment processed' };
  },

  updateReturn: async (id, payload) => {
    const data = await putData(`api/v1/sale-returns/${id}`, payload);
    if (data?.success === false) {
      throw new Error(data.message || 'Failed to update return');
    }
    return data;
  },
};
