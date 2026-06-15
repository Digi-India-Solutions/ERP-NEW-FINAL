import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import { useToast } from '@/contexts/ToastContext';
import RolesPermissionsTab from './components/RolesPermissionsTab';
import InvoiceSettingsTab from './components/InvoiceSettingsTab';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/utils/permissions';

type SettingsTab = 'company' | 'invoice' | 'warehouses' | 'backup' | 'roles';

const STATE_CODES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];

const EXPORT_MAP: Record<string, string> = {
  'Export Items Master': 'items',
  'Export Parties': 'parties',
  'Export Sales Register': 'sales',
  'Export Purchase Register': 'purchases',
  'Export Stock Summary': 'stock',
  'Export Audit Log': 'audit',
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${time}`;
}

interface BackupRecord {
  id: string;
  filename: string;
  size_bytes: number;
  tables_count: number;
  created_at: string;
  created_by_name: string | null;
}

const API_BASE = 'http://localhost:7001/api/v1';

interface CompanyForm {
  name: string;
  address: string;
  gstin: string;
  pan: string;
  stateCode: string;
  phone: string;
  email: string;
  website: string;
  financialYearStart: string;
  invoice_prefix: string;
  bank_name: string;
  bank_account: string;
  bank_ifsc: string;
}

const EMPTY_COMPANY: CompanyForm = {
  name: '',
  address: '',
  gstin: '',
  pan: '',
  stateCode: '27',
  phone: '',
  email: '',
  website: '',
  financialYearStart: '',
  invoice_prefix: 'INV',
  bank_name: '',
  bank_account: '',
  bank_ifsc: '',
};

export default function Settings() {
  const toast = useToast();
  const navigate = useNavigate();
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<SettingsTab>('company');
  const [companyExists, setCompanyExists] = useState<boolean | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [company, setCompany] = useState<CompanyForm>(EMPTY_COMPANY);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);

  const { user, hasPermission, hasControl, loading: authLoading } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canViewSettings =
    !authLoading && hasPermission(MODULES.SETTINGS, 'view');
  const canEditSettings =
    !authLoading && hasPermission(MODULES.SETTINGS, 'edit');
  const canManageRoles = !authLoading && hasControl('manageUserPermissions');
  const canSeeWarehouses =
    !authLoading && hasPermission(MODULES.WAREHOUSES, 'view');
  const canExportData = !authLoading && hasControl('exportData');

  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);

  const TAB_META = authLoading
    ? []
    : [
        ...(hasPermission(MODULES.SETTINGS, 'view')
          ? [
              {
                id: 'company',
                label: 'Company Profile',
                icon: 'ri-building-line',
              },
              {
                id: 'invoice',
                label: 'Invoice Settings',
                icon: 'ri-file-text-line',
              },
            ]
          : []),
        ...(hasPermission(MODULES.WAREHOUSES, 'view')
          ? [
              {
                id: 'warehouses',
                label: 'Warehouse Management',
                icon: 'ri-store-3-line',
              },
            ]
          : []),
        ...(hasPermission(MODULES.SETTINGS, 'view')
          ? [
              {
                id: 'roles',
                label: 'Roles & Permissions',
                icon: 'ri-shield-user-line',
              },
            ]
          : []),
        ...(canExportData
          ? [
              {
                id: 'backup',
                label: 'Backup & Export',
                icon: 'ri-database-2-line',
              },
            ]
          : []),
      ];

  const isTabAllowed = (tab: SettingsTab) => {
    switch (tab) {
      case 'company':
      case 'invoice':
      case 'backup':
        return hasPermission(MODULES.SETTINGS, 'view');

      case 'warehouses':
        return hasPermission(MODULES.WAREHOUSES, 'view');

      case 'roles':
        return hasControl('manageUserPermissions');

      default:
        return false;
    }
  };

  const handleExport = async (type: string, label: string) => {
    try {
      const res = await fetch(`${API_BASE}/backup-export/export/${type}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.message || 'Export failed');
        return;
      }

      // 👇 important: get JSON response
      const json = await res.json();

      // 👇 create downloadable file
      const blob = new Blob([JSON.stringify(json.data, null, 2)], {
        type: 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      const fileName = `${type}-${new Date().toISOString().slice(0, 10)}.json`;

      a.href = url;
      a.download = fileName;
      a.click();

      window.URL.revokeObjectURL(url);

      toast.success(`${label} downloaded successfully`);
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong during export');
    }
  };

  const handleBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch(`${API_BASE}/backup-export/backup`, {
        method: 'POST',
        headers: authHeader(),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Backup failed');
        return;
      }
      toast.success('Backup created successfully');
      await fetchBackups(); // refresh list immediately
    } catch {
      toast.error('Backup failed');
    } finally {
      setCreatingBackup(false);
    }
  };

  // const handleDownloadBackup = (filename: string) => {
  //   const baseUrl = API_BASE.replace('/api/v1', '');
  //   window.open(`${baseUrl}/backups/${filename}`, '_blank');
  // };
  const handleDownloadBackup = async (filename: string) => {
    try {
      const baseUrl = API_BASE.replace('/api/v1', '');
      const res = await fetch(`${baseUrl}/backups/${filename}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        toast.error('Download failed');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename; // ← this forces download instead of open
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Backup downloaded');
      window.open(`${baseUrl}/backups/${filename}`, '_blank');
    } catch {
      toast.error('Download failed');
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoringId(restoreTarget.id);
    try {
      const res = await fetch(`${API_BASE}/backup-export/restore`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({ filename: restoreTarget.filename }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Restore failed');
        return;
      }
      toast.success(
        `Restored ${json.data?.total_rows_restored ?? 0} rows successfully`,
      );
    } catch {
      toast.error('Restore failed');
    } finally {
      setRestoringId(null);
      setShowRestoreConfirm(false);
      setRestoreTarget(null);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (TAB_META.length > 0) {
      setActiveTab(TAB_META[TAB_META.length - 1].id as SettingsTab);
    }
  }, [authLoading]);

  const token = localStorage.getItem('token');

  const authHeader = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  // Warehouse tab: redirect immediately
  useEffect(() => {
    if (activeTab === 'warehouses') navigate('/masters/warehouses');
  }, [activeTab, navigate]);

  const fetchCompany = useCallback(async () => {
    setLoadingCompany(true);
    try {
      const res = await fetch(`${API_BASE}/company/get`, {
        headers: authHeader(),
      });
      if (res.status === 404) {
        setCompanyExists(false);
        setCompany(EMPTY_COMPANY);
        setLogoPreview(null);
        return;
      }
      if (!res.ok) throw new Error();
      const json = await res.json();
      const d = json.data;
      setCompanyExists(true);
      setCompany({
        name: d.name ?? '',
        address: d.address ?? '',
        gstin: d.gstin ?? '',
        pan: d.pan ?? '',
        stateCode: d.state_code ?? '27',
        phone: d.phone ?? '',
        email: d.email ?? '',
        website: d.website ?? '',
        financialYearStart: d.financial_year_start
          ? d.financial_year_start.slice(0, 10)
          : '',
        invoice_prefix: d.invoice_prefix ?? 'INV',
        bank_name: d.bank_name ?? '',
        bank_account: d.bank_account ?? '',
        bank_ifsc: d.bank_ifsc ?? '',
      });
      setLogoPreview(d.logo_url ?? null);
    } catch {
      toast.error('Failed to load company profile');
      setCompanyExists(false);
    } finally {
      setLoadingCompany(false);
    }
  }, [authHeader, toast]);

  const fetchBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch(`${API_BASE}/backup-export/list`, {
        headers: authHeader(),
      });
      const json = await res.json();
      if (res.ok) setBackups(json.data || []);
    } catch {
      /* silently fail */
    } finally {
      setLoadingBackups(false);
    }
  }, [authHeader]);

  useEffect(() => {
    if (activeTab === 'backup') fetchBackups();
  }, [activeTab, fetchBackups]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const buildBody = () => ({
    name: company.name,
    address: company.address,
    gstin: company.gstin,
    pan: company.pan,
    stateCode: company.stateCode,
    financialYearStart: company.financialYearStart,
    invoice_prefix: company.invoice_prefix,
    phone: company.phone,
    email: company.email,
    website: company.website,
    bank_name: company.bank_name,
    bank_account: company.bank_account,
    bank_ifsc: company.bank_ifsc,
    logoPreview: logoPreview || null,
  });

  const handleCreate = async () => {
    if (!company.name || !company.stateCode || !company.financialYearStart) {
      toast.error('Company Name, State and Financial Year Start are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/company/`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(buildBody()),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Failed to create company');
        return;
      }
      toast.success('Company profile created successfully');
      setCompanyExists(true);
      await fetchCompany();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'warehouses' && !canSeeWarehouses) {
      setActiveTab('company');
    }
  }, [activeTab, canSeeWarehouses]);

  const handleUpdate = async () => {
    if (!company.name || !company.stateCode || !company.financialYearStart) {
      toast.error('Company Name, State and Financial Year Start are required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/company/`, {
        method: 'PUT',
        headers: authHeader(),
        body: JSON.stringify(buildBody()),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Failed to update company');
        return;
      }
      toast.success('Company profile updated successfully');
      setLogoFile(null);
      await fetchCompany();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` } as Record<
        string,
        string
      >;
      const getRes = await fetch(`${API_BASE}/company/get`, { headers });
      const getJson = await getRes.json();
      const id = getJson?.data?.id;
      if (!id) {
        toast.error('Could not determine company ID');
        return;
      }
      const res = await fetch(`${API_BASE}/company/${id}`, {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.message || 'Failed to delete');
        return;
      }
      toast.success('Company profile deleted');
      setCompanyExists(false);
      setCompany(EMPTY_COMPANY);
      setLogoPreview(null);
      setLogoFile(null);
    } catch {
      toast.error('Failed to delete company profile');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'company')
      companyExists ? await handleUpdate() : await handleCreate();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB');
      return;
    }
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      toast.error('Only JPG/PNG accepted');
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const fieldCls =
    'w-full h-10 px-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 text-[#1e293b]';
  const labelCls =
    'block text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wide';

  const CompanySkeleton = () => (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4" />
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl bg-slate-200" />
          <div className="space-y-2">
            <div className="h-9 w-32 bg-slate-200 rounded-lg" />
            <div className="h-3 w-48 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={i === 0 || i === 7 ? 'col-span-2' : ''}>
              <div className="h-3 bg-slate-100 rounded w-1/3 mb-2" />
              <div className="h-10 bg-slate-200 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 pb-16">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#1e293b]">Settings</h2>
            <p className="text-sm text-[#64748b] mt-0.5">
              Super Admin · Configure company and system preferences
            </p>
          </div>

          <div className="flex gap-6">
            {/* Sidebar */}
            <div className="w-52 shrink-0">
              <nav className="space-y-1">
                {TAB_META.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer text-left whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-[#4f46e5] text-white'
                        : 'text-[#64748b] hover:bg-slate-100 hover:text-[#1e293b]'
                    }`}
                  >
                    <i
                      className={`${tab.icon} text-base w-4 h-4 flex items-center justify-center`}
                    />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* ══ COMPANY PROFILE ══ */}
              {activeTab === 'company' && (
                <>
                  {loadingCompany ? (
                    <CompanySkeleton />
                  ) : (
                    <div className="space-y-6">
                      {companyExists === false && (
                        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                          <i className="ri-information-line text-amber-500 text-lg mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-800">
                              No Company Profile Found
                            </p>
                            <p className="text-xs text-amber-700 mt-0.5">
                              Fill in the details below and click{' '}
                              <strong>Save</strong>.
                            </p>
                          </div>
                        </div>
                      )}
                      {companyExists === true && canEditSettings && (
                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
                          <div className="flex items-center gap-2">
                            <i className="ri-checkbox-circle-fill text-green-500 text-base" />
                            <span className="text-sm font-medium text-green-800">
                              Company profile is set up
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => fetchCompany()}
                              className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-green-300 text-xs font-medium text-green-700 hover:bg-green-100 cursor-pointer"
                            >
                              <i className="ri-refresh-line text-xs" />
                              Refresh
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(true)}
                              className="flex items-center gap-1.5 h-7 px-3 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                              <i className="ri-delete-bin-line text-xs" />
                              Delete Profile
                            </button>
                          </div>
                        </div>
                      )}

                      {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                <i className="ri-delete-bin-line text-red-600 text-lg" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-[#1e293b]">
                                  Delete Company Profile?
                                </p>
                                <p className="text-xs text-[#64748b] mt-0.5">
                                  This action cannot be undone.
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-3 mt-5">
                              <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-slate-50 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                              >
                                {deleting ? (
                                  <>
                                    <i className="ri-loader-4-line animate-spin" />
                                    Deleting…
                                  </>
                                ) : (
                                  <>
                                    <i className="ri-delete-bin-line" />
                                    Delete
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Logo */}
                      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-[#1e293b] mb-4 pb-3 border-b border-[#e2e8f0]">
                          Company Logo
                        </h3>
                        <div className="flex items-center gap-6">
                          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[#e2e8f0] flex items-center justify-center bg-slate-50 overflow-hidden">
                            {logoPreview ? (
                              <img
                                src={logoPreview}
                                alt="Company logo"
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <div className="text-center">
                                <i className="ri-image-line text-3xl text-slate-300 block" />
                                <span className="text-xs text-slate-400 mt-1 block">
                                  No Logo
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            {canEditSettings && (
                              <button
                                onClick={() => logoInputRef.current?.click()}
                                className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#1e293b] hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                              >
                                <i className="ri-upload-2-line" />
                                Upload Logo
                              </button>
                            )}
                            <p className="text-xs text-[#64748b] mt-2">
                              JPG or PNG, max 2MB. Appears on all invoices.
                            </p>
                            <input
                              ref={logoInputRef}
                              type="file"
                              accept="image/jpeg,image/png"
                              onChange={handleLogoChange}
                              className="hidden"
                            />
                            {logoPreview && canEditSettings && (
                              <button
                                onClick={() => {
                                  setLogoPreview(null);
                                  setLogoFile(null);
                                }}
                                className="text-xs text-red-500 hover:text-red-700 mt-1 cursor-pointer"
                              >
                                Remove logo
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Company Information */}
                      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-[#1e293b] mb-4 pb-3 border-b border-[#e2e8f0]">
                          Company Information
                          {companyExists === false && (
                            <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                              New
                            </span>
                          )}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className={labelCls}>
                              Company Name{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={company.name}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                              placeholder="e.g. InvenPro Pvt Ltd"
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>GSTIN</label>
                            <input
                              type="text"
                              value={company.gstin}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  gstin: e.target.value.toUpperCase(),
                                }))
                              }
                              maxLength={15}
                              placeholder="27AABCU9603R1ZX"
                              className={fieldCls}
                            />
                            {company.gstin &&
                              !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(
                                company.gstin,
                              ) && (
                                <p className="text-xs text-red-500 mt-1">
                                  Invalid GSTIN format
                                </p>
                              )}
                          </div>
                          <div>
                            <label className={labelCls}>PAN</label>
                            <input
                              type="text"
                              value={company.pan}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  pan: e.target.value.toUpperCase(),
                                }))
                              }
                              maxLength={10}
                              placeholder="AABCU9603R"
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>
                              State <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={company.stateCode}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  stateCode: e.target.value,
                                }))
                              }
                              className={fieldCls}
                            >
                              {STATE_CODES.map((s) => (
                                <option key={s.code} value={s.code}>
                                  {s.code} — {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Phone</label>
                            <input
                              type="tel"
                              value={company.phone}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  phone: e.target.value,
                                }))
                              }
                              placeholder="9876543210"
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Email</label>
                            <input
                              type="email"
                              value={company.email}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  email: e.target.value,
                                }))
                              }
                              placeholder="accounts@company.com"
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Website</label>
                            <input
                              type="text"
                              value={company.website}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  website: e.target.value,
                                }))
                              }
                              placeholder="www.company.com"
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>
                              Financial Year Start{' '}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="date"
                              value={company.financialYearStart}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  financialYearStart: e.target.value,
                                }))
                              }
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Invoice Prefix</label>
                            <input
                              type="text"
                              value={company.invoice_prefix}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  invoice_prefix: e.target.value.toUpperCase(),
                                }))
                              }
                              maxLength={10}
                              placeholder="INV"
                              className={`${fieldCls} font-mono`}
                            />
                          </div>
                          <div className="col-span-2">
                            <label className={labelCls}>Address</label>
                            <textarea
                              value={company.address}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  address: e.target.value,
                                }))
                              }
                              rows={3}
                              placeholder="Full address including city, state and pincode"
                              className="w-full px-3 py-2.5 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-indigo-100 resize-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bank Details */}
                      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                        <h3 className="text-sm font-semibold text-[#1e293b] mb-4 pb-3 border-b border-[#e2e8f0]">
                          Bank Details
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <label className={labelCls}>Bank Name</label>
                            <input
                              type="text"
                              value={company.bank_name}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  bank_name: e.target.value,
                                }))
                              }
                              placeholder="e.g. HDFC Bank"
                              className={fieldCls}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Account Number</label>
                            <input
                              type="text"
                              value={company.bank_account}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  bank_account: e.target.value,
                                }))
                              }
                              placeholder="XXXXXXXXXXXX"
                              className={`${fieldCls} font-mono`}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>IFSC Code</label>
                            <input
                              type="text"
                              value={company.bank_ifsc}
                              onChange={(e) =>
                                setCompany((p) => ({
                                  ...p,
                                  bank_ifsc: e.target.value.toUpperCase(),
                                }))
                              }
                              maxLength={11}
                              placeholder="HDFC0001234"
                              className={`${fieldCls} font-mono`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {canEditSettings && (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={
                              companyExists ? handleUpdate : handleCreate
                            }
                            disabled={saving}
                            className="flex items-center gap-2 h-10 px-6 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 cursor-pointer disabled:opacity-60 whitespace-nowrap"
                          >
                            {saving ? (
                              <>
                                <i className="ri-loader-4-line animate-spin" />
                                {companyExists ? 'Updating…' : 'Creating…'}
                              </>
                            ) : (
                              <>
                                <i
                                  className={
                                    companyExists
                                      ? 'ri-save-line'
                                      : 'ri-add-line'
                                  }
                                />
                                {companyExists
                                  ? 'Update Company Profile'
                                  : 'Create Company Profile'}
                              </>
                            )}
                          </button>
                          {companyExists && (
                            <button
                              onClick={() => fetchCompany()}
                              className="flex items-center gap-2 h-10 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                            >
                              <i className="ri-refresh-line" />
                              Discard Changes
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ══ INVOICE SETTINGS ══ */}
              {activeTab === 'invoice' && <InvoiceSettingsTab />}

              {/* ══ WAREHOUSE ══ */}

              {/* ══ ROLES ══ */}
              {activeTab === 'roles' && <RolesPermissionsTab />}

              {/* ══ BACKUP ══
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-[#1e293b] mb-4 pb-3 border-b border-[#e2e8f0]">Export Data</h3>
                    <div className="grid grid-cols-2 gap-4">
                     {[
  { label: 'Export Items Master', icon: 'ri-box-3-line', desc: 'All items...', color: 'bg-indigo-50 text-[#4f46e5]' },
  { label: 'Export Parties', icon: 'ri-group-2-line', desc: 'All customers...', color: 'bg-green-50 text-green-600' },
  { label: 'Export Sales Register', icon: 'ri-bar-chart-2-line', desc: 'Sales...', color: 'bg-emerald-50 text-emerald-600' },
  { label: 'Export Purchase Register', icon: 'ri-store-2-line', desc: 'Purchases...', color: 'bg-blue-50 text-blue-600' },
  { label: 'Export Stock Summary', icon: 'ri-stack-line', desc: 'Stock...', color: 'bg-amber-50 text-amber-600' },
  { label: 'Export Audit Log', icon: 'ri-history-line', desc: 'Logs...', color: 'bg-slate-100 text-slate-600' },
].map((item) => (
  <button
    key={item.label}
    onClick={() => handleExport(EXPORT_MAP[item.label], item.label)}
    className="flex items-center gap-4 p-4 border border-[#e2e8f0] rounded-xl hover:border-[#4f46e5]/40 hover:bg-indigo-50/20 transition-all cursor-pointer text-left"
  >
    <div className={`w-10 h-10 rounded-lg ${item.color.split(' ')[0]} flex items-center justify-center shrink-0`}>
      <i className={`${item.icon} text-base ${item.color.split(' ')[1]}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-[#1e293b]">{item.label}</p>
      <p className="text-xs text-[#64748b] mt-0.5">{item.desc}</p>
    </div>
    <i className="ri-download-2-line text-slate-300 ml-auto" />
  </button>
))}

                    </div>
                  </div>
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-[#1e293b] mb-3">Database Backup</h3>
                    <p className="text-xs text-[#64748b] mb-4">Full database backups are automatically created daily.</p>
                    <div className="flex items-center gap-3">
                      <button onClick={handleBackup}
                        className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#1e293b] hover:bg-slate-50 cursor-pointer whitespace-nowrap">
                        <i className="ri-database-2-line text-[#4f46e5]" />Create Backup Now
                      </button>
                      <span className="text-xs text-[#64748b]">Last backup: Today at 02:00 AM</span>
                    </div>
                  </div>
                </div>
              )} */}

              {/* ══ BACKUP ══ */}
              {activeTab === 'backup' && (
                <div className="space-y-4">
                  {/* Export Data card — unchanged */}
                  <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                    <h3 className="text-sm font-semibold text-[#1e293b] mb-4 pb-3 border-b border-[#e2e8f0]">
                      Export Data
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        {
                          label: 'Export Items Master',
                          icon: 'ri-box-3-line',
                          desc: 'All items...',
                          color: 'bg-indigo-50 text-[#4f46e5]',
                        },
                        {
                          label: 'Export Parties',
                          icon: 'ri-group-2-line',
                          desc: 'All customers...',
                          color: 'bg-green-50 text-green-600',
                        },
                        {
                          label: 'Export Sales Register',
                          icon: 'ri-bar-chart-2-line',
                          desc: 'Sales...',
                          color: 'bg-emerald-50 text-emerald-600',
                        },
                        {
                          label: 'Export Purchase Register',
                          icon: 'ri-store-2-line',
                          desc: 'Purchases...',
                          color: 'bg-blue-50 text-blue-600',
                        },
                        {
                          label: 'Export Stock Summary',
                          icon: 'ri-stack-line',
                          desc: 'Stock...',
                          color: 'bg-amber-50 text-amber-600',
                        },
                        // { label: 'Export Audit Log',         icon: 'ri-history-line',    desc: 'Logs...',           color: 'bg-slate-100 text-slate-600'     },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() =>
                            handleExport(EXPORT_MAP[item.label], item.label)
                          }
                          className="flex items-center gap-4 p-4 border border-[#e2e8f0] rounded-xl hover:border-[#4f46e5]/40 hover:bg-indigo-50/20 transition-all cursor-pointer text-left"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg ${item.color.split(' ')[0]} flex items-center justify-center shrink-0`}
                          >
                            <i
                              className={`${item.icon} text-base ${item.color.split(' ')[1]}`}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#1e293b]">
                              {item.label}
                            </p>
                            <p className="text-xs text-[#64748b] mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                          <i className="ri-download-2-line text-slate-300 ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Database Backup card */}
                  {isSuperAdmin && (
                    <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
                      <h3 className="text-sm font-semibold text-[#1e293b] mb-3 pb-3 border-b border-[#e2e8f0]">
                        Database Backup
                      </h3>
                      <p className="text-xs text-[#64748b] mb-4"></p>

                      {/* Create button — SUPER_ADMIN only */}
                      <div className="flex items-center gap-3 mb-6">
                        {(() => {
                          const { role } = useAuth
                            ? { role: undefined }
                            : { role: undefined };
                          return null; // role check done via hasControl below
                        })()}
                        <button
                          onClick={handleBackup}
                          disabled={creatingBackup}
                          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap disabled:opacity-60"
                        >
                          {creatingBackup ? (
                            <>
                              <i className="ri-loader-4-line animate-spin" />
                              Creating…
                            </>
                          ) : (
                            <>
                              <i className="ri-database-2-line" />
                              Create Backup Now
                            </>
                          )}
                        </button>
                        <span className="text-xs text-[#64748b]">
                          {loadingBackups ? (
                            'Loading…'
                          ) : backups.length > 0 ? (
                            <>
                              Last backup:{' '}
                              <strong className="text-[#1e293b]">
                                {formatDate(backups[0].created_at)}
                              </strong>
                            </>
                          ) : (
                            'No backups yet'
                          )}
                        </span>
                      </div>

                      {/* Backup History table */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                            Backup History
                          </p>
                          <button
                            onClick={fetchBackups}
                            className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#1e293b] cursor-pointer"
                          >
                            <i className="ri-refresh-line" />
                            Refresh
                          </button>
                        </div>

                        {loadingBackups ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="h-11 bg-slate-100 rounded-lg animate-pulse"
                              />
                            ))}
                          </div>
                        ) : backups.length === 0 ? (
                          <div className="flex items-center gap-2 p-4 bg-slate-50 border border-dashed border-[#e2e8f0] rounded-lg">
                            <i className="ri-inbox-line text-slate-300 text-lg" />
                            <p className="text-xs text-[#94a3b8]">
                              No backups yet. Click "Create Backup Now" to
                              generate one.
                            </p>
                          </div>
                        ) : (
                          <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                            <table className="w-full text-sm border-collapse">
                              <thead>
                                <tr className="bg-slate-50 border-b border-[#e2e8f0]">
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                    Filename
                                  </th>
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                    Tables
                                  </th>
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                    Size
                                  </th>
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                    Created At
                                  </th>
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                                    By
                                  </th>
                                  <th className="px-4 py-2.5 text-xs font-semibold text-[#64748b] uppercase tracking-wide text-right">
                                    ACTIONS
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {backups.map((b, i) => (
                                  <tr
                                    key={b.id}
                                    className={`border-t border-[#f1f5f9] ${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                                  >
                                    <td
                                      className="px-4 py-3 font-mono text-xs text-[#475569] max-w-[200px] truncate"
                                      title={b.filename}
                                    >
                                      {b.filename}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#1e293b]">
                                      {b.tables_count ?? '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#1e293b] whitespace-nowrap">
                                      {b.size_bytes != null
                                        ? formatBytes(b.size_bytes)
                                        : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#64748b] whitespace-nowrap">
                                      {formatDate(b.created_at)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-[#64748b]">
                                      {b.created_by_name ?? 'System'}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <div className="flex items-center justify-end gap-2">
                                        {/* Download */}
                                        <button
                                          onClick={() =>
                                            handleDownloadBackup(b.filename)
                                          }
                                          title="Download Backup"
                                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#e2e8f0] text-[#4f46e5] hover:bg-indigo-50 hover:border-indigo-200 transition-all cursor-pointer"
                                        >
                                          <i className="ri-download-2-line text-sm" />
                                        </button>

                                        {/* Restore */}
                                        <button
                                          onClick={() => {
                                            setRestoreTarget(b);
                                            setShowRestoreConfirm(true);
                                          }}
                                          title="Restore Backup"
                                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-all cursor-pointer"
                                        >
                                          <i className="ri-arrow-go-back-line text-sm" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {showRestoreConfirm && restoreTarget && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                    <i className="ri-arrow-go-back-line text-amber-600 text-lg" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1e293b]">
                      Restore this backup?
                    </p>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Existing data won't be deleted — missing rows will be
                      re-inserted.
                    </p>
                  </div>
                </div>
                <div className="mt-3 mb-5 p-3 bg-slate-50 border border-[#e2e8f0] rounded-lg">
                  <p className="text-xs font-mono text-[#475569] truncate">
                    {restoreTarget.filename}
                  </p>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    {formatDate(restoreTarget.created_at)} ·{' '}
                    {formatBytes(restoreTarget.size_bytes)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRestoreConfirm(false);
                      setRestoreTarget(null);
                    }}
                    className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestore}
                    disabled={!!restoringId}
                    className="flex-1 h-9 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {restoringId ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" />
                        Restoring…
                      </>
                    ) : (
                      <>
                        <i className="ri-arrow-go-back-line" />
                        Yes, Restore
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <ShortcutBar
          onSave={activeTab === 'company' ? handleSave : undefined}
          onBack={() => navigate('/')}
          saving={saving}
        />
      </div>
    </AppLayout>
  );
}
