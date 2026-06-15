import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { MODULES } from '@/utils/permissions.js';
import { useAuth } from '@/contexts/AuthContext';
import { getAllParties } from '@/api/party.api';
import { getAllItems } from '@/api/item.api';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { gatepassService } from '@/services/gatepassService';

import InwardGPForm, {
  type GatePass,
  type GPFormState,
  type GPItem,
  type InwardGPPrefill,
  type PartyOption,
  type ItemOption,
  INWARD_PURPOSES,
  PURPOSE_LABELS,
} from './componants/InwardGPForm.js';

// ─── API (inline for verify/reject — still direct fetch) ─────────────────────

const API_BASE = `${import.meta.env.VITE_API_URL || 'https://asvapi.digiindiasolutions.com'}/api/v1/gatepass`;
const getToken = () => localStorage.getItem('token') ?? '';
const authHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

const gpApi = {
  list: async (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams({
      limit: '100',
      ...Object.fromEntries(Object.entries(params).filter(([, v]) => v)),
    });
    return (
      await fetch(`${API_BASE}?${qs}`, { headers: authHeaders() })
    ).json();
  },
  get: async (id: string) =>
    (await fetch(`${API_BASE}/${id}`, { headers: authHeaders() })).json(),
  remove: async (id: string) =>
    (
      await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    ).json(),
  verify: async (id: string) =>
    (
      await fetch(`${API_BASE}/${id}/verify`, {
        method: 'POST',
        headers: authHeaders(),
      })
    ).json(),
  reject: async (id: string, rejectionReason: string) =>
    (
      await fetch(`${API_BASE}/${id}/reject`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ rejectionReason }),
      })
    ).json(),
};

// ─── Badge helpers ─────────────────────────────────────────────────────────────

const statusBadge = (s: string) => {
  if (s === 'LINKED')
    return { cls: 'bg-green-100 text-green-700', icon: 'ri-links-line' };
  if (s === 'RECEIVED')
    return { cls: 'bg-blue-100 text-blue-700', icon: 'ri-inbox-archive-line' };
  return { cls: 'bg-amber-100 text-amber-700', icon: 'ri-time-line' };
};

const verBadge = (v: string) => {
  if (v === 'VERIFIED')
    return {
      cls: 'bg-green-100 text-green-700',
      icon: 'ri-shield-check-line',
      label: 'Verified',
    };
  if (v === 'REJECTED')
    return {
      cls: 'bg-red-100 text-red-600',
      icon: 'ri-shield-cross-line',
      label: 'Rejected',
    };
  return {
    cls: 'bg-amber-100 text-amber-700',
    icon: 'ri-time-line',
    label: 'Pending',
  };
};

// ─── Reject Dialog ─────────────────────────────────────────────────────────────

function RejectDialog({
  open,
  gpNumber,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  gpNumber: string;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState('');
  useEffect(() => {
    if (open) setReason('');
  }, [open]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <i className="ri-shield-cross-line text-red-500 text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Reject Gate Pass
            </h3>
            <p className="text-xs text-[#64748b] font-mono">{gpNumber}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
            Rejection Reason *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this gate pass is being rejected..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => reason.trim() && onConfirm(reason.trim())}
            disabled={!reason.trim() || loading}
            className="flex items-center gap-2 h-9 px-4 rounded-lg bg-red-500 text-white text-sm font-semibold hover:bg-red-600 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <i className="ri-loader-4-line animate-spin" /> Rejecting…
              </>
            ) : (
              <>
                <i className="ri-shield-cross-line" /> Reject
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ──────────────────────────────────────────────────────────────

function DetailModal({
  gp,
  canEdit,
  onClose,
  onVerify,
  onReject,
}: {
  gp: GatePass | null;
  canEdit: boolean;
  onClose: () => void;
  onVerify: (gp: GatePass) => void;
  onReject: (gp: GatePass) => void;
}) {
  const [full, setFull] = useState<GatePass | null>(null);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!gp) {
      setFull(null);
      return;
    }
    setFetching(true);
    gpApi
      .get(gp.id)
      .then((res) => setFull(res.success ? res.data : gp))
      .catch(() => setFull(gp))
      .finally(() => setFetching(false));
  }, [gp?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!gp) return null;
  const detail = full ?? gp;
  const vb = verBadge(detail.verificationStatus);
  const sb = statusBadge(detail.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-mono font-bold text-[#4f46e5] text-base">
                {detail.gpNumber}
              </p>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                INWARD
              </span>
            </div>
            <p className="text-xs text-[#64748b]">
              {detail.partyName} · {detail.date?.slice(0, 10)}{' '}
              {detail.time?.slice(0, 5)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {detail.verificationStatus === 'PENDING' && canEdit && (
              <>
                <button
                  onClick={() => onVerify(detail)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-green-50 text-green-700 border border-green-200 text-xs font-semibold hover:bg-green-100 cursor-pointer"
                >
                  <i className="ri-shield-check-line" /> Verify
                </button>
                <button
                  onClick={() => onReject(detail)}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 cursor-pointer"
                >
                  <i className="ri-shield-cross-line" /> Reject
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {fetching && (
            <p className="text-xs text-[#94a3b8] flex items-center gap-1">
              <i className="ri-loader-4-line animate-spin" /> Loading details…
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${sb.cls}`}
            >
              <i className={`${sb.icon} text-xs`} /> Status: {detail.status}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${vb.cls}`}
            >
              <i className={`${vb.icon} text-xs`} /> Verification: {vb.label}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700">
              <i className="ri-file-list-3-line text-xs" />
              {PURPOSE_LABELS[detail.purpose as keyof typeof PURPOSE_LABELS] ??
                detail.purpose}
            </span>
          </div>

          {detail.verificationStatus === 'REJECTED' &&
            detail.rejectionReason && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <i className="ri-shield-cross-line shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs mb-0.5">
                    Rejection Reason
                  </p>
                  <p>{detail.rejectionReason}</p>
                </div>
              </div>
            )}

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {(
              [
                ['Vehicle Number', detail.vehicleNumber],
                ['Security Guard', detail.securityGuard],
                ['Authorised By', detail.authorisedBy],
                ['Received By', detail.receivedBy || '—'],
                ['Driver Name', detail.driverName || '—'],
                ['Driver Phone', detail.driverPhone || '—'],
              ] as [string, string][]
            ).map(([label, value]) => (
              <div key={label}>
                <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">
                  {label}
                </p>
                <p className="text-sm font-medium text-[#1e293b] mt-0.5">
                  {value}
                </p>
              </div>
            ))}
          </div>

          {(detail.linkedDocType || detail.linkedDocNumber) && (
            <div className="p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-1">
                Linked Document
              </p>
              <div className="flex items-center gap-2 text-sm">
                <i className="ri-links-line text-[#4f46e5]" />
                <span className="font-medium text-[#1e293b]">
                  {detail.linkedDocType || '—'}
                </span>
                {/* Show human-readable label if available, fall back to UUID */}
                {(detail.linkedDocLabel || detail.linkedDocNumber) && (
                  <span className="font-mono text-xs text-[#4f46e5] bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    {detail.linkedDocLabel || detail.linkedDocNumber}
                  </span>
                )}
              </div>
            </div>
          )}

          {detail.notes && (
            <div>
              <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-1">
                Notes
              </p>
              <p className="text-sm text-[#1e293b] bg-[#f8fafc] rounded-lg p-3 border border-[#e2e8f0]">
                {detail.notes}
              </p>
            </div>
          )}

          <div>
            <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">
              Items ({detail.items?.length ?? 0})
            </p>
            {fetching ? (
              <div className="space-y-2">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-8 bg-slate-100 rounded animate-pulse"
                  />
                ))}
              </div>
            ) : !detail.items?.length ? (
              <p className="text-xs text-[#94a3b8]">No items recorded</p>
            ) : (
              <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      {['#', 'Item Name', 'Qty', 'Unit', 'Description'].map(
                        (h) => (
                          <th
                            key={h}
                            className="text-left px-3 py-2 text-xs font-semibold text-[#64748b] uppercase border-b border-[#e2e8f0]"
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item: GPItem, i: number) => (
                      <tr
                        key={item.id ?? i}
                        className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc]"
                      >
                        <td className="px-3 py-2.5 text-xs text-[#94a3b8]">
                          {i + 1}
                        </td>
                        <td className="px-3 py-2.5 font-medium text-[#1e293b]">
                          {item.itemName}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-[#4f46e5]">
                          {item.qty}
                        </td>
                        <td className="px-3 py-2.5 text-[#64748b]">
                          {item.unit}
                        </td>
                        <td className="px-3 py-2.5 text-[#94a3b8] text-xs">
                          {item.description || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-[#f1f5f9] animate-pulse">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className="h-4 bg-slate-100 rounded"
                style={{ width: j === 0 ? '80px' : '60px' }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InwardGatePassPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const { selectedWarehouseId } = useWarehouseStore();

  const routePrefill =
    (location.state as { prefill?: InwardGPPrefill } | null)?.prefill ?? null;

  const [gatePasses, setGatePasses] = useState<GatePass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'RECEIVED' | 'LINKED'
  >('ALL');
  const [purposeFilter, setPurposeFilter] = useState<
    (typeof INWARD_PURPOSES)[number] | 'ALL'
  >('ALL');

  const [slideOpen, setSlideOpen] = useState(false);
  const [editingGP, setEditingGP] = useState<GatePass | null>(null);
  const [activePrefill, setActivePrefill] = useState<InwardGPPrefill | null>(
    routePrefill,
  );
  const [savingForm, setSavingForm] = useState(false);

  // Party + item options fetched here, passed into form
  const [partyOptions, setPartyOptions] = useState<PartyOption[]>([]);
  const [itemOptions, setItemOptions] = useState<ItemOption[]>([]);

  const [detailGP, setDetailGP] = useState<GatePass | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<GatePass | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [verifyConfirm, setVerifyConfirm] = useState<GatePass | null>(null);
  const [rejectTarget, setRejectTarget] = useState<GatePass | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const canCreateGP = hasPermission(MODULES.GATE_PASS_INWARD, 'create');
  const canEditGP = hasPermission(MODULES.GATE_PASS_INWARD, 'edit');
  const canDeleteGP = hasPermission(MODULES.GATE_PASS_INWARD, 'delete');

  useEffect(() => {
    if (!routePrefill) return;
    setActivePrefill(routePrefill);
    setEditingGP(null);
    setSlideOpen(true);
    navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGPs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gpApi.list({ type: 'INWARD' });
      if (res.success) setGatePasses(res.data || []);
      else toast.error('Failed to load gate passes');
    } catch {
      toast.error('Failed to load gate passes');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchGPs();
  }, [fetchGPs]);

  // Fetch parties + items when form opens
  useEffect(() => {
    if (!slideOpen) return;
    getAllParties()
      .then((r) => setPartyOptions(r.success && r.data ? r.data : []))
      .catch(() => setPartyOptions([]));
    getAllItems()
      .then((r) => setItemOptions(r.success && r.data ? r.data : []))
      .catch(() => setItemOptions([]));
  }, [slideOpen]);

  const stats = useMemo(
    () => ({
      total: gatePasses.length,
      pending: gatePasses.filter((g) => g.verificationStatus === 'PENDING')
        .length,
      received: gatePasses.filter((g) => g.status === 'RECEIVED').length,
      rejected: gatePasses.filter((g) => g.verificationStatus === 'REJECTED')
        .length,
    }),
    [gatePasses],
  );

  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase();
    return gatePasses.filter((gp) => {
      const matchSearch =
        !q ||
        gp.gpNumber.toLowerCase().includes(q) ||
        gp.partyName.toLowerCase().includes(q) ||
        gp.vehicleNumber.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || gp.status === statusFilter;
      const matchPurpose =
        purposeFilter === 'ALL' || gp.purpose === purposeFilter;
      return matchSearch && matchStatus && matchPurpose;
    });
  }, [gatePasses, searchInput, statusFilter, purposeFilter]);

  const hasActiveFilters =
    statusFilter !== 'ALL' || purposeFilter !== 'ALL' || Boolean(searchInput);
  const clearFilters = () => {
    setStatusFilter('ALL');
    setPurposeFilter('ALL');
    setSearchInput('');
  };

  const openCreate = () => {
    setActivePrefill(null);
    setEditingGP(null);
    setSlideOpen(true);
  };
  const openEdit = (gp: GatePass) => {
    setActivePrefill(null);
    setEditingGP(gp);
    setSlideOpen(true);
  };
  const closeForm = () => {
    setSlideOpen(false);
    setEditingGP(null);
    setActivePrefill(null);
  };

  const handleSave = async (form: GPFormState) => {
    setSavingForm(true);
    try {
      const payload = {
        type: 'INWARD',
        purpose: form.purpose,
        partyName: form.partyName.trim(),
        warehouseId: selectedWarehouseId,
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        driverName: form.driverName || undefined,
        driverPhone: form.driverPhone || undefined,
        securityGuard: form.securityGuard.trim(),
        authorisedBy: form.authorisedBy.trim(),
        receivedBy: form.receivedBy || undefined,
        linkedDocType: form.linkedDocType || undefined,
        linkedDocNumber: form.linkedDocNumber || undefined,
        notes: form.notes || undefined,
        date: form.date,
        time: form.time,
        items: form.items
          .filter((i) => i.itemName.trim() && i.qty > 0)
          .map((i) => ({
            itemName: i.itemName.trim(),
            item_id: i.item_id || undefined,
            qty: i.qty,
            unit: i.unit || 'Pcs',
            description: i.description || undefined,
          })),
      };

      if (editingGP) {
        const res = await gatepassService.update(editingGP.id, payload);
        setGatePasses((prev) => prev.map((g) => (g.id === res.id ? res : g)));
        toast.success(`Gate Pass ${res.gpNumber} updated`);
      } else {
        const res = await gatepassService.create(payload as any);
        setGatePasses((prev) => [res, ...prev]);
        toast.success(`Inward Gate Pass ${res.gpNumber} created`);
      }
      closeForm();
      await fetchGPs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save gate pass');
    } finally {
      setSavingForm(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const res = await gpApi.remove(deleteConfirm.id);
      if (!res.success) throw new Error(res.message);
      toast.success(`${deleteConfirm.gpNumber} deleted`);
      setGatePasses((prev) => prev.filter((g) => g.id !== deleteConfirm.id));
      if (detailGP?.id === deleteConfirm.id) setDetailGP(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const handleVerify = async () => {
    if (!verifyConfirm) return;
    setVerifying(true);
    try {
      const res = await gpApi.verify(verifyConfirm.id);
      if (!res.success) throw new Error(res.message);
      toast.success(`${verifyConfirm.gpNumber} verified`);
      setGatePasses((prev) =>
        prev.map((g) => (g.id === res.data.id ? res.data : g)),
      );
      if (detailGP?.id === verifyConfirm.id) setDetailGP(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Verification failed');
    } finally {
      setVerifying(false);
      setVerifyConfirm(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      const res = await gpApi.reject(rejectTarget.id, reason);
      if (!res.success) throw new Error(res.message);
      toast.success(`${rejectTarget.gpNumber} rejected`);
      setGatePasses((prev) =>
        prev.map((g) => (g.id === res.data.id ? res.data : g)),
      );
      if (detailGP?.id === rejectTarget.id) setDetailGP(res.data);
    } catch (err: any) {
      toast.error(err.message || 'Rejection failed');
    } finally {
      setRejecting(false);
      setRejectTarget(null);
    }
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] cursor-pointer"
            >
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#1e293b]">
                  Inward Gate Pass
                </h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  INWARD
                </span>
              </div>
              <p className="text-sm text-[#64748b] mt-0.5">
                Goods entering the premises
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search GP no., party, vehicle..."
                className="h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-56"
              />
            </div>
            {canCreateGP && (
              <button
                onClick={openCreate}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap"
              >
                <i className="ri-add-line" /> New Inward GP
              </button>
            )}
          </div>
        </div>

        {/* Rejection alert */}
        {stats.rejected > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <i className="ri-shield-cross-line text-red-500 text-xl shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-700">
                {stats.rejected} Gate {stats.rejected === 1 ? 'Pass' : 'Passes'}{' '}
                Rejected
              </p>
              <p className="text-xs text-red-600">
                Review the rejection reason in the detail view.
              </p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            {
              label: 'Total GPs',
              value: stats.total,
              icon: 'ri-inbox-line',
              bg: 'bg-indigo-50',
              fg: 'text-[#4f46e5]',
              highlight: false,
            },
            {
              label: 'Ver. Pending',
              value: stats.pending,
              icon: 'ri-time-line',
              bg: 'bg-amber-50',
              fg: 'text-amber-600',
              highlight: false,
            },
            {
              label: 'Received',
              value: stats.received,
              icon: 'ri-inbox-archive-line',
              bg: 'bg-blue-50',
              fg: 'text-blue-600',
              highlight: false,
            },
            {
              label: 'Rejected',
              value: stats.rejected,
              icon: 'ri-shield-cross-line',
              bg: 'bg-red-50',
              fg: 'text-red-500',
              highlight: true,
            },
          ].map((c) => (
            <div
              key={c.label}
              className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${c.highlight && c.value > 0 ? 'border-red-200' : 'border-[#e2e8f0]'}`}
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.bg}`}
              >
                <i className={`${c.icon} text-lg ${c.fg}`} />
              </div>
              <div>
                <p
                  className={`text-2xl font-bold ${c.highlight && c.value > 0 ? 'text-red-600' : 'text-[#1e293b]'}`}
                >
                  {c.value}
                </p>
                <p className="text-xs text-[#64748b]">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'RECEIVED', 'LINKED'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === s
                    ? 'bg-[#4f46e5] text-white border-[#4f46e5]'
                    : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]/40'
                }`}
              >
                {s === 'ALL' ? 'All Status' : s}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-[#e2e8f0]" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setPurposeFilter('ALL')}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                purposeFilter === 'ALL'
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-slate-400'
              }`}
            >
              All Purpose
            </button>
            {INWARD_PURPOSES.map((p) => (
              <button
                key={p}
                onClick={() => setPurposeFilter(p)}
                className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                  purposeFilter === p
                    ? 'bg-slate-700 text-white border-slate-700'
                    : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-slate-400'
                }`}
              >
                {PURPOSE_LABELS[p]}
              </button>
            ))}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto h-8 px-3 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 cursor-pointer whitespace-nowrap"
            >
              <i className="ri-close-line mr-1" />
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  {[
                    'GP Number',
                    'Date / Time',
                    'Party',
                    'Vehicle',
                    'Purpose',
                    'Items',
                    'Status',
                    'Ver. Status',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <i className="ri-inbox-line text-4xl text-[#e2e8f0] block mb-2" />
                      <p className="text-[#94a3b8] text-sm">
                        No inward gate passes found
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-2 text-xs text-[#4f46e5] hover:underline cursor-pointer"
                        >
                          Clear filters
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtered.map((gp, idx) => {
                    const sb = statusBadge(gp.status);
                    const vb = verBadge(gp.verificationStatus);
                    const isRejected = gp.verificationStatus === 'REJECTED';
                    return (
                      <tr
                        key={gp.id}
                        onClick={() => setDetailGP(gp)}
                        className={[
                          'border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors cursor-pointer',
                          idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : '',
                          isRejected ? 'border-l-4 border-l-red-400' : '',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-bold text-[#1e293b]">
                            {gp.gpNumber}
                          </p>
                          {(gp.linkedDocLabel || gp.linkedDocNumber) && (
                            <p className="text-[10px] text-indigo-500 font-medium mt-0.5 flex items-center gap-0.5">
                              <i className="ri-links-line" />
                              {gp.linkedDocLabel}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <p className="text-xs text-[#1e293b]">
                            {gp.date?.slice(0, 10)}
                          </p>
                          <p className="text-xs text-[#94a3b8]">
                            {gp.time?.slice(0, 5)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-[#1e293b] whitespace-nowrap">
                            {gp.partyName}
                          </p>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-[#64748b]">
                            {gp.vehicleNumber}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs text-[#64748b]">
                            {PURPOSE_LABELS[
                              gp.purpose as keyof typeof PURPOSE_LABELS
                            ] ?? gp.purpose}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-xs font-semibold text-[#1e293b]">
                            {gp.itemCount ?? gp.items?.length ?? 0} items
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${sb.cls}`}
                          >
                            <i className={`${sb.icon} text-xs`} /> {gp.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${vb.cls}`}
                          >
                            <i className={`${vb.icon} text-xs`} /> {vb.label}
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 whitespace-nowrap"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1">
                            {gp.verificationStatus === 'PENDING' &&
                              canEditGP && (
                                <>
                                  <button
                                    onClick={() => setVerifyConfirm(gp)}
                                    title="Verify"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-50 text-[#64748b] hover:text-green-600 transition"
                                  >
                                    <i className="ri-shield-check-line text-sm" />
                                  </button>
                                  <button
                                    onClick={() => setRejectTarget(gp)}
                                    title="Reject"
                                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition"
                                  >
                                    <i className="ri-shield-cross-line text-sm" />
                                  </button>
                                </>
                              )}
                            {canEditGP && (
                              <button
                                onClick={() => openEdit(gp)}
                                title="Edit"
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition"
                              >
                                <i className="ri-edit-line text-sm" />
                              </button>
                            )}
                            {canDeleteGP && (
                              <button
                                onClick={() => setDeleteConfirm(gp)}
                                title="Delete"
                                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">
              Showing {filtered.length} of {gatePasses.length} gate passes
            </p>
          </div>
        </div>

        <DetailModal
          gp={detailGP}
          canEdit={canEditGP}
          onClose={() => setDetailGP(null)}
          onVerify={(gp) => {
            setDetailGP(null);
            setVerifyConfirm(gp);
          }}
          onReject={(gp) => {
            setDetailGP(null);
            setRejectTarget(gp);
          }}
        />

        {/* ── InwardGPForm: no docOptions/fetchDocs needed — form owns that via API ── */}
        <InwardGPForm
          open={slideOpen}
          editing={editingGP}
          prefill={activePrefill}
          saving={savingForm}
          partyOptions={partyOptions}
          itemOptions={itemOptions}
          onClose={closeForm}
          onSave={handleSave}
        />

        <ConfirmDialog
          open={!!deleteConfirm}
          title="Delete Gate Pass"
          message={`Delete "${deleteConfirm?.gpNumber}"? This cannot be undone.`}
          variant="danger"
          confirmLabel={deleting ? 'Deleting…' : 'Yes, Delete'}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />

        <ConfirmDialog
          open={!!verifyConfirm}
          title="Verify Gate Pass"
          message={`Mark "${verifyConfirm?.gpNumber}" as verified?`}
          variant="primary"
          confirmLabel={verifying ? 'Verifying…' : 'Yes, Verify'}
          onConfirm={handleVerify}
          onCancel={() => setVerifyConfirm(null)}
        />

        <RejectDialog
          open={!!rejectTarget}
          gpNumber={rejectTarget?.gpNumber ?? ''}
          loading={rejecting}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
        />
      </div>
    </AppLayout>
  );
}
