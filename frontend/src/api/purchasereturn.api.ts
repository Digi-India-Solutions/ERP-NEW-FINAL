import { apiClient, type ApiResponse } from './client';

const BASE = '/api/v1/purchase-return';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RefundMode = 'CASH' | 'UPI' | 'NEFT' | 'RTGS' | 'CHEQUE';

export interface CreateReturnItemPayload {
  itemId: string;
  qty: number;
  rate: number;
  unitId?: string;
  reason?: string;
}

export interface CreateReturnPayload {
  originalInvoiceId: string;
  date: string;
  reason: string;
  items: CreateReturnItemPayload[];
}

export interface ReturnItemDTO {
  id: string;
  itemId: string;
  itemName?: string;
  qty: number;
  rate: number;
  unitId?: string;
  unitName?: string;
  reason?: string;
  total: number;
}

export interface PurchaseReturnDTO {
  id: string;
  invoiceNo: string;
  originalInvoiceId: string;
  originalInvoiceNumber?: string;
  supplierId?: string;
  partyName?: string;
  date: string;
  reason: string;
  totalAmount: number;
  paymentHandled: boolean;
  paymentType?: 'refund' | 'credit' | null;
  refundMode?: RefundMode;
  referenceNo?: string;
  items: ReturnItemDTO[];
  createdAt: string;
}

export interface SupplierCreditDTO {
  id: string;
  supplierId: string;
  supplierName?: string;
  amount: number;
  returnNumber?: string;
  sourceReturnId?: string;
  sourceReturnNumber?: string;
  date: string;
  isUsed: boolean;
  usedOnInvoiceId?: string | null;
  usedInInvoiceId?: string | null;
}

export interface HandleRefundPayload {
  type: 'refund';
  refundMode: RefundMode;
  referenceNo?: string;
}

export interface HandleCreditPayload {
  type: 'credit';
}

export type HandlePaymentPayload = HandleRefundPayload | HandleCreditPayload;

export interface MarkCreditUsedPayload {
  invoiceId: string;
}

// ─── Create Return ────────────────────────────────────────────────────────────

export async function apiCreateReturn(
  payload: CreateReturnPayload
): Promise<ApiResponse<PurchaseReturnDTO>> {
  const { data } = await apiClient.post<ApiResponse<PurchaseReturnDTO>>(BASE, payload);
  return data;
}



// ─── Get All Returns ──────────────────────────────────────────────────────────

export async function apiGetAllReturns(): Promise<ApiResponse<PurchaseReturnDTO[]>> {
  const { data } = await apiClient.get<ApiResponse<PurchaseReturnDTO[]>>(BASE);
  return data;
}

// ─── Get By ID ────────────────────────────────────────────────────────────────

export async function apiGetReturnById(
  id: string
): Promise<ApiResponse<PurchaseReturnDTO>> {
  const { data } = await apiClient.get<ApiResponse<PurchaseReturnDTO>>(`${BASE}/${id}`);
  return data;
}

// ─── Handle Payment (Refund or Credit) ───────────────────────────────────────

export async function apiHandleReturnPayment(
  returnId: string,
  payload: HandlePaymentPayload
): Promise<ApiResponse<PurchaseReturnDTO>> {
  const { data } = await apiClient.post<ApiResponse<PurchaseReturnDTO>>(
    `${BASE}/${returnId}/handle-payment`,
    payload
  );
  return data;
}

// ─── Get Supplier Credits ─────────────────────────────────────────────────────

export async function apiGetSupplierCredits(
  supplierId?: string
): Promise<ApiResponse<SupplierCreditDTO[]>> {
  const { data } = await apiClient.get<ApiResponse<SupplierCreditDTO[]>>(
    `${BASE}/supplier-credits`,
    {
      params: supplierId ? { supplier_id: supplierId } : undefined,
    }
  );
  return data;
}

// ─── Mark Credit Used ─────────────────────────────────────────────────────────

export async function apiMarkCreditUsed(
  returnId: string,
  payload: MarkCreditUsedPayload
): Promise<ApiResponse<PurchaseReturnDTO>> {
  const { data } = await apiClient.patch<ApiResponse<PurchaseReturnDTO>>(
    `${BASE}/${returnId}/mark-credit-used`,
    payload
  );
  return data;
}

// Add these two to the existing file

export async function apiUpdatePurchaseReturn(
  id: string,
  payload: {
    date: string;
    reason: string;
    items: Array<{
      itemId: string;
      qty: number;
      rate: number;
      reason?: string;
      hsnCode?: string;
      unitId?: string;
    }>;
  }
): Promise<ApiResponse<{ message: string }>> {
  const { data } = await apiClient.put<ApiResponse<{ message: string }>>(
    `${BASE}/${id}`,
    payload
  );
  if (data?.success === false) {
    throw new Error( 'Failed to update return');
  }
  return data;
}

export async function apiDeletePurchaseReturn(
  id: string
): Promise<ApiResponse<{ message: string }>> {
  const { data } = await apiClient.delete<ApiResponse<{ message: string }>>(
    `${BASE}/${id}`
  );
  if (data?.success === false) {
    throw new Error( 'Failed to delete return');
  }
  return data;
}
