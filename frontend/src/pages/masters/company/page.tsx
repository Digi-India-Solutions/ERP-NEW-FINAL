import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { mockCompany } from '@/mocks/masters';
import { useToast } from '@/contexts/ToastContext';

const INDIAN_STATES = [
  { code: '01', name: 'Jammu & Kashmir' }, { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' }, { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' }, { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' }, { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' }, { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' }, { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' }, { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' }, { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' }, { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' }, { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' }, { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' }, { code: '24', name: 'Gujarat' },
  { code: '25', name: 'Daman & Diu' }, { code: '26', name: 'Dadra & Nagar Haveli' },
  { code: '27', name: 'Maharashtra' }, { code: '28', name: 'Andhra Pradesh' },
  { code: '29', name: 'Karnataka' }, { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' }, { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' }, { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar' }, { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh (New)' },
];

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export default function CompanyMasterPage() {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const formRef = useRef<HTMLDivElement>(null);
  useKeyboardNav(formRef as React.RefObject<HTMLElement>);

  const [form, setForm] = useState({ ...mockCompany });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setIsDirty(true);
    if (errors[field]) setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  };

  const onStateCodeChange = (code: string) => {
    const found = INDIAN_STATES.find((s) => s.code === code);
    setForm((p) => ({ ...p, stateCode: code, stateName: found?.name ?? '' }));
    setIsDirty(true);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Company name is required';
    if (!form.gstin.trim()) e.gstin = 'GSTIN is required';
    else if (!GSTIN_REGEX.test(form.gstin)) e.gstin = 'Invalid GSTIN format (e.g. 27AABCU9603R1ZX)';
    if (!form.pan.trim()) e.pan = 'PAN is required';
    if (!form.stateCode) e.stateCode = 'State is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) { showError('Please fix validation errors'); return; }
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setIsSaving(false);
    setIsDirty(false);
    success('Company details saved successfully');
  };

  const InputField = ({ label, field, placeholder, required = false, type = 'text', nav }: {
    label: string; field: keyof typeof form; placeholder?: string;
    required?: boolean; type?: string; nav: number;
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[field] as string}
        onChange={(e) => update(field, e.target.value)}
        placeholder={placeholder}
        data-nav-index={nav}
        className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors[field] ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
      />
      {errors[field] && <p className="text-xs text-red-500">{errors[field]}</p>}
    </div>
  );

  return (
    <AppLayout>
      <div ref={formRef} className="p-6 pb-16 space-y-5 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#e2e8f0] text-[#64748b] transition-colors cursor-pointer">
            <i className="ri-arrow-left-line text-base" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Company Master</h2>
            <p className="text-sm text-[#64748b] mt-0.5">Configure your company details, GST information and invoice settings</p>
          </div>
          {isDirty && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}
        </div>

        {/* Basic Info */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="w-5 h-5 flex items-center justify-center"><i className="ri-building-line text-[#4f46e5]" /></div>
            Basic Information
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <InputField label="Company Name" field="name" placeholder="InvenPro Solutions Pvt. Ltd." required nav={0} />
            <InputField label="Phone Number" field="phone" placeholder="+91 98765 43210" type="tel" nav={1} />
            <InputField label="Email Address" field="email" placeholder="accounts@company.com" type="email" nav={2} />
            <InputField label="Website" field="website" placeholder="www.company.com" nav={3} />
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Registered Address <span className="text-red-500">*</span></label>
              <textarea
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                rows={3}
                data-nav-index={4}
                placeholder="204, Tech Park, Baner Road, Pune, Maharashtra 411045"
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 resize-none"
              />
            </div>
          </div>
        </div>

        {/* GST & Tax */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="w-5 h-5 flex items-center justify-center"><i className="ri-government-line text-[#4f46e5]" /></div>
            GST &amp; Tax Information
          </h3>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                GSTIN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => update('gstin', e.target.value.toUpperCase())}
                placeholder="27AABCU9603R1ZX"
                maxLength={15}
                data-nav-index={5}
                className={`w-full h-10 px-3 rounded-lg border text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.gstin ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
              />
              {errors.gstin && <p className="text-xs text-red-500">{errors.gstin}</p>}
              {form.gstin && !errors.gstin && GSTIN_REGEX.test(form.gstin) && (
                <p className="text-xs text-green-600 flex items-center gap-1"><i className="ri-checkbox-circle-fill" /> Valid GSTIN</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                PAN <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.pan}
                onChange={(e) => update('pan', e.target.value.toUpperCase())}
                placeholder="AABCU9603R"
                maxLength={10}
                data-nav-index={6}
                className={`w-full h-10 px-3 rounded-lg border text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.pan ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
              />
              {errors.pan && <p className="text-xs text-red-500">{errors.pan}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                State <span className="text-red-500">*</span>
              </label>
              <select
                value={form.stateCode}
                onChange={(e) => onStateCodeChange(e.target.value)}
                data-nav-index={7}
                className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors cursor-pointer ${errors.stateCode ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
              >
                <option value="">Select State...</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s.code} value={s.code}>{s.code} — {s.name}</option>
                ))}
              </select>
              {errors.stateCode && <p className="text-xs text-red-500">{errors.stateCode}</p>}
            </div>
            <InputField label="State Code" field="stateCode" nav={8} />
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 space-y-5">
          <h3 className="text-sm font-semibold text-[#1e293b] flex items-center gap-2 pb-3 border-b border-[#e2e8f0]">
            <div className="w-5 h-5 flex items-center justify-center"><i className="ri-file-list-3-line text-[#4f46e5]" /></div>
            Invoice &amp; Financial Settings
          </h3>
          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Invoice Prefix</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.invoicePrefix}
                  onChange={(e) => update('invoicePrefix', e.target.value.toUpperCase())}
                  placeholder="INV"
                  maxLength={6}
                  data-nav-index={9}
                  className="w-24 h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
                />
                <span className="text-sm text-[#64748b]">→ e.g. <strong>{form.invoicePrefix || 'INV'}-2025-0001</strong></span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Purchase Prefix</label>
              <input
                type="text"
                value={form.purchasePrefix}
                onChange={(e) => update('purchasePrefix', e.target.value.toUpperCase())}
                placeholder="PO"
                maxLength={6}
                data-nav-index={10}
                className="w-24 h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm font-mono text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Financial Year Start</label>
              <input
                type="date"
                value={form.financialYearStart}
                onChange={(e) => update('financialYearStart', e.target.value)}
                data-nav-index={11}
                className="h-10 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pb-4">
          <button
            type="button"
            onClick={() => { setForm({ ...mockCompany }); setIsDirty(false); setErrors({}); }}
            className="h-9 px-5 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition-colors cursor-pointer whitespace-nowrap"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 h-9 px-5 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {isSaving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-save-line" /> Save Company</>}
          </button>
        </div>
      </div>

      <ShortcutBar
        onSave={handleSave}
        onBack={() => navigate(-1)}
        isDirty={isDirty}
        isSaving={isSaving}
        hidePrint
      />
    </AppLayout>
  );
}
