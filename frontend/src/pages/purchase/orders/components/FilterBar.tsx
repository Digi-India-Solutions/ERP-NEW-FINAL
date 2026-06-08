import { useState } from 'react';
import { exportToPDF, exportToExcel } from '@/utils/exportUtils';
import { mockCompany } from '@/mocks/masters';
import type { APIPO } from '@/api/purchaseOrderApi';
import type { POStatus } from '../page';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';

interface Props {
  dateFrom: string;
  dateTo: string;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  setDateFilterActive: (v: boolean) => void;
  supplierFilter: string;
  setSupplierFilter: (v: string) => void;
  statusFilter: POStatus;
  setStatusFilter: (v: POStatus) => void;
  suppliers: {
    id: string;
    name: string;
  }[];
  search: string;
  setSearch: (v: string) => void;
  filtered: APIPO[];
  allPOs: APIPO[];
  setPage: (p: number) => void;
}

export default function FilterBar({
  dateFrom,
  dateTo,
  setDateFrom,
  setDateTo,
  setDateFilterActive,
  supplierFilter,
  setSupplierFilter,
  statusFilter,
  setStatusFilter,
  suppliers,
  search,
  setSearch,
  filtered,
  allPOs,
  setPage,
}: Props) {
  const lb  = 'block text-xs font-semibold text-slate-500 mb-1';
  const inp = 'w-full h-9 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg';

  const canExport = useAuth().hasControl('exportData');

  const handleExportExcel = () => {
    // ✅ FIX: APIPO list rows have aggregate fields, NOT p.items
    const rows = filtered.map((p) => ({
      poNumber:     p.poNumber,
      date:         p.date ? new Date(p.date).toLocaleDateString('en-IN') : '',
      supplierName: p.supplierName ?? '',
      items:        p.itemCount ?? 0,
      orderedQty:   p.totalOrderedQty ?? 0,
      receivedQty:  p.totalReceivedQty ?? 0,
      pendingQty:   (p.totalOrderedQty ?? 0) - (p.totalReceivedQty ?? 0),
      amount:       `₹${(p.totalAmount ?? 0).toLocaleString('en-IN')}`,
      status:       p.status,
    }));

    exportToExcel(
      rows as unknown as Record<string, unknown>[],
      [
        { header: 'PO No',         key: 'poNumber',     width: 18 },
        { header: 'Date',          key: 'date',         width: 14 },
        { header: 'Supplier',      key: 'supplierName', width: 24 },
        { header: 'Items',         key: 'items',        width: 10 },
        { header: 'Ordered Qty',   key: 'orderedQty',   width: 14 },
        { header: 'Received Qty',  key: 'receivedQty',  width: 14 },
        { header: 'Pending Qty',   key: 'pendingQty',   width: 14 },
        { header: 'Amount',        key: 'amount',       width: 16 },
        { header: 'Status',        key: 'status',       width: 14 },
      ],
      `PO-Report-${dateFrom}-${dateTo}`,
      'Purchase Orders',
    );
  };

  const handleExportPDF = () => {
    // ✅ FIX: same — use aggregate fields
    const rows = filtered.map((p) => ({
      poNumber:     p.poNumber,
      date:         p.date ? new Date(p.date).toLocaleDateString('en-IN') : '',
      supplierName: p.supplierName ?? '',
      items:        p.itemCount ?? 0,
      orderedQty:   p.totalOrderedQty ?? 0,
      receivedQty:  p.totalReceivedQty ?? 0,
      pendingQty:   (p.totalOrderedQty ?? 0) - (p.totalReceivedQty ?? 0),
      amount:       `₹${(p.totalAmount ?? 0).toLocaleString('en-IN')}`,
      status:       p.status,
    }));

    exportToPDF(
      rows as unknown as Record<string, unknown>[],
      [
        { header: 'PO No',         key: 'poNumber',     width: 18 },
        { header: 'Date',          key: 'date',         width: 14 },
        { header: 'Supplier',      key: 'supplierName', width: 24 },
        { header: 'Items',         key: 'items',        width: 10 },
        { header: 'Ordered Qty',   key: 'orderedQty',   width: 14 },
        { header: 'Received Qty',  key: 'receivedQty',  width: 14 },
        { header: 'Pending Qty',   key: 'pendingQty',   width: 14 },
        { header: 'Amount',        key: 'amount',       width: 16 },
        { header: 'Status',        key: 'status',       width: 14 },
      ],
      `Purchase Orders — ${dateFrom} to ${dateTo}`,
      `PO-Report-${dateFrom}-${dateTo}`,
      `${mockCompany.name} | Generated on ${new Date().toLocaleDateString('en-IN')}`,
    );
  };

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
        <div>
          <label className={lb}>Date From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setDateFilterActive(true); setPage(1); }}
            className={inp}
          />
        </div>
        <div>
          <label className={lb}>Date To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setDateFilterActive(true); setPage(1); }}
            className={inp}
          />
        </div>
        <div>
          <label className={lb}>Supplier</label>
          <select
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              setPage(1);
            }}
            className={inp}
          >
            {suppliers.map((supplier) => (
              <option
                key={supplier.id}
                value={supplier.id}
              >
                {supplier.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={lb}>Status</label>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as POStatus); setPage(1); }}
            className={inp}
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PARTIAL">Partial</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div>
          <label className={lb}>Search</label>
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="PO No / Supplier..."
              className="w-full h-9 pl-8 pr-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
            />
          </div>
        </div>
      </div>

      {/* Export row */}
      <div className="flex items-center justify-between pt-1 border-t border-[#f1f5f9]">
        <p className="text-xs text-slate-400">
          Showing <strong className="text-[#1e293b]">{filtered.length}</strong> of{' '}
          <strong className="text-[#1e293b]">{allPOs.length}</strong> purchase orders
        </p>
        {canExport && (<div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-file-excel-2-line text-emerald-600" />Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-file-pdf-2-line text-red-500" />Export PDF
          </button>
        </div>)}
      </div>
    </div>
  );
}