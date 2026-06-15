import { useState } from 'react';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import ReportTable from '@/pages/reports/components/ReportTable';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { useWarehouseStore } from '@/stores/warehouseStore';
 
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
 
export const useGSTPurchase = (from: string, to: string, warehouseId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['gst-purchase', from, to, warehouseId],
    queryFn: async () => {
      const res = await axios.get(
        'http://localhost:7000/api/v1/reports/gst-purchase',
        {
          params: { from, to, warehouseId: warehouseId || undefined },
        },
      );
      console.log(res.data.data);
 
      return res.data.data; // ✅ FIX: return rows only
    },
    enabled, // only run when Generate clicked
  });
};
 
function formatINR(n: number) {
  return n > 0 ? `₹${n.toLocaleString('en-IN')}` : '—';
}
 
function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
 
export default function GSTPurchaseReport() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState(today);
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId = selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : '';
  const [generated, setGenerated] = useState(false);
  const {
    data = [],
    isFetching,
    refetch,
  } = useGSTPurchase(from, to, warehouseId, generated);

  const handleGenerate = () => {
    setGenerated(true);
    if (generated) refetch();
  };

  const toNum = (val) => parseFloat(val) || 0;

  const totalTaxable = data.reduce(
    (s, r) =>
      s +
      toNum(r.t0) +
      toNum(r.t5) +
      toNum(r.t12) +
      toNum(r.t18) +
      toNum(r.t28),
    0,
  );

  const totalCGST = data.reduce((s, r) => s + toNum(r.cgst), 0);

  const totalSGST = data.reduce((s, r) => s + toNum(r.sgst), 0);

  const totalIGST = data.reduce((s, r) => s + toNum(r.igst), 0);

  const totalTax = totalCGST + totalSGST + totalIGST;

  const grandTotal = data.reduce((s, r) => s + toNum(r.total), 0);

  const exportColumns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Invoice No', key: 'invoiceNo', width: 18 },
    { header: 'Supplier GSTIN', key: 'supplierGstin', width: 22 },
    { header: 'Supplier', key: 'supplier', width: 22 },
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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
        <i className="ri-file-list-3-line text-amber-600 text-sm" />
        <span className="text-xs font-medium text-amber-700">
          Used for GST filing — GSTR-2A / 2B reconciliation
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
      title="GST Purchase Register"
      subtitle="Taxable values grouped by GST rate slab — for GSTR-2A/2B reconciliation"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated}
      exportData={data as unknown as Record<string, unknown>[]}
      exportColumns={exportColumns}
      exportFilename={`gst-purchase-${from}-${to}`}
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
                label: 'CGST',
                value: `₹${totalCGST.toLocaleString('en-IN')}`,
                icon: 'ri-government-line',
                color: 'bg-indigo-50 text-[#4f46e5]',
              },
              {
                label: 'SGST',
                value: `₹${totalSGST.toLocaleString('en-IN')}`,
                icon: 'ri-government-line',
                color: 'bg-violet-50 text-violet-600',
              },
              {
                label: 'IGST',
                value: `₹${totalIGST.toLocaleString('en-IN')}`,
                icon: 'ri-bank-line',
                color: 'bg-amber-50 text-amber-600',
              },
            ]}
          />
          <ReportTable
            keyField="id"
            data={data}
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
              // In your GSTPurchaseReport.tsx column
              {
                header: 'Supplier GSTIN',
                accessor: (r) =>
                  r.supplierGstin ? (
                    <span className="font-mono text-xs">{r.supplierGstin}</span>
                  ) : (
                    <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                      Unregistered
                    </span>
                  ),
                className: 'font-mono text-xs',
              },
              {
                header: 'Supplier',
                accessor: 'supplier',
                className: 'font-medium',
              },
              {
                header: 'Taxable@0%',
                accessor: (r) => formatINR(r.t0),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Taxable@5%',
                accessor: (r) => formatINR(r.t5),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Taxable@12%',
                accessor: (r) => formatINR(r.t12),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Taxable@18%',
                accessor: (r) => formatINR(r.t18),
                headerClassName: 'text-right',
                className: 'text-right font-medium',
              },
              {
                header: 'Taxable@28%',
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
                  TOTAL ({data.length} invoices)
                </td>
                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(data.reduce((s, r) => s + r.t0, 0))}
                </td>
                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(data.reduce((s, r) => s + r.t5, 0))}
                </td>
                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(data.reduce((s, r) => s + r.t12, 0))}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold">
                  {formatINR(data.reduce((s, r) => s + r.t18, 0))}
                </td>
                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(data.reduce((s, r) => s + r.t28, 0))}
                </td>
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
              Total Tax (ITC Available):{' '}
              <strong className="text-green-600">{formatINR(totalTax)}</strong>
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
              GST Purchase Register — for GSTR-2 filing preparation
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
