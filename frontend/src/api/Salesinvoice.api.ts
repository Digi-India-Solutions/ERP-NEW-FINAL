const api = import.meta.env.VITE_API_URL || 'http://localhost:7000';
const BASE_URL = `${api}/api/v1`;

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

/** Lightweight shape used in dropdowns/search results */
export interface SalesInvoiceOption {
    id: string;             // UUID — what gets sent to the backend
    invoice_number: string; // Human-readable, e.g. "INV-2026-1025"
    customer_name: string;
    date: string;           // ISO date string
}

export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
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
    if (!res.ok) throw new Error(data?.message || 'Something went wrong');
    return data as ApiResponse<T>;
}

// ─────────────────────────────────────────────
// API CALLS
// ─────────────────────────────────────────────

/**
 * Search sales invoices by invoice number or customer name.
 * Uses the existing GET /api/v1/sales-invoices/?search=... endpoint.
 * The backend filters on invoice_number and party name (LIKE match).
 */
export async function searchSalesInvoices(
    query: string,
): Promise<ApiResponse<SalesInvoiceOption[]>> {
    const params = new URLSearchParams({ search: query, limit: '20', page: '1' });
    const res = await fetch(`${BASE_URL}/sales-invoices/?${params}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });

    // listSalesInvoices wraps results in data.items, so we unwrap and reshape
    const raw = await res.json();
    if (!res.ok) throw new Error(raw?.message || 'Something went wrong');

    const items: SalesInvoiceOption[] = (raw?.data?.items || []).map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoiceNo,
        customer_name: inv.partyName,
        date: inv.date ? new Date(inv.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
    }));

    return { success: true, data: items };
}