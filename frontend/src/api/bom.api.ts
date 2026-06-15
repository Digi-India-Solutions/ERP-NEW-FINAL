import axios from 'axios';

// ============================================
// CONFIGURATION
// ============================================
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:7000';
const BOM_API_BASE = `${API_BASE}/api/v1/manufacturing/bom`;
// Result: http://localhost:7000/api/v1/manufacturing/bom ✅

const getAuthHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json',
  },
});

// ============================================
// TYPES
// ============================================

export interface BOMComponent {
  id?: string;
  bom_id?: string;
  item_id: string;
  item_name?: string;
  item_code?: string;
  item_type?: string;
  quantity: number;
  scrap_percentage: number;
  unit_price?: number;
  total_price?: number;
  sequence_no?: number;
  unit_name?: string;
  qc_required?: boolean;
  notes?: string | null;
}

export interface BOM {
  id: string;
  code: string;
  product_id: string;
  product_name: string;
  product_code: string;
  product_type?: string;
  version: string;
  status: 'DRAFT' | 'ACTIVE' | 'OBSOLETE';
  is_variant_bom: boolean;
  variant_name: string | null;
  levels: number;
  total_items: number;
  total_material_cost: number;
  warehouse_id: string;
  warehouse_name?: string;
  link_to_item_master: boolean;
  effective_from: string;
  effective_to: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  company_id?: string;
  items?: BOMComponent[];
  summary?: {
    raw: number;
    semi: number;
    consumable: number;
    packaging: number;
    total: number;
    scrapCost: number;
  };
}

export interface BOMListResponse {
  success: boolean;
  data: BOM[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
}

export interface BOMCreateData {
  code?: string;
  productId: string;
  version: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isVariantBom?: boolean;
  variantName?: string | null;
  warehouseId: string;
  linkToItemMaster?: boolean;
  items: {
    itemId: string;
    quantity: number;
    scrapPercentage: number;
    sequenceNo?: number;
  }[];
}

export interface BOMUpdateData {
  version?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'OBSOLETE';
  effectiveFrom?: string;
  effectiveTo?: string | null;
  variantName?: string | null;
  warehouseId?: string;
  linkToItemMaster?: boolean;
  items?: {
    itemId: string;
    quantity: number;
    scrapPercentage: number;
    sequenceNo?: number;
  }[];
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * 📌 CREATE BOM
 * POST /api/v1/manufacturing/bom
 */
export const createBOM = async (data: BOMCreateData): Promise<BOM> => {
  const response = await axios.post(BOM_API_BASE, data, getAuthHeaders());
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to create BOM');
  }
  return response.data.data;
};

/**
 * 📌 GET ALL BOMS (with filters & pagination)
 * GET /api/v1/manufacturing/bom
 */
export const getAllBOMs = async (params?: {
  status?: string;
  type?: 'REGULAR' | 'VARIANT';
  search?: string;
  warehouseId?: string;
  page?: number;
  limit?: number;
}): Promise<BOMListResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.status && params.status !== 'ALL') {
    queryParams.append('status', params.status);
  }
  if (params?.type) {
    queryParams.append('type', params.type);
  }
  if (params?.search) {
    queryParams.append('search', params.search);
  }
  if (params?.warehouseId) {
    queryParams.append('warehouseId', params.warehouseId);
  }
  if (params?.page) {
    queryParams.append('page', String(params.page));
  }
  if (params?.limit) {
    queryParams.append('limit', String(params.limit));
  }

  const url = `${BOM_API_BASE}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await axios.get(url, getAuthHeaders());
  return response.data;
};

/**
 * 📌 GET SINGLE BOM BY ID
 * GET /api/v1/manufacturing/bom/:id
 */
export const getBOMById = async (id: string): Promise<BOM> => {
  const response = await axios.get(`${BOM_API_BASE}/${id}`, getAuthHeaders());
  if (!response.data.success) {
    throw new Error(response.data.message || 'BOM not found');
  }
  return response.data.data;
};

/**
 * 📌 UPDATE BOM
 * PUT /api/v1/manufacturing/bom/:id
 */
export const updateBOM = async (
  id: string,
  data: BOMUpdateData,
): Promise<BOM> => {
  const response = await axios.put(
    `${BOM_API_BASE}/${id}`,
    data,
    getAuthHeaders(),
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to update BOM');
  }
  return response.data.data;
};

/**
 * 📌 DELETE BOM
 * DELETE /api/v1/manufacturing/bom/:id
 */
export const deleteBOM = async (id: string): Promise<void> => {
  const response = await axios.delete(
    `${BOM_API_BASE}/${id}`,
    getAuthHeaders(),
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to delete BOM');
  }
};

/**
 * 📌 DUPLICATE BOM
 * POST /api/v1/manufacturing/bom/:id/duplicate
 */
export const duplicateBOM = async (id: string): Promise<BOM> => {
  const response = await axios.post(
    `${BOM_API_BASE}/${id}/duplicate`,
    {},
    getAuthHeaders(),
  );
  if (!response.data.success) {
    throw new Error(response.data.message || 'Failed to duplicate BOM');
  }
  return response.data.data;
};

/**
 * 📌 LINK TO ITEM MASTER
 * POST /api/v1/manufacturing/bom/:id/link
 */
export const linkBOMToItemMaster = async (
  id: string,
): Promise<{ linkToItemMaster: boolean; standardCost: number }> => {
  const response = await axios.post(
    `${BOM_API_BASE}/${id}/link`,
    {},
    getAuthHeaders(),
  );
  if (!response.data.success) {
    throw new Error(
      response.data.message || 'Failed to link BOM to item master',
    );
  }
  return response.data.data;
};

// ============================================
// DEFAULT EXPORT
// ============================================

const bomAPI = {
  create: createBOM,
  getAll: getAllBOMs,
  getById: getBOMById,
  update: updateBOM,
  delete: deleteBOM,
  duplicate: duplicateBOM,
  linkToItemMaster: linkBOMToItemMaster,
};

export default bomAPI;
