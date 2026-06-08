import { useQuery } from '@tanstack/react-query';
import { reportService } from '@/services/reportService';

import { getStockSummaryApi } from '@/pages/reports/stock-summary/page'; 

export const useStockSummary = (
  warehouseId: string,
  categoryId: string,
  enabled: boolean
) => {
  return useQuery({
    queryKey: ['stock-summary', warehouseId, categoryId],
    queryFn: () => getStockSummaryApi(warehouseId, categoryId),
    enabled, 
  });
};

export const useStockLedger = (itemId: string, warehouseId: string, from: string, to: string, enabled = false) =>
  useQuery({
    queryKey: ['report-stock-ledger', itemId, warehouseId, from, to],
    queryFn: () => reportService.getStockLedger(itemId, warehouseId, from, to),
    enabled,
  });

export const useLowStock = (warehouseId?: string, enabled = false) =>
  useQuery({
    queryKey: ['report-low-stock', warehouseId],
    queryFn: () => reportService.getLowStock(warehouseId),
    enabled,
  });

export const usePurchaseRegister = (from: string, to: string, supplierId?: string, enabled = false) =>
  useQuery({
    queryKey: ['report-purchase-register', from, to, supplierId],
    queryFn: () => reportService.getPurchaseRegister(from, to, supplierId),
    enabled,
  });

export const useGSTPurchase = (from: string, to: string, enabled = false) =>
  useQuery({
    queryKey: ['report-gst-purchase', from, to],
    queryFn: () => reportService.getGSTPurchase(from, to),
    enabled,
  });

export const useSalesRegister = (from: string, to: string, customerId?: string, enabled = false) =>
  useQuery({
    queryKey: ['report-sales-register', from, to, customerId],
    queryFn: () => reportService.getSalesRegister(from, to, customerId),
    enabled,
  });

export const useGSTSales = (from: string, to: string, enabled = false) =>
  useQuery({
    queryKey: ['report-gst-sales', from, to],
    queryFn: () => reportService.getGSTSales(from, to),
    enabled,
  });

export const useOutstanding = (asOfDate: string, enabled = false) =>
  useQuery({
    queryKey: ['report-outstanding', asOfDate],
    queryFn: () => reportService.getOutstanding(asOfDate),
    enabled,
  });

export const useDayBook = (date: string, enabled = false) =>
  useQuery({
    queryKey: ['report-day-book', date],
    queryFn: () => reportService.getDayBook(date),
    enabled,
  });

export const usePartyLedger = (partyId: string, from: string, to: string, enabled = false) =>
  useQuery({
    queryKey: ['report-party-ledger', partyId, from, to],
    queryFn: () => reportService.getPartyLedger(partyId, from, to),
    enabled,
  });

export const useCustomerSummary = (enabled = false) =>
  useQuery({
    queryKey: ['report-customer-summary'],
    queryFn: () => reportService.getCustomerSummary(),
    enabled,
  });
