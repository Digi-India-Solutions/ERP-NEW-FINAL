import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import PurchaseInvoiceDetailModal from './components/PurchaseInvoiceDetailModal';
import BarcodePrintModal from '@/components/feature/barcode-print/BarcodePrintModal';
import { BarcodePrintItem } from '@/components/feature/barcode-print/Types';
import { useToast } from '@/contexts/ToastContext';
import { purchaseService } from '@/services/purchaseService';
import { isBackendAvailable } from '@/api/client';
import PrintPurchaseInvoiceView from './components/printDetails';
import {MODULES} from '@/utils/permissions.js'
import { useAuth } from '@/contexts/AuthContext';
import { deleteData } from "../../../services/FetchNodeServices.js"
import { useWarehouseStore } from '@/stores/warehouseStore';

const mapInvoice = (row: any): PurchaseInvoice => ({
  id: row.id,
  invoiceNo: row.invoiceNumber,
  date: new Date(row.invoiceDate).toLocaleDateString('en-IN'),
  partyName: row.supplierName,
  warehouseName: row.warehouseName || '—',
  itemCount: row.itemCount || 0,
  grandTotal: row.totalAmount || 0,
  status: row.status || 'SAVED',
  paymentStatus: row.paymentStatus || 'UNPAID',
  supplierId: row.supplierId || '',
  balanceDue: row.balanceDue ?? row.totalAmount,
  paidAmount: row.paidAmount || 0,
  supplierInvoiceNo: row.supplierInvoiceNo || '',
  items: row.items || [],
});


type PurchaseInvoice = {
  id: string;
  invoiceNo: string;
  date: string;
  partyName: string;
  warehouseName: string;
  itemCount: number;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  supplierId: string;
  balanceDue: number;
  paidAmount: number;
  supplierInvoiceNo?: string;
  items: any[];
};


function formatINR(n?: number) {
  return `₹${(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
}


const STATUS_STYLE: Record<string, string> = {
  SAVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
};

const PAYMENT_STYLE: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UNPAID: 'bg-red-50 text-red-600 border-red-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
};

export default function PurchaseInvoiceListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { selectedWarehouseId } = useWarehouseStore();
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState<PurchaseInvoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [barcodePrintItems, setBarcodePrintItems] = useState<BarcodePrintItem[]>([]);
  const [barcodePrintOpen, setBarcodePrintOpen] = useState(false);
  const [printInvoiceId, setPrintInvoiceId] = useState<string | null>(null);
  const {hasPermission} = useAuth();
  const canCreateInvoice = hasPermission(MODULES.PURCHASE_INVOICE, 'create')
  const canEditInvoice = hasPermission(MODULES.PURCHASE_INVOICE, 'edit')
  const canDeleteInvoice = hasPermission(MODULES.PURCHASE_INVOICE, 'delete')
  const canCreatePayment = hasPermission(MODULES.PURCHASE_PAYMENT, 'create')
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);


  const filtered = invoices.filter(
    (r) =>
      r.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
      r.partyName?.toLowerCase().includes(search.toLowerCase())
  );


  const total = invoices.reduce((s, r) => s + r.grandTotal, 0);


  useEffect(() => {
    let mounted = true;

    const loadInvoices = async () => {
      try {
        const params: any = {};
        if (selectedWarehouseId && selectedWarehouseId !== 'ALL') {
          params.warehouse_id = selectedWarehouseId;
        }
        const data = await purchaseService.listInvoices(params);
        const mapped: PurchaseInvoice[] = (data || []).map((row: any) => ({
          id: row.id,
          invoiceNo: row.invoiceNumber,
          date: new Date(row.invoiceDate).toLocaleDateString('en-IN'), // ✅ formatted
          partyName: row.supplierName,
          warehouseName: row.warehouseName || '—',
          itemCount: row.itemCount || 0,
          grandTotal: row.totalAmount || 0,
          status: row.status || 'SAVED',
          paymentStatus: row.paymentStatus || 'UNPAID',
          supplierId: row.supplierId || '',
          balanceDue: row.balanceDue ?? row.totalAmount,
          paidAmount: row.paidAmount || 0,
          supplierInvoiceNo: row.supplierInvoiceNo || '',
          items: row.items || [],
        }));

        if (mounted) setInvoices(mapped);
      } catch (err) {
        console.error('Invoice load error:', err);
      }
    };

    loadInvoices();

    return () => {
      mounted = false;
    };
  }, [selectedWarehouseId]);

  const handleEdit = async (row: PurchaseInvoice, e: React.MouseEvent) => {
  e.stopPropagation();
  try {
    const full = await purchaseService.getInvoiceForEdit(row.id);
    navigate('/purchase/invoices/new', {
      state: {
        editMode: true,
        invoiceId: row.id,
        prefill: {
          supplierId:       full.supplierId,
          supplierName:     full.supplierName,
          warehouseId:      full.warehouseId,
          warehouseName:    full.warehouseName,
          supplierInvoiceNo: full.supplierInvoiceNo ?? '',
          supplierStateCode: full.supplierStateCode ?? full.supplier_state_code ?? '',
          invoiceDate:      full.invoiceDate?.slice(0, 10) ?? '',
          notes:            full.notes ?? '',
          items: (full.items ?? []).map((item: any) => ({
            itemId:      item.itemId,
            itemName:    item.itemName,
            hsnCode:     item.hsnCode ?? '',
            qty:         item.qty,
            rate:        item.rate,
            discountPct: item.discountPct ?? 0,
             taxRate:     item.taxRate ?? item.tax_rate ?? item.gst_rate ?? 0,
            unitId:      item.unitId ?? null,
            unitName:    item.unitName ?? '',
          })),
        },
      },
    });
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to load invoice for editing');
  }
};



  const handleRecordPayment = (invoice: PurchaseInvoice, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/purchase/payments/new', {
      state: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNo,
        supplierId: invoice.supplierId,
        supplierName: invoice.partyName,
        invoiceAmount: invoice.grandTotal,
        balanceDue: invoice.balanceDue ?? invoice.grandTotal,
        invoiceDate: invoice.date,
      },
    });
  };

  const handleDuplicate = async (
    invoice: PurchaseInvoice,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    try {
      const res = await purchaseService.duplicateInvoice(invoice.id);

      const newInvoice = res; // backend should return full invoice

      toast.success(`Created ${newInvoice.invoiceNumber}`);



      setInvoices((prev) => [
        mapInvoice(newInvoice),
        ...prev, // add on top of list
      ]);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Duplicate failed");
    }
  };

  const handlePrintBarcodes = async (invoice: PurchaseInvoice) => {
  try {
    const fullInvoice = await purchaseService.getInvoice(invoice.id);

    const items: BarcodePrintItem[] = (fullInvoice.items || []).map((item: any) => ({
      itemId: item.itemId,
      itemName: item.itemName,

      // ✅ NOW DIRECT FROM BACKEND
      brand: item.brand ?? '—',
      category: item.categoryName ?? '—',
      barcode: item.barcode ?? null,
      mrp: item.mrp ?? 0,
      saleRate: item.rate,
      hsnCode: item.hsnCode,
      articleNo: item.articleNo,
      labelQty: item.qty,
    }));

    console.log("FINAL BARCODE ITEMS:", items);

    setBarcodePrintItems(items);
    setBarcodePrintOpen(true);

  } catch (err) {
    console.error(err);
    toast.error("Failed to load barcode data");
  }
};


  const handleDeletePo = (row: PurchaseInvoice) => {
  setDeleteTarget(row);  // just opens the dialog
};

const confirmDelete = async () => {
  if (!deleteTarget) return;
  setIsDeleting(true);
  try {
    await purchaseService.deleteInvoice(deleteTarget.id);
    setInvoices((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    toast.success('Invoice deleted successfully');
    setDeleteTarget(null);
    setSelectedInvoice(null);
  } catch (err: any) {
    toast.error(err?.message ?? 'Failed to delete invoice');
  } finally {
    setIsDeleting(false);
  }
};

  return (
    <AppLayout>
      <div className="p-6 bg-[#f8fafc] min-h-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1e293b]">Purchase Invoices</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {invoices.length} invoices &nbsp;·&nbsp; Total {formatINR(total)}
            </p>
          </div>
          {canCreateInvoice && <button
            onClick={() => navigate('/purchase/invoices/new')}
            className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white text-sm font-medium rounded-lg hover:bg-indigo-700 cursor-pointer whitespace-nowrap transition-colors"
          >
            <i className="ri-add-line" /> New Purchase
          </button>}
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e2e8f0]">
            <div className="relative w-72">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="w-full h-9 pl-8 pr-3 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:border-[#4f46e5]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {['Invoice No', 'Date', 'Supplier', 'Warehouse', 'Items', 'Amount', 'Payment', 'Status', ''].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 border-b border-[#e2e8f0] whitespace-nowrap ${h === 'Amount' ? 'text-right' : ''}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr
                    key={row.id}
                    className={`border-b border-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-colors ${i % 2 === 1 ? 'bg-[#f8fafc]' : ''}`}
                    onClick={() => setSelectedInvoice(row)}
                  >
                    <td className="px-4 py-3 font-semibold text-[#4f46e5] whitespace-nowrap">{row.invoiceNo}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 font-medium text-[#1e293b]">{row.partyName}</td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.warehouseName}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{row.itemCount}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#1e293b] whitespace-nowrap">{formatINR(row.grandTotal)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${PAYMENT_STYLE[row.paymentStatus]}`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${STATUS_STYLE[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedInvoice(row)}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#4f46e5] rounded cursor-pointer"
                          title="View"
                        >
                          <i className="ri-eye-line text-sm" />
                        </button>

                        {/* Edit — only if unpaid */}
                        {row.paymentStatus === 'UNPAID' && row.status !== 'CANCELLED' && canEditInvoice && (
                          <button
                            onClick={(e) => handleEdit(row, e)}
                            className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-indigo-600 rounded cursor-pointer"
                            title="Edit Invoice"
                          >
                            <i className="ri-pencil-line text-sm" />
                          </button>
                        )}
                         {/* Delete */}
                        {row.status !== 'COMPLETED' && canDeleteInvoice && row.paidAmount <= 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePo(row); }}
                            title="Delete"
                            className="w-7 h-7 flex items-center justify-center rounded-lg
                                      text-slate-400 hover:text-red-500 hover:bg-red-50
                                      transition-colors cursor-pointer"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintInvoiceId(row.id);

                          }}
                          className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-[#4f46e5] rounded cursor-pointer"
                          title="Print Invoice"
                        >
                          <i className="ri-printer-line text-sm" />
                        </button>
                        {row.status !== 'CANCELLED' && (row.paymentStatus === 'UNPAID' || row.paymentStatus === 'PARTIAL') && canCreatePayment && (
                          <button
                            onClick={(e) => handleRecordPayment(row, e)}
                            className="flex items-center gap-1 h-6 px-2 text-xs font-medium text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded cursor-pointer whitespace-nowrap transition-colors"
                            title="Record Payment"
                          >
                            <i className="ri-money-rupee-circle-line text-xs" />
                            Pay
                          </button>
                        )}
                        {canCreateInvoice && <button
                          onClick={(e) => handleDuplicate(row, e)}
                          className="flex items-center gap-1 h-6 px-2 text-xs font-medium text-indigo-700 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 rounded cursor-pointer whitespace-nowrap transition-colors"
                          title="Duplicate Invoice"
                        >
                          <i className="ri-file-copy-line text-xs" />
                          Dup
                        </button>}
                        <button
                          onClick={() => handlePrintBarcodes(row)}
                          className="flex items-center gap-1 h-6 px-2 text-xs font-medium text-emerald-700 border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 rounded cursor-pointer whitespace-nowrap transition-colors"
                          title="Print Barcodes"
                        >
                          <i className="ri-barcode-line text-xs" />
                          Barcodes
                        </button>
                       
                      </div>
                    </td>
                    
                  </tr>


                ))}
              </tbody>
            </table>
          </div>

          

          {printInvoiceId && (
            <PrintPurchaseInvoiceView
              invoiceId={printInvoiceId}
              onClose={() => setPrintInvoiceId(null)}
            />
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <i className="ri-file-list-3-line text-4xl mb-2 block" />
              <p className="text-sm">No invoices found</p>
            </div>
          )}
        </div>
      </div>

      {selectedInvoice && (
        <PurchaseInvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}

      <BarcodePrintModal
        open={barcodePrintOpen}
        onClose={() => setBarcodePrintOpen(false)}
        items={barcodePrintItems}
      />

      {deleteTarget && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
    <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-red-100 shrink-0">
          <i className="ri-delete-bin-line text-red-600 text-xl" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#1e293b]">
            Delete {deleteTarget.invoiceNo}?
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            This will reverse stock and cannot be undone.
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <button
          onClick={() => setDeleteTarget(null)}
          className="flex-1 h-9 rounded-lg border border-[#e2e8f0] text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={confirmDelete}
          disabled={isDeleting}
          className="flex-1 h-9 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 cursor-pointer"
        >
          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
        </button>
      </div>
    </div>
  </div>
)}

    </AppLayout>
  );
}