import { apiClient, type ApiResponse } from './client';

const BASE = '/api/v1/purchase-payment';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'CHEQUE' | 'NEFT' | 'RTGS';
export type ChequeStatus = 'PENDING' | 'CLEARED' | 'BOUNCED' | 'INSUFFICIENT_BALANCE';

export interface CreatePaymentPayload {
  invoiceId: string;
  paymentAmount: number;
  paymentMode: PaymentMode;
  date: string;
  notes?: string;
  // UPI / NEFT / RTGS
  referenceNo?: string;
  // CARD
  cardLastFour?: string;
  // CHEQUE
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeStatus?: ChequeStatus;
  bounceReason?: string;
}

export interface PurchasePaymentDTO {
  id: string;
  paymentNumber: string;
  invoiceId: string;
  invoiceNumber?: string;
  supplierId?: string;
  supplierName?: string;
  paymentAmount: number;
  paymentMode: PaymentMode;
  date: string;
  notes?: string;
  referenceNo?: string;
  cardLastFour?: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  chequeStatus?: ChequeStatus;
  bounceReason?: string;
  createdAt: string;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  byMode: Record<PaymentMode, { count: number; amount: number }>;
  pendingCheques: number;
}

export interface GetPaymentsParams {
  search?: string;
  payment_mode?: PaymentMode;
  cheque_status?: ChequeStatus;
}

// ─── Create Payment ────────────────────────────────────────────────────────────

export async function apiCreatePayment(
  payload: CreatePaymentPayload
): Promise<ApiResponse<PurchasePaymentDTO>> {
  const { data } = await apiClient.post<ApiResponse<PurchasePaymentDTO>>(BASE, payload);
  return data;
}

// ─── Get All Payments ──────────────────────────────────────────────────────────

export async function apiGetAllPayments(
  params: GetPaymentsParams = {}
): Promise<ApiResponse<PurchasePaymentDTO[]>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.payment_mode) qs.set('payment_mode', params.payment_mode);
  if (params.cheque_status) qs.set('cheque_status', params.cheque_status);
  const query = qs.toString();
  const { data } = await apiClient.get<ApiResponse<PurchasePaymentDTO[]>>(
    query ? `${BASE}?${query}` : BASE
  );
  return data;
}

// ─── Get By ID ────────────────────────────────────────────────────────────────

export async function apiGetPaymentById(
  id: string
): Promise<ApiResponse<PurchasePaymentDTO>> {
  const { data } = await apiClient.get<ApiResponse<PurchasePaymentDTO>>(`${BASE}/${id}`);
  return data;
}

// ─── Get By Invoice ID ────────────────────────────────────────────────────────

export async function apiGetPaymentsByInvoice(
  invoiceId: string
): Promise<ApiResponse<PurchasePaymentDTO[]>> {
  const { data } = await apiClient.get<ApiResponse<PurchasePaymentDTO[]>>(
    `${BASE}/invoice/${invoiceId}`
  );
  return data;
}

// ─── Update Cheque Status ─────────────────────────────────────────────────────

export async function apiUpdateChequeStatus(
  paymentId: string,
  chequeStatus: ChequeStatus,
  bounceReason?: string
): Promise<ApiResponse<PurchasePaymentDTO>> {
  const { data } = await apiClient.patch<ApiResponse<PurchasePaymentDTO>>(
    `${BASE}/${paymentId}/cheque-status`,
    { chequeStatus, ...(bounceReason ? { bounceReason } : {}) }
  );
  return data;
}

// ─── Delete Payment ───────────────────────────────────────────────────────────

export async function apiDeletePayment(id: string): Promise<ApiResponse<null>> {
  const { data } = await apiClient.delete<ApiResponse<null>>(`${BASE}/${id}`);
  return data;
}

// ─── Get Stats ────────────────────────────────────────────────────────────────

export async function apiGetPaymentStats(): Promise<ApiResponse<PaymentStats>> {
  const { data } = await apiClient.get<ApiResponse<PaymentStats>>(`${BASE}/stats`);
  return data;
}
