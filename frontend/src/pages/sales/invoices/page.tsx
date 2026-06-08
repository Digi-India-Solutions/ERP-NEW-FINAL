import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import InvoiceDetailModal from './components/InvoiceDetailModal';
import { formatINR } from '@/utils/format';
import { useBillingTabStore } from '@/stores/billingTabStore';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';       // ← added
import { MODULES } from '@/utils/permissions';          // ← added
import {
  salesService,
  type SalesInvoiceDetail,
  type SalesInvoiceRecord,
  type SalesInvoiceStatus,
  type SalesPaymentMode,
  type SalesPaymentStatus,
} from '@/services/salesService';
import { deleteData } from "../../../services/FetchNodeServices.js"
// import { getAllWarehouses, type WarehouseResponse } from '@/api/warehouse.api.js';
import { useWarehouseStore } from '@/stores/warehouseStore.js';

const PAYMENT_STATUS_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNPAID: 'bg-red-50 text-red-600 border-red-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
};

const STATUS_STYLE: Record<string, string> = {
  SAVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

type InvoiceListRow = {
  id: string;
  billNo: string;
  date: string;
  partyName: string;
  warehouseName: string;
  itemCount: number;
  grandTotal: number;
  status: SalesInvoiceStatus;
  paymentMode: SalesPaymentMode;
  paymentStatus: SalesPaymentStatus;
  paidAmount: number;
  balanceDue: number;
  hasChallan?: boolean;
};

const toPaymentStatus = (mode: string, explicit?: string): SalesPaymentStatus => {
  if (explicit === 'PAID' || explicit === 'UNPAID' || explicit === 'PARTIAL') return explicit;
  if (mode === 'CASH') return 'PAID';
  if (mode === 'PARTIAL') return 'PARTIAL';
  return 'UNPAID';
};

const asInvoiceRows = (resp: unknown): SalesInvoiceRecord[] => {
  if (Array.isArray(resp)) return resp;
  if (resp && typeof resp === 'object' && Array.isArray((resp as { items?: SalesInvoiceRecord[] }).items)) {
    return (resp as { items: SalesInvoiceRecord[] }).items;
  }
  return [];
};

const mapDetailToInvoice = (row: SalesInvoiceRecord): SalesInvoiceDetail => {
  const items = Array.isArray(row.items) ? row.items : [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.rate || 0), 0);
  const taxableAmount = items.reduce((sum, item) => sum + Number(item.taxableAmount || 0), 0);
  const totalCGST = items.reduce((sum, item) => sum + Number(item.cgst || 0), 0);
  const totalSGST = items.reduce((sum, item) => sum + Number(item.sgst || 0), 0);
  const totalIGST = items.reduce((sum, item) => sum + Number(item.igst || 0), 0);
  const totalDiscount = Math.max(0, subtotal - taxableAmount);
  const grandTotal = Number(row.grandTotal || 0);
  const roundOff = Number((grandTotal - (taxableAmount + totalCGST + totalSGST + totalIGST)).toFixed(2));
  return {
    ...row,
    billNo: row.invoiceNo,
    partyName: row.partyName || '—',
    warehouseName: row.warehouseName || '—',
    itemCount: Number(row.itemCount || items.length || 0),
    grandTotal,
    status: row.status || 'SAVED',
    paymentMode: row.paymentMode || 'CREDIT',
    paymentStatus: toPaymentStatus(row.paymentMode, row.paymentStatus),
    paidAmount: Number(row.paidAmount || 0),
    balanceDue: Number(row.balanceDue || 0),
    customerId: row.customerId || '',
    customerGstin: row.customerGstin || '',
    billingAddress: row.billingAddress || '',
    shippingAddress: row.shippingAddress || '',
    isSameState: totalIGST === 0,
    subtotal, totalDiscount, taxableAmount, totalCGST, totalSGST, totalIGST, roundOff,
    hasChallan: Boolean(row.hasChallan),
    items,
  };
};

export default function SalesInvoiceListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { addTabWithDuplicate } = useBillingTabStore();
  // const { selectedWarehouseId, setSelectedWarehouse } = useWarehouseStore();
  // ── Permission flags ───────────────────────────────────────────────────────
  const { hasPermission } = useAuth();
  const canCreate = hasPermission(MODULES.SALES_INVOICE, 'create');
  const canUpdate = hasPermission(MODULES.SALES_INVOICE, 'edit');
  const canDelete = hasPermission(MODULES.SALES_INVOICE, 'delete');
  const canCreateChallan = hasPermission(MODULES.CHALLAN, 'create');
  const canCreatePayment = hasPermission(MODULES.SALES_PAYMENT, 'create');


  // ──────────────────────────────────────────────────────────────────────────

  const [search, setSearch]                     = useState('');
  const [paymentFilter, setPaymentFilter]       = useState<'ALL' | SalesPaymentStatus>('ALL');
  const [statusFilter, setStatusFilter]         = useState<'ALL' | SalesInvoiceStatus>('ALL');
  const [data, setData]                         = useState<InvoiceListRow[]>([]);
  const [selectedInvoice, setSelectedInvoice]   = useState<SalesInvoiceDetail | null>(null);
  const [loadingInvoiceId, setLoadingInvoiceId] = useState<string | null>(null);
  const { selectedWarehouseId, selectedWarehouseName, setSelectedWarehouse } =useWarehouseStore();
  const [loadingInvoices, setLoadingInvoices]   = useState(false);
  const [searchInput, setSearchInput] = useState('');
  // const [warehouses, setWarehouses] = useState<WarehouseResponse[]>([]);

useEffect(() => {
  let mounted = true;

  const loadInvoices = async () => {
    if (mounted) setLoadingInvoices(true);

    try {
      const resp = await salesService.listInvoices({
        page: 1,
        limit: 200,

        search: search || undefined,

        paymentType: paymentFilter !== 'ALL' ? paymentFilter : undefined,

        status: statusFilter !== 'ALL' ? statusFilter : undefined,

        warehouseId: selectedWarehouseId || undefined,
      });

      console.log('API RESPONSE =>', resp);

      const rows = asInvoiceRows(resp);

      const mapped = rows.map((row) => ({
        id: row.id,
        billNo: row.invoiceNo || '—',
        date: row.date || '—',
        partyName: row.partyName || '—',
        warehouseName: row.warehouseName || '—',
        itemCount: Number(row.itemCount || 0),
        grandTotal: Number(row.grandTotal || 0),
        status: row.status || 'SAVED',
        paymentMode: row.paymentMode || 'CREDIT',
        hasChallan: Boolean(row.hasChallan),
        paymentStatus: toPaymentStatus(row.paymentMode, row.paymentStatus),
        paidAmount: Number(row.paidAmount || 0),
        balanceDue: Number(row.balanceDue || 0),
      }));

      if (mounted) {
        setData(mapped);
      }
    } catch (error) {
      console.error('LOAD INVOICE ERROR =>', error);

      toast.error('Failed to load invoices');

      if (mounted) {
        setData([]);
      }
    } finally {
      if (mounted) {
        setLoadingInvoices(false);
      }
    }
  };

  loadInvoices();

  return () => {
    mounted = false;
  };
}, [search, paymentFilter, selectedWarehouseId, statusFilter]);

//   useEffect(() => {
//   const loadWarehouses = async () => {
//     try {
//       const resp = await getAllWarehouses(); 
//       if (resp.success && Array.isArray(resp.data)) {
//         setWarehouses(resp.data);
//       }
//     } catch (err) {
//       console.error('Failed to load warehouses', err);
//     }
//   };
//   loadWarehouses();
// }, []);

  const filtered = data;
  const total = data.reduce((s, r) => s + r.grandTotal, 0);

  const loadInvoiceDetail = async (invoiceId: string): Promise<SalesInvoiceDetail | null> => {
    try {
      setLoadingInvoiceId(invoiceId);
      const detail = await salesService.getInvoice(invoiceId);
      return mapDetailToInvoice(detail);
    } catch {
      toast.error('Failed to load invoice details');
      return null;
    } finally {
      setLoadingInvoiceId(null);
    }
  };

  const handleTransfer = async (
  inv: InvoiceListRow,
  e: React.MouseEvent
) => {
  e.stopPropagation();

  const full = await loadInvoiceDetail(inv.id);

  if (!full) return;

  navigate('/inventory/transfer', {
    state: {
      fromInvoice: {
        invoiceId: full.id,
        invoiceNumber: full.billNo,
        customerId: full.customerId,
        customerName: full.partyName,
        warehouseId: full.warehouseId,
        warehouseName: full.warehouseName,

        items: full.items.map((i) => ({
          itemId: i.itemId,
          itemCode: i.itemCode,
          itemName: i.itemName,
          hsnCode: i.hsnCode,
          qty: i.qty,
          unit: i.unit,
          unitId: i.unitId,
          rate: i.rate,
          taxRate: i.taxRate,
        })),
      },
    },
  });
};

  useEffect(() => {
    const navState = location.state as { openInvoiceId?: string; openInvoiceNo?: string } | null;
    if (!navState?.openInvoiceId && !navState?.openInvoiceNo) return;
    if (data.length === 0) return;

    const target = data.find((row) =>
      (navState.openInvoiceId && row.id === navState.openInvoiceId) ||
      (navState.openInvoiceNo && row.billNo === navState.openInvoiceNo),
    );

    if (!target) {
      navigate(location.pathname, { replace: true, state: null });
      return;
    }


    void (async () => {
      const full = await loadInvoiceDetail(target.id);
      if (full) setSelectedInvoice(full);
      navigate(location.pathname, { replace: true, state: null });
    })();
  }, [location.state, location.pathname, data]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDuplicate = async (inv: InvoiceListRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const full = await loadInvoiceDetail(inv.id);
    if (!full) return;
    addTabWithDuplicate('SALE', {
      originalBillNo: full.billNo,
      partyId: full.customerId,
      partyName: full.partyName,
      items: full.items.map((i) => ({
        itemName: i.itemName, hsnCode: i.hsnCode, qty: i.qty,
        unit: i.unit, rate: i.rate, discount: i.discount, taxRate: i.taxRate,
      })),
    });
    toast.success('Invoice duplicated — review and save');
    navigate('/sales/invoices/new');
  };

  const handleRecordPayment = async (inv: InvoiceListRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const full = await loadInvoiceDetail(inv.id);
    if (!full) return;
    navigate(`/sales/payments/new?invoiceId=${encodeURIComponent(full.id)}`, {
      state: {
        invoiceId: full.id,
        invoiceNumber: full.billNo,
        customerId: full.customerId,
        customerName: full.partyName,
        invoiceAmount: full.grandTotal,
        balanceDue: full.balanceDue ?? full.grandTotal,
        invoiceDate: full.date,
      },
    });
  };
  const handleGenerateOutwardGP = async (inv: InvoiceListRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const full = await loadInvoiceDetail(inv.id);
    if (!full) return;

    const prefill = {
      partyName: full.partyName || '',
      customerId: full.customerId || '',
      customerGstin: full.customerGstin || '',
      warehouseName: full.warehouseName || '',
      warehouseId: full.id || '',
      linkedDocType: 'SALES_INVOICE',
      linkedDocNumber: full.id,
      linkedDocNo: full.billNo,
      date: full.date || new Date().toISOString().split('T')[0],
      notes: `Generated from Sales Invoice ${full.billNo}`,
      items: (full.items || []).map((i: any) => ({
        itemId: i.itemId || '',
        itemCode: i.itemCode || '',
        itemName: i.itemName || '',
        hsnCode: i.hsnCode || '',
        qty: i.qty || 0,
        unit: i.unit || 'Pcs',
        unitId: i.unitId || '',
        rate: i.rate || 0,
        taxRate: i.taxRate || 0,
        cgst: i.cgst || 0,
        sgst: i.sgst || 0,
        igst: i.igst || 0,
        taxableAmount: i.taxableAmount || 0,
        total: i.total || 0,
      })),
    };

    navigate('/inventory/gate-pass/outward', {
      state: { prefill },
    });
  };

  const handleCreateChallan = async (inv: InvoiceListRow, e: React.MouseEvent) => {
    e.stopPropagation();
    const full = await loadInvoiceDetail(inv.id);
    if (!full) return;
    setData((prev) => prev.map((r) => r.id === inv.id ? { ...r, hasChallan: true } : r));
    navigate('/sales/challans', {
      state: {
        fromInvoice: {
          invoiceId: full.id,
          invoiceNumber: full.billNo,
          customerId: full.customerId,
          customerName: full.partyName,
          items: full.items.map((i) => ({
            itemId: i.itemId,
            itemCode: i.itemCode,
            itemName: i.itemName,
            hsnCode: i.hsnCode,
            qty: i.qty,
            unit: i.unit,
            unitId: i.unitId,
            rate: i.rate,
            taxRate: i.taxRate,
            cgst: i.cgst,
            sgst: i.sgst,
            igst: i.igst,
            taxableAmount: i.taxableAmount,
            total: i.total
          })),
        },
      },
    });
  };

  // Frontend-only delete (API not yet created)
  const handleDeleteInvoice = async (invoiceId: string) => {

    const respons = await deleteData(`api/v1/sales-invoices/${invoiceId}`)
    if (respons.success === true) {
      setData((prev) => prev.filter((r) => r.id !== invoiceId));
      setSelectedInvoice(null);
      toast.success('Invoice removed (frontend only)');
    }
  };



  // Frontend-only edit — toast for now (API not yet created)
  const handleEditInvoice = (invoice: SalesInvoiceDetail) => {
    // toast.error('Edit API coming soon');
    // void invoice;
    navigate('/sales/invoices/new', { state: { data: invoice } })
  };

  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Sales Invoices</h1>
            <p className="text-sm text-slate-500 mt-0.5">{data.length} invoices • Total {formatINR(total)}</p>
          </div>

          {/* New Invoice — only visible with create permission */}
          {canCreate && (
            <button
              onClick={() => navigate('/sales/invoices/new')}
              className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
            >
              <i className="ri-add-line" /> New Invoice
            </button>
          )}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative w-72">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by invoice no or party..."
                  className="w-full h-9 pl-8 pr-3 text-sm bg-white border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
                />
              </div>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | SalesPaymentStatus)}
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-slate-600 bg-white focus:outline-none focus:border-[#4f46e5]"
              >
                <option value="ALL">All Payments</option>
                <option value="PAID">Paid</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
              </select>

              {/* <select
              value={warehouseFilter}
              onChange={(e) => setWarehouseFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-slate-600 bg-white focus:outline-none focus:border-[#4f46e5]"
            >
              <option value="ALL">All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select> */}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | SalesInvoiceStatus)}
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-slate-600 bg-white focus:outline-none focus:border-[#4f46e5]"
              >
                <option value="ALL">All Status</option>
                <option value="SAVED">Saved</option>
                <option value="DRAFT">Draft</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {loadingInvoices ? (
            <div className="flex min-h-[260px] items-center justify-center text-slate-500 text-sm">
              <div className="flex items-center gap-2">
                <i className="ri-loader-4-line animate-spin text-[#4f46e5]" />
                Loading invoices...
              </div>
            </div>
          ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1400px] text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {['Invoice No', 'Date', 'Customer', 'Warehouse', 'Items', 'Payment', 'Amount', 'Balance Due', 'Status'].concat((canCreateChallan || canCreatePayment || canCreate || canUpdate || canDelete) ? ['Actions'] : [] ).map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap ${h === 'Amount' || h === 'Balance Due' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const ps = row.paymentStatus ?? (row.paymentMode === 'CASH' ? 'PAID' : row.paymentMode === 'PARTIAL' ? 'PARTIAL' : 'UNPAID');
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-[#f8fafc]'}`}
                      onClick={async () => {
                        const full = await loadInvoiceDetail(row.id);
                        if (full) setSelectedInvoice(full);
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-[#4f46e5] whitespace-nowrap">
                        {row.billNo}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(row.date).toLocaleDateString('en-IN', {
                          timeZone: 'Asia/Kolkata',
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-4 py-3 font-medium text-[#1e293b]">
                        {row.partyName}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {row.warehouseName}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {row.itemCount}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PAYMENT_STATUS_STYLE[ps] ?? ''}`}
                        >
                          {ps}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#1e293b]">
                        {formatINR(row.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(row.balanceDue ?? 0) > 0 ? (
                          <span className="font-semibold text-red-600">
                            {formatINR(row.balanceDue ?? 0)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium text-xs">
                            Cleared
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[row.status]}`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Actions column */}
                      <td
                        className="px-4 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1 flex-nowrap">
                          {/* Pay — needs create on SALES_PAYMENT, not gated here but left as-is */}
                          {row.status !== 'CANCELLED' &&
                            (ps === 'UNPAID' || ps === 'PARTIAL') &&
                            canCreatePayment && (
                              <button
                                onClick={(e) => handleRecordPayment(row, e)}
                                disabled={loadingInvoiceId === row.id}
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 cursor-pointer whitespace-nowrap font-medium transition-colors"
                              >
                                <i className="ri-money-rupee-circle-line text-xs" />
                                Pay
                              </button>
                            )}

                          {/* Duplicate — only with create permission */}
                          {canCreate && (
                            <button
                              onClick={(e) => handleDuplicate(row, e)}
                              disabled={loadingInvoiceId === row.id}
                              title="Duplicate invoice"
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer whitespace-nowrap font-medium transition-colors"
                            >
                              <i className="ri-file-copy-line text-xs" />
                              Dup
                            </button>
                          )}
                          {/* Outward GP — only with create permission, shown if invoice has items and is not cancelled */}
                          <button
                            onClick={(e) => handleGenerateOutwardGP(row, e)}
                            disabled={loadingInvoiceId === row.id}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
                          >
                            <i className="ri-file-shield-2-line" /> Outward GP
                          </button>

                          {/* Challan — only with create permission */}
                          {canCreateChallan &&
                            row.status !== 'CANCELLED' &&
                            !row.hasChallan && (
                              <button
                                onClick={(e) => handleCreateChallan(row, e)}
                                disabled={loadingInvoiceId === row.id}
                                title="Create challan"
                                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 cursor-pointer whitespace-nowrap font-medium transition-colors"
                              >
                                <i className="ri-truck-line text-xs" />
                                Challan
                              </button>
                            )}

                          {/* Transfer Button */}
                          {row.status !== 'CANCELLED' && (
                            <button
                              onClick={(e) => handleTransfer(row, e)}
                              disabled={loadingInvoiceId === row.id}
                              title="Create Transfer"
                              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-cyan-50 text-cyan-700 border border-cyan-200 hover:bg-cyan-100 cursor-pointer whitespace-nowrap font-medium transition-colors"
                            >
                              <i className="ri-arrow-left-right-line text-xs" />
                              Transfer
                            </button>
                          )}

                          {row.hasChallan && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200 font-medium whitespace-nowrap">
                              <i className="ri-checkbox-circle-line mr-0.5" />
                              Done
                            </span>
                          )}

                          {/* Edit — only with update permission */}
                          {canUpdate && (
                            <button
                              onClick={async () => {
                                const full = await loadInvoiceDetail(row.id);
                                if (full) handleEditInvoice(full);
                              }}
                              title="Edit invoice"
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer transition-colors"
                            >
                              <i className="ri-edit-line text-xs" />
                            </button>
                          )}

                          {/* Delete — only with delete permission */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteInvoice(row.id)}
                              title="Delete invoice"
                              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
                            >
                              <i className="ri-delete-bin-line text-xs" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )}

          {!loadingInvoices && filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <i className="ri-file-list-3-line text-4xl mb-2 block" />
              No invoices found
            </div>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onDelete={canDelete ? handleDeleteInvoice : undefined}
          onEdit={canUpdate ? handleEditInvoice : undefined}
          onCreateChallan={canCreate ? (inv) => {
            setData((prev) => prev.map((r) => r.id === inv.id ? { ...r, hasChallan: true } : r));
            setSelectedInvoice(null);
            navigate('/sales/challans', {
              state: {
                fromInvoice: {
                  invoiceId: inv.id,
                  invoiceNumber: inv.billNo,
                  customerId: inv.customerId,
                  customerName: inv.partyName,
                  items: inv.items.map((i) => ({
                    itemId: i.itemId,
                    itemCode: i.itemCode,
                    itemName: i.itemName,
                    hsnCode: i.hsnCode,
                    qty: i.qty,
                    unit: i.unit,
                    unitId: i.unitId,
                    rate: i.rate,
                    taxRate: i.taxRate,
                    cgst: i.cgst,
                    sgst: i.sgst,
                    igst: i.igst,
                    taxableAmount: i.taxableAmount,
                    total: i.total
                  })),
                },
              },
            });
          } : undefined}
        />
      )}


    </AppLayout>
  );
}