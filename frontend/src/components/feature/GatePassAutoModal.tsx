import { useState, useEffect } from 'react';
import type {
  GatePassType, GatePassPurpose, GatePassItem, LinkedDocType, MockGatePass
} from '@/mocks/gatepass';
import { mockGatePasses } from '@/mocks/gatepass';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GatePassTrigger {
  docType: string;          // 'SALES_INVOICE' | 'CHALLAN' | 'GRN' | etc.
  docId: string;
  docNumber: string;
  partyName: string;
  gpType: GatePassType;
  purpose: GatePassPurpose;
  items: GatePassItem[];
  isReturnable?: boolean;
  expectedReturnDate?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trigger: GatePassTrigger | null;
  currentUser: string;
}

type ModalState = 'FORM' | 'SUCCESS' | 'PRINT';

// ─── Purpose labels ───────────────────────────────────────────────────────────

const purposeLabel: Record<GatePassPurpose, string> = {
  SALE: 'Sale', TRANSFER: 'Transfer', RETURN: 'Return to Supplier',
  SAMPLE: 'Sample', OTHER: 'Other', PURCHASE: 'Purchase',
  SALE_RETURN: 'Sale Return', TRANSFER_IN: 'Transfer In',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GatePassAutoModal({ isOpen, onClose, trigger, currentUser }: Props) {
  const [state, setState] = useState<ModalState>('FORM');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [securityGuard, setSecurityGuard] = useState('');
  const [authorisedBy, setAuthorisedBy] = useState(currentUser);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdGP, setCreatedGP] = useState<MockGatePass | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setState('FORM');
      setVehicleNumber('');
      setDriverName('');
      setDriverPhone('');
      setSecurityGuard('');
      setAuthorisedBy(currentUser);
      setNotes('');
      setErrors({});
      setCreatedGP(null);
    }
  }, [isOpen, currentUser]);

  // Esc key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'F9') { e.preventDefault(); void handleCreate(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !trigger) return null;

  // ── GP Number generation ───────────────────────────────────────────────────
  const existingCount = mockGatePasses.filter((gp) => gp.type === trigger.gpType).length;
  const year = new Date().getFullYear();
  const nextNum = String(existingCount + 1).padStart(4, '0');
  const gpNumber = `GP-${trigger.gpType === 'OUTWARD' ? 'OUT' : 'IN'}-${year}-${nextNum}`;

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e: Record<string, string> = {};
    if (!vehicleNumber.trim()) e.vehicleNumber = 'Vehicle number is required';
    if (!securityGuard.trim()) e.securityGuard = 'Security guard name is required';
    if (!authorisedBy.trim()) e.authorisedBy = 'Authorised by is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Create GP ──────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!validate()) return;
    setIsSaving(true);

    await new Promise((r) => setTimeout(r, 600));

    const now = new Date();
    const newGP: MockGatePass = {
      id: `gp-${Date.now()}`,
      gpNumber,
      type: trigger.gpType,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      partyName: trigger.partyName,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      driverName: driverName.trim() || undefined,
      driverPhone: driverPhone.trim() || undefined,
      securityGuard: securityGuard.trim(),
      purpose: trigger.purpose,
      isReturnable: trigger.isReturnable ?? false,
      expectedReturnDate: trigger.expectedReturnDate,
      status: trigger.gpType === 'INWARD'
        ? (trigger.docId ? 'LINKED' : 'PENDING')
        : (trigger.isReturnable ? 'OPEN' : 'CLOSED'),
      linkedDocType: trigger.docType as LinkedDocType,
      linkedDocNumber: trigger.docNumber,
      authorisedBy: authorisedBy.trim(),
      notes: notes.trim() || undefined,
      items: trigger.items,
      verificationStatus: 'PENDING',
      isRecreated: false,
      createdById: 'usr-current',
      createdByName: currentUser,
      createdBy: currentUser,
      createdAt: now.toISOString(),
    };

    mockGatePasses.push(newGP);
    setCreatedGP(newGP);
    setIsSaving(false);
    setState('SUCCESS');
  };

  // ── PRINT preview ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    setState('PRINT');
    setTimeout(() => window.print(), 300);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={state === 'FORM' ? onClose : undefined} />

      {/* ── STATE 1: FORM ── */}
      {state === 'FORM' && (
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  trigger.gpType === 'OUTWARD'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {trigger.gpType}
                </span>
                <h3 className="text-base font-semibold text-[#1e293b]">Create Gate Pass</h3>
              </div>
              <p className="text-xs text-[#64748b] mt-0.5">
                {trigger.docNumber} · {trigger.partyName} · {purposeLabel[trigger.purpose]}
              </p>
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer">
              <i className="ri-close-line" />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* GP Number (auto) */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <i className="ri-hashtag text-[#4f46e5]" />
              <div>
                <p className="text-xs text-[#64748b]">GP Number (auto-generated)</p>
                <p className="text-sm font-bold text-[#1e293b] font-mono">{gpNumber}</p>
              </div>
            </div>

            {/* Items summary */}
            <div className="p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
              <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">
                Items ({trigger.items.length})
              </p>
              <div className="space-y-1">
                {trigger.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-[#1e293b]">{item.itemName}</span>
                    <span className="text-[#64748b] font-semibold">{item.qty} {item.unit}</span>
                  </div>
                ))}
                {trigger.items.length > 3 && (
                  <p className="text-xs text-[#94a3b8]">+{trigger.items.length - 3} more items</p>
                )}
              </div>
            </div>

            {/* Vehicle Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Vehicle Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => { setVehicleNumber(e.target.value.toUpperCase()); setErrors((p) => ({ ...p, vehicleNumber: '' })); }}
                placeholder="MH-12-AB-1234"
                className={`w-full h-10 px-3 rounded-lg border text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.vehicleNumber ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
              />
              {errors.vehicleNumber && <p className="text-xs text-red-500">{errors.vehicleNumber}</p>}
            </div>

            {/* Driver */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Driver Name</label>
                <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Optional"
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Driver Phone</label>
                <input type="text" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="Optional"
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
              </div>
            </div>

            {/* Security Guard */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Security Guard <span className="text-red-500">*</span>
              </label>
              <input type="text" value={securityGuard}
                onChange={(e) => { setSecurityGuard(e.target.value); setErrors((p) => ({ ...p, securityGuard: '' })); }}
                placeholder="Guard on duty"
                className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.securityGuard ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
              />
              {errors.securityGuard && <p className="text-xs text-red-500">{errors.securityGuard}</p>}
            </div>

            {/* Authorised By */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                Authorised By <span className="text-red-500">*</span>
              </label>
              <input type="text" value={authorisedBy}
                onChange={(e) => { setAuthorisedBy(e.target.value); setErrors((p) => ({ ...p, authorisedBy: '' })); }}
                className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.authorisedBy ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
              />
              {errors.authorisedBy && <p className="text-xs text-red-500">{errors.authorisedBy}</p>}
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Notes</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any delivery condition or remarks..."
                className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
            </div>
          </div>

          <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0]">
            <p className="text-[11px] text-[#94a3b8]">
              <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">F9</kbd> create &nbsp;
              <kbd className="bg-[#f1f5f9] px-1.5 py-0.5 rounded font-mono">Esc</kbd> skip
            </p>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer">
                Skip
              </button>
              <button onClick={() => void handleCreate()} disabled={isSaving}
                className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer">
                {isSaving ? <><i className="ri-loader-4-line animate-spin" /> Creating...</> : <><i className="ri-file-list-3-line" /> Create GP</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 2: SUCCESS ── */}
      {state === 'SUCCESS' && createdGP && (
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm">
          <div className="px-6 py-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="ri-checkbox-circle-fill text-green-500 text-2xl" />
            </div>
            <h3 className="text-lg font-bold text-[#1e293b] mb-1">Gate Pass Created!</h3>
            <p className="text-sm font-mono font-bold text-[#4f46e5] mb-4">{createdGP.gpNumber}</p>

            <div className="bg-[#f8fafc] rounded-lg p-4 text-left space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Party</span>
                <span className="font-medium text-[#1e293b]">{createdGP.partyName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Linked Doc</span>
                <span className="font-medium text-[#1e293b]">{createdGP.linkedDocNumber || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Items</span>
                <span className="font-medium text-[#1e293b]">{createdGP.items.length} items</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748b]">Authorised By</span>
                <span className="font-medium text-[#1e293b]">{createdGP.authorisedBy}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer">
                Close
              </button>
              <button onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer">
                <i className="ri-printer-line" /> Print Gate Pass
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATE 3: PRINT PREVIEW ── */}
      {state === 'PRINT' && createdGP && (
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] print:hidden">
            <h3 className="text-base font-semibold text-[#1e293b]">Gate Pass Print Preview</h3>
            <div className="flex gap-2">
              <button onClick={() => setState('SUCCESS')} className="h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer">
                ← Back
              </button>
              <button onClick={() => window.print()} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#4f46e5] text-white text-xs font-semibold cursor-pointer">
                <i className="ri-printer-line" /> Print
              </button>
            </div>
          </div>
          {/* Print content */}
          <div className="p-8 print:p-4">
            <div className="text-center mb-6 border-b-2 border-[#1e293b] pb-4">
              <h1 className="text-2xl font-bold text-[#1e293b]">InvenPro ERP</h1>
              <h2 className="text-lg font-semibold text-[#4f46e5] mt-1">
                {createdGP.type === 'OUTWARD' ? 'OUTWARD' : 'INWARD'} GATE PASS
              </h2>
              <p className="text-sm font-mono text-[#64748b]">{createdGP.gpNumber}</p>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                {[
                  ['Date', createdGP.date],
                  ['Time', createdGP.time],
                  ['Party', createdGP.partyName],
                  ['Vehicle No.', createdGP.vehicleNumber],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="text-[#64748b] w-24 shrink-0">{k}:</span>
                    <span className="font-medium text-[#1e293b]">{v}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {[
                  ['Driver', createdGP.driverName || '—'],
                  ['Purpose', createdGP.purpose],
                  ['Linked Doc', createdGP.linkedDocNumber || '—'],
                  ['Guard', createdGP.securityGuard],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="text-[#64748b] w-24 shrink-0">{k}:</span>
                    <span className="font-medium text-[#1e293b]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            <table className="w-full border border-[#e2e8f0] rounded-lg overflow-hidden mb-8 text-sm">
              <thead className="bg-[#f8fafc]">
                <tr>
                  {['#', 'Item Name', 'Qty', 'Unit', 'Description'].map((h) => (
                    <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-[#64748b] uppercase border-b border-[#e2e8f0]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {createdGP.items.map((item, i) => (
                  <tr key={i} className="border-b border-[#f1f5f9]">
                    <td className="px-3 py-2 text-[#64748b]">{i + 1}</td>
                    <td className="px-3 py-2 font-medium text-[#1e293b]">{item.itemName}</td>
                    <td className="px-3 py-2 font-bold">{item.qty}</td>
                    <td className="px-3 py-2 text-[#64748b]">{item.unit}</td>
                    <td className="px-3 py-2 text-[#64748b] text-xs">{item.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-4 gap-4">
              {['Security Guard', 'Authorised By', 'Driver Signature', 'Received By'].map((label) => (
                <div key={label} className="text-center">
                  <div className="h-12 border-b-2 border-[#1e293b] mb-2" />
                  <p className="text-xs text-[#64748b]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}