// ─────────────────────────────────────────────────────────────────────────────
// FILE: src/pages/guard/components/VerifyRejectModals.tsx
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

type GatePass = {
  id: string;
  gpNumber: string;
  type: 'OUTWARD' | 'INWARD';
  partyName: string;
  vehicleNumber: string;
  purpose: string;
  items?: any[];
  itemCount?: number;
};

interface VerifyRejectProps {
  gatePass: GatePass | null;
  mode: 'verify' | 'reject' | null;
  onClose: () => void;
  onVerify: (gpId: string, exitTime: string, entryTime: string, remarks: string) => void;
  onReject: (gpId: string, reason: string) => void;
  currentGuardName: string;
}

export function VerifyRejectModals({ gatePass, mode, onClose, onVerify, onReject, currentGuardName }: VerifyRejectProps) {
  const [exitTime, setExitTime] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [remarks, setRemarks] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (gatePass) {
      const now = new Date().toTimeString().slice(0, 5);
      setExitTime(now);
      setEntryTime(now);
      setRemarks('');
      setReason('');
      setErrors({});
    }
  }, [gatePass, mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!gatePass || !mode) return null;

  const handleVerify = () => {
    onVerify(gatePass.id, exitTime, entryTime, remarks);
    onClose();
  };

  const handleReject = () => {
    const e: Record<string, string> = {};
    if (!reason.trim()) e.reason = 'Rejection reason is required';
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    onReject(gatePass.id, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md">

        {mode === 'verify' && (
          <>
            <div className="px-6 py-4 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <i className="ri-shield-check-line text-green-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1e293b]">Verify Gate Pass</h3>
                  <p className="text-xs text-[#64748b]">{gatePass.gpNumber} · {gatePass.partyName}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="p-3 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] text-sm">
                <div className="grid grid-cols-2 gap-2">
                  {[['Vehicle', gatePass.vehicleNumber], ['Party', gatePass.partyName], ['Items', `${gatePass.items?.length ?? 0} items`], ['Purpose', gatePass.purpose]].map(([k, v]) => (
                    <div key={k}><p className="text-xs text-[#64748b]">{k}</p><p className="font-medium text-[#1e293b]">{v}</p></div>
                  ))}
                </div>
              </div>
              {gatePass.type === 'OUTWARD' ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Vehicle Exit Time</label>
                  <input type="time" value={exitTime} onChange={(e) => setExitTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Vehicle Entry Time</label>
                  <input type="time" value={entryTime} onChange={(e) => setEntryTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Guard Remarks (optional)</label>
                <input type="text" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Any observations..."
                  className="w-full h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20" />
              </div>
              <p className="text-xs text-[#64748b]">
                Verified by: <span className="font-semibold text-[#1e293b]">{currentGuardName}</span>
              </p>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-[#e2e8f0]">
              <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer">Cancel</button>
              <button onClick={handleVerify}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 cursor-pointer">
                <i className="ri-shield-check-line" /> Confirm Verify
              </button>
            </div>
          </>
        )}

        {mode === 'reject' && (
          <>
            <div className="px-6 py-4 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <i className="ri-shield-cross-line text-red-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#1e293b]">Reject Gate Pass</h3>
                  <p className="text-xs text-[#64748b]">{gatePass.gpNumber} · {gatePass.partyName}</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                <i className="ri-alert-line shrink-0 mt-0.5" />
                <p>Rejecting will alert the gate pass creator. They can then recreate the pass.</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea value={reason} onChange={(e) => { setReason(e.target.value); setErrors({}); }}
                  rows={3} placeholder="Explain why the gate pass is being rejected (e.g. vehicle number mismatch, items not matching, etc.)"
                  className={`w-full px-3 py-2 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors resize-none ${errors.reason ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`} />
                {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}
              </div>
            </div>
            <div className="flex gap-2 px-6 py-4 border-t border-[#e2e8f0]">
              <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer">Cancel</button>
              <button onClick={handleReject}
                className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 cursor-pointer">
                <i className="ri-shield-cross-line" /> Confirm Reject
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}