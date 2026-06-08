// ── Auth ──────────────────────────────────────────────────────────────────
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'SUB_ADMIN' | 'END_USER';
    warehouseIds: string[];
    companyId: string;
  };
}

export interface MeResponse {
  id: string;
  name: string;
  email: string;
  role: 'SUPER_ADMIN' | 'SUB_ADMIN' | 'END_USER';
  warehouseIds: string[];
  companyId: string;
}

// ── Warehouse ─────────────────────────────────────────────────────────────
export interface WarehouseDTO {
  id: string;
  companyId: string;
  name: string;
  address: string;
  inchargeName: string;
  inchargePhone: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateWarehouseRequest {
  name: string;
  address: string;
  inchargeName: string;
  inchargePhone: string;
}

export type UpdateWarehouseRequest = Partial<CreateWarehouseRequest & { isActive: boolean }>;

// ── Party ─────────────────────────────────────────────────────────────────
export type PartyType = 'CUSTOMER' | 'SUPPLIER' | 'BOTH';

export interface PartyDTO {
  id: string;
  companyId: string;
  name: string;
  type: PartyType;
  gstin: string;
  pan: string;
  billingAddress: string;
  shippingAddress: string;
  stateCode: string;
  creditLimit: string;
  creditDays: number;
  openingBalance: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePartyRequest {
  name: string;
  type: PartyType;
  gstin?: string;
  pan?: string;
  billingAddress?: string;
  shippingAddress?: string;
  stateCode?: string;
  creditLimit?: number;
  creditDays?: number;
  openingBalance?: number;
}

export type UpdatePartyRequest = Partial<CreatePartyRequest & { isActive: boolean }>;

// ── Item ──────────────────────────────────────────────────────────────────
export interface ItemDTO {
  id: string;
  companyId: string;
  name: string;
  code: string;
  barcode: string;
  categoryId: string;
  hsnCode: string;
  taxRate: number;
  primaryUnitId: string;
  purchaseRate: string;
  saleRate: string;
  minStockLevel: number;
  imageUrl: string;
  isActive: boolean;
  createdAt: string;
  // joined
  categoryName?: string;
  unitShortName?: string;
  currentStock?: number;
}

export interface CreateItemRequest {
  name: string;
  code?: string;
  barcode?: string;
  categoryId?: string;
  hsnCode?: string;
  taxRate: number;
  primaryUnitId?: string;
  purchaseRate: number;
  saleRate: number;
  minStockLevel?: number;
}

export type UpdateItemRequest = Partial<CreateItemRequest & { isActive: boolean }>;

export interface ItemSearchResult {
  id: string;
  name: string;
  code: string;
  taxRate: number;
  saleRate: string;
  purchaseRate: string;
  currentStock: number;
  unitShortName: string;
}

// ── Category ─────────────────────────────────────────────────────────────
export interface CategoryDTO {
  id: string;
  companyId: string;
  name: string;
  parentId: string | null;
  children?: CategoryDTO[];
}

export interface CreateCategoryRequest {
  name: string;
  parentId?: string;
}

// ── Unit ─────────────────────────────────────────────────────────────────
export interface UnitDTO {
  id: string;
  companyId: string;
  name: string;
  shortName: string;
}

export interface CreateUnitRequest {
  name: string;
  shortName: string;
}

// ── User ─────────────────────────────────────────────────────────────────
export interface UserDTO {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  roleId?: string;
  roleName?: string;
  rolePermissions?: Record<string, Record<string, boolean>>;
  roleAdditionalControls?: Record<string, boolean>;
  isActive: boolean;
  warehouseIds: string[];
  permissions: Record<string, Record<string, boolean>>;      
  additionalControls?: Record<string, boolean>;
  createdAt: string;
  lastActiveAt?: string | null;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: string;
  warehouseIds: string[];
  permissions?: Record<string, Record<string, boolean>>;   // ← CHANGED
  additionalControls?: Record<string, boolean>; 
  isActive?: boolean;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: string;
  warehouseIds?: string[];
  permissions?: Record<string, Record<string, boolean>>;   // ← CHANGED
  additionalControls?: Record<string, boolean>; 
  isActive?: boolean;
}

export interface UpdateUserPermissionsRequest {
  permissions: string[];
  warehouseIds?: string[];
  isActive?: boolean;
}

// ── Stock ─────────────────────────────────────────────────────────────────
export interface StockLedgerEntry {
  id: string;
  movementType: string;
  quantity: number;
  rate: string;
  referenceType: string;
  referenceId: string;
  notes: string;
  createdAt: string;
  runningBalance: number;
}

export interface LowStockItem {
  itemId: string;
  itemName: string;
  code: string;
  currentStock: number;
  minStockLevel: number;
  warehouseName: string;
}

// ── List query params ─────────────────────────────────────────────────────
export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  isActive?: boolean;
  warehouseId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// ── Stock Transfer ────────────────────────────────────────────────────────
export type TransferStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';

export interface TransferItemPayload {
  itemId: string;
  quantity: number;
}

export interface CreateTransferRequest {
  fromWarehouseId: string;
  toWarehouseId: string;
  transferDate: string;
  notes?: string;
  items: TransferItemPayload[];
}

export interface TransferItemDTO {
  id: string;
  itemId: string;
  itemName: string | null;
  itemCode: string | null;
  quantity: number;
}

export interface TransferDTO {
  id: string;
  companyId: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouse: string | null;
  toWarehouseId: string;
  toWarehouse: string | null;
  transferDate: string;
  status: TransferStatus;
  notes: string | null;
  createdBy: string;
  createdByName?: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  itemCount?: number;
  totalQty?: number;
}

export interface TransferDetailDTO extends TransferDTO {
  items: TransferItemDTO[];
}
