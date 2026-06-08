// import { useBillingTabStore, type VoucherType } from '@/stores/billingTabStore';
// import ConfirmDialog from '@/components/feature/ConfirmDialog';
// import { useNavigate } from 'react-router-dom';
// import { useState, useCallback } from 'react';

// // ─── Constants ────────────────────────────────────────────────────────────────

// const VOUCHER_LABELS: Record<VoucherType, string> = {
//   SALE:             'Sale',
//   PURCHASE:         'Purchase',
//   PURCHASEINVOICE:  'Purchase Invoice',
//   SALE_RETURN:      'Sale Return',
//   PURCHASE_RETURN:  'Purchase Return',
// };

// const VOUCHER_LIST_ROUTES: Record<VoucherType, string> = {
//   SALE:             '/sales/invoices',
//   PURCHASE:         '/purchase/invoices',
//   PURCHASEINVOICE:  '/purchase/invoices',
//   SALE_RETURN:      '/sales/returns',
//   PURCHASE_RETURN:  '/purchase/returns',
// };

// const VOUCHER_ICONS: Record<VoucherType, string> = {
//   SALE:             'ri-file-list-3-line',
//   PURCHASE:         'ri-shopping-cart-line',
//   PURCHASEINVOICE:  'ri-file-text-line',
//   SALE_RETURN:      'ri-arrow-go-back-line',
//   PURCHASE_RETURN:  'ri-arrow-go-forward-line',
// };

// // ─── Props ────────────────────────────────────────────────────────────────────

// interface Props {
//   voucherType:   VoucherType;
//   onNewTab?:     () => void;
//   onSelectTab?:  (tabId: string) => void;
//   onCloseTab?:   (tabId: string, isLastVisibleTab: boolean) => void;
// }

// // ─────────────────────────────────────────────────────────────────────────────

// export default function BillingTabBar({ voucherType, onNewTab, onSelectTab, onCloseTab }: Props) {
//   const navigate = useNavigate();
//   const { tabs, activeTabId, addTab, closeTab, setActiveTab, canAddTab } = useBillingTabStore();
//   const [closeTarget, setCloseTarget] = useState<string | null>(null);

//   const visibleTabs = tabs.filter((t) => t.voucherType === voucherType);
//   const isLastTab   = visibleTabs.length === 1;
//   const listRoute   = VOUCHER_LIST_ROUTES[voucherType];

//   // ─── Close logic ─────────────────────────────────────────────────────────

//   const doClose = useCallback((tabId: string) => {
//     if (onCloseTab) { onCloseTab(tabId, isLastTab); return; }
//     closeTab(tabId);
//     if (isLastTab) navigate(listRoute);
//   }, [onCloseTab, closeTab, isLastTab, navigate, listRoute]);

//   const handleCloseClick = useCallback((tabId: string, isDirty: boolean, e: React.MouseEvent) => {
//     e.stopPropagation();
//     if (isDirty) { setCloseTarget(tabId); return; }
//     doClose(tabId);
//   }, [doClose]);

//   const confirmClose    = useCallback(() => { if (!closeTarget) return; doClose(closeTarget); setCloseTarget(null); }, [closeTarget, doClose]);
//   const handleCancelClose = useCallback(() => setCloseTarget(null), []);

//   const handleTabClick  = useCallback((tabId: string) => {
//     if (onSelectTab) onSelectTab(tabId); else setActiveTab(tabId);
//   }, [onSelectTab, setActiveTab]);

//   const handleNewTab    = useCallback(() => {
//     if (onNewTab) onNewTab(); else addTab(voucherType);
//   }, [onNewTab, addTab, voucherType]);

//   // ─── Render ───────────────────────────────────────────────────────────────

//   return (
//     <>
//       <div className="flex items-center gap-0.5 px-4 pt-2 border-b border-[#e2e8f0] bg-white overflow-x-auto shrink-0">
//         {visibleTabs.map((tab) => {
//           const isActive = tab.id === activeTabId;
//           return (
//             <div
//               key={tab.id}
//               onClick={() => handleTabClick(tab.id)}
//               title={[VOUCHER_LABELS[tab.voucherType], tab.partyName, tab.savedBillNo ? `#${tab.savedBillNo}` : ''].filter(Boolean).join(' · ')}
//               className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg border border-b-0 cursor-pointer whitespace-nowrap transition-colors min-w-0 max-w-[200px] group ${
//                 isActive
//                   ? 'bg-white border-[#e2e8f0] text-[#1e293b] font-medium shadow-[0_-1px_0_0_white]'
//                   : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
//               }`}
//             >
//               <i className={`${VOUCHER_ICONS[tab.voucherType]} text-xs shrink-0 ${isActive ? 'text-[#4f46e5]' : 'text-slate-400'}`} />

//               <span className="truncate text-xs">
//                 {VOUCHER_LABELS[tab.voucherType]}
//                 {tab.partyName   ? ` · ${tab.partyName.split(' ')[0]}` : ''}
//                 {tab.savedBillNo ? ` #${tab.savedBillNo}` : ''}
//               </span>

//               {tab.isDirty && (
//                 <span title="Unsaved changes" className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] shrink-0" />
//               )}

//               <button
//                 type="button"
//                 onClick={(e) => handleCloseClick(tab.id, tab.isDirty, e)}
//                 title="Close tab"
//                 className={`shrink-0 w-4 h-4 flex items-center justify-center rounded hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer focus:opacity-100 ${
//                   isActive ? 'opacity-60 text-slate-400' : 'opacity-0 group-hover:opacity-100 text-slate-300'
//                 }`}
//               >
//                 <i className="ri-close-line text-xs" />
//               </button>
//             </div>
//           );
//         })}

//         {canAddTab() && (
//           <button
//             type="button"
//             onClick={handleNewTab}
//             title={`New ${VOUCHER_LABELS[voucherType]} tab`}
//             className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-t-lg transition-colors cursor-pointer ml-1 border border-transparent whitespace-nowrap shrink-0"
//           >
//             <i className="ri-add-line" /> New
//           </button>
//         )}
//       </div>

//       <ConfirmDialog
//         open={!!closeTarget}
//         title="Discard Changes?"
//         message="This tab has unsaved changes. Are you sure you want to close it?"
//         confirmLabel="Close Tab"
//         onConfirm={confirmClose}
//         onCancel={handleCancelClose}
//       />
//     </>
//   );
// }

import { useBillingTabStore, type VoucherType } from '@/stores/billingTabStore';
import ConfirmDialog from '@/components/feature/ConfirmDialog';
import { useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';

// ─── Constants ────────────────────────────────────────────────────────────────

const VOUCHER_LABELS: Record<VoucherType, string> = {
  SALE:             'Sale',
  PURCHASE:         'Purchase',
  PURCHASEINVOICE:  'Purchase Invoice',
  SALE_RETURN:      'Sale Return',
  PURCHASE_RETURN:  'Purchase Return',
};

const VOUCHER_LIST_ROUTES: Record<VoucherType, string> = {
  SALE:             '/sales/invoices',
  PURCHASE:         '/purchase/invoices',
  PURCHASEINVOICE:  '/purchase/invoices',
  SALE_RETURN:      '/sales/returns',
  PURCHASE_RETURN:  '/purchase/returns',
};

const VOUCHER_ICONS: Record<VoucherType, string> = {
  SALE:             'ri-file-list-3-line',
  PURCHASE:         'ri-shopping-cart-line',
  PURCHASEINVOICE:  'ri-file-text-line',
  SALE_RETURN:      'ri-arrow-go-back-line',
  PURCHASE_RETURN:  'ri-arrow-go-forward-line',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  voucherType:   VoucherType;
  onNewTab?:     () => void;
  onSelectTab?:  (tabId: string) => void;
  onCloseTab?:   (tabId: string, isLastVisibleTab: boolean) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BillingTabBar({ voucherType, onNewTab, onSelectTab, onCloseTab }: Props) {
  const navigate = useNavigate();
  const { tabs, activeTabId, addTab, closeTab, setActiveTab, canAddTab } = useBillingTabStore();
  const [closeTarget, setCloseTarget] = useState<string | null>(null);

  const visibleTabs = tabs.filter((t) => t.voucherType === voucherType);
  const isLastTab   = visibleTabs.length === 1;
  const listRoute   = VOUCHER_LIST_ROUTES[voucherType];

  // ─── Close logic ─────────────────────────────────────────────────────────

  const doClose = useCallback((tabId: string) => {
    if (onCloseTab) { onCloseTab(tabId, isLastTab); return; }
    closeTab(tabId);
    if (isLastTab) navigate(listRoute);
  }, [onCloseTab, closeTab, isLastTab, navigate, listRoute]);

  const handleCloseClick = useCallback((tabId: string, isDirty: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirty) { setCloseTarget(tabId); return; }
    doClose(tabId);
  }, [doClose]);

  const confirmClose    = useCallback(() => { if (!closeTarget) return; doClose(closeTarget); setCloseTarget(null); }, [closeTarget, doClose]);
  const handleCancelClose = useCallback(() => setCloseTarget(null), []);

  const handleTabClick  = useCallback((tabId: string) => {
    if (onSelectTab) onSelectTab(tabId); else setActiveTab(tabId);
  }, [onSelectTab, setActiveTab]);

  const handleNewTab    = useCallback(() => {
    if (onNewTab) onNewTab(); else addTab(voucherType);
  }, [onNewTab, addTab, voucherType]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex items-center gap-0.5 px-4 pt-2 border-b border-[#e2e8f0] bg-white overflow-x-auto shrink-0">
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <div
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              title={[VOUCHER_LABELS[tab.voucherType], tab.partyName, tab.savedBillNo ? `#${tab.savedBillNo}` : ''].filter(Boolean).join(' · ')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-t-lg border border-b-0 cursor-pointer whitespace-nowrap transition-colors min-w-0 max-w-[200px] group ${
                isActive
                  ? 'bg-white border-[#e2e8f0] text-[#1e293b] font-medium shadow-[0_-1px_0_0_white]'
                  : 'bg-slate-50 border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
              }`}
            >
              <i className={`${VOUCHER_ICONS[tab.voucherType]} text-xs shrink-0 ${isActive ? 'text-[#4f46e5]' : 'text-slate-400'}`} />

              <span className="truncate text-xs">
                {VOUCHER_LABELS[tab.voucherType]}
                {tab.partyName   ? ` · ${tab.partyName.split(' ')[0]}` : ''}
                {tab.savedBillNo ? ` #${tab.savedBillNo}` : ''}
              </span>

              {tab.isDirty && (
                <span title="Unsaved changes" className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] shrink-0" />
              )}

              <button
                type="button"
                onClick={(e) => handleCloseClick(tab.id, tab.isDirty, e)}
                title="Close tab"
                className={`shrink-0 w-4 h-4 flex items-center justify-center rounded hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer focus:opacity-100 ${
                  isActive ? 'opacity-60 text-slate-400' : 'opacity-0 group-hover:opacity-100 text-slate-300'
                }`}
              >
                <i className="ri-close-line text-xs" />
              </button>
            </div>
          );
        })}

        {canAddTab() && (
          <button
            type="button"
            onClick={handleNewTab}
            title={`New ${VOUCHER_LABELS[voucherType]} tab`}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-[#4f46e5] hover:bg-indigo-50 rounded-t-lg transition-colors cursor-pointer ml-1 border border-transparent whitespace-nowrap shrink-0"
          >
            <i className="ri-add-line" /> New
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!closeTarget}
        title="Discard Changes?"
        message="This tab has unsaved changes. Are you sure you want to close it?"
        confirmLabel="Close Tab"
        onConfirm={confirmClose}
        onCancel={handleCancelClose}
      />
    </>
  );
}