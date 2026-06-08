// import { useCallback, useEffect, useState } from 'react';
// import { NavLink, useLocation, useNavigate } from 'react-router-dom';
// import { getData, postData } from "../../services/FetchNodeServices.js";
// import SignOutConfirmModal from './SignOutCOnfirmModal';
// import { useAuth } from '@/contexts/AuthContext';
// import ConfirmDialog from './ConfirmDialog';
// import { MODULES } from "@/utils/permissions";

// type UserRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'COMPANY_ADMIN' | 'END_USER' | 'SECURITY_GUARD';

// const API_BASE = 'https://asvapi.digiindiasolutions.com/api/v1';

// interface NavItem { label: string; path: string; icon: string; }
// interface NavGroup { label: string; icon: string; basePath: string; items: NavItem[]; }

// const mastersGroup: NavGroup = {
//   label: 'Masters', icon: 'ri-database-2-line', basePath: '/masters',
//   items: [
//     { label: 'Warehouses',         path: '/masters/warehouses',  icon: 'ri-store-3-line'     },
//     { label: 'Parties',            path: '/masters/parties',     icon: 'ri-group-2-line'     },
//     { label: 'Items',              path: '/masters/items',       icon: 'ri-box-3-line'       },
//     { label: 'Categories & Units', path: '/masters/categories',  icon: 'ri-price-tag-3-line' },
//   ],
// };

// const salesGroup: NavGroup = {
//   label: 'Sales', icon: 'ri-shopping-cart-2-line', basePath: '/sales',
//   items: [
//     { label: 'Invoices',     path: '/sales/invoices', icon: 'ri-file-text-line'          },
//     { label: 'Payments',     path: '/sales/payments', icon: 'ri-money-rupee-circle-line' },
//     { label: 'Sale Returns', path: '/sales/returns',  icon: 'ri-arrow-go-back-line'      },
//     { label: 'Challans',     path: '/sales/challans', icon: 'ri-truck-line'              },
//   ],
// };

// const purchaseGroup: NavGroup = {
//   label: 'Purchase', icon: 'ri-store-2-line', basePath: '/purchase',
//   items: [
//     { label: 'Purchase Orders',  path: '/purchase/orders',   icon: 'ri-file-list-3-line'       },
//     { label: 'Invoices',         path: '/purchase/invoices', icon: 'ri-file-text-line'          },
//     { label: 'Payments',         path: '/purchase/payments', icon: 'ri-money-rupee-circle-line' },
//     { label: 'GRN History',      path: '/purchase/grn',      icon: 'ri-inbox-archive-line'      },
//     { label: 'Purchase Returns', path: '/purchase/returns',  icon: 'ri-arrow-go-forward-line'   },
//   ],
// };

// const inventoryGroup: NavGroup = {
//   label: 'Inventory', icon: 'ri-archive-stack-line', basePath: '/inventory',
//   items: [
//     { label: 'Stock View', path: '/inventory/stock', icon: 'ri-bar-chart-horizontal-line' },
//     { label: 'Stock Receiving', path: '/inventory/receiving', icon: 'ri-inbox-archive-line' },
//     { label: 'Stock Entries', path: '/inventory/stock-entries', icon: 'ri-add-box-line' },
//     { label: 'Transfers', path: '/inventory/transfer', icon: 'ri-swap-box-line' },
//     { label: 'Adjustments', path: '/inventory/adjustment', icon: 'ri-equalizer-line' },
//     { label: 'Outward Gate Pass', path: '/inventory/gate-pass/outward', icon: 'ri-logout-box-r-line' },
//     { label: 'Inward Gate Pass', path: '/inventory/gate-pass/inward', icon: 'ri-login-box-line' },
//   ],
// };

// const printGroup: NavGroup = {
//   label: 'Print', icon: 'ri-printer-line', basePath: '/print',
//   items: [{ label: 'Barcode Print', path: '/print/barcode-management', icon: 'ri-barcode-line' }],
// };

// const reportsGroup: NavGroup = {
//   label: 'Reports', icon: 'ri-bar-chart-2-line', basePath: '/reports',
//   items: [
//     { label: 'Stock Summary',      path: '/reports/stock-summary',     icon: 'ri-stack-line'              },
//     { label: 'Stock Ledger',       path: '/reports/stock-ledger',      icon: 'ri-file-list-3-line'        },
//     { label: 'Low Stock Alert',    path: '/reports/low-stock',         icon: 'ri-alert-line'              },
//     { label: 'Purchase Register',  path: '/reports/purchase-register', icon: 'ri-store-2-line'            },
//     { label: 'GST Purchase',       path: '/reports/gst-purchase',      icon: 'ri-receipt-line'            },
//     { label: 'Sales Register',     path: '/reports/sales-register',    icon: 'ri-bar-chart-box-line'      },
//     { label: 'GST Sales (GSTR-1)', path: '/reports/gst-sales',         icon: 'ri-file-shield-2-line'      },
//     { label: 'Outstanding',        path: '/reports/outstanding',       icon: 'ri-money-rupee-circle-line' },
//     { label: 'Day Book',           path: '/reports/day-book',          icon: 'ri-calendar-check-line'     },
//     { label: 'Party Ledger',       path: '/reports/party-ledger',      icon: 'ri-group-line'              },
//   ],
// };

// const guardNavItems: NavItem[] = [
//   { label: 'Dashboard',      path: '/guard/dashboard', icon: 'ri-shield-user-line'  },
//   { label: 'Outward Passes', path: '/guard/outward',   icon: 'ri-logout-box-r-line' },
//   { label: 'Inward Passes',  path: '/guard/inward',    icon: 'ri-login-box-line'    },
// ];

// interface SidebarProps { collapsed: boolean; onToggle: () => void; }

// export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
//   const { user, hasPermission, hasControl,logout } = useAuth();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const users = JSON.parse(localStorage.getItem('auth_user') || '{}');
//   const [mastersOpen, setMastersOpen] = useState(location.pathname.startsWith('/masters'));
//   const [salesOpen, setSalesOpen] = useState(location.pathname.startsWith('/sales'));
//   const [purchaseOpen, setPurchaseOpen] = useState(location.pathname.startsWith('/purchase'));
//   const [inventoryOpen, setInventoryOpen] = useState(location.pathname.startsWith('/inventory'));
//   const [printOpen,     setPrintOpen]     = useState(location.pathname.startsWith('/print'));
//   const [reportsOpen,   setReportsOpen]   = useState(location.pathname.startsWith('/reports'));
//   const [logoutConfirm, setLogoutConfirm] = useState(false);
//   const [company , setCompany] = useState('')
//   // const logout = () => {
//   //   console.log('Logged out');
//   // };
  
//    const handleLogout = async () => {
//     setLogoutConfirm(false);
    
//     try {
//       // 1. Call the logout API
//       // Note: Use your exact API path without the domain prefix (service handles base)
//       await postData('api/v1/auth/logout', {}); 
//     } catch (err) {
//       console.error("Logout API error:", err);
//     } finally {
//       // 2. Clear storage
//       localStorage.removeItem("token");
//       localStorage.removeItem("auth_user");
      
//       // 3. Navigate using React Router (Prevents full page refresh)
//       navigate("/login", { replace: true });
      
//       // Optional: If your AuthContext has a local state to clear (like user=null),
//       // call it here, but DO NOT navigate inside that function if it causes a refresh.
//     }
//   };

//   const role = user?.role;
//   const isGuard = role === 'SECURITY_GUARD';

//   // ── Permission-based filtered items (exact path match to avoid substring bugs) ──

//   const visibleMastersItems = mastersGroup.items.filter((item) => {
//     if (item.path === '/masters/warehouses') return (hasPermission(MODULES.WAREHOUSES, 'view'));
//     if (item.path === '/masters/parties')    return hasPermission(MODULES.PARTIES, 'view');
//     if (item.path === '/masters/items')      return hasPermission(MODULES.ITEMS, 'view');
//     if (item.path === '/masters/categories') return hasPermission(MODULES.CATEGORIES, 'view');
//     return false;
//   });

//   const visibleSalesItems = salesGroup.items.filter((item) => {
//     if (item.path === '/sales/invoices') return hasPermission(MODULES.SALES_INVOICE, 'view');
//     if (item.path === '/sales/payments') return hasPermission(MODULES.SALES_PAYMENT, 'view');
//     if (item.path === '/sales/returns')  return hasPermission(MODULES.SALE_RETURN, 'view');
//     if (item.path === '/sales/challans') return hasPermission(MODULES.CHALLAN, 'view');
//     return false;
//   });

//   const visiblePurchaseItems = purchaseGroup.items.filter((item) => {
//     if (item.path === '/purchase/orders')   return hasPermission(MODULES.PURCHASE_ORDER, 'view');
//     if (item.path === '/purchase/invoices') return hasPermission(MODULES.PURCHASE_INVOICE, 'view');
//     if (item.path === '/purchase/payments') return hasPermission(MODULES.PURCHASE_PAYMENT, 'view');
//     if (item.path === '/purchase/grn')      return hasPermission(MODULES.GRN_HISTORY, 'view');
//     if (item.path === '/purchase/returns')  return hasPermission(MODULES.PURCHASE_RETURN, 'view');
//     return false;
//   });

//   const visibleInventoryItems = inventoryGroup.items.filter((item) => {
//     if (item.path === '/inventory/stock')             return (hasPermission(MODULES.STOCK_ADJUSTMENT, 'view')||  hasControl('approveStockAdjustment'));
//     if (item.path === '/inventory/receiving')         return hasPermission(MODULES.STOCK_RECEIVING, 'create');
//     if (item.path === '/inventory/stock-entries')     return hasPermission(MODULES.STOCK_ENTRIES, 'view');
//     if (item.path === '/inventory/transfer')          return hasPermission(MODULES.STOCK_TRANSFER, 'view');
//     if (item.path === '/inventory/adjustment')        return (hasPermission(MODULES.STOCK_ADJUSTMENT, 'view') ||  hasControl('approveStockAdjustment'));
//     if (item.path === '/inventory/gate-pass/outward') return hasPermission(MODULES.GATE_PASS_OUTWARD, 'view');
//     if (item.path === '/inventory/gate-pass/inward')  return hasPermission(MODULES.GATE_PASS_INWARD, 'view');
//     return false;
//   });

//   const visibleReportsItems = reportsGroup.items.filter((item) => {
//     if (item.path === '/reports/stock-summary')      return (hasPermission(MODULES.REPORT_STOCK_SUMMARY, 'view') || hasControl('viewFinancialReports'));
//     if (item.path === '/reports/stock-ledger')       return (hasPermission(MODULES.REPORT_STOCK_LEDGER, 'view')|| hasControl('viewFinancialReports'));
//     if (item.path === '/reports/low-stock')          return (hasPermission(MODULES.REPORT_LOW_STOCK, 'view')|| hasControl('viewFinancialReports'));
//     if (item.path === '/reports/purchase-register')  return (hasPermission(MODULES.REPORT_PURCHASE_REG, 'view')|| hasControl('viewFinancialReports'));
//     if (item.path === '/reports/gst-purchase')       return (hasPermission(MODULES.REPORT_GST_PURCHASE, 'view')|| hasControl('viewFinancialReports'));
//     if (item.path === '/reports/sales-register')     return (hasPermission(MODULES.REPORT_SALES_REG, 'view')|| hasControl('viewFinancialReports'));
//     if (item.path === '/reports/gst-sales')          return (hasPermission(MODULES.REPORT_GST_SALES, 'view')|| hasControl('viewFinancialReports'));
//     if (item.path === '/reports/outstanding')        return (hasPermission(MODULES.REPORT_OUTSTANDING, 'view')|| hasControl('viewFinancialReports'));
//     if (item.path === '/reports/day-book')           return (hasPermission(MODULES.REPORT_DAY_BOOK, 'view')|| hasControl('viewFinancialReports'));
//     if (item.path === '/reports/party-ledger')       return (hasPermission(MODULES.REPORT_PARTY_LEDGER, 'view')|| hasControl('viewFinancialReports'));
//     return false;
//   });

//   const visiblePrintItems = printGroup.items.filter((item) => {
//     if (item.path === '/print/barcode-management') return hasPermission(MODULES.BARCODE_PRINT, 'view');
//     return false;
//   });

//   // ── Derive canSee* from filtered arrays — single source of truth ──────────
//   const canSeeMasters   = visibleMastersItems.length > 0;
//   const canSeeSales     = visibleSalesItems.length > 0;
//   const canSeePurchase  = visiblePurchaseItems.length > 0;
//   const canSeeInventory = visibleInventoryItems.length > 0;
//   const canSeePrint     = visiblePrintItems.length > 0;
//   const canSeeReports   = visibleReportsItems.length > 0 || hasControl('viewFinancialReports');
//   const canSeeUsers     = (hasPermission(MODULES.USERS, 'view') || hasControl("manageUserPermissions"));
//   const canSeeSettings  = (hasPermission(MODULES.SETTINGS, 'view') || hasControl("manageUserPermissions"));

//   // ── Final group objects with filtered items ───────────────────────────────
//   const visibleMastersGroup   = { ...mastersGroup,   items: visibleMastersItems   };
//   const visibleSalesGroup     = { ...salesGroup,     items: visibleSalesItems     };
//   const visiblePurchaseGroup  = { ...purchaseGroup,  items: visiblePurchaseItems  };
//   const visibleInventoryGroup = { ...inventoryGroup, items: visibleInventoryItems };
//   const visibleReportsGroup   = { ...reportsGroup,   items: visibleReportsItems   };
//   const visiblePrintGroup     = { ...printGroup,     items: visiblePrintItems     };

//   const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

//   const userInitials = (user?.name ?? 'AU').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

//   const roleLabel: Record<string, string> = {
//     SUPER_ADMIN: 'Super Admin', SUB_ADMIN: 'Manager',
//     COMPANY_ADMIN: 'Company Admin', END_USER: 'Staff', SECURITY_GUARD: 'Security Guard',
//   };

//   const NavBtn = ({ item }: { item: NavItem }) => (
//     <NavLink
//       to={item.path}
//       end={item.path === '/'}
//       className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
//         isActive(item.path) ? 'bg-[#4f46e5] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
//       }`}
//       title={collapsed ? item.label : undefined}
//     >
//       <div className="w-5 h-5 flex items-center justify-center shrink-0">
//         <i className={`${item.icon} text-lg leading-none`} />
//       </div>
//       {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
//     </NavLink>
//   );

//   const CollapseGroup = ({ group, open, setOpen }: { group: NavGroup; open: boolean; setOpen: (v: boolean) => void; }) => {
//     const isGroupActive = location.pathname.startsWith(group.basePath);
//     if (group.items.length === 0) return null;
//     return (
//       <div className="px-2 mt-1">
//         <button
//           onClick={() => { if (!collapsed) setOpen(!open); else navigate(group.items[0].path); }}
//           title={collapsed ? group.label : undefined}
//           className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${isGroupActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
//         >
//           <div className="w-5 h-5 flex items-center justify-center shrink-0">
//             <i className={`${group.icon} text-lg leading-none`} />
//           </div>
//           {!collapsed && (
//             <>
//               <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">{group.label}</span>
//               <i className={`text-slate-400 text-sm transition-transform duration-200 ${open ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}`} />
//             </>
//           )}
//         </button>
//         {!collapsed && open && (
//           <ul className="mt-1 ml-4 border-l border-white/10 pl-3 space-y-0.5">
//             {group.items.map((item) => (
//               <li key={item.path}>
//                 <NavLink
//                   to={item.path}
//                   className={({ isActive: a }) =>
//                     `flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-sm cursor-pointer ${a ? 'bg-[#4f46e5] text-white font-medium' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`
//                   }
//                 >
//                   <div className="w-4 h-4 flex items-center justify-center shrink-0">
//                     <i className={`${item.icon} text-sm leading-none`} />
//                   </div>
//                   <span className="whitespace-nowrap">{item.label}</span>
//                 </NavLink>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     );
//   };

//   const UserBottom = () => (
//     <div className="border-t border-white/10 p-3 shrink-0">
//       {collapsed ? (
//         <button onClick={() => setLogoutConfirm(true)} title="Logout"
//           className="w-8 h-8 flex items-center justify-center mx-auto rounded-full bg-[#4f46e5] text-xs font-bold text-white cursor-pointer hover:bg-indigo-600 transition-colors">
//           {userInitials}
//         </button>
//       ) : (
//         <div className="space-y-1">
//           <div className="flex items-center gap-3 px-2 py-2">
//             <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
//               {userInitials}
//             </div>
//             <div className="min-w-0 flex-1">
//               <p className="text-sm font-medium text-white whitespace-nowrap truncate">{user?.name ?? 'User'}</p>
//               <p className="text-[11px] text-slate-400 whitespace-nowrap">{isGuard ? 'Security Guard' : (roleLabel[role] ?? role)}</p>
//             </div>
//           </div>
//           <button onClick={() => setLogoutConfirm(true)}
//             className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
//             <i className="ri-logout-box-line text-sm" />
//             <span>Sign out</span>
//           </button>
//         </div>
//       )}
//     </div>
//   );

//   // ── Guard sidebar ────────────────────────────────────────────────────────
//   if (isGuard) {
//     return (
//       <>
//         <aside
//           className="flex flex-col h-screen bg-[#1e293b] text-white transition-all duration-300 ease-in-out shrink-0"
//           style={{ width: collapsed ? 64 : 240 }}
//         >
//           <div className="flex items-center h-[60px] px-4 border-b border-white/10 shrink-0">
//             <div className="w-8 h-8 flex items-center justify-center shrink-0">
//               <i className="ri-shield-user-fill text-[#4f46e5] text-xl" />
//             </div>
//             {!collapsed && <span className="ml-3 font-bold text-base tracking-tight whitespace-nowrap text-white">Guard Portal</span>}
//             <button onClick={onToggle} className="ml-auto w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0">
//               <i className={`${collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} text-base`} />
//             </button>
//           </div>
//           <nav className="flex-1 py-4 space-y-0.5 px-2">
//             {!collapsed && <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Gate Pass</p>}
//             {guardNavItems.map((item) => <NavBtn key={item.path} item={item} />)}
//           </nav>
//           <UserBottom />
//         </aside>
//         <SignOutConfirmModal open={logoutConfirm} onConfirm={handleLogout} onCancel={() => setLogoutConfirm(false)} />
//       </>
//     );
//   }

  
//     const token = localStorage.getItem('token');

//     const authHeader = useCallback(() => {
//     return {
//       'Content-Type': 'application/json',
//       Authorization: `Bearer ${token}`,
//     };
//   }, [token]);
  
//   const fetchCompany = useCallback(async () => {
//       try {
//         const res = await fetch(`${API_BASE}/company/get`, {
//           headers: authHeader(),
//         });
//         if (res.status === 404) {
//           setCompanyExists(false);
//           setCompany(EMPTY_COMPANY);
//           setLogoPreview(null);
//           return;
//         }
//         if (!res.ok) throw new Error();
//         const json = await res.json();
//         const d = json.data;
//         setCompany({
//           name: d.name ?? '',
//           address: d.address ?? '',
//           gstin: d.gstin ?? '',
//           pan: d.pan ?? '',
//           stateCode: d.state_code ?? '27',
//           phone: d.phone ?? '',
//           email: d.email ?? '',
//           website: d.website ?? '',
//           financialYearStart: d.financial_year_start
//             ? d.financial_year_start.slice(0, 10)
//             : '',
//           invoice_prefix: d.invoice_prefix ?? 'INV',
//           bank_name: d.bank_name ?? '',
//           bank_account: d.bank_account ?? '',
//           bank_ifsc: d.bank_ifsc ?? '',
//         });
//         setLogoPreview(d.logo_url ?? null);
//       } catch {
//         setCompanyExists(false);
//       }
//     }, [authHeader, toast]);

//      useEffect(() => {
//     fetchCompany();
//   }, [fetchCompany]);
  
//   // ── Standard sidebar ─────────────────────────────────────────────────────
//   return (
//     <>
//       <aside
//         className="flex flex-col h-screen bg-[#1e293b] text-white transition-all duration-300 ease-in-out shrink-0"
//         style={{ width: collapsed ? 64 : 240 }}
//       >
//         <div className="flex items-center h-[60px] px-4 border-b border-white/10 shrink-0">
//           <div className="w-8 h-8 flex items-center justify-center shrink-0">
//             <img src="https://public.readdy.ai/ai/img_res/562db67e-18cd-4892-ada1-aa9c5633c1ae.png" alt="InvenPro" className="w-8 h-8 object-contain" />
//           </div>
//           {!collapsed && <span className="ml-3 font-bold text-base tracking-tight whitespace-nowrap text-white">InvenPro</span>}
//           <button onClick={onToggle} className="ml-auto w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0">
//             <i className={`${collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} text-base`} />
//           </button>
//         </div>

//         <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
//           {!collapsed && <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">Main</p>}
//           <ul className="space-y-0.5 px-2">
//             <li>
//               <NavLink to="/" end
//                 className={({ isActive: a }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${a ? 'bg-[#4f46e5] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
//                 title={collapsed ? 'Dashboard' : undefined}
//               >
//                 <div className="w-5 h-5 flex items-center justify-center shrink-0">
//                   <i className="ri-dashboard-3-line text-lg leading-none" />
//                 </div>
//                 {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Dashboard</span>}
//               </NavLink>
//             </li>
//           </ul>

//           {canSeeMasters && (
//             <>
//               {!collapsed && (
//                 <p className="px-4 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
//                   Masters
//                 </p>
//               )}
//               <CollapseGroup group={visibleMastersGroup} open={mastersOpen} setOpen={setMastersOpen} />
//             </>
//           )}

//           {/* Transactions */}
//           {(canSeeSales || canSeePurchase || canSeeInventory) && !collapsed && (
//             <p className="px-4 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
//               Transactions
//             </p>
//           )}
//           {canSeeSales    && <CollapseGroup group={visibleSalesGroup}     open={salesOpen}     setOpen={setSalesOpen}     />}
//           {canSeePurchase && <CollapseGroup group={visiblePurchaseGroup}  open={purchaseOpen}  setOpen={setPurchaseOpen}  />}
//           {canSeeInventory && <CollapseGroup group={visibleInventoryGroup} open={inventoryOpen} setOpen={setInventoryOpen} />}

//           {/* Print */}
//           {canSeePrint && (
//             <>
//               {!collapsed && (
//                 <p className="px-4 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
//                   Print
//                 </p>
//               )}
//               <CollapseGroup group={visiblePrintGroup} open={printOpen} setOpen={setPrintOpen} />
//             </>
//           )}

//           {canSeeReports && (
//             <>
//               {!collapsed && (
//                 <p className="px-4 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
//                   Reports
//                 </p>
//               )}
//               <CollapseGroup group={visibleReportsGroup} open={reportsOpen} setOpen={setReportsOpen} />
//             </>
//           )}

//           {/* System */}
//           {(canSeeUsers || canSeeSettings) && (
//             <>
//               {!collapsed && (
//                 <p className="px-4 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
//                   System
//                 </p>
//               )}
//               <ul className="space-y-0.5 px-2 mt-1">
//                 {canSeeUsers && (
//                   <li>
//                     <NavBtn item={{ label: 'Users', path: '/users', icon: 'ri-team-line' }} />
//                   </li>
//                 )}
//                 {canSeeSettings && (
//                   <li>
//                     <NavBtn item={{ label: 'Settings', path: '/settings', icon: 'ri-settings-3-line' }} />
//                   </li>
//                 )}
//               </ul>
//             </>
//           )}
//         </nav>

//         {/* User info bottom */}
//         <div className="border-t border-white/10 p-3 shrink-0">
//           {collapsed ? (
//             <button
//               onClick={() => setLogoutConfirm(true)}
//               title="Logout"
//               className="w-8 h-8 flex items-center justify-center mx-auto rounded-full bg-[#4f46e5] text-xs font-bold text-white cursor-pointer hover:bg-indigo-600 transition-colors"
//             >
//               {userInitials}
//             </button>
//           ) : (
//             <div className="space-y-1">
//               <div className="flex items-center gap-3 px-2 py-2">
//                 <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
//                   {userInitials}
//                 </div>
//                 <div className="min-w-0 flex-1">
//                   <p className="text-sm font-medium text-white whitespace-nowrap truncate">
//                     {user?.name ?? 'Admin User'}
//                   </p>
//                   <p className="text-[11px] text-slate-400 whitespace-nowrap">
//                     {roleLabel[role] ?? role}
//                   </p>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setLogoutConfirm(true)}
//                 className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
//               >
//                 <i className="ri-logout-box-line text-sm" />
//                 <span>Sign out</span>
//               </button>
//             </div>
//           )}
//         </div>
//       </aside>
//       <SignOutConfirmModal open={logoutConfirm} onConfirm={handleLogout} onCancel={() => setLogoutConfirm(false)} />
//     </>
//   );
// }



import { useCallback, useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { postData } from "../../services/FetchNodeServices.js";
import SignOutConfirmModal from './SignOutCOnfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from "@/utils/permissions";

const API_BASE = 'https://asvapi.digiindiasolutions.com/api/v1';

interface NavItem  { label: string; path: string; icon: string; }
interface NavGroup { label: string; icon: string; basePath: string; items: NavItem[]; }
interface CompanyData { name: string; logo_url?: string | null; }

const mastersGroup: NavGroup = {
  label: 'Masters', icon: 'ri-database-2-line', basePath: '/masters',
  items: [
    { label: 'Warehouses',         path: '/masters/warehouses',  icon: 'ri-store-3-line'     },
    { label: 'Parties',            path: '/masters/parties',     icon: 'ri-group-2-line'     },
    { label: 'Items',              path: '/masters/items',       icon: 'ri-box-3-line'       },
    { label: 'Categories & Units', path: '/masters/categories',  icon: 'ri-price-tag-3-line' },
  ],
};

const salesGroup: NavGroup = {
  label: 'Sales', icon: 'ri-shopping-cart-2-line', basePath: '/sales',
  items: [
    { label: 'Invoices',     path: '/sales/invoices', icon: 'ri-file-text-line'          },
    { label: 'Payments',     path: '/sales/payments', icon: 'ri-money-rupee-circle-line' },
    { label: 'Sale Returns', path: '/sales/returns',  icon: 'ri-arrow-go-back-line'      },
    { label: 'Challans',     path: '/sales/challans', icon: 'ri-truck-line'              },
  ],
};

const purchaseGroup: NavGroup = {
  label: 'Purchase', icon: 'ri-store-2-line', basePath: '/purchase',
  items: [
    { label: 'Purchase Orders',  path: '/purchase/orders',   icon: 'ri-file-list-3-line'       },
    { label: 'Invoices',         path: '/purchase/invoices', icon: 'ri-file-text-line'          },
    { label: 'Payments',         path: '/purchase/payments', icon: 'ri-money-rupee-circle-line' },
    { label: 'GRN History',      path: '/purchase/grn',      icon: 'ri-inbox-archive-line'      },
    { label: 'Purchase Returns', path: '/purchase/returns',  icon: 'ri-arrow-go-forward-line'   },
  ],
};

const inventoryGroup: NavGroup = {
  label: 'Inventory', icon: 'ri-archive-stack-line', basePath: '/inventory',
  items: [
    { label: 'Stock View',        path: '/inventory/stock',             icon: 'ri-bar-chart-horizontal-line' },
    { label: 'Stock Receiving',   path: '/inventory/receiving',         icon: 'ri-inbox-archive-line'        },
    { label: 'Stock Entries',     path: '/inventory/stock-entries',     icon: 'ri-add-box-line'              },
    { label: 'Transfers',         path: '/inventory/transfer',          icon: 'ri-swap-box-line'             },
    { label: 'Adjustments',       path: '/inventory/adjustment',        icon: 'ri-equalizer-line'            },
    { label: 'Outward Gate Pass', path: '/inventory/gate-pass/outward', icon: 'ri-logout-box-r-line'         },
    { label: 'Inward Gate Pass',  path: '/inventory/gate-pass/inward',  icon: 'ri-login-box-line'            },
  ],
};

const printGroup: NavGroup = {
  label: 'Print', icon: 'ri-printer-line', basePath: '/print',
  items: [{ label: 'Barcode Print', path: '/print/barcode-management', icon: 'ri-barcode-line' }],
};

const reportsGroup: NavGroup = {
  label: 'Reports', icon: 'ri-bar-chart-2-line', basePath: '/reports',
  items: [
    { label: 'Stock Summary',      path: '/reports/stock-summary',     icon: 'ri-stack-line'              },
    { label: 'Stock Ledger',       path: '/reports/stock-ledger',      icon: 'ri-file-list-3-line'        },
    { label: 'Low Stock Alert',    path: '/reports/low-stock',         icon: 'ri-alert-line'              },
    { label: 'Purchase Register',  path: '/reports/purchase-register', icon: 'ri-store-2-line'            },
    { label: 'GST Purchase',       path: '/reports/gst-purchase',      icon: 'ri-receipt-line'            },
    { label: 'Sales Register',     path: '/reports/sales-register',    icon: 'ri-bar-chart-box-line'      },
    { label: 'GST Sales (GSTR-1)', path: '/reports/gst-sales',         icon: 'ri-file-shield-2-line'      },
    { label: 'Outstanding',        path: '/reports/outstanding',       icon: 'ri-money-rupee-circle-line' },
    { label: 'Day Book',           path: '/reports/day-book',          icon: 'ri-calendar-check-line'     },
    { label: 'Party Ledger',       path: '/reports/party-ledger',      icon: 'ri-group-line'              },
  ],
};

const guardNavItems: NavItem[] = [
  { label: 'Dashboard',      path: '/guard/dashboard', icon: 'ri-shield-user-line'  },
  { label: 'Outward Passes', path: '/guard/outward',   icon: 'ri-logout-box-r-line' },
  { label: 'Inward Passes',  path: '/guard/inward',    icon: 'ri-login-box-line'    },
];

const roleLabel: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin', SUB_ADMIN: 'Manager',
  COMPANY_ADMIN: 'Company Admin', END_USER: 'Staff', SECURITY_GUARD: 'Security Guard',
};

interface SidebarProps { collapsed: boolean; onToggle: () => void; }

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, hasPermission, hasControl, logout } = useAuth();
  const location = useLocation();
  const navigate  = useNavigate();

  // ── All hooks at the top — no conditional hooks ───────────────────────────
  const [mastersOpen,   setMastersOpen]   = useState(location.pathname.startsWith('/masters'));
  const [salesOpen,     setSalesOpen]     = useState(location.pathname.startsWith('/sales'));
  const [purchaseOpen,  setPurchaseOpen]  = useState(location.pathname.startsWith('/purchase'));
  const [inventoryOpen, setInventoryOpen] = useState(location.pathname.startsWith('/inventory'));
  const [printOpen,     setPrintOpen]     = useState(location.pathname.startsWith('/print'));
  const [reportsOpen,   setReportsOpen]   = useState(location.pathname.startsWith('/reports'));
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [company,       setCompany]       = useState<CompanyData | null>(null);

  const token = localStorage.getItem('token');

  const authHeader = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token ?? ''}`,
  }), [token]);

  const fetchCompany = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/company/get`, { headers: authHeader() });
      if (!res.ok) return;
      const json = await res.json();
      setCompany({ name: json.data?.name ?? '', logo_url: json.data?.logo_url ?? null });
    } catch {
      // silently fail — sidebar still renders without company data
    }
  }, [authHeader]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  // ── Derived values ────────────────────────────────────────────────────────
  const role    = user?.role ?? '';
  const isGuard = role === 'SECURITY_GUARD';

  const userInitials = (user?.name ?? 'AU')
    .split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  // ── Permission-filtered items ─────────────────────────────────────────────
  const visibleMastersItems = mastersGroup.items.filter((item) => {
    if (item.path === '/masters/warehouses') return hasPermission(MODULES.WAREHOUSES, 'view');
    if (item.path === '/masters/parties')    return hasPermission(MODULES.PARTIES, 'view');
    if (item.path === '/masters/items')      return hasPermission(MODULES.ITEMS, 'view');
    if (item.path === '/masters/categories') return hasPermission(MODULES.CATEGORIES, 'view');
    return false;
  });

  const visibleSalesItems = salesGroup.items.filter((item) => {
    if (item.path === '/sales/invoices') return hasPermission(MODULES.SALES_INVOICE, 'view');
    if (item.path === '/sales/payments') return hasPermission(MODULES.SALES_PAYMENT, 'view');
    if (item.path === '/sales/returns')  return hasPermission(MODULES.SALE_RETURN, 'view');
    if (item.path === '/sales/challans') return hasPermission(MODULES.CHALLAN, 'view');
    return false;
  });

  const visiblePurchaseItems = purchaseGroup.items.filter((item) => {
    if (item.path === '/purchase/orders')   return hasPermission(MODULES.PURCHASE_ORDER, 'view');
    if (item.path === '/purchase/invoices') return hasPermission(MODULES.PURCHASE_INVOICE, 'view');
    if (item.path === '/purchase/payments') return hasPermission(MODULES.PURCHASE_PAYMENT, 'view');
    if (item.path === '/purchase/grn')      return hasPermission(MODULES.GRN_HISTORY, 'view');
    if (item.path === '/purchase/returns')  return hasPermission(MODULES.PURCHASE_RETURN, 'view');
    return false;
  });

  const visibleInventoryItems = inventoryGroup.items.filter((item) => {
    if (item.path === '/inventory/stock')             return hasPermission(MODULES.STOCK_ADJUSTMENT, 'view') || hasControl('approveStockAdjustment');
    if (item.path === '/inventory/receiving')         return hasPermission(MODULES.STOCK_RECEIVING, 'create');
    if (item.path === '/inventory/stock-entries')     return hasPermission(MODULES.STOCK_ENTRIES, 'view');
    if (item.path === '/inventory/transfer')          return hasPermission(MODULES.STOCK_TRANSFER, 'view');
    if (item.path === '/inventory/adjustment')        return hasPermission(MODULES.STOCK_ADJUSTMENT, 'view') || hasControl('approveStockAdjustment');
    if (item.path === '/inventory/gate-pass/outward') return hasPermission(MODULES.GATE_PASS_OUTWARD, 'view');
    if (item.path === '/inventory/gate-pass/inward')  return hasPermission(MODULES.GATE_PASS_INWARD, 'view');
    return false;
  });

  const visibleReportsItems = reportsGroup.items.filter((item) => {
    const fin = hasControl('viewFinancialReports');
    if (item.path === '/reports/stock-summary')     return hasPermission(MODULES.REPORT_STOCK_SUMMARY, 'view')   || fin;
    if (item.path === '/reports/stock-ledger')      return hasPermission(MODULES.REPORT_STOCK_LEDGER, 'view')    || fin;
    if (item.path === '/reports/low-stock')         return hasPermission(MODULES.REPORT_LOW_STOCK, 'view')       || fin;
    if (item.path === '/reports/purchase-register') return hasPermission(MODULES.REPORT_PURCHASE_REG, 'view')    || fin;
    if (item.path === '/reports/gst-purchase')      return hasPermission(MODULES.REPORT_GST_PURCHASE, 'view')    || fin;
    if (item.path === '/reports/sales-register')    return hasPermission(MODULES.REPORT_SALES_REG, 'view')       || fin;
    if (item.path === '/reports/gst-sales')         return hasPermission(MODULES.REPORT_GST_SALES, 'view')       || fin;
    if (item.path === '/reports/outstanding')       return hasPermission(MODULES.REPORT_OUTSTANDING, 'view')     || fin;
    if (item.path === '/reports/day-book')          return hasPermission(MODULES.REPORT_DAY_BOOK, 'view')        || fin;
    if (item.path === '/reports/party-ledger')      return hasPermission(MODULES.REPORT_PARTY_LEDGER, 'view')    || fin;
    return false;
  });

  const visiblePrintItems = printGroup.items.filter((item) => {
    if (item.path === '/print/barcode-management') return hasPermission(MODULES.BARCODE_PRINT, 'view');
    return false;
  });

  const canSeeMasters   = visibleMastersItems.length > 0;
  const canSeeSales     = visibleSalesItems.length > 0;
  const canSeePurchase  = visiblePurchaseItems.length > 0;
  const canSeeInventory = visibleInventoryItems.length > 0;
  const canSeePrint     = visiblePrintItems.length > 0;
  const canSeeReports   = visibleReportsItems.length > 0 || hasControl('viewFinancialReports');
  const canSeeUsers     = hasPermission(MODULES.USERS, 'view') || hasControl('manageUserPermissions');
  const canSeeSettings  = hasPermission(MODULES.SETTINGS, 'view') || hasControl('manageUserPermissions');

  const visibleMastersGroup   = { ...mastersGroup,   items: visibleMastersItems   };
  const visibleSalesGroup     = { ...salesGroup,     items: visibleSalesItems     };
  const visiblePurchaseGroup  = { ...purchaseGroup,  items: visiblePurchaseItems  };
  const visibleInventoryGroup = { ...inventoryGroup, items: visibleInventoryItems };
  const visibleReportsGroup   = { ...reportsGroup,   items: visibleReportsItems   };
  const visiblePrintGroup     = { ...printGroup,     items: visiblePrintItems     };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLogoutConfirm(false);
    try {
      await postData('api/v1/auth/logout', {});
    } catch (err) {
      console.error('Logout API error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('auth_user');
      navigate('/login', { replace: true });
    }
  };

  // ── Sub-components ────────────────────────────────────────────────────────
  const NavBtn = ({ item }: { item: NavItem }) => {
    const active = item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path);
    return (
      <NavLink
        to={item.path}
        end={item.path === '/'}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 cursor-pointer ${
          active ? 'bg-[#4f46e5] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
        }`}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <i className={`${item.icon} text-lg leading-none`} />
        </div>
        {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
      </NavLink>
    );
  };

  const CollapseGroup = ({
    group, open, setOpen,
  }: { group: NavGroup; open: boolean; setOpen: (v: boolean) => void }) => {
    const isGroupActive = location.pathname.startsWith(group.basePath);
    if (group.items.length === 0) return null;
    return (
      <div className="px-2 mt-1">
        <button
          onClick={() => collapsed ? navigate(group.items[0].path) : setOpen(!open)}
          title={collapsed ? group.label : undefined}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
            isGroupActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <i className={`${group.icon} text-lg leading-none`} />
          </div>
          {!collapsed && (
            <>
              <span className="text-sm font-medium whitespace-nowrap flex-1 text-left">{group.label}</span>
              <i className={`text-slate-400 text-sm transition-transform duration-200 ${open ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'}`} />
            </>
          )}
        </button>
        {!collapsed && open && (
          <ul className="mt-1 ml-4 border-l border-white/10 pl-3 space-y-0.5">
            {group.items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive: a }) =>
                    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-all text-sm cursor-pointer ${
                      a ? 'bg-[#4f46e5] text-white font-medium' : 'text-slate-400 hover:bg-white/10 hover:text-white'
                    }`
                  }
                >
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    <i className={`${item.icon} text-sm leading-none`} />
                  </div>
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  const SectionLabel = ({ label }: { label: string }) =>
    !collapsed ? (
      <p className="px-4 mt-4 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
    ) : null;

  const UserBottom = () => (
    <div className="border-t border-white/10 p-3 shrink-0">
      {collapsed ? (
        <button
          onClick={() => setLogoutConfirm(true)}
          title="Logout"
          className="w-8 h-8 flex items-center justify-center mx-auto rounded-full bg-[#4f46e5] text-xs font-bold text-white cursor-pointer hover:bg-indigo-600 transition-colors"
        >
          {userInitials}
        </button>
      ) : (
        <div className="space-y-1">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center text-xs font-bold text-white shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white whitespace-nowrap truncate">
                {user?.name ?? 'Admin User'}
              </p>
              <p className="text-[11px] text-slate-400 whitespace-nowrap">
                {roleLabel[role] ?? role}
              </p>
            </div>
          </div>
          <button
            onClick={() => setLogoutConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <i className="ri-logout-box-line text-sm" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );

  // ── Logo / brand header ───────────────────────────────────────────────────
  const logoUrl = company?.logo_url
    ?? 'https://public.readdy.ai/ai/img_res/562db67e-18cd-4892-ada1-aa9c5633c1ae.png';

  const brandName = company?.name || (isGuard ? 'Guard Portal' : 'InvenPro');

  const BrandHeader = ({ guardMode = false }: { guardMode?: boolean }) => (
    <div className="flex items-center h-[60px] px-4 border-b border-white/10 shrink-0">
      <div className="w-8 h-8 flex items-center justify-center shrink-0">
        {guardMode
          ? <i className="ri-shield-user-fill text-[#4f46e5] text-xl" />
          : <img src={logoUrl} alt={brandName} className="w-8 h-8 object-contain rounded" />
        }
      </div>
      {!collapsed && (
        <span className="ml-3 font-bold text-base tracking-tight whitespace-nowrap text-white truncate max-w-[140px]">
          {brandName}
        </span>
      )}
      <button
        onClick={onToggle}
        className="ml-auto w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
      >
        <i className={`${collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'} text-base`} />
      </button>
    </div>
  );

  const asideClass = "flex flex-col h-screen bg-[#1e293b] text-white transition-all duration-300 ease-in-out shrink-0";

  // ── Guard sidebar ─────────────────────────────────────────────────────────
  if (isGuard) {
    return (
      <>
        <aside className={asideClass} style={{ width: collapsed ? 64 : 240 }}>
          <BrandHeader guardMode />
          <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
            <SectionLabel label="Gate Pass" />
            {guardNavItems.map((item) => <NavBtn key={item.path} item={item} />)}
          </nav>
          <UserBottom />
        </aside>
        <SignOutConfirmModal open={logoutConfirm} onConfirm={handleLogout} onCancel={() => setLogoutConfirm(false)} />
      </>
    );
  }

  // ── Standard sidebar ──────────────────────────────────────────────────────
  return (
    <>
      <aside className={asideClass} style={{ width: collapsed ? 64 : 240 }}>
        <BrandHeader />

        <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <SectionLabel label="Main" />
          <ul className="space-y-0.5 px-2">
            <li>
              <NavLink to="/" end
                className={({ isActive: a }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer ${
                    a ? 'bg-[#4f46e5] text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                  }`
                }
                title={collapsed ? 'Dashboard' : undefined}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <i className="ri-dashboard-3-line text-lg leading-none" />
                </div>
                {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Dashboard</span>}
              </NavLink>
            </li>
          </ul>

          {canSeeMasters && (
            <>
              <SectionLabel label="Masters" />
              <CollapseGroup group={visibleMastersGroup} open={mastersOpen} setOpen={setMastersOpen} />
            </>
          )}

          {(canSeeSales || canSeePurchase || canSeeInventory) && <SectionLabel label="Transactions" />}
          {canSeeSales     && <CollapseGroup group={visibleSalesGroup}     open={salesOpen}     setOpen={setSalesOpen}     />}
          {canSeePurchase  && <CollapseGroup group={visiblePurchaseGroup}  open={purchaseOpen}  setOpen={setPurchaseOpen}  />}
          {canSeeInventory && <CollapseGroup group={visibleInventoryGroup} open={inventoryOpen} setOpen={setInventoryOpen} />}

          {canSeePrint && (
            <>
              <SectionLabel label="Print" />
              <CollapseGroup group={visiblePrintGroup} open={printOpen} setOpen={setPrintOpen} />
            </>
          )}

          {canSeeReports && (
            <>
              <SectionLabel label="Reports" />
              <CollapseGroup group={visibleReportsGroup} open={reportsOpen} setOpen={setReportsOpen} />
            </>
          )}

          {(canSeeUsers || canSeeSettings) && (
            <>
              <SectionLabel label="System" />
              <ul className="space-y-0.5 px-2 mt-1">
                {canSeeUsers    && <li><NavBtn item={{ label: 'Users',    path: '/users',    icon: 'ri-team-line'       }} /></li>}
                {canSeeSettings && <li><NavBtn item={{ label: 'Settings', path: '/settings', icon: 'ri-settings-3-line' }} /></li>}
              </ul>
            </>
          )}
        </nav>

        <UserBottom />
      </aside>
      <SignOutConfirmModal open={logoutConfirm} onConfirm={handleLogout} onCancel={() => setLogoutConfirm(false)} />
    </>
  );
}