const API_BASE = 'http://localhost:7000/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GPType = 'INWARD' | 'OUTWARD';
export type GPStatus =
  | 'RECEIVED'
  | 'LINKED'
  | 'OPEN'
  | 'CLOSED'
  | 'RETURNED'
  | 'OVERDUE';
export type GPVerStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type GPPurpose =
  | 'SALE'
  | 'TRANSFER'
  | 'RETURN'
  | 'SAMPLE'
  | 'OTHER'
  | 'PURCHASE'
  | 'SALE_RETURN'
  | 'TRANSFER_IN';

export type LinkedDocType =
  | 'SALES_INVOICE'
  | 'CHALLAN'
  | 'PURCHASE_RETURN'
  | 'GRN'
  | 'SALES_RETURN'
  | 'PURCHASE_ORDER'
  | 'STOCK_TRANSFER';

export interface GPItem {
  id: string;
  gpId: string;
  itemName: string;
  qty: number;
  unit: string;
  description: string | null;
}

export interface GatePass {
  id: string;
  companyId: string;
  gpNumber: string;
  type: GPType;
  status: GPStatus;
  verificationStatus: GPVerStatus;
  rejectionReason: string | null;
  purpose: GPPurpose;
  customPurpose: string | null;
  partyName: string;
  vehicleNumber: string;
  driverName: string | null;
  driverPhone: string | null;
  securityGuard: string;
  authorisedBy: string;
  receivedBy: string | null;
  isReturnable: boolean;
  expectedReturnDate: string | null;
  returnedDate: string | null;
  linkedDocType: string | null;
  linkedDocNumber: string | null;
  linkedDocLabel: string | null; // human-readable doc number e.g. "INV-2026-001"
  isRecreated: boolean;
  originalGPId: string | null;
  isDeleted: boolean;
  notes: string | null;
  date: string;
  time: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
  items: GPItem[];
  itemCount?: number;
}

/** A single document option returned by /linked-docs */
export interface LinkedDocItem {
  item_id: string | null;
  itemName: string;
  qty: number;
  unit: string;
}

export interface LinkedDocOption {
  id: string;
  number: string;
  partyId: string | null;
  partyName: string;
  items: LinkedDocItem[];
}

export interface GPStats {
  total: number;
  totalInward: number;
  totalOutward: number;
  inward: { pending: number; received: number; linked: number };
  outward: { open: number; closed: number; returned: number; overdue: number };
  verification: { pending: number; verified: number; rejected: number };
  thisMonth: number;
  today: number;
}

export interface CreateGPPayload {
  type: GPType;
  purpose: GPPurpose;
  customPurpose?: string;
  warehouseId: string;
  partyName: string;
  vehicleNumber: string;
  driverName?: string;
  driverPhone?: string;
  securityGuard: string;
  authorisedBy: string;
  receivedBy?: string;
  isReturnable?: boolean;
  expectedReturnDate?: string;
  linkedDocType?: string;
  linkedDocNumber?: string;
  notes?: string;
  date?: string;
  time?: string;
  items: Array<{
    itemName: string;
    qty: number;
    unit?: string;
    description?: string;
  }>;
}

export interface UpdateGPPayload extends Partial<
  Omit<CreateGPPayload, 'type'>
> {}

export interface ListGPParams {
  type?: GPType | 'ALL';
  status?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  ver_status?: string;
  page?: number;
  limit?: number;
}

export interface ListGPResponse {
  success: boolean;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: GatePass[];
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function getToken(): string {
  return localStorage.getItem('token') || '';
}

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json as T;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const gatepassService = {
  /** GET /gatepass/linked-docs?docType=X&partyId=Y
   *
   *  Returns documents of the given type, optionally filtered by party.
   *  Each doc includes its line items so the frontend never needs a second call.
   *
   *  @param docType  - one of the LinkedDocType values
   *  @param partyId  - UUID of the party (preferred — exact match)
   *  @param partyName - string fallback when partyId is unavailable
   */
  async getLinkedDocs(
    docType: LinkedDocType,
    partyId?: string,
    partyName?: string,
  ): Promise<LinkedDocOption[]> {
    const qs = new URLSearchParams({ docType });
    if (partyId) qs.set('partyId', partyId);
    if (partyName) qs.set('partyName', partyName);

    const res = await fetch(`${API_BASE}/gatepass/linked-docs?${qs}`, {
      headers: authHeaders(),
    });
    const json = await handleResponse<{
      success: boolean;
      data: LinkedDocOption[];
    }>(res);
    return json.data;
  },

  /** GET /gatepass/ */
  async list(params: ListGPParams = {}): Promise<ListGPResponse> {
    const qs = new URLSearchParams();
    if (params.type && params.type !== 'ALL') qs.set('type', params.type);
    if (params.status && params.status !== 'ALL')
      qs.set('status', params.status);
    if (params.search) qs.set('search', params.search);
    if (params.from_date) qs.set('from_date', params.from_date);
    if (params.to_date) qs.set('to_date', params.to_date);
    if (params.ver_status && params.ver_status !== 'ALL')
      qs.set('ver_status', params.ver_status);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));

    const res = await fetch(`${API_BASE}/gatepass/?${qs}`, {
      headers: authHeaders(),
    });
    return handleResponse<ListGPResponse>(res);
  },

  /** GET /gatepass/:id */
  async getById(id: string): Promise<GatePass> {
    const res = await fetch(`${API_BASE}/gatepass/${id}`, {
      headers: authHeaders(),
    });
    const json = await handleResponse<{ success: boolean; data: GatePass }>(
      res,
    );
    return json.data;
  },

  /** POST /gatepass/ */
  async create(payload: CreateGPPayload): Promise<GatePass> {
    const res = await fetch(`${API_BASE}/gatepass/`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await handleResponse<{ success: boolean; data: GatePass }>(
      res,
    );
    return json.data;
  },

  /** PUT /gatepass/:id */
  async update(id: string, payload: UpdateGPPayload): Promise<GatePass> {
    const res = await fetch(`${API_BASE}/gatepass/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });
    const json = await handleResponse<{ success: boolean; data: GatePass }>(
      res,
    );
    return json.data;
  },

  /** DELETE /gatepass/:id */
  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/gatepass/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleResponse(res);
  },

  /** POST /gatepass/:id/verify */
  async verify(id: string): Promise<GatePass> {
    const res = await fetch(`${API_BASE}/gatepass/${id}/verify`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const json = await handleResponse<{ success: boolean; data: GatePass }>(
      res,
    );
    return json.data;
  },

  /** POST /gatepass/:id/reject */
  async reject(id: string, rejectionReason: string): Promise<GatePass> {
    const res = await fetch(`${API_BASE}/gatepass/${id}/reject`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ rejectionReason }),
    });
    const json = await handleResponse<{ success: boolean; data: GatePass }>(
      res,
    );
    return json.data;
  },

  /** PUT /gatepass/:id/mark-returned */
  async markReturned(id: string): Promise<GatePass> {
    const res = await fetch(`${API_BASE}/gatepass/${id}/mark-returned`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    const json = await handleResponse<{ success: boolean; data: GatePass }>(
      res,
    );
    return json.data;
  },

  /** POST /gatepass/:id/recreate */
  async recreate(id: string): Promise<GatePass> {
    const res = await fetch(`${API_BASE}/gatepass/${id}/recreate`, {
      method: 'POST',
      headers: authHeaders(),
    });
    const json = await handleResponse<{ success: boolean; data: GatePass }>(
      res,
    );
    return json.data;
  },

  /** GET /gatepass/stats */
  async stats(): Promise<GPStats> {
    const res = await fetch(`${API_BASE}/gatepass/stats`, {
      headers: authHeaders(),
    });
    const json = await handleResponse<{ success: boolean; data: GPStats }>(res);
    return json.data;
  },
};
