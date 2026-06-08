import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';
import { MODULES } from '@/utils/permissions.js';
import { useAuth } from '@/contexts/AuthContext';
import { gatepassService, type GatePass, type GPPurpose, type LinkedDocOption, type LinkedDocType } from '@/services/gatepassService';
import { getAllParties } from '@/api/party.api';
import type { PartyResponse } from '@/api/party.api';
import { getAllItems } from '@/api/item.api';
import type { ItemResponse } from '@/api/item.api';
import { useWarehouseStore } from '@/stores/warehouseStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type OutwardStatus = 'OPEN' | 'CLOSED' | 'RETURNED' | 'OVERDUE';
type VerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

interface FormItem { itemName: string; qty: number; unit: string; description: string }

interface GPFormState {
  date: string;
  time: string;
  partyName: string;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  securityGuard: string;
  authorisedBy: string;
  purpose: GPPurpose;
  customPurpose: string;
  isReturnable: boolean;
  expectedReturnDate: string;
  linkedDocType: string;
  linkedDocNumber: string;
  notes: string;
  items: FormItem[];
}

// DocOption is imported from gatepassService as LinkedDocOption

export interface OutwardGPPrefill {
  partyName?: string;
  items?: Array<{ itemName: string; qty: number; unit?: string; description?: string }>;
  linkedDocType?: string;
  linkedDocNumber?: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const OUTWARD_PURPOSES: GPPurpose[] = ['SALE', 'TRANSFER', 'RETURN', 'SAMPLE', 'OTHER'];

const PURPOSE_LABELS: Record<GPPurpose, string> = {
  SALE: 'Sale', TRANSFER: 'Transfer', RETURN: 'Return', SAMPLE: 'Sample',
  OTHER: 'Other', PURCHASE: 'Purchase', SALE_RETURN: 'Sale Return', TRANSFER_IN: 'Transfer In',
};

const statusBadge = (s: OutwardStatus | string) => {
  if (s === 'OPEN')     return { cls: 'bg-blue-100 text-blue-700',   icon: 'ri-door-open-line' };
  if (s === 'CLOSED')   return { cls: 'bg-slate-100 text-slate-600', icon: 'ri-checkbox-line' };
  if (s === 'RETURNED') return { cls: 'bg-green-100 text-green-700', icon: 'ri-arrow-go-back-line' };
  return { cls: 'bg-red-100 text-red-600', icon: 'ri-alarm-warning-line' };
};

const verBadge = (v: VerStatus | string) => {
  if (v === 'VERIFIED') return { cls: 'bg-green-100 text-green-700', icon: 'ri-shield-check-line', label: 'Verified' };
  if (v === 'REJECTED') return { cls: 'bg-red-100 text-red-600',    icon: 'ri-shield-cross-line', label: 'Rejected' };
  return { cls: 'bg-amber-100 text-amber-700', icon: 'ri-time-line', label: 'Pending' };
};

const emptyItem = (): FormItem => ({ itemName: '', qty: 1, unit: 'Pcs', description: '' });

const nowDT = () => {
  const d = new Date();
  return { date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0, 5) };
};

const EMPTY_FORM = (): GPFormState => ({
  ...nowDT(),
  partyName: '', vehicleNumber: '', driverName: '', driverPhone: '',
  securityGuard: '', authorisedBy: 'Admin User',
  purpose: 'SALE', customPurpose: '',
  isReturnable: false, expectedReturnDate: '',
  linkedDocType: '', linkedDocNumber: '', notes: '',
  items: [emptyItem()],
});

// ─── Form (slide-over) ────────────────────────────────────────────────────────

interface FormProps {
  open: boolean;
  editing: GatePass | null;
  isRecreating: boolean;
  prefill: OutwardGPPrefill | null;
  saving: boolean;
  onClose: () => void;
  onSave: (form: GPFormState) => Promise<void>;
}

function OutwardGPForm({ open, editing, isRecreating, prefill, saving, onClose, onSave }: FormProps) {
  const [form, setForm]           = useState<GPFormState>(EMPTY_FORM());
  const [errors, setErrors]       = useState<Record<string, string>>({});
  const [partyOptions, setPartyOptions] = useState<PartyResponse[]>([]);
  const [itemOptions, setItemOptions]   = useState<ItemResponse[]>([]);
  const [allDocOptions, setAllDocOptions] = useState<LinkedDocOption[]>([]);
  const [docsLoading, setDocsLoading]     = useState(false);
  const fetchIdRef = useRef(0);

  // ── Derive filtered docs based on selected party ──────────────────────────
  const filteredDocOptions = useMemo(() => {
    if (!form.partyName || !allDocOptions.length) return allDocOptions;
    return allDocOptions.filter(
      (d) => d.partyName?.toLowerCase() === form.partyName.toLowerCase()
    );
  }, [allDocOptions, form.partyName]);

  // ── Items available in the item dropdown ──────────────────────────────────
  const activeItemOptions = useMemo(() => {
    if (!form.linkedDocNumber) return itemOptions;
    const doc = allDocOptions.find((d) => d.id === form.linkedDocNumber);
    if (!doc?.items?.length) return itemOptions;
    return doc.items.map((i) => ({
      id:        i.item_id || '',
      name:      i.itemName,
      unit_name: i.unit,
    }));
  }, [form.linkedDocNumber, allDocOptions, itemOptions]);

  // ── Populate form when panel opens ────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        date:            editing.date?.slice(0, 10)    ?? nowDT().date,
        time:            editing.time?.slice(0, 5)     ?? nowDT().time,
        partyName:       editing.partyName,
        vehicleNumber:   editing.vehicleNumber,
        driverName:      editing.driverName    ?? '',
        driverPhone:     editing.driverPhone   ?? '',
        securityGuard:   editing.securityGuard,
        authorisedBy:    editing.authorisedBy,
        purpose:         editing.purpose as GPPurpose,
        customPurpose:   editing.customPurpose ?? '',
        isReturnable:    editing.isReturnable,
        expectedReturnDate: editing.expectedReturnDate ?? '',
        linkedDocType:   editing.linkedDocType   ?? '',
        linkedDocNumber: editing.linkedDocNumber ?? '',
        notes:           editing.notes           ?? '',
        items: editing.items?.length
          ? editing.items.map((i) => ({
              itemName: i.itemName, qty: i.qty,
              unit: i.unit, description: i.description ?? '',
            }))
          : [emptyItem()],
      });
      if (editing.linkedDocType) fetchDocs(editing.linkedDocType, editing.partyName);
    } else {
      const base = EMPTY_FORM();
      if (prefill) {
        base.partyName       = prefill.partyName       ?? '';
        base.linkedDocType   = prefill.linkedDocType   ?? '';
        base.linkedDocNumber = prefill.linkedDocNumber ?? '';
        base.notes           = prefill.notes           ?? '';
        if (prefill.items?.length) {
          base.items = prefill.items.map((i) => ({
            itemName: i.itemName, qty: i.qty,
            unit: i.unit ?? 'Pcs', description: i.description ?? '',
          }));
        }
      }
      setForm(base);
      setAllDocOptions([]);
      if (prefill?.linkedDocType) fetchDocs(prefill.linkedDocType, prefill.partyName ?? '');
    }
    setErrors({});
  }, [open, editing, prefill]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'F9') { e.preventDefault(); void handleSubmit(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch parties ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    getAllParties()
      .then((res) => setPartyOptions(res.success && res.data ? res.data : []))
      .catch(() => setPartyOptions([]));
  }, [open]);

  // ── Fetch items ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    getAllItems()
      .then((res) => setItemOptions(res.success && res.data ? res.data : []))
      .catch(() => setItemOptions([]));
  }, [open]);

  const set = <K extends keyof GPFormState>(k: K, v: GPFormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const setItem = (i: number, field: keyof FormItem, v: string | number) =>
    setForm((p) => {
      const items = [...p.items];
      items[i] = { ...items[i], [field]: v };
      return { ...p, items };
    });

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.partyName.trim())     e.partyName     = 'Required';
    if (!form.vehicleNumber.trim()) e.vehicleNumber  = 'Required';
    if (!form.securityGuard.trim()) e.securityGuard  = 'Required';
    if (!form.authorisedBy.trim())  e.authorisedBy   = 'Required';
    if (form.isReturnable && !form.expectedReturnDate) e.expectedReturnDate = 'Required when returnable';
    if (form.items.some((i) => !i.itemName.trim())) e.items = 'All item names are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Fetch linked docs from API ─────────────────────────────────────────────
  // Sends docType + partyId/partyName — backend returns only matching docs with items.
  const fetchDocs = useCallback(async (docType: string, partyName: string) => {
    if (!docType) { setAllDocOptions([]); return; }

    const fetchId = ++fetchIdRef.current;
    setDocsLoading(true);
    setAllDocOptions([]);

    try {
      const partyId = partyOptions.find(
        (p) => p.name.toLowerCase() === partyName.toLowerCase()
      )?.id;

      const docs = await gatepassService.getLinkedDocs(
        docType as LinkedDocType,
        partyId,
        partyId ? undefined : partyName || undefined,
      );

      if (fetchId !== fetchIdRef.current) return;
      setAllDocOptions(docs);

      // Auto-select if navigated here with a prefill linkedDocNumber
      if (prefill?.linkedDocNumber) {
        const match = docs.find((d) => d.id === prefill.linkedDocNumber);
        if (match) {
          setForm((prev) => ({
            ...prev,
            linkedDocNumber: match.id,
            partyName: match.partyName || prev.partyName,
            items: match.items?.length
              ? match.items.map((i) => ({
                  itemName: i.itemName, qty: i.qty,
                  unit: i.unit, description: '',
                }))
              : prev.items,
          }));
        }
      }
    } catch (err) {
      if (fetchId !== fetchIdRef.current) return;
      console.error('fetchDocs error:', err);
      setAllDocOptions([]);
    } finally {
      if (fetchId === fetchIdRef.current) setDocsLoading(false);
    }
  }, [partyOptions, prefill?.linkedDocNumber]);

  // ── Party change: re-fetch docs for new party, reset doc if mismatched ────
  const handlePartyChange = (newParty: string) => {
    setErrors((p) => ({ ...p, partyName: '' }));
    const currentDoc   = allDocOptions.find((d) => d.id === form.linkedDocNumber);
    const stillMatches = currentDoc?.partyName?.toLowerCase() === newParty.toLowerCase();

    setForm((prev) => ({
      ...prev,
      partyName:       newParty,
      linkedDocNumber: stillMatches ? prev.linkedDocNumber : '',
      items:           stillMatches ? prev.items : [emptyItem()],
    }));

    // Re-fetch docs scoped to the new party
    if (form.linkedDocType) fetchDocs(form.linkedDocType, newParty);
  };

  // ── Doc type change ────────────────────────────────────────────────────────
  const handleDocTypeChange = (type: string) => {
    setForm((prev) => ({ ...prev, linkedDocType: type, linkedDocNumber: '', items: [emptyItem()] }));
    fetchDocs(type, form.partyName);
  };

  // ── Doc selection: auto-fill party + items ─────────────────────────────────
  const handleDocSelect = (selectedId: string) => {
    const doc = allDocOptions.find((d) => d.id === selectedId);
    if (!doc) { set('linkedDocNumber', selectedId); return; }

    setForm((prev) => ({
      ...prev,
      linkedDocNumber: selectedId,
      partyName: doc.partyName || prev.partyName,
      items: doc.items?.length
        ? doc.items.map((i: any): FormItem => ({
            itemName:    i.itemName || i.name || '',
            qty:         i.qty      || i.quantity || i.orderedQty || 1,
            unit:        i.unit     || i.unitName || 'Pcs',
            description: i.description || '',
          }))
        : [emptyItem()],
    }));
  };

  const handleSubmit = async () => { if (!validate()) return; await onSave(form); };

  if (!open) return null;

  const fieldCls = (err?: string) =>
    `w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
      err ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
    }`;
  const lb = 'text-xs font-semibold text-[#64748b] uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative ml-auto h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">OUTWARD</span>
              <h3 className="text-base font-semibold text-[#1e293b]">
                {isRecreating ? 'Recreate Gate Pass' : editing ? 'Edit Gate Pass' : 'New Outward Gate Pass'}
              </h3>
            </div>
            <p className="text-xs text-[#64748b]">Goods leaving premises</p>
          </div>
          <button onClick={saving ? undefined : onClose} disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer disabled:opacity-50">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Recreating banner */}
        {isRecreating && editing && (
          <div className="mx-6 mt-4 shrink-0 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <i className="ri-alert-line shrink-0 mt-0.5" />
            <p>Recreating from rejected GP <strong>{editing.gpNumber}</strong>.
              {editing.rejectionReason && ` Reason: ${editing.rejectionReason}`}
            </p>
          </div>
        )}

        {/* Prefill banner */}
        {!editing && prefill?.linkedDocNumber && (
          <div className="mx-6 mt-4 shrink-0 flex items-center gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs">
            <i className="ri-file-list-3-line" />
            Pre-filled from <strong>{prefill.linkedDocType} {prefill.linkedDocNumber}</strong>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className={lb}>Date *</label>
              <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className={fieldCls()} />
            </div>
            <div className="space-y-1.5"><label className={lb}>Time *</label>
              <input type="time" value={form.time} onChange={(e) => set('time', e.target.value)} className={fieldCls()} />
            </div>
          </div>

          {/* Party + Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={lb}>Party Name *</label>
              <select value={form.partyName} onChange={(e) => handlePartyChange(e.target.value)}
                className={fieldCls(errors.partyName)}>
                <option value="">Select Party</option>
                {partyOptions.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              {errors.partyName && <p className="text-xs text-red-500">{errors.partyName}</p>}
            </div>
            <div className="space-y-1.5"><label className={lb}>Vehicle Number *</label>
              <input value={form.vehicleNumber}
                onChange={(e) => { set('vehicleNumber', e.target.value.toUpperCase()); setErrors((p) => ({ ...p, vehicleNumber: '' })); }}
                placeholder="MH-12-AB-1234" className={`${fieldCls(errors.vehicleNumber)} font-mono`} />
              {errors.vehicleNumber && <p className="text-xs text-red-500">{errors.vehicleNumber}</p>}
            </div>
          </div>

          {/* Driver */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className={lb}>Driver Name</label>
              <input value={form.driverName} onChange={(e) => set('driverName', e.target.value)} placeholder="Optional" className={fieldCls()} />
            </div>
            <div className="space-y-1.5"><label className={lb}>Driver Phone</label>
              <input value={form.driverPhone} onChange={(e) => set('driverPhone', e.target.value)} placeholder="Optional" className={fieldCls()} />
            </div>
          </div>

          {/* Guard + Auth */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><label className={lb}>Security Guard *</label>
              <input value={form.securityGuard}
                onChange={(e) => { set('securityGuard', e.target.value); setErrors((p) => ({ ...p, securityGuard: '' })); }}
                placeholder="Guard on duty" className={fieldCls(errors.securityGuard)} />
              {errors.securityGuard && <p className="text-xs text-red-500">{errors.securityGuard}</p>}
            </div>
            <div className="space-y-1.5"><label className={lb}>Authorised By *</label>
              <input value={form.authorisedBy}
                onChange={(e) => { set('authorisedBy', e.target.value); setErrors((p) => ({ ...p, authorisedBy: '' })); }}
                className={fieldCls(errors.authorisedBy)} />
              {errors.authorisedBy && <p className="text-xs text-red-500">{errors.authorisedBy}</p>}
            </div>
          </div>

          {/* Purpose */}
          <div className="space-y-1.5"><label className={lb}>Purpose *</label>
            <div className="flex flex-wrap gap-2">
              {OUTWARD_PURPOSES.map((p) => (
                <button key={p} type="button" onClick={() => set('purpose', p)}
                  className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                    form.purpose === p ? 'bg-[#4f46e5] text-white border-[#4f46e5]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]'
                  }`}>
                  {PURPOSE_LABELS[p]}
                </button>
              ))}
            </div>
            {form.purpose === 'OTHER' && (
              <input value={form.customPurpose} onChange={(e) => set('customPurpose', e.target.value)}
                placeholder="Specify purpose..." className={`${fieldCls()} mt-2`} />
            )}
          </div>

          {/* ── Linked Doc ── */}
          <div className="rounded-xl border border-[#e2e8f0] p-4 space-y-3 bg-[#f8fafc]">
            <p className={`${lb} flex items-center gap-1.5`}>
              <i className="ri-links-line text-[#4f46e5]" /> Linked Document
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Doc Type */}
              <div className="space-y-1.5">
                <label className={lb}>Doc Type</label>
                <select value={form.linkedDocType} onChange={(e) => handleDocTypeChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]">
                  <option value="">None</option>
                  <option value="SALES_INVOICE">Sales Invoice</option>
                  <option value="CHALLAN">Delivery Challan</option>
                  <option value="STOCK_TRANSFER">Stock Transfer</option>
                  <option value="PURCHASE_RETURN">Purchase Return</option>
                </select>
              </div>

              {/* Doc Number — filtered by party */}
              <div className="space-y-1.5">
                <label className={lb}>
                  Doc Number
                  {docsLoading && <span className="ml-2 normal-case font-normal text-indigo-400">loading…</span>}
                  {!docsLoading && form.linkedDocType && form.partyName && (
                    <span className="ml-1 normal-case font-normal text-indigo-500">
                      — {filteredDocOptions.length} found
                    </span>
                  )}
                </label>
                <select
                  value={form.linkedDocNumber}
                  disabled={!form.linkedDocType || docsLoading}
                  onChange={(e) => handleDocSelect(e.target.value)}
                  className={fieldCls(errors.linkedDocNumber)}
                >
                  <option value="">
                    {!form.linkedDocType
                      ? 'Select type first'
                      : docsLoading
                        ? 'Loading…'
                        : filteredDocOptions.length === 0
                          ? form.partyName
                            ? `No ${form.linkedDocType} for this party`
                            : 'No documents found'
                          : 'Select Document'}
                  </option>
                  {filteredDocOptions.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.number || 'No Number'}
                      {doc.partyName ? ` — ${doc.partyName}` : ''}
                    </option>
                  ))}
                </select>

                {form.linkedDocType && !form.partyName && !docsLoading && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <i className="ri-information-line" />
                    Select a party above to filter documents
                  </p>
                )}
              </div>
            </div>

            {/* Selected doc info pill */}
            {form.linkedDocNumber && (() => {
              const doc = allDocOptions.find((d) => d.id === form.linkedDocNumber);
              return doc ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
                  <i className="ri-file-check-line" />
                  <span className="font-semibold">{doc.number}</span>
                  {doc.partyName && <span className="text-indigo-400">· {doc.partyName}</span>}
                  {doc.items?.length > 0 && (
                    <span className="ml-auto text-indigo-400">{doc.items.length} items auto-filled</span>
                  )}
                </div>
              ) : null;
            })()}
          </div>

          {/* Is Returnable */}
          <div className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
            form.isReturnable ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-[#e2e8f0]'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                form.isReturnable ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'
              }`}>
                <i className={`text-lg ${form.isReturnable ? 'ri-arrow-go-back-line' : 'ri-truck-line'}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1e293b]">Returnable Material</p>
                <p className="text-xs text-[#64748b] mt-0.5">
                  {form.isReturnable ? 'Goods are expected to return back to premises' : 'Goods are permanently dispatched'}
                </p>
              </div>
            </div>
            <button type="button" onClick={() => set('isReturnable', !form.isReturnable)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all duration-300 cursor-pointer ${
                form.isReturnable ? 'bg-[#4f46e5]' : 'bg-slate-300'
              }`}>
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                form.isReturnable ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {form.isReturnable && (
            <div className="space-y-1.5"><label className={lb}>Expected Return Date *</label>
              <input type="date" value={form.expectedReturnDate}
                onChange={(e) => { set('expectedReturnDate', e.target.value); setErrors((p) => ({ ...p, expectedReturnDate: '' })); }}
                className={fieldCls(errors.expectedReturnDate)} />
              {errors.expectedReturnDate && <p className="text-xs text-red-500">{errors.expectedReturnDate}</p>}
            </div>
          )}

          {/* Items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={lb}>
                Items *{' '}
                {errors.items && <span className="text-red-500 ml-2 normal-case font-normal">{errors.items}</span>}
                {form.linkedDocNumber && activeItemOptions.length !== itemOptions.length && (
                  <span className="ml-2 normal-case font-normal text-indigo-500">
                    — {activeItemOptions.length} from linked doc
                  </span>
                )}
              </label>
              <button type="button" onClick={() => setForm((p) => ({ ...p, items: [...p.items, emptyItem()] }))}
                className="flex items-center gap-1 text-xs text-[#4f46e5] font-medium hover:text-indigo-700 cursor-pointer">
                <i className="ri-add-line" /> Add Row
              </button>
            </div>
            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fafc]">
                  <tr>{['Item Name', 'Qty', 'Unit', 'Description', ''].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[#64748b] uppercase border-b border-[#e2e8f0]">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className="border-b border-[#f1f5f9]">
                      <td className="px-2 py-1.5">
                        <select value={item.itemName} onChange={(e) => {
                            const selected = activeItemOptions.find((it) => it.name === e.target.value);
                            setForm((p) => {
                              const items = [...p.items];
                              items[i] = {
                                ...items[i],
                                itemName: e.target.value,
                                unit: selected?.unit_name || items[i].unit || 'Pcs',
                              };
                              return { ...p, items };
                            });
                          }}
                          className="w-full h-8 px-2 rounded border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]">
                          <option value="">Select Item</option>
                          {activeItemOptions.map((it) => (
                            <option key={it.id || it.name} value={it.name}>{it.name}</option>
                          ))}
                          {item.itemName && !activeItemOptions.find((it) => it.name === item.itemName) && (
                            <option value={item.itemName}>{item.itemName}</option>
                          )}
                        </select>
                      </td>
                      <td className="px-2 py-1.5 w-16">
                        <input type="number" value={item.qty}
                          onChange={(e) => setItem(i, 'qty', parseFloat(e.target.value) || 0)}
                          min={1} className="w-full h-8 px-2 rounded border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]" />
                      </td>
                      <td className="px-2 py-1.5 w-20">
                        <input value={item.unit} onChange={(e) => setItem(i, 'unit', e.target.value)}
                          placeholder="Pcs" className="w-full h-8 px-2 rounded border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={item.description} onChange={(e) => setItem(i, 'description', e.target.value)}
                          placeholder="Optional" className="w-full h-8 px-2 rounded border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]" />
                      </td>
                      <td className="px-2 py-1.5 w-8">
                        {form.items.length > 1 && (
                          <button onClick={() => setForm((p) => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))}
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-[#94a3b8] hover:text-red-500 cursor-pointer">
                            <i className="ri-close-line text-xs" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5"><label className={lb}>Notes</label>
            <input value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Any delivery remarks..." className={fieldCls()} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] shrink-0">
          <p className="text-[11px] text-[#94a3b8]">
            <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">F9</kbd> save &nbsp;
            <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">Esc</kbd> cancel
          </p>
          <div className="flex gap-2">
            <button onClick={saving ? undefined : onClose} disabled={saving}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => void handleSubmit()} disabled={saving}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer">
              {saving
                ? <><i className="ri-loader-4-line animate-spin" /> Saving…</>
                : <><i className="ri-save-line" /> {isRecreating ? 'Recreate' : editing ? 'Update' : 'Save'} Gate Pass</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OutwardGatePassPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast    = useToast();
  const { selectedWarehouseId } = useWarehouseStore();

  const routePrefill = (location.state as { prefill?: OutwardGPPrefill } | null)?.prefill ?? null;
  const [activePrefill, setActivePrefill] = useState<OutwardGPPrefill | null>(routePrefill);

  const [gatePasses, setGatePasses]     = useState<GatePass[]>([]);
  const [loading, setLoading]           = useState(true);
  const [stats, setStats]               = useState({ total: 0, open: 0, overdue: 0, rejected: 0 });
  const [searchInput, setSearchInput]   = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OutwardStatus>('ALL');
  const [slideOpen, setSlideOpen]       = useState(false);
  const [editingGP, setEditingGP]       = useState<GatePass | null>(null);
  const [isRecreating, setIsRecreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<GatePass | null>(null);
  const [detailGP, setDetailGP]         = useState<GatePass | null>(null);
  const [savingForm, setSavingForm]     = useState(false);
  const [deleting, setDeleting]         = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (routePrefill) {
      setActivePrefill(routePrefill);
      setEditingGP(null);
      setIsRecreating(false);
      setSlideOpen(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchGPs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await gatepassService.list({ type: 'OUTWARD', limit: 100 });
      const data =
        Array.isArray(res?.data)
          ? res.data
          : Array.isArray((res as any)?.data?.data)
            ? (res as any).data.data
            : [];
      setGatePasses(data);
      setStats({
        total:    data.length,
        open:     data.filter((g) => g.status === 'OPEN').length,
        overdue:  data.filter((g) => g.status === 'OVERDUE').length,
        rejected: data.filter((g) => g.verificationStatus === 'REJECTED').length,
      });
    } catch {
      toast.error('Failed to load outward gate passes');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchGPs(); }, [fetchGPs]);

  const filtered = useMemo(() => {
    const q = searchInput.toLowerCase();
    return gatePasses.filter((gp) => {
      const matchSearch = !q
        || gp.gpNumber.toLowerCase().includes(q)
        || gp.partyName.toLowerCase().includes(q)
        || gp.vehicleNumber.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'ALL' || gp.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [gatePasses, searchInput, statusFilter]);

  const handleSave = async (form: GPFormState) => {
    setSavingForm(true);
    try {
      const payload = {
        warehouseId:        selectedWarehouseId,
        type:               'OUTWARD' as const,
        purpose:            form.purpose,
        customPurpose:      form.customPurpose || undefined,
        partyName:          form.partyName.trim(),
        vehicleNumber:      form.vehicleNumber.trim().toUpperCase(),
        driverName:         form.driverName  || undefined,
        driverPhone:        form.driverPhone || undefined,
        securityGuard:      form.securityGuard.trim(),
        authorisedBy:       form.authorisedBy.trim(),
        isReturnable:       form.isReturnable,
        expectedReturnDate: form.isReturnable ? (form.expectedReturnDate || undefined) : undefined,
        linkedDocType:      form.linkedDocType   || undefined,
        linkedDocNumber:    form.linkedDocNumber || undefined,
        notes:              form.notes           || undefined,
        date:               form.date,
        time:               form.time,
        items: form.items.filter((i) => i.itemName.trim() && i.qty > 0).map((i) => ({
          itemName: i.itemName.trim(), qty: i.qty,
          unit: i.unit || 'Pcs', description: i.description || undefined,
        })),
      };

      if (editingGP && !isRecreating) {
        const updated = await gatepassService.update(editingGP.id, payload);
        setGatePasses((prev) => prev.map((g) => g.id === updated.id ? updated : g));
        toast.success(`Gate Pass ${updated.gpNumber} updated`);
      } else if (isRecreating && editingGP) {
        const recreated = await gatepassService.recreate(editingGP.id);
        setGatePasses((prev) => [recreated, ...prev.filter((g) => g.id !== editingGP.id)]);
        toast.success(`${recreated.gpNumber} recreated from ${editingGP.gpNumber}`);
      } else {
        const created = await gatepassService.create(payload);
        setGatePasses((prev) => [created, ...prev]);
        toast.success(`Outward Gate Pass ${created.gpNumber} created`);
      }
      setSlideOpen(false);
      setEditingGP(null);
      setIsRecreating(false);
      await fetchGPs();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save gate pass');
    } finally {
      setSavingForm(false);
    }
  };

  const handleMarkReturned = async (gp: GatePass) => {
    setActionLoading(gp.id + '-return');
    try {
      const updated = await gatepassService.markReturned(gp.id);
      setGatePasses((prev) => prev.map((g) => g.id === updated.id ? updated : g));
      toast.success(`${gp.gpNumber} marked as returned`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to mark as returned');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await gatepassService.delete(deleteConfirm.id);
      toast.success(`${deleteConfirm.gpNumber} deleted`);
      setGatePasses((prev) => prev.filter((g) => g.id !== deleteConfirm.id));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const SkeletonRows = () => (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-[#f1f5f9] animate-pulse">
          {Array.from({ length: 9 }).map((_, j) => (
            <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-100 rounded" /></td>
          ))}
        </tr>
      ))}
    </>
  );

  const { hasPermission } = useAuth();
  const canCreateGP = hasPermission(MODULES.GATE_PASS_OUTWARD, 'create');
  const canEditGP   = hasPermission(MODULES.GATE_PASS_OUTWARD, 'edit');
  const canDeleteGP = hasPermission(MODULES.GATE_PASS_OUTWARD, 'delete');

  return (
    <AppLayout>
      <div className="p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] cursor-pointer">
              <i className="ri-arrow-left-line text-base" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[#1e293b]">Outward Gate Pass</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">OUTWARD</span>
              </div>
              <p className="text-sm text-[#64748b] mt-0.5">Goods leaving the premises</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
              <input type="text" value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search GP no., party, vehicle..."
                className="h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-56" />
            </div>
            {canCreateGP && (
              <button onClick={() => { setActivePrefill(null); setEditingGP(null); setIsRecreating(false); setSlideOpen(true); }}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer whitespace-nowrap">
                <i className="ri-add-line" /> New Outward GP
              </button>
            )}
          </div>
        </div>

        {/* Rejected banner */}
        {stats.rejected > 0 && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <i className="ri-shield-cross-line text-red-500 text-xl shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                {stats.rejected} Gate {stats.rejected === 1 ? 'Pass' : 'Passes'} Rejected
              </p>
              <p className="text-xs text-red-600">Review and recreate via the Recreate button.</p>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total GPs',        value: stats.total,    icon: 'ri-file-list-3-line',  color: 'indigo' },
            { label: 'Open / Returnable', value: stats.open,     icon: 'ri-door-open-line',    color: 'blue' },
            { label: 'Overdue Returns',   value: stats.overdue,  icon: 'ri-alarm-warning-line', color: 'red' },
            { label: 'Rejected',          value: stats.rejected, icon: 'ri-shield-cross-line',  color: 'red' },
          ].map((c) => (
            <div key={c.label}
              className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${c.color === 'red' && c.value > 0 ? 'border-red-200' : 'border-[#e2e8f0]'}`}>
              <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${
                c.color === 'indigo' ? 'bg-indigo-50' : c.color === 'blue' ? 'bg-blue-50' : 'bg-red-50'}`}>
                <i className={`${c.icon} text-lg ${
                  c.color === 'indigo' ? 'text-[#4f46e5]' : c.color === 'blue' ? 'text-blue-600' : 'text-red-500'}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${c.color === 'red' && c.value > 0 ? 'text-red-600' : 'text-[#1e293b]'}`}>
                  {c.value}
                </p>
                <p className="text-xs text-[#64748b]">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          {(['ALL', 'OPEN', 'CLOSED', 'RETURNED', 'OVERDUE'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === s ? 'bg-[#4f46e5] text-white border-[#4f46e5]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]/40'
              }`}>
              {s === 'ALL' ? 'All Status' : s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {['GP Number', 'Date/Time', 'Party', 'Vehicle', 'Purpose', 'Items', 'Status', 'Ver. Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows /> : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center">
                  <i className="ri-file-list-3-line text-4xl text-[#e2e8f0] block mb-2" />
                  <p className="text-[#94a3b8] text-sm">No outward gate passes found</p>
                </td></tr>
              ) : filtered.map((gp, idx) => {
                const sb = statusBadge(gp.status);
                const vb = verBadge(gp.verificationStatus);
                const isRej = gp.verificationStatus === 'REJECTED';
                return (
                  <tr key={gp.id} onClick={() => setDetailGP(gp)}
                    className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors cursor-pointer ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''} ${isRej ? 'border-l-4 border-l-red-400' : ''}`}>
                    <td className="px-4 py-3">
                      <p className="font-mono text-xs font-bold text-[#1e293b]">{gp.gpNumber}</p>
                      {gp.isRecreated && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Recreated</span>}
                      {(gp.linkedDocLabel || gp.linkedDocNumber) && (
                        <p className="text-[10px] text-indigo-500 font-medium mt-0.5 flex items-center gap-0.5">
                          <i className="ri-links-line" />
                          {gp.linkedDocLabel || gp.linkedDocNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-[#1e293b]">{gp.date?.slice(0, 10)}</p>
                      <p className="text-xs text-[#94a3b8]">{gp.time?.slice(0, 5)}</p>
                    </td>
                    <td className="px-4 py-3"><p className="font-medium text-[#1e293b] whitespace-nowrap">{gp.partyName}</p></td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="font-mono text-xs text-[#64748b]">{gp.vehicleNumber}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs text-[#64748b]">{gp.purpose}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="text-xs font-semibold text-[#1e293b]">{gp.itemCount ?? (gp.items?.length ?? 0)} items</span></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${sb.cls}`}>
                        <i className={`${sb.icon} text-xs`} />{gp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${vb.cls}`}>
                        <i className={`${vb.icon} text-xs`} />{vb.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {gp.status === 'OPEN' && gp.isReturnable && (
                          <button onClick={() => void handleMarkReturned(gp)} title="Mark Returned"
                            disabled={actionLoading === gp.id + '-return'}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-50 text-[#64748b] hover:text-green-600 cursor-pointer disabled:opacity-50">
                            {actionLoading === gp.id + '-return'
                              ? <i className="ri-loader-4-line animate-spin text-sm" />
                              : <i className="ri-arrow-go-back-line text-sm" />}
                          </button>
                        )}
                        {isRej && canCreateGP && (
                          <button onClick={() => { setActivePrefill(null); setEditingGP(gp); setIsRecreating(true); setSlideOpen(true); }}
                            className="flex items-center gap-1 h-7 px-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-semibold cursor-pointer whitespace-nowrap">
                            <i className="ri-refresh-line text-xs" /> Recreate
                          </button>
                        )}
                        {canEditGP && (
                          <button onClick={() => { setActivePrefill(null); setEditingGP(gp); setIsRecreating(false); setSlideOpen(true); }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] cursor-pointer">
                            <i className="ri-edit-line text-sm" />
                          </button>
                        )}
                        {canDeleteGP && (
                          <button onClick={() => setDeleteConfirm(gp)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 cursor-pointer">
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">Showing {filtered.length} of {gatePasses.length} gate passes</p>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detailGP && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailGP(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
              <div>
                <p className="font-mono font-bold text-[#4f46e5]">{detailGP.gpNumber}</p>
                <p className="text-xs text-[#64748b]">{detailGP.partyName} · {detailGP.date?.slice(0, 10)}</p>
              </div>
              <button onClick={() => setDetailGP(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer">
                <i className="ri-close-line" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[['Vehicle', detailGP.vehicleNumber], ['Driver', detailGP.driverName || '—'],
                  ['Guard', detailGP.securityGuard], ['Authorised By', detailGP.authorisedBy],
                  ['Purpose', detailGP.purpose],
                  ['Linked Doc', detailGP.linkedDocLabel
                    ? `${detailGP.linkedDocType} — ${detailGP.linkedDocLabel}`
                    : detailGP.linkedDocNumber || '—'],
                ].map(([k, v]) => (
                  <div key={k}><p className="text-xs text-[#64748b]">{k}</p><p className="font-medium text-[#1e293b]">{v}</p></div>
                ))}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Items</p>
                {(detailGP.items ?? []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1 border-b border-[#f1f5f9]">
                    <span className="text-[#1e293b]">{item.itemName}</span>
                    <span className="text-[#64748b] font-semibold">{item.qty} {item.unit}</span>
                  </div>
                ))}
              </div>
              {detailGP.verificationStatus === 'REJECTED' && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-1">Rejected by Security</p>
                  <p className="text-sm text-red-600">{detailGP.rejectionReason}</p>
                  <button onClick={() => { setDetailGP(null); setEditingGP(detailGP); setIsRecreating(true); setSlideOpen(true); }}
                    className="mt-3 flex items-center gap-1.5 h-8 px-3 rounded-lg bg-red-600 text-white text-xs font-semibold cursor-pointer hover:bg-red-700">
                    <i className="ri-refresh-line" /> Recreate Gate Pass
                  </button>
                </div>
              )}
              {detailGP.notes && (
                <div><p className="text-xs text-[#64748b]">Notes</p>
                  <p className="text-sm text-[#1e293b]">{detailGP.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <OutwardGPForm
        open={slideOpen}
        editing={editingGP}
        isRecreating={isRecreating}
        prefill={activePrefill}
        saving={savingForm}
        onClose={() => { setSlideOpen(false); setEditingGP(null); setIsRecreating(false); setActivePrefill(null); }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Gate Pass"
        message={`Delete "${deleteConfirm?.gpNumber}"? This cannot be undone.`}
        variant="danger"
        confirmLabel={deleting ? 'Deleting…' : 'Yes, Delete (Y)'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </AppLayout>
  );
}