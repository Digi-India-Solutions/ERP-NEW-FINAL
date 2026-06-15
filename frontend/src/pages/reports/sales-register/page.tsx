import { useState, useEffect } from 'react';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import ReportTable from '@/pages/reports/components/ReportTable';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { filterParties } from '@/api/party.api';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
 
type Params = {
  from: string;
  to: string;
  customerId?: string;
  warehouseId?: string;
};
 
export const useSalesRegister = (
  from: string,
  to: string,
  customerId: string,
  warehouseId: string,
  enabled: boolean,
) => {
  return useQuery({
    queryKey: ['sales-register', from, to, customerId, warehouseId],
 
    queryFn: async () => {
      const params: Params = { from, to };
 
      if (customerId) {
        params.customerId = customerId;
      }
      if (warehouseId) {
        params.warehouseId = warehouseId;
      }
 
      const res = await axios.get(
        'http://localhost:7001/api/v1/reports/sales-register',
        {
          params,
        },
      );
 
      // ✅ IMPORTANT: return full response (data + summary)
      console.log(res.data);
      return res.data;
    },
 
    enabled, // runs only after Generate clicked
  });
};
 
function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}
 
function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}
 
const PAYMENT_BADGE: Record<string, string> = {
  PAID: 'bg-green-100 text-green-700',
  UNPAID: 'bg-red-100 text-red-600',
  PARTIAL: 'bg-amber-100 text-amber-700',
};
 
export default function SalesRegisterReport() {
  const today = new Date().toISOString().split('T')[0];
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState(today);
  const [customerId, setCustomerId] = useState('');
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId = selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : '';
  const [generated, setGenerated] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
 
  const { data, isFetching, refetch } = useSalesRegister(
    from,
    to,
    customerId,
    warehouseId,
    generated,
  );
 
  const rows = data?.data || [];
  const summary = data?.summary || {};
 
  const handleGenerate = () => {
    setGenerated(true);
    refetch();
  };
 
  const active = rows.filter((r) => r.paymentStatus !== 'CANCELLED');
  const totalTaxable = active.reduce(
    (s, r) => s + Number(r.taxableAmount || 0),
    0,
  );
 
  const totalTax = active.reduce((s, r) => s + Number(r.totalTax || 0), 0);
 
  const totalAmount = active.reduce((s, r) => s + Number(r.grandTotal || 0), 0);
 
  const cashSales = active
    .filter((r) => r.paymentMode === 'CASH')
    .reduce((s, r) => s + Number(r.grandTotal || 0), 0);
 
  const creditSales = active
    .filter((r) => r.paymentMode === 'CREDIT')
    .reduce((s, r) => s + Number(r.grandTotal || 0), 0);
 
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const res = await filterParties({
          type: 'Customer',
          isActive: true,
          warehouse_id: warehouseId || undefined,
        });
        const list = res?.data || [];
        setCustomers(list);
        setCustomerId((prev) => {
          const exists = list.some((p: any) => p.id === prev);
          return exists ? prev : '';
        });
      } catch (err) {
        console.error('Failed to load customers', err);
        setCustomers([]);
      }
    };
    loadCustomers();
  }, [warehouseId]);

  const exportColumns = [
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Invoice No', key: 'invoiceNo', width: 18 },
    { header: 'Customer', key: 'customer', width: 24 },
    { header: 'Items', key: 'itemCount', width: 8 },
    { header: 'Taxable', key: 'taxableAmount', width: 14 },
    { header: 'CGST', key: 'cgst', width: 12 },
    { header: 'SGST', key: 'sgst', width: 12 },
    { header: 'IGST', key: 'igst', width: 12 },
    { header: 'Total Tax', key: 'totalTax', width: 12 },
    { header: 'Grand Total', key: 'grandTotal', width: 14 },
    { header: 'Payment', key: 'paymentStatus', width: 12 },
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
          Customer
        </label>
        <select
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5] min-w-[180px]"
        >
          <option value="">All Customers</option>
          {customers.map((p) => (
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
      title="Sales Register"
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
      exportFilename={`sales-register-${from}-${to}`}
    >
      {generated && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Total Sales',
                value: formatINR(totalAmount),
                icon: 'ri-bar-chart-2-line',
                color: 'bg-green-50 text-green-600',
              },
              {
                label: 'Total Tax (GST)',
                value: formatINR(totalTax),
                icon: 'ri-government-line',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                label: 'Cash Sales',
                value: formatINR(cashSales),
                icon: 'ri-cash-line',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                label: 'Credit Sales',
                value: formatINR(creditSales),
                icon: 'ri-bank-card-line',
                color: 'bg-indigo-50 text-[#4f46e5]',
              },
            ]}
          />
          <ReportTable
            keyField="id"
            data={rows}
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
                header: 'Customer',
                accessor: 'customer',
                className: 'font-medium max-w-[160px] truncate',
              },
              {
                header: 'Items',
                accessor: 'itemCount',
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Taxable',
                accessor: (r) => formatINR(r.taxableAmount),
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'CGST',
                accessor: (r) => (r.cgst > 0 ? formatINR(r.cgst) : '—'),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'SGST',
                accessor: (r) => (r.sgst > 0 ? formatINR(r.sgst) : '—'),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'IGST',
                accessor: (r) => (r.igst > 0 ? formatINR(r.igst) : '—'),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Total Tax',
                accessor: (r) => formatINR(r.totalTax),
                headerClassName: 'text-right',
                className: 'text-right text-amber-700 font-medium',
              },
              {
                header: 'Grand Total',
                accessor: (r) => (
                  <span className="font-bold">{formatINR(r.grandTotal)}</span>
                ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'Payment',
                accessor: (r) => (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${PAYMENT_BADGE[r.paymentStatus] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {r.paymentStatus}
                  </span>
                ),
              },
            ]}
            footerRow={
              <>
                <td colSpan={4} className="px-3 py-2.5 text-xs text-[#64748b]">
                  TOTAL ({active.length} invoices)
                </td>
                <td className="px-3 py-2.5 text-right font-semibold">
                  {formatINR(totalTaxable)}
                </td>
                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(
                    active.reduce((s, r) => s + Number(r.cgst || 0), 0),
                  )}
                </td>
                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(
                    active.reduce((s, r) => s + Number(r.sgst || 0), 0),
                  )}
                </td>
                <td className="px-3 py-2.5 text-right text-[#64748b]">
                  {formatINR(
                    active.reduce((s, r) => s + Number(r.igst || 0), 0),
                  )}
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
            <i className="ri-shopping-cart-2-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              Select date range and click Generate Report
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
