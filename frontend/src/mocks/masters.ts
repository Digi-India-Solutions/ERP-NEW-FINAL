// ─── Company ─────────────────────────────────────────────────────────────────
export const mockCompany = {
  id: 'cmp-001',
  name: 'InvenPro Solutions Pvt. Ltd.',
  address: '204, Tech Park, Baner Road, Pune, Maharashtra 411045',
  gstin: '27AABCU9603R1ZX',
  pan: 'AABCU9603R',
  stateCode: '27',
  stateName: 'Maharashtra',
  phone: '+91 98765 43210',
  email: 'accounts@invenpro.com',
  website: 'www.invenpro.com',
  logoUrl: '',
  financialYearStart: '2024-04-01',
  invoicePrefix: 'INV',
  purchasePrefix: 'PO',
};

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const mockWarehouses = [
  { id: 'wh-001', name: 'Main Warehouse', type: 'GODOWN' as const, address: '204, Tech Park, Baner, Pune 411045', inchargeName: 'Suresh Patil', inchargePhone: '9876543210', isActive: true, itemCount: 128, totalValue: 4820000 },
  { id: 'wh-002', name: 'North Branch', type: 'BRANCH' as const, address: '12, Industrial Area, Pimpri, Pune 411018', inchargeName: 'Kavita Rao', inchargePhone: '9876543211', isActive: true, itemCount: 64, totalValue: 1940000 },
  { id: 'wh-003', name: 'South Depot', type: 'GODOWN' as const, address: '89, MIDC, Hadapsar, Pune 411028', inchargeName: 'Mohan Das', inchargePhone: '9876543212', isActive: true, itemCount: 45, totalValue: 1220000 },
  { id: 'wh-004', name: 'Head Office', type: 'OFFICE' as const, address: '501, Baner Road, Pune 411045', inchargeName: 'Anita Singh', inchargePhone: '9876543213', isActive: true, itemCount: 12, totalValue: 380000 },
  { id: 'wh-005', name: 'Manufacturing Plant', type: 'FACTORY' as const, address: 'Plot 22, MIDC Chakan, Pune 410501', inchargeName: 'Rajesh Nair', inchargePhone: '9876543214', isActive: true, itemCount: 210, totalValue: 8640000 },
  { id: 'wh-006', name: 'Retail Store', type: 'STORE' as const, address: '14, FC Road, Pune 411004', inchargeName: 'Priya Mehta', inchargePhone: '9876543215', isActive: true, itemCount: 88, totalValue: 2160000 },
];

// ─── Parties ──────────────────────────────────────────────────────────────────
export const mockParties = [
  { id: 'pty-001', name: 'Ramesh Electronics', type: 'CUSTOMER' as const, gstin: '27AADCR4849M1ZV', pan: 'AADCR4849M', phone: '9812345670', email: 'ramesh@electronics.in', billingAddress: '45, MG Road, Pune 411001', shippingAddress: '45, MG Road, Pune 411001', stateCode: '27', stateName: 'Maharashtra', creditLimit: 600000, creditDays: 30, openingBalance: 12500, isActive: true, balance: 28400 },
  { id: 'pty-002', name: 'TechSupply Co.', type: 'SUPPLIER' as const, gstin: '29AACCT3428D1Z2', pan: 'AACCT3428D', phone: '9823456780', email: 'purchase@techsupply.com', billingAddress: '18, Industrial Area, Bengaluru 560095', shippingAddress: '18, Industrial Area, Bengaluru 560095', stateCode: '29', stateName: 'Karnataka', creditLimit: 1000000, creditDays: 45, openingBalance: 0, isActive: true, balance: -146000 },
  { id: 'pty-003', name: 'Global IT Solutions', type: 'BOTH' as const, gstin: '07AABCG5678H1ZP', pan: 'AABCG5678H', phone: '9834567890', email: 'billing@globalit.in', billingAddress: 'B-24, Sector 18, Noida 201301', shippingAddress: 'B-24, Sector 18, Noida 201301', stateCode: '07', stateName: 'Delhi', creditLimit: 760000, creditDays: 30, openingBalance: 6000, isActive: true, balance: 67200 },
  { id: 'pty-004', name: 'Priya Computers', type: 'CUSTOMER' as const, gstin: '27AAACP1234Q1ZA', pan: 'AAACP1234Q', phone: '9845678901', email: 'priya@computers.in', billingAddress: '7, Laxmi Road, Pune 411030', shippingAddress: '7, Laxmi Road, Pune 411030', stateCode: '27', stateName: 'Maharashtra', creditLimit: 260000, creditDays: 15, openingBalance: 0, isActive: true, balance: 18900 },
  { id: 'pty-005', name: 'NexGen Components', type: 'SUPPLIER' as const, gstin: '33AABCN9012E1ZK', pan: 'AABCN9012E', phone: '9856789012', email: 'sales@nexgen.in', billingAddress: '103, Anna Salai, Chennai 600002', shippingAddress: '103, Anna Salai, Chennai 600002', stateCode: '33', stateName: 'Tamil Nadu', creditLimit: 2000000, creditDays: 60, openingBalance: 0, isActive: true, balance: -320000 },
  { id: 'pty-006', name: 'Apex Hardware', type: 'CUSTOMER' as const, gstin: '06AABCA5432F1ZX', pan: 'AABCA5432F', phone: '9867890123', email: 'apex@hardware.in', billingAddress: 'Plot 12, Gurgaon Industrial Area 122001', shippingAddress: 'Plot 12, Gurgaon Industrial Area 122001', stateCode: '06', stateName: 'Haryana', creditLimit: 400000, creditDays: 30, openingBalance: 8000, isActive: false, balance: 0 },
];

// ─── Categories ───────────────────────────────────────────────────────────────
export const mockCategories = [
  { id: 'cat-001', name: 'Electronics', parentId: null, parentName: null, itemCount: 42, isActive: true, requiresNarration: true },
  { id: 'cat-002', name: 'Accessories', parentId: null, parentName: null, itemCount: 87, isActive: true, requiresNarration: false },
  { id: 'cat-003', name: 'Laptops & Desktops', parentId: 'cat-001', parentName: 'Electronics', itemCount: 18, isActive: true, requiresNarration: true },
  { id: 'cat-004', name: 'Monitors & Displays', parentId: 'cat-001', parentName: 'Electronics', itemCount: 12, isActive: true, requiresNarration: true },
  { id: 'cat-005', name: 'Keyboards & Mice', parentId: 'cat-002', parentName: 'Accessories', itemCount: 24, isActive: true, requiresNarration: false },
  { id: 'cat-006', name: 'Cables & Adapters', parentId: 'cat-002', parentName: 'Accessories', itemCount: 31, isActive: true, requiresNarration: false },
  { id: 'cat-007', name: 'Storage', parentId: 'cat-001', parentName: 'Electronics', itemCount: 22, isActive: true, requiresNarration: true },
  { id: 'cat-008', name: 'Networking', parentId: null, parentName: null, itemCount: 15, isActive: true, requiresNarration: false },
  { id: 'cat-009', name: 'Printers & Scanners', parentId: null, parentName: null, itemCount: 9, isActive: true, requiresNarration: false },
  { id: 'cat-010', name: 'Server & UPS', parentId: 'cat-001', parentName: 'Electronics', itemCount: 6, isActive: true, requiresNarration: true },
];

// ─── Warehouse Stock ──────────────────────────────────────────────────────────
// Per-warehouse stock levels for each item
export const mockWarehouseStock: Record<string, Record<string, number>> = {
  'wh-001': {
    'itm-001': 38, 'itm-002': 124, 'itm-003': 89, 'itm-004': 45,
    'itm-005': 4,  'itm-006': 3,   'itm-007': 6,  'itm-008': 2,
    'itm-009': 67, 'itm-010': 54,  'itm-011': 29, 'itm-012': 16,
  },
  'wh-002': {
    'itm-001': 12, 'itm-002': 55,  'itm-003': 30, 'itm-004': 18,
    'itm-005': 0,  'itm-006': 8,   'itm-007': 22, 'itm-008': 5,
    'itm-009': 20, 'itm-010': 15,  'itm-011': 10, 'itm-012': 7,
  },
  'wh-003': {
    'itm-001': 5,  'itm-002': 30,  'itm-003': 15, 'itm-004': 8,
    'itm-005': 2,  'itm-006': 1,   'itm-007': 10, 'itm-008': 0,
    'itm-009': 25, 'itm-010': 18,  'itm-011': 6,  'itm-012': 4,
  },
  'wh-004': {
    'itm-001': 2,  'itm-002': 10,  'itm-003': 5,  'itm-004': 3,
    'itm-005': 1,  'itm-006': 2,   'itm-007': 8,  'itm-008': 1,
    'itm-009': 5,  'itm-010': 4,   'itm-011': 3,  'itm-012': 2,
  },
  'wh-005': {
    'itm-001': 50, 'itm-002': 200, 'itm-003': 120,'itm-004': 80,
    'itm-005': 15, 'itm-006': 25,  'itm-007': 60, 'itm-008': 12,
    'itm-009': 90, 'itm-010': 75,  'itm-011': 40, 'itm-012': 30,
  },
  'wh-006': {
    'itm-001': 8,  'itm-002': 45,  'itm-003': 22, 'itm-004': 15,
    'itm-005': 3,  'itm-006': 12,  'itm-007': 18, 'itm-008': 4,
    'itm-009': 30, 'itm-010': 22,  'itm-011': 14, 'itm-012': 9,
  },
};

// ─── Units ────────────────────────────────────────────────────────────────────
export const mockUnits = [
  { id: 'unt-001', name: 'Pieces', shortName: 'Pcs', isActive: true, itemCount: 142 },
  { id: 'unt-002', name: 'Kilograms', shortName: 'Kg', isActive: true, itemCount: 12 },
  { id: 'unt-003', name: 'Litres', shortName: 'Ltr', isActive: true, itemCount: 8 },
  { id: 'unt-004', name: 'Boxes', shortName: 'Box', isActive: true, itemCount: 34 },
  { id: 'unt-005', name: 'Meters', shortName: 'Mtr', isActive: true, itemCount: 6 },
  { id: 'unt-006', name: 'Pairs', shortName: 'Pr', isActive: true, itemCount: 4 },
  { id: 'unt-007', name: 'Sets', shortName: 'Set', isActive: true, itemCount: 18 },
  { id: 'unt-008', name: 'Rolls', shortName: 'Roll', isActive: false, itemCount: 0 },
];

// ─── Items ────────────────────────────────────────────────────────────────────
export const mockItems = [
  { id: 'itm-001', name: 'Laptop 15" Core i7', code: 'ITM-0001', barcode: '8901234567890', companyBarcode: '8901234567890', categoryId: 'cat-003', categoryName: 'Laptops & Desktops', hsnCode: '84713010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 72000, saleRate: 86000, mrp: 90000, minStockLevel: 10, stock: 38, isActive: true, size: '15"', group: 'Laptops', brand: 'Generic', articleNo: 'LPT-I7-001', color: 'Silver', markUpPct: 18, purExpPct: 2, saleDisPct: 5 },
  { id: 'itm-002', name: 'Wireless Mouse Logitech M235', code: 'ITM-0002', barcode: '7612345678901', companyBarcode: '7612345678901', categoryId: 'cat-005', categoryName: 'Keyboards & Mice', hsnCode: '84716060', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 850, saleRate: 1200, mrp: 1499, minStockLevel: 20, stock: 124, isActive: true, size: 'Standard', group: 'Peripherals', brand: 'Logitech', articleNo: 'M235-BLK', color: 'Black', markUpPct: 41, purExpPct: 1, saleDisPct: 10 },
  { id: 'itm-003', name: 'USB-C 7-in-1 Hub', code: 'ITM-0003', barcode: '7623456789012', companyBarcode: '7623456789012', categoryId: 'cat-006', categoryName: 'Cables & Adapters', hsnCode: '85444290', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 1200, saleRate: 1800, mrp: 2199, minStockLevel: 15, stock: 89, isActive: true, size: 'Universal', group: 'Adapters', brand: 'Anker', articleNo: 'HUB-7IN1', color: 'Gray', markUpPct: 50, purExpPct: 1, saleDisPct: 8 },
  { id: 'itm-004', name: 'Mechanical Keyboard RGB', code: 'ITM-0004', barcode: '7634567890123', companyBarcode: '7634567890123', categoryId: 'cat-005', categoryName: 'Keyboards & Mice', hsnCode: '84716060', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 5500, saleRate: 7500, mrp: 8999, minStockLevel: 10, stock: 45, isActive: true, size: 'Full Size', group: 'Peripherals', brand: 'Corsair', articleNo: 'KB-RGB-001', color: 'Black', markUpPct: 36, purExpPct: 1, saleDisPct: 5 },
  { id: 'itm-005', name: 'Monitor 24" Full HD IPS', code: 'ITM-0045', barcode: '8645678901234', companyBarcode: '8645678901234', categoryId: 'cat-004', categoryName: 'Monitors & Displays', hsnCode: '85285200', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 12000, saleRate: 16000, mrp: 17999, minStockLevel: 10, stock: 4, isActive: true, size: '24"', group: 'Monitors', brand: 'LG', articleNo: 'MON-24FHD', color: 'Black', markUpPct: 25, purExpPct: 2, saleDisPct: 5 },
  { id: 'itm-006', name: 'Laptop Bag 15.6" Waterproof', code: 'ITM-0078', barcode: '8656789012345', companyBarcode: '8656789012345', categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '42021200', taxRate: 12, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 800, saleRate: 1200, mrp: 1499, minStockLevel: 15, stock: 3, isActive: true, size: '15.6"', group: 'Bags', brand: 'Wildcraft', articleNo: 'BAG-156-WP', color: 'Black', markUpPct: 50, purExpPct: 1, saleDisPct: 10 },
  { id: 'itm-007', name: 'HDMI Cable 2m v2.0', code: 'ITM-0112', barcode: '8667890123456', companyBarcode: '8667890123456', categoryId: 'cat-006', categoryName: 'Cables & Adapters', hsnCode: '85444290', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 150, saleRate: 250, mrp: 399, minStockLevel: 25, stock: 6, isActive: true, size: '2m', group: 'Cables', brand: 'Belkin', articleNo: 'HDMI-2M-V2', color: 'Black', markUpPct: 67, purExpPct: 0, saleDisPct: 5 },
  { id: 'itm-008', name: 'Network Switch 8-Port', code: 'ITM-0150', barcode: '8678901234567', companyBarcode: '8678901234567', categoryId: 'cat-008', categoryName: 'Networking', hsnCode: '85176200', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 3200, saleRate: 4500, mrp: 5499, minStockLevel: 5, stock: 2, isActive: true, size: '8-Port', group: 'Networking', brand: 'TP-Link', articleNo: 'SW-8P-100', color: 'Gray', markUpPct: 41, purExpPct: 1, saleDisPct: 5 },
  { id: 'itm-009', name: 'SSD 1TB NVMe Samsung', code: 'ITM-0200', barcode: '8689012345678', companyBarcode: '8689012345678', categoryId: 'cat-007', categoryName: 'Storage', hsnCode: '84717010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 6500, saleRate: 8500, mrp: 9999, minStockLevel: 20, stock: 67, isActive: true, size: '1TB', group: 'Storage', brand: 'Samsung', articleNo: '980PRO-1TB', color: 'Black', markUpPct: 31, purExpPct: 1, saleDisPct: 5 },
  { id: 'itm-010', name: 'RAM 16GB DDR5 3200MHz', code: 'ITM-0201', barcode: '8690123456789', companyBarcode: '8690123456789', categoryId: 'cat-007', categoryName: 'Storage', hsnCode: '84717010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 4800, saleRate: 6200, mrp: 7499, minStockLevel: 15, stock: 54, isActive: true, size: '16GB', group: 'Memory', brand: 'Corsair', articleNo: 'RAM-16G-D5', color: 'Black', markUpPct: 29, purExpPct: 1, saleDisPct: 5 },
  { id: 'itm-011', name: 'Webcam 1080p with Mic', code: 'ITM-0222', barcode: '8601234567890', companyBarcode: '8601234567890', categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '85258090', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 1800, saleRate: 2500, mrp: 2999, minStockLevel: 12, stock: 29, isActive: true, size: 'Standard', group: 'Webcams', brand: 'Logitech', articleNo: 'CAM-1080P', color: 'Black', markUpPct: 39, purExpPct: 1, saleDisPct: 8 },
  { id: 'itm-012', name: 'Wi-Fi 6 Router AX1800', code: 'ITM-0230', barcode: '8612345678901', companyBarcode: '8612345678901', categoryId: 'cat-008', categoryName: 'Networking', hsnCode: '85176200', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 4200, saleRate: 5800, mrp: 6999, minStockLevel: 8, stock: 16, isActive: true, size: 'AX1800', group: 'Routers', brand: 'TP-Link', articleNo: 'RTR-AX1800', color: 'White', markUpPct: 38, purExpPct: 1, saleDisPct: 5 },
  // Items without barcode (to show disabled state in Barcode Management)
  { id: 'itm-013', name: 'USB 3.0 Flash Drive 64GB', code: 'ITM-0240', barcode: null, companyBarcode: null, categoryId: 'cat-007', categoryName: 'Storage', hsnCode: '84717010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 350, saleRate: 550, mrp: 699, minStockLevel: 30, stock: 42, isActive: true, size: '64GB', group: 'Storage', brand: 'SanDisk', articleNo: 'FD-64G-USB3', color: 'Black', markUpPct: 57, purExpPct: 0, saleDisPct: 5 },
  { id: 'itm-014', name: 'Bluetooth Speaker Portable', code: 'ITM-0241', barcode: null, companyBarcode: null, categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '85182100', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 1500, saleRate: 2200, mrp: 2799, minStockLevel: 10, stock: 18, isActive: true, size: 'Portable', group: 'Audio', brand: 'JBL', articleNo: 'SPK-BT-001', color: 'Blue', markUpPct: 47, purExpPct: 1, saleDisPct: 8 },
  { id: 'itm-015', name: 'Laptop Cooling Pad', code: 'ITM-0242', barcode: null, companyBarcode: null, categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '84145990', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 600, saleRate: 950, mrp: 1199, minStockLevel: 15, stock: 25, isActive: true, size: 'Universal', group: 'Accessories', brand: 'Havit', articleNo: 'COOL-PAD-001', color: 'Black', markUpPct: 58, purExpPct: 0, saleDisPct: 5 },
];

// ─── Roles ────────────────────────────────────────────────────────────────────
export const mockRoles = [
  {
    id: 'role-001',
    name: 'Billing Staff',
    description: 'Can create and edit sales invoices, challans, and view basic reports',
    isSystem: false,
    isActive: true,
    createdAt: '2024-04-01T00:00:00Z',
    createdBy: 'Admin User',
    usersAssigned: 2,
    permissions: {
      dashboard: { view: true },
      sales_invoice: { view: true, create: true, edit: true, delete: false },
      sale_return: { view: true, create: false, edit: false, delete: false },
      challan: { view: true, create: true, edit: true, delete: false },
      purchase_order: { view: false, create: false, edit: false, delete: false },
      purchase_invoice: { view: false, create: false, edit: false, delete: false },
      purchase_return: { view: false, create: false, edit: false, delete: false },
      stock_receiving: { view: false, create: false },
      stock_transfer: { view: false, create: false, edit: false, delete: false },
      stock_adjustment: { view: false, create: false },
      stock_entries: { view: false, create: false },
      grn_history: { view: false },
      parties: { view: true, create: false, edit: false, delete: false },
      items: { view: true, create: false, edit: false, delete: false },
      warehouses: { view: false, create: false, edit: false, delete: false },
      reports: { view: true },
      users: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, edit: false },
    },
    additionalControls: {
      approveStockTransfer: false,
      approveStockAdjustment: false,
      viewAllWarehouses: false,
      exportData: false,
      viewFinancialReports: false,
      editLockedRecords: false,
      convertChallan: true,
      manageUserPermissions: false,
    },
  },
  {
    id: 'role-002',
    name: 'Warehouse Staff',
    description: 'Manages stock receiving, GRN, stock transfers and inventory view',
    isSystem: false,
    isActive: true,
    createdAt: '2024-04-01T00:00:00Z',
    createdBy: 'Admin User',
    usersAssigned: 3,
    permissions: {
      dashboard: { view: true },
      sales_invoice: { view: false, create: false, edit: false, delete: false },
      sale_return: { view: false, create: false, edit: false, delete: false },
      challan: { view: false, create: false, edit: false, delete: false },
      purchase_order: { view: true, create: false, edit: false, delete: false },
      purchase_invoice: { view: false, create: false, edit: false, delete: false },
      purchase_return: { view: false, create: false, edit: false, delete: false },
      stock_receiving: { view: true, create: true },
      stock_transfer: { view: true, create: true, edit: false, delete: false },
      stock_adjustment: { view: true, create: false },
      stock_entries: { view: true, create: true },
      grn_history: { view: true },
      parties: { view: true, create: false, edit: false, delete: false },
      items: { view: true, create: false, edit: false, delete: false },
      warehouses: { view: true, create: false, edit: false, delete: false },
      reports: { view: false },
      users: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, edit: false },
    },
    additionalControls: {
      approveStockTransfer: false,
      approveStockAdjustment: false,
      viewAllWarehouses: false,
      exportData: false,
      viewFinancialReports: false,
      editLockedRecords: false,
      convertChallan: false,
      manageUserPermissions: false,
    },
  },
  {
    id: 'role-003',
    name: 'Accountant',
    description: 'View-only access to all modules, can export data and view financial reports',
    isSystem: false,
    isActive: true,
    createdAt: '2024-05-10T00:00:00Z',
    createdBy: 'Admin User',
    usersAssigned: 1,
    permissions: {
      dashboard: { view: true },
      sales_invoice: { view: true, create: false, edit: false, delete: false },
      sale_return: { view: true, create: false, edit: false, delete: false },
      challan: { view: true, create: false, edit: false, delete: false },
      purchase_order: { view: true, create: false, edit: false, delete: false },
      purchase_invoice: { view: true, create: false, edit: false, delete: false },
      purchase_return: { view: true, create: false, edit: false, delete: false },
      stock_receiving: { view: true, create: false },
      stock_transfer: { view: true, create: false, edit: false, delete: false },
      stock_adjustment: { view: true, create: false },
      stock_entries: { view: true, create: false },
      grn_history: { view: true },
      parties: { view: true, create: false, edit: false, delete: false },
      items: { view: true, create: false, edit: false, delete: false },
      warehouses: { view: true, create: false, edit: false, delete: false },
      reports: { view: true },
      users: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, edit: false },
    },
    additionalControls: {
      approveStockTransfer: false,
      approveStockAdjustment: false,
      viewAllWarehouses: true,
      exportData: true,
      viewFinancialReports: true,
      editLockedRecords: false,
      convertChallan: false,
      manageUserPermissions: false,
    },
  },
  {
    id: 'role-004',
    name: 'Purchase Manager',
    description: 'Full access to all purchase modules, can approve stock transfers',
    isSystem: false,
    isActive: true,
    createdAt: '2024-06-01T00:00:00Z',
    createdBy: 'Admin User',
    usersAssigned: 1,
    permissions: {
      dashboard: { view: true },
      sales_invoice: { view: true, create: false, edit: false, delete: false },
      sale_return: { view: false, create: false, edit: false, delete: false },
      challan: { view: false, create: false, edit: false, delete: false },
      purchase_order: { view: true, create: true, edit: true, delete: true },
      purchase_invoice: { view: true, create: true, edit: true, delete: false },
      purchase_return: { view: true, create: true, edit: true, delete: false },
      stock_receiving: { view: true, create: true },
      stock_transfer: { view: true, create: true, edit: true, delete: false },
      stock_adjustment: { view: true, create: true },
      stock_entries: { view: true, create: false },
      grn_history: { view: true },
      parties: { view: true, create: true, edit: true, delete: false },
      items: { view: true, create: false, edit: false, delete: false },
      warehouses: { view: true, create: false, edit: false, delete: false },
      reports: { view: true },
      users: { view: false, create: false, edit: false, delete: false },
      settings: { view: false, edit: false },
    },
    additionalControls: {
      approveStockTransfer: true,
      approveStockAdjustment: true,
      viewAllWarehouses: true,
      exportData: false,
      viewFinancialReports: false,
      editLockedRecords: false,
      convertChallan: false,
      manageUserPermissions: false,
    },
  },
];

// ─── Users ────────────────────────────────────────────────────────────────────
export const mockUsers = [
  {
    id: 'usr-001',
    name: 'Admin User',
    email: 'admin@invenpro.com',
    phone: '9900000001',
    role: 'SUPER_ADMIN' as const,
    roleId: '',
    roleName: 'Super Admin',
    isSuperAdmin: true,
    warehouseIds: ['wh-001', 'wh-002', 'wh-003', 'wh-004', 'wh-005', 'wh-006'],
    assignedWarehouses: [
      { warehouseId: 'wh-001', warehouseName: 'Main Warehouse', warehouseType: 'GODOWN' as const, isPrimary: true },
      { warehouseId: 'wh-002', warehouseName: 'North Branch', warehouseType: 'BRANCH' as const, isPrimary: false },
      { warehouseId: 'wh-003', warehouseName: 'South Depot', warehouseType: 'GODOWN' as const, isPrimary: false },
      { warehouseId: 'wh-004', warehouseName: 'Head Office', warehouseType: 'OFFICE' as const, isPrimary: false },
      { warehouseId: 'wh-005', warehouseName: 'Manufacturing Plant', warehouseType: 'FACTORY' as const, isPrimary: false },
      { warehouseId: 'wh-006', warehouseName: 'Retail Store', warehouseType: 'STORE' as const, isPrimary: false },
    ],
    permissionOverrides: {},
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'usr-002',
    name: 'Priya Sharma',
    email: 'priya@invenpro.com',
    phone: '9912345678',
    role: 'END_USER' as const,
    roleId: 'role-001',
    roleName: 'Billing Staff',
    isSuperAdmin: false,
    warehouseIds: ['wh-001'],
    assignedWarehouses: [
      { warehouseId: 'wh-001', warehouseName: 'Main Warehouse', warehouseType: 'GODOWN' as const, isPrimary: true },
    ],
    permissionOverrides: {},
    isActive: true,
    lastLoginAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    createdAt: '2024-04-01T00:00:00Z',
  },
  {
    id: 'usr-003',
    name: 'Raj Kumar',
    email: 'raj@invenpro.com',
    phone: '9823456789',
    role: 'END_USER' as const,
    roleId: 'role-002',
    roleName: 'Warehouse Staff',
    isSuperAdmin: false,
    warehouseIds: ['wh-001', 'wh-002'],
    assignedWarehouses: [
      { warehouseId: 'wh-001', warehouseName: 'Main Warehouse', warehouseType: 'GODOWN' as const, isPrimary: true },
      { warehouseId: 'wh-002', warehouseName: 'North Branch', warehouseType: 'BRANCH' as const, isPrimary: false },
    ],
    permissionOverrides: {},
    isActive: true,
    lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: '2024-05-10T00:00:00Z',
  },
  {
    id: 'usr-004',
    name: 'Neha Singh',
    email: 'neha@invenpro.com',
    phone: '9734567890',
    role: 'END_USER' as const,
    roleId: 'role-003',
    roleName: 'Accountant',
    isSuperAdmin: false,
    warehouseIds: ['wh-001'],
    assignedWarehouses: [
      { warehouseId: 'wh-001', warehouseName: 'Main Warehouse', warehouseType: 'GODOWN' as const, isPrimary: true },
    ],
    permissionOverrides: {},
    isActive: true,
    lastLoginAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    createdAt: '2024-06-15T00:00:00Z',
  },
  {
    id: 'usr-005',
    name: 'Amit Patel',
    email: 'amit@invenpro.com',
    phone: '9645678901',
    role: 'END_USER' as const,
    roleId: 'role-004',
    roleName: 'Purchase Manager',
    isSuperAdmin: false,
    warehouseIds: ['wh-001', 'wh-002', 'wh-003', 'wh-004', 'wh-005'],
    assignedWarehouses: [
      { warehouseId: 'wh-001', warehouseName: 'Main Warehouse', warehouseType: 'GODOWN' as const, isPrimary: true },
      { warehouseId: 'wh-002', warehouseName: 'North Branch', warehouseType: 'BRANCH' as const, isPrimary: false },
      { warehouseId: 'wh-003', warehouseName: 'South Depot', warehouseType: 'GODOWN' as const, isPrimary: false },
      { warehouseId: 'wh-004', warehouseName: 'Head Office', warehouseType: 'OFFICE' as const, isPrimary: false },
      { warehouseId: 'wh-005', warehouseName: 'Manufacturing Plant', warehouseType: 'FACTORY' as const, isPrimary: false },
    ],
    permissionOverrides: {},
    isActive: true,
    lastLoginAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    createdAt: '2024-07-01T00:00:00Z',
  },
  {
    id: 'usr-006',
    name: 'Deepak Kumar',
    email: 'deepak@invenpro.com',
    phone: '9556789012',
    role: 'SUB_ADMIN' as const,
    roleId: '',
    roleName: 'Manager',
    isSuperAdmin: false,
    warehouseIds: ['wh-002', 'wh-003'],
    assignedWarehouses: [
      { warehouseId: 'wh-002', warehouseName: 'North Branch', warehouseType: 'BRANCH' as const, isPrimary: true },
      { warehouseId: 'wh-003', warehouseName: 'South Depot', warehouseType: 'GODOWN' as const, isPrimary: false },
    ],
    permissionOverrides: {},
    isActive: true,
    lastLoginAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    createdAt: '2024-08-20T00:00:00Z',
  },
];

// ─── Work Centers ─────────────────────────────────────────────────────────────
export interface MockWorkCenter {
  id: string;
  name: string;
  type: 'MACHINE' | 'LABOR' | 'BOTH';
  capacityPerHour: number;
  warehouseId: string | null;
  description: string;
  isActive: boolean;
}

export const mockWorkCenters: MockWorkCenter[] = [
  { id: 'wc-001', name: 'Cutting Area', type: 'MACHINE', capacityPerHour: 120, warehouseId: 'wh-005', description: 'CNC cutting and precision machining area', isActive: true },
  { id: 'wc-002', name: 'Assembly Line 1', type: 'BOTH', capacityPerHour: 60, warehouseId: 'wh-005', description: 'Main assembly line for gear assemblies and pumps', isActive: true },
  { id: 'wc-003', name: 'Packing Zone', type: 'LABOR', capacityPerHour: 200, warehouseId: 'wh-005', description: 'Final packaging and labeling station', isActive: true },
];

// ─── Cost Centers ─────────────────────────────────────────────────────────────
export interface MockCostCenter {
  id: string;
  name: string;
  code: string;
  type: 'PRODUCTION' | 'ADMIN' | 'SALES' | 'PURCHASE' | 'QUALITY' | 'MAINTENANCE';
  managerId: string | null;
  managerName: string | null;
  budgetMonthly: number;
  isActive: boolean;
}

export const mockCostCenters: MockCostCenter[] = [
  { id: 'cc-001', name: 'Production Floor', code: 'CC-PROD', type: 'PRODUCTION', managerId: null, managerName: 'Rajesh Nair', budgetMonthly: 500000, isActive: true },
  { id: 'cc-002', name: 'Quality Control', code: 'CC-QC', type: 'QUALITY', managerId: null, managerName: 'Vijay Kumar', budgetMonthly: 150000, isActive: true },
  { id: 'cc-003', name: 'Maintenance', code: 'CC-MAINT', type: 'MAINTENANCE', managerId: null, managerName: 'Suresh Patil', budgetMonthly: 200000, isActive: true },
  { id: 'cc-004', name: 'Administration', code: 'CC-ADMIN', type: 'ADMIN', managerId: null, managerName: 'Anita Singh', budgetMonthly: 300000, isActive: true },
  { id: 'cc-005', name: 'Sales & Marketing', code: 'CC-SALES', type: 'SALES', managerId: null, managerName: null, budgetMonthly: 250000, isActive: false },
];

// ─── Machines ─────────────────────────────────────────────────────────────────
export interface MockMachine {
  id: string;
  name: string;
  model: string;
  workCenterId: string;
  capacityPerHour: number;
  status: 'RUNNING' | 'IDLE' | 'MAINTENANCE' | 'BREAKDOWN';
  lastMaintenanceDate: string;
  maintenanceFrequencyDays: number;
  isActive: boolean;
}

export const mockMachines: MockMachine[] = [
  { id: 'mc-001', name: 'CNC Machine 1', model: 'HASS VF-2', workCenterId: 'wc-001', capacityPerHour: 45, status: 'RUNNING', lastMaintenanceDate: '2024-02-15', maintenanceFrequencyDays: 90, isActive: true },
  { id: 'mc-002', name: 'Welding Robot A', model: 'KUKA KR 16', workCenterId: 'wc-002', capacityPerHour: 30, status: 'RUNNING', lastMaintenanceDate: '2024-03-10', maintenanceFrequencyDays: 120, isActive: true },
  { id: 'mc-003', name: 'Conveyor Belt 1', model: 'FlexLink XL', workCenterId: 'wc-003', capacityPerHour: 200, status: 'MAINTENANCE', lastMaintenanceDate: '2024-03-20', maintenanceFrequencyDays: 60, isActive: true },
  { id: 'mc-004', name: 'Hydraulic Press 2', model: 'Schuler C-frame', workCenterId: 'wc-001', capacityPerHour: 25, status: 'IDLE', lastMaintenanceDate: '2024-01-10', maintenanceFrequencyDays: 180, isActive: true },
];

// ─── Shifts ───────────────────────────────────────────────────────────────────
export interface MockShift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  workingDays: string[];
  isActive: boolean;
}

export const mockShifts: MockShift[] = [
  { id: 'sh-001', name: 'Morning', startTime: '06:00', endTime: '14:00', breakMinutes: 30, workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isActive: true },
  { id: 'sh-002', name: 'Afternoon', startTime: '14:00', endTime: '22:00', breakMinutes: 30, workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], isActive: true },
  { id: 'sh-003', name: 'Night', startTime: '22:00', endTime: '06:00', breakMinutes: 45, workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], isActive: true },
];

// ─── Operators ──────────────────────────────────────────────────────────────────
export interface MockOperator {
  id: string;
  name: string;
  employeeCode: string;
  skill: 'WELDER' | 'MACHINIST' | 'ASSEMBLER' | 'QC_INSPECTOR' | 'SUPERVISOR';
  wageRatePerHour: number;
  shiftId: string;
  isActive: boolean;
  phone?: string | null;
}

export const mockOperators: MockOperator[] = [
  { id: 'op-001', name: 'Ramesh Yadav', employeeCode: 'EMP-101', skill: 'MACHINIST', wageRatePerHour: 180, shiftId: 'sh-001', isActive: true, phone: null },
  { id: 'op-002', name: 'Suresh Patil', employeeCode: 'EMP-102', skill: 'WELDER', wageRatePerHour: 200, shiftId: 'sh-001', isActive: true, phone: null },
  { id: 'op-003', name: 'Anita Sharma', employeeCode: 'EMP-103', skill: 'ASSEMBLER', wageRatePerHour: 150, shiftId: 'sh-002', isActive: true, phone: null },
  { id: 'op-004', name: 'Vijay Kumar', employeeCode: 'EMP-104', skill: 'QC_INSPECTOR', wageRatePerHour: 220, shiftId: 'sh-002', isActive: true, phone: null },
  { id: 'op-005', name: 'Meena Devi', employeeCode: 'EMP-105', skill: 'SUPERVISOR', wageRatePerHour: 280, shiftId: 'sh-003', isActive: true, phone: null },
];