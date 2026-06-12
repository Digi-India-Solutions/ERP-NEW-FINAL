// import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
// import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
// import AppLayout from '@/components/feature/AppLayout';
// import ShortcutBar from '@/components/feature/ShortcutBar';
// import BillingTabBar from '@/pages/billing/components/BillingTabBar';
// import { useBillingTabStore } from '@/stores/billingTabStore';
// import { useAuthStore } from '@/stores/authStore';
// import { useToast } from '@/contexts/ToastContext';
// import { isSameStateCheck } from '@/utils/gst';
// import { emptyPurchaseRow, type PurchaseRow } from '@/types/billing';
// import PurchaseDetailsTab from './components/PurchaseDetailsTab';
// import ItemDetailsTab from './components/ItemDetailsTab';
// import PurchaseInvoiceSummary from './components/PurchaseInvoiceSummary';
// import SupplierSection, { type SupplierInfo } from './components/SupplierSection';
// import PurchaseInvoiceInfo, { type PurchaseMode } from './components/PurchaseInvoiceInfo';
// import GRNSelector, { GRN } from './components/GRNSelector';
// import { useCompanyState } from '@/hooks/useCompanyState';

// import { filterItems, getAllItems, mapApiToItem, searchItemByBarcode } from '@/api/item.api';
// import { useWarehouseStore } from '@/stores/warehouseStore';
// import { useAuth } from '@/contexts/AuthContext';
// import { apiGetGRNById } from '@/api/grn.api';

// const BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:7000';

// function getToken(): string {
//   return localStorage.getItem('token') ?? '';
// }

// function authHeaders(): HeadersInit {
//   return {
//     'Content-Type': 'application/json',
//     Authorization: `Bearer ${getToken()}`,
//   };
// }

// let piCounter = 10;

// const nextTempPurchaseInvoiceNo = () => `PINV-2024-00${piCounter++}`;

// interface PurchaseInvoiceDraft {
//   invoiceNo: string;
//   date: string;
//   partyBillNo: string;
//   partyBillDate: string;
//   purchaseMode: PurchaseMode;
//   creditPeriod: number;
//   dueDate: string;
//   selectedSupplier: SupplierInfo | null;
//   supplierAddress: string;
//   supplierInvoiceNo: string;
//   narration: string;
//   selectedGRN: GRN | null;
//   rows: PurchaseRow[];
//   paidAmount: number;
//   tcs: number;
//   creditSkipped: boolean;
//   creditApplied: boolean;
//   addCharges: number;
//   activeItemTab: ActiveItemTab;
//   focusedRowIndex: number;
// }

// const createEmptyPurchaseInvoiceDraft = (): PurchaseInvoiceDraft => ({
//   invoiceNo: nextTempPurchaseInvoiceNo(),
//   date: new Date().toISOString().split('T')[0],
//   partyBillNo: '',
//   partyBillDate: '',
//   purchaseMode: 'CASH',
//   creditPeriod: 30,
//   dueDate: '',
//   selectedSupplier: null,
//   supplierAddress: '',
//   supplierInvoiceNo: '',
//   narration: '',
//   selectedGRN: null,
//   rows: [emptyPurchaseRow()],
//   paidAmount: 0,
//   tcs: 0,
//   creditSkipped: false,
//   creditApplied: false,
//   addCharges: 0,
//   activeItemTab: 'purchase_details',
//   focusedRowIndex: -1,
// });

// type ActiveItemTab = 'purchase_details' | 'item_details';

// function generateEAN13(): string {
//   const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
//   const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
//   const check = (10 - (sum % 10)) % 10;
//   return [...digits, check].join('');
// }

// function generateBarcodeSVG(code: string): string {
//   const barWidth = 2;
//   const height = 60;
//   const quietZone = 10;
//   const bars: string[] = [];
//   let x = quietZone;
//   for (let i = 0; i < code.length; i++) {
//     const charCode = code.charCodeAt(i);
//     const pattern = (charCode % 4) + 1;
//     bars.push(`<rect x="${x}" y="0" width="${barWidth * pattern}" height="${height}" fill="black"/>`);
//     x += barWidth * pattern + barWidth;
//   }
//   const totalWidth = x + quietZone;
//   return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height + 20}" viewBox="0 0 ${totalWidth} ${height + 20}">
//     <rect width="${totalWidth}" height="${height + 20}" fill="white"/>
//     ${bars.join('')}
//     <text x="${totalWidth / 2}" y="${height + 15}" text-anchor="middle" font-size="10" font-family="monospace">${code}</text>
//   </svg>`;
// }

// function grnItemToPurchaseRow(grnItem: any, items: any[]): PurchaseRow {
//   const masterItem = items.find((i) => i.id === grnItem.itemId);
//   const qty = Number(grnItem.quantity ?? grnItem.qty ?? 0);
//   const unit = grnItem.unitName ?? grnItem.unit ?? '';
//   const base = emptyPurchaseRow();
//   return {
//     ...base,
//     itemId: grnItem.itemId ?? '',
//     itemName: grnItem.itemName ?? '',
//     hsnCode: grnItem.hsnCode ?? '',
//     companyBarcode: grnItem.companyBarcode ?? grnItem.barcode ?? '',
//     itemBarcode: grnItem.barcode ?? '',
//     qty,
//     unit,
//     unitId: masterItem?.unitId ?? '',
//     purRate: Number(grnItem.rate) || 0,
//     taxRate: masterItem?.taxRate ?? 18,
//     mrp: masterItem?.mrp ?? 0,
//     saleRate: masterItem?.saleRate ?? 0,
//     amount: Number(grnItem.total ?? 0) || qty * (Number(grnItem.rate) || 0),
//     isKnownItem: true,
//   };
// }

// export default function PurchaseInvoiceNewPage() {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const toast = useToast();
//   const user = useAuthStore((s) => s.user);
//   const { tabs, activeTabId, addTab, updateTab, markSaved, setActiveTab, closeTab } = useBillingTabStore();
//   const draftsRef = useRef<Record<string, PurchaseInvoiceDraft>>({});
//   const hydratingTabRef = useRef(false);
//   const initTabRef = useRef(false);

//   useEffect(() => {
//     if (initTabRef.current) return;
//     initTabRef.current = true;
//     if (!tabs.some((t) => t.voucherType === 'PURCHASE')) addTab('PURCHASE');
//   }, [tabs, addTab]);

//   useEffect(() => {
//     const purchaseTabs = tabs.filter((t) => t.voucherType === 'PURCHASE');
//     if (purchaseTabs.length === 0) return;
//     if (!activeTabId || !purchaseTabs.some((t) => t.id === activeTabId)) {
//       setActiveTab(purchaseTabs[0].id);
//     }
//   }, [tabs, activeTabId, setActiveTab]);

//   const activePurchaseTabId = tabs.some((t) => t.id === activeTabId && t.voucherType === 'PURCHASE')
//     ? activeTabId
//     : tabs.find((t) => t.voucherType === 'PURCHASE')?.id ?? null;

//   const activeTab = tabs.find((t) => t.id === activePurchaseTabId && t.voucherType === 'PURCHASE');
//   const duplicatePrefill = activeTab?.fromDuplicate ?? null;

//   const [invoiceNo, setInvoiceNo] = useState(() => nextTempPurchaseInvoiceNo());
//   const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
//   const [partyBillNo, setPartyBillNo] = useState('');
//   const [partyBillDate, setPartyBillDate] = useState('');
//   const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('CASH');
//   const [creditPeriod, setCreditPeriod] = useState(30);
//   const [dueDate, setDueDate] = useState('');
//   const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);
//   const setSelectedWarehouse = useWarehouseStore((s) => s.setSelectedWarehouse);

//   const { hasControl } = useAuth();

//   const [items, setItems] = useState<any[]>([]);

//   useEffect(() => {
//     let mounted = true;

//     void (async () => {
//       try {
//         const res = await filterItems({});
//         const mapped = (res.data || []).map(mapApiToItem);
//         if (!mounted) return;
//         if (mapped.length > 0) {
//           setItems(mapped);
//           return;
//         }

//         const fallback = await getAllItems();
//         if (!mounted) return;
//         setItems((fallback.data || []).map(mapApiToItem));
//       } catch (err) {
//         console.error('Fetch items failed:', err);
//         if (mounted) setItems([]);
//       }
//     })();

//     return () => {
//       mounted = false;
//     };
//   }, []);

//   const [selectedSupplier, setSelectedSupplier] = useState<SupplierInfo | null>(() => {
//     if (!duplicatePrefill) return null;
//     return { id: duplicatePrefill.partyId, name: duplicatePrefill.partyName, gstin: '', phone: '', stateCode: '27', address: '' };
//   });
//   const [supplierAddress, setSupplierAddress] = useState('');
//   const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
//   const [narration, setNarration] = useState('');
//   const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
//   const [rows, setRows] = useState<PurchaseRow[]>([emptyPurchaseRow()]);

//   const [saving, setSaving] = useState(false);
//   const [paidAmount, setPaidAmount] = useState(0);
//   const [tcs, setTcs] = useState(0);
//   const [creditSkipped, setCreditSkipped] = useState(false);
//   const [creditApplied, setCreditApplied] = useState(false);
//   const [addCharges, setAddCharges] = useState(0);
//   // console.log("selectedSupplier==>", selectedSupplier)
//   // ✅ Replace with
//   const location = useLocation();
//   const locationState = location.state as any;
//   const editState = locationState as {
//     editMode?: boolean;
//     invoiceId?: string;
//     prefill?: any;
//   } | null;
//   const isEditMode = !!editState?.editMode;
//   const editInvoiceId = editState?.invoiceId ?? null;

//   const [activeItemTab, setActiveItemTab] = useState<ActiveItemTab>('purchase_details');
//   const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
//   const pendingRowRef = useRef<number>(-1);

//   useEffect(() => {
//     if (!activePurchaseTabId) return;
//     hydratingTabRef.current = true;
//     const draft = draftsRef.current[activePurchaseTabId] ?? createEmptyPurchaseInvoiceDraft();
//     draftsRef.current[activePurchaseTabId] = draft;
//     setInvoiceNo(draft.invoiceNo);
//     setDate(draft.date);
//     setPartyBillNo(draft.partyBillNo);
//     setPartyBillDate(draft.partyBillDate);
//     setPurchaseMode(draft.purchaseMode);
//     setCreditPeriod(draft.creditPeriod);
//     setDueDate(draft.dueDate);
//     setSelectedSupplier(draft.selectedSupplier);
//     setSupplierAddress(draft.supplierAddress);
//     setSupplierInvoiceNo(draft.supplierInvoiceNo);
//     setNarration(draft.narration);
//     setSelectedGRN(draft.selectedGRN);
//     setRows(draft.rows.length > 0 ? draft.rows : [emptyPurchaseRow()]);
//     setPaidAmount(draft.paidAmount);
//     setTcs(draft.tcs);
//     setCreditSkipped(draft.creditSkipped);
//     setCreditApplied(draft.creditApplied);
//     setAddCharges(draft.addCharges);
//     setActiveItemTab(draft.activeItemTab);
//     setFocusedRowIndex(draft.focusedRowIndex);
//   }, [activePurchaseTabId]);

//   useEffect(() => {
//     if (!activePurchaseTabId) return;
//     if (hydratingTabRef.current) {
//       hydratingTabRef.current = false;
//       return;
//     }
//     draftsRef.current[activePurchaseTabId] = {
//       invoiceNo,
//       date,
//       partyBillNo,
//       partyBillDate,
//       purchaseMode,
//       creditPeriod,
//       dueDate,
//       selectedSupplier,
//       supplierAddress,
//       supplierInvoiceNo,
//       narration,
//       selectedGRN,
//       rows,
//       paidAmount,
//       tcs,
//       creditSkipped,
//       creditApplied,
//       addCharges,
//       activeItemTab,
//       focusedRowIndex,
//     };
//   }, [
//     activePurchaseTabId,
//     invoiceNo,
//     date,
//     partyBillNo,
//     partyBillDate,
//     purchaseMode,
//     creditPeriod,
//     dueDate,
//     selectedSupplier,
//     supplierAddress,
//     supplierInvoiceNo,
//     narration,
//     selectedGRN,
//     rows,
//     paidAmount,
//     tcs,
//     creditSkipped,
//     creditApplied,
//     addCharges,
//     activeItemTab,
//     focusedRowIndex,
//   ]);

//   const companyStateCode = useCompanyState();
//   const isSameState = isSameStateCheck(selectedSupplier?.stateCode ?? '', companyStateCode);

//   const invoiceGrandTotal = useMemo(() => {
//     const validRows = rows.filter((r) => r.itemName && r.qty > 0);
//     const totalTaxable = validRows.reduce((s, r) => s + r.qty * r.purRate * (1 + r.purExpPct / 100), 0);
//     const totalGST = validRows.reduce((s, r) => s + r.qty * r.purRate * (1 + r.purExpPct / 100) * r.taxRate / 100, 0);
//     return Math.round(totalTaxable + totalGST);
//   }, [rows]);

//   const supplierCreditLimit = useMemo(
//     () => Math.max(0, Number(selectedSupplier?.creditLimit ?? 0) || 0),
//     [selectedSupplier?.creditLimit]
//   );

//   const supplierOpeningBalance = useMemo(
//     () => Number(selectedSupplier?.openingBalance ?? 0) || 0,
//     [selectedSupplier?.openingBalance]
//   );

//   // Available credit = credit_limit + opening_balance (supplier account balance)
//   const supplierAvailableCapacity = useMemo(
//     () => Math.max(0, supplierCreditLimit + supplierOpeningBalance),
//     [supplierCreditLimit, supplierOpeningBalance]
//   );

//   // Maximum credit that can be applied to this invoice
//   const maxApplicableSupplierCredit = useMemo(
//     () => Math.min(supplierAvailableCapacity, invoiceGrandTotal),
//     [supplierAvailableCapacity, invoiceGrandTotal]
//   );

//   const directPaidAmount = purchaseMode === 'CREDIT' ? 0 : paidAmount;
//   const supplierCreditAdjustmentAmount = useMemo(() => {
//     if (purchaseMode === 'CREDIT') {
//       return creditApplied ? invoiceGrandTotal : 0;
//     }
//     return creditApplied ? maxApplicableSupplierCredit : 0;
//   }, [purchaseMode, creditApplied, invoiceGrandTotal, maxApplicableSupplierCredit]);

//   const handleGRNSelect = useCallback(async (grn: GRN | null) => {
//     if (!grn) { setSelectedGRN(null); setRows([emptyPurchaseRow()]); return; }
//     try {
//       const res = await apiGetGRNById(grn.id);
//       const fullGRN = res?.data;
//       if (!fullGRN) { setSelectedGRN(grn); setRows([emptyPurchaseRow()]); return; }
//       const mergedGRN: GRN = {
//         id: fullGRN.id, grnNumber: fullGRN.grnNumber, supplierId: fullGRN.supplierId,
//         supplierName: fullGRN.supplierName,
//         date: fullGRN.date ? new Date(fullGRN.date).toLocaleDateString('en-IN') : grn.date,
//         warehouseName: fullGRN.warehouseName, totalValue: fullGRN.totalValue,
//         items: fullGRN.items ?? [], piCreated: grn.piCreated,
//       };
//       setSelectedGRN(mergedGRN);
//       if (fullGRN.items?.length) setRows(fullGRN.items.map((i: any) => grnItemToPurchaseRow(i, items)));
//       else setRows([emptyPurchaseRow()]);
//     } catch {
//       setSelectedGRN(grn);
//       if (grn.items?.length) setRows(grn.items.map((i: any) => grnItemToPurchaseRow(i, items)));
//       else setRows([emptyPurchaseRow()]);
//     }
//   }, [items]);

//   const handleItemNameSearch = useCallback(async (idx: number, query: string) => {
//     const needle = query.trim().toLowerCase();
//     if (needle.length < 2) return;

//     const localMatch = items.find((item) => {
//       const name = String(item?.name ?? item?.itemName ?? '').toLowerCase();
//       const code = String(item?.code ?? '').toLowerCase();
//       const barcode = String(item?.barcode ?? '').toLowerCase();
//       return name.includes(needle) || code.includes(needle) || barcode.includes(needle);
//     });

//     if (localMatch) {
//       setRows((prev) => prev.map((r, i) =>
//         i === idx ? {
//           ...r,
//           itemId: localMatch.id,
//           itemName: localMatch.name || localMatch.itemName || '',
//           hsnCode: localMatch.hsnCode || localMatch.hsn_code || '',
//           taxRate: Number(localMatch.taxRate ?? localMatch.gst_rate ?? 0),
//           purRate: Number(localMatch.purchaseRate ?? localMatch.purchase_rate ?? 0),
//           mrp: Number(localMatch.mrp ?? 0),
//           saleRate: Number(localMatch.saleRate ?? localMatch.sale_rate ?? 0),
//           itemBarcode: localMatch.barcode || '',
//           unitId: localMatch.unitId || localMatch.primary_unit_id || '',
//           unit: localMatch.unitName || localMatch.unit_name || 'Pcs',
//           group: localMatch.categoryName || localMatch.category || localMatch.group_name || localMatch.group || '',
//           isKnownItem: true,
//         } : r
//       ));
//       return;
//     }

//     try {
//       const res = await fetch(
//         `${BASE_URL}/api/v1/item?search=${encodeURIComponent(query)}`,
//         { headers: { Authorization: `Bearer ${getToken()}` } }
//       );
//       const data = await res.json();
//       const foundItem = data?.data?.[0];
//       if (!foundItem) return;
//       setRows((prev) => prev.map((r, i) =>
//         i === idx ? {
//           ...r,
//           itemId: foundItem.id,
//           itemName: foundItem.name,
//           hsnCode: foundItem.hsn_code || '',
//           taxRate: foundItem.gst_rate || 0,
//           purRate: foundItem.purchase_rate || 0,
//           mrp: foundItem.mrp || 0,
//           saleRate: foundItem.sale_rate || 0,
//           itemBarcode: foundItem.barcode || '',
//           unitId: foundItem.primary_unit_id || '',
//           unit: foundItem.unit_name || 'Pcs',
//           group: foundItem.category_name || foundItem.category || foundItem.group_name || foundItem.group || '',
//           isKnownItem: true,
//         } : r
//       ));
//     } catch (err) {
//       console.error('Search error:', err);
//     }
//   }, [items]);

//   const handleBarcodeSearch = useCallback(async (idx: number, value: string) => {
//     try {
//       const result = await searchItemByBarcode(value);
//       const item = (result as any)?.data ?? result;
//       if (!item) { toast.error('Item not found'); throw new Error('Not found'); }
//       setRows((prev) => prev.map((r, i) =>
//         i === idx ? {
//           ...r,
//           companyBarcode: value,
//           itemId: item.id,
//           itemName: item.name,
//           hsnCode: item.hsn_code || '',
//           taxRate: Number(item.gst_rate) || 0,
//           unitId: item.primary_unit_id || '',
//           unit: item.unit_name || 'Pcs',
//           purRate: Number(item.purchase_rate) || 0,
//           saleRate: Number(item.sale_rate) || 0,
//           mrp: Number(item.mrp) || 0,
//           group: item.category_name || item.category || item.group_name || item.group || '',
//           isKnownItem: true,
//         } : r
//       ));
//       return item;
//     } catch {
//       setRows((prev) => prev.map((r, i) => i === idx ? { ...r, companyBarcode: value, isKnownItem: false } : r));
//       return null;
//     }
//   }, [toast]);

//   const itemOptions = items.map((item) => ({ id: item.id, name: item.name }));

//   // ✅ FIX: Supplier select does NOT clear rows anymore
//   const handleSupplierSelect = useCallback(async (s: SupplierInfo) => {
//     setSelectedSupplier(s);
//     setSupplierAddress(s.address);
//     setSelectedGRN(null);
//     setCreditSkipped(false);
//     setCreditApplied(false);

//     if (activeTabId) {
//       updateTab(activeTabId, { partyId: s.id, partyName: s.name });
//     }
//     // ✅ Do NOT fetch items by supplier name or overwrite rows here
//     // Rows are only populated when user explicitly adds items or selects a GRN
//   }, [activeTabId, updateTab]);

//   const persistCurrentDraft = useCallback(() => {
//     if (!activePurchaseTabId) return;
//     draftsRef.current[activePurchaseTabId] = {
//       invoiceNo,
//       date,
//       partyBillNo,
//       partyBillDate,
//       purchaseMode,
//       creditPeriod,
//       dueDate,
//       selectedSupplier,
//       supplierAddress,
//       supplierInvoiceNo,
//       narration,
//       selectedGRN,
//       rows,
//       paidAmount,
//       tcs,
//       creditSkipped,
//       creditApplied,
//       addCharges,
//       activeItemTab,
//       focusedRowIndex,
//     };
//   }, [
//     activePurchaseTabId,
//     invoiceNo,
//     date,
//     partyBillNo,
//     partyBillDate,
//     purchaseMode,
//     creditPeriod,
//     dueDate,
//     selectedSupplier,
//     supplierAddress,
//     supplierInvoiceNo,
//     narration,
//     selectedGRN,
//     rows,
//     paidAmount,
//     tcs,
//     creditSkipped,
//     creditApplied,
//     addCharges,
//     activeItemTab,
//     focusedRowIndex,
//   ]);

//   const handleSelectTab = useCallback((tabId: string) => {
//     persistCurrentDraft();
//     setActiveTab(tabId);
//   }, [persistCurrentDraft, setActiveTab]);

//   const handleNewTab = useCallback(() => {
//     persistCurrentDraft();
//     addTab('PURCHASE');
//   }, [addTab, persistCurrentDraft]);

//   const handleCloseTab = useCallback((tabId: string, isLastVisibleTab: boolean) => {
//     if (tabId === activePurchaseTabId) {
//       persistCurrentDraft();
//     }
//     closeTab(tabId);
//     if (isLastVisibleTab) {
//       navigate('/purchase/invoices');
//     }
//   }, [activePurchaseTabId, closeTab, navigate, persistCurrentDraft]);

//   useEffect(() => {
//     if (purchaseMode === 'CASH' && creditApplied) {
//       setCreditApplied(false);
//       setCreditSkipped(false);
//     }
//   }, [purchaseMode, creditApplied]);

//   useEffect(() => {
//     if (purchaseMode !== 'CREDIT') return;
//     if (invoiceGrandTotal <= 0 || supplierAvailableCapacity <= 0) {
//       setCreditApplied(false);
//       return;
//     }
//     if (!creditApplied) {
//       setCreditApplied(true);
//       setCreditSkipped(false);
//     }
//   }, [purchaseMode, invoiceGrandTotal, supplierAvailableCapacity, creditApplied]);

//   const handleApplySupplierCredit = useCallback(() => {
//     if (maxApplicableSupplierCredit <= 0) {
//       toast.error('No supplier credit available');
//       setCreditApplied(false);
//       return;
//     }

//     setCreditApplied(true);
//     setCreditSkipped(false);
//   }, [maxApplicableSupplierCredit, toast]);

//   // ── Edit mode: seed form from prefill ────────────────────────────────────
//   useEffect(() => {
//     if (!isEditMode || !editState?.prefill) return;
//     const p = editState.prefill;

//     // Supplier
//     if (p.supplierId && p.supplierName) {
//       setSelectedSupplier({
//         id: p.supplierId,
//         name: p.supplierName,
//         gstin: p.supplierGstin ?? '',
//         phone: p.supplierPhone ?? '',
//         stateCode: p.supplierStateCode ?? '',
//         address: p.supplierAddress ?? '',
//         creditLimit: p.creditLimit ?? 0,
//         openingBalance: p.openingBalance ?? 0,
//       });
//       setSupplierAddress(p.supplierAddress ?? '');
//     }

//     // Warehouse
//     if (p.warehouseId) {
//       setSelectedWarehouse(p.warehouseId, p.warehouseName ?? '');
//     }

//     // Header fields
//     if (p.supplierInvoiceNo) setSupplierInvoiceNo(p.supplierInvoiceNo);
//     if (p.invoiceDate) setDate(p.invoiceDate.slice(0, 10));
//     if (p.notes) setNarration(p.notes);
//     if (p.purchaseMode) setPurchaseMode(p.purchaseMode);

//     // Items
//     if (Array.isArray(p.items) && p.items.length > 0) {
//       setRows(
//         p.items.map((item: any) => ({
//           ...emptyPurchaseRow(),
//           itemId: item.itemId ?? '',
//           itemName: item.itemName ?? '',
//           hsnCode: item.hsnCode ?? '',
//           qty: Number(item.qty ?? 0),
//           unit: item.unit ?? 'Pcs',
//           unitId: item.unitId ?? '',
//           purRate: Number(item.purRate ?? item.rate ?? item.purchase_rate ?? 0),
//           taxRate: Number(item.taxRate ?? item.gst_rate ?? item.tax_rate ?? 18),
//           mrp: Number(item.mrp ?? 0),
//           saleRate: Number(item.saleRate ?? 0),
//           amount: Number(item.qty ?? 0) * Number(item.rate ?? 0),
//           purExpPct: Number(item.purExpPct ?? item.pur_exp_pct ?? 0),
//           isKnownItem: true,
//         }))
//       );
//     }
//   }, []);

//   const handleRemoveSupplierCredit = useCallback(() => {
//     setCreditApplied(false);
//     setCreditSkipped(true);
//   }, []);

//   useEffect(() => {
//     if (activeTabId) updateTab(activeTabId, { isDirty: rows.some((r) => r.itemName !== '') || !!selectedSupplier });
//   }, [rows, selectedSupplier]); // eslint-disable-line

//   // GRN from location state
//   // useEffect(() => {
//   //   const fromGRN = locationState?.fromGRN;
//   //   if (!fromGRN) return;
//   //   if (fromGRN.supplier) {
//   //     setSelectedSupplier(fromGRN.supplier);
//   //     setSupplierAddress(fromGRN.supplier.address ?? '');
//   //     if (activeTabId) updateTab(activeTabId, { partyId: fromGRN.supplier.id, partyName: fromGRN.supplier.name });
//   //   }
//   //   if (fromGRN.warehouseId) setSelectedWarehouse(fromGRN.warehouseId, fromGRN.warehouseName ?? '')
//   //   if (fromGRN.grnId) {
//   //     setSelectedGRN({
//   //       id: fromGRN.grnId, grnNumber: fromGRN.grnNumber,
//   //       supplierId: fromGRN.supplierId, supplierName: fromGRN.supplierName,
//   //       warehouseName: fromGRN.warehouseName, date: '', totalValue: 0,
//   //       items: fromGRN.items ?? [], piCreated: false,
//   //     });
//   //   }
//   //   if (fromGRN.items?.length) setRows(fromGRN.items.map((i: any) => grnItemToPurchaseRow(i, items)));
//   // }, [locationState]); // eslint-disable-line

//   // ── GRN from location state ───────────────────────────────────────────────
//   useEffect(() => {
//     const fromGRN = locationState?.fromGRN;
//     if (!fromGRN) return;
//     console.log("fromGRN =>", fromGRN)
//     if (fromGRN.supplier) {
//       setSelectedSupplier({
//         ...fromGRN.supplier,
//         creditLimit: fromGRN?.supplier?.credit_limit ?? 0,
//         openingBalance: fromGRN?.supplier?.opening_balance ?? 0,
//       });
//       setSupplierAddress(fromGRN?.supplier?.address ?? '');
//       if (activeTabId) updateTab(activeTabId, {
//         partyId: fromGRN.supplier.id,
//         partyName: fromGRN.supplier.name,
//       });
//     }

//     // ✅ Fixed: use setSelectedWarehouse(id, name) — not setSelectedWarehouseId
//     if (fromGRN.warehouseId) {
//       setSelectedWarehouse(fromGRN.warehouseId, fromGRN.warehouseName ?? '');
//     }

//     if (fromGRN.grnId) {
//       setSelectedGRN({
//         id: fromGRN.grnId,
//         grnNumber: fromGRN.grnNumber,
//         supplierId: fromGRN.supplierId,
//         supplierName: fromGRN.supplierName,
//         warehouseName: fromGRN.warehouseName,
//         date: '',
//         totalValue: 0,
//         items: fromGRN.items ?? [],
//         piCreated: false,
//       });
//     }

//     if (fromGRN.items?.length) {
//       setRows(fromGRN.items.map((i: any) => grnItemToPurchaseRow(i, items)));
//     }
//   }, [locationState, locationState?.fromGRN]);

//   // GRN from URL params
//   useEffect(() => {
//     const grnId = searchParams.get('grnId');
//     if (!grnId) return;
//     apiGetGRNById(grnId).then((res) => {
//       if (res?.data) {
//         setSelectedGRN(res.data as GRN);
//         if (res.data.items?.length) setRows(res.data.items.map((i: any) => grnItemToPurchaseRow(i, items)));
//       }
//     }).catch(console.error);
//   }, [searchParams, items]);

//   // Duplicate prefill
//   useEffect(() => {
//     if (activeTabId && duplicatePrefill) {
//       updateTab(activeTabId, { fromDuplicate: undefined, partyName: `${duplicatePrefill.partyName} (Copy)` });
//       toast.success('Invoice duplicated — review and save');
//     }
//   }, []); // eslint-disable-line

//   const handlePurchaseDetailsComplete = useCallback((rowIdx: number) => {
//     pendingRowRef.current = rowIdx;
//     setActiveItemTab('item_details');
//     setFocusedRowIndex(rowIdx);
//     setTimeout(() => {
//       const el = document.querySelector<HTMLElement>(`[data-id-row="${rowIdx}"][data-id-col="itemBarcode"]`);
//       if (el) el.focus();
//     }, 60);
//   }, []);

//   const handleItemDetailsComplete = useCallback((rowIdx: number) => {
//     setRows((prev) => {
//       const newRows = [...prev, emptyPurchaseRow()];
//       const newIdx = newRows.length - 1;
//       setTimeout(() => {
//         setActiveItemTab('purchase_details');
//         setFocusedRowIndex(newIdx);
//         setTimeout(() => {
//           const el = document.querySelector<HTMLElement>(`[data-pd-row="${newIdx}"][data-pd-col="companyBarcode"]`);
//           if (el) el.focus();
//         }, 60);
//       }, 20);
//       return newRows;
//     });
//   }, []);

//   const handleSave = useCallback(async (andNew = false) => {
//     if (!selectedSupplier) { toast.error('Please select a supplier'); return; }
//     // ✅ FIX: removed unitId requirement — save with available data
//     const validRows = rows.filter((r) => r.itemName && r.qty > 0);
//     if (validRows.length === 0) { toast.error('Add at least one item with quantity'); return; }

//     if (purchaseMode === 'CREDIT') {
//       if (supplierAvailableCapacity < invoiceGrandTotal) {
//         toast.error(
//           `Credit mode requires full payment by supplier credit. Available: Rs ${supplierAvailableCapacity.toLocaleString('en-IN')}, invoice: Rs ${invoiceGrandTotal.toLocaleString('en-IN')}.`
//         );
//         return;
//       }
//       if (!creditApplied) {
//         toast.error('Enable Use Credit to complete payment in Credit mode.');
//         return;
//       }
//     }

//     setSaving(true);
//     try {
//       let savedWithBarcode = 0, savedWithoutBarcode = 0;
//       const updatedRows = rows.map((row) => {
//         if (!row.itemName) return row;
//         const finalBarcode: string | null = row.itemBarcode || row.companyBarcode || null;
//         if (finalBarcode) savedWithBarcode++; else savedWithoutBarcode++;
//         const barcode = finalBarcode ?? generateEAN13();
//         return { ...row, companyBarcode: barcode, barcodeGenerated: generateBarcodeSVG(barcode) };
//       });
//       setRows(updatedRows);

//       if (activeTabId) markSaved(activeTabId, invoiceNo);

//       const payload = {
//         supplierId: selectedSupplier.id,
//         warehouseId: selectedWarehouseId,
//         grnId: selectedGRN?.id || null,
//         supplierInvoiceNo: supplierInvoiceNo || partyBillNo,
//         invoiceDate: date,
//         isSameState,
//         items: updatedRows
//           .filter((r) => r.itemName && r.qty > 0)
//           .map((r) => ({
//             itemId: r.itemId,
//             itemName: r.itemName,
//             hsnCode: r.hsnCode,
//             qty: Number(r.qty),
//             unitId: r.unitId || null,
//             rate: Number(r.purRate) || 0,
//             discountPct: Number(r.saleDisPct || 0),
//             taxRate: Number(r.taxRate || 0),
//           })),
//         discountAmount: 0,
//         roundOff: 0,
//         paidAmount: directPaidAmount,
//         creditAdjustment: supplierCreditAdjustmentAmount,
//         notes: narration,
//       };

//       // ── UPDATE path ──────────────────────────────────────────────────────
//       if (isEditMode && editInvoiceId) {
//         const res = await fetch(`${BASE_URL}/api/v1/purchase-invoice/${editInvoiceId}`, {
//           method: 'PUT',
//           headers: authHeaders(),
//           body: JSON.stringify(payload),
//         });
//         const data = await res.json();
//         if (!res.ok) throw new Error(data?.message || 'Failed to update invoice');

//         toast.success('Invoice updated successfully');
//         navigate('/purchase/invoices');
//         return;
//       }

//       // ── CREATE path ──────────────────────────────────────────────────────
//       const res = await fetch(`${BASE_URL}/api/v1/purchase-invoice/`, {
//         method: 'POST',
//         headers: authHeaders(),
//         body: JSON.stringify(payload),
//       });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data?.message || 'Failed to create invoice');

//       const toastMsg = selectedGRN
//         ? `Invoice ${invoiceNo} saved! Linked to ${selectedGRN.grnNumber}.`
//         : savedWithoutBarcode > 0
//           ? `Invoice ${invoiceNo} saved! ${savedWithBarcode} with barcode, ${savedWithoutBarcode} without.`
//           : `Invoice ${invoiceNo} saved! All ${savedWithBarcode} item${savedWithBarcode !== 1 ? 's' : ''} saved.`;
//       toast.success(toastMsg);

//       if (andNew) {
//         setRows([emptyPurchaseRow()]);
//         setSelectedSupplier(null);
//         setSupplierAddress('');
//         setSupplierInvoiceNo('');
//         setPartyBillNo('');
//         setPartyBillDate('');
//         setNarration('');
//         setTcs(0);
//         setPaidAmount(0);
//         setAddCharges(0);
//         setCreditApplied(false);
//         setCreditSkipped(false);
//         setActiveItemTab('purchase_details');
//         setFocusedRowIndex(-1);
//         setSelectedGRN(null);
//       } else {
//         navigate('/purchase/invoices');
//       }
//     } catch (err: any) {
//       toast.error(err?.message || 'Failed to save');
//     } finally {
//       setSaving(false);
//     }
//   }, [
//     selectedSupplier,
//     rows,
//     invoiceNo,
//     activeTabId,
//     navigate,
//     toast,
//     markSaved,
//     selectedGRN,
//     date,
//     selectedWarehouseId,
//     supplierInvoiceNo,
//     partyBillNo,
//     purchaseMode,
//     paidAmount,
//     directPaidAmount,
//     supplierCreditAdjustmentAmount,
//     supplierAvailableCapacity,
//     invoiceGrandTotal,
//     creditApplied,
//     narration,
//     isSameState,
//     isEditMode,
//     editInvoiceId,
//   ]);

//   void user;

//   return (
//     <AppLayout>
//       <div className="flex flex-col h-full">
//         <BillingTabBar
//           voucherType="PURCHASE"
//           onNewTab={handleNewTab}
//           onSelectTab={handleSelectTab}
//           onCloseTab={handleCloseTab}
//         />

//         <div className="flex-1 overflow-y-auto bg-[#f8fafc] pb-16">
//           <div className="flex items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-[#e2e8f0]">
//             <div className="flex items-center gap-3">
//               <div>
//                 <h1 className="text-base font-bold text-[#1e293b]">
//                   {isEditMode ? 'Edit Purchase Invoice' : 'New Purchase Invoice'}
//                 </h1>
//                 <p className="text-xs text-slate-400">{invoiceNo}</p>
//               </div>
//               {selectedGRN && (
//                 <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
//                   <i className="ri-inbox-archive-line text-xs" />Linked: {selectedGRN.grnNumber}
//                 </span>
//               )}
//               {activeTab?.isDirty && (
//                 <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
//                   <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />Unsaved
//                 </span>
//               )}
//             </div>
//             <div className="flex items-center gap-2">
//               {!isEditMode && (<button onClick={() => handleSave(true)} disabled={saving}
//                 className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-50 cursor-pointer whitespace-nowrap transition-colors">
//                 <i className="ri-save-line text-xs" /> Save &amp; New <kbd className="text-[10px] bg-[#e2e8f0] px-1 rounded ml-0.5">F8</kbd>
//               </button>)}
//               <button onClick={() => handleSave(false)} disabled={saving}
//                 className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap transition-colors">
//                 {saving
//                   ? <><i className="ri-loader-4-line animate-spin" /> Saving...</>
//                   : <><i className="ri-save-3-line" /> {isEditMode ? 'Update' : 'Save'} <kbd className="text-[10px] bg-white/20 px-1 rounded ml-0.5">F9</kbd></>
//                 }
//               </button>
//             </div>
//           </div>

//           {/* Items section */}
//           <div className="px-5 pt-4">
//             <div className="flex items-center justify-between mb-1.5 px-1">
//               <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Items</span>
//               <span className="text-xs text-slate-400">
//                 {selectedGRN ? (
//                   <span className="flex items-center gap-1 text-indigo-600 font-medium">
//                     <i className="ri-inbox-archive-line" />Items pre-filled from {selectedGRN.grnNumber} · {selectedGRN.supplierName} · {selectedGRN.date}
//                   </span>
//                 ) : (
//                   <><i className="ri-barcode-line mr-1" />Scan barcode or type · Enter / Arrow keys to navigate</>
//                 )}
//               </span>
//             </div>

//             <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-visible">
//               <div className="flex items-center gap-0 border-b border-[#e2e8f0] bg-slate-50 px-3 pt-2">
//                 <button type="button" onClick={() => setActiveItemTab('purchase_details')}
//                   className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors cursor-pointer whitespace-nowrap ${activeItemTab === 'purchase_details' ? 'bg-white border-[#e2e8f0] text-[#4f46e5]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'}`}>
//                   <i className="ri-barcode-box-line" />Purchase Details
//                 </button>
//                 <button type="button" onClick={() => setActiveItemTab('item_details')}
//                   className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors cursor-pointer whitespace-nowrap ml-1 ${activeItemTab === 'item_details' ? 'bg-white border-[#e2e8f0] text-[#4f46e5]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'}`}>
//                   <i className="ri-list-check-2" />Item Details
//                 </button>
//                 <div className="ml-auto flex items-center gap-2 pb-1.5">
//                   <span className="text-xs text-slate-400">{rows.filter((r) => r.itemName).length} item{rows.filter((r) => r.itemName).length !== 1 ? 's' : ''}</span>
//                   <button type="button" onClick={() => setRows((prev) => [...prev, emptyPurchaseRow()])}
//                     className="flex items-center gap-1 h-6 px-2 text-xs text-[#4f46e5] border border-indigo-200 rounded hover:bg-indigo-50 cursor-pointer whitespace-nowrap transition-colors">
//                     <i className="ri-add-line" /> Add Row
//                   </button>
//                 </div>
//               </div>

//               <div className="overflow-x-auto">
//                 <div className={activeItemTab === 'purchase_details' ? '' : 'hidden'}>
//                   <PurchaseDetailsTab
//                     rows={rows}
//                     onChange={setRows}
//                     onRowComplete={handlePurchaseDetailsComplete}
//                     focusedRowIndex={focusedRowIndex}
//                     setFocusedRowIndex={setFocusedRowIndex}
//                     onBarcodeEnter={handleBarcodeSearch}
//                     itemOptions={itemOptions}
//                     onItemSelect={handleItemNameSearch}
//                   />
//                 </div>
//                 <div className={activeItemTab === 'item_details' ? '' : 'hidden'}>
//                   <ItemDetailsTab
//                     rows={rows}
//                     onChange={setRows}
//                     onRowComplete={handleItemDetailsComplete}
//                     focusedRowIndex={focusedRowIndex}
//                     setFocusedRowIndex={setFocusedRowIndex}
//                     items={items}
//                   />
//                 </div>
//               </div>

//               <div className="border-t border-[#f1f5f9] px-4 py-2">
//                 <button type="button" onClick={() => setRows((prev) => [...prev, emptyPurchaseRow()])}
//                   className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#4f46e5] transition-colors cursor-pointer">
//                   <i className="ri-add-circle-line" />Add another row
//                 </button>
//               </div>
//             </div>
//           </div>

//           <div className="px-5 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
//             <div className="flex flex-col gap-0">
//               <SupplierSection
//                 selected={selectedSupplier}
//                 onSelect={handleSupplierSelect}
//                 address={supplierAddress}
//                 onAddressChange={setSupplierAddress}
//                 supplierInvoiceNo={supplierInvoiceNo}
//                 onSupplierInvoiceNoChange={setSupplierInvoiceNo}
//               />
//               {selectedSupplier && (
//                 <GRNSelector supplierId={selectedSupplier.id} selectedGRNId={selectedGRN?.id ?? null} onSelect={handleGRNSelect} />
//               )}
//             </div>

//             <PurchaseInvoiceSummary
//               rows={rows} isSameState={isSameState} tcs={tcs} addCharges={addCharges}
//               onTcsChange={setTcs} onAddChargesChange={setAddCharges} linkedGRN={
//                 selectedGRN
//                   ? {
//                     id: selectedGRN.id,
//                     supplierId: selectedGRN.supplierId,
//                     supplierName: selectedGRN.supplierName,
//                     grnNumber: selectedGRN.grnNumber,
//                     date: selectedGRN.date,
//                   }
//                   : null
//               }
//               paidAmount={0}
//             />

//             <PurchaseInvoiceInfo
//               invoiceNo={invoiceNo} date={date} partyBillNo={partyBillNo} partyBillDate={partyBillDate}
//               purchaseMode={purchaseMode} creditPeriod={creditPeriod} dueDate={dueDate}
//               isSameState={isSameState}
//               grandTotal={invoiceGrandTotal}
//               supplierCreditLimit={supplierCreditLimit}
//               supplierOpeningBalance={supplierOpeningBalance}
//               supplierCreditAvailable={supplierAvailableCapacity}
//               supplierCreditAppliedAmount={supplierCreditAdjustmentAmount}
//               creditApplied={creditApplied}
//               onDateChange={setDate} onPartyBillNoChange={setPartyBillNo} onPartyBillDateChange={setPartyBillDate}
//               onPurchaseModeChange={setPurchaseMode} onCreditPeriodChange={setCreditPeriod}
//               onDueDateChange={setDueDate}
//               onApplyCreditAdjustment={handleApplySupplierCredit}
//               onRemoveCreditAdjustment={handleRemoveSupplierCredit}
//               onPaymentChange={setPaidAmount}
//             />
//           </div>

//           <div className="px-5 pt-4">
//             <div className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 flex items-center gap-3">
//               <label className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">Narration</label>
//               <input type="text" value={narration} onChange={(e) => setNarration(e.target.value)}
//                 placeholder="Optional purchase note..."
//                 className="flex-1 h-8 px-2 text-sm bg-transparent focus:outline-none text-[#1e293b] placeholder:text-slate-400" />
//             </div>
//           </div>
//         </div>

//         <ShortcutBar onSave={() => handleSave(false)} onSaveAndNew={() => handleSave(true)} onBack={() => navigate('/purchase/invoices')} saving={saving} />
//       </div>
//     </AppLayout>
//   );
// }

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import AppLayout from '@/components/feature/AppLayout';
import ShortcutBar from '@/components/feature/ShortcutBar';
import BillingTabBar from '@/pages/billing/components/BillingTabBar';
import { useBillingTabStore } from '@/stores/billingTabStore';
import { useToast } from '@/contexts/ToastContext';
import { isSameStateCheck } from '@/utils/gst';
import { emptyPurchaseRow, type PurchaseRow } from '@/types/billing';
import PurchaseDetailsTab from './components/PurchaseDetailsTab';
import ItemDetailsTab from './components/ItemDetailsTab';
import PurchaseInvoiceSummary from './components/PurchaseInvoiceSummary';
import SupplierSection, {
  type SupplierInfo,
} from './components/SupplierSection';
import PurchaseInvoiceInfo, {
  type PurchaseMode,
} from './components/PurchaseInvoiceInfo';
import GRNSelector, { type GRN } from './components/GRNSelector';
import { useCompanyState } from '@/hooks/useCompanyState';
import {
  filterItems,
  getAllItems,
  mapApiToItem,
  searchItemByBarcode,
} from '@/api/item.api';
import { useWarehouseStore } from '@/stores/warehouseStore';
import { useAuth } from '@/contexts/AuthContext';
import { apiGetGRNById } from '@/api/grn.api';

const BASE_URL =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost:7000';

function getToken(): string {
  return localStorage.getItem('token') ?? '';
}
function authHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

// ─── Voucher type for this page ───────────────────────────────────────────────
const VOUCHER_TYPE = 'PURCHASEINVOICE' as const;

// ─── Invoice number counter ───────────────────────────────────────────────────
let piCounter = 10;
const nextTempInvoiceNo = () =>
  `PINV-${new Date().getFullYear()}-00${piCounter++}`;

// ─── Draft type ───────────────────────────────────────────────────────────────
type ActiveItemTab = 'purchase_details' | 'item_details';

interface PurchaseInvoiceDraft {
  invoiceNo: string;
  date: string;
  partyBillNo: string;
  partyBillDate: string;
  purchaseMode: PurchaseMode;
  creditPeriod: number;
  dueDate: string;
  selectedSupplier: SupplierInfo | null;
  supplierAddress: string;
  supplierInvoiceNo: string;
  narration: string;
  selectedGRN: GRN | null;
  rows: PurchaseRow[];
  paidAmount: number;
  tcs: number;
  creditSkipped: boolean;
  creditApplied: boolean;
  addCharges: number;
  activeItemTab: ActiveItemTab;
  focusedRowIndex: number;
}

const createFreshDraft = (): PurchaseInvoiceDraft => ({
  invoiceNo: nextTempInvoiceNo(),
  date: new Date().toISOString().split('T')[0],
  partyBillNo: '',
  partyBillDate: '',
  purchaseMode: 'CASH',
  creditPeriod: 30,
  dueDate: '',
  selectedSupplier: null,
  supplierAddress: '',
  supplierInvoiceNo: '',
  narration: '',
  selectedGRN: null,
  rows: [emptyPurchaseRow()],
  paidAmount: 0,
  tcs: 0,
  creditSkipped: false,
  creditApplied: false,
  addCharges: 0,
  activeItemTab: 'purchase_details',
  focusedRowIndex: -1,
});

// ─── Module-level draft store — survives unmount / sidebar navigation ─────────
const DRAFT_STORE = new Map<string, PurchaseInvoiceDraft>();

// ─── Barcode helpers ──────────────────────────────────────────────────────────
function generateEAN13(): string {
  const digits = Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 10),
  );
  const sum = digits.reduce((s, d, i) => s + d * (i % 2 === 0 ? 1 : 3), 0);
  return [...digits, (10 - (sum % 10)) % 10].join('');
}

function generateBarcodeSVG(code: string): string {
  const bw = 2,
    h = 60,
    qz = 10;
  const bars: string[] = [];
  let x = qz;
  for (let i = 0; i < code.length; i++) {
    const p = (code.charCodeAt(i) % 4) + 1;
    bars.push(
      `<rect x="${x}" y="0" width="${bw * p}" height="${h}" fill="black"/>`,
    );
    x += bw * p + bw;
  }
  const w = x + qz;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h + 20}" viewBox="0 0 ${w} ${h + 20}">
    <rect width="${w}" height="${h + 20}" fill="white"/>${bars.join('')}
    <text x="${w / 2}" y="${h + 15}" text-anchor="middle" font-size="10" font-family="monospace">${code}</text>
  </svg>`;
}

function grnItemToPurchaseRow(grnItem: any, items: any[]): PurchaseRow {
  const master = items.find((i) => i.id === grnItem.itemId);
  const qty = Number(grnItem.quantity ?? grnItem.qty ?? 0);
  return {
    ...emptyPurchaseRow(),
    itemId: grnItem.itemId ?? '',
    itemName: grnItem.itemName ?? '',
    hsnCode: grnItem.hsnCode ?? '',
    companyBarcode: grnItem.companyBarcode ?? grnItem.barcode ?? '',
    itemBarcode: grnItem.barcode ?? '',
    qty,
    unit: grnItem.unitName ?? grnItem.unit ?? '',
    unitId: master?.unitId ?? '',
    purRate: Number(grnItem.rate) || 0,
    taxRate: master?.taxRate ?? 0,
    mrp: master?.mrp ?? 0,
    saleRate: master?.saleRate ?? 0,
    amount: Number(grnItem.total ?? 0) || qty * (Number(grnItem.rate) || 0),
    isKnownItem: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
export default function PurchaseInvoiceNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const location = useLocation();
  const locationState = location.state as any;

  const { hasControl } = useAuth();
  const {
    tabs,
    activeTabId,
    addTab,
    updateTab,
    markSaved,
    setActiveTab,
    closeTab,
  } = useBillingTabStore();

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const hydratingRef = useRef(false);
  const latestDraftRef = useRef<PurchaseInvoiceDraft | null>(null);
  const activePurchaseTabIdRef = useRef<string | null>(null);
  const initTabRef = useRef(false);

  // ─── Ensure at least one PURCHASEINVOICE tab ──────────────────────────────
  useEffect(() => {
    if (initTabRef.current) return;
    initTabRef.current = true;
    if (!tabs.some((t) => t.voucherType === VOUCHER_TYPE)) addTab(VOUCHER_TYPE);
  }, [tabs, addTab]);

  useEffect(() => {
    const purchaseTabs = tabs.filter((t) => t.voucherType === VOUCHER_TYPE);
    if (!purchaseTabs.length) return;
    if (!activeTabId || !purchaseTabs.some((t) => t.id === activeTabId)) {
      setActiveTab(purchaseTabs[0].id);
    }
  }, [tabs, activeTabId, setActiveTab]);

  const activePurchaseTabId = tabs.some(
    (t) => t.id === activeTabId && t.voucherType === VOUCHER_TYPE,
  )
    ? activeTabId
    : (tabs.find((t) => t.voucherType === VOUCHER_TYPE)?.id ?? null);

  const activeTab = tabs.find(
    (t) => t.id === activePurchaseTabId && t.voucherType === VOUCHER_TYPE,
  );
  const duplicatePrefill = activeTab?.fromDuplicate ?? null;

  // ─── Edit mode ────────────────────────────────────────────────────────────
  const editState = locationState as {
    editMode?: boolean;
    invoiceId?: string;
    prefill?: any;
  } | null;
  const isEditMode = !!editState?.editMode;
  const editInvoiceId = editState?.invoiceId ?? null;

  // ─── Form state ───────────────────────────────────────────────────────────
  const [invoiceNo, setInvoiceNo] = useState(() => nextTempInvoiceNo());
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyBillNo, setPartyBillNo] = useState('');
  const [partyBillDate, setPartyBillDate] = useState('');
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>('CASH');
  const [creditPeriod, setCreditPeriod] = useState(30);
  const [dueDate, setDueDate] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierInfo | null>(
    () => {
      if (!duplicatePrefill) return null;
      return {
        id: duplicatePrefill.partyId,
        name: duplicatePrefill.partyName,
        gstin: '',
        phone: '',
        stateCode: '27',
        address: '',
      };
    },
  );
  const [supplierAddress, setSupplierAddress] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [narration, setNarration] = useState('');
  const [selectedGRN, setSelectedGRN] = useState<GRN | null>(null);
  const [rows, setRows] = useState<PurchaseRow[]>([emptyPurchaseRow()]);
  const [saving, setSaving] = useState(false);
  const [paidAmount, setPaidAmount] = useState(0);
  const [tcs, setTcs] = useState(0);
  const [creditSkipped, setCreditSkipped] = useState(false);
  const [creditApplied, setCreditApplied] = useState(false);
  const [addCharges, setAddCharges] = useState(0);
  const [activeItemTab, setActiveItemTab] =
    useState<ActiveItemTab>('purchase_details');
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const pendingRowRef = useRef<number>(-1);

  const selectedWarehouseId = useWarehouseStore((s) => s.selectedWarehouseId);
  const setSelectedWarehouse = useWarehouseStore((s) => s.setSelectedWarehouse);

  // ─── Items master list ────────────────────────────────────────────────────
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const warehouseParam =
          selectedWarehouseId && selectedWarehouseId !== 'ALL'
            ? selectedWarehouseId
            : undefined;
        const res = await filterItems({ warehouseId: warehouseParam });
        const mapped = (res.data || []).map(mapApiToItem);
        if (!mounted) return;
        setItems(mapped);
      } catch {
        if (mounted) setItems([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedWarehouseId]);

  const itemOptions = useMemo(
    () => items.map((i) => ({ id: i.id, name: i.name })),
    [items],
  );

  // ─── GST ──────────────────────────────────────────────────────────────────
  const companyStateCode = useCompanyState();
  const isSameState = isSameStateCheck(
    selectedSupplier?.stateCode ?? '',
    companyStateCode,
  );

  // ─── Derived totals ───────────────────────────────────────────────────────
  const invoiceGrandTotal = useMemo(() => {
    const v = rows.filter((r) => r.itemName && r.qty > 0);
    const t = v.reduce(
      (s, r) => s + r.qty * r.purRate * (1 + r.purExpPct / 100),
      0,
    );
    const g = v.reduce(
      (s, r) =>
        s + (r.qty * r.purRate * (1 + r.purExpPct / 100) * r.taxRate) / 100,
      0,
    );
    return Math.round(t + g);
  }, [rows]);

  const supplierCreditLimit = useMemo(
    () => Math.max(0, Number(selectedSupplier?.creditLimit ?? 0) || 0),
    [selectedSupplier?.creditLimit],
  );
  const supplierOpeningBalance = useMemo(
    () => Number(selectedSupplier?.openingBalance ?? 0) || 0,
    [selectedSupplier?.openingBalance],
  );
  const supplierAvailableCapacity = useMemo(
    () => Math.max(0, supplierCreditLimit + supplierOpeningBalance),
    [supplierCreditLimit, supplierOpeningBalance],
  );
  const maxApplicableSupplierCredit = useMemo(
    () => Math.min(supplierAvailableCapacity, invoiceGrandTotal),
    [supplierAvailableCapacity, invoiceGrandTotal],
  );
  const directPaidAmount = purchaseMode === 'CREDIT' ? 0 : paidAmount;
  const supplierCreditAdjustmentAmount = useMemo(() => {
    if (purchaseMode === 'CREDIT') return creditApplied ? invoiceGrandTotal : 0;
    return creditApplied ? maxApplicableSupplierCredit : 0;
  }, [
    purchaseMode,
    creditApplied,
    invoiceGrandTotal,
    maxApplicableSupplierCredit,
  ]);

  // ─── Draft: latestDraftRef — updated every render, no deps (intentional) ──
  useEffect(() => {
    latestDraftRef.current = {
      invoiceNo,
      date,
      partyBillNo,
      partyBillDate,
      purchaseMode,
      creditPeriod,
      dueDate,
      selectedSupplier,
      supplierAddress,
      supplierInvoiceNo,
      narration,
      selectedGRN,
      rows,
      paidAmount,
      tcs,
      creditSkipped,
      creditApplied,
      addCharges,
      activeItemTab,
      focusedRowIndex,
    };
  });

  // ─── Draft: activePurchaseTabIdRef — updated every render, no deps ────────
  // Falls back to raw activeTabId when derived value is null during navigation
  useEffect(() => {
    const derived = activePurchaseTabId;
    const rawIsMine = tabs.some(
      (t) => t.id === activeTabId && t.voucherType === VOUCHER_TYPE,
    );
    activePurchaseTabIdRef.current =
      derived ?? (rawIsMine ? activeTabId : null);
  });

  // ─── Draft: snapshot on unmount — immune to stale closure ────────────────
  useEffect(() => {
    return () => {
      const tabId = activePurchaseTabIdRef.current;
      const draft = latestDraftRef.current;
      if (tabId && draft) DRAFT_STORE.set(tabId, draft);
    };
  }, []); // empty = runs only on unmount

  // ─── Draft: apply saved draft to form state ───────────────────────────────
  const applyDraft = useCallback((draft: PurchaseInvoiceDraft) => {
    setInvoiceNo(draft.invoiceNo);
    setDate(draft.date);
    setPartyBillNo(draft.partyBillNo);
    setPartyBillDate(draft.partyBillDate);
    setPurchaseMode(draft.purchaseMode);
    setCreditPeriod(draft.creditPeriod);
    setDueDate(draft.dueDate);
    setSelectedSupplier(draft.selectedSupplier);
    setSupplierAddress(draft.supplierAddress);
    setSupplierInvoiceNo(draft.supplierInvoiceNo);
    setNarration(draft.narration);
    setSelectedGRN(draft.selectedGRN);
    setRows(draft.rows.length > 0 ? draft.rows : [emptyPurchaseRow()]);
    setPaidAmount(draft.paidAmount);
    setTcs(draft.tcs);
    setCreditSkipped(draft.creditSkipped);
    setCreditApplied(draft.creditApplied);
    setAddCharges(draft.addCharges);
    setActiveItemTab(draft.activeItemTab);
    setFocusedRowIndex(draft.focusedRowIndex);
  }, []);

  // ─── Draft: hydrate when active tab changes or component mounts ───────────
  useEffect(() => {
    if (!activePurchaseTabId) return;
    hydratingRef.current = true;
    const saved = DRAFT_STORE.get(activePurchaseTabId);
    if (saved) {
      applyDraft(saved);
    } else {
      const fresh = createFreshDraft();
      DRAFT_STORE.set(activePurchaseTabId, fresh);
      applyDraft(fresh);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePurchaseTabId]);

  // ─── Draft: auto-save on every state change ───────────────────────────────
  useEffect(() => {
    if (!activePurchaseTabId) return;
    if (hydratingRef.current) {
      hydratingRef.current = false;
      return;
    }
    if (latestDraftRef.current)
      DRAFT_STORE.set(activePurchaseTabId, latestDraftRef.current);
  }, [
    activePurchaseTabId,
    invoiceNo,
    date,
    partyBillNo,
    partyBillDate,
    purchaseMode,
    creditPeriod,
    dueDate,
    selectedSupplier,
    supplierAddress,
    supplierInvoiceNo,
    narration,
    selectedGRN,
    rows,
    paidAmount,
    tcs,
    creditSkipped,
    creditApplied,
    addCharges,
    activeItemTab,
    focusedRowIndex,
  ]);

  // ─── snapshotDraft — reads from refs, never stale ────────────────────────
  const snapshotDraft = useCallback(() => {
    const tabId = activePurchaseTabIdRef.current;
    const draft = latestDraftRef.current;
    if (tabId && draft) DRAFT_STORE.set(tabId, draft);
  }, []);

  // ─── Tab dirty tracking ───────────────────────────────────────────────────
  useEffect(() => {
    if (activeTabId)
      updateTab(activeTabId, {
        isDirty: rows.some((r) => r.itemName !== '') || !!selectedSupplier,
      });
  }, [rows, selectedSupplier]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Credit side-effects ──────────────────────────────────────────────────
  useEffect(() => {
    if (purchaseMode === 'CASH' && creditApplied) {
      setCreditApplied(false);
      setCreditSkipped(false);
    }
  }, [purchaseMode, creditApplied]);

  useEffect(() => {
    if (purchaseMode !== 'CREDIT') return;
    if (invoiceGrandTotal <= 0 || supplierAvailableCapacity <= 0) {
      setCreditApplied(false);
      return;
    }
    if (!creditApplied) {
      setCreditApplied(true);
      setCreditSkipped(false);
    }
  }, [
    purchaseMode,
    invoiceGrandTotal,
    supplierAvailableCapacity,
    creditApplied,
  ]);

  // ─── Edit mode seed ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !editState?.prefill) return;
    const p = editState.prefill;
    if (p.supplierId && p.supplierName) {
      setSelectedSupplier({
        id: p.supplierId,
        name: p.supplierName,
        gstin: p.supplierGstin ?? '',
        phone: p.supplierPhone ?? '',
        stateCode: p.supplierStateCode ?? '',
        address: p.supplierAddress ?? '',
        creditLimit: p.creditLimit ?? 0,
        openingBalance: p.openingBalance ?? 0,
      });
      setSupplierAddress(p.supplierAddress ?? '');
    }
    if (p.warehouseId)
      setSelectedWarehouse(p.warehouseId, p.warehouseName ?? '');
    if (p.supplierInvoiceNo) setSupplierInvoiceNo(p.supplierInvoiceNo);
    if (p.invoiceDate) setDate(p.invoiceDate.slice(0, 10));
    if (p.notes) setNarration(p.notes);
    if (p.purchaseMode) setPurchaseMode(p.purchaseMode);
    if (Array.isArray(p.items) && p.items.length > 0) {
      setRows(
        p.items.map((item: any) => ({
          ...emptyPurchaseRow(),
          itemId: item.itemId ?? '',
          itemName: item.itemName ?? '',
          hsnCode: item.hsnCode ?? '',
          qty: Number(item.qty ?? 0),
          unit: item.unit ?? 'Pcs',
          unitId: item.unitId ?? '',
          purRate: Number(item.purRate ?? item.rate ?? item.purchase_rate ?? 0),
          taxRate: Number(item.taxRate ?? item.gst_rate ?? item.tax_rate ?? 0),
          mrp: Number(item.mrp ?? 0),
          saleRate: Number(item.saleRate ?? 0),
          amount: Number(item.qty ?? 0) * Number(item.rate ?? 0),
          purExpPct: Number(item.purExpPct ?? item.pur_exp_pct ?? 0),
          isKnownItem: true,
        })),
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── GRN from location state ──────────────────────────────────────────────
  useEffect(() => {
    const fromGRN = locationState?.fromGRN;
    if (!fromGRN) return;
    if (fromGRN.supplier) {
      setSelectedSupplier({
        ...fromGRN.supplier,
        creditLimit: fromGRN.supplier.credit_limit ?? 0,
        openingBalance: fromGRN.supplier.opening_balance ?? 0,
      });
      setSupplierAddress(fromGRN.supplier.address ?? '');
      if (activeTabId)
        updateTab(activeTabId, {
          partyId: fromGRN.supplier.id,
          partyName: fromGRN.supplier.name,
        });
    }
    if (fromGRN.warehouseId)
      setSelectedWarehouse(fromGRN.warehouseId, fromGRN.warehouseName ?? '');
    if (fromGRN.grnId)
      setSelectedGRN({
        id: fromGRN.grnId,
        grnNumber: fromGRN.grnNumber,
        supplierId: fromGRN.supplierId,
        supplierName: fromGRN.supplierName,
        warehouseName: fromGRN.warehouseName,
        date: '',
        totalValue: 0,
        items: fromGRN.items ?? [],
        piCreated: false,
      });
    if (fromGRN.items?.length)
      setRows(fromGRN.items.map((i: any) => grnItemToPurchaseRow(i, items)));
  }, [locationState?.fromGRN]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── GRN from URL params ──────────────────────────────────────────────────
  useEffect(() => {
    const grnId = searchParams.get('grnId');
    if (!grnId) return;
    apiGetGRNById(grnId)
      .then((res) => {
        if (res?.data) {
          setSelectedGRN(res.data as GRN);
          if (res.data.items?.length)
            setRows(
              res.data.items.map((i: any) => grnItemToPurchaseRow(i, items)),
            );
        }
      })
      .catch(console.error);
  }, [searchParams, items]);

  // ─── Duplicate prefill ────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTabId && duplicatePrefill) {
      updateTab(activeTabId, {
        fromDuplicate: undefined,
        partyName: `${duplicatePrefill.partyName} (Copy)`,
      });
      toast.success('Invoice duplicated — review and save');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── GRN select ───────────────────────────────────────────────────────────
  const handleGRNSelect = useCallback(
    async (grn: GRN | null) => {
      if (!grn) {
        setSelectedGRN(null);
        setRows([emptyPurchaseRow()]);
        return;
      }
      try {
        const res = await apiGetGRNById(grn.id);
        const full = res?.data;
        if (!full) {
          setSelectedGRN(grn);
          setRows([emptyPurchaseRow()]);
          return;
        }
        setSelectedGRN({
          id: full.id,
          grnNumber: full.grnNumber,
          supplierId: full.supplierId,
          supplierName: full.supplierName,
          date: full.date
            ? new Date(full.date).toLocaleDateString('en-IN')
            : grn.date,
          warehouseName: full.warehouseName,
          totalValue: full.totalValue,
          items: full.items ?? [],
          piCreated: grn.piCreated,
        });
        setRows(
          full.items?.length
            ? full.items.map((i: any) => grnItemToPurchaseRow(i, items))
            : [emptyPurchaseRow()],
        );
      } catch {
        setSelectedGRN(grn);
        setRows(
          grn.items?.length
            ? grn.items.map((i: any) => grnItemToPurchaseRow(i, items))
            : [emptyPurchaseRow()],
        );
      }
    },
    [items],
  );

  // ─── Supplier select ──────────────────────────────────────────────────────
  const handleSupplierSelect = useCallback(
    async (s: SupplierInfo) => {
      setSelectedSupplier(s);
      setSupplierAddress(s.address);
      setSelectedGRN(null);
      setCreditSkipped(false);
      setCreditApplied(false);
      if (activeTabId)
        updateTab(activeTabId, { partyId: s.id, partyName: s.name });
    },
    [activeTabId, updateTab],
  );

  // ─── Item search ──────────────────────────────────────────────────────────
  const handleItemNameSearch = useCallback(
    async (idx: number, query: string) => {
      const needle = query.trim().toLowerCase();
      if (needle.length < 2) return;
      const local = items.find((item) => {
        const n = String(item?.name ?? item?.itemName ?? '').toLowerCase();
        const c = String(item?.code ?? '').toLowerCase();
        const b = String(item?.barcode ?? '').toLowerCase();
        return n.includes(needle) || c.includes(needle) || b.includes(needle);
      });
      // console.log('items===>', items);
      if (local) {
        setRows((prev) =>
          prev.map((r, i) =>
            i !== idx
              ? r
              : {
                  ...r,
                  itemId: local.id,
                  brand: local.brand,
                  itemName: local.name || local.itemName || '',
                  hsnCode: local.hsnCode || local.hsn_code || '',
                  taxRate: Number(local.taxRate ?? local.gst_rate ?? 0),
                  purRate: Number(
                    local.purchaseRate ?? local.purchase_rate ?? 0,
                  ),
                  mrp: Number(local.mrp ?? 0),
                  saleRate: Number(local.saleRate ?? local.sale_rate ?? 0),
                  itemBarcode: local.barcode || '',
                  unitId: local.unitId || local.primary_unit_id || '',
                  unit: local.unitName || local.unit_name || 'Pcs',
                  group:
                    local.categoryName ||
                    local.category ||
                    local.group_name ||
                    local.group ||
                    '',
                  isKnownItem: true,
                },
          ),
        );
        return;
      }
      try {
        const res = await fetch(
          `${BASE_URL}/api/v1/item?search=${encodeURIComponent(query)}`,
          { headers: { Authorization: `Bearer ${getToken()}` } },
        );
        const data = await res.json();
        const f = data?.data?.[0];
        if (!f) return;
        setRows((prev) =>
          prev.map((r, i) =>
            i !== idx
              ? r
              : {
                  ...r,
                  itemId: f.id,
                  itemName: f.name,
                  brand: f.brand,
                  hsnCode: f.hsn_code || '',
                  taxRate: f.gst_rate || 0,
                  purRate: f.purchase_rate || 0,
                  mrp: f.mrp || 0,
                  saleRate: f.sale_rate || 0,
                  itemBarcode: f.barcode || '',
                  unitId: f.primary_unit_id || '',
                  unit: f.unit_name || 'Pcs',
                  group:
                    f.category_name ||
                    f.category ||
                    f.group_name ||
                    f.group ||
                    '',
                  isKnownItem: true,
                },
          ),
        );
      } catch (err) {
        console.error('Item search error:', err);
      }
    },
    [items],
  );

  const handleBarcodeSearch = useCallback(
    async (idx: number, value: string) => {
      try {
        const result = await searchItemByBarcode(value);
        const item = (result as any)?.data ?? result;
        if (!item) {
          toast.error('Item not found');
          throw new Error('Not found');
        }
        setRows((prev) =>
          prev.map((r, i) =>
            i !== idx
              ? r
              : {
                  ...r,
                  companyBarcode: value,
                  itemId: item.id,
                  itemName: item.name,
                  brand: item.brand,
                  hsnCode: item.hsn_code || '',
                  taxRate: Number(item.gst_rate) || 0,
                  unitId: item.primary_unit_id || '',
                  unit: item.unit_name || 'Pcs',
                  purRate: Number(item.purchase_rate) || 0,
                  saleRate: Number(item.sale_rate) || 0,
                  mrp: Number(item.mrp) || 0,
                  group:
                    item.category_name ||
                    item.category ||
                    item.group_name ||
                    item.group ||
                    '',
                  isKnownItem: true,
                },
          ),
        );
        return item;
      } catch {
        setRows((prev) =>
          prev.map((r, i) =>
            i === idx ? { ...r, companyBarcode: value, isKnownItem: false } : r,
          ),
        );
        return null;
      }
    },
    [toast],
  );

  // ─── Credit handlers ──────────────────────────────────────────────────────
  const handleApplySupplierCredit = useCallback(() => {
    if (maxApplicableSupplierCredit <= 0) {
      toast.error('No supplier credit available');
      setCreditApplied(false);
      return;
    }
    setCreditApplied(true);
    setCreditSkipped(false);
  }, [maxApplicableSupplierCredit, toast]);
  const handleRemoveSupplierCredit = useCallback(() => {
    setCreditApplied(false);
    setCreditSkipped(true);
  }, []);

  // ─── Tab navigation ───────────────────────────────────────────────────────
  // FIX: was addTab('PURCHASE') — must match VOUCHER_TYPE constant
  const handleNewTab = useCallback(() => {
    snapshotDraft();
    addTab(VOUCHER_TYPE);
  }, [addTab, snapshotDraft]);
  const handleSelectTab = useCallback(
    (tabId: string) => {
      snapshotDraft();
      setActiveTab(tabId);
    },
    [snapshotDraft, setActiveTab],
  );
  const handleCloseTab = useCallback(
    (tabId: string, isLastVisibleTab: boolean) => {
      if (tabId === activePurchaseTabId) snapshotDraft();
      DRAFT_STORE.delete(tabId);
      closeTab(tabId);
      if (isLastVisibleTab) navigate('/purchase/invoices');
    },
    [activePurchaseTabId, closeTab, navigate, snapshotDraft],
  );

  // ─── Row navigation ───────────────────────────────────────────────────────
  const handlePurchaseDetailsComplete = useCallback((rowIdx: number) => {
    pendingRowRef.current = rowIdx;
    setActiveItemTab('item_details');
    setFocusedRowIndex(rowIdx);
    setTimeout(
      () =>
        document
          .querySelector<HTMLElement>(
            `[data-id-row="${rowIdx}"][data-id-col="itemBarcode"]`,
          )
          ?.focus(),
      60,
    );
  }, []);

  const handleItemDetailsComplete = useCallback((_rowIdx: number) => {
    setRows((prev) => {
      const newRows = [...prev, emptyPurchaseRow()];
      const newIdx = newRows.length - 1;
      setTimeout(() => {
        setActiveItemTab('purchase_details');
        setFocusedRowIndex(newIdx);
        setTimeout(
          () =>
            document
              .querySelector<HTMLElement>(
                `[data-pd-row="${newIdx}"][data-pd-col="companyBarcode"]`,
              )
              ?.focus(),
          60,
        );
      }, 20);
      return newRows;
    });
  }, []);

  // ─── Save ─────────────────────────────────────────────────────────────────
  const handleSave = useCallback(
    async (andNew = false) => {
      if (!selectedSupplier) {
        toast.error('Please select a supplier');
        return;
      }
      const validRows = rows.filter((r) => r.itemName && r.qty > 0);
      if (validRows.length === 0) {
        toast.error('Add at least one item with quantity');
        return;
      }
      if (purchaseMode === 'CREDIT') {
        if (supplierAvailableCapacity < invoiceGrandTotal) {
          toast.error(
            `Credit limit insufficient. Available: ₹${supplierAvailableCapacity.toLocaleString('en-IN')}, Invoice: ₹${invoiceGrandTotal.toLocaleString('en-IN')}.`,
          );
          return;
        }
        if (!creditApplied) {
          toast.error(
            'Enable "Use Credit" to complete payment in Credit mode.',
          );
          return;
        }
      }
      setSaving(true);
      try {
        let savedWithBarcode = 0,
          savedWithoutBarcode = 0;
        const updatedRows = rows.map((row) => {
          if (!row.itemName) return row;
          const fb = row.itemBarcode || row.companyBarcode || null;
          if (fb) savedWithBarcode++;
          else savedWithoutBarcode++;
          const barcode = fb ?? generateEAN13();
          return {
            ...row,
            companyBarcode: barcode,
            barcodeGenerated: generateBarcodeSVG(barcode),
          };
        });
        setRows(updatedRows);
        if (activeTabId) markSaved(activeTabId, invoiceNo);

        const payload = {
          supplierId: selectedSupplier.id,
          warehouseId: selectedWarehouseId,
          grnId: selectedGRN?.id || null,
          supplierInvoiceNo: supplierInvoiceNo || partyBillNo,
          invoiceDate: date,
          isSameState,
          items: updatedRows
            .filter((r) => r.itemName && r.qty > 0)
            .map((r) => ({
              itemId: r.itemId,
              itemName: r.itemName,
              isKnownItem: r.isKnownItem,
              hsnCode: r.hsnCode || null,
              // barcode: send itemBarcode (Item Details tab), fallback to companyBarcode (auto-generated)
              barcode: r.itemBarcode || r.companyBarcode || null,
              qty: Number(r.qty),
              unitId: r.unitId || null,
              // unitName: always send a value; new items may only have this typed in the Unit column
              unitName: r.unitName || r.unit || 'Pcs',
              rate: Number(r.purRate) || 0,
              discountPct: Number(r.saleDisPct || 0),
              taxRate: Number(r.taxRate || 0),
              // Extra item-master fields used when auto-creating new items
              brand: r.brand || null,
              group: r.group || null,
              articleNo: r.articleNo || null,
              mrp: Number(r.mrp || 0),
              saleRate: Number(r.saleRate || 0),
            })),
          discountAmount: 0,
          roundOff: 0,
          paidAmount: directPaidAmount,
          creditAdjustment: supplierCreditAdjustmentAmount,
          notes: narration,
        };

        if (isEditMode && editInvoiceId) {
          const res = await fetch(
            `${BASE_URL}/api/v1/purchase-invoice/${editInvoiceId}`,
            {
              method: 'PUT',
              headers: authHeaders(),
              body: JSON.stringify(payload),
            },
          );
          const data = await res.json();
          if (!res.ok)
            throw new Error(data?.message || 'Failed to update invoice');
          toast.success('Invoice updated successfully');
          navigate('/purchase/invoices');
          return;
        }

        const res = await fetch(`${BASE_URL}/api/v1/purchase-invoice/`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data?.message || 'Failed to create invoice');

        toast.success(
          selectedGRN
            ? `Invoice ${invoiceNo} saved! Linked to ${selectedGRN.grnNumber}.`
            : savedWithoutBarcode > 0
              ? `Invoice ${invoiceNo} saved! ${savedWithBarcode} with barcode, ${savedWithoutBarcode} without.`
              : `Invoice ${invoiceNo} saved! All ${savedWithBarcode} item${savedWithBarcode !== 1 ? 's' : ''} saved.`,
        );

        if (andNew) {
          // Reset form + clear tab store so tab label also clears
          const fresh = createFreshDraft();
          if (activePurchaseTabId) {
            DRAFT_STORE.set(activePurchaseTabId, fresh);
            updateTab(activePurchaseTabId, {
              partyId: undefined,
              partyName: undefined,
              isDirty: false,
              savedBillNo: undefined,
            });
          }
          applyDraft(fresh);
        } else {
          if (activePurchaseTabId) DRAFT_STORE.delete(activePurchaseTabId);
          navigate('/purchase/invoices');
        }
      } catch (err: any) {
        toast.error(err?.message || 'Failed to save');
      } finally {
        setSaving(false);
      }
    },
    [
      selectedSupplier,
      rows,
      invoiceNo,
      activeTabId,
      activePurchaseTabId,
      navigate,
      toast,
      markSaved,
      selectedGRN,
      date,
      selectedWarehouseId,
      supplierInvoiceNo,
      partyBillNo,
      purchaseMode,
      directPaidAmount,
      supplierCreditAdjustmentAmount,
      supplierAvailableCapacity,
      invoiceGrandTotal,
      creditApplied,
      narration,
      isSameState,
      isEditMode,
      editInvoiceId,
      applyDraft,
      updateTab,
    ],
  );

  const itemCount = rows.filter((r) => r.itemName).length;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <BillingTabBar
          voucherType={VOUCHER_TYPE}
          onNewTab={handleNewTab}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />

        <div className="flex-1 overflow-y-auto bg-[#f8fafc] pb-16">
          {/* ── Header ── */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3 bg-white border-b border-[#e2e8f0]">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-base font-bold text-[#1e293b]">
                  {isEditMode
                    ? 'Edit Purchase Invoice'
                    : 'New Purchase Invoice'}
                </h1>
                <p className="text-xs text-slate-400">{invoiceNo}</p>
              </div>
              {selectedGRN && (
                <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  <i className="ri-inbox-archive-line text-xs" /> Linked:{' '}
                  {selectedGRN.grnNumber}
                </span>
              )}
              {activeTab?.isDirty && (
                <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{' '}
                  Unsaved
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isEditMode && (
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] disabled:opacity-50 cursor-pointer whitespace-nowrap transition-colors"
                >
                  <i className="ri-save-line text-xs" /> Save &amp; New{' '}
                  <kbd className="text-[10px] bg-[#e2e8f0] px-1 rounded ml-0.5">
                    F8
                  </kbd>
                </button>
              )}
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-1.5 h-8 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 cursor-pointer whitespace-nowrap transition-colors"
              >
                {saving ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <i className="ri-save-3-line" />{' '}
                    {isEditMode ? 'Update' : 'Save'}{' '}
                    <kbd className="text-[10px] bg-white/20 px-1 rounded ml-0.5">
                      F9
                    </kbd>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Items ── */}
          <div className="px-5 pt-4">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Items
              </span>
              <span className="text-xs text-slate-400">
                {selectedGRN ? (
                  <span className="flex items-center gap-1 text-indigo-600 font-medium">
                    <i className="ri-inbox-archive-line" /> Pre-filled from{' '}
                    {selectedGRN.grnNumber} · {selectedGRN.supplierName} ·{' '}
                    {selectedGRN.date}
                  </span>
                ) : (
                  <>
                    <i className="ri-barcode-line mr-1" />
                    Scan barcode or type · Enter / Arrow keys to navigate
                  </>
                )}
              </span>
            </div>

            <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-visible">
              <div className="flex items-center gap-0 border-b border-[#e2e8f0] bg-slate-50 px-3 pt-2">
                {(['purchase_details', 'item_details'] as ActiveItemTab[]).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveItemTab(tab)}
                      className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-lg border border-b-0 transition-colors cursor-pointer whitespace-nowrap ml-1 first:ml-0 ${activeItemTab === tab ? 'bg-white border-[#e2e8f0] text-[#4f46e5]' : 'bg-transparent border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                      <i
                        className={
                          tab === 'purchase_details'
                            ? 'ri-barcode-box-line'
                            : 'ri-list-check-2'
                        }
                      />
                      {tab === 'purchase_details'
                        ? 'Purchase Details'
                        : 'Item Details'}
                    </button>
                  ),
                )}
                <div className="ml-auto flex items-center gap-2 pb-1.5">
                  <span className="text-xs text-slate-400">
                    {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setRows((prev) => [...prev, emptyPurchaseRow()])
                    }
                    className="flex items-center gap-1 h-6 px-2 text-xs text-[#4f46e5] border border-indigo-200 rounded hover:bg-indigo-50 cursor-pointer whitespace-nowrap transition-colors"
                  >
                    <i className="ri-add-line" /> Add Row
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div
                  className={
                    activeItemTab === 'purchase_details' ? '' : 'hidden'
                  }
                >
                  <PurchaseDetailsTab
                    rows={rows}
                    onChange={setRows}
                    onRowComplete={handlePurchaseDetailsComplete}
                    focusedRowIndex={focusedRowIndex}
                    setFocusedRowIndex={setFocusedRowIndex}
                    onBarcodeEnter={handleBarcodeSearch}
                    itemOptions={itemOptions}
                    onItemSelect={handleItemNameSearch}
                  />
                </div>
                <div
                  className={activeItemTab === 'item_details' ? '' : 'hidden'}
                >
                  <ItemDetailsTab
                    rows={rows}
                    onChange={setRows}
                    onRowComplete={handleItemDetailsComplete}
                    focusedRowIndex={focusedRowIndex}
                    setFocusedRowIndex={setFocusedRowIndex}
                    items={items}
                  />
                </div>
              </div>

              <div className="border-t border-[#f1f5f9] px-4 py-2">
                <button
                  type="button"
                  onClick={() =>
                    setRows((prev) => [...prev, emptyPurchaseRow()])
                  }
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#4f46e5] transition-colors cursor-pointer"
                >
                  <i className="ri-add-circle-line" /> Add another row
                </button>
              </div>
            </div>
          </div>

          {/* ── Bottom panels ── */}
          <div className="px-5 pt-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-0">
              <SupplierSection
                selected={selectedSupplier}
                onSelect={handleSupplierSelect}
                address={supplierAddress}
                onAddressChange={setSupplierAddress}
                supplierInvoiceNo={supplierInvoiceNo}
                onSupplierInvoiceNoChange={setSupplierInvoiceNo}
              />
            </div>

            <PurchaseInvoiceSummary
              rows={rows}
              isSameState={isSameState}
              tcs={tcs}
              addCharges={addCharges}
              onTcsChange={setTcs}
              onAddChargesChange={setAddCharges}
              linkedGRN={
                selectedGRN
                  ? {
                      id: selectedGRN.id,
                      supplierId: selectedGRN.supplierId,
                      supplierName: selectedGRN.supplierName,
                      grnNumber: selectedGRN.grnNumber,
                      date: selectedGRN.date,
                    }
                  : null
              }
              paidAmount={0}
            />

            <PurchaseInvoiceInfo
              invoiceNo={invoiceNo}
              date={date}
              partyBillNo={partyBillNo}
              partyBillDate={partyBillDate}
              purchaseMode={purchaseMode}
              creditPeriod={creditPeriod}
              dueDate={dueDate}
              isSameState={isSameState}
              grandTotal={invoiceGrandTotal}
              supplierCreditLimit={supplierCreditLimit}
              supplierOpeningBalance={supplierOpeningBalance}
              supplierCreditAvailable={supplierAvailableCapacity}
              supplierCreditAppliedAmount={supplierCreditAdjustmentAmount}
              creditApplied={creditApplied}
              onDateChange={setDate}
              onPartyBillNoChange={setPartyBillNo}
              onPartyBillDateChange={setPartyBillDate}
              onPurchaseModeChange={setPurchaseMode}
              onCreditPeriodChange={setCreditPeriod}
              onDueDateChange={setDueDate}
              onApplyCreditAdjustment={handleApplySupplierCredit}
              onRemoveCreditAdjustment={handleRemoveSupplierCredit}
              onPaymentChange={setPaidAmount}
            />
          </div>

          {/* ── Narration ── */}
          <div className="px-5 pt-4">
            <div className="bg-white border border-[#e2e8f0] rounded-xl px-4 py-3 flex items-center gap-3">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide shrink-0">
                Narration
              </label>
              <input
                type="text"
                value={narration}
                onChange={(e) => setNarration(e.target.value)}
                placeholder="Optional purchase note..."
                className="flex-1 h-8 px-2 text-sm bg-transparent focus:outline-none text-[#1e293b] placeholder:text-slate-400"
              />
            </div>
          </div>
        </div>

        <ShortcutBar
          onSave={() => handleSave(false)}
          onSaveAndNew={() => handleSave(true)}
          onBack={() => {
            snapshotDraft();
            navigate('/purchase/invoices');
          }}
          saving={saving}
        />
      </div>
    </AppLayout>
  );
}
