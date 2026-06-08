import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { useToast } from '@/contexts/ToastContext';
import { useWarehouseList } from '@/hooks/useWarehouses';
import {
  directStockEntryService,
  type DSEDetailResponse,
  type DSEListRow,
} from '@/services/directStockEntryService';
import { MODULES } from '@/utils/permissions';
import { useAuth } from '@/contexts/AuthContext';
import { useWarehouseStore } from '@/stores/warehouseStore';

const DSE_REASONS = [
  'Opening Stock',
  'Stock Audit Found',
  'Free Sample',
  'Goods Returned No Invoice',
  'Internal Transfer Found',
  'Other',
];

function getThreeMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  return d.toISOString().split('T')[0];
}

const today = () => new Date().toISOString().split('T')[0];

interface DSEItemView {
  id: string;
  itemName: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  total: number;
}

interface DSEEntryView {
  id: string;
  entryNumber: string;
  date: string;
  warehouseId: string;
  warehouseName: string;
  reason: string;
  referenceNo?: string;
  notes?: string;
  createdBy: string;
  items: DSEItemView[];
  totalItems: number;
  totalQty: number;
  totalValue: number;
}

const REASON_LABELS: Record<string, string> = {
  OPENING: 'Opening Stock',
  OPENING_STOCK: 'Opening Stock',
  STOCK_AUDIT_FOUND: 'Stock Audit Found',
  FREE_SAMPLE: 'Free Sample',
  GOODS_RETURNED_NO_INVOICE: 'Goods Returned No Invoice',
  INTERNAL_TRANSFER_FOUND: 'Internal Transfer Found',
  OTHER: 'Other',
};

const formatReason = (reason: string, customReason?: string | null): string => {
  const normalized = reason?.toUpperCase?.() || '';
  const label = REASON_LABELS[normalized] || reason || 'Other';
  if ((normalized === 'OTHER' || label === 'Other') && customReason) return customReason;
  return label;
};

const toDateOnly = (raw: string): string => {
  if (!raw) return '';
  return raw.includes('T') ? raw.split('T')[0] : raw;
};

const mapListRowToView = (row: DSEListRow): DSEEntryView => ({
  id: row.id,
  entryNumber: row.dse_number,
  date: toDateOnly(row.entry_date),
  warehouseId: row.warehouse_id,
  warehouseName: row.warehouse_name || 'Warehouse',
  reason: formatReason(row.reason, row.custom_reason),
  referenceNo: row.reference_no || undefined,
  notes: row.notes || undefined,
  createdBy: row.created_by_name || row.created_by,
  items: [],
  totalItems: Number(row.total_items || 0),
  totalQty: Number(row.total_qty || 0),
  totalValue: Number(row.total_value || 0),
});

const mapDetailToView = (detail: DSEDetailResponse): DSEEntryView => {
  const items = (detail.items || []).map((item) => {
    const qty = Number(item.quantity || 0);
    const rate = Number(item.rate || 0);
    return {
      id: item.id,
      itemName: item.item_name,
      hsnCode: item.item_code || '—',
      qty,
      unit: item.display_unit_name || 'Units',
      rate,
      total: qty * rate,
    };
  });

  return {
    id: detail.id,
    entryNumber: detail.dse_number,
    date: toDateOnly(detail.entry_date),
    warehouseId: detail.warehouse_id,
    warehouseName: detail.warehouse_name || 'Warehouse',
    reason: formatReason(detail.reason, detail.custom_reason),
    referenceNo: detail.reference_no || undefined,
    notes: detail.notes || undefined,
    createdBy: detail.created_by_name || 'User',
    items,
    totalItems: items.length,
    totalQty: Number(detail.total_qty || 0),
    totalValue: Number(detail.total_value || 0),
  };
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DSEDetailModal({ entry, onClose }: { entry: DSEEntryView; onClose: () => void }) {
  const handlePrint = () => {
    const rows = entry.items.map((item) => [
      item.itemName, item.hsnCode, String(item.qty), item.unit,
      `₹${item.rate.toLocaleString('en-IN')}`, `₹${item.total.toLocaleString('en-IN')}`,
    ]);
    const html = `
      <html><head><title>DSE ${entry.entryNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; }
        h2 { color: #1e293b; margin-bottom: 2px; font-size: 18px; }
        .meta { color: #64748b; font-size: 11px; margin-bottom: 16px; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; }
        .card-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 600; }
        .card-value { font-size: 13px; font-weight: 700; color: #1e293b; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #4f46e5; color: white; padding: 7px 10px; text-align: left; font-size: 11px; }
        td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) td { background: #f8f8ff; }
        .total-row td { font-weight: bold; background: #f1f5f9; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head>
      <body>
        <h2>Direct Stock Entry — ${entry.entryNumber}</h2>
        <div class="meta">Date: ${entry.date} | Warehouse: ${entry.warehouseName} | Created by: ${entry.createdBy}</div>
        <div class="grid">
          <div class="card"><div class="card-label">Reason</div><div class="card-value">${entry.reason}</div></div>
          <div class="card"><div class="card-label">Reference No</div><div class="card-value">${entry.referenceNo || '—'}</div></div>
          <div class="card"><div class="card-label">Total Items</div><div class="card-value">${entry.totalItems}</div></div>
          <div class="card"><div class="card-label">Total Value</div><div class="card-value">₹${entry.totalValue.toLocaleString('en-IN')}</div></div>
        </div>
        ${entry.notes ? `<p style="color:#64748b;font-size:11px;margin-bottom:12px;">Notes: ${entry.notes}</p>` : ''}
        <table>
          <thead><tr><th>#</th><th>Item Name</th><th>HSN</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Total</th></tr></thead>
          <tbody>
            ${rows.map((r, i) => `<tr><td>${i + 1}</td>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}
            <tr class="total-row"><td colspan="3">Total</td><td>${entry.totalQty}</td><td></td><td></td><td>₹${entry.totalValue.toLocaleString('en-IN')}</td></tr>
          </tbody>
        </table>
      </body></html>`;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <div>
            <h2 className="text-base font-bold text-[#1e293b]">{entry.entryNumber}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{entry.date} · {entry.warehouseName} · {entry.createdBy}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Reason', value: entry.reason },
              { label: 'Reference No', value: entry.referenceNo || '—' },
              { label: 'Total Items', value: String(entry.totalItems) },
              { label: 'Total Value', value: `₹${entry.totalValue.toLocaleString('en-IN')}` },
            ].map((c) => (
              <div key={c.label} className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">{c.label}</p>
                <p className="text-sm font-bold text-[#1e293b] mt-0.5">{c.value}</p>
              </div>
            ))}
          </div>
          {entry.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2 text-xs text-amber-700">
              <i className="ri-sticky-note-line mr-1" />{entry.notes}
            </div>
          )}

          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-[#e2e8f0]">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Items</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['#', 'Item Name', 'HSN', 'Qty', 'Unit', 'Rate', 'Total'].map((h) => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entry.items.map((item, i) => (
                  <tr key={item.id} className={`border-b border-slate-50 ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}>
                    <td className="px-3 py-2.5 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2.5 font-medium text-[#1e293b]">{item.itemName}</td>
                    <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">{item.hsnCode}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[#1e293b]">{item.qty}</td>
                    <td className="px-3 py-2.5 text-slate-500">{item.unit}</td>
                    <td className="px-3 py-2.5 text-right text-slate-600">₹{item.rate.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-[#1e293b]">₹{item.total.toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-[#e2e8f0]">
                <tr>
                  <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold text-slate-500">Total</td>
                  <td className="px-3 py-2.5 text-right font-bold text-[#1e293b]">{entry.totalQty}</td>
                  <td colSpan={2} />
                  <td className="px-3 py-2.5 text-right font-bold text-[#4f46e5]">₹{entry.totalValue.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center justify-end gap-2">
          <button type="button" onClick={handlePrint} className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#1e293b] hover:bg-slate-50 cursor-pointer whitespace-nowrap">
            <i className="ri-printer-line" />Print
          </button>
          <button type="button" onClick={onClose} className="h-9 px-4 rounded-lg bg-[#4f46e5] text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockEntriesPage() {
  const navigate = useNavigate();
  const toast = useToast();
    const { selectedWarehouseId } = useWarehouseStore();
  const [fromDate, setFromDate] = useState(getThreeMonthsAgo());
  const [toDate, setToDate] = useState(today());
  const [reasonFilter, setReasonFilter] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [search, setSearch] = useState('');
  const [entries, setEntries] = useState<DSEEntryView[]>([]);
  const [selected, setSelected] = useState<DSEEntryView | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const { data: warehousePage } = useWarehouseList({ limit: 200 });

  const {hasPermission, hasControl} = useAuth();
  const canReceiveStock = hasPermission(MODULES.STOCK_RECEIVING, 'create');
    const canExport = hasControl('exportData');

  useEffect(() => {
    const loadEntries = async () => {
      setLoading(true);
      try {
        const response = await directStockEntryService.list({
          page: 1,
          limit: 200,
          warehouse_id:
            selectedWarehouseId && selectedWarehouseId !== 'ALL'
              ? selectedWarehouseId
              : undefined,
          reason: reasonFilter || undefined,
          from_date: fromDate || undefined,
          to_date: toDate || undefined,
        });

        setEntries(response.data.map(mapListRowToView));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load direct stock entries';
        toast.error(message);
        setEntries([]);
      } finally {
        setLoading(false);
      }
    };

    void loadEntries();
  }, [fromDate, toDate, reasonFilter, selectedWarehouseId, toast]);

  const handleOpenEntry = async (entryId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await directStockEntryService.getById(entryId);
      setSelected(mapDetailToView(detail));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load entry details';
      toast.error(message);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (search) {
        const s = search.toLowerCase();
        if (!e.entryNumber.toLowerCase().includes(s) && !e.reason.toLowerCase().includes(s) && !e.warehouseName.toLowerCase().includes(s)) {
          return false;
        }
      }
      return true;
    });
  }, [entries, search]);

  const totalEntries = filtered.length;
  const thisMonth = filtered.filter((e) => {
    const d = new Date(e.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const totalValue = filtered.reduce((s, e) => s + e.totalValue, 0);

  const reasonOptions = useMemo(() => {
    const dynamic = Array.from(new Set(entries.map((entry) => entry.reason))).filter(Boolean);
    const merged = [...DSE_REASONS, ...dynamic];
    return Array.from(new Set(merged));
  }, [entries]);

  const warehouseOptions = useMemo(() => {
    const fromApi = (warehousePage?.items || []).map((warehouse) => ({ id: warehouse.id, name: warehouse.name }));
    const fromEntries = entries.map((entry) => ({ id: entry.warehouseId, name: entry.warehouseName }));
    return Array.from(new Map([...fromApi, ...fromEntries].map((option) => [option.id, option])).values());
  }, [warehousePage, entries]);

  const exportCols = [
    { header: 'Entry No', key: 'entryNumber', width: 18 },
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Reason', key: 'reason', width: 24 },
    { header: 'Warehouse', key: 'warehouseName', width: 20 },
    { header: 'Items', key: 'totalItems', width: 10 },
    { header: 'Total Qty', key: 'totalQty', width: 12 },
    { header: 'Value', key: 'totalValue', width: 16 },
    { header: 'Created By', key: 'createdBy', width: 18 },
  ];

  const exportData = filtered.map((e) => ({
    entryNumber: e.entryNumber,
    date: e.date,
    reason: e.reason,
    warehouseName: e.warehouseName,
    totalItems: e.totalItems,
    totalQty: e.totalQty,
    totalValue: e.totalValue,
    createdBy: e.createdBy,
  }));

  const REASON_COLORS: Record<string, string> = {
    'Opening Stock': 'bg-indigo-50 text-indigo-700',
    'Stock Audit Found': 'bg-emerald-50 text-emerald-700',
    'Free Sample': 'bg-amber-50 text-amber-700',
    'Goods Returned No Invoice': 'bg-orange-50 text-orange-700',
    'Internal Transfer Found': 'bg-teal-50 text-teal-700',
    'Other': 'bg-slate-100 text-slate-600',
  };

  return (
    <AppLayout>
      <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
        {/* Header */}
        <div className="bg-white border-b border-[#e2e8f0] px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-[#1e293b]">Direct Stock Entries</h1>
            <p className="text-xs text-slate-500 mt-0.5">Stock added without supplier invoice</p>
          </div>
          { canReceiveStock && (
            <button
              type="button"
              onClick={() => navigate('/inventory/receiving')}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-add-line" />New Entry
          </button>)}
        </div>

        <div className="p-6 space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Entries', value: totalEntries, icon: 'ri-file-list-3-line', color: 'bg-indigo-50 text-[#4f46e5]' },
              { label: 'This Month', value: thisMonth, icon: 'ri-calendar-line', color: 'bg-emerald-50 text-emerald-600' },
              { label: 'Total Value Added', value: `₹${totalValue.toLocaleString('en-IN')}`, icon: 'ri-money-rupee-circle-line', color: 'bg-amber-50 text-amber-600' },
            ].map((c) => (
              <div key={c.label} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-4">
                <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${c.color}`}>
                  <i className={`${c.icon} text-lg`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{c.label}</p>
                  <p className="text-xl font-bold text-[#1e293b]">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">From Date</label>
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">To Date</label>
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] bg-white" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Reason</label>
                <select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)} className="h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] bg-white cursor-pointer">
                  <option value="">All Reasons</option>
                  {reasonOptions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {/* <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Warehouse</label>
                <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="h-9 px-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] bg-white cursor-pointer">
                  <option value="">All Warehouses</option>
                  {warehouseOptions.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div> */}
              <div className="flex-1 min-w-[180px]">
                <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
                <div className="relative">
                  <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Entry no, reason..." className="w-full h-9 pl-8 pr-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] bg-white" />
                </div>
              </div>
              {canExport && (<div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => exportToExcel(exportData as Record<string, unknown>[], exportCols, `DSE-Report-${fromDate}-${toDate}`)}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap disabled:opacity-40"
                >
                  <i className="ri-file-excel-line text-emerald-600" />Excel
                </button>
                <button
                  type="button"
                  onClick={() => exportToPDF(exportData as Record<string, unknown>[], exportCols, 'Direct Stock Entries Report', `DSE-Report-${fromDate}-${toDate}`, `${fromDate} to ${toDate}`)}
                  disabled={filtered.length === 0}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap disabled:opacity-40"
                >
                  <i className="ri-file-pdf-line text-red-500" />PDF
                </button>
              </div>)}
            </div>
            <p className="text-xs text-slate-400 mt-3">Showing {filtered.length} of {entries.length} entries</p>
          </div>

          {/* Table */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Entry No', 'Date', 'Reason', 'Warehouse', 'Items', 'Total Qty', 'Value', 'Created By'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                      <i className="ri-loader-4-line text-4xl block mb-2 animate-spin text-slate-300" />
                      Loading entries...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center text-slate-400">
                      <i className="ri-inbox-line text-4xl block mb-2 text-slate-200" />
                      No entries found
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry, i) => (
                    <tr
                      key={entry.id}
                      className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}
                      onClick={() => void handleOpenEntry(entry.id)}
                    >
                      <td className="px-4 py-3 font-semibold text-[#4f46e5]">{entry.entryNumber}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.date}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${REASON_COLORS[entry.reason] ?? 'bg-slate-100 text-slate-600'}`}>
                          {entry.reason}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{entry.warehouseName}</td>
                      <td className="px-4 py-3 text-center">{entry.totalItems}</td>
                      <td className="px-4 py-3 text-right font-medium">{entry.totalQty}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1e293b]">₹{entry.totalValue.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-500">{entry.createdBy}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {loadingDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="rounded-xl bg-white px-6 py-4 text-sm font-medium text-slate-600">
            <i className="ri-loader-4-line mr-2 animate-spin" />Loading entry details...
          </div>
        </div>
      )}

      {selected && <DSEDetailModal entry={selected} onClose={() => setSelected(null)} />}
    </AppLayout>
  );
}
