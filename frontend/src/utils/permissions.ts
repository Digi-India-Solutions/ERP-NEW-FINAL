// import { User } from "@/contexts/AuthContext";


// export const hasPermission = (
//   user: User | null,
//   module: string,
//   action: "create" | "view" | "edit" | "delete"
// ): boolean => {
//   if (!user) return false;

//   return user.permissions?.[module]?.[action] ?? false;
// };

// export const MODULES = {
//   // Masters
//   ITEMS: "items",
//   USERS: "users",
//   PARTIES: "parties",
//   WAREHOUSES: "warehouses",
//   CATEGORIES: "categories",
 

//   // Sales
//   SALES_INVOICE: "sales_invoice",
//   SALE_RETURN: "sale_return",
//   CHALLAN: "challan",
//   SALES_PAYMENT: "sales_payment",   // ✅ ADD THIS

//   // Purchase
//   PURCHASE_ORDER: "purchase_order",
//   PURCHASE_INVOICE: "purchase_invoice",
//   PURCHASE_RETURN: "purchase_return",
//   PURCHASE_PAYMENT: "purchase_payment", // ✅ ADD THIS

//   // Inventory
//   STOCK_TRANSFER: "stock_transfer",
//   STOCK_ENTRIES: "stock_entries",
//   STOCK_ADJUSTMENT: "stock_adjustment",
//   STOCK_RECEIVING: "stock_receiving",
//   GRN_HISTORY: "grn_history",
//   GATE_PASS_OUTWARD: "gate_pass_outward",
//   GATE_PASS_INWARD: "gate_pass_inward",

//   // Reports
//   REPORT_STOCK_SUMMARY: "report_stock_summary",
//   REPORT_STOCK_LEDGER: "report_stock_ledger",
//   REPORT_LOW_STOCK: "report_low_stock",
//   REPORT_PURCHASE_REG: "report_purchase_reg",
//   REPORT_GST_PURCHASE: "report_gst_purchase",
//   REPORT_SALES_REG: "report_sales_reg",
//   REPORT_GST_SALES: "report_gst_sales",
//   REPORT_OUTSTANDING: "report_outstanding",
//   REPORT_DAY_BOOK: "report_day_book",
//   REPORT_PARTY_LEDGER: "report_party_ledger",

//   // System
//   SETTINGS: "settings",
// };




// export function canApproveTransfer(
//   user: User | null,
//   createdById: string,
//   hasControl: (c: keyof User['additionalControls']) => boolean
// ): boolean {
//   if (!user) return false;

//   return (
//     hasControl('approveStockTransfer') &&
//     user.id !== createdById
//   );
// }






// // import type { AuthUser } from '@/stores/authStore';
// // import type { ModuleKey, ModuleAction } from '@/types/shared';

// // export type PermissionKey =
// //   | 'PURCHASE_ENTRY'
// //   | 'SALE_ENTRY'
// //   | 'STOCK_VIEW'
// //   | 'REPORTS_VIEW'
// //   | 'RETURN_ENTRY'
// //   | 'CHALLAN_ENTRY'
// //   | 'USER_MANAGE';

// // /**
// //  * Check if a user has a specific legacy permission key.
// //  * SUPER_ADMIN and SUB_ADMIN have all permissions automatically.
// //  * END_USER only has permissions explicitly granted in their permissions array.
// //  */
// // export function hasPermission(user: AuthUser | null, key: PermissionKey): boolean {
// //   if (!user) return false;
// //   if (user.role === 'SUPER_ADMIN' || user.role === 'SUB_ADMIN') return true;
// //   return user.permissions?.includes(key) ?? false;
// // }

// // /**
// //  * Check module-level permission using the new Role system.
// //  * SUPER_ADMIN always returns true.
// //  * For users with a rolePermissions object attached, checks that.
// //  * Falls back to legacy permission keys for END_USER.
// //  */
// // export function hasModulePermission(
// //   user: AuthUser | null,
// //   module: ModuleKey,
// //   action: ModuleAction,
// //   rolePermissions?: Record<ModuleKey, Record<ModuleAction, boolean>>
// // ): boolean {
// //   if (!user) return false;
// //   if (user.role === 'SUPER_ADMIN') return true;
// //   if (user.role === 'SUB_ADMIN') return true;

// //   // If role permissions are provided (from rolesStore), use them
// //   if (rolePermissions) {
// //     return rolePermissions[module]?.[action] === true;
// //   }

// //   // Legacy fallback for END_USER
// //   return user.permissions?.includes('SALE_ENTRY') ?? false;
// // }

// // /**
// //  * Check if a user can access a specific warehouse.
// //  * SUPER_ADMIN can access all warehouses.
// //  * SUB_ADMIN and END_USER can only access their assigned warehouses.
// //  */
// // export function canAccessWarehouse(user: AuthUser | null, warehouseId: string): boolean {
// //   if (!user) return false;
// //   if (user.role === 'SUPER_ADMIN') return true;
// //   return user.warehouseIds.includes(warehouseId);
// // }

// // /**
// //  * Get the list of warehouses a user can access.
// //  * Returns all IDs for SUPER_ADMIN, filtered list for others.
// //  */
// // export function getAccessibleWarehouses(user: AuthUser | null, allWarehouseIds: string[]): string[] {
// //   if (!user) return [];
// //   if (user.role === 'SUPER_ADMIN') return allWarehouseIds;
// //   return user.warehouseIds;
// // }

// // /**
// //  * Check if user can see the Settings page (SUPER_ADMIN only)
// //  */
// // export function canAccessSettings(user: AuthUser | null): boolean {
// //   return user?.role === 'SUPER_ADMIN';
// // }

// // /**
// //  * Check if user can manage other users
// //  * SUPER_ADMIN: all users, SUB_ADMIN: only END_USERs
// //  */
// // export function canManageUsers(user: AuthUser | null): boolean {
// //   if (!user) return false;
// //   return user.role === 'SUPER_ADMIN' || user.role === 'SUB_ADMIN';
// // }

// // /**
// //  * Check if user can approve stock transfers
// //  * Requirement: Cannot approve own transfer, must be SUB_ADMIN or SUPER_ADMIN
// //  */
// // export function canApproveTransfer(user: AuthUser | null, createdById: string): boolean {
// //   if (!user) return false;
// //   if (user.role !== 'SUPER_ADMIN' && user.role !== 'SUB_ADMIN') return false;
// //   return user.id !== createdById; // Cannot approve own transfer
// // }

// // /**
// //  * Check if user can perform adjustments
// //  */
// // export function canAdjustStock(user: AuthUser | null): boolean {
// //   return user?.role === 'SUPER_ADMIN' || user?.role === 'SUB_ADMIN';
// // }


import type { User, AdditionalControls } from '@/contexts/AuthContext';

// ─── Action type must match AuthContext exactly ───────────────────────────────
// AuthContext defines: "create" | "view" | "edit" | "delete"
// Backend stores/returns the same keys: view, create, edit, delete
// ⚠️  Never use "read" or "update" — they won't match backend data

export const MODULES = {
  // Masters
  ITEMS:       'items',
  USERS:       'users',
  PARTIES:     'parties',
  WAREHOUSES:  'warehouses',
  CATEGORIES:  'categories',    // ✅ was missing in permissions.ts (doc 15)
  UNITS:       'units',

  // Sales
  SALES_INVOICE: 'sales_invoice',
  SALE_RETURN:   'sale_return',
  CHALLAN:       'challan',
  SALES_PAYMENT: 'sales_payment',

  // Purchase
  PURCHASE_ORDER:   'purchase_order',
  PURCHASE_INVOICE: 'purchase_invoice',
  PURCHASE_RETURN:  'purchase_return',
  PURCHASE_PAYMENT: 'purchase_payment',

  // Inventory
  STOCK_TRANSFER:   'stock_transfer',
  STOCK_ENTRIES:    'stock_entries',
  STOCK_ADJUSTMENT: 'stock_adjustment',
  STOCK_RECEIVING:  'stock_receiving',
  GRN_HISTORY:      'grn_history',
  GATE_PASS_OUTWARD:'gate_pass_outward',
  GATE_PASS_INWARD: 'gate_pass_inward',

  // Print
  BARCODE_PRINT: 'barcode_print',   // ✅ was missing — sidebar used MODULES.BARCODE_PRINT

  // Reports
  REPORT_STOCK_SUMMARY: 'report_stock_summary',
  REPORT_STOCK_LEDGER:  'report_stock_ledger',
  REPORT_LOW_STOCK:     'report_low_stock',
  REPORT_PURCHASE_REG:  'report_purchase_reg',
  REPORT_GST_PURCHASE:  'report_gst_purchase',
  REPORT_SALES_REG:     'report_sales_reg',
  REPORT_GST_SALES:     'report_gst_sales',
  REPORT_OUTSTANDING:   'report_outstanding',
  REPORT_DAY_BOOK:      'report_day_book',
  REPORT_PARTY_LEDGER:  'report_party_ledger',

  // System
  SETTINGS: 'settings',
} as const;

// ─── Standalone hasPermission (for use outside React components) ──────────────
// Uses "view" | "create" | "edit" | "delete" — matches AuthContext & backend
export const hasPermission = (
  user: User | null,
  module: string,
  action: 'create' | 'view' | 'edit' | 'delete',
): boolean => {
  if (!user) return false;
  if (user.role === 'SUPER_ADMIN') return true;   // ✅ SUPER_ADMIN bypass (was missing)
  return user.permissions?.[module]?.[action] ?? false;
};

// ─── canApproveTransfer ───────────────────────────────────────────────────────
// Requires the hasControl callback from useAuth() — NOT a direct role check.
// A user can approve if:
//   1. They have the approveStockTransfer additional control
//   2. They did NOT create the transfer themselves
export function canApproveTransfer(
  user: User | null,
  createdById: string,
  hasControl: (c: keyof AdditionalControls) => boolean,
): boolean {
  if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true; 
  return hasControl('approveStockTransfer') && user.id !== createdById;
}