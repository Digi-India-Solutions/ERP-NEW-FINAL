// import { useState, useEffect } from 'react';
// import type { AppUser, AssignedWarehouse, ModuleKey, ModuleAction, RolePermissions } from '@/types/shared';
// import type { Role } from '@/types/shared';
// import PermissionMatrix from './PermissionOverrideMatrix';
// import type { AdditionalControls } from '@/types/shared';
// import { useWarehouseStore } from '@/stores/warehouseStore';

// const ADDITIONAL_CONTROLS: Array<{
//   key: keyof AdditionalControls;
//   label: string;
//   description: string;
//   icon: string;
// }> = [
//     { key: 'approveStockTransfer', label: 'Approve Stock Transfer', description: 'Can approve pending stock transfer requests', icon: 'ri-swap-box-line' },
//     { key: 'viewAllWarehouses', label: 'View All Warehouses', description: 'Access data from all warehouses regardless of assignment', icon: 'ri-store-3-line' },
//     { key: 'exportData', label: 'Export Data', description: 'Can export reports and data to Excel/PDF', icon: 'ri-download-2-line' },
//     { key: 'viewFinancialReports', label: 'Financial Reports', description: 'Access to P&L, balance sheet and financial summaries', icon: 'ri-bar-chart-2-line' },
//     { key: 'approveStockAdjustment', label: 'Approve Stock Adjustment', description: 'Can approve stock adjustment entries', icon: 'ri-equalizer-line' },
//     { key: 'editLockedRecords', label: 'Edit Locked Records', description: 'Can modify records that are locked after period close', icon: 'ri-lock-unlock-line' },
//     { key: 'convertChallan', label: 'Convert Challan', description: 'Can convert delivery challans to sales invoices', icon: 'ri-file-transfer-line' },
//     { key: 'manageUserPermissions', label: 'Manage Permissions', description: 'Can assign and modify user roles and permissions', icon: 'ri-shield-user-line' },
//   ];

// const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
//   OFFICE: { label: 'Office', cls: 'bg-sky-50 text-sky-700' },
//   FACTORY: { label: 'Factory', cls: 'bg-amber-50 text-amber-700' },
//   STORE: { label: 'Store', cls: 'bg-green-50 text-green-700' },
//   GODOWN: { label: 'Godown', cls: 'bg-violet-50 text-violet-700' },
//   BRANCH: { label: 'Branch', cls: 'bg-indigo-50 text-indigo-700' },
//   TRANSIT: { label: 'Transit', cls: 'bg-slate-100 text-slate-600' },
// };

// interface WarehouseOption {
//   id: string;
//   name: string;
//   type: string;
//   isActive: boolean;
// }

// interface UserFormData {
//   name: string;
//   email: string;
//   phone: string;
//   password: string;
//   roleId: string;
//   roleName: string;
//   isSuperAdmin: boolean;
//   assignedWarehouses: AssignedWarehouse[];
//   permissions: Partial<Record<ModuleKey, Partial<Record<ModuleAction, boolean>>>>;
//   additionalControlsOverrides: Partial<Record<string, boolean>>;
//   isActive: boolean;
// }

// interface Props {
//   open: boolean;
//   editing: AppUser | null;
//   roles: Role[];
//   warehouses: WarehouseOption[];
//   existingUsers: AppUser[];
//   onSave: (data: UserFormData) => void | Promise<void>;
//   onClose: () => void;
//   openAtSection?: 'basic' | 'role' | 'warehouses' | 'overrides';
// }

// const SECTIONS = [
//   { id: 'basic', label: 'Basic Info', icon: 'ri-user-line' },
//   { id: 'role', label: 'Role', icon: 'ri-shield-user-line' },
//   { id: 'warehouses', label: 'Warehouses', icon: 'ri-store-3-line' },
//   { id: 'overrides', label: 'Permissions', icon: 'ri-key-line' },
// ] as const;

// type SectionId = typeof SECTIONS[number]['id'];

// export default function UserModal({ open, editing, roles, warehouses, existingUsers, onSave, onClose, openAtSection }: Props) {
//   const [activeSection, setActiveSection] = useState<SectionId>('basic');
//   const [showOverrides, setShowOverrides] = useState(false);
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isSaving, setIsSaving] = useState(false);
//   const [showPassword, setShowPassword] = useState(false);
//   const { selectedWarehouseId, selectedWarehouseName, setSelectedWarehouse } = useWarehouseStore();

//   const [form, setForm] = useState<UserFormData>({
//     name: '', email: '', phone: '', password: '',
//     roleId: '', roleName: '', isSuperAdmin: false,
//     assignedWarehouses: [], permissions: {}, additionalControlsOverrides: {}, isActive: true,
//   });

//   useEffect(() => {
//     if (open) {
//       if (editing) {
//         setForm({
//           name: editing.name,
//           email: editing.email,
//           phone: editing.phone,
//           password: '',
//           roleId: editing.roleId,
//           roleName: editing.roleName,
//           isSuperAdmin: editing.isSuperAdmin,
//           assignedWarehouses: [...editing.assignedWarehouses],
//           permissions: { ...editing.permissionOverrides },
//           additionalControlsOverrides: { ...(editing.additionalControls ?? {}) },
//           isActive: editing.isActive,
//         });
//       } else {
//         setForm({
//           name: '', email: '', phone: '', password: '',
//           roleId: '', roleName: '', isSuperAdmin: false,
//           assignedWarehouses: [], permissions: {}, additionalControlsOverrides: {}, isActive: true,
//         });
//       }
//       setErrors({});
//       setActiveSection(openAtSection ?? 'basic');
//       setShowOverrides(openAtSection === 'overrides');
//     }
//   }, [open, editing, openAtSection]);

//   const selectedRole = roles.find((r) => (
//     r.id === form.roleId
//     || r.name === form.roleId
//     || r.name === form.roleName
//     || r.name.toUpperCase().replace(/\s+/g, '_') === form.roleId.toUpperCase().replace(/\s+/g, '_')
//   )) ?? null;
//   const duplicateEmailExists = form.email.trim().length > 0 && existingUsers.some(
//     (u) => u.email.trim().toLowerCase() === form.email.trim().toLowerCase() && u.id !== editing?.id,
//   );

//   // When role has viewAllWarehouses, auto-assign all warehouses
//   useEffect(() => {
//     if (open) {
//       if (editing) {
//         // Find matched role to get its defaults
//         const editingRole = roles.find((r) =>
//           r.id === editing.roleId || r.name === editing.roleName
//         );
//         const roleDefaults = editingRole?.additionalControls ?? {};
//         const userControls = editing.additionalControls ?? {};

//         // Compute overrides = where user value differs from role default
//         const computedOverrides: Record<string, boolean> = {};
//         for (const [key, val] of Object.entries(userControls)) {
//           const roleVal = Boolean(roleDefaults[key as keyof typeof roleDefaults]);
//           if (Boolean(val) !== roleVal) {
//             computedOverrides[key] = Boolean(val);
//           }
//         }

//         setForm({
//           name: editing.name,
//           email: editing.email,
//           phone: editing.phone,
//           password: '',
//           roleId: editing.roleId,
//           roleName: editing.roleName,
//           isSuperAdmin: editing.isSuperAdmin,
//           assignedWarehouses: [...editing.assignedWarehouses],
//           permissions: { ...editing.permissionOverrides },
//           additionalControlsOverrides: computedOverrides, // ← computed diff
//           isActive: editing.isActive,
//         });
//       } else {
//         setForm({
//           name: '', email: '', phone: '', password: '',
//           roleId: '', roleName: '', isSuperAdmin: false,
//           assignedWarehouses: [], permissions: {},
//           additionalControlsOverrides: {}, isActive: true,
//         });
//       }
//       setErrors({});
//       setActiveSection(openAtSection ?? 'basic');
//       setShowOverrides(openAtSection === 'overrides');
//     }
//   }, [open, editing, openAtSection, roles]); // ← add roles to deps

//   const validate = (): Record<string, string> => {
//     const e: Record<string, string> = {};
//     if (!form.name.trim()) e.name = 'Name is required';
//     if (!form.email.trim()) e.email = 'Email is required';
//     else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email format';
//     else if (existingUsers.some((u) => u.email.trim().toLowerCase() === form.email.trim().toLowerCase() && u.id !== editing?.id)) {
//       e.email = 'User with this email already exists';
//     }
//     if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim())) e.phone = 'Phone number must be exactly 10 digits';
//     if (!editing && !form.password) e.password = 'Password is required';
//     if (!editing && form.password && form.password.length < 6) e.password = 'Minimum 6 characters';
//     if (!form.isSuperAdmin && !form.roleId) e.roleId = 'Please select a role';
//     setErrors(e);
//     return e;
//   };

//   const handleSave = async () => {
//     const validationErrors = validate();
//     if (Object.keys(validationErrors).length > 0) {
//       // Jump to first section with error
//       if (validationErrors.name || validationErrors.email || validationErrors.password || validationErrors.phone) {
//         setActiveSection('basic');
//       } else if (validationErrors.roleId) {
//         setActiveSection('role');
//       }
//       return;
//     }
//     setIsSaving(true);
//     await new Promise((r) => setTimeout(r, 600));
//     try {
//       await onSave(form);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   const toggleWarehouse = (wh: WarehouseOption) => {
//     const exists = form.assignedWarehouses.find((w) => w.warehouseId === wh.id);
//     if (exists) {
//       const remaining = form.assignedWarehouses.filter((w) => w.warehouseId !== wh.id);
//       // If removed was primary, make first remaining primary
//       if (exists.isPrimary && remaining.length > 0) {
//         remaining[0] = { ...remaining[0], isPrimary: true };
//       }
//       setForm((p) => ({ ...p, assignedWarehouses: remaining }));
//     } else {
//       const newWh: AssignedWarehouse = {
//         warehouseId: wh.id,
//         warehouseName: wh.name,
//         warehouseType: wh.type as AssignedWarehouse['warehouseType'],
//         isPrimary: form.assignedWarehouses.length === 0,
//       };
//       setForm((p) => ({ ...p, assignedWarehouses: [...p.assignedWarehouses, newWh] }));
//     }
//   };

//   const setPrimary = (warehouseId: string) => {
//     setForm((p) => ({
//       ...p,
//       assignedWarehouses: p.assignedWarehouses.map((w) => ({
//         ...w,
//         isPrimary: w.warehouseId === warehouseId,
//       })),
//     }));
//   };

//   const viewAllWarehouses = !form.isSuperAdmin && (selectedRole?.additionalControls.viewAllWarehouses ?? false);

//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
//       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
//       <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

//         {/* Header */}
//         <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
//           <div>
//             <h3 className="text-base font-semibold text-[#1e293b]">
//               {editing ? 'Edit User' : 'Add New User'}
//             </h3>
//             <p className="text-xs text-[#64748b] mt-0.5">
//               {editing ? 'Update user details, role and permissions' : 'Create a new team member account'}
//             </p>
//           </div>
//           <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer">
//             <i className="ri-close-line" />
//           </button>
//         </div>

//         {/* Section tabs */}
//         <div className="flex border-b border-[#e2e8f0] px-6 shrink-0">
//           {SECTIONS.map((s) => (
//             <button
//               key={s.id}
//               type="button"
//               onClick={() => setActiveSection(s.id)}
//               className={`flex items-center gap-1.5 h-10 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${activeSection === s.id
//                 ? 'border-[#4f46e5] text-[#4f46e5]'
//                 : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
//                 }`}
//             >
//               <i className={`${s.icon} text-sm`} />
//               {s.label}
//             </button>
//           ))}
//         </div>

//         {/* Content */}
//         <div className="flex-1 overflow-y-auto p-6">

//           {/* Section 1 — Basic Info */}
//           {activeSection === 'basic' && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="space-y-1.5">
//                   <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
//                     Full Name <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text" value={form.name}
//                     onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
//                     placeholder="Priya Sharma"
//                     className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.name ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
//                   />
//                   {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
//                 </div>
//                 <div className="space-y-1.5">
//                   <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Phone</label>
//                   <input
//                     type="tel" value={form.phone}
//                     inputMode="numeric"
//                     maxLength={10}
//                     onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
//                     placeholder="10-digit number"
//                     className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.phone ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
//                   />
//                   {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
//                 </div>
//               </div>
//               <div className="space-y-1.5">
//                 <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
//                   Email Address <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="email" value={form.email}
//                   onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
//                   placeholder="priya@invenpro.com"
//                   className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${(errors.email || duplicateEmailExists) ? 'border-red-400 focus:ring-red-200' : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'}`}
//                 />
//                 {(errors.email || duplicateEmailExists) && <p className="text-xs text-red-500">{errors.email || 'User with this email already exists'}</p>}
//               </div>
//               {!editing && (() => {

//                 return (
//                   <div className="space-y-1.5">
//                     <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
//                       Password <span className="text-red-500">*</span>
//                     </label>
//                     <div className="relative">
//                       <input
//                         type={showPassword ? "text" : "password"}
//                         value={form.password}
//                         onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
//                         placeholder="Min 6 characters"
//                         className={`w-full h-10 px-3 pr-10 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${errors.password
//                           ? "border-red-400 focus:ring-red-200"
//                           : "border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20"
//                           }`}
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setShowPassword((v) => !v)}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#4f46e5] transition-colors"
//                         tabIndex={-1}
//                         aria-label={showPassword ? "Hide password" : "Show password"}
//                       >
//                         {showPassword ? (
//                           // Eye-off icon
//                           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
//                             <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
//                             <line x1="1" y1="1" x2="23" y2="23" />
//                           </svg>
//                         ) : (
//                           // Eye icon
//                           <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
//                             <circle cx="12" cy="12" r="3" />
//                           </svg>
//                         )}
//                       </button>
//                     </div>
//                     {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
//                   </div>
//                 );
//               })()}
//               <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-all ${form.isActive ? 'border-emerald-200 bg-emerald-50/60' : 'border-[#e2e8f0] bg-white'}`}>
//                 <div className="min-w-0">
//                   <p className="text-sm font-semibold text-[#1e293b]">User status</p>
//                   <p className="text-xs text-[#64748b] mt-0.5">Inactive users cannot sign in until re-enabled.</p>
//                 </div>
//                 <div className="flex items-center gap-3 shrink-0">
//                   <span className={`inline-flex items-center h-6 px-2 rounded-full text-[10px] font-bold uppercase tracking-wide ${form.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
//                     {form.isActive ? 'Active' : 'Inactive'}
//                   </span>
//                   <button
//                     type="button"
//                     aria-pressed={form.isActive}
//                     aria-label={form.isActive ? 'Mark user inactive' : 'Mark user active'}
//                     onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
//                     className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:ring-offset-2 cursor-pointer ${form.isActive ? 'border-[#4f46e5] bg-[#4f46e5]' : 'border-[#cbd5e1] bg-[#cbd5e1]'}`}
//                   >
//                     <span
//                       className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`}
//                     />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Section 2 — Role Assignment */}
//           {activeSection === 'role' && (
//             <div className="space-y-4">
//               {/* Super Admin toggle */}
//               <div className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${form.isSuperAdmin ? 'border-[#4f46e5] bg-indigo-50' : 'border-[#e2e8f0] hover:border-[#4f46e5]/40'}`}
//                 onClick={() => setForm((p) => ({ ...p, isSuperAdmin: !p.isSuperAdmin, roleId: p.isSuperAdmin ? p.roleId : '', roleName: p.isSuperAdmin ? p.roleName : '' }))}>
//                 <div className="flex items-center gap-3">
//                   <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${form.isSuperAdmin ? 'bg-[#4f46e5]' : 'bg-[#f1f5f9]'}`}>
//                     <i className={`ri-shield-star-line text-base ${form.isSuperAdmin ? 'text-white' : 'text-[#64748b]'}`} />
//                   </div>
//                   <div>
//                     <p className={`text-sm font-semibold ${form.isSuperAdmin ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>Super Admin</p>
//                     <p className="text-xs text-[#64748b]">Full system access, all warehouses, all permissions</p>
//                   </div>
//                 </div>
//                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${form.isSuperAdmin ? 'border-[#4f46e5] bg-[#4f46e5]' : 'border-[#e2e8f0]'}`}>
//                   {form.isSuperAdmin && <i className="ri-check-line text-white text-xs" />}
//                 </div>
//               </div>

//               {!form.isSuperAdmin && (
//                 <>
//                   <div className="flex items-center gap-2">
//                     <div className="flex-1 h-px bg-[#e2e8f0]" />
//                     <span className="text-xs text-[#94a3b8] font-medium">or assign a custom role</span>
//                     <div className="flex-1 h-px bg-[#e2e8f0]" />
//                   </div>

//                   {errors.roleId && <p className="text-xs text-red-500">{errors.roleId}</p>}

//                   <div className="space-y-2">
//                     {roles
//                       .filter((r) => r.isActive && r.name.trim().toUpperCase().replace(/\s+/g, '_') !== 'SUPER_ADMIN')
//                       .map((role) => (
//                         <button
//                           key={role.id}
//                           type="button"
//                           onClick={() => setForm((p) => ({ ...p, roleId: role.id, roleName: role.name }))}
//                           className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${form.roleId === role.id
//                             ? 'border-[#4f46e5] bg-indigo-50'
//                             : 'border-[#e2e8f0] hover:border-[#4f46e5]/40'
//                             }`}
//                         >
//                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${form.roleId === role.id ? 'bg-[#4f46e5]' : 'bg-[#f1f5f9]'}`}>
//                             <i className={`ri-shield-user-line text-sm ${form.roleId === role.id ? 'text-white' : 'text-[#64748b]'}`} />
//                           </div>
//                           <div className="flex-1 min-w-0">
//                             <p className={`text-sm font-semibold ${form.roleId === role.id ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>{role.name}</p>
//                             <p className="text-xs text-[#64748b] mt-0.5 line-clamp-1">{role.description}</p>
//                             {/* Permission summary */}
//                             <div className="flex flex-wrap gap-1 mt-1.5">
//                               {Object.entries(role.permissions)
//                                 .filter(([, perms]) => Object.values(perms).some(Boolean))
//                                 .slice(0, 4)
//                                 .map(([mod]) => (
//                                   <span key={mod} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
//                                     {mod.replace(/_/g, ' ')}
//                                   </span>
//                                 ))}
//                               {Object.entries(role.permissions).filter(([, p]) => Object.values(p).some(Boolean)).length > 4 && (
//                                 <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
//                                   +{Object.entries(role.permissions).filter(([, p]) => Object.values(p).some(Boolean)).length - 4} more
//                                 </span>
//                               )}
//                             </div>
//                           </div>
//                           <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${form.roleId === role.id ? 'border-[#4f46e5] bg-[#4f46e5]' : 'border-[#e2e8f0]'}`}>
//                             {form.roleId === role.id && <i className="ri-check-line text-white text-xs" />}
//                           </div>
//                         </button>
//                       ))}
//                   </div>
//                 </>
//               )}
//             </div>
//           )}

//           {/* Section 3 — Warehouse Assignment */}
//           {activeSection === 'warehouses' && (
//             <div className="space-y-3">
//               {form.isSuperAdmin ? (
//                 <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
//                   <i className="ri-shield-star-line text-[#4f46e5]" />
//                   <span className="text-sm text-[#4f46e5] font-medium">Super Admin has access to all warehouses automatically</span>
//                 </div>
//               ) : viewAllWarehouses ? (
//                 <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
//                   <i className="ri-information-line text-amber-600" />
//                   <span className="text-sm text-amber-700">
//                     Role <strong>{selectedRole?.name}</strong> has &quot;View All Warehouses&quot; — all warehouses auto-assigned
//                   </span>
//                 </div>
//               ) : null}

//               {/* <div className="space-y-2">
//                 {warehouses.filter((w) => w.isActive).map((wh) => {
//                   const assigned = form.assignedWarehouses.find((a) => a.warehouseId === wh.id);
//                   const isChecked = !!assigned;
//                   const isPrimary = assigned?.isPrimary ?? false;
//                   const badge = TYPE_BADGE[wh.type] ?? { label: wh.type, cls: 'bg-slate-100 text-slate-600' };
//                   const disabled = form.isSuperAdmin || viewAllWarehouses;

//                   return (
//                     <div
//                       key={wh.id}
//                       className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isChecked ? 'border-[#4f46e5]/30 bg-indigo-50/50' : 'border-[#e2e8f0]'
//                         } ${disabled ? 'opacity-60' : ''}`}
//                     >
//                       <input
//                         type="checkbox"
//                         checked={isChecked}
//                         disabled={disabled}
//                         onChange={() => !disabled && toggleWarehouse(wh)}
//                         className="w-4 h-4 rounded border-[#e2e8f0] accent-[#4f46e5] cursor-pointer"
//                       />
//                       <div className="flex-1 flex items-center gap-2">
//                         <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
//                         <span className="text-sm font-medium text-[#1e293b]">{wh.name}</span>
//                       </div>
//                       {isChecked && !disabled && (
//                         <button
//                           type="button"
//                           onClick={() => setPrimary(wh.id)}
//                           className={`flex items-center gap-1 h-6 px-2 rounded-full text-[10px] font-bold transition-all cursor-pointer ${isPrimary
//                             ? 'bg-green-100 text-green-700 border border-green-300'
//                             : 'bg-slate-100 text-slate-500 hover:bg-green-50 hover:text-green-600'
//                             }`}
//                         >
//                           <i className={`${isPrimary ? 'ri-star-fill' : 'ri-star-line'} text-xs`} />
//                           {isPrimary ? 'Primary' : 'Set Primary'}
//                         </button>
//                       )}
//                       {isChecked && disabled && isPrimary && (
//                         <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Primary</span>
//                       )}
//                     </div>
//                   );
//                 })}
//               </div> */}

//               <div className="space-y-2">
//                 {warehouses
//                   .filter((w) => w.isActive)
//                   .map((wh) => {
//                     const isSelected = selectedWarehouseId === wh.id;
//                     const badge = TYPE_BADGE[wh.type] ?? { label: wh.type, cls: 'bg-slate-100 text-slate-600' };
//                     const disabled = form.isSuperAdmin || viewAllWarehouses;

//                     return (
//                       <button
//                         key={wh.id}
//                         type="button"
//                         disabled={disabled}
//                         onClick={() => !disabled && toggleWarehouse(wh)}
//                         className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${isSelected
//                             ? 'border-[#4f46e5] bg-indigo-50/60'
//                             : 'border-[#e2e8f0] hover:border-[#4f46e5]/30 bg-white'
//                           } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
//                       >
//                         {/* Radio indicator */}
//                         <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-[#4f46e5]' : 'border-[#cbd5e1]'
//                           }`}>
//                           {isSelected && (
//                             <div className="w-2 h-2 rounded-full bg-[#4f46e5]" />
//                           )}
//                         </div>

//                         {/* Type badge */}
//                         <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${badge.cls}`}>
//                           {badge.label}
//                         </span>

//                         {/* Name */}
//                         <span className={`flex-1 text-sm font-medium truncate ${isSelected ? 'text-[#4f46e5]' : 'text-[#1e293b]'
//                           }`}>
//                           {wh.name}
//                         </span>

//                         {/* Primary pill — auto-shown since it's the only one */}
//                         {isSelected && (
//                           <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
//                             <i className="ri-star-fill mr-0.5" />Primary
//                           </span>
//                         )}
//                       </button>
//                     );
//                   })}
//               </div>

//               {form.assignedWarehouses.length > 0 && (
//                 <p className="text-xs text-[#64748b]">
//                   {form.assignedWarehouses.length} warehouse{form.assignedWarehouses.length !== 1 ? 's' : ''} assigned.
//                   Primary warehouse is the default on login.
//                 </p>
//               )}
//             </div>
//           )}

//           {/* Section 4 — Permission Overrides */}
//           {activeSection === 'overrides' && (
//             <div className="space-y-4">
//               {form.isSuperAdmin ? (
//                 <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
//                   <i className="ri-shield-star-line text-[#4f46e5]" />
//                   <span className="text-sm text-[#4f46e5] font-medium">Super Admin has all permissions — overrides not applicable</span>
//                 </div>
//               ) : !form.roleId ? (
//                 <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
//                   <i className="ri-information-line text-amber-600" />
//                   <span className="text-sm text-amber-700">Please assign a role first to configure permission overrides</span>
//                 </div>
//               ) : (
//                 <>
//                   {/* ── Module Permission Overrides ── */}
//                   <div className="flex items-center justify-between">
//                     <div>
//                       <p className="text-sm font-semibold text-[#1e293b]">Custom Permission Overrides</p>
//                       <p className="text-xs text-[#64748b] mt-0.5">
//                         Base role: <strong>{selectedRole?.name}</strong>. Override specific permissions below.
//                       </p>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => setShowOverrides((p) => !p)}
//                       className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
//                     >
//                       <i className={`${showOverrides ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}`} />
//                       {showOverrides ? 'Collapse' : 'Expand Matrix'}
//                     </button>
//                   </div>

//                   {showOverrides && (
//                     <PermissionMatrix
//                       permissions={form.permissions}
//                       onChange={(permissions) => setForm((p) => ({ ...p, permissions }))}
//                       onClear={() => setForm((p) => ({ ...p, permissions: {} }))}
//                     />
//                   )}

//                   {!showOverrides && Object.values(form.permissions).some(m => Object.values(m ?? {}).some(Boolean)) && (
//                     <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
//                       <i className="ri-key-line text-[#4f46e5]" />
//                       <span className="text-sm text-[#4f46e5]">
//                         Custom permissions configured
//                       </span>
//                     </div>
//                   )}

//                   {/* ── Additional Access Controls ── */}
//                   <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
//                     <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center gap-2">
//                       <i className="ri-settings-4-line text-[#4f46e5]" />
//                       <h3 className="text-sm font-semibold text-[#1e293b]">Additional Access Controls</h3>
//                       <span className="text-xs text-[#64748b] ml-1">— Override role defaults</span>
//                     </div>
//                     <div className="p-4 grid grid-cols-2 gap-3">
//                       {ADDITIONAL_CONTROLS.map((ctrl) => {
//                         const roleDefault = !!(selectedRole?.additionalControls?.[ctrl.key]);
//                         const override = form.additionalControlsOverrides?.[ctrl.key];
//                         const enabled = override !== undefined ? override : roleDefault;

//                         return (
//                           <button
//                             key={ctrl.key}
//                             type="button"
//                             onClick={() => {
//                               const newVal = !enabled;
//                               setForm((p) => {
//                                 const newOverrides = { ...p.additionalControlsOverrides };
//                                 if (newVal === roleDefault) {
//                                   delete newOverrides[ctrl.key];
//                                 } else {
//                                   newOverrides[ctrl.key] = newVal;
//                                 }
//                                 return { ...p, additionalControlsOverrides: newOverrides };
//                               });
//                             }}
//                             className={`flex items-center gap-3 p-4 rounded-xl border text-left cursor-pointer transition-all ${enabled
//                               ? 'border-[#4f46e5]/40 bg-indigo-50/60'
//                               : 'border-[#e2e8f0] bg-white hover:border-slate-300'
//                               }`}
//                           >
//                             <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${enabled ? 'bg-[#4f46e5] text-white' : 'bg-slate-100 text-[#64748b]'}`}>
//                               <i className={`${ctrl.icon} text-base`} />
//                             </div>
//                             <div className="flex-1 min-w-0">
//                               <p className={`text-sm font-medium ${enabled ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>{ctrl.label}</p>
//                               <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{ctrl.description}</p>
//                             </div>
//                             <div className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${enabled ? 'bg-[#4f46e5]' : 'bg-slate-200'}`}>
//                               <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${enabled ? 'left-4' : 'left-0.5'}`} />
//                             </div>
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>
//           )}
//           {/* ↑ closes activeSection === 'overrides' */}

//         </div>
//         {/* ↑ closes flex-1 overflow-y-auto content area */}

//         {/* Footer */}
//         <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] shrink-0">
//           <div className="flex items-center gap-2">
//             {SECTIONS.map((s) => (
//               <button
//                 key={s.id}
//                 type="button"
//                 onClick={() => setActiveSection(s.id)}
//                 className={`w-2 h-2 rounded-full transition-all cursor-pointer ${activeSection === s.id ? 'bg-[#4f46e5] w-4' : 'bg-[#e2e8f0] hover:bg-[#94a3b8]'}`}
//                 title={s.label}
//               />
//             ))}
//           </div>
//           <div className="flex items-center gap-2">
//             <button onClick={onClose} className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap">
//               Cancel
//             </button>
//             {activeSection !== 'overrides' && (
//               <button
//                 type="button"
//                 onClick={() => {
//                   const idx = SECTIONS.findIndex((s) => s.id === activeSection);
//                   if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id);
//                 }}
//                 className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#4f46e5] text-[#4f46e5] text-sm font-semibold hover:bg-indigo-50 cursor-pointer whitespace-nowrap"
//               >
//                 Next <i className="ri-arrow-right-line" />
//               </button>
//             )}
//             <button
//               onClick={() => void handleSave()}
//               disabled={isSaving}
//               className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
//             >
//               {isSaving ? <><i className="ri-loader-4-line animate-spin" /> Saving...</> : <><i className="ri-save-line" /> {editing ? 'Save Changes' : 'Create User'}</>}
//             </button>
//           </div>
//         </div>

//       </div>
//       {/* ↑ closes relative bg-white modal box */}
//     </div>
//     // ↑ closes fixed inset-0 wrapper
//   );
// }


import { useState, useEffect, useMemo } from 'react';
import type {
  AppUser,
  AssignedWarehouse,
  ModuleKey,
  ModuleAction,
  Role,
  AdditionalControls,
} from '@/types/shared';
import PermissionMatrix from './PermissionOverrideMatrix';

// ─── Constants ────────────────────────────────────────────────────────────────

const ADDITIONAL_CONTROLS: Array<{
  key: keyof AdditionalControls;
  label: string;
  description: string;
  icon: string;
}> = [
  { key: 'approveStockTransfer',   label: 'Approve Stock Transfer',   description: 'Can approve pending stock transfer requests',              icon: 'ri-swap-box-line'      },
  { key: 'viewAllWarehouses',      label: 'View All Warehouses',      description: 'Access data from all warehouses regardless of assignment', icon: 'ri-store-3-line'       },
  { key: 'exportData',             label: 'Export Data',              description: 'Can export reports and data to Excel/PDF',                 icon: 'ri-download-2-line'    },
  { key: 'viewFinancialReports',   label: 'Financial Reports',        description: 'Access to P&L, balance sheet and financial summaries',     icon: 'ri-bar-chart-2-line'   },
  { key: 'approveStockAdjustment', label: 'Approve Stock Adjustment', description: 'Can approve stock adjustment entries',                     icon: 'ri-equalizer-line'     },
  { key: 'editLockedRecords',      label: 'Edit Locked Records',      description: 'Can modify records locked after period close',             icon: 'ri-lock-unlock-line'   },
  { key: 'convertChallan',         label: 'Convert Challan',          description: 'Can convert delivery challans to sales invoices',          icon: 'ri-file-transfer-line' },
  { key: 'manageUserPermissions',  label: 'Manage Permissions',       description: 'Can assign and modify user roles and permissions',         icon: 'ri-shield-user-line'   },
];

const TYPE_BADGE: Record<string, { label: string; cls: string }> = {
  OFFICE:  { label: 'Office',  cls: 'bg-sky-50    text-sky-700'    },
  FACTORY: { label: 'Factory', cls: 'bg-amber-50  text-amber-700'  },
  STORE:   { label: 'Store',   cls: 'bg-green-50  text-green-700'  },
  GODOWN:  { label: 'Godown',  cls: 'bg-violet-50 text-violet-700' },
  BRANCH:  { label: 'Branch',  cls: 'bg-indigo-50 text-indigo-700' },
  TRANSIT: { label: 'Transit', cls: 'bg-slate-100 text-slate-600'  },
};

const SECTIONS = [
  { id: 'basic',      label: 'Basic Info',  icon: 'ri-user-line'        },
  { id: 'role',       label: 'Role',        icon: 'ri-shield-user-line' },
  { id: 'warehouses', label: 'Warehouse',   icon: 'ri-store-3-line'     },
  { id: 'overrides',  label: 'Permissions', icon: 'ri-key-line'         },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface WarehouseOption {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

interface UserFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  roleId: string;
  roleName: string;
  isSuperAdmin: boolean;
  // Single-select: array always has 0 or 1 entry; the entry is always isPrimary=true
  assignedWarehouses: AssignedWarehouse[];
  permissions: Partial<Record<ModuleKey, Partial<Record<ModuleAction, boolean>>>>;
  additionalControlsOverrides: Partial<Record<string, boolean>>;
  isActive: boolean;
}

interface Props {
  open: boolean;
  editing: AppUser | null;
  roles: Role[];
  warehouses: WarehouseOption[];
  existingUsers: AppUser[];
  onSave: (data: UserFormData) => void | Promise<void>;
  onClose: () => void;
  openAtSection?: SectionId;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const blankForm = (): UserFormData => ({
  name: '', email: '', phone: '', password: '',
  roleId: '', roleName: '', isSuperAdmin: false,
  assignedWarehouses: [], permissions: {},
  additionalControlsOverrides: {}, isActive: true,
});

// ─── Component ────────────────────────────────────────────────────────────────

export default function UserModal({
  open, editing, roles, warehouses, existingUsers, onSave, onClose, openAtSection,
}: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>('basic');
  const [showOverrides, setShowOverrides] = useState(false);
  const [errors,        setErrors]        = useState<Record<string, string>>({});
  const [isSaving,      setIsSaving]      = useState(false);
  const [showPassword,  setShowPassword]  = useState(false);
  const [form,          setForm]          = useState<UserFormData>(blankForm);

  // ── Reset on open ──────────────────────────────────────────────────────────
  // FIX: ONE effect only. The original had two effects both triggered by
  // [open, editing, openAtSection] — the second always ran last and silently
  // overwrote the computedOverrides logic, making it permanently dead code.
  useEffect(() => {
    if (!open) return;

    if (editing) {
      const editingRole   = roles.find((r) => r.id === editing.roleId || r.name === editing.roleName);
      const roleDefaults  = editingRole?.additionalControls ?? {};
      const userControls  = editing.additionalControls ?? {};

      // Store only overrides that differ from role default — nothing else needed
      const computedOverrides: Record<string, boolean> = {};
      for (const [key, val] of Object.entries(userControls)) {
        const roleVal = Boolean(roleDefaults[key as keyof typeof roleDefaults]);
        if (Boolean(val) !== roleVal) computedOverrides[key] = Boolean(val);
      }

      setForm({
        name:                        editing.name,
        email:                       editing.email,
        phone:                       editing.phone,
        password:                    '',
        roleId:                      editing.roleId,
        roleName:                    editing.roleName,
        isSuperAdmin:                editing.isSuperAdmin,
        // Keep at most the first entry — enforce single-select invariant
        assignedWarehouses:          editing.assignedWarehouses.slice(0, 1),
        permissions:                 { ...editing.permissionOverrides },
        additionalControlsOverrides: computedOverrides,
        isActive:                    editing.isActive,
      });
    } else {
      setForm(blankForm());
    }

    setErrors({});
    setActiveSection(openAtSection ?? 'basic');
    setShowOverrides(openAtSection === 'overrides');
  }, [open, editing, openAtSection, roles]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const selectedRole = useMemo(
    () =>
      roles.find(
        (r) =>
          r.id   === form.roleId ||
          r.name === form.roleId ||
          r.name === form.roleName ||
          r.name.toUpperCase().replace(/\s+/g, '_') ===
            form.roleId.toUpperCase().replace(/\s+/g, '_'),
      ) ?? null,
    [roles, form.roleId, form.roleName],
  );

  const duplicateEmail =
    form.email.trim().length > 0 &&
    existingUsers.some(
      (u) =>
        u.email.trim().toLowerCase() === form.email.trim().toLowerCase() &&
        u.id !== editing?.id,
    );

  // FIX: also check the user's own override for viewAllWarehouses, not just
  // the role default — if the user overrides it on, the banner must show.
  const viewAllWarehouses = useMemo(() => {
    if (form.isSuperAdmin) return true;
    const override = form.additionalControlsOverrides?.['viewAllWarehouses'];
    if (override !== undefined) return override;
    return selectedRole?.additionalControls?.viewAllWarehouses ?? false;
  }, [form.isSuperAdmin, form.additionalControlsOverrides, selectedRole]);

  // FIX: derive selected warehouse ID from form.assignedWarehouses, NOT from
  // the global Zustand store. The original compared against selectedWarehouseId
  // from useWarehouseStore, so clicking a warehouse in the form had zero visual
  // effect — the radio dot never filled because the store value never changed.
  const selectedWarehouseId = form.assignedWarehouses[0]?.warehouseId ?? '';

  const isLastSection = activeSection === SECTIONS[SECTIONS.length - 1].id;

  // ── Single-warehouse select ────────────────────────────────────────────────
  // FIX: replace toggleWarehouse (old multi-select logic) with selectWarehouse
  // that enforces exactly 0 or 1 entry in assignedWarehouses.
  // Clicking the already-selected warehouse deselects it.
  const selectWarehouse = (wh: WarehouseOption) => {
    const alreadySelected = selectedWarehouseId === wh.id;
    if (alreadySelected) {
      setForm((p) => ({ ...p, assignedWarehouses: [] }));
    } else {
      const entry: AssignedWarehouse = {
        warehouseId:   wh.id,
        warehouseName: wh.name,
        warehouseType: wh.type as AssignedWarehouse['warehouseType'],
        isPrimary:     true, // only warehouse → always primary
      };
      setForm((p) => ({ ...p, assignedWarehouses: [entry] }));
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.name.trim())
      e.name = 'Name is required';
    if (!form.email.trim())
      e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Invalid email format';
    else if (duplicateEmail)
      e.email = 'A user with this email already exists';
    if (form.phone.trim() && !/^\d{10}$/.test(form.phone.trim()))
      e.phone = 'Phone must be exactly 10 digits';
    if (!editing && !form.password)
      e.password = 'Password is required';
    if (!editing && form.password && form.password.length < 6)
      e.password = 'Minimum 6 characters';
    if (!form.isSuperAdmin && !form.roleId)
      e.roleId = 'Please select a role';
    setErrors(e);
    return e;
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      if (errs.name || errs.email || errs.password || errs.phone) setActiveSection('basic');
      else if (errs.roleId) setActiveSection('role');
      return;
    }
    setIsSaving(true);
    // FIX: removed pointless await new Promise(r => setTimeout(r, 600))
    try {
      await onSave(form);
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = () => {
    const idx = SECTIONS.findIndex((s) => s.id === activeSection);
    if (idx < SECTIONS.length - 1) setActiveSection(SECTIONS[idx + 1].id);
  };

  if (!open) return null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] shrink-0">
          <div>
            <h3 className="text-base font-semibold text-[#1e293b]">
              {editing ? 'Edit User' : 'Add New User'}
            </h3>
            <p className="text-xs text-[#64748b] mt-0.5">
              {editing
                ? 'Update user details, role and permissions'
                : 'Create a new team member account'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#f1f5f9] text-[#64748b] cursor-pointer transition-colors"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* ── Section tabs ── */}
        <div className="flex border-b border-[#e2e8f0] px-6 shrink-0">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-1.5 h-10 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                activeSection === s.id
                  ? 'border-[#4f46e5] text-[#4f46e5]'
                  : 'border-transparent text-[#64748b] hover:text-[#1e293b]'
              }`}
            >
              <i className={`${s.icon} text-sm`} />
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Basic Info ── */}
          {activeSection === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Priya Sharma"
                    className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                      errors.name
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit number"
                    className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                      errors.phone
                        ? 'border-red-400 focus:ring-red-200'
                        : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                    }`}
                  />
                  {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="priya@invenpro.com"
                  className={`w-full h-10 px-3 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                    errors.email || duplicateEmail
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                  }`}
                />
                {(errors.email || duplicateEmail) && (
                  <p className="text-xs text-red-500">
                    {errors.email || 'A user with this email already exists'}
                  </p>
                )}
              </div>

              {/* Password — add mode only */}
              {/* FIX: removed unnecessary IIFE !editing && (() => { return (...) })() */}
              {!editing && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wide">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      className={`w-full h-10 px-3 pr-10 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 transition-colors ${
                        errors.password
                          ? 'border-red-400 focus:ring-red-200'
                          : 'border-[#e2e8f0] focus:border-[#4f46e5] focus:ring-[#4f46e5]/20'
                      }`}
                    />
                    {/* FIX: replaced inline SVG with Remix icon — consistent with rest of UI */}
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#4f46e5] transition-colors"
                    >
                      <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-base`} />
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                </div>
              )}

              {/* Active toggle */}
              <div className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 transition-all ${
                form.isActive ? 'border-emerald-200 bg-emerald-50/60' : 'border-[#e2e8f0] bg-white'
              }`}>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1e293b]">User status</p>
                  <p className="text-xs text-[#64748b] mt-0.5">Inactive users cannot sign in until re-enabled.</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`inline-flex items-center h-6 px-2 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    form.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {form.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button
                    type="button"
                    aria-pressed={form.isActive}
                    aria-label={form.isActive ? 'Mark user inactive' : 'Mark user active'}
                    onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/25 focus:ring-offset-2 cursor-pointer ${
                      form.isActive ? 'border-[#4f46e5] bg-[#4f46e5]' : 'border-[#cbd5e1] bg-[#cbd5e1]'
                    }`}
                  >
                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
                      form.isActive ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Role ── */}
          {activeSection === 'role' && (
            <div className="space-y-4">
              <div
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    isSuperAdmin: !p.isSuperAdmin,
                    roleId:       p.isSuperAdmin ? p.roleId   : '',
                    roleName:     p.isSuperAdmin ? p.roleName : '',
                  }))
                }
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                  form.isSuperAdmin
                    ? 'border-[#4f46e5] bg-indigo-50'
                    : 'border-[#e2e8f0] hover:border-[#4f46e5]/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    form.isSuperAdmin ? 'bg-[#4f46e5]' : 'bg-[#f1f5f9]'
                  }`}>
                    <i className={`ri-shield-star-line text-base ${form.isSuperAdmin ? 'text-white' : 'text-[#64748b]'}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${form.isSuperAdmin ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>
                      Super Admin
                    </p>
                    <p className="text-xs text-[#64748b]">Full system access, all warehouses, all permissions</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  form.isSuperAdmin ? 'border-[#4f46e5] bg-[#4f46e5]' : 'border-[#e2e8f0]'
                }`}>
                  {form.isSuperAdmin && <i className="ri-check-line text-white text-xs" />}
                </div>
              </div>

              {!form.isSuperAdmin && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-[#e2e8f0]" />
                    <span className="text-xs text-[#94a3b8] font-medium">or assign a custom role</span>
                    <div className="flex-1 h-px bg-[#e2e8f0]" />
                  </div>

                  {errors.roleId && <p className="text-xs text-red-500">{errors.roleId}</p>}

                  <div className="space-y-2">
                    {roles
                      .filter((r) => r.isActive && r.name.trim().toUpperCase().replace(/\s+/g, '_') !== 'SUPER_ADMIN')
                      .map((role) => {
                        const activeModules = Object.entries(role.permissions).filter(
                          ([, p]) => Object.values(p).some(Boolean),
                        );
                        return (
                          <button
                            key={role.id}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, roleId: role.id, roleName: role.name }))}
                            className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                              form.roleId === role.id
                                ? 'border-[#4f46e5] bg-indigo-50'
                                : 'border-[#e2e8f0] hover:border-[#4f46e5]/40'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                              form.roleId === role.id ? 'bg-[#4f46e5]' : 'bg-[#f1f5f9]'
                            }`}>
                              <i className={`ri-shield-user-line text-sm ${form.roleId === role.id ? 'text-white' : 'text-[#64748b]'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold ${form.roleId === role.id ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>
                                {role.name}
                              </p>
                              <p className="text-xs text-[#64748b] mt-0.5 line-clamp-1">{role.description}</p>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {activeModules.slice(0, 4).map(([mod]) => (
                                  <span key={mod} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                    {mod.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {activeModules.length > 4 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                    +{activeModules.length - 4} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                              form.roleId === role.id ? 'border-[#4f46e5] bg-[#4f46e5]' : 'border-[#e2e8f0]'
                            }`}>
                              {form.roleId === role.id && <i className="ri-check-line text-white text-xs" />}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Warehouse (single-select) ── */}
          {activeSection === 'warehouses' && (
            <div className="space-y-3">
              {/* Info banners */}
              {form.isSuperAdmin ? (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <i className="ri-shield-star-line text-[#4f46e5]" />
                  <span className="text-sm text-[#4f46e5] font-medium">
                    Super Admin has access to all warehouses automatically
                  </span>
                </div>
              ) : viewAllWarehouses ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <i className="ri-information-line text-amber-600" />
                  <span className="text-sm text-amber-700">
                    Role <strong>{selectedRole?.name}</strong> has &quot;View All Warehouses&quot; —
                    data from all warehouses is accessible
                  </span>
                </div>
              ) : null}

              {/* Single-select instruction */}
              {!form.isSuperAdmin && !viewAllWarehouses && (
                <p className="text-xs text-[#64748b] flex items-center gap-1.5">
                  <i className="ri-information-line text-[#94a3b8]" />
                  Select one warehouse as this user&apos;s primary (default) location.
                  Click the selected one again to deselect.
                </p>
              )}

              {/* Warehouse list */}
              <div className="space-y-2">
                {warehouses.filter((w) => w.isActive).map((wh) => {
                  // FIX: isSelected now reads from form.assignedWarehouses[0],
                  // NOT from the global Zustand selectedWarehouseId. The original
                  // bug meant clicking a warehouse in this form never showed the
                  // radio as filled because the store was never updated here.
                  const isSelected = selectedWarehouseId === wh.id;
                  const badge      = TYPE_BADGE[wh.type] ?? { label: wh.type, cls: 'bg-slate-100 text-slate-600' };
                  const disabled   = form.isSuperAdmin || viewAllWarehouses;

                  return (
                    <button
                      key={wh.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && selectWarehouse(wh)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[#4f46e5] bg-indigo-50/60'
                          : 'border-[#e2e8f0] hover:border-[#4f46e5]/30 bg-white'
                      } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {/* Radio dot */}
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'border-[#4f46e5]' : 'border-[#cbd5e1]'
                      }`}>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-[#4f46e5]" />}
                      </div>

                      {/* Type badge */}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${badge.cls}`}>
                        {badge.label}
                      </span>

                      {/* Name */}
                      <span className={`flex-1 text-sm font-medium truncate ${
                        isSelected ? 'text-[#4f46e5]' : 'text-[#1e293b]'
                      }`}>
                        {wh.name}
                      </span>

                      {/* Primary pill — only one warehouse, always primary */}
                      {isSelected && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0 flex items-center gap-0.5">
                          <i className="ri-star-fill text-[9px]" />Primary
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Footer hint */}
              {selectedWarehouseId && !form.isSuperAdmin && !viewAllWarehouses && (
                <p className="text-xs text-[#64748b] flex items-center gap-1">
                  <i className="ri-checkbox-circle-line text-green-500" />
                  <strong>{form.assignedWarehouses[0]?.warehouseName}</strong> selected as primary warehouse.
                </p>
              )}
            </div>
          )}

          {/* ── Permission Overrides ── */}
          {activeSection === 'overrides' && (
            <div className="space-y-4">
              {form.isSuperAdmin ? (
                <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <i className="ri-shield-star-line text-[#4f46e5]" />
                  <span className="text-sm text-[#4f46e5] font-medium">
                    Super Admin has all permissions — overrides not applicable
                  </span>
                </div>
              ) : !form.roleId ? (
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <i className="ri-information-line text-amber-600" />
                  <span className="text-sm text-amber-700">
                    Please assign a role first to configure permission overrides
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#1e293b]">Custom Permission Overrides</p>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        Base role: <strong>{selectedRole?.name}</strong>. Override specific permissions below.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowOverrides((p) => !p)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap"
                    >
                      <i className={showOverrides ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} />
                      {showOverrides ? 'Collapse' : 'Expand Matrix'}
                    </button>
                  </div>

                  {showOverrides && (
                    <PermissionMatrix
                      permissions={form.permissions}
                      onChange={(permissions) => setForm((p) => ({ ...p, permissions }))}
                      onClear={() => setForm((p) => ({ ...p, permissions: {} }))}
                    />
                  )}

                  {!showOverrides &&
                    Object.values(form.permissions).some((m) => Object.values(m ?? {}).some(Boolean)) && (
                      <div className="flex items-center gap-2 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                        <i className="ri-key-line text-[#4f46e5]" />
                        <span className="text-sm text-[#4f46e5]">Custom permissions configured</span>
                      </div>
                    )}

                  {/* Additional access controls */}
                  <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
                    <div className="px-5 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center gap-2">
                      <i className="ri-settings-4-line text-[#4f46e5]" />
                      <h3 className="text-sm font-semibold text-[#1e293b]">Additional Access Controls</h3>
                      <span className="text-xs text-[#64748b] ml-1">— Override role defaults</span>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-3">
                      {ADDITIONAL_CONTROLS.map((ctrl) => {
                        const roleDefault  = !!(selectedRole?.additionalControls?.[ctrl.key]);
                        const override     = form.additionalControlsOverrides?.[ctrl.key];
                        const enabled      = override !== undefined ? override : roleDefault;
                        const isOverridden = override !== undefined && override !== roleDefault;

                        return (
                          <button
                            key={ctrl.key}
                            type="button"
                            onClick={() => {
                              const newVal = !enabled;
                              setForm((p) => {
                                const next = { ...p.additionalControlsOverrides };
                                if (newVal === roleDefault) delete next[ctrl.key];
                                else next[ctrl.key] = newVal;
                                return { ...p, additionalControlsOverrides: next };
                              });
                            }}
                            className={`relative flex items-center gap-3 p-4 rounded-xl border text-left cursor-pointer transition-all ${
                              enabled
                                ? 'border-[#4f46e5]/40 bg-indigo-50/60'
                                : 'border-[#e2e8f0] bg-white hover:border-slate-300'
                            }`}
                          >
                            {/* Amber dot when value overrides role default */}
                            {isOverridden && (
                              <span
                                className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400"
                                title="Overridden from role default"
                              />
                            )}
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                              enabled ? 'bg-[#4f46e5] text-white' : 'bg-slate-100 text-[#64748b]'
                            }`}>
                              <i className={`${ctrl.icon} text-base`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${enabled ? 'text-[#4f46e5]' : 'text-[#1e293b]'}`}>
                                {ctrl.label}
                              </p>
                              <p className="text-xs text-[#64748b] mt-0.5 leading-relaxed">{ctrl.description}</p>
                            </div>
                            <div className={`w-9 h-5 rounded-full relative transition-colors shrink-0 ${
                              enabled ? 'bg-[#4f46e5]' : 'bg-slate-200'
                            }`}>
                              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${
                                enabled ? 'left-4' : 'left-0.5'
                              }`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e2e8f0] shrink-0">
          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                title={s.label}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  activeSection === s.id
                    ? 'bg-[#4f46e5] w-4'
                    : 'w-2 bg-[#e2e8f0] hover:bg-[#94a3b8]'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] cursor-pointer whitespace-nowrap transition-colors"
            >
              Cancel
            </button>

            {/* FIX: hide Next on last section */}
            {!isLastSection && (
              <button
                type="button"
                onClick={goNext}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-[#4f46e5] text-[#4f46e5] text-sm font-semibold hover:bg-indigo-50 cursor-pointer whitespace-nowrap transition-colors"
              >
                Next <i className="ri-arrow-right-line" />
              </button>
            )}

            <button
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap transition-colors"
            >
              {isSaving
                ? <><i className="ri-loader-4-line animate-spin" /> Saving...</>
                : <><i className="ri-save-line" /> {editing ? 'Save Changes' : 'Create User'}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}