/**
 * InwardGPForm.tsx
 * Pure presentation + local-state component.
 * ALL data (partyOptions, itemOptions, docOptions) is fetched by the
 * parent page and passed in as props — this file makes zero API calls.
 */

import { useState, useEffect, useCallback } from 'react';

// ─── Types (shared — import from a shared types file in real project) ─────────

export type GPPurpose =  | 'PURCHASE' | 'SALE_RETURN' | 'TRANSFER_IN' | 'OTHER'  | 'SALE' | 'TRANSFER' | 'RETURN' | 'SAMPLE';

export interface GPItem {
  id: string; itemId?: string; item_id?: string;
  itemName: string; qty: number; unit: string; description: string | null;
}

export interface GatePass {
  id: string; gpNumber: string; type: string; status: string;
  verificationStatus: string; rejectionReason: string | null;
  purpose: string; partyName: string; vehicleNumber: string;
  driverName: string | null; driverPhone: string | null;
  securityGuard: string; authorisedBy: string; receivedBy: string | null;
  linkedDocType: string | null; linkedDocNumber: string | null; linkedDocLabel: string | null;
  notes: string | null; date: string; time: string;
  items?: GPItem[]; itemCount?: number;
}

export interface FormItem {
  itemName: string; qty: number; unit: string; description: string; item_id: string;
}

export interface GPFormState {
  date: string; time: string; partyName: string; vehicleNumber: string;
  driverName: string; driverPhone: string; securityGuard: string;
  authorisedBy: string; receivedBy: string; purpose: GPPurpose;
  linkedDocType: string;
  linkedDocId: string;     // UUID — only for dropdown value, not saved to DB
  linkedDocNumber: string; // Human-readable e.g. "INV-2026-001" — saved to DB
  notes: string;
  items: FormItem[];
}

export interface InwardGPPrefill {
  partyName?: string;
  items?: Array<{ itemName: string; qty: number; unit?: string; description?: string; item_id?: string; id?: string }>;
  linkedDocType?: string; linkedDocNumber?: string; notes?: string;
}

// Minimal shapes for option lists — matches what your API returns
export interface PartyOption  { id: string; name: string }
export interface ItemOption   { id: string; name: string; unit_name?: string }
export interface DocOption    { id: string; number: string; partyName: string; items: any[] }

// ─── Constants ────────────────────────────────────────────────────────────────

export const INWARD_PURPOSES: GPPurpose[] = ['PURCHASE', 'SALE_RETURN', 'TRANSFER_IN', 'OTHER'];

export const PURPOSE_LABELS: Record<GPPurpose, string> = {
  SALE: 'Sale', TRANSFER: 'Transfer', RETURN: 'Return', SAMPLE: 'Sample',
  OTHER: 'Other', PURCHASE: 'Purchase', SALE_RETURN: 'Sale Return', TRANSFER_IN: 'Transfer In',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const emptyItem = (): FormItem => ({ itemName: '', qty: 1, unit: 'Pcs', description: '', item_id: '' });

export const nowDT = () => {
  const d = new Date();
  return { date: d.toISOString().split('T')[0], time: d.toTimeString().slice(0, 5) };
};

export const EMPTY_FORM = (): GPFormState => ({
  ...nowDT(),
  partyName: '', vehicleNumber: '', driverName: '', driverPhone: '',
  securityGuard: '', authorisedBy: 'Admin User', receivedBy: '',
  purpose: 'PURCHASE', linkedDocType: '', linkedDocId: '', linkedDocNumber: '', notes: '',
  items: [emptyItem()],
});

const resolveItemId = (i: GPItem): string => i.itemId ?? i.item_id ?? '';

// ─── Props ────────────────────────────────────────────────────────────────────

interface InwardGPFormProps {
  open: boolean;
  editing: GatePass | null;
  prefill: InwardGPPrefill | null;
  saving: boolean;
  partyOptions: PartyOption[];
  itemOptions: ItemOption[];       // full inventory — used when no doc selected
  onClose: () => void;
  onSave: (form: GPFormState) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InwardGPForm({
  open,
  editing,
  prefill,
  saving,
  partyOptions,
  itemOptions,
  docOptions,
  onClose,
  onSave,
  onLinkedDocTypeChange,
  onLinkedDocSelect,
}: InwardGPFormProps) {
  const [form, setForm]     = useState<GPFormState>(EMPTY_FORM());
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Populate form whenever the panel opens ─────────────────────────────────
  useEffect(() => {
    if (!open) return;

    if (editing) {
      setForm({
        date:          editing.date?.slice(0, 10)    ?? nowDT().date,
        time:          editing.time?.slice(0, 5)     ?? nowDT().time,
        partyName:     editing.partyName,
        vehicleNumber: editing.vehicleNumber,
        driverName:    editing.driverName    ?? '',
        driverPhone:   editing.driverPhone   ?? '',
        securityGuard: editing.securityGuard,
        authorisedBy:  editing.authorisedBy,
        receivedBy:    editing.receivedBy    ?? '',
        purpose:       editing.purpose       as GPPurpose,
        linkedDocType:   editing.linkedDocType   ?? '',
        linkedDocNumber: editing.linkedDocNumber ?? '',
        notes:         editing.notes         ?? '',
        items: editing.items?.length
          ? editing.items.map((i) => ({
              itemName:    i.itemName,
              item_id:     resolveItemId(i),   // FK, not row PK
              qty:         i.qty,
              unit:        i.unit,
              description: i.description ?? '',
            }))
          : [emptyItem()],
      });
      if (editing.linkedDocType) fetchDocs(editing.linkedDocType, editing.partyName);
    } else {
      const base = EMPTY_FORM();
      if (prefill) {
        base.partyName      = prefill.partyName      ?? '';
        base.linkedDocType  = prefill.linkedDocType  ?? '';
        base.linkedDocNumber = prefill.linkedDocNumber ?? '';
        base.notes          = prefill.notes          ?? '';

        if (prefill.items?.length) {
          base.items = prefill.items.map((i) => ({
            itemName:    i.itemName,
            qty:         i.qty,
            unit:        i.unit        ?? 'Pcs',
            description: i.description ?? '',
            item_id:     i.item_id     ?? i.id ?? '',
          }));
        }
        if (prefill.linkedDocType) fetchDocs(prefill.linkedDocType, prefill.partyName ?? '');
      }
      setForm(base);
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
  }, [open, onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Field helpers ──────────────────────────────────────────────────────────
  const setField = <K extends keyof GPFormState>(key: K, value: GPFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const setItemField = (rowIndex: number, field: keyof FormItem, value: string | number) =>
    setForm((prev) => {
      const items = [...prev.items];
      items[rowIndex] = { ...items[rowIndex], [field]: value };
      return { ...prev, items };
    });

  const addRow = () => setForm((prev) => ({ ...prev, items: [...prev.items, emptyItem()] }));
  const removeRow = (i: number) =>
    setForm((prev) => ({ ...prev, items: prev.items.filter((_, idx) => idx !== i) }));

  const clearError = (key: string) => setErrors((prev) => ({ ...prev, [key]: '' }));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.partyName.trim())    e.partyName    = 'Required';
    if (!form.vehicleNumber.trim()) e.vehicleNumber = 'Required';
    if (!form.securityGuard.trim()) e.securityGuard = 'Required';
    if (!form.authorisedBy.trim()) e.authorisedBy = 'Required';
    if (form.items.some((i) => !i.itemName.trim())) e.items = 'All item names are required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    await onSave(form);
  }, [form, onSave]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Party change: re-fetch docs for new party ─────────────────────────────
  const handlePartyChange = (newParty: string) => {
    clearError('partyName');
    const isTransfer = form.linkedDocType === 'STOCK_TRANSFER';
    const currentDoc = docOptions.find((d) => d.id === form.linkedDocId);
    const stillMatches = isTransfer || !currentDoc?.partyName
      || currentDoc.partyName.toLowerCase() === newParty.toLowerCase();

    setForm((prev) => ({
      ...prev,
      partyName:       newParty,
      linkedDocId:     stillMatches ? prev.linkedDocId : '',
      linkedDocNumber: stillMatches ? prev.linkedDocNumber : '',
      items:           stillMatches ? prev.items : [emptyItem()],
    }));

    if (form.linkedDocType) fetchDocs(form.linkedDocType, newParty);
  };

  // ── Doc type change ───────────────────────────────────────────────────────
  const handleDocTypeChange = (type: string) => {
    setForm((prev) => ({
      ...prev,
      linkedDocType: type,
      linkedDocId: '',
      linkedDocNumber: '',
      items: [emptyItem()],
    }));
    fetchDocs(type, form.partyName);
  };

  // ── Doc selection → store UUID in linkedDocId, human number in linkedDocNumber
  const handleDocSelect = (docId: string) => {
    const doc = docOptions.find((d) => d.id === docId);
    if (!doc) return;

    setForm((prev) => ({
      ...prev,
      linkedDocId:     docId,          // UUID — for dropdown controlled value only
      linkedDocNumber: docId,     // e.g. "INV-2026-001" — saved to DB & shown in table
      partyName: (form.linkedDocType === 'STOCK_TRANSFER') ? prev.partyName : (doc.partyName || prev.partyName),
      items: doc.items?.length
        ? doc.items.map((i: any): FormItem => ({
            itemName:    i.itemName || i.name || '',
            item_id:     i.item_id  || i.itemId || i.id || '',
            qty:         i.qty      || i.quantity || i.orderedQty || 1,
            unit:        i.unit     || i.unitName || 'Pcs',
            description: i.description || '',
          }))
        : [emptyItem()],
    }));
  };

  // ── Styling ────────────────────────────────────────────────────────────────
  const fieldCls = (err?: string) => [
    'w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white',
    'focus:outline-none focus:ring-2 transition-colors',
    err ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20',
  ].join(' ');
  const labelCls = 'text-xs font-semibold text-[#64748b] uppercase tracking-wide';

  if (!open) return null;

  const selectedDoc = docOptions.find((d) => d.id === form.linkedDocId);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={saving ? undefined : onClose} />
      <div className="relative ml-auto h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">INWARD</span>
              <h3 className="text-base font-semibold text-[#1e293b]">
                {editing ? 'Edit Inward Gate Pass' : 'New Inward Gate Pass'}
              </h3>
            </div>
            <p className="text-xs text-[#64748b]">Goods entering the premises</p>
          </div>
          <button onClick={saving ? undefined : onClose} disabled={saving}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer disabled:opacity-50">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Prefill banner */}
        {!editing && prefill?.linkedDocNumber && (
          <div className="mx-6 mt-4 shrink-0 flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs">
            <i className="ri-links-line" />
            Pre-filled from <strong>{prefill.linkedDocType} — {prefill.linkedDocNumber}</strong>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Date / Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Date *</label>
              <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} className={fieldCls()} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Time *</label>
              <input type="time" value={form.time} onChange={(e) => setField('time', e.target.value)} className={fieldCls()} />
            </div>
          </div>

          {/* Party / Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Party Name *</label>
              <select value={form.partyName} onChange={(e) => handlePartyChange(e.target.value)}
                className={fieldCls(errors.partyName)}>
                <option value="">Select Party</option>
                {partyOptions.map((p) => <option key={p.id} value={p.name}>{p.name}</option>)}
                {form.partyName && !partyOptions.find((p) => p.name === form.partyName) && (
                  <option value={form.partyName}>{form.partyName}</option>
                )}
              </select>
              {errors.partyName && <p className="text-xs text-red-500">{errors.partyName}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Vehicle Number *</label>
              <input value={form.vehicleNumber}
                onChange={(e) => { setField('vehicleNumber', e.target.value.toUpperCase()); clearError('vehicleNumber'); }}
                placeholder="MH-12-AB-1234" className={`${fieldCls(errors.vehicleNumber)} font-mono`} />
              {errors.vehicleNumber && <p className="text-xs text-red-500">{errors.vehicleNumber}</p>}
            </div>
          </div>

          {/* Driver */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Driver Name</label>
              <input value={form.driverName} onChange={(e) => setField('driverName', e.target.value)} placeholder="Optional" className={fieldCls()} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Driver Phone</label>
              <input type="tel" value={form.driverPhone} onChange={(e) => setField('driverPhone', e.target.value)} placeholder="Optional" className={fieldCls()} />
            </div>
          </div>

          {/* Guard / Received By */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls}>Security Guard *</label>
              <input value={form.securityGuard}
                onChange={(e) => { setField('securityGuard', e.target.value); clearError('securityGuard'); }}
                placeholder="Guard on duty" className={fieldCls(errors.securityGuard)} />
              {errors.securityGuard && <p className="text-xs text-red-500">{errors.securityGuard}</p>}
            </div>
            <div className="space-y-1.5">
              <label className={labelCls}>Received By</label>
              <input value={form.receivedBy} onChange={(e) => setField('receivedBy', e.target.value)}
                placeholder="Person receiving goods" className={fieldCls()} />
            </div>
          </div>

          {/* Authorised By */}
          <div className="space-y-1.5">
            <label className={labelCls}>Authorised By *</label>
            <input value={form.authorisedBy}
              onChange={(e) => { setField('authorisedBy', e.target.value); clearError('authorisedBy'); }}
              className={fieldCls(errors.authorisedBy)} />
            {errors.authorisedBy && <p className="text-xs text-red-500">{errors.authorisedBy}</p>}
          </div>

          {/* Purpose */}
          <div className="space-y-1.5">
            <label className={labelCls}>Purpose *</label>
            <div className="flex flex-wrap gap-2">
              {INWARD_PURPOSES.map((p) => (
                <button key={p} type="button" onClick={() => setField('purpose', p)}
                  className={[
                    'h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap',
                    form.purpose === p ? 'bg-[#4f46e5] text-white border-[#4f46e5]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]',
                  ].join(' ')}>
                  {PURPOSE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Linked Document */}
          <div className="rounded-xl border border-[#e2e8f0] p-4 space-y-3 bg-[#f8fafc]">
            <p className={`${labelCls} flex items-center gap-1.5`}>
              <i className="ri-links-line text-[#4f46e5]" /> Linked Document
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls}>Doc Type</label>
                <select value={form.linkedDocType} onChange={(e) => handleDocTypeChange(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]">
                  <option value="">None</option>
                  <option value="GRN">GRN</option>
                  <option value="SALES_RETURN">Sales Return</option>
                  <option value="STOCK_TRANSFER">Stock Transfer</option>
                  <option value="PURCHASE_ORDER">Purchase Order</option>
                  <option value="PURCHASE_INVOICE">Purchase Invoice</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>
                  Doc Number
                  {docsLoading && <span className="ml-2 normal-case font-normal text-indigo-400">loading…</span>}
                  {!docsLoading && form.linkedDocType && form.partyName && (
                    <span className="ml-2 normal-case font-normal text-indigo-500">— {docOptions.length} found</span>
                  )}
                </label>
                <select value={form.linkedDocNumber} disabled={!form.linkedDocType || docsLoading}
                  onChange={(e) => handleDocSelect(e.target.value)}
                  className={fieldCls(errors.linkedDocNumber)}>
                  <option value="">
                    {!form.linkedDocType ? 'Select type first'
                      : docsLoading ? 'Loading…'
                      : docOptions.length === 0
                        ? (form.partyName ? `No ${form.linkedDocType} for this party` : 'No documents found')
                        : 'Select Document'}
                  </option>
                  {docOptions.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.number || 'No Number'}{doc.partyName ? ` — ${doc.partyName}` : ''}
                    </option>
                  ))}
                </select>
                {form.linkedDocType && !form.partyName && !docsLoading && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <i className="ri-information-line" /> Select a party to filter documents
                  </p>
                )}
              </div>
            </div>
            {selectedDoc && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-xs text-indigo-700">
                <i className="ri-file-check-line" />
                <span className="font-semibold">{selectedDoc.number}</span>
                {selectedDoc.partyName && <span className="text-indigo-400">· {selectedDoc.partyName}</span>}
                {selectedDoc.items?.length > 0 && (
                  <span className="ml-auto text-indigo-400">{selectedDoc.items.length} items auto-filled</span>
                )}
              </div>
            )}
          </div>

          {/* Items table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={labelCls}>
                Items *{' '}
                {errors.items && <span className="text-red-500 ml-2 normal-case font-normal">{errors.items}</span>}
                {form.linkedDocNumber && activeItemOptions.length !== itemOptions.length && (
                  <span className="ml-2 normal-case font-normal text-indigo-500">
                    — {activeItemOptions.length} from linked doc
                  </span>
                )}
              </label>
              <button type="button" onClick={addRow}
                className="flex items-center gap-1 text-xs text-[#4f46e5] font-medium hover:text-indigo-700 cursor-pointer">
                <i className="ri-add-line" /> Add Row
              </button>
            </div>
            <div className="border border-[#e2e8f0] rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#f8fafc]">
                  <tr>
                    {['Item Name', 'Qty', 'Unit', 'Description', ''].map((h) => (
                      <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[#64748b] uppercase border-b border-[#e2e8f0]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i} className="border-b border-[#f1f5f9] last:border-0">
                      <td className="px-2 py-1.5">
                        <select value={item.itemName}
                          onChange={(e) => {
                            const selected = activeItemOptions.find((it) => it.name === e.target.value);
                            setForm((prev) => {
                              const items = [...prev.items];
                              items[i] = {
                                ...items[i],
                                itemName: e.target.value,
                                item_id:  selected?.id ?? '',
                                unit:     selected?.unit_name || items[i].unit || 'Pcs',
                              };
                              return { ...prev, items };
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
                        <input type="number" value={item.qty} min={1}
                          onChange={(e) => setItemField(i, 'qty', parseFloat(e.target.value) || 0)}
                          className="w-full h-8 px-2 rounded border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]" />
                      </td>
                      <td className="px-2 py-1.5 w-20">
                        <input value={item.unit} onChange={(e) => setItemField(i, 'unit', e.target.value)} placeholder="Pcs"
                          className="w-full h-8 px-2 rounded border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input value={item.description} onChange={(e) => setItemField(i, 'description', e.target.value)} placeholder="Optional"
                          className="w-full h-8 px-2 rounded border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5]" />
                      </td>
                      <td className="px-2 py-1.5 w-8">
                        {form.items.length > 1 && (
                          <button onClick={() => removeRow(i)}
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
          <div className="space-y-1.5">
            <label className={labelCls}>Notes</label>
            <input value={form.notes} onChange={(e) => setField('notes', e.target.value)}
              placeholder="Any remarks..." className={fieldCls()} />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] shrink-0">
          <p className="text-[11px] text-[#94a3b8]">
            <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">F9</kbd> save{' '}
            <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">Esc</kbd> cancel
          </p>
          <div className="flex gap-2">
            <button onClick={saving ? undefined : onClose} disabled={saving}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer disabled:opacity-50">
              Cancel
            </button>
            <button onClick={() => void handleSubmit()} disabled={saving}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer">
              {saving ? <><i className="ri-loader-4-line animate-spin" /> Saving…</> : <><i className="ri-save-line" /> {editing ? 'Update' : 'Save'} Gate Pass</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
