import { useState, useEffect } from 'react';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import ReportTable from '@/pages/reports/components/ReportTable';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { useQuery } from '@tanstack/react-query';
import { useWarehouseStore } from '@/stores/warehouseStore';

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

import axios from 'axios';

const BASE = 'http://localhost:7001/api/v1/reports';

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});

export const getLowStockApi = async (warehouseId?: string) => {
  const res = await axios.get(`${BASE}/low-stock`, {
    params: { warehouseId },
    headers: authHeaders(),
  });
  return res.data?.data ?? [];
};

export const useLowStock = (warehouseId: string, enabled: boolean) => {
  return useQuery({
    queryKey: ['low-stock', warehouseId],
    queryFn: () => getLowStockApi(warehouseId || undefined),
    enabled,
    staleTime: 0,
  });
};

export default function LowStockReport() {
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId = selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : '';
  const [generated, setGenerated] = useState(false);
  const { data = [], isFetching } = useLowStock(warehouseId, generated);

  const handleGenerate = () => {
    setGenerated(true);
  };

  const totalShortage = data.reduce((s, r) => s + Number(r.shortage || 0), 0);

  const reorderValue = data.reduce(
    (s, r) => s + (r.shortage || 0) * (r.lastPurchaseRate || 0),
    0,
  );

  const criticalItems = data.filter((r) => r.currentStock === 0).length;

  const exportColumns = [
    { header: 'Code', key: 'code', width: 14 },
    { header: 'Item Name', key: 'name', width: 28 },
    { header: 'Warehouse', key: 'warehouse', width: 20 },
    { header: 'Current Stock', key: 'currentStock', width: 14 },
    { header: 'Min Level', key: 'minLevel', width: 12 },
    { header: 'Shortage', key: 'shortage', width: 12 },
    { header: 'Last Purchase Rate', key: 'lastPurchaseRate', width: 18 },
    { header: 'Reorder Value', key: 'reorderValue', width: 16 },
  ];

  const exportData = data.map((r) => ({
    ...r,
    reorderValue: r.shortage * r.lastPurchaseRate,
  })) as unknown as Record<string, unknown>[];

  const filterBar = null;

  return (
    <ReportLayout
      title="Low Stock Alert"
      subtitle="Items where current stock is below minimum reorder level"
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated}
      exportData={exportData}
      exportColumns={exportColumns}
      exportFilename="low-stock-alert"
    >
      {generated && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Low Stock Items',
                value: data.length,
                icon: 'ri-alert-line',
                color:
                  data.length > 0
                    ? 'bg-red-50 text-red-500'
                    : 'bg-green-50 text-green-600',
                sub:
                  data.length > 0
                    ? 'Requires immediate attention'
                    : 'All items adequately stocked',
              },
              {
                label: 'Out of Stock',
                value: criticalItems,
                icon: 'ri-close-circle-line',
                color:
                  criticalItems > 0
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-500',
              },
              {
                label: 'Total Shortage',
                value: `${totalShortage} units`,
                icon: 'ri-subtract-line',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                label: 'Suggested Reorder Value',
                value: formatINR(reorderValue),
                icon: 'ri-shopping-cart-2-line',
                color: 'bg-indigo-50 text-[#4f46e5]',
              },
            ]}
          />
          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
              <i className="ri-error-warning-line text-red-500 text-base" />
              <span className="text-sm font-medium text-red-700">
                {data.length} item{data.length !== 1 ? 's' : ''} below minimum
                stock level — immediate reorder recommended
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                    {[
                      'Code',
                      'Item Name',
                      'Category',
                      'Warehouse',
                      'Current Stock',
                      'Min Level',
                      'Shortage',
                      'Last Purch. Rate',
                      'Reorder Value',
                      'Last Purchase',
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={`text-left px-3 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap ${i >= 4 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#fef2f2] bg-[#fffbfb] hover:bg-red-50 transition-colors"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-[#64748b]">
                        {r.code}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-[#1e293b] max-w-[160px] truncate">
                        {r.name}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[#64748b]">
                        {r.category}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[#64748b]">
                        {r.warehouse}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span
                          className={`font-bold ${r.currentStock === 0 ? 'text-red-600' : 'text-amber-600'}`}
                        >
                          {r.currentStock}
                        </span>
                        <span className="text-[#94a3b8] text-xs ml-1">
                          {r.unit}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#64748b]">
                        {r.minLevel}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                          {r.shortage}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right text-[#64748b]">
                        {formatINR(r.lastPurchaseRate)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-[#1e293b]">
                        {formatINR(r.shortage * r.lastPurchaseRate)}
                      </td>
                      <td className="px-3 py-2.5 text-right text-xs text-[#64748b]">
                        {r.lastPurchaseDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-[#f1f5f9] border-t-2 border-[#e2e8f0] font-semibold">
                    <td
                      colSpan={6}
                      className="px-3 py-2.5 text-xs text-[#64748b]"
                    >
                      Total ({data.length} items)
                    </td>
                    <td className="px-3 py-2.5 text-right text-red-600">
                      {totalShortage}
                    </td>
                    <td />
                    <td className="px-3 py-2.5 text-right">
                      {formatINR(reorderValue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
      {!generated && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-alert-line text-5xl text-red-200 block mb-3" />
            <p className="text-sm font-medium">
              Click Generate Report to see items below minimum stock level
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
