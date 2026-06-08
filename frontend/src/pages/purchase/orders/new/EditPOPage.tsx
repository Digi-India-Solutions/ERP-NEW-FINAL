// import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import AppLayout from '@/components/feature/AppLayout';
// import { useToast } from '@/contexts/ToastContext';
// import {
//   apiGetPOById,
//   apiUpdatePO,
//   type APIPO,
//   type UpdatePOPayload,
// } from '@/api/purchaseOrderApi';
// import { useCompanyState } from '@/hooks/useCompanyState';

// // ── Re-use sub-components from the create page ────────────────────────────────
// import POHeaderBar    from './components/POHeaderBar';
// import POItemsTable   from './components/POItemsTable';
// import POSupplierPanel from './components/POSupplierPanel';
// import POInfoPanel    from './components/POInfoPanel';
// import POSummaryPanel from './components/POSummaryPanel';

// // ─── Types ────────────────────────────────────────────────────────────────────
// export type POPriority = 'Normal' | 'High' | 'Urgent' | 'Critical';

// export interface POSupplier {
//   id: string;
//   name: string;
//   gstin: string;
//   phone: string;
//   stateCode: string;
//   address: string;
//   city: string;
// }


// export interface POItem {
//   id: string;           // local row UUID (not the DB id)
//   item_id: string;
//   itemName: string;
//   barcode: string;
//   size: string;
//   hsnCode: string;
//   gstRate: number;
//   group: string;
//   brand: string;
//   articleNo: string;
//   qty: number;
//   purRate: number;
//   unit: string;
//   unitId?: string;      // ← required by POItemsTable.selectItem
//   stock?: number;       // ← required by POItemsTable.selectItem
//   lastPrice: number | null;
//   lastSupplier: string;
//   lastDate: string;
//   amount: number;
// }

// // ─── Helpers ──────────────────────────────────────────────────────────────────
// function today() {
//   return new Date().toISOString().slice(0, 10);
// }

// function newRow(): POItem {
//   return {
//     id: crypto.randomUUID(),
//     itemId: '', itemName: '', barcode: '', size: '',
//     hsnCode: '', gstRate: 0, group: '', brand: '', articleNo: '',
//     qty: 0, purRate: 0, unit: '', unitId: undefined, stock: 0,
//     lastPrice: null, lastSupplier: '', lastDate: '', amount: 0,
//   };
// }

// function apiItemToLocal(i: NonNullable<APIPO['items']>[number]): POItem {
//   const qty     = i.orderedQty ?? 0;
//   const purRate = i.rate       ?? 0;
//   return {
//     id:           crypto.randomUUID(),
//     itemId:       i.itemId      ?? '',
//     itemName:     i.itemName    ?? '',
//     barcode:      '',
//     size:         i.size        ?? '',
//     hsnCode:      i.hsnCode     ?? '',
//     gstRate:      i.gstRate     ?? 0,
//     group:        i.group       ?? '',
//     brand:        i.brand       ?? '',
//     articleNo:    i.articleNo   ?? '',
//     qty,
//     purRate,
//     unit:         i.unitName    ?? '',
//     unitId:       undefined,
//     stock:        0,
//     lastPrice:    null,
//     lastSupplier: '',
//     lastDate:     '',
//     amount:       parseFloat((qty * purRate).toFixed(2)),
//   };
// }

// function toPriority(p: string): POPriority {
//   const map: Record<string, POPriority> = {
//     NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent', CRITICAL: 'Critical',
//   };
//   return map[p?.toUpperCase()] ?? 'Normal';
// }

// function fromPriority(p: POPriority): string {
//   return p.toUpperCase();
// }

// function computeGstType(
//   supplierStateCode: string,
//   companyStateCode: string,
// ): 'CGST_SGST' | 'IGST' {
//   if (!supplierStateCode || !companyStateCode) return 'CGST_SGST';
//   return supplierStateCode === companyStateCode ? 'CGST_SGST' : 'IGST';
// }

// // ─── Main Component ───────────────────────────────────────────────────────────
// export default function EditPOPage() {
//   const { id }   = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const toast    = useToast();

//   // FIX 1: tableRef must be created here and passed down to POItemsTable.
//   // POItemsTable uses it for keyboard cell-navigation (focusCell). Without it
//   // the ref is null inside the table and arrow/Enter navigation silently breaks.
  

//   // ── Loading / error ───────────────────────────────────────────────────────
//   const [loading, setLoading] = useState(true);
//   const [saving,  setSaving]  = useState(false);
//   const [error,   setError]   = useState<string | null>(null);

//   // ── Header fields ─────────────────────────────────────────────────────────
//   const [poNumber,         setPoNumber]         = useState('');
//   const [supplier,         setSupplier]         = useState<POSupplier | null>(null);
//   const [poDate,           setPoDate]           = useState(today());
//   const [expectedDelivery, setExpectedDelivery] = useState('');

//   // ── Sidebar fields ────────────────────────────────────────────────────────
//   const [billingAddress,  setBillingAddress]  = useState('');
//   const [deliveryAddress, setDeliveryAddress] = useState('');
//   const [paymentTerms,    setPaymentTerms]    = useState('Immediate');
//   const [termsConditions, setTermsConditions] = useState('');
//   const [priority,        setPriority]        = useState<POPriority>('Normal');

//   // ── Items ─────────────────────────────────────────────────────────────────
//   const [items, setItems] = useState<POItem[]>([newRow()]);
//   const [poDetails, setPoDetails] = useState<any>({}); // For supplier info, dates, etc.
//   const tableRef = useRef<HTMLDivElement | null>(null);

//   // ── GST type ──────────────────────────────────────────────────────────────
//   const companyStateCode = useCompanyState();

//   const gstType = useMemo(
//     () => computeGstType(supplier?.stateCode ?? '', companyStateCode ?? ''),
//     [supplier, companyStateCode],
//   );

//   // ── Load existing PO ──────────────────────────────────────────────────────
//   useEffect(() => {
//     if (!id) return;
//     (async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         const res = await apiGetPOById(id);
//         if (!res.success) throw new Error('Failed to load PO');
//         const po = res.data;

//         setPoNumber(po.poNumber);
//         setPoDate(po.date?.slice(0, 10) ?? today());
//         setExpectedDelivery(po.expectedDelivery?.slice(0, 10) ?? '');
//         setPriority(toPriority(po.priority));
//         setBillingAddress(po.billingAddress ?? '');
//         setDeliveryAddress(po.deliveryAddress ?? '');
//         setPaymentTerms(po.paymentTerms ?? 'Immediate');
//         setTermsConditions(po.termsConditions ?? '');

//         if (po.supplierId) {
//           setSupplier({
//             id:        po.supplierId,
//             name:      po.supplierName      ?? '',
//             gstin:     '',
//             phone:     po.supplierPhone     ?? '',
//             stateCode: po.supplierStateCode ?? '',
//             address:   po.billingAddress    ?? '',
//             city:      '',
//           });
//         }

//         const loaded = (po.items ?? []).map(apiItemToLocal);
//         setItems(loaded.length ? loaded : [newRow()]);
//       } catch (err: any) {
//         setError(err.message ?? 'Error loading PO');
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [id]);

//   useEffect(() => {
//     if (poId) {
//       apiGetPOById(poId).then((data) => {
//         setPoDetails(data);
//         // Map backend items into your POItem UI structure
//         setItems(data.items || []);
//       }).catch(err => console.error("Error fetching PO", err));
//     }
//   }, [poId]);

//   // ── Item helpers ──────────────────────────────────────────────────────────
//   const handleAddRow = useCallback(() => {
//     setItems((prev) => [...prev, newRow()]);
//   }, []);

//   const handleRemoveItem = useCallback((rowId: string) => {
//     setItems((prev) => {
//       const next = prev.filter((r) => r.id !== rowId);
//       return next.length ? next : [newRow()];
//     });
//   }, []);

//   /**
//    * FIX 2 — amount recalculated from the MERGED row, not from just the patch.
//    *
//    * The bug: POItemsTable.selectItem fires onUpdateItem with a patch that sets
//    * purRate but NOT qty (the new row's qty is still 0). The old code did:
//    *   amount = (patch.qty ?? 0) * (patch.purRate ?? 0)  →  0 * N = 0  ✗
//    *
//    * Then when the user typed qty:
//    *   amount = N * (patch.purRate ?? 0)  →  N * 0 = 0  ✗  (purRate not in patch)
//    *
//    * Fix: merge patch into the existing row FIRST, then derive amount from
//    * the merged values — so either field being updated alone gives the right result.
//    */
//   const handleUpdateItem = useCallback((rowId: string, patch: Partial<POItem>) => {
//     setItems((prev) =>
//       prev.map((row) => {
//         if (row.id !== rowId) return row;
//         const merged = { ...row, ...patch };
//         merged.amount = parseFloat((merged.qty * merged.purRate).toFixed(2));
//         return merged;
//       }),
//     );
//   }, []);

//   // ── Totals — recalculate live, drives POSummaryPanel ──────────────────────
//   const { subtotal, cgst, sgst, igst, grandTotal, totalItems, totalQty } =
//     useMemo(() => {
//       const valid = items.filter((i) => i.qty > 0 && i.purRate > 0);
//       const subtotal = valid.reduce((s, i) => s + i.amount, 0);

//       let cgst = 0, sgst = 0, igst = 0;
//       valid.forEach((i) => {
//         const taxAmt = (i.amount * i.gstRate) / 100;
//         if (gstType === 'CGST_SGST') { cgst += taxAmt / 2; sgst += taxAmt / 2; }
//         else { igst += taxAmt; }
//       });

//       return {
//         subtotal,
//         cgst:       parseFloat(cgst.toFixed(2)),
//         sgst:       parseFloat(sgst.toFixed(2)),
//         igst:       parseFloat(igst.toFixed(2)),
//         grandTotal: parseFloat((subtotal + cgst + sgst + igst).toFixed(2)),
//         totalItems: valid.length,
//         totalQty:   valid.reduce((s, i) => s + i.qty, 0),
//       };
//     }, [items, gstType]);

//   // ── Save ──────────────────────────────────────────────────────────────────
//   const handleSave = async () => {
//     if (!supplier) { toast.error('Please select a supplier'); return; }

//     const validItems = items.filter((i) => i.qty > 0 && i.purRate > 0);
//     if (!validItems.length) {
//       toast.error('Add at least one item with qty and rate');
//       return;
//     }

//     const payload: UpdatePOPayload = {
//       supplierId:       supplier.id,
//       date:             poDate,
//       expectedDelivery: expectedDelivery || undefined,
//       priority:         fromPriority(priority),
//       billingAddress:   billingAddress   || undefined,
//       deliveryAddress:  deliveryAddress  || undefined,
//       paymentTerms:     paymentTerms     || undefined,
//       termsConditions:  termsConditions  || undefined,
//       items: validItems.map((i) => ({
//         itemId:      i.itemId      || undefined,
//         itemName:    i.itemName,
//         hsnCode:     i.hsnCode     || undefined,
//         orderedQty:  i.qty,
//         receivedQty: 0,
//         unit:        i.unit        || undefined,
//         rate:        i.purRate,
//         gstRate:     i.gstRate     || undefined,
//         size:        i.size        || undefined,
//         group:       i.group       || undefined,
//         brand:       i.brand       || undefined,
//         articleNo:   i.articleNo   || undefined,
//       })),
//     };

//     setSaving(true);
//     try {
//       const res = await apiUpdatePO(id!, payload);
//       if (!res.success) throw new Error(res.message);
//       toast.success(`${poNumber} updated successfully`);
//       navigate('/purchase/orders');
//     } catch (err: any) {
//       toast.error(err.message ?? 'Failed to update PO');
//     } finally {
//       setSaving(false);
//     }
//   };

//   // ── Render ────────────────────────────────────────────────────────────────
//   if (loading) {
//     return (
//       <AppLayout>
//         <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
//           <i className="ri-loader-4-line animate-spin text-2xl mr-2" />
//           <span className="text-sm">Loading purchase order...</span>
//         </div>
//       </AppLayout>
//     );
//   }

//   if (error) {
//     return (
//       <AppLayout>
//         <div className="p-8 text-center text-red-600">
//           <i className="ri-error-warning-line text-3xl mb-2 block" />
//           <p className="font-medium">{error}</p>
//           <button
//             onClick={() => navigate(-1)}
//             className="mt-4 text-sm text-indigo-600 underline cursor-pointer"
//           >
//             Go back
//           </button>
//         </div>
//       </AppLayout>
//     );
//   }

//   return (
//     <AppLayout>
//       <div className="flex flex-col h-full bg-[#f8fafc]">

//         {/* ── Top action bar ────────────────────────────────────────────────── */}
//         <div className="bg-white border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between">
//           <div className="flex items-center gap-3">
//             <button
//               onClick={() => navigate(-1)}
//               className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
//             >
//               <i className="ri-arrow-left-line" />
//             </button>
//             <div>
//               <h1 className="text-sm font-bold text-[#1e293b]">Edit Purchase Order</h1>
//               <p className="text-xs text-slate-400">{poNumber}</p>
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             <button
//               onClick={() => navigate(-1)}
//               className="h-8 px-4 text-xs font-semibold text-slate-600 bg-white border border-[#e2e8f0] rounded-lg hover:bg-slate-50 cursor-pointer"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleSave}
//               disabled={saving}
//               className="h-8 px-4 text-xs font-semibold text-white bg-[#4f46e5] rounded-lg hover:bg-[#4338ca] disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
//             >
//               {saving && <i className="ri-loader-4-line animate-spin" />}
//               {saving ? 'Saving…' : 'Save Changes'}
//             </button>
//           </div>
//         </div>

//         {/* ── Header bar (supplier + dates) ───────────────────────────────── */}
//         <POHeaderBar
//           supplier={supplier}
//           onSupplierSelect={setSupplier}
//           poDate={poDate}
//           onPoDateChange={setPoDate}
//           expectedDelivery={expectedDelivery}
//           onExpectedDeliveryChange={setExpectedDelivery}
//           poNumber={poNumber}
//           gstType={gstType}
//         />

//         {/* ── Body ─────────────────────────────────────────────────────────── */}
//         <div className=" gap-4 p-4">

//           {/* Items table */}
//           <div className=" min-w-0 flex flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
//             <POItemsTable
//               items={items}
//               tableRef={tableRef}       
//               gstType={gstType}
//               onAddRow={handleAddRow}
//               onRemoveItem={handleRemoveItem}
//               onUpdateItem={handleUpdateItem}
//             />
//           </div>

//           {/* Right sidebar */}
//           <div className="w-full grid grid-cols-3 gap-3 overflow-y-auto">
//             <POSupplierPanel
//               supplier={supplier}
//               billingAddress={billingAddress}
//               onBillingAddressChange={setBillingAddress}
//               termsConditions={termsConditions}
//               onTermsChange={setTermsConditions}
//             />

//             <POInfoPanel
//               poNumber={poNumber}
//               poDate={poDate}
//               billingAddress={billingAddress}
//               deliveryAddress={deliveryAddress}
//               onDeliveryAddressChange={setDeliveryAddress}
//               paymentTerms={paymentTerms}
//               onPaymentTermsChange={setPaymentTerms}
//             />

//             {/* FIX 3: summary is now live — grandTotal updates the moment
//                 qty or purRate changes on any row, including newly added ones */}
//             <POSummaryPanel
//               totalItems={totalItems}
//               totalQty={totalQty}
//               subtotal={subtotal}
//               cgst={cgst}
//               sgst={sgst}
//               igst={igst}
//               grandTotal={grandTotal}
//               gstType={gstType}
//               priority={priority}
//               onPriorityChange={setPriority}
//             />
//           </div>
//         </div>
//       </div>
//     </AppLayout>
//   );
// }
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import { useToast } from '@/contexts/ToastContext';
import {
  apiGetPOById,
  apiUpdatePO,
  type APIPO,
  type UpdatePOPayload,
} from '@/api/purchaseOrderApi';
import { useCompanyState } from '@/hooks/useCompanyState';

// ── Re-use sub-components from the create page ────────────────────────────────
import POHeaderBar    from './components/POHeaderBar';
import POItemsTable   from './components/POItemsTable';
import POSupplierPanel from './components/POSupplierPanel';
import POInfoPanel    from './components/POInfoPanel';
import POSummaryPanel from './components/POSummaryPanel';

// ─── Types ────────────────────────────────────────────────────────────────────
export type POPriority = 'Normal' | 'High' | 'Urgent' | 'Critical';

export interface POSupplier {
  id: string;
  name: string;
  gstin: string;
  phone: string;
  stateCode: string;
  address: string;
  city: string;
}

export interface POItem {
  id: string;           // local row UUID (not the DB id)
  item_id: string;      // Fixed property naming parity across code blocks
  itemName: string;
  barcode: string;
  size: string;
  hsnCode: string;
  gstRate: number;
  group: string;
  brand: string;
  articleNo: string;
  qty: number;
  purRate: number;
  unit: string;
  unitId?: string;      // ← required by POItemsTable.selectItem
  stock?: number;       // ← required by POItemsTable.selectItem
  lastPrice: number | null;
  lastSupplier: string;
  lastDate: string;
  amount: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function today() {
  return new Date().toISOString().slice(0, 10);
}

function newRow(): POItem {
  return {
    id: crypto.randomUUID(),
    item_id: '', // FIXED: Was itemId
    itemName: '', barcode: '', size: '',
    hsnCode: '', gstRate: 0, group: '', brand: '', articleNo: '',
    qty: 1, purRate: 0, unit: '', unitId: undefined, stock: 0,
    lastPrice: null, lastSupplier: '', lastDate: '', amount: 0,
  };
}

function apiItemToLocal(i: NonNullable<APIPO['items']>[number]): POItem {
  const qty     = i.orderedQty ?? 0;
  const purRate = i.rate       ?? 0;
  return {
    id:           crypto.randomUUID(),
    item_id:      i.itemId       ?? '', // FIXED: Was itemId
    itemName:     i.itemName     ?? '',
    barcode:      '',
    size:         i.size         ?? '',
    hsnCode:      i.hsnCode      ?? '',
    gstRate:      i.gstRate      ?? 0,
    group:        i.group        ?? '',
    brand:        i.brand        ?? '',
    articleNo:    i.articleNo    ?? '',
    qty,
    purRate,
    unit:         i.unitName     ?? '',
    unitId:       undefined,
    stock:        0,
    lastPrice:    null,
    lastSupplier: '',
    lastDate:     '',
    amount:       parseFloat((qty * purRate).toFixed(2)),
  };
}

function toPriority(p: string): POPriority {
  const map: Record<string, POPriority> = {
    NORMAL: 'Normal', HIGH: 'High', URGENT: 'Urgent', CRITICAL: 'Critical',
  };
  return map[p?.toUpperCase()] ?? 'Normal';
}

function fromPriority(p: POPriority): string {
  return p.toUpperCase();
}

function computeGstType(
  supplierStateCode: string,
  companyStateCode: string,
): 'CGST_SGST' | 'IGST' {
  if (!supplierStateCode || !companyStateCode) return 'CGST_SGST';
  return supplierStateCode === companyStateCode ? 'CGST_SGST' : 'IGST';
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditPOPage() {
  const { id }   = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast    = useToast();

  // ── Loading / error ───────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // ── Header fields ─────────────────────────────────────────────────────────
  const [poNumber,         setPoNumber]         = useState('');
  const [supplier,         setSupplier]         = useState<POSupplier | null>(null);
  const [poDate,           setPoDate]           = useState(today());
  const [expectedDelivery, setExpectedDelivery] = useState('');

  // ── Sidebar fields ────────────────────────────────────────────────────────
  const [billingAddress,  setBillingAddress]  = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentTerms,    setPaymentTerms]    = useState('Immediate');
  const [termsConditions, setTermsConditions] = useState('');
  const [priority,         setPriority]        = useState<POPriority>('Normal');

  // ── Items ─────────────────────────────────────────────────────────────────
  const [items, setItems] = useState<POItem[]>([newRow()]);
  const tableRef = useRef<HTMLDivElement | null>(null);

  // ── GST type ──────────────────────────────────────────────────────────────
  const companyStateCode = useCompanyState();

  const gstType = useMemo(
    () => computeGstType(supplier?.stateCode ?? '', companyStateCode ?? ''),
    [supplier, companyStateCode],
  );

  // ── Load existing PO ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetPOById(id);
        if (!res.success) throw new Error('Failed to load PO');
        const po = res.data;

        setPoNumber(po.poNumber);
        setPoDate(po.date?.slice(0, 10) ?? today());
        setExpectedDelivery(po.expectedDelivery?.slice(0, 10) ?? '');
        setPriority(toPriority(po.priority));
        setBillingAddress(po.billingAddress ?? '');
        setDeliveryAddress(po.deliveryAddress ?? '');
        setPaymentTerms(po.paymentTerms ?? 'Immediate');
        setTermsConditions(po.termsConditions ?? '');

        if (po.supplierId) {
          setSupplier({
            id:        po.supplierId,
            name:      po.supplierName      ?? '',
            gstin:     '',
            phone:     po.supplierPhone     ?? '',
            stateCode: po.supplierStateCode ?? '',
            address:   po.billingAddress    ?? '',
            city:      '',
          });
        }

        const loaded = (po.items ?? []).map(apiItemToLocal);
        setItems(loaded.length ? loaded : [newRow()]);
      } catch (err: any) {
        setError(err.message ?? 'Error loading PO');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // REMOVED: Duplicate poId useEffect block that was breaking render states

  // ── Item helpers ──────────────────────────────────────────────────────────
  const handleAddRow = useCallback(() => {
    setItems((prev) => [...prev, newRow()]);
  }, []);

  const handleRemoveItem = useCallback((rowId: string) => {
    setItems((prev) => {
      const next = prev.filter((r) => r.id !== rowId);
      return next.length ? next : [newRow()];
    });
  }, []);

  const handleUpdateItem = useCallback((rowId: string, patch: Partial<POItem>) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) return row;
        const merged = { ...row, ...patch };
        
        // Safety execution fallback parameters
        const currentQty = merged.qty || 0;
        const currentRate = merged.purRate || 0;

        merged.amount = parseFloat((currentQty * currentRate).toFixed(2));
        return merged;
      }),
    );
  }, []);

  // ── Totals — recalculate live, drives POSummaryPanel ──────────────────────
  const { subtotal, cgst, sgst, igst, grandTotal, totalItems, totalQty } =
    useMemo(() => {
      const valid = items.filter((i) => i.qty > 0 && i.purRate > 0);
      const subtotal = valid.reduce((s, i) => s + i.amount, 0);

      let cgst = 0, sgst = 0, igst = 0;
      valid.forEach((i) => {
        const taxAmt = (i.amount * i.gstRate) / 100;
        if (gstType === 'CGST_SGST') { 
          cgst += taxAmt / 2; 
          sgst += taxAmt / 2; 
        } else { 
          igst += taxAmt; 
        }
      });

      return {
        subtotal:   parseFloat(subtotal.toFixed(2)),
        cgst:       parseFloat(cgst.toFixed(2)),
        sgst:       parseFloat(sgst.toFixed(2)),
        igst:       parseFloat(igst.toFixed(2)),
        grandTotal: parseFloat((subtotal + cgst + sgst + igst).toFixed(2)),
        totalItems: valid.length,
        totalQty:   valid.reduce((s, i) => s + i.qty, 0),
      };
    }, [items, gstType]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!supplier) { toast.error('Please select a supplier'); return; }

    const validItems = items.filter((i) => i.qty > 0 && i.purRate > 0);
    if (!validItems.length) {
      toast.error('Add at least one item with qty and rate');
      return;
    }

    const payload: UpdatePOPayload = {
      supplierId:       supplier.id,
      date:             poDate,
      expectedDelivery: expectedDelivery || undefined,
      priority:         fromPriority(priority),
      billingAddress:   billingAddress   || undefined,
      deliveryAddress:  deliveryAddress  || undefined,
      paymentTerms:     paymentTerms     || undefined,
      termsConditions:  termsConditions  || undefined,
      items: validItems.map((i) => ({
        itemId:      i.item_id     || undefined, // FIXED: Using item_id to match type map
        itemName:    i.itemName,
        hsnCode:     i.hsnCode     || undefined,
        orderedQty:  i.qty,
        receivedQty: 0,
        unit:        i.unit        || undefined,
        rate:        i.purRate,
        gstRate:     i.gstRate     || undefined,
        size:        i.size        || undefined,
        group:       i.group       || undefined,
        brand:       i.brand       || undefined,
        articleNo:   i.articleNo   || undefined,
      })),
    };

    setSaving(true);
    try {
      const res = await apiUpdatePO(id!, payload);
      if (!res.success) throw new Error(res.message);
      toast.success(`${poNumber} updated successfully`);
      navigate('/purchase/orders');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to update PO');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
          <i className="ri-loader-4-line animate-spin text-2xl mr-2" />
          <span className="text-sm">Loading purchase order...</span>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-8 text-center text-red-600">
          <i className="ri-error-warning-line text-3xl mb-2 block" />
          <p className="font-medium">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-sm text-indigo-600 underline cursor-pointer"
          >
            Go back
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-[#f8fafc]">

        {/* ── Top action bar ────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-[#e2e8f0] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
            >
              <i className="ri-arrow-left-line" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-[#1e293b]">Edit Purchase Order</h1>
              <p className="text-xs text-slate-400">{poNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="h-8 px-4 text-xs font-semibold text-slate-600 bg-white border border-[#e2e8f0] rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-8 px-4 text-xs font-semibold text-white bg-[#4f46e5] rounded-lg hover:bg-[#4338ca] disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
            >
              {saving && <i className="ri-loader-4-line animate-spin" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        {/* ── Header bar (supplier + dates) ───────────────────────────────── */}
        <POHeaderBar
          supplier={supplier}
          onSupplierSelect={setSupplier}
          poDate={poDate}
          onPoDateChange={setPoDate}
          expectedDelivery={expectedDelivery}
          onExpectedDeliveryChange={setExpectedDelivery}
          poNumber={poNumber}
          gstType={gstType}
        />

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="gap-4 p-4">

          {/* Items table */}
          <div className="min-w-0 flex flex-col bg-white border border-[#e2e8f0] rounded-xl overflow-hidden mb-4">
            <POItemsTable
              items={items}
              tableRef={tableRef}      
              gstType={gstType}
              onAddRow={handleAddRow}
              onRemoveItem={handleRemoveItem}
              onUpdateItem={handleUpdateItem}
            />
          </div>

          {/* Bottom layout panels */}
          <div className="w-full grid grid-cols-3 gap-3">
            <POSupplierPanel
              supplier={supplier}
              billingAddress={billingAddress}
              onBillingAddressChange={setBillingAddress}
              termsConditions={termsConditions}
              onTermsChange={setTermsConditions}
            />

            <POInfoPanel
              poNumber={poNumber}
              poDate={poDate}
              billingAddress={billingAddress}
              deliveryAddress={deliveryAddress}
              onDeliveryAddressChange={setDeliveryAddress}
              paymentTerms={paymentTerms}
              onPaymentTermsChange={setPaymentTerms}
            />

            <POSummaryPanel
              totalItems={totalItems}
              totalQty={totalQty}
              subtotal={subtotal}
              cgst={cgst}
              sgst={sgst}
              igst={igst}
              grandTotal={grandTotal}
              gstType={gstType}
              priority={priority}
              onPriorityChange={setPriority}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}