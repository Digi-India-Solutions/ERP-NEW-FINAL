import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { MODULES } from "@/utils/permissions";
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/feature/ProtectedRoute';
import LoginPage from '@/pages/login/page';
import ForgetPasswordPage from '@/pages/forgot-password/page';
import Dashboard from '@/pages/dashboard/page';
import ReportsLanding from '@/pages/reports/page';
import Settings from '@/pages/settings/page';
import Users from '@/pages/users/page';
import WarehousesPage from '@/pages/masters/warehouses/page';
import PartiesPage from '@/pages/masters/parties/page';
import ItemsPage from '@/pages/masters/items/page';
import CategoriesUnitsPage from '@/pages/masters/categories/page';
import WorkCentersPage from '@/pages/masters/work-centers/page';
import MachinesPage from '@/pages/masters/machines/page';
import ShiftsPage from '@/pages/masters/shifts/page';
import OperatorsPage from '@/pages/masters/operators/page';
import CostCentersPage from '@/pages/masters/cost-centers/page';
import CompanyPage from '@/pages/masters/company/page';
import InspectionChecklistsPage from '@/pages/masters/inspection-checklists/page';
import DowntimeCodesPage from '@/pages/masters/downtime-codes/page';
import QualityParametersPage from '@/pages/masters/quality-parameters/page';
import RejectionCodesPage from '@/pages/masters/rejection-codes/page';
import RoutingPage from '@/pages/masters/routing/page';
import RoutingFormPage from '@/pages/masters/routing/form/page';
import SalesInvoiceListPage from '@/pages/sales/invoices/page';
import SalesInvoiceNewPage from '@/pages/sales/invoices/new/page';
import SaleReturnsPage from '@/pages/sales/returns/page';
import ChallansPage from '@/pages/sales/challans/page';
import SalesPaymentPage from '@/pages/sales/payments/page';
import SalesPaymentsHistoryPage from '@/pages/sales/payments/history/page';
import PurchasePaymentPage from '@/pages/purchase/payments/page';
import PurchasePaymentsHistoryPage from '@/pages/purchase/payments/history/page';
import PurchaseInvoiceListPage from '@/pages/purchase/invoices/page';
import PurchaseInvoiceNewPage from '@/pages/purchase/invoices/new/page';
import PurchaseReturnsPage from '@/pages/purchase/returns/page';
import GRNListPage from '@/pages/purchase/grn/page';
import PurchaseOrdersPage from '@/pages/purchase/orders/page';
import PurchaseOrderNewPage from '@/pages/purchase/orders/new/page';
import StockViewPage from '@/pages/inventory/stock/page';
import StockReceivingPage from '@/pages/inventory/receiving/page';
import StockTransferPage from '@/pages/inventory/transfer/page';
import StockAdjustmentPage from '@/pages/inventory/adjustment/page';
import StockEntriesPage from '@/pages/inventory/stock-entries/page';
import BarcodeManagementPage from '@/pages/inventory/barcode-management/page';

// ── Gate Pass pages ───────────────────────────────────────────────────────────
import OutwardGatePassPage from '@/pages/inventory/gate-pass/outward/page';
import InwardGatePassPage from '@/pages/inventory/gate-pass/inward/page';

// ── Guard pages ───────────────────────────────────────────────────────────────
import GuardDashboard from '@/pages/guard/dashboard/page';
import GuardOutwardPage from '@/pages/guard/outward/page';
import GuardInwardPage from '@/pages/guard/inward/page';

// Reports
import StockSummaryReport from '@/pages/reports/stock-summary/page';
import StockLedgerReport from '@/pages/reports/stock-ledger/page';
import LowStockReport from '@/pages/reports/low-stock/page';
import PurchaseRegisterReport from '@/pages/reports/purchase-register/page';
import GSTPurchaseReport from '@/pages/reports/gst-purchase/page';
import SalesRegisterReport from '@/pages/reports/sales-register/page';
import GSTSalesReport from '@/pages/reports/gst-sales/page';
import OutstandingReport from '@/pages/reports/outstanding/page';
import DayBookReport from '@/pages/reports/day-book/page';
import PartyLedgerReport from '@/pages/reports/party-ledger/page';
import ManufacturingReportsPage from '@/pages/reports/manufacturing/page';
import FinanceReportsPage from '@/pages/reports/finance/page';
import GSTReportsPage from '@/pages/reports/gst/page';
import ExecutiveDashboardPage from '@/pages/reports/dashboard/page';
      
import ResetPasswordPage from '@/pages/reset-password/page';

import { useAuth } from "@/contexts/AuthContext";
import EditPOPage from '@/pages/purchase/orders/new/EditPOPage';
import PaymentDuesTable from '@/pages/purchase/payments/components/paymantDuesTable';
import BOMListTable from '@/pages/manifacturing/bom/page';
import BOMForm from '@/pages/manifacturing/bom/BOMForm';
import ProductionOrderForm from '@/pages/manifacturing/orders/ProductionOrderForm';
import WorkOrdersPage from '@/pages/manifacturing/work-orders/page';
import ProductionSchedulePage from '@/pages/manifacturing/schedule/page';
import MRPRunPage from '@/pages/manifacturing/mrp/page';
import MaterialShortagePage from '@/pages/manifacturing/mrp/shortage/page';
import ProductionEntryPage from '@/pages/manifacturing/shop-floor/page';
import DowntimeEntryPage from '@/pages/manifacturing/downtime/page';
import LiveDashboardPage from '@/pages/manifacturing/live/page';


const P = ({
  children,
  roles,
  requirePermission,
}: {
  children: React.ReactNode;
  roles?: string[];
  requirePermission?: () => boolean;
}) => (
  <ProtectedRoute requiredRoles={roles} requirePermission={requirePermission}>
    {children}
  </ProtectedRoute>
);

const GuardOnly = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute requiredRoles={['SECURITY_GUARD'] as never}>{children}</ProtectedRoute>
);

/**
 * Perm — thin wrapper that reads hasPermission from context and passes it as
 * requirePermission to ProtectedRoute. This replaces the broken
 * `<P module={…} action={…}>` pattern that ProtectedRoute never actually supported.
 *
 * Usage:
 *   <Perm module={MODULES.WAREHOUSES} action="view"><WarehousesPage /></Perm>
 */
const Perm = ({
  children,
  module,
  action,
  override,
}: {
  children: React.ReactNode;
  module: string;
  action: 'create' | 'view' | 'edit' | 'delete';
  override?: (args: {
    hasPermission: (m: string, a: 'create' | 'view' | 'edit' | 'delete') => boolean;
    hasControl: (c: string) => boolean;
  }) => boolean;
}) => {
  const { hasPermission, hasControl, user } = useAuth();

  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const allowed =
    isSuperAdmin
      ? true
      : override
        ? override({ hasPermission, hasControl })
        : hasPermission(module, action);

  return (
    <ProtectedRoute requirePermission={() => allowed}>
      {children}
    </ProtectedRoute>
  );
};



// ── Route table ───────────────────────────────────────────────────────────────

const routes: RouteObject[] = [
  { path: '/login', element: <LoginPage /> },
  { path: '/forgot-password', element: <ForgetPasswordPage /> },
  { path: '/reset-password/:token', element: <ResetPasswordPage /> },

  {
    path: '/settings',
    element: (
      <Perm
        module={MODULES.SETTINGS}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.SETTINGS, "view") ||
          hasControl("manageUserPermissions")
        }
      >
        <Settings />
      </Perm>
    ),
  },
  {
    path: '/users',
    element: (
      <Perm
        module={MODULES.USERS}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.USERS, "view") ||
          hasControl("manageUserPermissions")
        }
      >
        <Users />
      </Perm>
    ),
  },

  // ── Masters ───────────────────────────────────────────────────────────────
  { path: '/masters', element: <Navigate to="/masters/company" replace /> },

  {
    path: '/masters/warehouses',
    element: (
      <Perm module={MODULES.WAREHOUSES} action="view">
        <WarehousesPage />
      </Perm>
    ),
  },
  {
    path: '/masters/parties',
    element: (
      <Perm module={MODULES.PARTIES} action="view">
        <PartiesPage />
      </Perm>
    ),
  },
  { path: '/masters/items', element: <P><ItemsPage /></P> },
  {
    path: '/masters/categories', element: (
      <Perm module={MODULES.CATEGORIES} action="view">
        <CategoriesUnitsPage />
      </Perm>
    )
  },
  {
    path: '/masters/work-centers', element: (
      <Perm module={MODULES.WORK_CENTERS} action="view">
        <WorkCentersPage />
      </Perm>
    )
  },
  {
    path: '/masters/machines', element: (
      <Perm module={MODULES.MACHINE} action="view">
        <MachinesPage />
      </Perm>
    )
  },
  {
    path: '/masters/shifts', element: (
      <Perm module={MODULES.SHIFT} action="view">
        <ShiftsPage />
      </Perm>)
  },
  {
    path: '/masters/operators', element: (
      <Perm module={MODULES.OPERATOR} action="view">
        <OperatorsPage />
      </Perm>)
  },
  {
    path: '/masters/cost-centers', element: (
      <Perm module={MODULES.COST_CENTRE} action="view">
        <CostCentersPage />
      </Perm>)
  },
  {
    path :'masters/company',
    element :(
      <Perm module= {
        MODULES.COMPANY} action = "view">
          <CompanyPage/>
        </Perm>
    )
      },

      {
        path:'/masters/inspection-checklists',
        element :(
          <Perm module={
            MODULES.INSPECTION_CHECKLIST} action = "view" >
              <InspectionChecklistsPage/>
            </Perm>
        )
      },

      {
        path :'masters/downtime-codes',
        element :(
          <Perm module={
            MODULES.DOWNTIME_CODE} action = "view" >
              <DowntimeCodesPage/>
            </Perm>
        )
      },

      {
        path :'masters/quality-parameters',
        element :(
          <Perm module={
            MODULES.QUALITY_PARAMETER} action = "view" >
              <QualityParametersPage/>
            </Perm>
        )
      },

      {
        path: 'masters/rejection-codes',
        element: (
          <Perm module={MODULES.REJECTION_CODE} action="view">
            <RejectionCodesPage />
          </Perm>
        )
      },
      {
        path: 'masters/routing',
        element: (
          <Perm module={MODULES.ROUTING} action="view">
            <RoutingPage />
          </Perm>
        )
      },
      {
        path: 'masters/routing/new',
        element: (
          <Perm module={MODULES.ROUTING} action="create">
            <RoutingFormPage />
          </Perm>
        )
      },

  // ── Sales ─────────────────────────────────────────────────────────────────
  { path: '/sales', element: <Navigate to="/sales/invoices" replace /> },
  {
    path: '/sales/invoices',
    element: (
      <Perm module={MODULES.SALES_INVOICE} action="view">
        <SalesInvoiceListPage />
      </Perm>
    ),
  },
  {
    path: '/sales/invoices/new',
    element: (
      <P>
        <SalesInvoiceNewPage />
      </P>
    ),
  },
  {
    path: '/sales/returns',
    element: (
      <Perm module={MODULES.SALE_RETURN} action="view">
        <SaleReturnsPage />
      </Perm>
    ),
  },
  {
    path: '/sales/challans',
    element: (
      <Perm module={MODULES.CHALLAN} action="view">
        <ChallansPage />
      </Perm>
    ),
  },
  {
    path: '/sales/payments',
    element: (
      <Perm module={MODULES.SALES_PAYMENT} action="view">
        <SalesPaymentsHistoryPage />
      </Perm>
    ),
  },
  {
    path: '/sales/payments/new',
    element: (
      <P>
        <SalesPaymentPage />
      </P>
    ),
  },

  // ── Purchase ──────────────────────────────────────────────────────────────
  { path: '/purchase', element: <Navigate to="/purchase/orders" replace /> },
  {
    path: '/purchase/orders',
    element: (
      <Perm module={MODULES.PURCHASE_ORDER} action="view">
        <PurchaseOrdersPage />
      </Perm>
    ),
  },
  { path: '/purchase-orders/edit/:id', element: <EditPOPage /> },
  {
    path: '/purchase/orders/new',
    element: (
      <P>
        <PurchaseOrderNewPage />
      </P>
    ),
  },
  {
    path: '/purchase/invoices',
    element: (
      <Perm module={MODULES.PURCHASE_INVOICE} action="view">
        <PurchaseInvoiceListPage />
      </Perm>
    ),
  },
  {
    path: '/purchase/invoices/new',
    element: (
      <P>
        <PurchaseInvoiceNewPage />
      </P>
    ),
  },
  {
    path: '/purchase/payments',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <PurchasePaymentsHistoryPage />
      </Perm>
    ),
  },
  {
    path: '/purchase/payments/new',
    element: (
      <P>
        <PurchasePaymentPage />
      </P>
    ),
  },
  {
    path: '/purchase/payments/news',
    element: (
      <P>
        <PaymentDuesTable />
      </P>
    ),
  },
  {
    path: '/purchase/grn',
    element: (
      <Perm module={MODULES.GRN_HISTORY} action="view">
        <GRNListPage />
      </Perm>
    ),
  },
  {
    path: '/purchase/returns',
    element: (
      <Perm module={MODULES.PURCHASE_RETURN} action="view">
        <PurchaseReturnsPage />
      </Perm>
    ),
  },

  // ── Inventory ─────────────────────────────────────────────────────────────
  { path: '/inventory', element: <Navigate to="/inventory/stock" replace /> },
  {
    path: '/inventory/stock',
    element: (
      <P>
        <StockViewPage />
      </P>
    ),
  },
  {
    path: '/inventory/receiving',
    element: (
      <Perm module={MODULES.STOCK_RECEIVING} action="view">
        <StockReceivingPage />
      </Perm>
    ),
  },
  {
    path: '/inventory/transfer',
    element: (
      <Perm module={MODULES.STOCK_TRANSFER} action="view">
        <StockTransferPage />
      </Perm>
    ),
  },
  // {
  //   path: '/inventory/adjustment',
  //   element: (
  //     <Perm module={MODULES.STOCK_ADJUSTMENT} action="view">
  //       <StockAdjustmentPage />
  //     </Perm>
  //   ),
  // },
  {
    path: '/inventory/adjustment',
    element: (
      <Perm
        module={MODULES.STOCK_ADJUSTMENT}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.STOCK_ADJUSTMENT, "view") ||
          hasControl("approveStockAdjustment")
        }
      >
        <StockAdjustmentPage />
      </Perm>
    ),
  },

  {
    path: '/inventory/stock-entries',
    element: (
      <Perm module={MODULES.STOCK_ENTRIES} action="view">
        <StockEntriesPage />
      </Perm>
    ),
  },

  // ── Gate Pass (under Inventory — non-guard users) ─────────────────────────
  {
    path: '/inventory/gate-pass',
    element: <Navigate to="/inventory/gate-pass/outward" replace />,
  },
  {
    path: '/inventory/gate-pass/outward',
    element: (
      <Perm module={MODULES.GATE_PASS_OUTWARD} action="view">
        <OutwardGatePassPage />
      </Perm>
    ),
  },
  {
    path: '/inventory/gate-pass/inward',
    element: (
      <Perm module={MODULES.GATE_PASS_INWARD} action="view">
        <InwardGatePassPage />
      </Perm>
    ),
  },

  // ── Print ─────────────────────────────────────────────────────────────────
  {
    path: '/print',
    element: <Navigate to="/print/barcode-management" replace />,
  },
  {
    path: '/print/barcode-management',
    element: (
      <P>
        <BarcodeManagementPage />
      </P>
    ),
  },
  // Legacy redirect
  {
    path: '/inventory/barcode-management',
    element: <Navigate to="/print/barcode-management" replace />,
  },

  {
    path: '/manufacturing/bom-list',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <BOMListTable />
      </Perm>
    ),
  },

  {
    path: '/manufacturing/create-bom',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <BOMForm />
      </Perm>
    ),
  },
  {
    path: '/manufacturing/production-orders',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <ProductionOrderForm />
      </Perm>
    ),
  },
  {
    path: '/manufacturing/work-orders',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <WorkOrdersPage />
      </Perm>
    ),
  },
  {
    path: '/manufacturing/schedule',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <ProductionSchedulePage />
      </Perm>
    ),
  },
  {
    path: '/manufacturing/mrp',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <MRPRunPage />
      </Perm>
    ),
  },
  {
    path: '/manufacturing/mrp/shortage',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <MaterialShortagePage />
      </Perm>
    ),
  },
  {
    path: '/manufacturing/shop-floor',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <ProductionEntryPage />
      </Perm>
    ),
  },
  {
    path: '/manufacturing/downtime',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <DowntimeEntryPage />
      </Perm>
    ),
  },
  {
    path: '/manufacturing/live',
    element: (
      <Perm module={MODULES.PURCHASE_PAYMENT} action="view">
        <LiveDashboardPage />
      </Perm>
    ),
  },
  // {
  //   path: '/manufacturing',
  //   element: <Navigate to="/manufacturing/bom/new" replace />,
  // },

  // ── Guard-only routes (/guard/*) ──────────────────────────────────────────
  { path: '/guard', element: <Navigate to="/guard/dashboard" replace /> },
  {
    path: '/guard/dashboard',
    element: (
      <GuardOnly>
        <GuardDashboard />
      </GuardOnly>
    ),
  },
  {
    path: '/guard/outward',
    element: (
      <GuardOnly>
        <GuardOutwardPage />
      </GuardOnly>
    ),
  },
  {
    path: '/guard/inward',
    element: (
      <GuardOnly>
        <GuardInwardPage />
      </GuardOnly>
    ),
  },

  // ── Reports ───────────────────────────────────────────────────────────────
  {
    path: '/reports/stock-summary',
    element: (
      <Perm
        module={MODULES.REPORT_STOCK_SUMMARY}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_STOCK_SUMMARY, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <StockSummaryReport />
      </Perm>
    ),
  },
  {
    path: '/reports/party-ledger',
    element: (
      <Perm
        module={MODULES.REPORT_PARTY_LEDGER}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_PARTY_LEDGER, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <PartyLedgerReport />
      </Perm>
    ),
  },
  {
    path: '/reports/low-stock',
    element: (
      <Perm
        module={MODULES.REPORT_LOW_STOCK}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_LOW_STOCK, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <LowStockReport />
      </Perm>
    ),
  },
  {
    path: '/reports/purchase-register',
    element: (
      <Perm
        module={MODULES.REPORT_PURCHASE_REG}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_PURCHASE_REG, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <PurchaseRegisterReport />
      </Perm>
    ),
  },
  {
    path: '/reports/gst-purchase',
    element: (
      <Perm
        module={MODULES.REPORT_GST_PURCHASE}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_GST_PURCHASE, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <GSTPurchaseReport />
      </Perm>
    ),
  },
  {
    path: '/reports/stock-ledger',
    element: (
      <Perm
        module={MODULES.REPORT_STOCK_LEDGER}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_STOCK_LEDGER, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <StockLedgerReport />
      </Perm>
    ),
  },
  {
    path: '/reports/day-book',
    element: (
      <Perm
        module={MODULES.REPORT_DAY_BOOK}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_DAY_BOOK, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <DayBookReport />
      </Perm>
    ),
  },
  {
    path: '/reports/outstanding',
    element: (
      <Perm
        module={MODULES.REPORT_OUTSTANDING}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_OUTSTANDING, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <OutstandingReport />
      </Perm>
    ),
  },
  {
    path: '/reports/gst-sales',
    element: (
      <Perm
        module={MODULES.REPORT_GST_SALES}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_GST_SALES, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <GSTSalesReport />
      </Perm>
    ),
  },
  {
    path: '/reports/sales-register',
    element: (
      <Perm
        module={MODULES.REPORT_SALES_REG}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_SALES_REG, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <SalesRegisterReport />
      </Perm>
    ),
  },
  {
    path: '/reports/manufacturing',
    element: (
      <Perm
        module={MODULES.REPORT_MANUFACTURING}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_MANUFACTURING, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <ManufacturingReportsPage />
      </Perm>
    ),
  },
  {
    path: '/reports/finance',
    element: (
      <Perm
        module={MODULES.REPORT_FINANCE}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_FINANCE, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <FinanceReportsPage />
      </Perm>
    ),
  },
  {
    path: '/reports/gst',
    element: (
      <Perm
        module={MODULES.REPORT_GST}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_GST, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <GSTReportsPage />
      </Perm>
    ),
  },
  {
    path: '/reports/dashboard',
    element: (
      <Perm
        module={MODULES.REPORT_DASHBOARD}
        action="view"
        override={({ hasPermission, hasControl }) =>
          hasPermission(MODULES.REPORT_DASHBOARD, "view") ||
          hasControl('viewFinancialReports')
        }
      >
        <ExecutiveDashboardPage />
      </Perm>
    ),
  },


  { path: '*', element: <NotFound /> },
];

export default routes;


// import type { RouteObject } from 'react-router-dom';
// import { Navigate } from 'react-router-dom';
// import { MODULES } from "@/utils/permissions";
// import NotFound from '@/pages/NotFound';
// import ProtectedRoute from '@/components/feature/ProtectedRoute';
// import LoginPage from '@/pages/login/page';
// import ForgetPasswordPage from '@/pages/forgot-password/page';
// import Dashboard from '@/pages/dashboard/page';
// import ReportsLanding from '@/pages/reports/page';
// import Settings from '@/pages/settings/page';
// import Users from '@/pages/users/page';
// import WarehousesPage from '@/pages/masters/warehouses/page';
// import PartiesPage from '@/pages/masters/parties/page';
// import ItemsPage from '@/pages/masters/items/page';
// import CategoriesUnitsPage from '@/pages/masters/categories/page';
// import SalesInvoiceListPage from '@/pages/sales/invoices/page';
// import SalesInvoiceNewPage from '@/pages/sales/invoices/new/page';
// import SaleReturnsPage from '@/pages/sales/returns/page';
// import ChallansPage from '@/pages/sales/challans/page';
// import SalesPaymentPage from '@/pages/sales/payments/page';
// import SalesPaymentsHistoryPage from '@/pages/sales/payments/history/page';
// import PurchasePaymentPage from '@/pages/purchase/payments/page';
// import PurchasePaymentsHistoryPage from '@/pages/purchase/payments/history/page';
// import PurchaseInvoiceListPage from '@/pages/purchase/invoices/page';
// import PurchaseInvoiceNewPage from '@/pages/purchase/invoices/new/page';
// import PurchaseReturnsPage from '@/pages/purchase/returns/page';
// import GRNListPage from '@/pages/purchase/grn/page';
// import PurchaseOrdersPage from '@/pages/purchase/orders/page';
// import PurchaseOrderNewPage from '@/pages/purchase/orders/new/page';
// import StockViewPage from '@/pages/inventory/stock/page';
// import StockReceivingPage from '@/pages/inventory/receiving/page';
// import StockTransferPage from '@/pages/inventory/transfer/page';
// import StockAdjustmentPage from '@/pages/inventory/adjustment/page';
// import StockEntriesPage from '@/pages/inventory/stock-entries/page';
// import BarcodeManagementPage from '@/pages/inventory/barcode-management/page';

// // ── Gate Pass pages ───────────────────────────────────────────────────────────
// import OutwardGatePassPage from '@/pages/inventory/gate-pass/outward/page';
// import InwardGatePassPage from '@/pages/inventory/gate-pass/inward/page';

// // ── Guard pages ───────────────────────────────────────────────────────────────
// import GuardDashboard from '@/pages/guard/dashboard/page';
// import GuardOutwardPage from '@/pages/guard/outward/page';
// import GuardInwardPage from '@/pages/guard/inward/page';

// // Reports
// import StockSummaryReport from '@/pages/reports/stock-summary/page';
// import StockLedgerReport from '@/pages/reports/stock-ledger/page';
// import LowStockReport from '@/pages/reports/low-stock/page';
// import PurchaseRegisterReport from '@/pages/reports/purchase-register/page';
// import GSTPurchaseReport from '@/pages/reports/gst-purchase/page';
// import SalesRegisterReport from '@/pages/reports/sales-register/page';
// import GSTSalesReport from '@/pages/reports/gst-sales/page';
// import OutstandingReport from '@/pages/reports/outstanding/page';
// import DayBookReport from '@/pages/reports/day-book/page';
// import PartyLedgerReport from '@/pages/reports/party-ledger/page';
// import ResetPasswordPage from '@/pages/reset-password/page';

// // ── Route wrappers ────────────────────────────────────────────────────────────

// import { useAuth } from "@/contexts/AuthContext";

// const P = ({
//   children,
//   roles,
//   requirePermission,
// }: {
//   children: React.ReactNode;
//   roles?: string[];
//   requirePermission?: () => boolean;
// }) => {
//   return (
//     <ProtectedRoute
//       requiredRoles={roles}
//       requirePermission={requirePermission}
//     >
//       {children}
//     </ProtectedRoute>
//   );
// };


// /**
//  * Guard-only route — accessible ONLY by SECURITY_GUARD.
//  * Any other role trying to access /guard/* gets redirected to /dashboard.
//  */
// const GuardOnly = ({ children }: { children: React.ReactNode }) => (
//   <ProtectedRoute requiredRoles={['SECURITY_GUARD'] as never}>{children}</ProtectedRoute>
// );

// const routes: RouteObject[] = [
//   { path: '/login', element: <LoginPage /> },
//   { path: '/forgot-password', element: <ForgetPasswordPage /> },
//   { path: '/reset-password/:token', element: <ResetPasswordPage /> },

//   { path: '/', element: <P><Dashboard /></P> },
//   { path: '/settings', element: <P roles={['SUPER_ADMIN']}><Settings /></P> },
//   { path: '/users', element: <P roles={['SUPER_ADMIN', 'SUB_ADMIN']}><Users /></P> },

//   // Masters
//   { path: '/masters', element: <Navigate to="/masters/company" replace /> },
//   // { path: '/masters/warehouses', element: <P roles={['SUPER_ADMIN', 'SUB_ADMIN']}><WarehousesPage /></P> },
//   {
//   path: '/masters/warehouses',
//   element: (
//     <P module={MODULES.WAREHOUSES} action="view">
//       <WarehousesPage />
//     </P>
//     ),
//   },
//  {
//   path: '/masters/parties',
//   element: (
//     <P
//       requirePermission={() =>
//         hasPermission(MODULES.PARTIES, "view")
//       }
//     >
//       <PartiesPage />
//     </P>
//   ),
// },
//   // { path: '/masters/parties', element: <P><PartiesPage /></P> },
//   { path: '/masters/items', element: <P><ItemsPage /></P> },
//   { path: '/masters/categories', element: <P roles={['SUPER_ADMIN', 'SUB_ADMIN']}><CategoriesUnitsPage /></P> },

//   // Sales
//   { path: '/sales', element: <Navigate to="/sales/invoices" replace /> },
//   {
//   path: '/sales/invoices',
//   element: (
//     <P module={MODULES.SALES_INVOICE} action="view">
//       <SalesInvoiceListPage />
//     </P>
//   ),
// }
// ,
//   { path: '/sales/invoices/new', element: <P><SalesInvoiceNewPage /></P> },
//   { path: '/sales/returns', element: <P><SaleReturnsPage /></P> },
//   { path: '/sales/challans', element: <P><ChallansPage /></P> },
//   { path: '/sales/payments', element: <P><SalesPaymentsHistoryPage /></P> },
//   { path: '/sales/payments/new', element: <P><SalesPaymentPage /></P> },

//   // Purchase
//   { path: '/purchase', element: <Navigate to="/purchase/orders" replace /> },
//   { path: '/purchase/orders', element: <P><PurchaseOrdersPage /></P> },
//   { path: '/purchase/orders/new', element: <P><PurchaseOrderNewPage /></P> },
//   { path: '/purchase/invoices', element: <P><PurchaseInvoiceListPage /></P> },
//   { path: '/purchase/invoices/new', element: <P><PurchaseInvoiceNewPage /></P> },
//   { path: '/purchase/payments', element: <P><PurchasePaymentsHistoryPage /></P> },
//   { path: '/purchase/payments/new', element: <P><PurchasePaymentPage /></P> },
//   { path: '/purchase/grn', element: <P><GRNListPage /></P> },
//   { path: '/purchase/returns', element: <P><PurchaseReturnsPage /></P> },

//   // Inventory
//   { path: '/inventory', element: <Navigate to="/inventory/stock" replace /> },
//   { path: '/inventory/stock', element: <P><StockViewPage /></P> },
//   { path: '/inventory/receiving', element: <P><StockReceivingPage /></P> },
//   { path: '/inventory/transfer', element: <P><StockTransferPage /></P> },
//   {
//   path: '/inventory/adjustment',
//   element: (
//     <P module={MODULES.STOCK_ADJUSTMENT} action="update">
//       <StockAdjustmentPage />
//     </P>
//   ),
// }
// ,
//   { path: '/inventory/stock-entries', element: <P><StockEntriesPage /></P> },

//   // ── Gate Pass (under Inventory — non-guard users) ─────────────────────────
//   {
//     path: '/inventory/gate-pass',
//     element: <Navigate to="/inventory/gate-pass/outward" replace />,
//   },
//   {
//     path: '/inventory/gate-pass/outward',
//     element: (
//       <P roles={['SUPER_ADMIN', 'SUB_ADMIN', 'END_USER']}>
//         <OutwardGatePassPage />
//       </P>
//     ),
//   },
//   {
//     path: '/inventory/gate-pass/inward',
//     element: (
//       <P roles={['SUPER_ADMIN', 'SUB_ADMIN', 'END_USER']}>
//         <InwardGatePassPage />
//       </P>
//     ),
//   },

//   // Print
//   { path: '/print', element: <Navigate to="/print/barcode-management" replace /> },
//   { path: '/print/barcode-management', element: <P><BarcodeManagementPage /></P> },
//   // Legacy redirect
//   { path: '/inventory/barcode-management', element: <Navigate to="/print/barcode-management" replace /> },

//   // ── Guard-only routes (/guard/*) ──────────────────────────────────────────
//   // SECURITY_GUARD is redirected here after login.
//   // Non-guard users who try to access /guard/* are blocked by GuardOnly wrapper.
//   { path: '/guard', element: <Navigate to="/guard/dashboard" replace /> },
//   { path: '/guard/dashboard', element: <GuardOnly><GuardDashboard /></GuardOnly> },
//   { path: '/guard/outward', element: <GuardOnly><GuardOutwardPage /></GuardOnly> },
//   { path: '/guard/inward', element: <GuardOnly><GuardInwardPage /></GuardOnly> },

//   // Reports (commented out — uncomment when ready)
//   { path: '/reports', element: <P><ReportsLanding /></P> },
//   { path: '/reports/stock-summary', element: <P><StockSummaryReport /></P> },
//   { path: '/reports/stock-ledger', element: <P><StockLedgerReport /></P> },
//   { path: '/reports/low-stock', element: <P><LowStockReport /></P> },
//   { path: '/reports/purchase-register', element: <P><PurchaseRegisterReport /></P> },
//   { path: '/reports/gst-purchase', element: <P><GSTPurchaseReport /></P> },
//   { path: '/reports/sales-register', element: <P><SalesRegisterReport /></P> },
//   { path: '/reports/gst-sales', element: <P><GSTSalesReport /></P> },
//   { path: '/reports/outstanding', element: <P><OutstandingReport /></P> },
//   { path: '/reports/day-book', element: <P><DayBookReport /></P> },
//   { path: '/reports/party-ledger', element: <P><PartyLedgerReport /></P> },

//   { path: '*', element: <NotFound /> },
// ];

// export default routes;