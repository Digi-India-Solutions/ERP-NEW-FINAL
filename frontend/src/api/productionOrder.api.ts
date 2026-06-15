
// const api = import.meta.env.VITE_API_URL || 'http://localhost:7000';

// const BASE_URL = `${api}/api/v1/manufacturing`;

// // ─────────────────────────────────────────────
// // TYPES
// // ─────────────────────────────────────────────

// export interface ProductionOrderPayload {
//   poNumber: string;
//   type: 'MTO' | 'MTS';
//   priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

//   itemId: string;
//   plannedQty: number;

//   plannedStartDate: string;
//   plannedEndDate: string;

//   salesInvoiceId?: string;
//   warehouseId: string;
//   routingId?: string;

//   notes?: string;
// }

// export interface ProductionOrderResponse {
//   id: string;

//   po_number: string;

//   type: string;
//   status: string;
//   priority: string;

//   item_id: string;
//   item_name?: string;
//   item_code?: string;

//   bom_id: string;
//   bom_version: string;

//   planned_qty: number;
//   completed_qty: number;
//   rejected_qty: number;

//   planned_start_date: string;
//   planned_end_date: string;

//   actual_start_date?: string | null;
//   actual_end_date?: string | null;

//   sales_invoice_id?: string | null;

//   warehouse_id: string;
//   warehouse_name?: string;

//   routing_id?: string | null;

//   notes?: string | null;

//   created_by: string;
//   created_at: string;
// }

// export interface ApiResponse<T> {
//   success: boolean;
//   message?: string;
//   data?: T;
//   pagination?: {
//     page: number;
//     limit: number;
//     total: number;
//     totalPages: number;
//   };
// }

// export interface ProductionOrderFilterParams {
//   status?: string;
//   type?: string;
//   priority?: string;
//   warehouseId?: string;
//   search?: string;
//   page?: number;
//   limit?: number;
// }

// // ─────────────────────────────────────────────
// // AUTH HELPER
// // ─────────────────────────────────────────────

// function getAuthHeaders(): HeadersInit {
//   const token = localStorage.getItem('token');

//   return {
//     'Content-Type': 'application/json',
//     ...(token ? { Authorization: `Bearer ${token}` } : {}),
//   };
// }

// async function handleResponse<T>(
//   res: Response,
// ): Promise<ApiResponse<T>> {
//   const data = await res.json();

//   if (!res.ok) {
//     throw new Error(data?.message || 'Something went wrong');
//   }

//   return data as ApiResponse<T>;
// }

// // ─────────────────────────────────────────────
// // MAPPER
// // ─────────────────────────────────────────────

// export function mapApiToProductionOrder(r: any) {
//   return {
//     id: r.id,

//     poNumber: r.poNumber ?? r.po_number ?? '',

//     type: r.type ?? '',
//     status: r.status ?? '',
//     priority: r.priority ?? '',

//     itemId: r.itemId ?? r.item_id ?? '',
//     itemName: r.itemName ?? r.item_name ?? '',
//     itemCode: r.itemCode ?? r.item_code ?? '',

//     bomId: r.bomId ?? r.bom_id ?? '',
//     bomVersion: r.bomVersion ?? r.bom_version ?? '',

//     plannedQty: Number(r.plannedQty ?? r.planned_qty ?? 0),
//     completedQty: Number(r.completedQty ?? r.completed_qty ?? 0),
//     rejectedQty: Number(r.rejectedQty ?? r.rejected_qty ?? 0),

//     plannedStartDate:
//       r.plannedStartDate ?? r.planned_start_date ?? '',

//     plannedEndDate:
//       r.plannedEndDate ?? r.planned_end_date ?? '',

//     actualStartDate:
//       r.actualStartDate ?? r.actual_start_date ?? null,

//     actualEndDate:
//       r.actualEndDate ?? r.actual_end_date ?? null,

//     salesInvoiceId:
//       r.salesInvoiceId ?? r.sales_invoice_id ?? null,

//     warehouseId:
//       r.warehouseId ?? r.warehouse_id ?? '',

//     warehouseName:
//       r.warehouseName ?? r.warehouse_name ?? '',

//     routingId:
//       r.routingId ?? r.routing_id ?? null,

//     notes: r.notes ?? '',
//     createdBy: r.createdBy ?? r.created_by ?? '',
//     createdAt: r.createdAt ?? r.created_at ?? '',
//   };
// }

// // ─────────────────────────────────────────────
// // API CALLS
// // ─────────────────────────────────────────────

// export async function createProductionOrder(
//   payload: ProductionOrderPayload,
// ): Promise<ApiResponse<ProductionOrderResponse>> {
//   const res = await fetch(`${BASE_URL}/production-orders`, {
//     method: 'POST',
//     headers: getAuthHeaders(),
//     body: JSON.stringify(payload),
//   });

//   return handleResponse<ProductionOrderResponse>(res);
// }

// export async function getAllProductionOrders(
//   params?: ProductionOrderFilterParams,
// ): Promise<ApiResponse<ProductionOrderResponse[]>> {
//   const query = new URLSearchParams();

//   if (params?.status) query.set('status', params.status);
//   if (params?.type) query.set('type', params.type);
//   if (params?.priority) query.set('priority', params.priority);
//   if (params?.warehouseId)
//     query.set('warehouseId', params.warehouseId);
//   if (params?.search) query.set('search', params.search);
//   if (params?.page)
//     query.set('page', params.page.toString());
//   if (params?.limit)
//     query.set('limit', params.limit.toString());

//   const qs = query.toString();

//   const res = await fetch(
//     `${BASE_URL}/production-orders${qs ? `?${qs}` : ''}`,
//     {
//       method: 'GET',
//       headers: getAuthHeaders(),
//     },
//   );

//   return handleResponse<ProductionOrderResponse[]>(res);
// }

// export async function getProductionOrderById(
//   id: string,
// ): Promise<ApiResponse<ProductionOrderResponse>> {
//   const res = await fetch(
//     `${BASE_URL}/production-orders/${id}`,
//     {
//       method: 'GET',
//       headers: getAuthHeaders(),
//     },
//   );

//   return handleResponse<ProductionOrderResponse>(res);
// }

// export async function updateProductionOrder(
//   id: string,
//   payload: Partial<ProductionOrderPayload>,
// ): Promise<ApiResponse<ProductionOrderResponse>> {
//   const res = await fetch(
//     `${BASE_URL}/production-orders/${id}`,
//     {
//       method: 'PUT',
//       headers: getAuthHeaders(),
//       body: JSON.stringify(payload),
//     },
//   );

//   return handleResponse<ProductionOrderResponse>(res);
// }

// export async function deleteProductionOrder(
//   id: string,
// ): Promise<ApiResponse<null>> {
//   const res = await fetch(
//     `${BASE_URL}/production-orders/${id}`,
//     {
//       method: 'DELETE',
//       headers: getAuthHeaders(),
//     },
//   );

//   return handleResponse<null>(res);
// }

// // export async function duplicateProductionOrder(
// //   id: string,
// // ): Promise<ApiResponse<ProductionOrderResponse>> {
// //   const res = await fetch(
// //     `${BASE_URL}/production-orders/${id}/duplicate`,
// //     {
// //       method: 'POST',
// //       headers: getAuthHeaders(),
// //     },
// //   );

// //   return handleResponse<ProductionOrderResponse>(res);
// // }

// export async function updateProductionOrderStatus(
//   id: string,
//   status: string,
// ): Promise<ApiResponse<ProductionOrderResponse>> {
//   const res = await fetch(
//     `${BASE_URL}/production-orders/${id}/status`,
//     {
//       method: 'PATCH',
//       headers: getAuthHeaders(),
//       body: JSON.stringify({ status }),
//     },
//   );

//   return handleResponse<ProductionOrderResponse>(res);
// }




const api = import.meta.env.VITE_API_URL || 'http://localhost:7000';

const BASE_URL = `${api}/api/v1/manufacturing`;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ProductionOrderPayload {
  poNumber: string;
  type: 'MTO' | 'MTS';
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  itemId: string;
  plannedQty: number;

  plannedStartDate: string;
  plannedEndDate: string;

  bomId?: string;
  salesInvoiceId?: string;
  warehouseId: string;
  routingId?: string;

  notes?: string;
}

export interface ProductionOrderResponse {
  id: string;

  po_number: string;

  type: string;
  status: string;
  priority: string;

  item_id: string;
  item_name?: string;
  item_code?: string;

  bom_id: string;
  bom_version: string;

  planned_qty: number;
  completed_qty: number;
  rejected_qty: number;

  planned_start_date: string;
  planned_end_date: string;

  actual_start_date?: string | null;
  actual_end_date?: string | null;

  sales_invoice_id?: string | null;

  warehouse_id: string;
  warehouse_name?: string;

  routing_id?: string | null;

  notes?: string | null;

  created_by: string;
  created_at: string;
}

export interface MaterialReservation {
  id: string;
  productionOrderId: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  requiredQty: number;
  reservedQty: number;
  unit: string;
  status: 'PENDING' | 'PARTIAL' | 'RESERVED' | 'RELEASED';
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductionOrderFilterParams {
  status?: string;
  type?: string;
  priority?: string;
  warehouseId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('token');

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<ApiResponse<T>> {
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || 'Something went wrong');
  }

  return data as ApiResponse<T>;
}

// ─────────────────────────────────────────────
// MAPPER
// ─────────────────────────────────────────────

export function mapApiToProductionOrder(r: any) {
  return {
    id: r.id,

    poNumber: r.poNumber ?? r.po_number ?? '',

    type: r.type ?? '',
    status: r.status ?? '',
    priority: r.priority ?? '',

    itemId: r.itemId ?? r.item_id ?? '',
    itemName: r.itemName ?? r.item_name ?? '',
    itemCode: r.itemCode ?? r.item_code ?? '',

    bomId: r.bomId ?? r.bom_id ?? '',
    bomVersion: r.bomVersion ?? r.bom_version ?? '',

    plannedQty: Number(r.plannedQty ?? r.planned_qty ?? 0),
    completedQty: Number(r.completedQty ?? r.completed_qty ?? 0),
    rejectedQty: Number(r.rejectedQty ?? r.rejected_qty ?? 0),

    plannedStartDate: r.plannedStartDate ?? r.planned_start_date ?? '',
    plannedEndDate: r.plannedEndDate ?? r.planned_end_date ?? '',

    actualStartDate: r.actualStartDate ?? r.actual_start_date ?? null,
    actualEndDate: r.actualEndDate ?? r.actual_end_date ?? null,

    salesInvoiceId: r.salesInvoiceId ?? r.sales_invoice_id ?? null,

    warehouseId: r.warehouseId ?? r.warehouse_id ?? '',
    warehouseName: r.warehouseName ?? r.warehouse_name ?? '',

    routingId: r.routingId ?? r.routing_id ?? null,

    notes: r.notes ?? '',
    createdBy: r.createdBy ?? r.created_by ?? '',
    createdAt: r.createdAt ?? r.created_at ?? '',
  };
}

// ─────────────────────────────────────────────
// PRODUCTION ORDER CRUD
// ─────────────────────────────────────────────

export async function createProductionOrder(
  payload: ProductionOrderPayload,
): Promise<ApiResponse<ProductionOrderResponse>> {
  const res = await fetch(`${BASE_URL}/production-orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ProductionOrderResponse>(res);
}

export async function getAllProductionOrders(
  params?: ProductionOrderFilterParams,
): Promise<ApiResponse<ProductionOrderResponse[]>> {
  const query = new URLSearchParams();

  if (params?.status) query.set('status', params.status);
  if (params?.type) query.set('type', params.type);
  if (params?.priority) query.set('priority', params.priority);
  if (params?.warehouseId) query.set('warehouseId', params.warehouseId);
  if (params?.search) query.set('search', params.search);
  if (params?.page) query.set('page', params.page.toString());
  if (params?.limit) query.set('limit', params.limit.toString());

  const qs = query.toString();

  const res = await fetch(
    `${BASE_URL}/production-orders${qs ? `?${qs}` : ''}`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<ProductionOrderResponse[]>(res);
}

export async function getProductionOrderById(
  id: string,
): Promise<ApiResponse<ProductionOrderResponse>> {
  const res = await fetch(`${BASE_URL}/production-orders/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse<ProductionOrderResponse>(res);
}

export async function updateProductionOrder(
  id: string,
  payload: Partial<ProductionOrderPayload>,
): Promise<ApiResponse<ProductionOrderResponse>> {
  const res = await fetch(`${BASE_URL}/production-orders/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  return handleResponse<ProductionOrderResponse>(res);
}

export async function deleteProductionOrder(
  id: string,
): Promise<ApiResponse<null>> {
  const res = await fetch(`${BASE_URL}/production-orders/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  return handleResponse<null>(res);
}

export async function updateProductionOrderStatus(
  id: string,
  status: string,
): Promise<ApiResponse<ProductionOrderResponse>> {
  const res = await fetch(`${BASE_URL}/production-orders/${id}/status`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  });

  return handleResponse<ProductionOrderResponse>(res);
}

// ─────────────────────────────────────────────
// MATERIAL RESERVATIONS
// ─────────────────────────────────────────────

export async function getMaterialReservations(
  productionOrderId: string,
): Promise<ApiResponse<MaterialReservation[]>> {
  const res = await fetch(
    `${BASE_URL}/production-orders/${productionOrderId}/reservations`,
    {
      method: 'GET',
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<MaterialReservation[]>(res);
}

export async function reserveMaterial(
  productionOrderId: string,
  reservationId: string,
): Promise<ApiResponse<MaterialReservation>> {
  const res = await fetch(
    `${BASE_URL}/production-orders/${productionOrderId}/reservations/${reservationId}/reserve`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<MaterialReservation>(res);
}

export async function releaseMaterial(
  productionOrderId: string,
  reservationId: string,
): Promise<ApiResponse<MaterialReservation>> {
  const res = await fetch(
    `${BASE_URL}/production-orders/${productionOrderId}/reservations/${reservationId}/release`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<MaterialReservation>(res);
}

export async function reserveAllMaterials(
  productionOrderId: string,
): Promise<ApiResponse<MaterialReservation[]>> {
  const res = await fetch(
    `${BASE_URL}/production-orders/${productionOrderId}/reservations/reserve-all`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
    },
  );

  return handleResponse<MaterialReservation[]>(res);
}