import { useState, useEffect } from 'react';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import ReportTable from '@/pages/reports/components/ReportTable';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { useStockSummary } from '@/hooks/useReports';
import { useWarehouseStore } from '@/stores/warehouseStore';

import axios from 'axios';

export const getStockSummaryApi = async (
  warehouseId?: string,
  categoryId?: string,
) => {
  try {
    const token = localStorage.getItem('token');

    const res = await axios.get(
      'http://localhost:7000/api/v1/reports/stock-summary',
      {
        params: { warehouseId, categoryId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return res?.data?.data ?? []; // ✅ ALWAYS array
  } catch (err) {
    console.error('Stock Summary API Error:', err);
    return []; // ✅ NEVER undefined
  }
};

export const getCategories = async () => {
  const token = localStorage.getItem('token');

  const res = await axios.get('http://localhost:7000/api/v1/categories/all', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data.data;
};

type StockStatus = 'NORMAL' | 'LOW' | 'CRITICAL';

function formatINR(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

const STATUS_META: Record<StockStatus, { label: string; cls: string }> = {
  NORMAL: { label: 'Normal', cls: 'bg-green-100 text-green-700' },
  LOW: { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700' },
  CRITICAL: { label: 'Critical', cls: 'bg-red-100 text-red-700' },
};

export default function StockSummaryReport() {
  const today = new Date().toISOString().split('T')[0];
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId =
    selectedWarehouseId && selectedWarehouseId !== 'ALL'
      ? selectedWarehouseId
      : '';
  const [categoryId, setCategoryId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [generated, setGenerated] = useState(false);
  const [categories, setCategories] = useState([]);

  const {
    data = [],
    isFetching,
    refetch,
  } = useStockSummary(warehouseId, categoryId, generated);

  useEffect(() => {
    const loadData = async () => {
      try {
        const c = await getCategories();
        setCategories(Array.isArray(c) ? c : []);
      } catch (err) {
        console.error('Failed to load filters', err);
      }
    };

    loadData();
  }, []);

  const handleGenerate = () => {
    setGenerated(true);
    refetch();
  };

  const filtered = data.filter((r) => {
    if (statusFilter === 'low')
      return r.status === 'LOW' || r.status === 'CRITICAL';
    if (statusFilter === 'critical') return r.status === 'CRITICAL';
    if (statusFilter === 'normal') return r.status === 'NORMAL';
    return true;
  });

  const groupedMap = new Map();

  filtered.forEach((row) => {
    const key = row.code;

    if (!groupedMap.has(key)) {
      groupedMap.set(key, {
        ...row,
        currentStock: Number(row.currentStock) || 0,
        stockValue: Number(row.stockValue) || 0,
        inQty: Number(row.inQty) || 0,
        outQty: Number(row.outQty) || 0,
      });
    } else {
      const existing = groupedMap.get(key);

      existing.currentStock += Number(row.currentStock) || 0;
      existing.stockValue += Number(row.stockValue) || 0;
      existing.inQty += Number(row.inQty) || 0;
      existing.outQty += Number(row.outQty) || 0;
    }
  });

  const groupedData = Array.from(groupedMap.values());
  const totalValue = groupedData.reduce(
    (sum, item) => sum + item.stockValue,
    0,
  );

  const lowCount = groupedData.filter(
    (r) => r.status === 'LOW' || r.status === 'CRITICAL',
  ).length;

  const exportColumns = [
    { header: 'Code', key: 'code', width: 14 },
    { header: 'Item Name', key: 'name', width: 28 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Unit', key: 'unit', width: 10 },
    { header: 'Opening', key: 'openingStock', width: 12 },
    { header: 'In Qty', key: 'inQty', width: 12 },
    { header: 'Out Qty', key: 'outQty', width: 12 },
    { header: 'Current Stock', key: 'currentStock', width: 14 },
    { header: 'Min Level', key: 'minLevel', width: 12 },
    { header: 'Stock Value', key: 'stockValue', width: 16 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      {/* <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Warehouse
        </label>
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5]"
        >
          <option value="">All Warehouses</option>
          {warehouses.map((w: any) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div> */}
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Category
        </label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5]"
        >
          <option value="">All Categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5]"
        >
          <option value="all">All Status</option>
          <option value="normal">Normal</option>
          <option value="low">Low Stock</option>
          <option value="critical">Critical</option>
        </select>
      </div>
    </div>
  );

  return (
    <ReportLayout
      title="Stock Summary Report"
      subtitle={`As of ${today} · All movement types included`}
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated}
      exportData={filtered as unknown as Record<string, unknown>[]}
      exportColumns={exportColumns}
      exportFilename="stock-summary"
    >
      {generated && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Total Items',
                value: filtered.length,
                icon: 'ri-box-3-line',
                color: 'bg-indigo-50 text-[#4f46e5]',
              },
              {
                label: 'Total Stock Value',
                value: formatINR(totalValue),
                icon: 'ri-money-rupee-circle-line',
                color: 'bg-green-50 text-green-600',
              },
              {
                label: 'Low Stock Items',
                value: lowCount,
                icon: 'ri-alert-line',
                color:
                  lowCount > 0
                    ? 'bg-red-50 text-red-500'
                    : 'bg-slate-100 text-slate-500',
                sub: lowCount > 0 ? 'Needs reorder' : 'All good',
              },
              {
                label: 'Normal Stock Items',
                value: filtered.length - lowCount,
                icon: 'ri-checkbox-circle-line',
                color: 'bg-emerald-50 text-emerald-600',
              },
            ]}
          />
          <ReportTable
            keyField="id"
            data={groupedData}
            loading={isFetching}
            columns={[
              {
                header: 'Code',
                accessor: 'code',
                className: 'font-mono text-xs text-[#64748b]',
              },
              {
                header: 'Item Name',
                accessor: 'name',
                className: 'font-medium max-w-[180px] truncate',
              },
              {
                header: 'Category',
                accessor: 'category',
                className: 'text-xs text-[#64748b]',
              },
              {
                header: 'Unit',
                accessor: 'unit',
                className: 'text-xs text-[#64748b]',
              },
              {
                header: 'Opening',
                accessor: (r) => r.openingStock,
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'In',
                accessor: (r) => (
                  <span className="text-green-600 font-medium">+{r.inQty}</span>
                ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'Out',
                accessor: (r) => (
                  <span className="text-red-500 font-medium">-{r.outQty}</span>
                ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'Current',
                accessor: (r) => (
                  <span className="font-bold text-[#1e293b]">
                    {r.currentStock}
                  </span>
                ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'Min Level',
                accessor: 'minLevel',
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Stock Value',
                accessor: (r) => formatINR(r.stockValue),
                headerClassName: 'text-right',
                className: 'text-right font-medium',
              },
              {
                header: 'Status',
                accessor: (r) => {
                  const m = STATUS_META[r.status as StockStatus];
                  return (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${m.cls}`}
                    >
                      {m.label}
                    </span>
                  );
                },
              },
            ]}
            footerRow={
              <>
                <td colSpan={9} className="px-3 py-2.5 text-xs text-[#64748b]">
                  Total ({groupedData.length} items)
                </td>
                <td className="px-3 py-2.5 text-right">
                  {formatINR(totalValue)}
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
            <i className="ri-bar-chart-box-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              Select filters and click Generate Report
            </p>
            <p className="text-xs mt-1">
              Shows current stock levels for all items
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
