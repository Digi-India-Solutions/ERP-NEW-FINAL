import { useState, useCallback, useEffect } from 'react';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import { useToast } from '@/contexts/ToastContext';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useAuth } from '@/contexts/AuthContext';                         
import { transferService } from '@/services/transferService';
import { warehouseService } from '@/services/warehouseService';
import { itemService } from '@/services/itemService';
import { canApproveTransfer, MODULES } from '@/utils/permissions';
import type { TransferDTO, TransferDetailDTO, TransferItemPayload, ItemSearchResult, WarehouseDTO } from '@/api/types';
import TransferDetailModal from './transferdetail';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { getWarehousesForUser, getAllWarehouses } from '@/api/warehouse.api';
import { useLocation } from 'react-router-dom';

interface TransferRow { itemId: string; itemName: string; qty: number; searchQuery: string; }

const ST: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  COMPLETED: 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]',
  REJECTED:  'bg-red-50 text-red-700 border-red-200',
};

export default function StockTransferPage() {
  // ── Auth ────────────────────────────────────────────────────────────────
  const { user, hasPermission, hasControl } = useAuth();   // ← unified auth source

  // ── Permission flags ────────────────────────────────────────────────────
  const canCreate = hasPermission(MODULES.STOCK_TRANSFER, 'create');
  const canViewAll = hasControl('viewAllWarehouses');

  

  const toast = useToast();

  const [transfers, setTransfers]             = useState<TransferDTO[]>([]);
  const [warehouses, setWarehouses] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  const { selectedWarehouseId } = useWarehouseStore();
  const [availableItems, setAvailableItems]   = useState<ItemSearchResult[]>([]);
  const [activeItemSearchRow, setActiveItemSearchRow]         = useState<number | null>(null);
  const [activeItemSuggestionIndex, setActiveItemSuggestionIndex] = useState(0);
  const [mode, setMode]                       = useState<'list' | 'new'>('list');
  const [from, setFrom]                       = useState('');
  const [to, setTo]                           = useState('');
  const [date, setDate]                       = useState(new Date().toISOString().split('T')[0]);
  const [rows, setRows]                       = useState<TransferRow[]>([{ itemId: '', itemName: '', qty: 1, searchQuery: '' }]);
  const [saving, setSaving]                   = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [selectedTransferId, setSelectedTransferId]       = useState<string | null>(null);
  const [selectedTransferDetail, setSelectedTransferDetail] = useState<TransferDetailDTO | null>(null);
  const [loadingDetail, setLoadingDetail]     = useState(false);
 // ADD a separate state for all warehouses (destination):
const [allWarehouses, setAllWarehouses] = useState<Array<{ id: string; name: string; isActive: boolean }>>([]);
  // Whether the current user can approve transfers at all (control-level check,
  // independent of which specific transfer row is being evaluated)
  const userCanApproveAny = hasControl('approveStockTransfer');

  // ── Data loading ────────────────────────────────────────────────────────
 useEffect(() => {
  const fetchInitialData = async () => {
    try {
      setLoading(true);

      const [warehouseRes, allWarehouseRes, transferData] = await Promise.all([
        getAllWarehouses(),  // assigned only → for FROM
        getAllWarehouses(),                 // all → for TO
        transferService.getAllTransfers(),
      ]);

      const assignedItems = (warehouseRes.data ?? [])
        .filter((w) => w.is_active)
        .map((w) => ({ id: w.id, name: w.name, isActive: w.is_active }));

      const allItems = (allWarehouseRes.data ?? [])
        .filter((w) => w.is_active)
        .map((w) => ({ id: w.id, name: w.name, isActive: w.is_active }));

      setWarehouses(assignedItems);      // FROM dropdown
      setAllWarehouses(allItems);        // TO dropdown
      setTransfers(transferData);

    if (assignedItems.length > 0) {
      // global selected warehouse
      const defaultFrom =
        assignedItems.find((w) => w.id === selectedWarehouseId) ||
        assignedItems[0];

      setFrom(defaultFrom.id);

      // TO warehouse same nahi hona chahiye
      const firstTo = allItems.find((w) => w.id !== defaultFrom.id);

      if (firstTo) {
        setTo(firstTo.id);
      }
    }
    } catch (error) {
      toast.error('Failed to load warehouses and transfers');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
  fetchInitialData();
}, [toast, canViewAll, selectedWarehouseId]);

const location = useLocation();

useEffect(() => {
  const state = location.state as any;

  if (state?.fromInvoice) {
    const invoice = state.fromInvoice;

    // form open
    setMode('new');

    // rows prefill
    if (invoice.items?.length > 0) {
      setRows(
        invoice.items.map((item: any) => ({
          itemId: item.itemId,
          itemName: item.itemName,
          qty: item.qty || 1,
          searchQuery: item.itemName,
        })),
      );
    }
  }
}, [location.state]);

  // ── Item search (debounced, per focused row) ────────────────────────────
  useEffect(() => {
    const fetchItems = async () => {
      if (activeItemSearchRow === null) { setAvailableItems([]); setActiveItemSuggestionIndex(0); return; }
      const query = rows[activeItemSearchRow]?.searchQuery?.trim() || '';
      if (from && query.length >= 2) {
        try {
          const items = await itemService.search(query, from);
          setAvailableItems(items);
          setActiveItemSuggestionIndex(0);
        } catch (error) {
          console.error('Error fetching items:', error);
        }
      } else {
        setAvailableItems([]); setActiveItemSuggestionIndex(0);
      }
    };
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [from, rows, activeItemSearchRow]);

  useEffect(() => {
    if (activeItemSearchRow !== null && activeItemSearchRow >= rows.length) {
      setActiveItemSearchRow(null); setAvailableItems([]); setActiveItemSuggestionIndex(0);
    }
  }, [rows.length, activeItemSearchRow]);

  // ── Row helpers ─────────────────────────────────────────────────────────
  const addRow    = () => setRows((r) => [...r, { itemId: '', itemName: '', qty: 1, searchQuery: '' }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, j) => j !== i));
  const updateRow = (i: number, patch: Partial<TransferRow>) =>
    setRows((r) => r.map((row, j) => j === i ? { ...row, ...patch } : row));

  const focusTableCell = (rowIdx: number, field: 'item' | 'qty' | 'delete') => {
    const selectorMap = { item: '[data-transfer-item-search]', qty: '[data-transfer-qty]', delete: '[data-transfer-delete]' } as const;
    const cell = document.querySelectorAll<HTMLElement>(selectorMap[field])[rowIdx];
    cell?.focus();
    if (field === 'qty' && cell instanceof HTMLInputElement) setTimeout(() => cell.select(), 0);
  };

  const focusNextRow = (rowIdx: number, field: 'item' | 'qty' | 'delete') => {
    if (rowIdx === rows.length - 1) { addRow(); setTimeout(() => focusTableCell(rowIdx + 1, field), 50); return; }
    focusTableCell(rowIdx + 1, field);
  };

  const selectSuggestion = (rowIdx: number, suggestionIdx: number) => {
    const selected = availableItems[suggestionIdx] ?? availableItems[0];
    if (!selected) return;
    updateRow(rowIdx, { itemId: selected.id, itemName: selected.name, searchQuery: selected.name });
    setActiveItemSearchRow(null); setAvailableItems([]); setActiveItemSuggestionIndex(0);
    setTimeout(() => focusTableCell(rowIdx, 'qty'), 0);
  };

  const handleTableKeyDown = (e: React.KeyboardEvent<HTMLElement>, rowIdx: number, field: 'item' | 'qty' | 'delete') => {
    const { key } = e;
    const navKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', ' '];
    if (navKeys.includes(key)) e.preventDefault();

    if (field === 'item') {
      if (activeItemSearchRow === rowIdx && availableItems.length > 0) {
        if (key === 'ArrowDown') { setActiveItemSuggestionIndex((c) => (c + 1) % availableItems.length); return; }
        if (key === 'ArrowUp')   { setActiveItemSuggestionIndex((c) => (c - 1 + availableItems.length) % availableItems.length); return; }
        if (key === 'Enter')     { selectSuggestion(rowIdx, activeItemSuggestionIndex); return; }
        if (key === 'Escape')    { setActiveItemSearchRow(null); setAvailableItems([]); setActiveItemSuggestionIndex(0); return; }
      }
      if (key === 'ArrowRight' || key === 'Enter') focusTableCell(rowIdx, 'qty');
      if (key === 'ArrowLeft')  focusTableCell(rowIdx, 'delete');
      if (key === 'ArrowUp' && rowIdx > 0) focusTableCell(rowIdx - 1, 'item');
      if (key === 'ArrowDown') rowIdx === rows.length - 1 ? focusNextRow(rowIdx, 'item') : focusTableCell(rowIdx + 1, 'item');
      return;
    }

    if (field === 'qty') {
      if (key === 'ArrowLeft') focusTableCell(rowIdx, 'item');
      if (key === 'ArrowRight') focusTableCell(rowIdx, 'delete');
      if (key === 'ArrowUp' && rowIdx > 0) focusTableCell(rowIdx - 1, 'qty');
      if (key === 'ArrowDown' || key === 'Enter') rowIdx === rows.length - 1 ? focusNextRow(rowIdx, 'item') : focusTableCell(rowIdx + 1, 'item');
      return;
    }

    if (field === 'delete') {
      if (key === 'ArrowLeft') focusTableCell(rowIdx, 'qty');
      if (key === 'ArrowRight') rowIdx === rows.length - 1 ? focusNextRow(rowIdx, 'item') : focusTableCell(rowIdx + 1, 'item');
      if (key === 'ArrowUp' && rowIdx > 0) focusTableCell(rowIdx - 1, 'delete');
      if (key === 'ArrowDown') rowIdx === rows.length - 1 ? focusNextRow(rowIdx, 'delete') : focusTableCell(rowIdx + 1, 'delete');
      if ((key === 'Enter' || key === ' ') && rows.length > 1) { removeRow(rowIdx); setTimeout(() => focusTableCell(Math.max(rowIdx - 1, 0), 'item'), 50); }
    }
  };

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!from)      { toast.error('Please select source warehouse'); return; }
    if (!to)        { toast.error('Please select destination warehouse'); return; }
    if (from === to){ toast.error('From and To warehouse cannot be the same'); return; }
    if (!date)      { toast.error('Please select transfer date'); return; }
    const valid = rows.filter((r) => r.itemId && r.qty > 0);
    if (!valid.length) { toast.error('Add at least one item to transfer'); return; }

    setSaving(true);
    try {
      const items: TransferItemPayload[] = valid.map((r) => ({ itemId: r.itemId, quantity: r.qty }));
      const newTransfer = await transferService.createTransfer({ fromWarehouseId: from, toWarehouseId: to, transferDate: date, notes: '', items });
      setTransfers((t) => [{ ...newTransfer, createdByName: newTransfer.createdByName ?? user?.name ?? null }, ...t]);
      toast.success(`${newTransfer.transferNumber} saved as PENDING${userCanApproveAny ? ' — approve it to move stock' : ''}`);
      setMode('list');
      setRows([{ itemId: '', itemName: '', qty: 1, searchQuery: '' }]);
      setAvailableItems([]); setActiveItemSearchRow(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save transfer');
    } finally {
      setSaving(false);
    }
  }, [from, to, rows, date, userCanApproveAny, toast, user?.name]);

  // ── Approve ─────────────────────────────────────────────────────────────
  const handleApprove = async (id: string, fromWh: string, toWh: string) => {
    try {
      const approvedTransfer = await transferService.approveTransfer(id);
      setTransfers((t) =>
        t.map((tr) => tr.id !== id ? tr : {
          ...tr, ...approvedTransfer,
          fromWarehouse: approvedTransfer.fromWarehouse ?? tr.fromWarehouse,
          toWarehouse:   approvedTransfer.toWarehouse   ?? tr.toWarehouse,
          itemCount:     approvedTransfer.itemCount      ?? tr.itemCount,
          totalQty:      approvedTransfer.totalQty       ?? tr.totalQty,
        })
      );
      setSelectedTransferDetail((prev) => {
        if (!prev || prev.id !== id) return prev;
        return { ...prev, ...approvedTransfer, fromWarehouse: approvedTransfer.fromWarehouse ?? prev.fromWarehouse, toWarehouse: approvedTransfer.toWarehouse ?? prev.toWarehouse };
      });
      toast.success(`Transfer approved — stock moved from ${fromWh} to ${toWh}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to approve transfer');
    }
  };

  const handleSelectTransfer = async (transferId: string) => {
    if (selectedTransferId === transferId) { setSelectedTransferId(null); setSelectedTransferDetail(null); return; }
    setSelectedTransferId(transferId);
    setLoadingDetail(true);
    try {
      const detail = await transferService.getTransferById(transferId);
      setSelectedTransferDetail(detail);
    } catch (error) {
      setSelectedTransferDetail(null);
      toast.error(error instanceof Error ? error.message : 'Failed to load transfer details');
    } finally {
      setLoadingDetail(false);
    }
  };

  useShortcuts('transfer-new', { F9: handleSave, Escape: () => setMode('list') });

  const fl = 'w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]';
  const lb = 'block text-xs font-semibold text-slate-500 mb-1';

  // ── Loading state ───────────────────────────────────────────────────────
  if (loading && mode === 'list') return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full flex items-center justify-center">
        <div className="text-center">
          <i className="ri-loader-4-line animate-spin text-3xl text-[#4f46e5] mb-2" />
          <p className="text-slate-600">Loading transfers...</p>
        </div>
      </div>
    </AppLayout>
  );

  // ── New Transfer form ───────────────────────────────────────────────────
  if (mode === 'new') return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 pb-16 bg-[#f8fafc]">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-bold text-[#1e293b]">New Stock Transfer</h1>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap">
              {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-save-3-line" /> Save <kbd className="text-[10px] bg-white/20 px-1 rounded ml-1">F9</kbd></>}
            </button>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 mb-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className={lb}>From Warehouse <span className="text-red-500">*</span></label>
                <select value={from} onChange={(e) => { setFrom(e.target.value); setAvailableItems([]); setActiveItemSearchRow(null); }} className={fl}>
                  <option value="">— Select From —</option>
                  {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lb}>To Warehouse <span className="text-red-500">*</span></label>
                <select value={to} onChange={(e) => setTo(e.target.value)} className={fl}>
                  <option value="">— Select To —</option>
                  {allWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lb}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fl} />
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Items to Transfer</h2>
              <span className="text-xs text-slate-400">Enter on Qty → adds next row</span>
            </div>
            <table className="w-full text-sm mb-3">
              <thead><tr className="bg-slate-50 border-b border-[#e2e8f0]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 w-8">#</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500">Item</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-500 w-28">Qty</th>
                <th className="px-3 py-2 w-8"></th>
              </tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-xs text-slate-400">{i + 1}</td>
                    <td className="px-3 py-2 relative">
                      <input
                        data-transfer-item-search type="text" value={r.searchQuery}
                        placeholder="Search item by name/code"
                        onFocus={() => setActiveItemSearchRow(i)}
                        onBlur={() => setTimeout(() => setActiveItemSearchRow((curr) => curr === i ? null : curr), 120)}
                        onChange={(e) => { updateRow(i, { searchQuery: e.target.value, itemId: '', itemName: '' }); setActiveItemSearchRow(i); setActiveItemSuggestionIndex(0); }}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'item')}
                        className="w-full h-8 px-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                      />
                      {activeItemSearchRow === i && availableItems.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-[#e2e8f0] bg-white shadow-lg">
                          {availableItems.map((x, idx) => (
                            <button key={x.id} type="button"
                              onMouseDown={(event) => { event.preventDefault(); updateRow(i, { itemId: x.id, itemName: x.name, searchQuery: x.name }); setActiveItemSearchRow(null); setAvailableItems([]); setActiveItemSuggestionIndex(0); setTimeout(() => focusTableCell(i, 'qty'), 0); }}
                              onMouseEnter={() => setActiveItemSuggestionIndex(idx)}
                              className={`w-full px-2 py-1.5 text-left text-sm cursor-pointer ${idx === activeItemSuggestionIndex ? 'bg-indigo-50' : 'hover:bg-indigo-50'}`}
                            >
                              <span className="font-medium text-slate-700">{x.name}</span>
                              <span className="ml-2 text-xs text-slate-500">({x.code || 'No code'} | Stock: {x.currentStock})</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" inputMode="numeric" pattern="[0-9]*" value={r.qty}
                        onFocus={(e) => e.currentTarget.select()} onClick={(e) => e.currentTarget.select()}
                        onChange={(e) => { const next = e.target.value.replace(/\D/g, ''); updateRow(i, { qty: next ? Math.max(1, parseInt(next, 10)) : 1 }); }}
                        onKeyDown={(e) => handleTableKeyDown(e, i, 'qty')}
                        data-transfer-qty
                        className="w-full h-8 px-2 text-sm text-right border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <button data-transfer-delete onKeyDown={(e) => handleTableKeyDown(e, i, 'delete')}
                        onClick={() => rows.length > 1 ? removeRow(i) : undefined}
                        disabled={rows.length === 1}
                        className="w-6 h-6 flex items-center justify-center text-red-400 hover:text-red-600 disabled:opacity-30 cursor-pointer">
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addRow} className="text-sm text-[#4f46e5] hover:text-indigo-700 font-medium cursor-pointer flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50">
              <i className="ri-add-line" /> Add Item
            </button>
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              Transfer saved as <strong>PENDING</strong>. {userCanApproveAny ? 'You can approve it to move stock.' : 'A manager must approve to move stock.'}
            </div>
          </div>
        </div>
        <ShortcutBar onSave={handleSave} onBack={() => setMode('list')} saving={saving} hidePrint />
      </div>
    </AppLayout>
  );

  // ── Transfer List ───────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Stock Transfers</h1>
            <p className="text-sm text-slate-500">{transfers.length} transfers</p>
          </div>
          {/* New Transfer — only with create permission */}
          {canCreate && (
            <button onClick={() => setMode('new')} className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
              <i className="ri-add-line" /> New Transfer
            </button>
          )}
        </div>
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50"><tr>
              {['Date', 'From', 'To', 'Items', 'Created By', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {transfers.map((t, i) => {
                // ── Per-row approve check using the updated signature ───────
                const allowedToApprove = canApproveTransfer(user, t.createdBy, hasControl);

                return (
                  <tr
                    key={t.id}
                    onClick={() => void handleSelectTransfer(t.id)}
                    className={`border-b border-slate-50 cursor-pointer hover:bg-indigo-50/40 ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''} ${selectedTransferId === t.id ? 'bg-indigo-50/60' : ''}`}
                  >
                    <td className="px-4 py-3 text-slate-600">{new Date(t.transferDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium">{t.fromWarehouse || 'Unknown'}</td>
                    <td className="px-4 py-3 font-medium">{t.toWarehouse   || 'Unknown'}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{t.itemCount || 0}</td>
                    <td className="px-4 py-3 text-slate-500">{t.createdByName || 'Unknown User'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ST[t.status]}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">
                      {t.status === 'PENDING' ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); if (allowedToApprove) void handleApprove(t.id, t.fromWarehouse || 'Unknown', t.toWarehouse || 'Unknown'); }}
                          disabled={!allowedToApprove}
                          title={allowedToApprove ? 'Approve transfer' : 'You cannot approve this transfer'}
                          className={`text-xs px-3 py-1 rounded-lg font-medium whitespace-nowrap border ${
                            allowedToApprove
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                        >
                          <i className="ri-checkbox-circle-line mr-1" />Approve
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <TransferDetailModal
          open={selectedTransferId !== null}
          loading={loadingDetail}
          transfer={selectedTransferDetail}
          onClose={() => { setSelectedTransferId(null); setSelectedTransferDetail(null); }}
        />
      </div>
    </AppLayout>
  );
}