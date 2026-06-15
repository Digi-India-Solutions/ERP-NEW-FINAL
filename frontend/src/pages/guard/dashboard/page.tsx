import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VerifyRejectModals } from '../components/VerifyRejectModals';
import { useAuthStore } from '@/stores/authStore';

// ─── Guard Layout (no AppLayout — guard has zero access to main app) ──────────

type GatePass = {
  id: string;
  gpNumber: string;
  type: 'OUTWARD' | 'INWARD';
  partyName: string;
  vehicleNumber: string;
  driverName?: string;
  purpose: string;
  items?: { itemName: string; qty: number; unit: string }[];
  itemCount?: number;
  date: string;
  time: string;

  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;

  vehicleExitTime?: string;
  vehicleEntryTime?: string;
  guardRemarks?: string;

  rejectionReason?: string;

  isRecreated?: boolean;
  linkedDocNumber?: string;
  notes?: string;
};

function GuardLayout({
  children,
  currentPage,
}: {
  children: React.ReactNode;
  currentPage: string;
}) {
  const navigate = useNavigate();
  //   const { logout, user } = useAuthStore();
  const { user, logout } = useAuthStore();
  const [time, setTime] = useState(new Date());
  const [logoutOpen, setLogoutOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      path: '/guard/dashboard',
      icon: 'ri-dashboard-3-line',
    },
    {
      label: 'Outward Passes',
      path: '/guard/outward',
      icon: 'ri-logout-box-r-line',
    },
    {
      label: 'Inward Passes',
      path: '/guard/inward',
      icon: 'ri-login-box-line',
    },
  ];

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
            {/* Sidebar */}     {' '}
      <aside className="w-56 bg-[#1e293b] text-white flex flex-col shrink-0">
                {/* Logo */}       {' '}
        <div className="flex items-center gap-3 px-4 h-[60px] border-b border-white/10 shrink-0">
                   {' '}
          <div className="w-8 h-8 bg-[#4f46e5] rounded-lg flex items-center justify-center shrink-0">
                        <i className="ri-shield-user-fill text-white text-sm" />
                     {' '}
          </div>
                   {' '}
          <div>
                       {' '}
            <p className="text-sm font-bold text-white leading-tight">
              Guard Portal
            </p>
                       {' '}
            <p className="text-[10px] text-slate-400">InvenPro Security</p>     
               {' '}
          </div>
                 {' '}
        </div>
                {/* Nav */}       {' '}
        <nav className="flex-1 py-4 px-2 space-y-0.5">
                   {' '}
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        Gate Pass          {' '}
          </p>
                   {' '}
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer text-left ${
                currentPage === item.path
                  ? 'bg-[#4f46e5] text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
                           {' '}
              <i className={`${item.icon} text-lg leading-none shrink-0`} />   
                       {' '}
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
                         {' '}
            </button>
          ))}
                 {' '}
        </nav>
                {/* User */}       {' '}
        <div className="border-t border-white/10 p-3 shrink-0">
                   {' '}
          <div className="flex items-center gap-2 px-2 py-2 mb-1">
                       {' '}
            <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
                           {' '}
              {(user?.name ?? 'SG')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
                         {' '}
            </div>
                       {' '}
            <div className="min-w-0 flex-1">
                           {' '}
              <p className="text-sm font-medium text-white truncate">
                {user?.name ?? 'Guard'}
              </p>
                           {' '}
              <p className="text-[11px] text-slate-400">Security Guard</p>     
                   {' '}
            </div>
                     {' '}
          </div>
                   {' '}
          <button
            onClick={() => setLogoutOpen(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
                        <i className="ri-logout-box-line text-sm" />           {' '}
            <span>Sign out</span>         {' '}
          </button>
                 {' '}
        </div>
             {' '}
      </aside>
            {/* Top bar + content */}     {' '}
      <div className="flex-1 flex flex-col overflow-hidden">
               {' '}
        <header className="bg-white border-b border-[#e2e8f0] px-6 h-[60px] flex items-center justify-between shrink-0">
                   {' '}
          <p className="text-sm font-semibold text-[#1e293b]">
                        Welcome, {user?.name ?? 'Guard'} &mdash; Security Guard
                     {' '}
          </p>
                   {' '}
          <p className="text-sm font-semibold text-[#1e293b]">
                       {' '}
            {time.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            &nbsp;·&nbsp;            {' '}
            <span className="text-[#64748b] font-normal">
                           {' '}
              {time.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
                         {' '}
            </span>
                     {' '}
          </p>
                 {' '}
        </header>
                <main className="flex-1 overflow-y-auto">{children}</main>   
         {' '}
      </div>
            {/* Logout confirm */}     {' '}
      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                   {' '}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setLogoutOpen(false)}
          />
                   {' '}
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center">
                       {' '}
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           {' '}
              <i className="ri-logout-box-line text-red-600 text-xl" />         
               {' '}
            </div>
                       {' '}
            <h3 className="text-base font-semibold text-[#1e293b] mb-1">
              Sign Out
            </h3>
                       {' '}
            <p className="text-sm text-[#64748b] mb-5">
              Are you sure you want to sign out?
            </p>
                       {' '}
            <div className="flex gap-2">
                           {' '}
              <button
                onClick={() => setLogoutOpen(false)}
                className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer"
              >
                Cancel
              </button>
                           {' '}
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login', { replace: true });
                }}
                className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 cursor-pointer"
              >
                Sign Out
              </button>
                         {' '}
            </div>
                     {' '}
          </div>
                 {' '}
        </div>
      )}
         {' '}
    </div>
  );
}

// ─── Pending GP Card ──────────────────────────────────────────────────────────

function PendingCard({
  gp,
  onVerify,
  onReject,
}: {
  gp: GatePass;
  onVerify: (gp: GatePass) => void;
  onReject: (gp: GatePass) => void;
}) {
  return (
    <div
      className={`bg-white border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow ${
        gp.type === 'OUTWARD' ? 'border-blue-100' : 'border-green-100'
      }`}
    >
            {/* Top row */}     {' '}
      <div className="flex items-start justify-between gap-2">
               {' '}
        <div>
                   {' '}
          <div className="flex items-center gap-2 flex-wrap">
                       {' '}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                gp.type === 'OUTWARD'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
                            {gp.type}           {' '}
            </span>
                       {' '}
            {gp.isRecreated && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                                Recreated              {' '}
              </span>
            )}
                     {' '}
          </div>
                   {' '}
          <p className="font-mono font-bold text-[#1e293b] text-sm mt-1">
            {gp.gpNumber}
          </p>
                   {' '}
          {gp.linkedDocNumber && (
            <p className="text-[11px] text-[#94a3b8] font-mono">
              {gp.linkedDocNumber}
            </p>
          )}
                 {' '}
        </div>
               {' '}
        <div className="text-right shrink-0">
                   {' '}
          <p className="text-xs font-semibold text-[#1e293b]">{gp.time}</p>     
              <p className="text-[11px] text-[#94a3b8]">{gp.date}</p>     
           {' '}
        </div>
             {' '}
      </div>
            {/* Details grid */}     {' '}
      <div className="grid grid-cols-2 gap-2">
               {' '}
        <div>
                   {' '}
          <p className="text-[10px] text-[#94a3b8] uppercase font-semibold tracking-wide">
            Party
          </p>
                   {' '}
          <p className="text-xs font-semibold text-[#1e293b] truncate">
            {gp.partyName}
          </p>
                 {' '}
        </div>
               {' '}
        <div>
                   {' '}
          <p className="text-[10px] text-[#94a3b8] uppercase font-semibold tracking-wide">
            Vehicle
          </p>
                   {' '}
          <p className="text-xs font-mono font-bold text-[#1e293b]">
            {gp.vehicleNumber}
          </p>
                 {' '}
        </div>
               {' '}
        {gp.driverName && (
          <div>
                       {' '}
            <p className="text-[10px] text-[#94a3b8] uppercase font-semibold tracking-wide">
              Driver
            </p>
                       {' '}
            <p className="text-xs text-[#1e293b]">{gp.driverName}</p>       
             {' '}
          </div>
        )}
               {' '}
        <div>
                   {' '}
          <p className="text-[10px] text-[#94a3b8] uppercase font-semibold tracking-wide">
            Purpose
          </p>
                    <p className="text-xs text-[#1e293b]">{gp.purpose}</p>     
           {' '}
        </div>
             {' '}
      </div>
            {/* Items */}     {' '}
      <div className="bg-[#f8fafc] rounded-lg p-2.5 space-y-1">
               {' '}
        <p className="text-[10px] font-semibold text-[#64748b] uppercase tracking-wide">
                    Items ({gp.itemCount ?? gp.items?.length ?? 0})        {' '}
        </p>
               {' '}
        {(gp.items ?? []).slice(0, 3).map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
                       {' '}
            <span className="text-[#1e293b] truncate flex-1">
              {item.itemName}
            </span>
                       {' '}
            <span className="text-[#64748b] font-semibold ml-2 shrink-0">
                            {item.qty} {item.unit}           {' '}
            </span>
                     {' '}
          </div>
        ))}
               {' '}
        {(gp.items?.length ?? 0) > 3 && (
          <p className="text-[11px] text-[#94a3b8]">
            +{(gp.itemCount ?? gp.items?.length ?? 0) - 3} more items
          </p>
        )}
             {' '}
      </div>
            {/* Notes */}     {' '}
      {gp.notes && (
        <p className="text-[11px] text-[#64748b] italic truncate">
                    <i className="ri-information-line mr-1" />
          {gp.notes}       {' '}
        </p>
      )}
            {/* Action buttons */}     {' '}
      <div className="flex gap-2 pt-1">
               {' '}
        <button
          onClick={() => onReject(gp)}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 cursor-pointer transition-colors"
        >
                    <i className="ri-close-circle-line text-sm" /> Reject      
           {' '}
        </button>
               {' '}
        <button
          onClick={() => onVerify(gp)}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 cursor-pointer transition-colors"
        >
                    <i className="ri-checkbox-circle-line text-sm" /> Verify    
             {' '}
        </button>
             {' '}
      </div>
         {' '}
    </div>
  );
}

// ─── Guard Dashboard ──────────────────────────────────────────────────────────

export default function GuardDashboard() {
  const { user } = useAuthStore();
  const guardName = user?.name ?? 'Suresh Patil';
  const today = new Date().toLocaleDateString('en-CA');

  const [passes, setPasses] = useState<GatePass[]>([]);
  const [search, setSearch] = useState('');
  const [modalGP, setModalGP] = useState<GatePass | null>(null);
  const [modalMode, setModalMode] = useState<'verify' | 'reject' | null>(null); // Derived lists

  const pending = useMemo(
    () => passes.filter((gp) => gp.verificationStatus === 'PENDING'),
    [passes],
  );
  const verified = useMemo(
    () => passes.filter((gp) => gp.verificationStatus === 'VERIFIED'),
    [passes],
  );
  const rejected = useMemo(
    () => passes.filter((gp) => gp.verificationStatus === 'REJECTED'),
    [passes],
  );
  const todayOutward = useMemo(
    () => passes.filter((gp) => gp.type === 'OUTWARD' && gp.date === today),
    [passes, today],
  );
  const todayInward = useMemo(
    () => passes.filter((gp) => gp.type === 'INWARD' && gp.date === today),
    [passes, today],
  );
  const verifiedToday = verified;

  useEffect(() => {
    console.log('📊 DASHBOARD DATA:', passes);
    console.log('🟢 VERIFIED:', verified);
    console.log('🟡 PENDING:', pending);
    console.log('🔴 REJECTED:', rejected);
  }, [passes, verified, pending, rejected]);

  const fetchPasses = async () => {
    const token = localStorage.getItem('token');

    const res = await fetch(
      'http://localhost:7000/api/v1/gatepass',
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    const data = await res.json();

    // 🔥 STEP 1: get list
    const list = data.data || [];

    // 🔥 STEP 2: fetch each GP in detail
    const detailed = await Promise.all(
      list.map(async (gp: any) => {
        try {
          const res = await fetch(
            `http://localhost:7000/api/v1/gatepass/${gp.id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          const detail = await res.json();

          const d = detail.data;

          return {
            id: d.id,
            gpNumber: d.gp_number,
            type: d.type,
            partyName: d.party_name,
            vehicleNumber: d.vehicle_number,
            driverName: d.driver_name,
            purpose: d.purpose,

            date: d.date?.slice(0, 10),
            time: d.time,

            items: d.items || [],
            itemCount: d.items?.length || 0,

            verificationStatus: (
              d.verification_status || 'PENDING'
            ).toUpperCase(),

            verifiedAt: d.verified_at,
            verifiedBy: d.verified_by,

            rejectionReason: d.rejection_reason,

            vehicleExitTime: d.vehicle_exit_time,
            vehicleEntryTime: d.vehicle_entry_time,
            guardRemarks: d.guard_remarks,

            isRecreated: d.is_recreated,
            linkedDocNumber: d.linked_doc_number,
            notes: d.notes,
          };
        } catch (err) {
          console.error('DETAIL FETCH ERROR:', err);
          return null;
        }
      }),
    );

    setPasses(detailed.filter(Boolean));
  };

  // ✅ CALL HERE
  useEffect(() => {
    fetchPasses();

    const interval = setInterval(fetchPasses, 3000); // auto refresh

    return () => clearInterval(interval);
  }, []);

  const verRate =
    passes.length > 0 ? Math.round((verified.length / passes.length) * 100) : 0;

  const filteredPending = useMemo(() => {
    const q = search.toLowerCase();
    return pending.filter(
      (gp) =>
        !q ||
        gp.gpNumber.toLowerCase().includes(q) ||
        gp.vehicleNumber.toLowerCase().includes(q) ||
        gp.partyName.toLowerCase().includes(q),
    );
  }, [pending, search]); // ── Verify ──────────────────────────────────────────────────────────────
  // Sync back to mock array (so other pages see the update)

  const handleVerify = async (
    gpId: string,
    exitTime: string,
    entryTime: string,
    remarks: string,
  ) => {
    try {
      const token = localStorage.getItem('token');

      const res = await fetch(
        `http://localhost:7000/api/v1/gatepass/${gpId}/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            exitTime,
            entryTime,
            remarks,
          }),
        },
      );

      const result = await res.json();

      console.log('AFTER VERIFY:', result);

      if (!res.ok) throw new Error(result.message);

      // ✅ IMPORTANT: REFRESH DATA FROM BACKEND
      setPasses((prev) =>
        prev.map((gp) =>
          gp.id === gpId
            ? {
                ...gp,
                verificationStatus: 'VERIFIED',
                verifiedAt: new Date().toISOString(),
              }
            : gp,
        ),
      );

      setPasses((prev) =>
        prev.map((gp) =>
          gp.id === gpId
            ? {
                ...gp,
                verificationStatus: 'REJECTED',
                rejectionReason: reason,
              }
            : gp,
        ),
      );
    } catch (err) {
      console.error(err);
      alert('Verification failed');
    }
  }; // ── Reject ───────────────────────────────────────────────────────────────

  const handleReject = async (gpId: string, reason: string) => {
    try {
      const token = localStorage.getItem('token');

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

      console.log('AFTER VERIFY:', result);

      if (!res.ok) throw new Error(result.message);

      // ✅ REFRESH
      await fetchPasses();
    } catch (err) {
      console.error(err);
      alert('Rejection failed');
    }
  }; // ────────────────────────────────────────────────────────────────────────

  return (
    <GuardLayout currentPage="/guard/dashboard">
           {' '}
      <div className="p-6 space-y-6">
                {/* Welcome */}       {' '}
        <div className="flex items-center justify-between">
                   {' '}
          <div>
                       {' '}
            <h2 className="text-xl font-bold text-[#1e293b]">
                            Welcome, {guardName}           {' '}
            </h2>
                       {' '}
            <p className="text-sm text-[#64748b] mt-0.5">
                           {' '}
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
                         {' '}
            </p>
                     {' '}
          </div>
                   {' '}
          {pending.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200">
                           {' '}
              <span className="relative flex w-2 h-2">
                               {' '}
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                               {' '}
                <span className="relative inline-flex rounded-full w-2 h-2 bg-amber-500" />
                             {' '}
              </span>
                           {' '}
              <span className="text-sm font-semibold text-amber-700">
                                {pending.length} pending verification          
                   {' '}
              </span>
                         {' '}
            </div>
          )}
                 {' '}
        </div>
                {/* Summary cards */}       {' '}
        <div className="grid grid-cols-4 gap-4">
                   {' '}
          {[
            {
              label: "Today's Outward",
              value: todayOutward.length,
              icon: 'ri-logout-box-r-line',
              bg: 'bg-blue-50',
              color: 'text-blue-600',
            },
            {
              label: "Today's Inward",
              value: todayInward.length,
              icon: 'ri-login-box-line',
              bg: 'bg-green-50',
              color: 'text-green-600',
            },
            {
              label: 'Pending',
              value: pending.length,
              icon: 'ri-time-line',
              bg: 'bg-amber-50',
              color: 'text-amber-600',
            },
            {
              label: 'Rejected',
              value: rejected.length,
              icon: 'ri-close-circle-line',
              bg: 'bg-red-50',
              color: 'text-red-500',
            },
          ].map((c) => (
            <div
              key={c.label}
              className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${
                c.label === 'Rejected' && c.value > 0
                  ? 'border-red-200'
                  : 'border-[#e2e8f0]'
              }`}
            >
                           {' '}
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-xl ${c.bg}`}
              >
                                <i className={`${c.icon} text-lg ${c.color}`} />
                             {' '}
              </div>
                           {' '}
              <div>
                               {' '}
                <p
                  className={`text-2xl font-bold ${c.label === 'Rejected' && c.value > 0 ? 'text-red-600' : 'text-[#1e293b]'}`}
                >
                                    {c.value}               {' '}
                </p>
                               {' '}
                <p className="text-xs text-[#64748b]">{c.label}</p>           
                 {' '}
              </div>
                         {' '}
            </div>
          ))}
                 {' '}
        </div>
                {/* Weekly verification rate bar */}       {' '}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-5">
                   {' '}
          <div className="flex items-center justify-between mb-3">
                       {' '}
            <p className="text-sm font-semibold text-[#1e293b]">
              Verification Rate
            </p>
                       {' '}
            <span className="text-lg font-bold text-[#4f46e5]">{verRate}%</span>
                     {' '}
          </div>
                   {' '}
          <div className="w-full bg-[#f1f5f9] rounded-full h-3 overflow-hidden">
                       {' '}
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${verRate}%`,
                background:
                  verRate >= 80
                    ? '#22c55e'
                    : verRate >= 50
                      ? '#f59e0b'
                      : '#ef4444',
              }}
            />
                     {' '}
          </div>
                   {' '}
          <div className="flex items-center gap-5 mt-3">
                       {' '}
            <div className="flex items-center gap-1.5 text-xs">
                           {' '}
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                           {' '}
              <span className="text-[#64748b]">
                <span className="font-bold text-[#1e293b]">
                  {verified.length}
                </span>{' '}
                verified
              </span>
                         {' '}
            </div>
                       {' '}
            <div className="flex items-center gap-1.5 text-xs">
                           {' '}
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                           {' '}
              <span className="text-[#64748b]">
                <span className="font-bold text-[#1e293b]">
                  {rejected.length}
                </span>{' '}
                rejected
              </span>
                         {' '}
            </div>
                       {' '}
            <div className="flex items-center gap-1.5 text-xs">
                           {' '}
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                           {' '}
              <span className="text-[#64748b]">
                <span className="font-bold text-[#1e293b]">
                  {pending.length}
                </span>{' '}
                pending
              </span>
                         {' '}
            </div>
                       {' '}
            <div className="flex items-center gap-1.5 text-xs ml-auto text-[#64748b]">
                            Total:{' '}
              <span className="font-bold text-[#1e293b] ml-1">
                {passes.length}
              </span>
                         {' '}
            </div>
                     {' '}
          </div>
                 {' '}
        </div>
               {' '}
        {/* ── PENDING VERIFICATION SECTION ─────────────────────────────── */} 
             {' '}
        <div>
                   {' '}
          <div className="flex items-center justify-between mb-4">
                       {' '}
            <h3 className="text-base font-semibold text-[#1e293b]">
                            Pending Verification              {' '}
              <span className="ml-2 text-sm font-normal text-[#64748b]">
                                ({filteredPending.length})              {' '}
              </span>
                         {' '}
            </h3>
                       {' '}
            <div className="relative">
                           {' '}
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
                           {' '}
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by GP no. or vehicle..."
                className="h-8 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm bg-white focus:outline-none focus:border-[#4f46e5] w-56"
              />
                         {' '}
            </div>
                     {' '}
          </div>
                   {' '}
          {filteredPending.length === 0 ? (
            <div className="bg-white border border-[#e2e8f0] rounded-xl p-12 text-center">
                           {' '}
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                               {' '}
                <i className="ri-checkbox-circle-fill text-green-500 text-2xl" />
                             {' '}
              </div>
                           {' '}
              <p className="text-base font-semibold text-[#1e293b] mb-1">
                All clear!
              </p>
                           {' '}
              <p className="text-sm text-[#94a3b8]">
                No gate passes pending verification
              </p>
                         {' '}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                           {' '}
              {filteredPending.map((gp) => (
                <PendingCard
                  key={gp.id}
                  gp={gp}
                  onVerify={(g) => {
                    setModalGP(g);
                    setModalMode('verify');
                  }}
                  onReject={(g) => {
                    setModalGP(g);
                    setModalMode('reject');
                  }}
                />
              ))}
                         {' '}
            </div>
          )}
                 {' '}
        </div>
               {' '}
        {/* ── VERIFIED TODAY TABLE ──────────────────────────────────────── */}
               {' '}
        {verified.length > 0 && (
          <div>
                       {' '}
            <h3 className="text-base font-semibold text-[#1e293b] mb-3">
                            Verified Gate Passes              {' '}
              <span className="ml-2 text-sm font-normal text-[#64748b]">
                ({verified.length})
              </span>
                         {' '}
            </h3>
                       {' '}
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                           {' '}
              <table className="w-full text-sm">
                               {' '}
                <thead>
                                   {' '}
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                       {' '}
                    {[
                      'GP No.',
                      'Type',
                      'Party',
                      'Vehicle',
                      'Verified At',
                      'Exit/Entry Time',
                      'Remarks',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                                     {' '}
                  </tr>
                                 {' '}
                </thead>
                               {' '}
                <tbody>
                                   {' '}
                  {verified.map((gp, idx) => (
                    <tr
                      key={gp.id}
                      className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}
                    >
                                           {' '}
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#1e293b]">
                        {gp.gpNumber}
                      </td>
                                           {' '}
                      <td className="px-4 py-3">
                                               {' '}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            gp.type === 'OUTWARD'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {gp.type}
                        </span>
                                             {' '}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 text-[#1e293b] whitespace-nowrap">
                        {gp.partyName}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 font-mono text-xs text-[#64748b]">
                        {gp.vehicleNumber}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 text-xs text-[#64748b] whitespace-nowrap">
                                               {' '}
                        {gp.verifiedAt
                          ? new Date(gp.verifiedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                                             {' '}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 text-xs text-[#64748b]">
                                               {' '}
                        {gp.type === 'OUTWARD'
                          ? (gp.vehicleExitTime ?? '—')
                          : (gp.vehicleEntryTime ?? '—')}
                                             {' '}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 text-xs text-[#64748b] max-w-[160px] truncate">
                                                {gp.guardRemarks ?? '—'}       
                                     {' '}
                      </td>
                                         {' '}
                    </tr>
                  ))}
                                 {' '}
                </tbody>
                             {' '}
              </table>
                         {' '}
            </div>
                     {' '}
          </div>
        )}
               {' '}
        {/* ── REJECTED TABLE ────────────────────────────────────────────── */}
               {' '}
        {rejected.length > 0 && (
          <div>
                       {' '}
            <h3 className="text-base font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                           {' '}
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                            Rejected Gate Passes              {' '}
              <span className="text-sm font-normal text-[#64748b]">
                ({rejected.length})
              </span>
                         {' '}
            </h3>
                       {' '}
            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
                           {' '}
              <table className="w-full text-sm">
                               {' '}
                <thead>
                                   {' '}
                  <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                       {' '}
                    {[
                      'GP No.',
                      'Type',
                      'Party',
                      'Vehicle',
                      'Rejection Reason',
                      'Rejected At',
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                                     {' '}
                  </tr>
                                 {' '}
                </thead>
                               {' '}
                <tbody>
                                   {' '}
                  {rejected.map((gp, idx) => (
                    <tr
                      key={gp.id}
                      className={`border-b border-[#f1f5f9] border-l-4 border-l-red-400 ${idx % 2 !== 0 ? 'bg-[#f8fafc]/40' : ''}`}
                    >
                                           {' '}
                      <td className="px-4 py-3 font-mono text-xs font-bold text-[#1e293b]">
                        {gp.gpNumber}
                      </td>
                                           {' '}
                      <td className="px-4 py-3">
                                               {' '}
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            gp.type === 'OUTWARD'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}
                        >
                          {gp.type}
                        </span>
                                             {' '}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 text-[#1e293b] whitespace-nowrap">
                        {gp.partyName}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 font-mono text-xs text-[#64748b]">
                        {gp.vehicleNumber}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 text-xs text-red-600 max-w-[220px]">
                        {gp.rejectionReason ?? '—'}
                      </td>
                                           {' '}
                      <td className="px-4 py-3 text-xs text-[#64748b] whitespace-nowrap">
                                               {' '}
                        {gp.verifiedAt
                          ? new Date(gp.verifiedAt).toLocaleDateString('en-IN')
                          : '—'}
                                             {' '}
                      </td>
                                         {' '}
                    </tr>
                  ))}
                                 {' '}
                </tbody>
                             {' '}
              </table>
                         {' '}
            </div>
                     {' '}
          </div>
        )}
             {' '}
      </div>
            {/* Verify / Reject modal */}     {' '}
      <VerifyRejectModals
        gatePass={modalGP}
        mode={modalMode}
        onClose={() => {
          setModalGP(null);
          setModalMode(null);
        }}
        onVerify={handleVerify}
        onReject={handleReject}
        currentGuardName={guardName}
      />
         {' '}
    </GuardLayout>
  );
}
