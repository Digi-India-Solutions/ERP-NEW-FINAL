import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import AutocompleteInput from '@/components/base/AutocompleteInput';
import { useToast } from '@/contexts/ToastContext';
import { useShortcuts } from '@/hooks/useShortcuts';
import { useAuthStore } from '@/stores/authStore';
import DirectStockEntryForm from './components/DirectStockEntryForm';
import SmartItemRow, {
  makeSmartRow,
  type SmartRowData,
} from './components/SmartItemRow';
import { apiCreateGRN, mapGRNToMockGRN, type GRNApiItem } from '@/api/grn.api';
import { filterParties, fromDBType, type PartyResponse } from '@/api/party.api';
import { getAllWarehouses, type WarehouseResponse } from '@/api/warehouse.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Types ────────────────────────────────────────────────────────────────────
interface POUpdateResult {
  poNumber: string;
  status: 'COMPLETED' | 'PARTIAL';
  pendingItems: Array<{ name: string; received: number; pending: number }>;
}

interface SaveSummary {
  grnNumber: string;
  warehouseName: string;
  itemCount: number;
  poUpdates: POUpdateResult[];
  unmatchedCount: number;
  grnId?: string;
  warehouseId?: string;
  supplier?: any;
  items?: any[];
}

type ReceivingMode = 'supplier' | 'direct';

interface FromPOItem {
  itemId: string;
  itemName: string;
  hsnCode: string;
  qty: number;
  unit: string;
  rate: number;
  poRef: string;
}

interface FromPOState {
  poId: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  items: FromPOItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().split('T')[0];
const INVENTORY_STOCK_UPDATED_EVENT = 'inventory:stock-updated';

const BASE_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:7000'}`;

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem('token');
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

export async function getPendingPOsBySupplier(supplierId: string) {
  // Fix: send status as two separate params
  const res = await fetch(
    `${BASE_URL}/api/v1/purchase-order?supplier_id=${supplierId}&status=PENDING`,
    { headers: getAuthHeader() },
  );
  const data = await res.json();
  const pos: any[] = data.data || [];

  if (pos.length === 0) return { data: [] };

  // Fetch items for each PO in parallel
  const posWithItems = await Promise.all(
    pos.map(async (po) => {
      try {
        const itemRes = await fetch(
          `${BASE_URL}/api/v1/purchase-order/${po.id}`,
          { headers: getAuthHeader() },
        );
        const itemData = await itemRes.json();
        // Merge items into the PO object
        return {
          ...po,
          items:
            itemData.data?.items ?? itemData.data?.purchase_order_items ?? [],
        };
      } catch {
        return { ...po, items: [] };
      }
    }),
  );

  return { data: posWithItems };
}
// ─── Pure helper — takes pos as argument, no closure over state ───────────────
const findPORef = (
  itemId: string,
  pos: any[],
): {
  poNumber: string;
  poId: string | null;
  status: 'matched' | 'unmatched';
} => {
  for (const po of pos) {
    const items: any[] = po.items ?? po.purchase_order_items ?? [];
    const matched = items.some((i: any) => (i.item_id ?? i.itemId) === itemId);
    if (matched) {
      return {
        poNumber: po.po_number ?? po.poNumber ?? '',
        poId: po.id ?? null,
        status: 'matched',
      };
    }
  }
  return { poNumber: '', poId: null, status: 'unmatched' };
};

// ─── PO Ref Badge ─────────────────────────────────────────────────────────────
function PORefBadge({ itemId, pos }: { itemId: string; pos: any[] }) {
  if (!itemId) return <span className="text-xs text-slate-300">—</span>;

  const { poNumber, status } = findPORef(itemId, pos);

  if (status === 'matched' && poNumber) {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-emerald-50 text-emerald-700 border-emerald-200">
        <i className="ri-file-list-3-line mr-1" />
        {poNumber}
      </span>
    );
  }
  return (
    <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-amber-50 text-amber-700 border-amber-200">
      <i className="ri-alert-line mr-1" />
      Not in PO
    </span>
  );
}

// ─── Success Modal ────────────────────────────────────────────────────────────
interface SuccessModalProps {
  summary: SaveSummary;
  onNewReceiving: () => void;
  onCreatePI: () => void;
  onViewGRN: () => void;
  onClose: () => void;
}

function SuccessModal({
  summary,
  onNewReceiving,
  onCreatePI,
  onViewGRN,
  onClose,
}: SuccessModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-5 flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-100">
            <i className="ri-checkbox-circle-fill text-emerald-600 text-xl" />
          </div>
          <div>
            <h2 className="text-base font-bold text-emerald-800">
              Stock Received Successfully
            </h2>
            <p className="text-xs text-emerald-600">
              GRN created and stock updated
            </p>
          </div>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
                GRN Number
              </p>
              <p className="text-sm font-bold text-[#1e293b] mt-0.5">
                {summary.grnNumber}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
                Warehouse
              </p>
              <p className="text-sm font-bold text-[#1e293b] mt-0.5">
                {summary.warehouseName}
              </p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">
                Items Received
              </p>
              <p className="text-sm font-bold text-[#1e293b] mt-0.5">
                {summary.itemCount}
              </p>
            </div>
          </div>

          {summary.poUpdates.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                PO Status Update
              </p>
              <div className="space-y-2">
                {summary.poUpdates.map((pu) => (
                  <div
                    key={pu.poNumber}
                    className={`rounded-lg border px-3 py-2 ${pu.status === 'COMPLETED' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-[#1e293b]">
                        {pu.poNumber}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${pu.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                      >
                        {pu.status === 'COMPLETED' ? (
                          <>
                            <i className="ri-checkbox-circle-line mr-1" />
                            COMPLETED
                          </>
                        ) : (
                          <>
                            <i className="ri-time-line mr-1" />
                            PARTIAL
                          </>
                        )}
                      </span>
                    </div>
                    {pu.pendingItems.length > 0 && (
                      <div className="mt-1.5 space-y-0.5">
                        {pu.pendingItems.map((pi, i) => (
                          <p key={i} className="text-[11px] text-amber-700">
                            {pi.name}: {pi.received} received, {pi.pending}{' '}
                            pending
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {summary.unmatchedCount > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <i className="ri-alert-line text-amber-600" />
              <p className="text-xs text-amber-700">
                <strong>
                  {summary.unmatchedCount} item
                  {summary.unmatchedCount > 1 ? 's' : ''}
                </strong>{' '}
                not linked to any PO — stock updated anyway
              </p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#e2e8f0] flex items-center gap-2 justify-end flex-wrap">
          <button
            type="button"
            onClick={onNewReceiving}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#1e293b] hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line mr-1" />
            New Receiving
          </button>
          <button
            type="button"
            onClick={onCreatePI}
            className="h-9 px-4 rounded-lg border border-[#4f46e5] text-sm font-medium text-[#4f46e5] hover:bg-indigo-50 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-file-add-line mr-1" />
            Create Purchase Invoice
          </button>
          <button
            type="button"
            onClick={onViewGRN}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
          >
            <i className="ri-file-list-3-line mr-1" />
            View GRN
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg bg-[#4f46e5] text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── GRN List Modal ───────────────────────────────────────────────────────────
interface GRNListModalProps {
  grns: any[];
  onClose: () => void;
}

function GRNListModal({ grns, onClose }: GRNListModalProps) {
  const [selected, setSelected] = useState<any | null>(null);

  if (selected) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
            <div>
              <h2 className="text-base font-bold text-[#1e293b]">
                {selected.grnNumber}
              </h2>
              <p className="text-xs text-slate-500">
                {selected.supplierName} · {selected.date} ·{' '}
                {selected.warehouseName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <i className="ri-arrow-left-line" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['#', 'Item', 'Qty', 'Unit', 'Rate', 'Amount', 'PO Ref'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {(selected.items ?? []).map((item: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="px-3 py-2 text-xs text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-3 py-2 font-medium">{item.itemName}</td>
                    <td className="px-3 py-2 text-right">
                      {item.qty ?? item.quantity}
                    </td>
                    <td className="px-3 py-2 text-slate-500">
                      {item.unit ?? item.unitName}
                    </td>
                    <td className="px-3 py-2 text-right">
                      ₹{Number(item.rate).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      ₹
                      {(
                        (item.qty ?? item.quantity ?? 0) * Number(item.rate)
                      ).toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-2">
                      {(item.poRef ?? item.poNumber) ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                          {item.poRef ?? item.poNumber}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-600">
                          <i className="ri-alert-line mr-0.5" />
                          Not in PO
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-end">
              <div className="bg-slate-50 rounded-lg px-4 py-2 text-sm">
                <span className="text-slate-500">Total Value: </span>
                <span className="font-bold text-[#1e293b]">
                  ₹{Number(selected.totalValue ?? 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            {selected.notes && (
              <div className="mt-3 bg-slate-50 border border-[#e2e8f0] rounded-lg px-4 py-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  Notes
                </p>
                <p className="text-sm text-slate-600">{selected.notes}</p>
              </div>
            )}
          </div>
          <div className="px-6 py-3 border-t border-[#e2e8f0] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-9 px-4 rounded-lg bg-[#4f46e5] text-sm font-medium text-white hover:bg-indigo-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
          <h2 className="text-base font-bold text-[#1e293b]">GRN Records</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {[
                  'GRN No.',
                  'Supplier',
                  'Date',
                  'Warehouse',
                  'Items',
                  'Value',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grns.map((g, i) => (
                <tr
                  key={g.id}
                  className={`border-b border-slate-50 hover:bg-slate-50 cursor-pointer ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}
                  onClick={() => setSelected(g)}
                >
                  <td className="px-4 py-3 font-semibold text-[#4f46e5]">
                    {g.grnNumber}
                  </td>
                  <td className="px-4 py-3">{g.supplierName}</td>
                  <td className="px-4 py-3 text-slate-500">{g.date}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {g.warehouseName}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {g.totalItems ?? g.items?.length ?? 0}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    ₹{Number(g.totalValue ?? 0).toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {g.notes && (
                        <span
                          title={g.notes.slice(0, 50)}
                          className="w-5 h-5 flex items-center justify-center cursor-help"
                        >
                          <i className="ri-sticky-note-line text-amber-500 text-sm" />
                        </span>
                      )}
                      <i className="ri-arrow-right-s-line text-slate-400" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Supplier Form ────────────────────────────────────────────────────────────
interface SupplierFormProps {
  onSaved: (summary: SaveSummary, createdGRN: any) => void;
  fromPO?: FromPOState | null;
}

function SupplierReceivingForm({ onSaved, fromPO }: SupplierFormProps) {
  const { user } = useAuthStore();
  const toast = useToast();

  const {
    selectedWarehouseId: userWarehouseId,
    selectedWarehouseName: userWarehouseName,
  } = useWarehouseStore();
  const [supplierOptions, setSupplierOptions] = useState<PartyResponse[]>([]);

  // ── Real POs from backend ──────────────────────────────────────────────────
  const [supplierPOs, setSupplierPOs] = useState<any[]>([]);

  const [supplierName, setSupplierName] = useState(fromPO?.supplierName ?? '');
  const [supplierId, setSupplierId] = useState(fromPO?.supplierId ?? '');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<SmartRowData[]>(() => {
    if (fromPO && fromPO.items.length > 0) {
      return fromPO.items.map((item) => ({
        ...makeSmartRow(),
        itemId: item.itemId,
        itemName: item.itemName,
        hsnCode: item.hsnCode,
        qty: item.qty,
        unit: item.unit,
        rate: item.rate,
        total: item.qty * item.rate,
        poRefOverride: item.poRef,
      }));
    }
    return [makeSmartRow()];
  });
  const [saving, setSaving] = useState(false);

  const smartInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load suppliers scoped to the currently selected warehouse
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const partiesRes = await filterParties({
          isActive: true,
          ...(userWarehouseId && userWarehouseId !== 'ALL'
            ? { warehouse_id: userWarehouseId }
            : {}),
        });
        if (!active) return;
        setSupplierOptions(
          Array.isArray(partiesRes.data) ? partiesRes.data : [],
        );
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      }
    };
    void load();
    return () => { active = false; };
  }, [userWarehouseId]);

  // Fetch real POs whenever supplierId changes
  useEffect(() => {
    if (!supplierId) {
      setSupplierPOs([]);
      return;
    }
    const load = async () => {
      try {
        const res = await getPendingPOsBySupplier(supplierId);
        setSupplierPOs(res.data || []);
      } catch (err) {
        console.error('Failed to load POs:', err);
        setSupplierPOs([]);
      }
    };
    void load();
  }, [supplierId]);

  const [supplierDropdownOpen, setSupplierDropdownOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState(fromPO?.supplierName ?? '');
  const [supplierDropdownPos, setSupplierDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const supplierTriggerRef = useRef<HTMLDivElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);

  // Sync supplierSearchQuery with supplierName when it is changed/prefilled
  useEffect(() => {
    setSupplierSearchQuery(supplierName);
  }, [supplierName]);

  // Clear supplier when warehouse changes, but keep it on first mount if fromPO is present
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setSupplierId('');
    setSupplierName('');
    setSupplierSearchQuery('');
  }, [userWarehouseId]);

  // Position and outside click logic for supplier dropdown
  useEffect(() => {
    if (!supplierDropdownOpen) return;

    const updatePos = () => {
      const el = supplierInputRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSupplierDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);

    const outsideClick = (e: MouseEvent) => {
      const dropEl = document.getElementById('supplier-dropdown-portal');
      if (
        !supplierTriggerRef.current?.contains(e.target as Node) &&
        !dropEl?.contains(e.target as Node)
      ) {
        setSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', outsideClick);

    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
      document.removeEventListener('mousedown', outsideClick);
    };
  }, [supplierDropdownOpen]);

  const filteredSuppliers = useMemo(() => {
    const lower = supplierSearchQuery.toLowerCase();
    return supplierOptions
      .filter(
        (p) =>
          (fromDBType(p.type) === 'supplier' ||
            fromDBType(p.type) === 'both') &&
          p.is_active &&
          (p.name.toLowerCase().includes(lower) ||
            (p.gstin ?? '').toLowerCase().includes(lower)),
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        type: fromDBType(p.type).toUpperCase(),
        phone: p.phone ?? '',
        gstin: p.gstin ?? '',
      }));
  }, [supplierOptions, supplierSearchQuery]);

  const selectSupplier = (s: { id: string; name: string }) => {
    setSupplierId(s.id);
    setSupplierName(s.name);
    setSupplierSearchQuery(s.name);
    setSupplierDropdownOpen(false);
  };

  const addRow = useCallback(() => {
    const newRow = makeSmartRow();
    setRows((r) => [...r, newRow]);
    setTimeout(() => {
      smartInputRefs.current[newRow.id]?.focus();
    }, 80);
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<SmartRowData>) => {
    setRows((r) =>
      r.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r));
  }, []);

  const filledRows = rows.filter((r) => r.itemId);
  const totalAmount = filledRows.reduce((s, r) => s + r.total, 0);

  const unmatchedCount = filledRows.filter((r) => {
    const override = (r as SmartRowData & { poRefOverride?: string })
      .poRefOverride;
    if (override) return false;
    return findPORef(r.itemId, supplierPOs).status === 'unmatched';
  }).length;

  const handleSave = useCallback(async () => {
    if (!userWarehouseId) {
      toast.error('No warehouse found for this company');
      return;
    }

    const resolvedSupplierId =
      supplierId ||
      supplierOptions.find(
        (p) => p.name.toLowerCase() === supplierName.trim().toLowerCase(),
      )?.id ||
      '';

    if (!resolvedSupplierId) {
      toast.error('Please choose a supplier from the dropdown');
      return;
    }
    if (filledRows.length === 0) {
      toast.error('Add at least one item to receive');
      return;
    }

    setSaving(true);
    try {
      // Build linked rows — real poId + poNumber from supplierPOs
      const linkedRows = filledRows.map((r) => {
        const override = (r as SmartRowData & { poRefOverride?: string })
          .poRefOverride;
        if (override) {
          return { row: r, poNumber: override, poId: fromPO?.poId ?? null };
        }
        const match = findPORef(r.itemId, supplierPOs);
        return {
          row: r,
          poNumber: match.status === 'matched' ? match.poNumber : null,
          poId: match.status === 'matched' ? match.poId : null,
        };
      });

      const apiItems = linkedRows.map(({ row, poNumber, poId }) => ({
        itemId: row.itemId,
        itemName: row.itemName,
        hsnCode: row.hsnCode,
        quantity: row.qty,
        unitName: row.unit,
        rate: row.rate,
        poId: poId ?? null,
        poNumber: poNumber ?? null,
        barcode: row.barcode || null,
        companyBarcode: null,
      }));

      const response = await apiCreateGRN({
        warehouseId: userWarehouseId,
        supplierId: resolvedSupplierId,
        date,
        notes: notes.trim() || undefined,
        items: apiItems,
      });

      const normalizedItems: GRNApiItem[] = (
        response.data.items?.length ? response.data.items : apiItems
      ).map((item: any, index: number) => {
        const src = apiItems[index];
        return {
          id: `grn-item-${index}`,
          grnId: response.data.id,
          itemId: item.itemId ?? src?.itemId ?? null,
          itemName: item.itemName ?? src?.itemName ?? '',
          poId: item.poId ?? src?.poId ?? null,
          hsnCode: item.hsnCode ?? src?.hsnCode ?? '',
          quantity: item.quantity ?? src?.quantity ?? 0,
          unitName: item.unitName ?? src?.unitName ?? '',
          rate: item.rate ?? src?.rate ?? 0,
          total: Math.round((src?.quantity ?? 0) * (src?.rate ?? 0)),
          poNumber: item.poNumber ?? src?.poNumber ?? null,
          barcode: item.barcode ?? src?.barcode ?? null,
          companyBarcode: item.companyBarcode ?? src?.companyBarcode ?? null,
        };
      });

      const normalizedRecord = {
        ...response.data,
        warehouseName: response.data.warehouseName || userWarehouseName,
        supplierName: response.data.supplierName || supplierName || '',
        date: response.data.date || date,
        items: normalizedItems,
      };

      // Build poUpdates from real supplierPOs — no more mockPurchaseOrders
      const linkedPONumbers = Array.from(
        new Set(
          apiItems
            .map((item) => item.poNumber)
            .filter((v): v is string => Boolean(v)),
        ),
      );

      const poUpdates: POUpdateResult[] = linkedPONumbers
        .map((poNumber) => {
          const po = supplierPOs.find(
            (p) => (p.po_number ?? p.poNumber) === poNumber,
          );
          if (!po) return null;

          const poItems: any[] = po.items ?? po.purchase_order_items ?? [];

          const receivedByItem = new Map<string, number>();
          linkedRows
            .filter(({ poNumber: rPoNum }) => rPoNum === poNumber)
            .forEach(({ row }) => {
              receivedByItem.set(
                row.itemId,
                (receivedByItem.get(row.itemId) ?? 0) + row.qty,
              );
            });

          const pendingItems = poItems
            .map((poItem: any) => {
              const itemId = poItem.item_id ?? poItem.itemId;
              const orderedQty = Number(
                poItem.ordered_qty ?? poItem.orderedQty ?? 0,
              );
              const alreadyReceived = Number(
                poItem.received_qty ?? poItem.receivedQty ?? 0,
              );
              const nowReceived = receivedByItem.get(itemId) ?? 0;
              const totalReceived = alreadyReceived + nowReceived;
              const pending = Math.max(0, orderedQty - totalReceived);
              return {
                name: poItem.item_name ?? poItem.itemName ?? '',
                received: totalReceived,
                pending,
              };
            })
            .filter((item) => item.pending > 0);

          return {
            poNumber,
            status: pendingItems.length === 0 ? 'COMPLETED' : 'PARTIAL',
            pendingItems,
          } as POUpdateResult;
        })
        .filter((v): v is POUpdateResult => v !== null);

      const createdGRN = mapGRNToMockGRN(
        normalizedRecord,
        linkedPONumbers,
        notes.trim() || undefined,
      );

      const selectedSupplierParty = supplierOptions.find(p => p.id === resolvedSupplierId);
      const supplierData = selectedSupplierParty ? {
        id: selectedSupplierParty.id,
        name: selectedSupplierParty.name,
        gstin: selectedSupplierParty.gstin ?? '',
        phone: selectedSupplierParty.phone ?? selectedSupplierParty.mobile ?? '',
        stateCode: selectedSupplierParty.stateCode ?? selectedSupplierParty.state_code ?? '',
        state_code: selectedSupplierParty.stateCode ?? selectedSupplierParty.state_code ?? '',
        address: selectedSupplierParty.billingAddress ?? selectedSupplierParty.billing_address ?? '',
        creditLimit: selectedSupplierParty.creditLimit ?? selectedSupplierParty.credit_limit ?? 0,
        credit_limit: selectedSupplierParty.creditLimit ?? selectedSupplierParty.credit_limit ?? 0,
        openingBalance: selectedSupplierParty.openingBalance ?? selectedSupplierParty.opening_balance ?? 0,
        opening_balance: selectedSupplierParty.openingBalance ?? selectedSupplierParty.opening_balance ?? 0,
      } : {
        id: resolvedSupplierId,
        name: supplierName,
        gstin: '',
        phone: '',
        stateCode: '',
        state_code: '',
        address: '',
        creditLimit: 0,
        credit_limit: 0,
        openingBalance: 0,
        opening_balance: 0,
      };

      onSaved(
        {
          grnNumber: normalizedRecord.grnNumber,
          warehouseName: normalizedRecord.warehouseName || userWarehouseName,
          itemCount: createdGRN.items.length,
          poUpdates,
          unmatchedCount,
          grnId: normalizedRecord.id,
          warehouseId: userWarehouseId,
          supplier: supplierData,
          items: createdGRN.items,
        },
        createdGRN,
      );

      window.dispatchEvent(
        new CustomEvent(INVENTORY_STOCK_UPDATED_EVENT, {
          detail: { source: 'grn', grnNumber: normalizedRecord.grnNumber },
        }),
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to create GRN';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [
    supplierId,
    supplierName,
    supplierOptions,
    supplierPOs,
    filledRows,
    userWarehouseId,
    userWarehouseName,
    fromPO?.poId,
    notes,
    date,
    toast,
    unmatchedCount,
    onSaved,
  ]);

  const lb = 'block text-xs font-semibold text-slate-500 mb-1';
  const fl =
    'w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20';

  return (
    <div className="p-6 space-y-4">
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className={lb}>
              Supplier <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={supplierTriggerRef}>
              <input
                ref={supplierInputRef}
                type="text"
                value={supplierSearchQuery}
                onChange={(e) => {
                  const val = e.target.value;
                  setSupplierSearchQuery(val);
                  if (!val.trim()) {
                    setSupplierId('');
                    setSupplierName('');
                  }
                }}
                onFocus={() => setSupplierDropdownOpen(true)}
                placeholder="Search supplier..."
                className="w-full h-10 px-3 pr-8 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 transition-colors"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <i
                  className={`ri-arrow-down-s-line text-[#94a3b8] text-sm transition-transform ${
                    supplierDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </div>
            {supplierDropdownOpen &&
              createPortal(
                <div
                  id="supplier-dropdown-portal"
                  style={{
                    position: 'absolute',
                    top: supplierDropdownPos.top,
                    left: supplierDropdownPos.left,
                    width: supplierDropdownPos.width,
                    zIndex: 9999,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    maxHeight: '240px',
                    overflowY: 'auto',
                  }}
                >
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map((s) => (
                      <div
                        key={s.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          selectSupplier(s);
                        }}
                        className="px-3 py-2 cursor-pointer transition-colors text-sm hover:bg-[#f8fafc] text-[#1e293b] flex flex-col"
                      >
                        <span className="font-medium text-sm text-[#1e293b]">{s.name}</span>
                        <span className="text-[10px] text-slate-400">
                          {s.type} · {s.phone || 'No phone'} {s.gstin ? `· GSTIN: ${s.gstin}` : ''}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-slate-400 text-center">
                      No suppliers found for this warehouse
                    </div>
                  )}
                </div>,
                document.body
              )}
          </div>
          <div>
            <label className={lb}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fl}
            />
          </div>
          <div>
            <label className={lb}>GRN Number</label>
            <input
              type="text"
              value=""
              readOnly
              placeholder="Generated on save"
              className="w-full h-10 px-3 text-sm bg-slate-50 border border-[#e2e8f0] rounded-lg text-slate-400 cursor-not-allowed font-mono"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
            <i className="ri-store-3-line text-[#4f46e5] text-sm" />
            <span className="text-sm font-medium text-[#4f46e5]">
              {userWarehouseName}
            </span>
            <span className="text-xs text-indigo-400">(your store)</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded font-medium">
              READ ONLY
            </span>
          </div>
          {supplierId && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <i className="ri-file-list-3-line text-emerald-500" />
              {supplierPOs.length} pending PO
              {supplierPOs.length !== 1 ? 's' : ''} for this supplier
            </div>
          )}
        </div>

        <div className="mt-4">
          <label className={lb}>Notes / Remarks (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Vehicle no, delivery condition, discrepancy notes, driver name..."
            className="w-full px-3 py-2 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {fromPO && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 border border-indigo-200 rounded-xl">
          <i className="ri-file-list-3-line text-indigo-600" />
          <p className="text-sm text-indigo-700 font-medium">
            Pre-filled from {fromPO.poNumber} · {fromPO.supplierName}
            <span className="font-normal text-indigo-500 ml-1">
              — Showing pending items only
            </span>
          </p>
        </div>
      )}

      <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-visible">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#e2e8f0]">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Items Received
          </h2>
          <span className="text-xs text-slate-400">
            Scan barcode or type item name · Enter: Item → Qty → Rate → next row
          </span>
        </div>
        <div className="overflow-x-auto overflow-visible">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 w-8">
                  #
                </th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500">
                  Item
                </th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-slate-500 w-24">
                  Qty
                </th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500 w-20">
                  Unit
                </th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-slate-500 w-28">
                  Rate (₹)
                </th>
                <th className="px-2 py-2.5 text-left text-xs font-semibold text-slate-500 w-36">
                  PO Ref
                </th>
                <th className="px-2 py-2.5 text-right text-xs font-semibold text-slate-500 w-28">
                  Amount
                </th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const r = row as SmartRowData & { poRefOverride?: string };
                const poRefOverride = r.poRefOverride ?? '';
                const poItem = fromPO?.items.find(
                  (pi) => pi.itemId === row.itemId,
                );
                const overQty = poItem && row.qty > poItem.qty;

                return (
                  <SmartItemRow
                    key={row.id}
                    row={row}
                    rowIdx={idx}
                    onUpdate={updateRow}
                    onRemove={removeRow}
                    onEnterOnRate={addRow}
                    isLast={idx === rows.length - 1}
                    warehouseId={userWarehouseId}
                    extraColumn={
                      poRefOverride ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
                            <i className="ri-file-list-3-line mr-1" />
                            {poRefOverride}
                          </span>
                          {overQty && (
                            <span className="text-[10px] text-amber-600 whitespace-nowrap">
                              <i className="ri-alert-line mr-0.5" />
                              Over PO qty
                            </span>
                          )}
                        </div>
                      ) : (
                        <PORefBadge itemId={row.itemId} pos={supplierPOs} />
                      )
                    }
                    smartInputRef={(el) => {
                      smartInputRefs.current[row.id] = el;
                    }}
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={addRow}
            className="flex items-center gap-1.5 text-sm text-[#4f46e5] hover:text-indigo-700 font-medium cursor-pointer px-2 py-1 rounded hover:bg-indigo-50"
          >
            <i className="ri-add-line" /> Add Row
          </button>
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-500">
              {filledRows.length} item{filledRows.length !== 1 ? 's' : ''}
            </span>
            <span className="font-bold text-[#1e293b]">
              Total: ₹{totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {unmatchedCount > 0 && (
          <div className="mx-5 mb-4 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <i className="ri-alert-line text-amber-600 shrink-0" />
            <p className="text-xs text-amber-700">
              <strong>
                {unmatchedCount} item{unmatchedCount > 1 ? 's' : ''} not linked
                to any PO
              </strong>{' '}
              — stock will still be updated
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 h-10 px-6 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
        >
          {saving ? (
            <>
              <i className="ri-loader-4-line animate-spin" /> Saving...
            </>
          ) : (
            <>
              <i className="ri-save-3-line" /> Save GRN{' '}
              <kbd className="text-[10px] bg-white/20 px-1 rounded ml-1">
                F9
              </kbd>
            </>
          )}
        </button>
      </div>

      <ShortcutBar
        onSave={handleSave}
        onBack={() => { }}
        isSaving={saving}
        hidePrint
      />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StockReceivingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromPO =
    (location.state as { fromPO?: FromPOState } | null)?.fromPO ?? null;

  const [mode, setMode] = useState<ReceivingMode>('supplier');
  const [saveSummary, setSaveSummary] = useState<SaveSummary | null>(null);
  const [showGRNList, setShowGRNList] = useState(false);
  const [grnRecords, setGrnRecords] = useState<any[]>([]);
  const [activeFromPO, setActiveFromPO] = useState(fromPO);

  useEffect(() => {
    if (fromPO) setMode('supplier');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useShortcuts('stock-receiving', {
    Escape: () => {
      if (saveSummary) setSaveSummary(null);
    },
  });

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-4 bg-[#f8fafc]">
          <div className="bg-white border-b border-[#e2e8f0] px-6 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-bold text-[#1e293b]">
                  Stock Receiving
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {mode === 'supplier'
                    ? 'Record goods received from supplier'
                    : 'Add stock directly without a supplier invoice'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {mode === 'supplier' && (
                  <button
                    type="button"
                    onClick={() => navigate('/purchase/grn')}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-file-list-3-line" />
                    <span>View All GRNs</span>
                  </button>
                )}
                {mode === 'direct' && (
                  <button
                    type="button"
                    onClick={() => navigate('/inventory/stock-entries')}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                  >
                    <i className="ri-history-line" />
                    <span>View History</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
              <button
                type="button"
                onClick={() => setMode('supplier')}
                className={`flex items-center gap-2 h-8 px-4 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${mode === 'supplier'
                    ? 'bg-white text-[#1e293b] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <i className="ri-truck-line" />
                From Supplier
              </button>
              <button
                type="button"
                onClick={() => setMode('direct')}
                className={`flex items-center gap-2 h-8 px-4 rounded-md text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${mode === 'direct'
                    ? 'bg-white text-[#1e293b] shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                  }`}
              >
                <i className="ri-refresh-line" />
                Direct Stock Entry
              </button>
            </div>
          </div>

          {mode === 'supplier' && (
            <SupplierReceivingForm
              key={saveSummary?.grnNumber || 'new'} // 🔥 important
              onSaved={(summary, createdGRN) => {
                setSaveSummary(summary);
                setGrnRecords((current) => [createdGRN, ...current]);
              }}
              fromPO={activeFromPO}
            />
          )}
          {mode === 'direct' && <DirectStockEntryForm />}
        </div>
      </div>

      {saveSummary && (
        <SuccessModal
          summary={saveSummary}
          onNewReceiving={() => {
            setSaveSummary(null);
            setActiveFromPO(null);
          }}
          onCreatePI={() => {
            if (!saveSummary) return;
            const fromGRN = {
              supplier: saveSummary.supplier,
              supplierId: saveSummary.supplier?.id || '',
              supplierName: saveSummary.supplier?.name || '',
              warehouseId: saveSummary.warehouseId,
              warehouseName: saveSummary.warehouseName,
              items: saveSummary.items || [],
            };
            setSaveSummary(null);
            navigate('/purchase/invoices/new', {
              state: {
                fromGRN,
              },
            });
          }}
          onViewGRN={() => {
            setSaveSummary(null);
            setShowGRNList(true);
          }}
          onClose={() => {
            setSaveSummary(null);
            navigate('/purchase/grn');
          }}
        />
      )}

      {showGRNList && (
        <GRNListModal grns={grnRecords} onClose={() => setShowGRNList(false)} />
      )}
    </AppLayout>
  );
}
