import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { VerifyRejectModals } from '../components/VerifyRejectModals';

// ─── Guard Layout ─────────────────────────────────────────────────────────────

export type GatePass = {
  id: string;
  companyId: string;

  gpNumber: string;
  type: 'INWARD' | 'OUTWARD';

  status: 'OPEN' | 'LINKED' | 'RETURNED';
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';

  rejectionReason: string | null;

  purpose: string;
  customPurpose: string | null;

  partyName: string;

  vehicleNumber: string;
  driverName: string;
  driverPhone: string;

  securityGuard: string;
  authorisedBy: string;
  receivedBy: string | null;

  isReturnable: boolean;
  expectedReturnDate: string | null;
  returnedDate: string | null;

  linkedDocType: string;
  linkedDocNumber: string;

  isRecreated: boolean;
  originalGPId: string | null;

  isDeleted: boolean;

  notes: string;

  date: string; // ISO
  time: string; // HH:mm:ss

  createdBy: string;
  createdAt: string;
  updatedAt: string;

  items: GatePassItem[];

  verifiedBy?: string;
  verifiedAt?: string;
};

export type GatePassItem = {
  id: string;
  gpId: string;

  itemName: string;
  qty: number;
  unit: string;
  description: string;
};

function GuardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-white border-b border-[#e2e8f0] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#4f46e5] rounded-lg flex items-center justify-center">
            <i className="ri-shield-user-line text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1e293b]">
              Gate Pass — Inward
            </p>
            <p className="text-xs text-[#64748b]">Security Guard View</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/guard/dashboard')}
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#4f46e5] cursor-pointer"
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate('/guard/outward')}
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-white text-[#64748b] border border-[#e2e8f0] hover:border-[#4f46e5] cursor-pointer"
          >
            Outward
          </button>
          <button
            onClick={() => navigate('/guard/inward')}
            className="h-8 px-3 rounded-lg text-xs font-semibold bg-[#4f46e5] text-white border border-[#4f46e5] cursor-pointer"
          >
            Inward
          </button>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GUARD_NAME = 'Suresh Patil';
type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

const verBadge = (v: VerificationStatus) => {
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GuardInwardPage() {
  const [passes, setPasses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [verFilter, setVerFilter] = useState<VerificationStatus | 'ALL'>('ALL');
  const [modalGP, setModalGP] = useState<GatePass | null>(null);
  const [modalMode, setModalMode] = useState<'verify' | 'reject' | null>(null);

  const fetchPasses = async () => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `http://localhost:7000/api/v1/gatepass`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await res.json();

      console.log('GATEPASS DATA:==', data);

      // ✅ THIS IS THE FIX
      setPasses(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setPasses([]);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return passes.filter((gp) => {
      const matchSearch =
        !q ||
        gp?.gpNumber.toLowerCase().includes(q) ||
        gp?.partyName.toLowerCase().includes(q) ||
        gp?.vehicleNumber.toLowerCase().includes(q);
      const matchVer =
        verFilter === 'ALL' || gp?.verificationStatus === verFilter;
      return matchSearch && matchVer;
    });
  }, [passes, search, verFilter]);

  // gpId is the first arg — unused placeholder due to signature

  const handleVerify = async (
    gpId: string,
    _exitTime: string,
    entryTime: string,
    remarks: string,
  ) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        alert('Please login again');
        return;
      }
      const res = await fetch(
        `http://localhost:7000/api/v1/gatepass/${gpId}/verify`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      const updatedGP = result.data;

      // ✅ replace with backend data
      await fetchPasses();
    } catch (err) {
      console.error(err);
      alert('Verification failed');
    }
  };

  const handleReject = async (gpId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        console.error('No token found');
        alert('Please login again');
        return;
      }

      const res = await fetch(
        `http://localhost:7000/api/v1/gatepass/${gpId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rejectionReason: reason }),
        },
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.message);

      const updatedGP = result.data;

      await fetchPasses();
    } catch (err) {
      console.error(err);
      alert('Rejection failed');
    }
  };

  return (
    <GuardLayout>
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">
              Inward Gate Passes
            </h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Verify or reject goods entering premises
            </p>
          </div>
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search GP no., party, vehicle..."
              className="h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-56"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Pending',
              value: passes.filter((g) => g.verificationStatus === 'PENDING')
                .length,
              color: 'amber',
              icon: 'ri-time-line',
            },
            {
              label: 'Verified',
              value: passes.filter((g) => g.verificationStatus === 'VERIFIED')
                .length,
              color: 'green',
              icon: 'ri-shield-check-line',
            },
            {
              label: 'Rejected',
              value: passes.filter((g) => g.verificationStatus === 'REJECTED')
                .length,
              color: 'red',
              icon: 'ri-shield-cross-line',
            },
          ].map((c) => (
            <div
              key={c.label}
              className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center gap-3"
            >
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.color === 'amber' ? 'bg-amber-50' : c.color === 'green' ? 'bg-green-50' : 'bg-red-50'}`}
              >
                <i
                  className={`${c.icon} text-lg ${c.color === 'amber' ? 'text-amber-600' : c.color === 'green' ? 'text-green-600' : 'text-red-500'}`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{c.value}</p>
                <p className="text-xs text-[#64748b]">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2">
          {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setVerFilter(s)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${verFilter === s ? 'bg-[#4f46e5] text-white border-[#4f46e5]' : 'bg-white text-[#64748b] border-[#e2e8f0] hover:border-[#4f46e5]/40'}`}
            >
              {s === 'ALL' ? 'All' : s}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {[
                  'GP Number',
                  'Date/Time',
                  'Party',
                  'Vehicle',
                  'Purpose',
                  'Linked Doc',
                  'Items',
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
              {filtered.map((gp, idx) => {
                const vb = verBadge(gp.verificationStatus);
                return (
                  <tr
                    key={gp.id}
                    className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''} ${gp.verificationStatus === 'REJECTED' ? 'border-l-4 border-l-red-400' : ''}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#1e293b]">
                      {gp.gpNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-[#1e293b]">{gp.date}</p>
                      <p className="text-xs text-[#94a3b8]">{gp.time}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1e293b] whitespace-nowrap">
                      {gp.partyName}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748b] whitespace-nowrap">
                      {gp.vehicleNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748b] whitespace-nowrap">
                      {gp.purpose}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748b] whitespace-nowrap">
                      {gp.linkedDocNumber || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs font-semibold text-[#1e293b]">
                        {gp.itemsCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${vb.cls}`}
                      >
                        <i className={`${vb.icon} text-xs`} />
                        {vb.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {gp.verificationStatus === 'PENDING' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setModalGP(gp);
                              setModalMode('reject');
                            }}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-semibold hover:bg-red-100 cursor-pointer"
                          >
                            <i className="ri-close-line text-xs" /> Reject
                          </button>
                          <button
                            onClick={() => {
                              setModalGP(gp);
                              setModalMode('verify');
                            }}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 cursor-pointer"
                          >
                            <i className="ri-checkbox-circle-line text-xs" />{' '}
                            Verify
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#94a3b8] italic">
                          {gp.verificationStatus === 'VERIFIED'
                            ? `By ${gp.verifiedBy ?? 'guard'}`
                            : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <i className="ri-login-box-line text-4xl text-[#e2e8f0] block mb-2" />
                    <p className="text-[#94a3b8] text-sm">
                      No inward gate passes found
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#94a3b8]">
              Showing {filtered.length} of {passes?.length || 0} inward passes
            </p>
          </div>
        </div>
      </div>

      <VerifyRejectModals
        gatePass={modalGP}
        mode={modalMode}
        onClose={() => {
          setModalGP(null);
          setModalMode(null);
        }}
        onVerify={handleVerify}
        onReject={handleReject}
        currentGuardName={GUARD_NAME}
      />
    </GuardLayout>
  );
}
