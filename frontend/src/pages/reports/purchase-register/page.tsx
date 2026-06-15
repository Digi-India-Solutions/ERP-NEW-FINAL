import { useState, useEffect } from 'react';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import ReportTable from '@/pages/reports/components/ReportTable';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { filterParties } from '@/api/party.api';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { useQuery } from '@tanstack/react-query';

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

import axios from 'axios';

const BASE = 'http://localhost:7000/api/v1/reports';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const getPurchaseRegisterApi = async (
  from: string,
  to: string,
  supplierId?: string,
  warehouseId?: string,
) => {
  const res = await axios.get(`${BASE}/purchase-register`, {
    params: {
      from,
      to,
      supplierId: supplierId || undefined,
      warehouseId: warehouseId || undefined,
    },
    headers: authHeaders(),
  });

  return res.data; // { success, data, summary }
};

export const usePurchaseRegister = (
  from: string,
  to: string,
  supplierId: string,
  warehouseId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ['purchase-register', from, to, supplierId, warehouseId],
    queryFn: () => getPurchaseRegisterApi(from, to, supplierId || undefined, warehouseId || undefined),
    enabled,
  });
};

function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function PurchaseRegisterReport() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState(today);
  const [supplierId, setSupplierId] = useState('');
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId = selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : '';
  const [generated, setGenerated] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const { data, isFetching } = usePurchaseRegister(
    from,
    to,
    supplierId,
    warehouseId,
    generated,
  );

  const rows = (data?.data || []).map((r: any) => ({
    id: r.id,

    date: r.date,
    invoiceNo: r.invoiceNo,
    supplierInvNo: r.supplierInvoiceNo,
    supplier: r.supplier,
    itemCount: r.lineCount,

    // raw values (for totals)
    _cgst: Number(r.cgst || 0),
    _sgst: Number(r.sgst || 0),
    _igst: Number(r.igst || 0),

    // display values (for table)
    taxableAmount: formatINR(r.taxableAmount || 0),
    cgst: r.cgst > 0 ? formatINR(r.cgst) : '—',
    sgst: r.sgst > 0 ? formatINR(r.sgst) : '—',
    igst: r.igst > 0 ? formatINR(r.igst) : '—',

    totalTax: formatINR(r.totalTax || 0),
    grandTotal: formatINR(r.totalAmount || 0),

    status: r.paymentStatus || '—',
  }));

  const summary = data?.summary || {};

  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const res = await filterParties({
          type: 'Supplier',
          isActive: true,
          warehouse_id: warehouseId || undefined,
        });

        // ✅ FIX: handle nested API response safely
        const list = res?.data || [];
        setSuppliers(list);
        setSupplierId(prev => {
          const exists = list.some((p: any) => p.id === prev);
          return exists ? prev : '';
        });
      } catch (err) {
        console.error('Failed to load suppliers', err);
        setSuppliers([]); // safety fallback
      }
    };

    loadSuppliers();
  }, [warehouseId]);

  const handleGenerate = () => {
    setGenerated(true);
    if (generated);
  };

  const active = rows.filter((r) => r.status !== 'CANCELLED');

  const totalTaxable = summary.totalTaxable || 0;
  const totalTax = summary.totalTax || 0;
  const totalAmount = summary.totalAmount || 0;

  const exportColumns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Invoice No', key: 'invoiceNo', width: 18 },
    { header: 'Supp Inv No', key: 'supplierInvNo', width: 16 },
    { header: 'Supplier', key: 'supplier', width: 24 },
    { header: 'Items', key: 'itemCount', width: 8 },
    { header: 'Taxable', key: 'taxableAmount', width: 14 },
    { header: 'CGST', key: 'cgst', width: 12 },
    { header: 'SGST', key: 'sgst', width: 12 },
    { header: 'IGST', key: 'igst', width: 12 },
    { header: 'Total Tax', key: 'totalTax', width: 12 },
    { header: 'Grand Total', key: 'grandTotal', width: 14 },
    { header: 'Status', key: 'status', width: 12 },
  ];

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          From Date
        </label>
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          To Date
        </label>
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] focus:outline-none focus:border-[#4f46e5]"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Supplier
        </label>
        <select
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5] min-w-[180px]"
        >
          <option value="">All Suppliers</option>
          {suppliers.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Purchase Register"
      subtitle={
        generated
          ? `${from} to ${to} · ${active.length} invoices`
          : 'Select date range and generate report'
      }
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated}
      exportData={rows}
      exportColumns={exportColumns}
      exportFilename={`purchase-register-${from}-${to}`}
    >
      {generated && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Total Purchases',
                value: active.length,
                icon: 'ri-store-2-line',
                color: 'bg-indigo-50 text-[#4f46e5]',
              },
              {
                label: 'Total Taxable Amount',
                value: formatINR(totalTaxable),
                icon: 'ri-money-rupee-circle-line',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                label: 'Total Tax (GST)',
                value: formatINR(totalTax),
                icon: 'ri-government-line',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                label: 'Grand Total',
                value: formatINR(totalAmount),
                icon: 'ri-calculator-line',
                color: 'bg-green-50 text-green-600',
              },
            ]}
          />
          <ReportTable
            keyField="id"
            data={rows}
            loading={isFetching}
            columns={[
              { header: 'Date', accessor: 'date' },
              { header: 'Invoice No', accessor: 'invoiceNo' },
              { header: 'Supp Inv No', accessor: 'supplierInvNo' },
              { header: 'Supplier', accessor: 'supplier' },
              { header: 'Items', accessor: 'itemCount' },

              { header: 'Taxable', accessor: 'taxableAmount' },
              { header: 'CGST', accessor: 'cgst' },
              { header: 'SGST', accessor: 'sgst' },
              { header: 'IGST', accessor: 'igst' },

              { header: 'Total Tax', accessor: 'totalTax' },
              { header: 'Grand Total', accessor: 'grandTotal' },
              { header: 'Status', accessor: 'status' },
            ]}
            footerRow={
              <>
                <td colSpan={5} className="px-3 py-2.5 text-xs text-[#64748b]">
                  TOTAL ({active.length} invoices)
                </td>
                <td className="px-3 py-2.5 text-right font-semibold">
                  {formatINR(totalTaxable)}
                </td>
                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(active.reduce((s, r) => s + r._cgst, 0))}
                </td>

                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(active.reduce((s, r) => s + r._sgst, 0))}
                </td>

                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(active.reduce((s, r) => s + r._igst, 0))}
                </td>

                <td className="px-3 py-2.5 text-right text-amber-700 font-semibold">
                  {formatINR(totalTax)}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">
                  {formatINR(totalAmount)}
                </td>
                <td />
              </>
            }
          />
        </>
      )}
      {!generated && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-store-2-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              Select date range and click Generate Report
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
