/**
 * Shared TypeScript interfaces used across all modules.
 * No "any" types. Strict shapes matching API response format.
 */

/* ─── API Response shape ─────────────────────────────────────── */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  details?: Array<{ field: string; message: string }>;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

/* ─── Pagination ─────────────────────────────────────────────── */
export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

/* ─── Item / Inventory ───────────────────────────────────────── */
export interface Item {
  id: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  reorderLevel: number;
  purchaseRate: number;
  saleRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/* ─── Bill / Invoice ─────────────────────────────────────────── */
export type BillType = 'sale' | 'purchase' | 'sale_return' | 'purchase_return';
export type BillStatus = 'draft' | 'saved' | 'paid' | 'overdue' | 'cancelled';

export interface BillLineItem {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  unit: string;
  qty: number;
  rate: number;
  amount: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  netAmount: number;
}

export interface Bill {
  id: string;
  billNo: string;
  type: BillType;
  partyId: string;
  partyName: string;
  date: string;
  dueDate: string;
  warehouseId: string;
  items: BillLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  status: BillStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/* ─── Party (Customer / Vendor) ──────────────────────────────── */
export type PartyType = 'customer' | 'vendor' | 'both';

export interface Party {
  id: string;
  name: string;
  type: PartyType;
  gstin: string;
  phone: string;
  email: string;
  address: string;
  balance: number;
  isActive: boolean;
}

/* ─── Warehouse ───────────────────────────────────────────────── */
export type WarehouseType = 'OFFICE' | 'FACTORY' | 'STORE' | 'GODOWN' | 'BRANCH' | 'TRANSIT';

export interface Warehouse {
  id: string;
  name: string;
  type: WarehouseType;
  address: string;
  isActive: boolean;
}

/* ─── User ────────────────────────────────────────────────────── */
export type UserRole = 'admin' | 'manager' | 'billing_staff' | 'inventory_staff';

export interface AssignedWarehouse {
  warehouseId: string;
  warehouseName: string;
  warehouseType: WarehouseType;
  isPrimary: boolean;
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  roleName: string;
  rolePermissions?: RolePermissions;
  roleAdditionalControls?: AdditionalControls;
  isSuperAdmin: boolean;
  assignedWarehouses: AssignedWarehouse[];
  permissionOverrides: Partial<Record<ModuleKey, Partial<Record<ModuleAction, boolean>>>>;
  additionalControls?: Record<string, boolean>; 
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  warehouseIds: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

/* ─── Stock Movement ──────────────────────────────────────────── */
export type MovementType = 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT';

export interface StockMovement {
  id: string;
  warehouseId: string;
  itemId: string;
  type: MovementType;
  qty: number;
  referenceType: string;
  referenceId: string;
  createdAt: string;
}

/* ─── KPI / Dashboard ─────────────────────────────────────────── */
export interface DashboardKPI {
  totalRevenue: number;
  billsThisMonth: number;
  itemsInStock: number;
  lowStockCount: number;
}

/* ─── Roles & Permissions ─────────────────────────────────────── */
export type ModuleKey =
  | 'dashboard'
  | 'sales_invoice'
  | 'sale_return'
  | 'challan'
  | 'purchase_order'
  | 'purchase_invoice'
  | 'purchase_return'
  | 'stock_receiving'
  | 'stock_transfer'
  | 'stock_adjustment'
  | 'stock_entries'
  | 'grn_history'
  | 'parties'
  | 'items'
  | 'warehouses'
  | 'reports'
  | 'users'
  | 'settings';

export type ModuleAction = 'view' | 'create' | 'edit' | 'delete';

export type ModulePermissions = Partial<Record<ModuleAction, boolean>>;

export type RolePermissions = Record<ModuleKey, ModulePermissions>;

export interface AdditionalControls {
  approveStockTransfer: boolean;
  approveStockAdjustment: boolean;
  viewAllWarehouses: boolean;
  exportData: boolean;
  viewFinancialReports: boolean;
  editLockedRecords: boolean;
  convertChallan: boolean;
  manageUserPermissions: boolean;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  usersAssigned: number;
  permissions: RolePermissions;
  additionalControls: AdditionalControls;
}
