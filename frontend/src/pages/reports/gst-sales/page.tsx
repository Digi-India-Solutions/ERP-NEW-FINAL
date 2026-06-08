import { useState } from 'react';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import ReportTable from '@/pages/reports/components/ReportTable';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
 
export const useGSTSales = (from: string, to: string, warehouseId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['gst-sales', from, to, warehouseId],
 
    queryFn: async () => {
      const res = await axios.get(
        'https://asvapi.digiindiasolutions.com/api/v1/reports/gst-sales',
        { params: { from, to, warehouseId: warehouseId || undefined } },
      );
 
      return res.data; // ✅ full response
    },
 
    enabled,
  });
};
 
function formatINR(n: number) {
  return n > 0 ? `₹${n.toLocaleString('en-IN')}` : '—';
}
function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
 
export default function GSTSalesReport() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState(today);
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId = selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : '';
  const [generated, setGenerated] = useState(false);
  const { data, isFetching, refetch } = useGSTSales(from, to, warehouseId, generated);

  const rows = data?.data || [];
  const summary = data?.summary || {};

  const normalizedRows = rows.map((r) => ({
    ...r,
    t0: Number(r.t0 || 0),
    t5: Number(r.t5 || 0),
    t12: Number(r.t12 || 0),
    t18: Number(r.t18 || 0),
    t28: Number(r.t28 || 0),
    cgst: Number(r.cgst || 0),
    sgst: Number(r.sgst || 0),
    igst: Number(r.igst || 0),
    total: Number(r.total || 0),
  }));

  const handleGenerate = () => {
    setGenerated(true);
    if (generated) refetch();
  };

  const totalTaxable = normalizedRows.reduce(
    (s, r) => s + r.t0 + r.t5 + r.t12 + r.t18 + r.t28,
    0,
  );
  const totalCGST = normalizedRows.reduce((s, r) => s + r.cgst, 0);
  const totalSGST = normalizedRows.reduce((s, r) => s + r.sgst, 0);
  const totalIGST = normalizedRows.reduce((s, r) => s + r.igst, 0);
  const totalTax = totalCGST + totalSGST + totalIGST;
  const grandTotal = normalizedRows.reduce((s, r) => s + r.total, 0);

  const exportColumns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Invoice No', key: 'invoiceNo', width: 18 },
    { header: 'Customer GSTIN', key: 'customerGstin', width: 22 },
    { header: 'Customer', key: 'customer', width: 22 },
    { header: 'Taxable@0%', key: 't0', width: 14 },
    { header: 'Taxable@5%', key: 't5', width: 14 },
    { header: 'Taxable@12%', key: 't12', width: 14 },
    { header: 'Taxable@18%', key: 't18', width: 14 },
    { header: 'Taxable@28%', key: 't28', width: 14 },
    { header: 'CGST', key: 'cgst', width: 12 },
    { header: 'SGST', key: 'sgst', width: 12 },
    { header: 'IGST', key: 'igst', width: 12 },
    { header: 'Grand Total', key: 'total', width: 14 },
  ];

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
        <i className="ri-file-list-3-line text-green-600 text-sm" />
        <span className="text-xs font-medium text-green-700">
          Used for GSTR-1 filing preparation
        </span>
      </div>
      <div className="flex-1" />
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
    </div>
  );

  return (
    <ReportLayout
      title="GST Sales Register (GSTR-1)"
      subtitle="Taxable values grouped by GST rate slab — for GSTR-1 filing"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated}
      exportData={normalizedRows}
      exportColumns={exportColumns}
      exportFilename={`gst-sales-${from}-${to}`}
    >
      {generated && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Total Taxable',
                value: `₹${totalTaxable.toLocaleString('en-IN')}`,
                icon: 'ri-money-rupee-circle-line',
                color: 'bg-blue-50 text-blue-600',
              },
              {
                label: 'CGST Payable',
                value: `₹${totalCGST.toLocaleString('en-IN')}`,
                icon: 'ri-government-line',
                color: 'bg-indigo-50 text-[#4f46e5]',
              },
              {
                label: 'SGST Payable',
                value: `₹${totalSGST.toLocaleString('en-IN')}`,
                icon: 'ri-government-line',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                label: 'IGST Payable',
                value: `₹${totalIGST.toLocaleString('en-IN')}`,
                icon: 'ri-bank-line',
                color: 'bg-amber-50 text-amber-600',
              },
            ]}
          />
          <ReportTable
            keyField="id"
            data={normalizedRows}
            loading={isFetching}
            columns={[
              {
                header: 'Date',
                accessor: 'date',
                className: 'text-xs text-[#64748b]',
              },
              {
                header: 'Invoice No',
                accessor: 'invoiceNo',
                className: 'font-mono text-xs font-medium text-[#4f46e5]',
              },
              {
                header: 'Cust GSTIN',
                accessor: 'customerGstin',
                className: 'font-mono text-xs',
              },
              {
                header: 'Customer',
                accessor: 'customer',
                className: 'font-medium',
              },
              {
                header: 'Txbl@0%',
                accessor: (r) => formatINR(r.t0),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Txbl@5%',
                accessor: (r) => formatINR(r.t5),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Txbl@12%',
                accessor: (r) => formatINR(r.t12),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Txbl@18%',
                accessor: (r) => formatINR(r.t18),
                headerClassName: 'text-right',
                className: 'text-right font-medium',
              },
              {
                header: 'Txbl@28%',
                accessor: (r) => formatINR(r.t28),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'CGST',
                accessor: (r) => formatINR(r.cgst),
                headerClassName: 'text-right',
                className: 'text-right text-[#4f46e5]',
              },
              {
                header: 'SGST',
                accessor: (r) => formatINR(r.sgst),
                headerClassName: 'text-right',
                className: 'text-right text-violet-600',
              },
              {
                header: 'IGST',
                accessor: (r) => formatINR(r.igst),
                headerClassName: 'text-right',
                className: 'text-right text-amber-600',
              },
              {
                header: 'Total',
                accessor: (r) => (
                  <span className="font-bold">{`₹${r.total.toLocaleString('en-IN')}`}</span>
                ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
            ]}
            footerRow={
              <>
                <td colSpan={4} className="px-3 py-2.5 text-xs text-[#64748b]">
                  TOTAL ({normalizedRows.length} invoices)
                </td>
                {[
                  normalizedRows.reduce((s, r) => s + r.t0, 0),
                  normalizedRows.reduce((s, r) => s + r.t5, 0),
                  normalizedRows.reduce((s, r) => s + r.t12, 0),
                  normalizedRows.reduce((s, r) => s + r.t18, 0),
                  normalizedRows.reduce((s, r) => s + r.t28, 0),
                ].map((v, i) => (
                  <td key={i} className="px-3 py-2.5 text-right font-semibold">
                    {formatINR(v)}
                  </td>
                ))}
                <td className="px-3 py-2.5 text-right text-[#4f46e5] font-semibold">
                  {formatINR(totalCGST)}
                </td>
                <td className="px-3 py-2.5 text-right text-violet-600 font-semibold">
                  {formatINR(totalSGST)}
                </td>
                <td className="px-3 py-2.5 text-right text-amber-600 font-semibold">
                  {formatINR(totalIGST)}
                </td>
                <td className="px-3 py-2.5 text-right font-bold">{`₹${grandTotal.toLocaleString('en-IN')}`}</td>
              </>
            }
          />
          <div className="flex justify-end gap-6 bg-white border border-[#e2e8f0] rounded-xl px-6 py-3 text-sm">
            <div className="text-[#64748b]">
              Total Taxable:{' '}
              <strong className="text-[#1e293b]">
                {formatINR(totalTaxable)}
              </strong>
            </div>
            <div className="text-[#64748b]">
              Total GST Payable:{' '}
              <strong className="text-amber-600">{formatINR(totalTax)}</strong>
            </div>
            <div className="text-[#64748b]">
              Grand Total:{' '}
              <strong className="text-[#1e293b]">{`₹${grandTotal.toLocaleString('en-IN')}`}</strong>
            </div>
          </div>
        </>
      )}
      {!generated && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-receipt-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              GST Sales Register — for GSTR-1 filing preparation
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
