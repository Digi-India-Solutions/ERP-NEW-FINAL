import { useState, useEffect } from 'react';
import ReportLayout from '@/pages/reports/components/ReportLayout';
import ReportTable from '@/pages/reports/components/ReportTable';
import SummaryCards from '@/pages/reports/components/SummaryCards';
import { filterItems } from '@/api/item.api';
import { useWarehouseStore } from '@/stores/warehouseStore';
import axios from 'axios';

export const getStockLedgerApi = async (params) => {
  const token = localStorage.getItem('token');

  const res = await axios.get(
    'https://asvapi.digiindiasolutions.com/api/v1/reports/stock-ledger',
    {
      params,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  console.log('Stock Ledger API Response:', res.data); // ✅ LOGGING
  return res.data;
};

function formatINR(n: any) {
  const num = Number(n || 0);
  return `₹${num.toLocaleString('en-IN')}`;
}

function getFirstDayOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

export default function StockLedgerReport() {
  const today = new Date().toISOString().split('T')[0];
  const [itemId, setItemId] = useState('');
  const { selectedWarehouseId } = useWarehouseStore();
  const warehouseId = selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : '';
  const [from, setFrom] = useState(getFirstDayOfMonth());
  const [to, setTo] = useState(today);
  const [generated, setGenerated] = useState(false);
  const [items, setItems] = useState([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const warehouseIdToUse = selectedWarehouseId && selectedWarehouseId !== 'ALL' ? selectedWarehouseId : '';
        if (!warehouseIdToUse) {
          setItems([]);
          setItemId('');
          return;
        }
        const res = await filterItems({ warehouseId: warehouseIdToUse });
        setItems(Array.isArray(res?.data) ? res.data : []);
        setItemId(prev => {
          const exists = (res?.data || []).some(item => item.id === prev);
          return exists ? prev : '';
        });
      } catch (err) {
        console.error('Failed to load items', err);
        setItems([]);
        setItemId('');
      }
    };
    loadItems();
  }, [selectedWarehouseId]);

  const canGenerate = !!itemId && !!warehouseId;

  const fetchStockLedger = async () => {
    if (!canGenerate) return;

    try {
      setIsFetching(true);

      const res = await getStockLedgerApi({
        itemId,
        warehouseId,
        from,
        to,
      });

      const normalized = (res?.data || []).map((r: any) => ({
        ...r,
        inQty: Number(r.in_qty || 0),
        outQty: Number(r.out_qty || 0),
        balance: Number(r.balance || 0),
        rate: Number(r.rate || 0),
        value: Number(r.value || 0),
      }));

      setLedger(normalized);

      setOpeningBalance(res?.openingBalance || 0);
    } catch (err) {
      console.error('Stock ledger fetch failed:', err);
      setLedger([]);
      setOpeningBalance(0);
    } finally {
      setIsFetching(false);
    }
  };

  const handleGenerate = () => {
    if (!canGenerate) return;

    setGenerated(true);
    fetchStockLedger();
  };

  const closingBalance =
    ledger.length > 0 ? ledger[ledger.length - 1].balance || 0 : openingBalance;

  const totalIn = ledger.reduce((s, r) => s + Number(r.inQty || 0), 0);
  const totalOut = ledger.reduce((s, r) => s + Number(r.outQty || 0), 0);

  const exportColumns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Voucher Type', key: 'voucherType', width: 16 },
    { header: 'Voucher No', key: 'voucherNo', width: 18 },
    { header: 'Party', key: 'party', width: 22 },
    { header: 'In Qty', key: 'inQty', width: 10 },
    { header: 'Out Qty', key: 'outQty', width: 10 },
    { header: 'Balance', key: 'balance', width: 10 },
    { header: 'Rate', key: 'rate', width: 12 },
    { header: 'Value', key: 'value', width: 16 },
  ];

  const selectedItem = items.find((i: any) => i.id === itemId);

  const filterBar = (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Item <span className="text-red-500">*</span>
        </label>
        <select
          value={itemId}
          onChange={(e) => setItemId(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5] min-w-[200px]"
        >
          <option value="">-- Select Item --</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.code} — {item.name}
            </option>
          ))}
        </select>
      </div>
      {/* <div>
        <label className="block text-xs font-medium text-[#64748b] mb-1">
          Warehouse <span className="text-red-500">*</span>
        </label>
        <select
          value={warehouseId}
          onChange={(e) => setWarehouseId(e.target.value)}
          className="h-8 px-2 border border-[#e2e8f0] rounded-lg text-sm bg-white text-[#1e293b] cursor-pointer focus:outline-none focus:border-[#4f46e5]"
        >
          <option value="">-- Select Warehouse --</option>
          {warehouses.map((w: any) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>
      </div> */}
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

  const VOUCHER_COLORS: Record<string, string> = {
    Opening: 'bg-slate-100 text-slate-600',
    Purchase: 'bg-green-100 text-green-700',
    Sale: 'bg-blue-100 text-blue-700',
    'Sale Return': 'bg-indigo-100 text-indigo-700',
    'Purchase Return': 'bg-orange-100 text-orange-700',
    'Transfer In': 'bg-teal-100 text-teal-700',
    'Transfer Out': 'bg-purple-100 text-purple-700',
    'Adj-In': 'bg-cyan-100 text-cyan-700',
    'Adj-Out': 'bg-rose-100 text-rose-700',
  };

  return (
    <ReportLayout
      title="Stock Ledger"
      subtitle={
        selectedItem
          ? `${selectedItem.name} (${selectedItem.code})`
          : 'Select item and warehouse to view movement history'
      }
      filterBar={filterBar}
      onGenerate={handleGenerate}
      generating={isFetching}
      generated={generated && canGenerate}
      exportData={ledger as unknown as Record<string, unknown>[]}
      exportColumns={exportColumns}
      exportFilename={`stock-ledger-${itemId}`}
    >
      {generated && canGenerate && (
        <>
          <SummaryCards
            cards={[
              {
                label: 'Opening Balance',
                value: `${openingBalance} ${selectedItem?.unitName ?? ''}`,
                icon: 'ri-archive-line',
                color: 'bg-slate-100 text-slate-600',
              },
              {
                label: 'Total Inward',
                value: `+${totalIn}`,
                icon: 'ri-arrow-down-circle-line',
                color: 'bg-green-50 text-green-600',
              },
              {
                label: 'Total Outward',
                value: `-${totalOut}`,
                icon: 'ri-arrow-up-circle-line',
                color: 'bg-red-50 text-red-500',
              },
              {
                label: 'Closing Balance',
                value: `${closingBalance} ${selectedItem?.unitName ?? ''}`,
                icon: 'ri-stack-line',
                color: 'bg-indigo-50 text-[#4f46e5]',
              },
            ]}
          />
          <ReportTable
            keyField="id"
            data={ledger}
            loading={isFetching}
            columns={[
              {
                header: 'Date',
                accessor: 'date',
                className: 'text-xs text-[#64748b]',
              },
              {
                header: 'Voucher Type',
                accessor: (r) => {
                  const cls =
                    VOUCHER_COLORS[r.voucherType] ??
                    'bg-slate-100 text-slate-600';
                  return (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${cls}`}
                    >
                      {r.voucherType}
                    </span>
                  );
                },
              },
              {
                header: 'Voucher No',
                accessor: 'voucherNo',
                className: 'font-mono text-xs',
              },
              {
                header: 'Source',
                accessor: (r) => (
                  <span className="text-xs text-[#64748b]">
                    {(r as unknown as { source?: string }).source ?? r.party}
                  </span>
                ),
              },
              {
                header: 'In Qty',
                accessor: (r) =>
                  r.inQty > 0 ? (
                    <span className="text-green-600 font-semibold">
                      +{r.inQty}
                    </span>
                  ) : (
                    <span className="text-[#94a3b8]">—</span>
                  ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'Out Qty',
                accessor: (r) =>
                  r.outQty > 0 ? (
                    <span className="text-red-500 font-semibold">
                      -{r.outQty}
                    </span>
                  ) : (
                    <span className="text-[#94a3b8]">—</span>
                  ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'Balance',
                accessor: (r) => (
                  <span className="font-bold text-[#1e293b]">{r.balance}</span>
                ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
              {
                header: 'Rate',
                accessor: (r) => formatINR(r.rate),
                headerClassName: 'text-right',
                className: 'text-right text-[#64748b]',
              },
              {
                header: 'Value',
                accessor: (r) => (
                  <span className="font-medium">{formatINR(r.value)}</span>
                ),
                headerClassName: 'text-right',
                className: 'text-right',
              },
            ]}
            footerRow={
              <>
                <td colSpan={4} className="px-3 py-2.5 text-xs text-[#64748b]">
                  Closing Balance
                </td>
                <td className="px-3 py-2.5 text-right text-green-600">
                  +{totalIn}
                </td>
                <td className="px-3 py-2.5 text-right text-red-500">
                  -{totalOut}
                </td>
                <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">
                  {closingBalance}
                </td>
                <td colSpan={2} />
              </>
            }
          />
        </>
      )}
      {(!generated || !canGenerate) && (
        <div className="bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center py-24">
          <div className="text-center text-[#64748b]">
            <i className="ri-file-list-3-line text-5xl text-slate-200 block mb-3" />
            <p className="text-sm font-medium">
              Select an item and warehouse to view its stock movement history
            </p>
          </div>
        </div>
      )}
    </ReportLayout>
  );
}
