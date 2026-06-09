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
  { id: 'wh-001', name: 'Main Warehouse', type: 'GODOWN' as const, address: '204, Tech Park, Baner, Pune 411045', inchargeName: 'Suresh Patil', inchargePhone: '9876543210', isActive: true, itemCount: 128, totalValue: 4820000, floorZone: 'Zone A, B', storageType: 'GENERAL' as const, workCenterId: null, maxCapacity: 50000, currentUtilization: 42 },
  { id: 'wh-002', name: 'North Branch', type: 'BRANCH' as const, address: '12, Industrial Area, Pimpri, Pune 411018', inchargeName: 'Kavita Rao', inchargePhone: '9876543211', isActive: true, itemCount: 64, totalValue: 1940000, floorZone: null, storageType: 'GENERAL' as const, workCenterId: null, maxCapacity: 20000, currentUtilization: 35 },
  { id: 'wh-003', name: 'South Depot', type: 'GODOWN' as const, address: '89, MIDC, Hadapsar, Pune 411028', inchargeName: 'Mohan Das', inchargePhone: '9876543212', isActive: true, itemCount: 45, totalValue: 1220000, floorZone: null, storageType: 'GENERAL' as const, workCenterId: null, maxCapacity: 15000, currentUtilization: 28 },
  { id: 'wh-004', name: 'Head Office', type: 'OFFICE' as const, address: '501, Baner Road, Pune 411045', inchargeName: 'Anita Singh', inchargePhone: '9876543213', isActive: true, itemCount: 12, totalValue: 380000, floorZone: null, storageType: 'GENERAL' as const, workCenterId: null, maxCapacity: null, currentUtilization: 0 },
  { id: 'wh-005', name: 'Manufacturing Plant', type: 'FACTORY' as const, address: 'Plot 22, MIDC Chakan, Pune 410501', inchargeName: 'Rajesh Nair', inchargePhone: '9876543214', isActive: true, itemCount: 210, totalValue: 8640000, floorZone: 'Plant Floor 1', storageType: 'RAW_MATERIAL' as const, workCenterId: 'wc-001', maxCapacity: 100000, currentUtilization: 65 },
  { id: 'wh-006', name: 'Retail Store', type: 'STORE' as const, address: '14, FC Road, Pune 411004', inchargeName: 'Priya Mehta', inchargePhone: '9876543215', isActive: true, itemCount: 88, totalValue: 2150000, floorZone: null, storageType: 'FINISHED_GOODS' as const, workCenterId: null, maxCapacity: 8000, currentUtilization: 78 },
];

// ─── Parties ──────────────────────────────────────────────────────────────────
export const mockParties = [
  { id: 'pty-001', name: 'Ramesh Electronics', type: 'CUSTOMER' as const, gstin: '27AADCR4849M1ZV', pan: 'AADCR4849M', phone: '9812345670', email: 'ramesh@electronics.in', billingAddress: '45, MG Road, Pune 411001', shippingAddress: '45, MG Road, Pune 411001', stateCode: '27', stateName: 'Maharashtra', creditLimit: 500000, creditDays: 30, openingBalance: 12500, isActive: true, balance: 28400 },
  { id: 'pty-002', name: 'TechSupply Co.', type: 'SUPPLIER' as const, gstin: '29AACCT3428D1Z2', pan: 'AACCT3428D', phone: '9823456780', email: 'purchase@techsupply.com', billingAddress: '18, Industrial Area, Bengaluru 560095', shippingAddress: '18, Industrial Area, Bengaluru 560095', stateCode: '29', stateName: 'Karnataka', creditLimit: 1000000, creditDays: 45, openingBalance: 0, isActive: true, balance: -145000 },
  { id: 'pty-003', name: 'Global IT Solutions', type: 'BOTH' as const, gstin: '07AABCG5678H1ZP', pan: 'AABCG5678H', phone: '9834567890', email: 'billing@globalit.in', billingAddress: 'B-24, Sector 18, Noida 201301', shippingAddress: 'B-24, Sector 18, Noida 201301', stateCode: '07', stateName: 'Delhi', creditLimit: 750000, creditDays: 30, openingBalance: 5000, isActive: true, balance: 67200 },
  { id: 'pty-004', name: 'Priya Computers', type: 'CUSTOMER' as const, gstin: '27AAACP1234Q1ZA', pan: 'AAACP1234Q', phone: '9845678901', email: 'priya@computers.in', billingAddress: '7, Laxmi Road, Pune 411030', shippingAddress: '7, Laxmi Road, Pune 411030', stateCode: '27', stateName: 'Maharashtra', creditLimit: 250000, creditDays: 15, openingBalance: 0, isActive: true, balance: 18900 },
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
export const mockWarehouseStock: Record<string, Record<string, number>> = {
  'wh-001': {
    'itm-001': 38, 'itm-002': 124, 'itm-003': 89, 'itm-004': 45,
    'itm-005': 4,  'itm-006': 3,   'itm-007': 6,  'itm-008': 2,
    'itm-009': 67, 'itm-010': 54,  'itm-011': 29, 'itm-012': 16,
    'itm-016': 350, 'itm-017': 22, 'itm-019': 48, 'itm-020': 500,
    'itm-v001': 3, 'itm-v002': 2,  'itm-v003': 1,
  },
  'wh-002': {
    'itm-001': 12, 'itm-002': 55,  'itm-003': 30, 'itm-004': 18,
    'itm-005': 0,  'itm-006': 8,   'itm-007': 22, 'itm-008': 5,
    'itm-009': 20, 'itm-010': 15,  'itm-011': 10, 'itm-012': 7,
    'itm-016': 120, 'itm-017': 8,  'itm-019': 15, 'itm-020': 180,
  },
  'wh-003': {
    'itm-001': 5,  'itm-002': 30,  'itm-003': 15, 'itm-004': 8,
    'itm-005': 2,  'itm-006': 1,   'itm-007': 10, 'itm-008': 0,
    'itm-009': 25, 'itm-010': 18,  'itm-011': 6,  'itm-012': 4,
    'itm-016': 80, 'itm-017': 5,   'itm-019': 10, 'itm-020': 90,
  },
  'wh-004': {
    'itm-001': 2,  'itm-002': 10,  'itm-003': 5,  'itm-004': 3,
    'itm-005': 1,  'itm-006': 2,   'itm-007': 8,  'itm-008': 1,
    'itm-009': 5,  'itm-010': 4,   'itm-011': 3,  'itm-012': 2,
    'itm-016': 20, 'itm-017': 2,   'itm-019': 5,  'itm-020': 30,
  },
  'wh-005': {
    'itm-001': 50, 'itm-002': 200, 'itm-003': 120,'itm-004': 80,
    'itm-005': 15, 'itm-006': 25,  'itm-007': 60, 'itm-008': 12,
    'itm-009': 90, 'itm-010': 75,  'itm-011': 40, 'itm-012': 30,
    'itm-016': 800, 'itm-017': 45, 'itm-019': 120, 'itm-020': 1000,
  },
  'wh-006': {
    'itm-001': 8,  'itm-002': 45,  'itm-003': 22, 'itm-004': 15,
    'itm-005': 3,  'itm-006': 12,  'itm-007': 18, 'itm-008': 4,
    'itm-009': 30, 'itm-010': 22,  'itm-011': 14, 'itm-012': 9,
    'itm-016': 60, 'itm-017': 6,   'itm-019': 8,  'itm-020': 75,
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

// ─── MockItem type (exported for use in other components) ─────────────────────
export type MockItem = typeof mockItems[number];

// ─── Items ────────────────────────────────────────────────────────────────────
export const mockItems = [
  { id: 'itm-001', name: 'Laptop 15" Core i7', code: 'ITM-0001', barcode: '8901234567890', companyBarcode: '8901234567890', categoryId: 'cat-003', categoryName: 'Laptops & Desktops', hsnCode: '84713010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 72000, saleRate: 85000, mrp: 90000, minStockLevel: 10, stock: 38, isActive: true, size: '15"', group: 'Laptops', brand: 'Generic', articleNo: 'LPT-I7-001', color: 'Silver', markUpPct: 18, purExpPct: 2, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 65000, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: 'bom-001', bomVersion: '1.0', reorderPoint: 10, reorderQty: 20, leadTimeDays: 14, itemGroup: 'Electronics', drawingNumber: null, specifications: 'Intel Core i7-12700H, 16GB DDR5, 512GB NVMe SSD, 15.6" FHD IPS', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-002', name: 'Wireless Mouse Logitech M235', code: 'ITM-0002', barcode: '7612345678901', companyBarcode: '7612345678901', categoryId: 'cat-005', categoryName: 'Keyboards & Mice', hsnCode: '84716060', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 850, saleRate: 1200, mrp: 1499, minStockLevel: 20, stock: 124, isActive: true, size: 'Standard', group: 'Peripherals', brand: 'Logitech', articleNo: 'M235-BLK', color: 'Black', markUpPct: 41, purExpPct: 1, saleDisPct: 10, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 750, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 20, reorderQty: 50, leadTimeDays: 7, itemGroup: 'Accessories', drawingNumber: null, specifications: null, requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-003', name: 'USB-C 7-in-1 Hub', code: 'ITM-0003', barcode: '7623456789012', companyBarcode: '7623456789012', categoryId: 'cat-006', categoryName: 'Cables & Adapters', hsnCode: '85444290', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 1200, saleRate: 1800, mrp: 2199, minStockLevel: 15, stock: 89, isActive: true, size: 'Universal', group: 'Adapters', brand: 'Anker', articleNo: 'HUB-7IN1', color: 'Gray', markUpPct: 50, purExpPct: 1, saleDisPct: 8, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 1050, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 15, reorderQty: 30, leadTimeDays: 10, itemGroup: 'Accessories', drawingNumber: null, specifications: 'HDMI 4K60Hz, USB-A 3.0 x3, SD/TF Card Reader, 100W PD', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-004', name: 'Mechanical Keyboard RGB', code: 'ITM-0004', barcode: '7634567890123', companyBarcode: '7634567890123', categoryId: 'cat-005', categoryName: 'Keyboards & Mice', hsnCode: '84716060', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 5500, saleRate: 7500, mrp: 8999, minStockLevel: 10, stock: 45, isActive: true, size: 'Full Size', group: 'Peripherals', brand: 'Corsair', articleNo: 'KB-RGB-001', color: 'Black', markUpPct: 36, purExpPct: 1, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 4800, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: 'bom-002', bomVersion: '2.1', reorderPoint: 10, reorderQty: 15, leadTimeDays: 21, itemGroup: 'Electronics', drawingNumber: 'DWG-KB-001', specifications: 'Cherry MX Red switches, per-key RGB, USB-C detachable cable, NKRO', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-005', name: 'Monitor 24" Full HD IPS', code: 'ITM-0045', barcode: '8645678901234', companyBarcode: '8645678901234', categoryId: 'cat-004', categoryName: 'Monitors & Displays', hsnCode: '85285200', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 12000, saleRate: 15000, mrp: 17999, minStockLevel: 10, stock: 4, isActive: true, size: '24"', group: 'Monitors', brand: 'LG', articleNo: 'MON-24FHD', color: 'Black', markUpPct: 25, purExpPct: 2, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 10500, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: 'bom-003', bomVersion: '1.0', reorderPoint: 10, reorderQty: 15, leadTimeDays: 14, itemGroup: 'Electronics', drawingNumber: 'DWG-MON-024', specifications: '1920x1080 IPS panel, 75Hz refresh, 250 nits brightness, HDMI+VGA', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-006', name: 'Laptop Bag 15.6" Waterproof', code: 'ITM-0078', barcode: '8656789012345', companyBarcode: '8656789012345', categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '42021200', taxRate: 12, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 800, saleRate: 1200, mrp: 1499, minStockLevel: 15, stock: 3, isActive: true, size: '15.6"', group: 'Bags', brand: 'Wildcraft', articleNo: 'BAG-156-WP', color: 'Black', markUpPct: 50, purExpPct: 1, saleDisPct: 10, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 700, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 15, reorderQty: 30, leadTimeDays: 5, itemGroup: 'Accessories', drawingNumber: null, specifications: 'Polyester 1680D, water-resistant coating, padded laptop compartment', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-007', name: 'HDMI Cable 2m v2.0', code: 'ITM-0112', barcode: '8667890123456', companyBarcode: '8667890123456', categoryId: 'cat-006', categoryName: 'Cables & Adapters', hsnCode: '85444290', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 150, saleRate: 250, mrp: 399, minStockLevel: 25, stock: 6, isActive: true, size: '2m', group: 'Cables', brand: 'Belkin', articleNo: 'HDMI-2M-V2', color: 'Black', markUpPct: 67, purExpPct: 0, saleDisPct: 5, itemType: 'CONSUMABLE' as const, productionUnit: null, standardCost: 130, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 25, reorderQty: 50, leadTimeDays: 3, itemGroup: 'Consumables', drawingNumber: null, specifications: 'HDMI 2.0, 4K@60Hz, gold-plated connectors, braided nylon jacket', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-008', name: 'Network Switch 8-Port', code: 'ITM-0150', barcode: '8678901234567', companyBarcode: '8678901234567', categoryId: 'cat-008', categoryName: 'Networking', hsnCode: '85176200', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 3200, saleRate: 4500, mrp: 5499, minStockLevel: 5, stock: 2, isActive: true, size: '8-Port', group: 'Networking', brand: 'TP-Link', articleNo: 'SW-8P-100', color: 'Gray', markUpPct: 41, purExpPct: 1, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 2800, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 5, reorderQty: 10, leadTimeDays: 10, itemGroup: 'Electronics', drawingNumber: 'DWG-SW-008', specifications: 'Gigabit Ethernet, 8 ports, unmanaged, metal casing, wall-mountable', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-009', name: 'SSD 1TB NVMe Samsung', code: 'ITM-0200', barcode: '8689012345678', companyBarcode: '8689012345678', categoryId: 'cat-007', categoryName: 'Storage', hsnCode: '84717010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 6500, saleRate: 8500, mrp: 9999, minStockLevel: 20, stock: 67, isActive: true, size: '1TB', group: 'Storage', brand: 'Samsung', articleNo: '980PRO-1TB', color: 'Black', markUpPct: 31, purExpPct: 1, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 5800, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 20, reorderQty: 30, leadTimeDays: 14, itemGroup: 'Electronics', drawingNumber: null, specifications: 'PCIe 4.0 NVMe M.2, up to 7000MB/s read, 5000MB/s write, 5yr warranty', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-010', name: 'RAM 16GB DDR5 3200MHz', code: 'ITM-0201', barcode: '8690123456789', companyBarcode: '8690123456789', categoryId: 'cat-007', categoryName: 'Storage', hsnCode: '84717010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 4800, saleRate: 6200, mrp: 7499, minStockLevel: 15, stock: 54, isActive: true, size: '16GB', group: 'Memory', brand: 'Corsair', articleNo: 'RAM-16G-D5', color: 'Black', markUpPct: 29, purExpPct: 1, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 4200, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 15, reorderQty: 25, leadTimeDays: 10, itemGroup: 'Electronics', drawingNumber: null, specifications: 'DDR5-3200, CL22, 1.1V, heat spreader, lifetime warranty', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-011', name: 'Webcam 1080p with Mic', code: 'ITM-0222', barcode: '8601234567890', companyBarcode: '8601234567890', categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '85258090', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 1800, saleRate: 2500, mrp: 2999, minStockLevel: 12, stock: 29, isActive: true, size: 'Standard', group: 'Webcams', brand: 'Logitech', articleNo: 'CAM-1080P', color: 'Black', markUpPct: 39, purExpPct: 1, saleDisPct: 8, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 1550, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 12, reorderQty: 20, leadTimeDays: 7, itemGroup: 'Accessories', drawingNumber: null, specifications: '1080p 30fps, built-in stereo mic, 78° diagonal FOV, USB-A plug', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-012', name: 'Wi-Fi 6 Router AX1800', code: 'ITM-0230', barcode: '8612345678901', companyBarcode: '8612345678901', categoryId: 'cat-008', categoryName: 'Networking', hsnCode: '85176200', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 4200, saleRate: 5800, mrp: 6999, minStockLevel: 8, stock: 16, isActive: true, size: 'AX1800', group: 'Routers', brand: 'TP-Link', articleNo: 'RTR-AX1800', color: 'White', markUpPct: 38, purExpPct: 1, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 3600, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: 'bom-004', bomVersion: '1.0', reorderPoint: 8, reorderQty: 12, leadTimeDays: 14, itemGroup: 'Electronics', drawingNumber: 'DWG-RTR-AX18', specifications: 'Wi-Fi 6 (802.11ax), dual-band, 4 streams, 4x Gigabit LAN, WPA3', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-013', name: 'USB 3.0 Flash Drive 64GB', code: 'ITM-0240', barcode: null, companyBarcode: null, categoryId: 'cat-007', categoryName: 'Storage', hsnCode: '84717010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 350, saleRate: 550, mrp: 699, minStockLevel: 30, stock: 42, isActive: true, size: '64GB', group: 'Storage', brand: 'SanDisk', articleNo: 'FD-64G-USB3', color: 'Black', markUpPct: 57, purExpPct: 0, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 300, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 30, reorderQty: 50, leadTimeDays: 5, itemGroup: 'Accessories', drawingNumber: null, specifications: 'USB 3.2 Gen 1, up to 150MB/s read, retractable design', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-014', name: 'Bluetooth Speaker Portable', code: 'ITM-0241', barcode: null, companyBarcode: null, categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '85182100', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 1500, saleRate: 2200, mrp: 2799, minStockLevel: 10, stock: 18, isActive: true, size: 'Portable', group: 'Audio', brand: 'JBL', articleNo: 'SPK-BT-001', color: 'Blue', markUpPct: 47, purExpPct: 1, saleDisPct: 8, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 1300, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 10, reorderQty: 20, leadTimeDays: 7, itemGroup: 'Accessories', drawingNumber: null, specifications: '20W RMS, IPX7 waterproof, 12hr battery, Bluetooth 5.3', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-015', name: 'Laptop Cooling Pad', code: 'ITM-0242', barcode: null, companyBarcode: null, categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '84145990', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 600, saleRate: 950, mrp: 1199, minStockLevel: 15, stock: 25, isActive: true, size: 'Universal', group: 'Accessories', brand: 'Havit', articleNo: 'COOL-PAD-001', color: 'Black', markUpPct: 58, purExpPct: 0, saleDisPct: 5, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 520, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 15, reorderQty: 25, leadTimeDays: 5, itemGroup: 'Accessories', drawingNumber: null, specifications: '6 fans, adjustable height, USB powered, fits 12-17" laptops', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-016', name: 'Steel Rod 10mm', code: 'ITM-0301', barcode: '8712345678901', companyBarcode: '8712345678901', categoryId: 'cat-001', categoryName: 'Electronics', hsnCode: '72159090', taxRate: 18, unitId: 'unt-002', unitName: 'Kg', purchaseRate: 85, saleRate: 95, mrp: 110, minStockLevel: 100, stock: 350, isActive: true, size: '10mm', group: 'Raw Materials', brand: 'Tata Steel', articleNo: 'SR-10MM-TMT', color: 'Gray', markUpPct: 12, purExpPct: 0, saleDisPct: 0, itemType: 'RAW_MATERIAL' as const, productionUnit: 'meter', standardCost: 80, isBatchTracked: true, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 100, reorderQty: 200, leadTimeDays: 7, itemGroup: 'Metals', drawingNumber: 'DWG-SR-010', specifications: 'IS 1786 Grade Fe500D, 10mm diameter TMT bar, length 12m per rod', requiresIncomingQC: true, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-017', name: 'Gear Assembly A', code: 'ITM-0302', barcode: '8723456789012', companyBarcode: '8723456789012', categoryId: 'cat-001', categoryName: 'Electronics', hsnCode: '84839000', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 2500, saleRate: 3200, mrp: 3800, minStockLevel: 8, stock: 22, isActive: true, size: 'Assembly A', group: 'Gearbox', brand: 'In-House', articleNo: 'GA-A-001', color: 'Gray', markUpPct: 28, purExpPct: 1, saleDisPct: 3, itemType: 'SEMI_FINISHED' as const, productionUnit: null, standardCost: 2300, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: 'bom_pending', bomVersion: '0.1', reorderPoint: 8, reorderQty: 15, leadTimeDays: 5, itemGroup: 'Components', drawingNumber: 'DWG-GA-A01', specifications: 'Precision machined gear assembly, 20 teeth module 2, heat treated to 58 HRC', requiresIncomingQC: true, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-018', name: 'Industrial Pump X', code: 'ITM-0303', barcode: '8734567890123', companyBarcode: '8734567890123', categoryId: 'cat-001', categoryName: 'Electronics', hsnCode: '84137010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 45000, saleRate: 58000, mrp: 65000, minStockLevel: 2, stock: 5, isActive: true, size: 'X-Series', group: 'Pumps', brand: 'In-House', articleNo: 'IP-X-100', color: 'Green', markUpPct: 29, purExpPct: 2, saleDisPct: 0, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 42000, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: 'bom-005', bomVersion: '3.2', reorderPoint: 2, reorderQty: 3, leadTimeDays: 30, itemGroup: 'Machinery', drawingNumber: 'DWG-IP-X100', specifications: 'Centrifugal pump, 5HP motor, 200 LPM flow rate, cast iron body, carbon seal', requiresIncomingQC: false, requiresFinalQC: true, isParent: true, hasVariants: true, variantCount: 3, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-019', name: 'Cutting Oil 5L', code: 'ITM-0304', barcode: '8745678901234', companyBarcode: '8745678901234', categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '34039900', taxRate: 18, unitId: 'unt-003', unitName: 'Ltr', purchaseRate: 450, saleRate: 550, mrp: 620, minStockLevel: 20, stock: 48, isActive: true, size: '5L', group: 'Consumables', brand: 'Shell', articleNo: 'CO-5L-Shell', color: 'Amber', markUpPct: 22, purExpPct: 0, saleDisPct: 2, itemType: 'CONSUMABLE' as const, productionUnit: 'ml', standardCost: 400, isBatchTracked: true, isSerialTracked: false, hasExpiry: true, shelfLifeDays: 730, bomId: null, bomVersion: null, reorderPoint: 20, reorderQty: 40, leadTimeDays: 5, itemGroup: 'Consumables', drawingNumber: null, specifications: 'Soluble cutting oil, EP additive, suitable for CNC machining of steel and aluminum', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-020', name: 'Cardboard Box 30x20', code: 'ITM-0305', barcode: '8756789012345', companyBarcode: '8756789012345', categoryId: 'cat-002', categoryName: 'Accessories', hsnCode: '48192010', taxRate: 12, unitId: 'unt-004', unitName: 'Box', purchaseRate: 25, saleRate: 35, mrp: 40, minStockLevel: 100, stock: 500, isActive: true, size: '30x20', group: 'Packaging', brand: 'Local', articleNo: 'CB-3020-BRN', color: 'Brown', markUpPct: 40, purExpPct: 0, saleDisPct: 0, itemType: 'PACKAGING' as const, productionUnit: null, standardCost: 22, isBatchTracked: false, isSerialTracked: false, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 100, reorderQty: 200, leadTimeDays: 2, itemGroup: 'Packaging', drawingNumber: null, specifications: '3-ply corrugated box, 300x200x150mm inner, suitable for electronics shipping', requiresIncomingQC: false, requiresFinalQC: false, isParent: false, hasVariants: false, variantCount: 0, isVariant: false, parentItemId: null, variantName: null, variantAttributes: null, variantSku: null },
  { id: 'itm-v001', name: 'Industrial Pump X-100', code: 'ITM-0303-100', barcode: '', companyBarcode: '', categoryId: 'cat-001', categoryName: 'Electronics', hsnCode: '84137010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 40000, saleRate: 52000, mrp: 58000, minStockLevel: 2, stock: 3, isActive: true, size: 'X-100', group: 'Pumps', brand: 'In-House', articleNo: 'IP-X-100-100', color: 'Green', markUpPct: 30, purExpPct: 2, saleDisPct: 0, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 38000, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: 'bom-v001', bomVersion: '1.0', reorderPoint: 2, reorderQty: 3, leadTimeDays: 30, itemGroup: 'Machinery', drawingNumber: null, specifications: 'Industrial Pump variant X-100, 100 LPM flow rate, Type A motor, small impeller', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: true, parentItemId: 'itm-018', variantName: 'Pump X-100', variantAttributes: { 'Flow Rate': '100 LPM', 'Motor': 'Type A', 'Impeller': 'Small' }, variantSku: 'IP-X-100' },
  { id: 'itm-v002', name: 'Industrial Pump X-200', code: 'ITM-0303-200', barcode: '', companyBarcode: '', categoryId: 'cat-001', categoryName: 'Electronics', hsnCode: '84137010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 48000, saleRate: 62000, mrp: 70000, minStockLevel: 2, stock: 2, isActive: true, size: 'X-200', group: 'Pumps', brand: 'In-House', articleNo: 'IP-X-200-200', color: 'Green', markUpPct: 29, purExpPct: 2, saleDisPct: 0, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 45000, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: 'bom-v002', bomVersion: '1.0', reorderPoint: 2, reorderQty: 3, leadTimeDays: 30, itemGroup: 'Machinery', drawingNumber: null, specifications: 'Industrial Pump variant X-200, 200 LPM flow rate, Type B motor, medium impeller', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: true, parentItemId: 'itm-018', variantName: 'Pump X-200', variantAttributes: { 'Flow Rate': '200 LPM', 'Motor': 'Type B', 'Impeller': 'Medium' }, variantSku: 'IP-X-200' },
  { id: 'itm-v003', name: 'Industrial Pump X-500', code: 'ITM-0303-500', barcode: '', companyBarcode: '', categoryId: 'cat-001', categoryName: 'Electronics', hsnCode: '84137010', taxRate: 18, unitId: 'unt-001', unitName: 'Pcs', purchaseRate: 65000, saleRate: 85000, mrp: 95000, minStockLevel: 1, stock: 1, isActive: true, size: 'X-500', group: 'Pumps', brand: 'In-House', articleNo: 'IP-X-500-500', color: 'Green', markUpPct: 31, purExpPct: 2, saleDisPct: 0, itemType: 'FINISHED_GOOD' as const, productionUnit: null, standardCost: 62000, isBatchTracked: false, isSerialTracked: true, hasExpiry: false, shelfLifeDays: null, bomId: null, bomVersion: null, reorderPoint: 1, reorderQty: 2, leadTimeDays: 30, itemGroup: 'Machinery', drawingNumber: null, specifications: 'Industrial Pump variant X-500, 500 LPM flow rate, Type C motor, large impeller', requiresIncomingQC: false, requiresFinalQC: true, isParent: false, hasVariants: false, variantCount: 0, isVariant: true, parentItemId: 'itm-018', variantName: 'Pump X-500', variantAttributes: { 'Flow Rate': '500 LPM', 'Motor': 'Type C', 'Impeller': 'Large' }, variantSku: 'IP-X-500' },
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
    id: 'sg1',
    name: 'Suresh Patil',
    email: 'security@invenpro.com',
    phone: '9876500001',
    role: 'SECURITY_GUARD' as const,
    roleId: '',
    roleName: 'Security Guard',
    isSuperAdmin: false,
    warehouseIds: [],
    assignedWarehouses: [],
    permissionOverrides: {},
    isActive: true,
    lastLoginAt: null,
    createdAt: '2024-04-01T00:00:00Z',
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

// ─── Rejection Codes ──────────────────────────────────────────────────────────
export interface MockRejectionCode {
  id: string;
  code: string;
  description: string;
  category: 'MATERIAL' | 'MACHINE' | 'OPERATOR' | 'PROCESS' | 'DESIGN';
  applicableTo: 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'ALL';
  isActive: boolean;
}

export const mockRejectionCodes: MockRejectionCode[] = [
  { id: 'rc-001', code: 'RC-DIM', description: 'Dimensional Error', category: 'MACHINE', applicableTo: 'ALL', isActive: true },
  { id: 'rc-002', code: 'RC-SUR', description: 'Surface Defect', category: 'MATERIAL', applicableTo: 'INCOMING', isActive: true },
  { id: 'rc-003', code: 'RC-COL', description: 'Wrong Color/Shade', category: 'MATERIAL', applicableTo: 'ALL', isActive: true },
  { id: 'rc-004', code: 'RC-WLD', description: 'Welding Defect', category: 'OPERATOR', applicableTo: 'IN_PROCESS', isActive: true },
  { id: 'rc-005', code: 'RC-ASM', description: 'Assembly Error', category: 'OPERATOR', applicableTo: 'IN_PROCESS', isActive: true },
  { id: 'rc-006', code: 'RC-PKG', description: 'Packaging Defect', category: 'PROCESS', applicableTo: 'FINAL', isActive: true },
  { id: 'rc-007', code: 'RC-DES', description: 'Design Non-conformance', category: 'DESIGN', applicableTo: 'ALL', isActive: true },
  { id: 'rc-008', code: 'RC-EXP', description: 'Expired Material', category: 'MATERIAL', applicableTo: 'INCOMING', isActive: true },
];

// ─── Downtime Codes ─────────────────────────────────────────────────────────────
export interface MockDowntimeCode {
  id: string;
  code: string;
  description: string;
  category: 'BREAKDOWN' | 'PLANNED' | 'MATERIAL' | 'POWER' | 'OPERATOR' | 'SETUP' | 'OTHER';
  affectsMachine: boolean;
  isActive: boolean;
}

export const mockDowntimeCodes: MockDowntimeCode[] = [
  { id: 'dt-001', code: 'DT-BRK', description: 'Machine Breakdown', category: 'BREAKDOWN', affectsMachine: true, isActive: true },
  { id: 'dt-002', code: 'DT-PM', description: 'Planned Maintenance', category: 'PLANNED', affectsMachine: true, isActive: true },
  { id: 'dt-003', code: 'DT-MAT', description: 'Material Shortage', category: 'MATERIAL', affectsMachine: false, isActive: true },
  { id: 'dt-004', code: 'DT-PWR', description: 'Power Failure', category: 'POWER', affectsMachine: true, isActive: true },
  { id: 'dt-005', code: 'DT-OPR', description: 'Operator Absent', category: 'OPERATOR', affectsMachine: false, isActive: true },
  { id: 'dt-006', code: 'DT-SET', description: 'Machine Setup/Changeover', category: 'SETUP', affectsMachine: true, isActive: true },
  { id: 'dt-007', code: 'DT-OTH', description: 'Other', category: 'OTHER', affectsMachine: false, isActive: true },
];

// ─── Quality Parameters ───────────────────────────────────────────────────────
export interface MockQualityParameter {
  id: string;
  name: string;
  code: string;
  type: 'PASS_FAIL' | 'NUMERIC' | 'TEXT';
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
  applicableTo: 'INCOMING' | 'IN_PROCESS' | 'FINAL' | 'ALL';
  isActive: boolean;
}

export const mockQualityParameters: MockQualityParameter[] = [
  { id: 'qp-001', name: 'Visual Inspection', code: 'QP-VIS', type: 'PASS_FAIL', unit: null, minValue: null, maxValue: null, applicableTo: 'ALL', isActive: true },
  { id: 'qp-002', name: 'Dimensional Check', code: 'QP-DIM', type: 'NUMERIC', unit: 'mm', minValue: 9.8, maxValue: 10.2, applicableTo: 'IN_PROCESS', isActive: true },
  { id: 'qp-003', name: 'Weight Check', code: 'QP-WGT', type: 'NUMERIC', unit: 'kg', minValue: null, maxValue: null, applicableTo: 'INCOMING', isActive: true },
  { id: 'qp-004', name: 'Surface Finish', code: 'QP-SRF', type: 'PASS_FAIL', unit: null, minValue: null, maxValue: null, applicableTo: 'FINAL', isActive: true },
  { id: 'qp-005', name: 'Hardness Test', code: 'QP-HRD', type: 'NUMERIC', unit: 'HRC', minValue: 55, maxValue: 62, applicableTo: 'IN_PROCESS', isActive: true },
  { id: 'qp-006', name: 'Color Match', code: 'QP-COL', type: 'PASS_FAIL', unit: null, minValue: null, maxValue: null, applicableTo: 'FINAL', isActive: true },
  { id: 'qp-007', name: 'Batch Label Check', code: 'QP-LBL', type: 'PASS_FAIL', unit: null, minValue: null, maxValue: null, applicableTo: 'INCOMING', isActive: true },
  { id: 'qp-008', name: 'Tensile Strength', code: 'QP-TEN', type: 'NUMERIC', unit: 'MPa', minValue: 500, maxValue: null, applicableTo: 'IN_PROCESS', isActive: false },
];

// ─── Inspection Checklists ────────────────────────────────────────────────────
export interface MockInspectionChecklist {
  id: string;
  name: string;
  code: string;
  applicableTo: 'INCOMING' | 'IN_PROCESS' | 'FINAL';
  itemTypeTarget: 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED_GOOD' | 'ALL';
  parameters: string[];
  samplingPlan: 'ALL' | 'RANDOM_10' | 'RANDOM_20' | 'AQL';
  isActive: boolean;
}

export const mockInspectionChecklists: MockInspectionChecklist[] = [
  { id: 'cl-001', name: 'Raw Material Incoming Check', code: 'CL-RM-IN', applicableTo: 'INCOMING', itemTypeTarget: 'RAW_MATERIAL', parameters: ['qp-001', 'qp-003', 'qp-007'], samplingPlan: 'RANDOM_10', isActive: true },
  { id: 'cl-002', name: 'Steel Rod Quality Check', code: 'CL-SR-IP', applicableTo: 'IN_PROCESS', itemTypeTarget: 'RAW_MATERIAL', parameters: ['qp-002', 'qp-005'], samplingPlan: 'ALL', isActive: true },
  { id: 'cl-003', name: 'Finished Good Final Inspection', code: 'CL-FG-FIN', applicableTo: 'FINAL', itemTypeTarget: 'FINISHED_GOOD', parameters: ['qp-001', 'qp-004', 'qp-006'], samplingPlan: 'RANDOM_20', isActive: true },
  { id: 'cl-004', name: 'Pump Assembly Check', code: 'CL-PA-FIN', applicableTo: 'FINAL', itemTypeTarget: 'FINISHED_GOOD', parameters: ['qp-001', 'qp-004', 'qp-005'], samplingPlan: 'AQL', isActive: true },
];

// ─── Routing ──────────────────────────────────────────────────────────────────
export interface MockRoutingStage {
  id: string;
  stageNumber: number;
  stageName: string;
  workCenterId: string | null;
  workCenterName: string | null;
  machineId: string | null;
  machineName: string | null;
  standardTimeMinutes: number;
  setupTimeMinutes: number;
  description: string | null;
  qcRequired: boolean;
}

export interface MockRouting {
  id: string;
  name: string;
  code: string;
  itemId: string | null;
  itemName: string | null;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'OBSOLETE';
  stages: MockRoutingStage[];
  totalTimeMinutes: number;
  createdAt: string;
  isActive: boolean;
}

export const mockRoutings: MockRouting[] = [
  {
    id: 'rt-001',
    name: 'Industrial Pump Routing',
    code: 'RT-IP-001',
    itemId: 'itm-018',
    itemName: 'Industrial Pump X',
    version: '1.0',
    status: 'ACTIVE',
    isActive: true,
    totalTimeMinutes: 275,
    createdAt: '2024-08-15T10:00:00Z',
    stages: [
      {
        id: 'rs-001',
        stageNumber: 1,
        stageName: 'Incoming Inspection',
        workCenterId: 'wc-003',
        workCenterName: 'Packing Zone',
        machineId: null,
        machineName: null,
        standardTimeMinutes: 30,
        setupTimeMinutes: 5,
        description: 'Inspect raw materials before production',
        qcRequired: true,
      },
      {
        id: 'rs-002',
        stageNumber: 2,
        stageName: 'Casting & Cutting',
        workCenterId: 'wc-001',
        workCenterName: 'Cutting Area',
        machineId: 'mc-001',
        machineName: 'CNC Machine 1',
        standardTimeMinutes: 60,
        setupTimeMinutes: 15,
        description: 'Cast and cut pump body parts',
        qcRequired: false,
      },
      {
        id: 'rs-003',
        stageNumber: 3,
        stageName: 'Machining',
        workCenterId: 'wc-001',
        workCenterName: 'Cutting Area',
        machineId: 'mc-004',
        machineName: 'Hydraulic Press 2',
        standardTimeMinutes: 90,
        setupTimeMinutes: 20,
        description: 'Machine all precision components',
        qcRequired: false,
      },
      {
        id: 'rs-004',
        stageNumber: 4,
        stageName: 'Assembly',
        workCenterId: 'wc-002',
        workCenterName: 'Assembly Line 1',
        machineId: null,
        machineName: null,
        standardTimeMinutes: 45,
        setupTimeMinutes: 10,
        description: 'Assemble pump components',
        qcRequired: true,
      },
      {
        id: 'rs-005',
        stageNumber: 5,
        stageName: 'Final Inspection',
        workCenterId: 'wc-003',
        workCenterName: 'Packing Zone',
        machineId: null,
        machineName: null,
        standardTimeMinutes: 30,
        setupTimeMinutes: 0,
        description: 'Final QC before packing',
        qcRequired: true,
      },
      {
        id: 'rs-006',
        stageNumber: 6,
        stageName: 'Packing',
        workCenterId: 'wc-003',
        workCenterName: 'Packing Zone',
        machineId: null,
        machineName: null,
        standardTimeMinutes: 20,
        setupTimeMinutes: 5,
        description: 'Pack finished pump for dispatch',
        qcRequired: false,
      },
    ],
  },
  {
    id: 'rt-002',
    name: 'Gear Assembly Routing',
    code: 'RT-GA-001',
    itemId: 'itm-017',
    itemName: 'Gear Assembly A',
    version: '1.0',
    status: 'ACTIVE',
    isActive: true,
    totalTimeMinutes: 180,
    createdAt: '2024-08-20T14:00:00Z',
    stages: [
      {
        id: 'rs-007',
        stageNumber: 1,
        stageName: 'Cutting',
        workCenterId: 'wc-001',
        workCenterName: 'Cutting Area',
        machineId: 'mc-001',
        machineName: 'CNC Machine 1',
        standardTimeMinutes: 40,
        setupTimeMinutes: 15,
        description: 'Rough cutting of gear blanks',
        qcRequired: false,
      },
      {
        id: 'rs-008',
        stageNumber: 2,
        stageName: 'Grinding',
        workCenterId: 'wc-001',
        workCenterName: 'Cutting Area',
        machineId: 'mc-001',
        machineName: 'CNC Machine 1',
        standardTimeMinutes: 55,
        setupTimeMinutes: 10,
        description: 'Precision grinding of gear teeth',
        qcRequired: false,
      },
      {
        id: 'rs-009',
        stageNumber: 3,
        stageName: 'Heat Treatment',
        workCenterId: 'wc-002',
        workCenterName: 'Assembly Line 1',
        machineId: null,
        machineName: null,
        standardTimeMinutes: 50,
        setupTimeMinutes: 20,
        description: 'Hardening and tempering process',
        qcRequired: true,
      },
      {
        id: 'rs-010',
        stageNumber: 4,
        stageName: 'Inspection',
        workCenterId: 'wc-003',
        workCenterName: 'Packing Zone',
        machineId: null,
        machineName: null,
        standardTimeMinutes: 35,
        setupTimeMinutes: 5,
        description: 'Dimensional and hardness inspection',
        qcRequired: true,
      },
    ],
  },
  {
    id: 'rt-003',
    name: 'General Machining Routing',
    code: 'RT-GEN-001',
    itemId: null,
    itemName: null,
    version: '0.1',
    status: 'DRAFT',
    isActive: true,
    totalTimeMinutes: 120,
    createdAt: '2024-09-01T09:00:00Z',
    stages: [
      {
        id: 'rs-011',
        stageNumber: 1,
        stageName: 'Setup',
        workCenterId: 'wc-001',
        workCenterName: 'Cutting Area',
        machineId: 'mc-001',
        machineName: 'CNC Machine 1',
        standardTimeMinutes: 20,
        setupTimeMinutes: 15,
        description: 'Fixture setup and tool loading',
        qcRequired: false,
      },
      {
        id: 'rs-012',
        stageNumber: 2,
        stageName: 'Machining',
        workCenterId: 'wc-001',
        workCenterName: 'Cutting Area',
        machineId: 'mc-004',
        machineName: 'Hydraulic Press 2',
        standardTimeMinutes: 75,
        setupTimeMinutes: 10,
        description: 'Primary machining operations',
        qcRequired: false,
      },
      {
        id: 'rs-013',
        stageNumber: 3,
        stageName: 'Inspection',
        workCenterId: 'wc-003',
        workCenterName: 'Packing Zone',
        machineId: null,
        machineName: null,
        standardTimeMinutes: 25,
        setupTimeMinutes: 0,
        description: 'Dimensional verification and surface check',
        qcRequired: true,
      },
    ],
  },
];

// ─── Bill of Materials (BOM) ─────────────────────────────────────────────────
export interface MockBOMItem {
  id: string;
  parentId: string | null;
  bomId: string;
  itemId: string;
  itemName: string;
  itemType: string;
  itemCode: string;
  qtyPerUnit: number;
  unit: string;
  scrapPct: number;
  effectiveQty: number;
  standardCost: number;
  totalCost: number;
  level: number;
  hasSubBOM: boolean;
  subBOMId: string | null;
  isAlternate: boolean;
  alternateForId: string | null;
  notes: string | null;
}

export interface MockBOM {
  id: string;
  code: string;
  productId: string;
  productName: string;
  productCode: string;
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'OBSOLETE';
  effectiveFrom: string | null;
  effectiveTo: string | null;
  totalMaterialCost: number;
  totalItems: number;
  levels: number;
  isVariantBOM: boolean;
  parentBOMId: string | null;
  variantName: string | null;
  notes: string | null;
  createdAt: string;
  isActive: boolean;
}

export let mockBOMs: MockBOM[] = [
  {
    id: 'bom-v001',
    code: 'BOM-IP-100-001',
    productId: 'itm-v001',
    productName: 'Industrial Pump X — Pump X-100',
    productCode: 'ITM-0303-100',
    version: '1.0',
    status: 'ACTIVE',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    totalMaterialCost: 35000,
    totalItems: 5,
    levels: 2,
    isVariantBOM: true,
    parentBOMId: 'bom-v002',
    variantName: 'Pump X-100 (100 LPM)',
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'bom-v002',
    code: 'BOM-IP-200-001',
    productId: 'itm-v002',
    productName: 'Industrial Pump X — Pump X-200',
    productCode: 'ITM-0303-200',
    version: '1.0',
    status: 'ACTIVE',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    totalMaterialCost: 42000,
    totalItems: 5,
    levels: 2,
    isVariantBOM: true,
    parentBOMId: null,
    variantName: 'Pump X-200 (200 LPM)',
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'bom_pending',
    code: 'BOM-GA-001',
    productId: 'itm-017',
    productName: 'Gear Assembly A',
    productCode: 'ITM-0302',
    version: '0.1',
    status: 'DRAFT',
    effectiveFrom: '2024-03-01',
    effectiveTo: null,
    totalMaterialCost: 1850,
    totalItems: 4,
    levels: 2,
    isVariantBOM: false,
    parentBOMId: null,
    variantName: null,
    notes: 'Draft — pending review',
    createdAt: '2024-03-01T00:00:00Z',
    isActive: true,
  },
  {
    id: 'bom-001',
    code: 'BOM-LPT-001',
    productId: 'itm-001',
    productName: 'Laptop 15" Core i7',
    productCode: 'ITM-0001',
    version: '1.0',
    status: 'ACTIVE',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    totalMaterialCost: 62000,
    totalItems: 5,
    levels: 2,
    isVariantBOM: false,
    parentBOMId: null,
    variantName: null,
    notes: null,
    createdAt: '2024-01-01T00:00:00Z',
    isActive: true,
  },
];

export let mockBOMItems: MockBOMItem[] = [
  // ── bom-v001: Pump X-100 ──
  { id: 'bi-101', parentId: null, bomId: 'bom-v001', itemId: 'itm-v001', itemName: 'Pump X-100', itemType: 'FINISHED_GOOD', itemCode: 'ITM-0303-100', qtyPerUnit: 1, unit: 'Pcs', scrapPct: 0, effectiveQty: 1, standardCost: 52000, totalCost: 52000, level: 0, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Finished product root' },
  { id: 'bi-102', parentId: 'bi-101', bomId: 'bom-v001', itemId: 'itm-016', itemName: 'Steel Rod 10mm', itemType: 'RAW_MATERIAL', itemCode: 'ITM-0301', qtyPerUnit: 12, unit: 'Kg', scrapPct: 5, effectiveQty: 12.6, standardCost: 2000, totalCost: 25200, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Pump body casting material' },
  { id: 'bi-103', parentId: 'bi-101', bomId: 'bom-v001', itemId: 'itm-019', itemName: 'Cutting Oil 5L', itemType: 'CONSUMABLE', itemCode: 'ITM-0304', qtyPerUnit: 1.5, unit: 'Ltr', scrapPct: 0, effectiveQty: 1.5, standardCost: 3000, totalCost: 4500, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Machining lubricant' },
  { id: 'bi-104', parentId: 'bi-101', bomId: 'bom-v001', itemId: 'itm-017', itemName: 'Gear Assembly A', itemType: 'SEMI_FINISHED', itemCode: 'ITM-0302', qtyPerUnit: 1, unit: 'Pcs', scrapPct: 2, effectiveQty: 1.02, standardCost: 5000, totalCost: 5100, level: 1, hasSubBOM: true, subBOMId: 'bom_pending', isAlternate: false, alternateForId: null, notes: 'Main drive gear assembly' },
  { id: 'bi-105', parentId: 'bi-101', bomId: 'bom-v001', itemId: 'itm-020', itemName: 'Cardboard Box 30x20', itemType: 'PACKAGING', itemCode: 'ITM-0305', qtyPerUnit: 1, unit: 'Box', scrapPct: 0, effectiveQty: 1, standardCost: 200, totalCost: 200, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Shipping packaging' },

  // ── bom-v002: Pump X-200 ──
  { id: 'bi-201', parentId: null, bomId: 'bom-v002', itemId: 'itm-v002', itemName: 'Pump X-200', itemType: 'FINISHED_GOOD', itemCode: 'ITM-0303-200', qtyPerUnit: 1, unit: 'Pcs', scrapPct: 0, effectiveQty: 1, standardCost: 62000, totalCost: 62000, level: 0, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Finished product root' },
  { id: 'bi-202', parentId: 'bi-201', bomId: 'bom-v002', itemId: 'itm-016', itemName: 'Steel Rod 10mm', itemType: 'RAW_MATERIAL', itemCode: 'ITM-0301', qtyPerUnit: 18, unit: 'Kg', scrapPct: 5, effectiveQty: 18.9, standardCost: 1500, totalCost: 28350, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Heavier pump body material' },
  { id: 'bi-203', parentId: 'bi-201', bomId: 'bom-v002', itemId: 'itm-019', itemName: 'Cutting Oil 5L', itemType: 'CONSUMABLE', itemCode: 'ITM-0304', qtyPerUnit: 2, unit: 'Ltr', scrapPct: 0, effectiveQty: 2, standardCost: 3000, totalCost: 6000, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Extended machining lubricant' },
  { id: 'bi-204', parentId: 'bi-201', bomId: 'bom-v002', itemId: 'itm-017', itemName: 'Gear Assembly A', itemType: 'SEMI_FINISHED', itemCode: 'ITM-0302', qtyPerUnit: 2, unit: 'Pcs', scrapPct: 2, effectiveQty: 2.04, standardCost: 3000, totalCost: 6120, level: 1, hasSubBOM: true, subBOMId: 'bom_pending', isAlternate: false, alternateForId: null, notes: 'Two gear assemblies for heavier pump' },
  { id: 'bi-205', parentId: 'bi-201', bomId: 'bom-v002', itemId: 'itm-020', itemName: 'Cardboard Box 30x20', itemType: 'PACKAGING', itemCode: 'ITM-0305', qtyPerUnit: 1, unit: 'Box', scrapPct: 0, effectiveQty: 1, standardCost: 1530, totalCost: 1530, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Shipping packaging' },

  // ── bom_pending: Gear Assembly A ──
  { id: 'bi-301', parentId: null, bomId: 'bom_pending', itemId: 'itm-017', itemName: 'Gear Assembly A', itemType: 'SEMI_FINISHED', itemCode: 'ITM-0302', qtyPerUnit: 1, unit: 'Pcs', scrapPct: 0, effectiveQty: 1, standardCost: 3200, totalCost: 3200, level: 0, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Semi-finished product root' },
  { id: 'bi-302', parentId: 'bi-301', bomId: 'bom_pending', itemId: 'itm-016', itemName: 'Steel Rod 10mm', itemType: 'RAW_MATERIAL', itemCode: 'ITM-0301', qtyPerUnit: 3, unit: 'Kg', scrapPct: 8, effectiveQty: 3.24, standardCost: 500, totalCost: 1620, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Gear blank material' },
  { id: 'bi-303', parentId: 'bi-301', bomId: 'bom_pending', itemId: 'itm-019', itemName: 'Cutting Oil 5L', itemType: 'CONSUMABLE', itemCode: 'ITM-0304', qtyPerUnit: 0.5, unit: 'Ltr', scrapPct: 0, effectiveQty: 0.5, standardCost: 300, totalCost: 150, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Machining lubricant' },
  { id: 'bi-304', parentId: 'bi-301', bomId: 'bom_pending', itemId: 'itm-020', itemName: 'Cardboard Box 30x20', itemType: 'PACKAGING', itemCode: 'ITM-0305', qtyPerUnit: 1, unit: 'Box', scrapPct: 0, effectiveQty: 1, standardCost: 80, totalCost: 80, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Inter-warehouse transit box' },

  // ── bom-001: Laptop 15" Core i7 ──
  { id: 'bi-401', parentId: null, bomId: 'bom-001', itemId: 'itm-001', itemName: 'Laptop 15" Core i7', itemType: 'FINISHED_GOOD', itemCode: 'ITM-0001', qtyPerUnit: 1, unit: 'Pcs', scrapPct: 0, effectiveQty: 1, standardCost: 85000, totalCost: 85000, level: 0, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Finished product root' },
  { id: 'bi-402', parentId: 'bi-401', bomId: 'bom-001', itemId: 'itm-009', itemName: 'SSD 1TB NVMe Samsung', itemType: 'FINISHED_GOOD', itemCode: 'ITM-0200', qtyPerUnit: 1, unit: 'Pcs', scrapPct: 0, effectiveQty: 1, standardCost: 8500, totalCost: 8500, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Primary storage' },
  { id: 'bi-403', parentId: 'bi-401', bomId: 'bom-001', itemId: 'itm-010', itemName: 'RAM 16GB DDR5 3200MHz', itemType: 'FINISHED_GOOD', itemCode: 'ITM-0201', qtyPerUnit: 2, unit: 'Pcs', scrapPct: 0, effectiveQty: 2, standardCost: 5500, totalCost: 11000, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Memory modules' },
  { id: 'bi-404', parentId: 'bi-401', bomId: 'bom-001', itemId: 'itm-005', itemName: 'Monitor 24" Full HD IPS', itemType: 'FINISHED_GOOD', itemCode: 'ITM-0045', qtyPerUnit: 1, unit: 'Pcs', scrapPct: 0, effectiveQty: 1, standardCost: 30000, totalCost: 30000, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: '15.6" display panel assembly' },
  { id: 'bi-405', parentId: 'bi-401', bomId: 'bom-001', itemId: 'itm-012', itemName: 'Wi-Fi 6 Router AX1800', itemType: 'FINISHED_GOOD', itemCode: 'ITM-0230', qtyPerUnit: 1, unit: 'Pcs', scrapPct: 0, effectiveQty: 1, standardCost: 12500, totalCost: 12500, level: 1, hasSubBOM: false, subBOMId: null, isAlternate: false, alternateForId: null, notes: 'Wi-Fi 6 module and antenna assembly' },
];

export interface MockProductionOrder {
  id: string;
  poNumber: string;
  type: 'MTO' | 'MTS';
  status: 'DRAFT'|'PLANNED'|'IN_PROGRESS'|'COMPLETED'|'ON_HOLD'|'CANCELLED';
  priority: 'LOW'|'NORMAL'|'HIGH'|'URGENT';
  productId: string;
  productName: string;
  productCode: string;
  isVariant: boolean;
  variantName: string | null;
  bomId: string;
  bomVersion: string;
  plannedQty: number;
  completedQty: number;
  rejectedQty: number;
  unit: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  salesOrderRef: string | null;
  salesOrderId: string | null;
  warehouseId: string;
  warehouseName: string;
  routingId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface MockWorkOrder {
  id: string;
  woNumber: string;
  productionOrderId: string;
  productionOrderNumber: string;
  stageNumber: number;
  stageName: string;
  workCenterId: string;
  workCenterName: string;
  machineId: string | null;
  machineName: string | null;
  operatorId: string | null;
  operatorName: string | null;
  shiftId: string | null;
  shiftName: string | null;
  status: 'PENDING'|'IN_PROGRESS'|'COMPLETED'|'ON_HOLD';
  plannedQty: number;
  completedQty: number;
  rejectedQty: number;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate: string | null;
  actualEndDate: string | null;
  plannedTimeMinutes: number;
  actualTimeMinutes: number | null;
  notes: string | null;
}

export let mockProductionOrders: MockProductionOrder[] = [
  {
    id: 'prod-001',
    poNumber: 'PRD-2024-001',
    type: 'MTO',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    productId: 'itm-v001',
    productName: 'Industrial Pump X',
    productCode: 'ITM-0303-100',
    isVariant: true,
    variantName: 'Pump X-100 (100 LPM)',
    bomId: 'bom-v001',
    bomVersion: '1.0',
    plannedQty: 5,
    completedQty: 2,
    rejectedQty: 0,
    unit: 'Pcs',
    plannedStartDate: '2024-04-15',
    plannedEndDate: '2024-04-25',
    actualStartDate: '2024-04-15',
    actualEndDate: null,
    salesOrderRef: 'INV-2024-003',
    salesOrderId: 'si-003',
    warehouseId: 'wh-005',
    warehouseName: 'Manufacturing Plant',
    routingId: 'rt-001',
    notes: null,
    createdBy: 'Admin User',
    createdAt: '2024-04-14T09:00:00Z',
  },
  {
    id: 'prod-002',
    poNumber: 'PRD-2024-002',
    type: 'MTS',
    status: 'PLANNED',
    priority: 'NORMAL',
    productId: 'itm-v002',
    productName: 'Industrial Pump X',
    productCode: 'ITM-0303-200',
    isVariant: true,
    variantName: 'Pump X-200 (200 LPM)',
    bomId: 'bom-v002',
    bomVersion: '1.0',
    plannedQty: 3,
    completedQty: 0,
    rejectedQty: 0,
    unit: 'Pcs',
    plannedStartDate: '2024-04-28',
    plannedEndDate: '2024-05-05',
    actualStartDate: null,
    actualEndDate: null,
    salesOrderRef: null,
    salesOrderId: null,
    warehouseId: 'wh-005',
    warehouseName: 'Manufacturing Plant',
    routingId: 'rt-001',
    notes: 'Replenish stock to min level',
    createdBy: 'Admin User',
    createdAt: '2024-04-20T10:00:00Z',
  },
  {
    id: 'prod-003',
    poNumber: 'PRD-2024-003',
    type: 'MTO',
    status: 'COMPLETED',
    priority: 'NORMAL',
    productId: 'itm-017',
    productName: 'Gear Assembly A',
    productCode: 'ITM-0302',
    isVariant: false,
    variantName: null,
    bomId: 'bom_pending',
    bomVersion: '0.1',
    plannedQty: 10,
    completedQty: 10,
    rejectedQty: 1,
    unit: 'Pcs',
    plannedStartDate: '2024-04-01',
    plannedEndDate: '2024-04-10',
    actualStartDate: '2024-04-01',
    actualEndDate: '2024-04-09',
    salesOrderRef: 'INV-2024-001',
    salesOrderId: 'si-001',
    warehouseId: 'wh-005',
    warehouseName: 'Manufacturing Plant',
    routingId: 'rt-002',
    notes: null,
    createdBy: 'Admin User',
    createdAt: '2024-03-30T08:00:00Z',
  },
  {
    id: 'prod-004',
    poNumber: 'PRD-2024-004',
    type: 'MTS',
    status: 'DRAFT',
    priority: 'LOW',
    productId: 'itm-v001',
    productName: 'Industrial Pump X',
    productCode: 'ITM-0303-100',
    isVariant: true,
    variantName: 'Pump X-100 (100 LPM)',
    bomId: 'bom-v001',
    bomVersion: '1.0',
    plannedQty: 2,
    completedQty: 0,
    rejectedQty: 0,
    unit: 'Pcs',
    plannedStartDate: '2024-05-10',
    plannedEndDate: '2024-05-15',
    actualStartDate: null,
    actualEndDate: null,
    salesOrderRef: null,
    salesOrderId: null,
    warehouseId: 'wh-005',
    warehouseName: 'Manufacturing Plant',
    routingId: 'rt-001',
    notes: null,
    createdBy: 'Admin User',
    createdAt: '2024-04-25T11:00:00Z',
  },
  {
    id: 'prod-005',
    poNumber: 'PRD-2024-005',
    type: 'MTO',
    status: 'ON_HOLD',
    priority: 'URGENT',
    productId: 'itm-v002',
    productName: 'Industrial Pump X',
    productCode: 'ITM-0303-200',
    isVariant: true,
    variantName: 'Pump X-200 (200 LPM)',
    bomId: 'bom-v002',
    bomVersion: '1.0',
    plannedQty: 4,
    completedQty: 1,
    rejectedQty: 0,
    unit: 'Pcs',
    plannedStartDate: '2024-04-20',
    plannedEndDate: '2024-04-30',
    actualStartDate: '2024-04-20',
    actualEndDate: null,
    salesOrderRef: 'INV-2024-002',
    salesOrderId: 'si-002',
    warehouseId: 'wh-005',
    warehouseName: 'Manufacturing Plant',
    routingId: 'rt-001',
    notes: 'Material shortage — on hold',
    createdBy: 'Admin User',
    createdAt: '2024-04-18T14:00:00Z',
  },
];

export const mockWorkOrders: MockWorkOrder[] = [
  {
    id: 'wo-001',
    woNumber: 'WO-2024-001-1',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    stageNumber: 1,
    stageName: 'Incoming Inspection',
    workCenterId: 'wc-003',
    workCenterName: 'Packing Zone',
    machineId: null,
    machineName: null,
    operatorId: null,
    operatorName: null,
    shiftId: null,
    shiftName: null,
    status: 'COMPLETED',
    plannedQty: 5,
    completedQty: 5,
    rejectedQty: 0,
    plannedStartDate: '2024-04-15',
    plannedEndDate: '2024-04-15',
    actualStartDate: '2024-04-15',
    actualEndDate: '2024-04-15',
    plannedTimeMinutes: 150,
    actualTimeMinutes: 140,
    notes: null,
  },
  {
    id: 'wo-002',
    woNumber: 'WO-2024-001-2',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    stageNumber: 2,
    stageName: 'Casting & Cutting',
    workCenterId: 'wc-001',
    workCenterName: 'Cutting Area',
    machineId: 'mc-001',
    machineName: 'CNC Machine 1',
    operatorId: null,
    operatorName: null,
    shiftId: null,
    shiftName: null,
    status: 'COMPLETED',
    plannedQty: 5,
    completedQty: 5,
    rejectedQty: 0,
    plannedStartDate: '2024-04-16',
    plannedEndDate: '2024-04-17',
    actualStartDate: null,
    actualEndDate: null,
    plannedTimeMinutes: 375,
    actualTimeMinutes: 390,
    notes: null,
  },
  {
    id: 'wo-003',
    woNumber: 'WO-2024-001-3',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    stageNumber: 3,
    stageName: 'Machining',
    workCenterId: 'wc-001',
    workCenterName: 'Cutting Area',
    machineId: 'mc-004',
    machineName: 'Hydraulic Press 2',
    operatorId: null,
    operatorName: null,
    shiftId: null,
    shiftName: null,
    status: 'IN_PROGRESS',
    plannedQty: 5,
    completedQty: 2,
    rejectedQty: 0,
    plannedStartDate: '2024-04-18',
    plannedEndDate: '2024-04-20',
    actualStartDate: null,
    actualEndDate: null,
    plannedTimeMinutes: 450,
    actualTimeMinutes: null,
    notes: null,
  },
  {
    id: 'wo-004',
    woNumber: 'WO-2024-001-4',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    stageNumber: 4,
    stageName: 'Assembly',
    workCenterId: 'wc-002',
    workCenterName: 'Assembly Line 1',
    machineId: null,
    machineName: null,
    operatorId: null,
    operatorName: null,
    shiftId: null,
    shiftName: null,
    status: 'PENDING',
    plannedQty: 5,
    completedQty: 0,
    rejectedQty: 0,
    plannedStartDate: '2024-04-21',
    plannedEndDate: '2024-04-22',
    actualStartDate: null,
    actualEndDate: null,
    plannedTimeMinutes: 225,
    actualTimeMinutes: null,
    notes: null,
  },
  {
    id: 'wo-005',
    woNumber: 'WO-2024-001-5',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    stageNumber: 5,
    stageName: 'Final Inspection',
    workCenterId: 'wc-003',
    workCenterName: 'Packing Zone',
    machineId: null,
    machineName: null,
    operatorId: null,
    operatorName: null,
    shiftId: null,
    shiftName: null,
    status: 'PENDING',
    plannedQty: 5,
    completedQty: 0,
    rejectedQty: 0,
    plannedStartDate: '2024-04-23',
    plannedEndDate: '2024-04-23',
    actualStartDate: null,
    actualEndDate: null,
    plannedTimeMinutes: 150,
    actualTimeMinutes: null,
    notes: null,
  },
  {
    id: 'wo-006',
    woNumber: 'WO-2024-001-6',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    stageNumber: 6,
    stageName: 'Packing',
    workCenterId: 'wc-003',
    workCenterName: 'Packing Zone',
    machineId: null,
    machineName: null,
    operatorId: null,
    operatorName: null,
    shiftId: null,
    shiftName: null,
    status: 'PENDING',
    plannedQty: 5,
    completedQty: 0,
    rejectedQty: 0,
    plannedStartDate: '2024-04-24',
    plannedEndDate: '2024-04-24',
    actualStartDate: null,
    actualEndDate: null,
    plannedTimeMinutes: 100,
    actualTimeMinutes: null,
    notes: null,
  },
];

// ─── MRP Runs ────────────────────────────────────────────────────────────────
export interface MockMRPRun {
  id: string;
  runNumber: string;
  runDate: string;
  runBy: string;
  fromDate: string;
  toDate: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  demandOrders: number;
  productionOrders: number;
  itemsAnalyzed: number;
  shortageItems: number;
  purchaseSuggestions: number;
  productionSuggestions: number;
  totalPurchaseValue: number;
  notes: string | null;
  completedAt: string | null;
}

export interface MockMRPDemand {
  id: string;
  mrpRunId: string;
  sourceType: 'SALES_ORDER' | 'PRODUCTION_ORDER' | 'FORECAST' | 'SAFETY_STOCK';
  sourceId: string;
  sourceNumber: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  isVariant: boolean;
  variantName: string | null;
  requiredQty: number;
  unit: string;
  requiredDate: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface MockMRPResult {
  id: string;
  mrpRunId: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  itemType: string;
  isVariant: boolean;
  variantName: string | null;
  unit: string;
  grossRequirement: number;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  netRequirement: number;
  scheduledReceipts: number;
  finalShortage: number;
  supplierLeadTimeDays: number;
  orderDate: string;
  requiredDate: string;
  status: 'SUFFICIENT' | 'SHORT' | 'CRITICAL';
  suggestedAction: 'NONE' | 'PURCHASE' | 'PRODUCE' | 'EXPEDITE';
  suggestedQty: number;
  estimatedCost: number;
}

export interface MockMRPSuggestion {
  id: string;
  mrpRunId: string;
  type: 'PURCHASE' | 'PRODUCTION';
  itemId: string;
  itemName: string;
  itemCode: string;
  variantName: string | null;
  suggestedQty: number;
  unit: string;
  requiredDate: string;
  orderByDate: string;
  estimatedCost: number;
  supplierId: string | null;
  supplierName: string | null;
  leadTimeDays: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  convertedDocId: string | null;
  convertedDocNumber: string | null;
  notes: string | null;
}

export const mockMRPRuns: MockMRPRun[] = [
  {
    id: 'mrp-001',
    runNumber: 'MRP-2024-001',
    runDate: '2024-04-20',
    runBy: 'Admin User',
    fromDate: '2024-04-20',
    toDate: '2024-05-20',
    status: 'COMPLETED',
    demandOrders: 5,
    productionOrders: 3,
    itemsAnalyzed: 12,
    shortageItems: 4,
    purchaseSuggestions: 3,
    productionSuggestions: 2,
    totalPurchaseValue: 485000,
    notes: null,
    completedAt: '2024-04-20T10:15:00Z',
  },
  {
    id: 'mrp-002',
    runNumber: 'MRP-2024-002',
    runDate: '2024-05-01',
    runBy: 'Admin User',
    fromDate: '2024-05-01',
    toDate: '2024-05-31',
    status: 'COMPLETED',
    demandOrders: 7,
    productionOrders: 5,
    itemsAnalyzed: 15,
    shortageItems: 5,
    purchaseSuggestions: 4,
    productionSuggestions: 3,
    totalPurchaseValue: 620000,
    notes: 'Monthly MRP run',
    completedAt: '2024-05-01T09:30:00Z',
  },
];

export interface MockMaterialReservation {
  id: string;
  productionOrderId: string;
  itemId: string;
  itemName: string;
  itemCode: string;
  requiredQty: number;
  reservedQty: number;
  unit: string;
  status: 'PENDING' | 'RESERVED' | 'PARTIAL' | 'RELEASED';
  warehouseId: string;
}

export let mockMaterialReservations: MockMaterialReservation[] = [
  {
    id: 'mr-001',
    productionOrderId: 'prod-001',
    itemId: 'itm-016',
    itemName: 'Steel Rod 10mm',
    itemCode: 'ITM-0301',
    requiredQty: 18.9,
    reservedQty: 18.9,
    unit: 'Kg',
    status: 'RESERVED',
    warehouseId: 'wh-001',
  },
  {
    id: 'mr-002',
    productionOrderId: 'prod-001',
    itemId: 'itm-019',
    itemName: 'Cutting Oil 5L',
    itemCode: 'ITM-0304',
    requiredQty: 1.5,
    reservedQty: 1.5,
    unit: 'Ltr',
    status: 'RESERVED',
    warehouseId: 'wh-001',
  },
  {
    id: 'mr-003',
    productionOrderId: 'prod-001',
    itemId: 'itm-017',
    itemName: 'Gear Assembly A',
    itemCode: 'ITM-0302',
    requiredQty: 1.02,
    reservedQty: 1,
    unit: 'Pcs',
    status: 'PARTIAL',
    warehouseId: 'wh-001',
  },
  {
    id: 'mr-004',
    productionOrderId: 'prod-001',
    itemId: 'itm-020',
    itemName: 'Cardboard Box',
    itemCode: 'ITM-0305',
    requiredQty: 1,
    reservedQty: 0,
    unit: 'Box',
    status: 'PENDING',
    warehouseId: 'wh-001',
  },
];

// ─── MRP Results ──────────────────────────────────────────────────────────────
export const mockMRPResults: MockMRPResult[] = [
  {
    id: 'mrp-res-001',
    mrpRunId: 'mrp-002',
    itemId: 'itm-016',
    itemName: 'Steel Rod 10mm',
    itemCode: 'ITM-0301',
    itemType: 'RAW_MATERIAL',
    isVariant: false,
    variantName: null,
    unit: 'Kg',
    grossRequirement: 180,
    currentStock: 350,
    reservedStock: 18.9,
    availableStock: 331.1,
    netRequirement: 0,
    scheduledReceipts: 0,
    finalShortage: 0,
    supplierLeadTimeDays: 7,
    orderDate: '2024-04-24',
    requiredDate: '2024-05-31',
    status: 'SUFFICIENT',
    suggestedAction: 'NONE',
    suggestedQty: 0,
    estimatedCost: 0,
  },
  {
    id: 'mrp-res-002',
    mrpRunId: 'mrp-002',
    itemId: 'itm-019',
    itemName: 'Cutting Oil 5L',
    itemCode: 'ITM-0304',
    itemType: 'CONSUMABLE',
    isVariant: false,
    variantName: null,
    unit: 'Ltr',
    grossRequirement: 25,
    currentStock: 48,
    reservedStock: 1.5,
    availableStock: 46.5,
    netRequirement: 0,
    scheduledReceipts: 0,
    finalShortage: 0,
    supplierLeadTimeDays: 0,
    orderDate: '2024-05-01',
    requiredDate: '2024-05-31',
    status: 'SUFFICIENT',
    suggestedAction: 'NONE',
    suggestedQty: 0,
    estimatedCost: 0,
  },
  {
    id: 'mrp-res-003',
    mrpRunId: 'mrp-002',
    itemId: 'itm-017',
    itemName: 'Gear Assembly A',
    itemCode: 'ITM-0302',
    itemType: 'SEMI_FINISHED',
    isVariant: false,
    variantName: null,
    unit: 'Pcs',
    grossRequirement: 8,
    currentStock: 22,
    reservedStock: 1,
    availableStock: 21,
    netRequirement: 0,
    scheduledReceipts: 0,
    finalShortage: 0,
    supplierLeadTimeDays: 0,
    orderDate: '2024-05-01',
    requiredDate: '2024-05-31',
    status: 'SUFFICIENT',
    suggestedAction: 'NONE',
    suggestedQty: 0,
    estimatedCost: 0,
  },
  {
    id: 'mrp-res-004',
    mrpRunId: 'mrp-002',
    itemId: 'itm-v001',
    itemName: 'Pump X-100',
    itemCode: 'ITM-0303-100',
    itemType: 'FINISHED_GOOD',
    isVariant: true,
    variantName: 'Pump X-100 (100 LPM)',
    unit: 'Pcs',
    grossRequirement: 7,
    currentStock: 3,
    reservedStock: 0,
    availableStock: 3,
    netRequirement: 4,
    scheduledReceipts: 5,
    finalShortage: 0,
    supplierLeadTimeDays: 30,
    orderDate: '2024-04-01',
    requiredDate: '2024-05-31',
    status: 'SUFFICIENT',
    suggestedAction: 'NONE',
    suggestedQty: 0,
    estimatedCost: 0,
  },
  {
    id: 'mrp-res-005',
    mrpRunId: 'mrp-002',
    itemId: 'itm-v002',
    itemName: 'Pump X-200',
    itemCode: 'ITM-0303-200',
    itemType: 'FINISHED_GOOD',
    isVariant: true,
    variantName: 'Pump X-200 (200 LPM)',
    unit: 'Pcs',
    grossRequirement: 5,
    currentStock: 2,
    reservedStock: 0,
    availableStock: 2,
    netRequirement: 3,
    scheduledReceipts: 0,
    finalShortage: 3,
    supplierLeadTimeDays: 30,
    orderDate: '2024-04-01',
    requiredDate: '2024-05-15',
    status: 'CRITICAL',
    suggestedAction: 'PRODUCE',
    suggestedQty: 3,
    estimatedCost: 126000,
  },
  {
    id: 'mrp-res-006',
    mrpRunId: 'mrp-002',
    itemId: 'itm-020',
    itemName: 'Cardboard Box',
    itemCode: 'ITM-0305',
    itemType: 'PACKAGING',
    isVariant: false,
    variantName: null,
    unit: 'Box',
    grossRequirement: 12,
    currentStock: 500,
    reservedStock: 1,
    availableStock: 499,
    netRequirement: 0,
    scheduledReceipts: 0,
    finalShortage: 0,
    supplierLeadTimeDays: 0,
    orderDate: '2024-05-01',
    requiredDate: '2024-05-31',
    status: 'SUFFICIENT',
    suggestedAction: 'NONE',
    suggestedQty: 0,
    estimatedCost: 0,
  },
];

// ─── MRP Suggestions ───────────────────────────────────────────────────────────
export const mockMRPSuggestions: MockMRPSuggestion[] = [
  {
    id: 'sug-001',
    mrpRunId: 'mrp-002',
    type: 'PRODUCTION',
    itemId: 'itm-v002',
    itemName: 'Industrial Pump X',
    itemCode: 'ITM-0303-200',
    variantName: 'Pump X-200 (200 LPM)',
    suggestedQty: 3,
    unit: 'Pcs',
    requiredDate: '2024-05-15',
    orderByDate: '2024-05-08',
    estimatedCost: 126000,
    supplierId: null,
    supplierName: null,
    leadTimeDays: 7,
    priority: 'HIGH',
    status: 'PENDING',
    convertedDocId: null,
    convertedDocNumber: null,
    notes: null,
  },
  {
    id: 'sug-002',
    mrpRunId: 'mrp-002',
    type: 'PURCHASE',
    itemId: 'itm-016',
    itemName: 'Steel Rod 10mm',
    itemCode: 'ITM-0301',
    variantName: null,
    suggestedQty: 200,
    unit: 'Kg',
    requiredDate: '2024-05-20',
    orderByDate: '2024-05-13',
    estimatedCost: 17000,
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    leadTimeDays: 7,
    priority: 'NORMAL',
    status: 'PENDING',
    convertedDocId: null,
    convertedDocNumber: null,
    notes: null,
  },
  {
    id: 'sug-003',
    mrpRunId: 'mrp-002',
    type: 'PURCHASE',
    itemId: 'itm-019',
    itemName: 'Cutting Oil 5L',
    itemCode: 'ITM-0304',
    variantName: null,
    suggestedQty: 40,
    unit: 'Ltr',
    requiredDate: '2024-05-20',
    orderByDate: '2024-05-15',
    estimatedCost: 18000,
    supplierId: null,
    supplierName: null,
    leadTimeDays: 5,
    priority: 'LOW',
    status: 'APPROVED',
    convertedDocId: null,
    convertedDocNumber: null,
    notes: null,
  },
  {
    id: 'sug-004',
    mrpRunId: 'mrp-002',
    type: 'PRODUCTION',
    itemId: 'itm-v001',
    itemName: 'Industrial Pump X',
    itemCode: 'ITM-0303-100',
    variantName: 'Pump X-100 (100 LPM)',
    suggestedQty: 2,
    unit: 'Pcs',
    requiredDate: '2024-05-25',
    orderByDate: '2024-05-18',
    estimatedCost: 70000,
    supplierId: null,
    supplierName: null,
    leadTimeDays: 7,
    priority: 'NORMAL',
    status: 'PENDING',
    convertedDocId: null,
    convertedDocNumber: null,
    notes: null,
  },
];

// ─── Production Entry ────────────────────────────────────────────────────────
export interface MockProductionEntry {
  id: string;
  entryNumber: string;
  productionOrderId: string;
  productionOrderNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  stageName: string;
  workCenterId: string;
  workCenterName: string;
  machineId: string | null;
  machineName: string | null;
  operatorId: string;
  operatorName: string;
  shiftId: string;
  shiftName: string;
  date: string;
  producedQty: number;
  rejectedQty: number;
  unit: string;
  startTime: string;
  endTime: string;
  actualTimeMinutes: number;
  notes: string | null;
  enteredBy: string;
  supervisorId: string | null;
  supervisorName: string | null;
  isApproved: boolean;
  createdAt: string;
}

export interface MockDowntimeEntry {
  id: string;
  entryNumber: string;
  machineId: string;
  machineName: string;
  workCenterId: string;
  workCenterName: string;
  downtimeCodeId: string;
  downtimeCodeName: string;
  category: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  productionOrderId: string | null;
  shiftId: string;
  shiftName: string;
  operatorId: string;
  operatorName: string;
  description: string | null;
  isResolved: boolean;
  resolvedBy: string | null;
  resolvedAt: string | null;
  date: string;
}

export interface MockRejectionEntry {
  id: string;
  entryNumber: string;
  productionOrderId: string;
  productionOrderNumber: string;
  workOrderId: string;
  stageName: string;
  machineId: string | null;
  machineName: string | null;
  operatorId: string;
  operatorName: string;
  rejectionCodeId: string;
  rejectionCodeName: string;
  category: string;
  rejectedQty: number;
  unit: string;
  date: string;
  shiftId: string;
  shiftName: string;
  description: string | null;
  isReworkable: boolean;
  reworkQty: number;
  scrappedQty: number;
}

export const mockProductionEntries: MockProductionEntry[] = [
  {
    id: 'pe-001',
    entryNumber: 'PE-2024-001',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    workOrderId: 'wo-002',
    workOrderNumber: 'WO-2024-001-2',
    stageName: 'Casting & Cutting',
    workCenterId: 'wc-001',
    workCenterName: 'Cutting Area',
    machineId: 'mc-001',
    machineName: 'CNC Machine 1',
    operatorId: 'op-001',
    operatorName: 'Ramesh Yadav',
    shiftId: 'sh-001',
    shiftName: 'Morning',
    date: '2024-04-16',
    producedQty: 3,
    rejectedQty: 0,
    unit: 'Pcs',
    startTime: '06:00',
    endTime: '10:00',
    actualTimeMinutes: 240,
    notes: null,
    enteredBy: 'op-001',
    supervisorId: null,
    supervisorName: 'Meena Devi',
    isApproved: true,
    createdAt: '2024-04-16T10:30:00Z',
  },
  {
    id: 'pe-002',
    entryNumber: 'PE-2024-002',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    workOrderId: 'wo-002',
    workOrderNumber: 'WO-2024-001-2',
    stageName: 'Casting & Cutting',
    workCenterId: 'wc-001',
    workCenterName: 'Cutting Area',
    machineId: 'mc-001',
    machineName: 'CNC Machine 1',
    operatorId: 'op-001',
    operatorName: 'Ramesh Yadav',
    shiftId: 'sh-001',
    shiftName: 'Morning',
    date: '2024-04-17',
    producedQty: 2,
    rejectedQty: 0,
    unit: 'Pcs',
    startTime: '06:00',
    endTime: '08:30',
    actualTimeMinutes: 150,
    notes: null,
    enteredBy: 'op-001',
    supervisorId: null,
    supervisorName: 'Meena Devi',
    isApproved: true,
    createdAt: '2024-04-17T08:45:00Z',
  },
  {
    id: 'pe-003',
    entryNumber: 'PE-2024-003',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    workOrderId: 'wo-003',
    workOrderNumber: 'WO-2024-001-3',
    stageName: 'Machining',
    workCenterId: 'wc-001',
    workCenterName: 'Cutting Area',
    machineId: 'mc-004',
    machineName: 'Hydraulic Press 2',
    operatorId: 'op-001',
    operatorName: 'Ramesh Yadav',
    shiftId: 'sh-001',
    shiftName: 'Morning',
    date: '2024-04-18',
    producedQty: 2,
    rejectedQty: 0,
    unit: 'Pcs',
    startTime: '06:00',
    endTime: '14:00',
    actualTimeMinutes: 480,
    notes: null,
    enteredBy: 'op-001',
    supervisorId: null,
    supervisorName: null,
    isApproved: false,
    createdAt: '2024-04-18T14:30:00Z',
  },
  {
    id: 'pe-004',
    entryNumber: 'PE-2024-004',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    workOrderId: 'wo-003',
    workOrderNumber: 'WO-2024-001-3',
    stageName: 'Machining',
    workCenterId: 'wc-001',
    workCenterName: 'Cutting Area',
    machineId: 'mc-004',
    machineName: 'Hydraulic Press 2',
    operatorId: 'op-001',
    operatorName: 'Ramesh Yadav',
    shiftId: 'sh-001',
    shiftName: 'Morning',
    date: '2024-04-19',
    producedQty: 0,
    rejectedQty: 1,
    unit: 'Pcs',
    startTime: '06:00',
    endTime: '08:00',
    actualTimeMinutes: 120,
    notes: 'Machine calibration issue',
    enteredBy: 'op-001',
    supervisorId: null,
    supervisorName: null,
    isApproved: false,
    createdAt: '2024-04-19T08:15:00Z',
  },
  {
    id: 'pe-005',
    entryNumber: 'PE-2024-005',
    productionOrderId: 'prod-003',
    productionOrderNumber: 'PRD-2024-003',
    workOrderId: 'wo-006',
    workOrderNumber: 'WO-2024-001-6',
    stageName: 'Packing',
    workCenterId: 'wc-003',
    workCenterName: 'Packing Zone',
    machineId: null,
    machineName: null,
    operatorId: 'op-003',
    operatorName: 'Anita Sharma',
    shiftId: 'sh-002',
    shiftName: 'Afternoon',
    date: '2024-04-09',
    producedQty: 10,
    rejectedQty: 1,
    unit: 'Pcs',
    startTime: '14:00',
    endTime: '18:00',
    actualTimeMinutes: 240,
    notes: null,
    enteredBy: 'op-003',
    supervisorId: null,
    supervisorName: null,
    isApproved: true,
    createdAt: '2024-04-09T18:30:00Z',
  },
];

export const mockDowntimeEntries: MockDowntimeEntry[] = [
  {
    id: 'dt-001',
    entryNumber: 'DTE-2024-001',
    machineId: 'mc-001',
    machineName: 'CNC Machine 1',
    workCenterId: 'wc-001',
    workCenterName: 'Cutting Area',
    downtimeCodeId: 'dt-002',
    downtimeCodeName: 'Planned Maintenance',
    category: 'PLANNED',
    startTime: '10:00',
    endTime: '12:00',
    durationMinutes: 120,
    productionOrderId: 'prod-001',
    shiftId: 'sh-001',
    shiftName: 'Morning',
    operatorId: 'op-001',
    operatorName: 'Ramesh Yadav',
    description: 'Monthly scheduled maintenance',
    isResolved: true,
    resolvedBy: 'Suresh Patil',
    resolvedAt: '2024-04-16T12:00:00Z',
    date: '2024-04-16',
  },
  {
    id: 'dt-002',
    entryNumber: 'DTE-2024-002',
    machineId: 'mc-004',
    machineName: 'Hydraulic Press 2',
    workCenterId: 'wc-001',
    workCenterName: 'Cutting Area',
    downtimeCodeId: 'dt-001',
    downtimeCodeName: 'Machine Breakdown',
    category: 'BREAKDOWN',
    startTime: '09:30',
    endTime: null,
    durationMinutes: null,
    productionOrderId: null,
    shiftId: 'sh-001',
    shiftName: 'Morning',
    operatorId: 'op-001',
    operatorName: 'Ramesh Yadav',
    description: 'Hydraulic seal failure',
    isResolved: false,
    resolvedBy: null,
    resolvedAt: null,
    date: '2024-04-19',
  },
  {
    id: 'dt-003',
    entryNumber: 'DTE-2024-003',
    machineId: 'mc-003',
    machineName: 'Conveyor Belt 1',
    workCenterId: 'wc-003',
    workCenterName: 'Packing Zone',
    downtimeCodeId: 'dt-003',
    downtimeCodeName: 'Material Shortage',
    category: 'MATERIAL',
    startTime: '14:00',
    endTime: '15:30',
    durationMinutes: 90,
    productionOrderId: null,
    shiftId: 'sh-002',
    shiftName: 'Afternoon',
    operatorId: 'op-003',
    operatorName: 'Anita Sharma',
    description: null,
    isResolved: true,
    resolvedBy: 'Meena Devi',
    resolvedAt: '2024-04-18T15:30:00Z',
    date: '2024-04-18',
  },
];

export const mockRejectionEntries: MockRejectionEntry[] = [
  {
    id: 're-001',
    entryNumber: 'RE-2024-001',
    productionOrderId: 'prod-001',
    productionOrderNumber: 'PRD-2024-001',
    workOrderId: 'wo-003',
    stageName: 'Machining',
    machineId: 'mc-004',
    machineName: 'Hydraulic Press 2',
    operatorId: 'op-001',
    operatorName: 'Ramesh Yadav',
    rejectionCodeId: 'rc-001',
    rejectionCodeName: 'Dimensional Error',
    category: 'MACHINE',
    rejectedQty: 1,
    unit: 'Pcs',
    date: '2024-04-19',
    shiftId: 'sh-001',
    shiftName: 'Morning',
    description: 'Bore diameter out of tolerance',
    isReworkable: false,
    reworkQty: 0,
    scrappedQty: 1,
  },
  {
    id: 're-002',
    entryNumber: 'RE-2024-002',
    productionOrderId: 'prod-003',
    productionOrderNumber: 'PRD-2024-003',
    workOrderId: 'wo-006',
    stageName: 'Packing',
    machineId: null,
    machineName: null,
    operatorId: 'op-003',
    operatorName: 'Anita Sharma',
    rejectionCodeId: 'rc-006',
    rejectionCodeName: 'Packaging Defect',
    category: 'PROCESS',
    rejectedQty: 1,
    unit: 'Pcs',
    date: '2024-04-09',
    shiftId: 'sh-002',
    shiftName: 'Afternoon',
    description: 'Damaged outer box during packing',
    isReworkable: true,
    reworkQty: 1,
    scrappedQty: 0,
  },
];