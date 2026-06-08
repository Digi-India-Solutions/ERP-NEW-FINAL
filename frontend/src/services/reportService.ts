import { apiClient } from '@/api/client';
import {
  mockStockSummary, mockStockLedger, mockLowStock,
  mockPurchaseRegister, mockGSTPurchase, mockSalesRegister,
  mockGSTSales, mockOutstanding, mockDayBook, mockPartyLedger,
  mockCustomerSummary,
} from '@/mocks/reports';

async function safeCall<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export const reportService = {
  getStockSummary: (warehouseId?: string, categoryId?: string) =>
    safeCall(
      () => apiClient.get('/reports/stock-summary', { params: { warehouseId, categoryId } }).then((r) => r.data.data),
      mockStockSummary,
    ),

  getStockLedger: (itemId: string, warehouseId: string, from: string, to: string) =>
    safeCall(
      () => apiClient.get('/reports/stock-ledger', { params: { itemId, warehouseId, from, to } }).then((r) => r.data.data),
      mockStockLedger,
    ),

  getLowStock: (warehouseId?: string) =>
    safeCall(
      () => apiClient.get('/reports/low-stock', { params: { warehouseId } }).then((r) => r.data.data),
      mockLowStock,
    ),

  getPurchaseRegister: (from: string, to: string, supplierId?: string) =>
    safeCall(
      () => apiClient.get('/reports/purchase-register', { params: { from, to, supplierId } }).then((r) => r.data.data),
      mockPurchaseRegister,
    ),

  getGSTPurchase: (from: string, to: string) =>
    safeCall(
      () => apiClient.get('/reports/gst-purchase', { params: { from, to } }).then((r) => r.data.data),
      mockGSTPurchase,
    ),

  getSalesRegister: (from: string, to: string, customerId?: string) =>
    safeCall(
      () => apiClient.get('/reports/sales-register', { params: { from, to, customerId } }).then((r) => r.data.data),
      mockSalesRegister,
    ),

  getGSTSales: (from: string, to: string) =>
    safeCall(
      () => apiClient.get('/reports/gst-sales', { params: { from, to } }).then((r) => r.data.data),
      mockGSTSales,
    ),

  getOutstanding: (asOfDate: string) =>
    safeCall(
      () => apiClient.get('/reports/outstanding', { params: { asOfDate } }).then((r) => r.data.data),
      mockOutstanding,
    ),

  getDayBook: (date: string) =>
    safeCall(
      () => apiClient.get('/reports/day-book', { params: { date } }).then((r) => r.data.data),
      mockDayBook,
    ),

  getPartyLedger: (partyId: string, from: string, to: string) =>
    safeCall(
      () => apiClient.get('/reports/party-ledger', { params: { partyId, from, to } }).then((r) => r.data.data),
      mockPartyLedger,
    ),

  getCustomerSummary: () =>
    safeCall(
      () => apiClient.get('/reports/customer-summary').then((r) => r.data.data),
      mockCustomerSummary,
    ),
};
