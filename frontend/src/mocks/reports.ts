// ─── Stock Summary ────────────────────────────────────────────────────────────
export const mockStockSummary = [
  { id: 'itm-001', code: 'ITM-0001', name: 'Laptop 15" Core i7', category: 'Laptops & Desktops', unit: 'Pcs', openingStock: 25, inQty: 40, outQty: 27, currentStock: 38, minLevel: 10, purchaseRate: 72000, stockValue: 2736000, status: 'NORMAL' as const },
  { id: 'itm-002', code: 'ITM-0002', name: 'Wireless Mouse Logitech M235', category: 'Keyboards & Mice', unit: 'Pcs', openingStock: 80, inQty: 120, outQty: 76, currentStock: 124, minLevel: 20, purchaseRate: 850, stockValue: 105400, status: 'NORMAL' as const },
  { id: 'itm-003', code: 'ITM-0003', name: 'USB-C 7-in-1 Hub', category: 'Cables & Adapters', unit: 'Pcs', openingStock: 60, inQty: 80, outQty: 51, currentStock: 89, minLevel: 15, purchaseRate: 1200, stockValue: 106800, status: 'NORMAL' as const },
  { id: 'itm-004', code: 'ITM-0004', name: 'Mechanical Keyboard RGB', category: 'Keyboards & Mice', unit: 'Pcs', openingStock: 30, inQty: 40, outQty: 25, currentStock: 45, minLevel: 10, purchaseRate: 5500, stockValue: 247500, status: 'NORMAL' as const },
  { id: 'itm-005', code: 'ITM-0045', name: 'Monitor 24" Full HD IPS', category: 'Monitors & Displays', unit: 'Pcs', openingStock: 12, inQty: 10, outQty: 18, currentStock: 4, minLevel: 10, purchaseRate: 12000, stockValue: 48000, status: 'LOW' as const },
  { id: 'itm-006', code: 'ITM-0078', name: 'Laptop Bag 15.6" Waterproof', category: 'Accessories', unit: 'Pcs', openingStock: 20, inQty: 15, outQty: 32, currentStock: 3, minLevel: 15, purchaseRate: 800, stockValue: 2400, status: 'LOW' as const },
  { id: 'itm-007', code: 'ITM-0112', name: 'HDMI Cable 2m v2.0', category: 'Cables & Adapters', unit: 'Pcs', openingStock: 50, inQty: 60, outQty: 104, currentStock: 6, minLevel: 25, purchaseRate: 150, stockValue: 900, status: 'LOW' as const },
  { id: 'itm-008', code: 'ITM-0150', name: 'Network Switch 8-Port', category: 'Networking', unit: 'Pcs', openingStock: 8, inQty: 5, outQty: 11, currentStock: 2, minLevel: 5, purchaseRate: 3200, stockValue: 6400, status: 'CRITICAL' as const },
  { id: 'itm-009', code: 'ITM-0200', name: 'SSD 1TB NVMe Samsung', category: 'Storage', unit: 'Pcs', openingStock: 40, inQty: 60, outQty: 33, currentStock: 67, minLevel: 20, purchaseRate: 6500, stockValue: 435500, status: 'NORMAL' as const },
  { id: 'itm-010', code: 'ITM-0201', name: 'RAM 16GB DDR5 3200MHz', category: 'Storage', unit: 'Pcs', openingStock: 35, inQty: 50, outQty: 31, currentStock: 54, minLevel: 15, purchaseRate: 4800, stockValue: 259200, status: 'NORMAL' as const },
  { id: 'itm-011', code: 'ITM-0222', name: 'Webcam 1080p with Mic', category: 'Accessories', unit: 'Pcs', openingStock: 20, inQty: 30, outQty: 21, currentStock: 29, minLevel: 12, purchaseRate: 1800, stockValue: 52200, status: 'NORMAL' as const },
  { id: 'itm-012', code: 'ITM-0230', name: 'Wi-Fi 6 Router AX1800', category: 'Networking', unit: 'Pcs', openingStock: 10, inQty: 20, outQty: 14, currentStock: 16, minLevel: 8, purchaseRate: 4200, stockValue: 67200, status: 'NORMAL' as const },
];

// ─── Stock Ledger ─────────────────────────────────────────────────────────────
// source field: human-readable movement source label shown in the report
export const mockStockLedger = [
  { id: 'sl-000', date: '2024-04-01', voucherType: 'Opening', voucherNo: 'DSE-2024-0001', party: '—', source: 'DSE-2024-0001 | Opening Stock', inQty: 25, outQty: 0, balance: 25, rate: 72000, value: 1800000 },
  { id: 'sl-001', date: '2024-04-08', voucherType: 'Purchase', voucherNo: 'GRN-2024-0004', party: 'TechSupply Co.', source: 'GRN-2024-0004 | TechSupply Co.', inQty: 20, outQty: 0, balance: 45, rate: 72000, value: 3240000 },
  { id: 'sl-002', date: '2024-04-12', voucherType: 'Sale', voucherNo: 'INV-2024-003', party: 'Ramesh Electronics', source: 'INV-2024-003 | Ramesh Electronics', inQty: 0, outQty: 5, balance: 40, rate: 86000, value: 3400000 },
  { id: 'sl-003', date: '2024-04-18', voucherType: 'Sale', voucherNo: 'INV-2024-007', party: 'Priya Computers', source: 'INV-2024-007 | Priya Computers', inQty: 0, outQty: 8, balance: 32, rate: 86000, value: 2720000 },
  { id: 'sl-004', date: '2024-04-25', voucherType: 'Purchase', voucherNo: 'GRN-2024-0008', party: 'TechSupply Co.', source: 'GRN-2024-0008 | TechSupply Co.', inQty: 20, outQty: 0, balance: 52, rate: 72000, value: 3744000 },
  { id: 'sl-005', date: '2024-05-02', voucherType: 'Sale', voucherNo: 'INV-2024-011', party: 'Global IT Solutions', source: 'INV-2024-011 | Global IT Solutions', inQty: 0, outQty: 10, balance: 42, rate: 86000, value: 3570010 },
  { id: 'sl-006', date: '2024-05-10', voucherType: 'Sale Return', voucherNo: 'SRTN-2024-002', party: 'Ramesh Electronics', source: 'SRTN-2024-002 | Ramesh Electronics', inQty: 2, outQty: 0, balance: 44, rate: 86000, value: 3740000 },
  { id: 'sl-007', date: '2024-05-15', voucherType: 'Adj-Out', voucherNo: 'ADJ-2024-003', party: '—', source: 'ADJ-2024-003 | Damage Write-off', inQty: 0, outQty: 3, balance: 41, rate: 72000, value: 2952000 },
  { id: 'sl-008', date: '2024-05-18', voucherType: 'Adj-In', voucherNo: 'DSE-2024-0003', party: '—', source: 'DSE-2024-0003 | Stock Audit Found', inQty: 4, outQty: 0, balance: 45, rate: 72000, value: 3240000 },
  { id: 'sl-009', date: '2024-05-22', voucherType: 'Transfer In', voucherNo: 'TRF-2024-002', party: 'North Branch', source: 'TRF-2024-002 | North Branch', inQty: 5, outQty: 0, balance: 50, rate: 72000, value: 3600000 },
  { id: 'sl-010', date: '2024-05-28', voucherType: 'Sale', voucherNo: 'INV-2024-019', party: 'Apex Hardware', source: 'INV-2024-019 | Apex Hardware', inQty: 0, outQty: 8, balance: 42, rate: 86000, value: 3570010 },
];

// ─── Low Stock ────────────────────────────────────────────────────────────────
export const mockLowStock = [
  { id: 'itm-005', code: 'ITM-0045', name: 'Monitor 24" Full HD IPS', warehouse: 'Main Warehouse', currentStock: 4, minLevel: 10, shortage: 6, lastPurchaseRate: 12000, lastPurchaseDate: '2024-03-10', category: 'Monitors & Displays', unit: 'Pcs' },
  { id: 'itm-006', code: 'ITM-0078', name: 'Laptop Bag 15.6" Waterproof', warehouse: 'Main Warehouse', currentStock: 3, minLevel: 15, shortage: 12, lastPurchaseRate: 800, lastPurchaseDate: '2024-02-28', category: 'Accessories', unit: 'Pcs' },
  { id: 'itm-007', code: 'ITM-0112', name: 'HDMI Cable 2m v2.0', warehouse: 'Main Warehouse', currentStock: 6, minLevel: 25, shortage: 19, lastPurchaseRate: 150, lastPurchaseDate: '2024-03-05', category: 'Cables & Adapters', unit: 'Pcs' },
  { id: 'itm-008', code: 'ITM-0150', name: 'Network Switch 8-Port', warehouse: 'Main Warehouse', currentStock: 2, minLevel: 5, shortage: 3, lastPurchaseRate: 3200, lastPurchaseDate: '2024-01-20', category: 'Networking', unit: 'Pcs' },
  { id: 'itm-013', code: 'ITM-0310', name: 'Printer Ink Cartridge HP 803', warehouse: 'North Branch', currentStock: 4, minLevel: 20, shortage: 16, lastPurchaseRate: 480, lastPurchaseDate: '2024-03-01', category: 'Printers & Scanners', unit: 'Pcs' },
  { id: 'itm-014', code: 'ITM-0320', name: 'USB Flash Drive 64GB Kingston', warehouse: 'South Depot', currentStock: 8, minLevel: 30, shortage: 22, lastPurchaseRate: 350, lastPurchaseDate: '2024-02-15', category: 'Storage', unit: 'Pcs' },
  { id: 'itm-015', code: 'ITM-0335', name: 'Ethernet Cable Cat6 5m', warehouse: 'Main Warehouse', currentStock: 10, minLevel: 40, shortage: 30, lastPurchaseRate: 120, lastPurchaseDate: '2024-03-12', category: 'Cables & Adapters', unit: 'Pcs' },
];

// ─── Purchase Register ────────────────────────────────────────────────────────
export const mockPurchaseRegister = [
  { id: 'pi-001', date: '2024-03-18', invoiceNo: 'PINV-2024-001', supplierInvNo: 'TS/2024/1820', supplier: 'TechSupply Co.', gstin: '29AACCT3428D1Z2', itemCount: 10, taxableAmount: 105763, cgst: 9519, sgst: 0, igst: 19037, totalTax: 28556, grandTotal: 134319, status: 'RECEIVED' as const },
  { id: 'pi-002', date: '2024-03-17', invoiceNo: 'PINV-2024-002', supplierInvNo: 'NG/INV/4521', supplier: 'NexGen Components', gstin: '33AABCN9012E1ZK', itemCount: 5, taxableAmount: 58136, cgst: 5232, sgst: 0, igst: 10464, totalTax: 15696, grandTotal: 73832, status: 'RECEIVED' as const },
  { id: 'pi-003', date: '2024-03-15', invoiceNo: 'PINV-2024-003', supplierInvNo: 'TS/2024/1795', supplier: 'TechSupply Co.', gstin: '29AACCT3428D1Z2', itemCount: 8, taxableAmount: 81186, cgst: 7307, sgst: 0, igst: 14614, totalTax: 21921, grandTotal: 103107, status: 'RECEIVED' as const },
  { id: 'pi-004', date: '2024-03-14', invoiceNo: 'PINV-2024-004', supplierInvNo: 'MH/LOC/0021', supplier: 'Maharashtra Local Supplier', gstin: '27AABCM1234G1Z9', itemCount: 4, taxableAmount: 35763, cgst: 3219, sgst: 3219, igst: 0, totalTax: 6438, grandTotal: 42201, status: 'RECEIVED' as const },
  { id: 'pi-005', date: '2024-03-12', invoiceNo: 'PINV-2024-005', supplierInvNo: 'NG/INV/4498', supplier: 'NexGen Components', gstin: '33AABCN9012E1ZK', itemCount: 6, taxableAmount: 67119, cgst: 0, sgst: 0, igst: 12081, totalTax: 12081, grandTotal: 79200, status: 'CANCELLED' as const },
  { id: 'pi-006', date: '2024-03-10', invoiceNo: 'PINV-2024-006', supplierInvNo: 'MH/LOC/0018', supplier: 'Maharashtra Local Supplier', gstin: '27AABCM1234G1Z9', itemCount: 3, taxableAmount: 22881, cgst: 2059, sgst: 2059, igst: 0, totalTax: 4118, grandTotal: 26999, status: 'RECEIVED' as const },
  { id: 'pi-007', date: '2024-03-08', invoiceNo: 'PINV-2024-007', supplierInvNo: 'TS/2024/1763', supplier: 'TechSupply Co.', gstin: '29AACCT3428D1Z2', itemCount: 7, taxableAmount: 93220, cgst: 0, sgst: 0, igst: 16780, totalTax: 16780, grandTotal: 110000, status: 'RECEIVED' as const },
  { id: 'pi-008', date: '2024-03-05', invoiceNo: 'PINV-2024-008', supplierInvNo: 'DLH/2024/0092', supplier: 'Delhi Distributors Ltd', gstin: '07AABCD5678J1ZQ', itemCount: 9, taxableAmount: 126271, cgst: 0, sgst: 0, igst: 22729, totalTax: 22729, grandTotal: 149000, status: 'RECEIVED' as const },
];

// ─── GST Purchase Register ────────────────────────────────────────────────────
export const mockGSTPurchase = [
  { id: 'gp-001', date: '2024-03-18', invoiceNo: 'PINV-2024-001', supplierGstin: '29AACCT3428D1Z2', supplier: 'TechSupply Co.', t0: 0, t5: 0, t12: 0, t18: 105763, t28: 0, cgst: 9519, sgst: 0, igst: 19037, total: 134319 },
  { id: 'gp-002', date: '2024-03-17', invoiceNo: 'PINV-2024-002', supplierGstin: '33AABCN9012E1ZK', supplier: 'NexGen Components', t0: 0, t5: 0, t12: 8475, t18: 49661, t28: 0, cgst: 5232, sgst: 0, igst: 10464, total: 73832 },
  { id: 'gp-003', date: '2024-03-15', invoiceNo: 'PINV-2024-003', supplierGstin: '29AACCT3428D1Z2', supplier: 'TechSupply Co.', t0: 0, t5: 0, t12: 0, t18: 81186, t28: 0, cgst: 7307, sgst: 0, igst: 14614, total: 103107 },
  { id: 'gp-004', date: '2024-03-14', invoiceNo: 'PINV-2024-004', supplierGstin: '27AABCM1234G1Z9', supplier: 'MH Local Supplier', t0: 5085, t5: 0, t12: 10169, t18: 20509, t28: 0, cgst: 3219, sgst: 3219, igst: 0, total: 42201 },
  { id: 'gp-005', date: '2024-03-10', invoiceNo: 'PINV-2024-006', supplierGstin: '27AABCM1234G1Z9', supplier: 'MH Local Supplier', t0: 0, t5: 3051, t12: 9322, t18: 10508, t28: 0, cgst: 2059, sgst: 2059, igst: 0, total: 26999 },
  { id: 'gp-006', date: '2024-03-08', invoiceNo: 'PINV-2024-007', supplierGstin: '29AACCT3428D1Z2', supplier: 'TechSupply Co.', t0: 0, t5: 0, t12: 0, t18: 93220, t28: 0, cgst: 0, sgst: 0, igst: 16780, total: 110000 },
  { id: 'gp-007', date: '2024-03-05', invoiceNo: 'PINV-2024-008', supplierGstin: '07AABCD5678J1ZQ', supplier: 'Delhi Distributors', t0: 0, t5: 10169, t12: 25424, t18: 90678, t28: 0, cgst: 0, sgst: 0, igst: 22729, total: 149000 },
];

// ─── Sales Register ───────────────────────────────────────────────────────────
export const mockSalesRegister = [
  { id: 'si-001', date: '2024-03-18', invoiceNo: 'INV-2024-001', customer: 'Ramesh Electronics', gstin: '27AADCR4849M1ZV', itemCount: 4, taxableAmount: 24102, cgst: 2169, sgst: 2169, igst: 0, totalTax: 4338, grandTotal: 28440, paymentStatus: 'PAID' as const, paymentMode: 'CASH' as const },
  { id: 'si-002', date: '2024-03-17', invoiceNo: 'INV-2024-002', customer: 'Global IT Solutions', gstin: '07AABCG5678H1ZP', itemCount: 2, taxableAmount: 13373, cgst: 0, sgst: 0, igst: 2407, totalTax: 2407, grandTotal: 15780, paymentStatus: 'UNPAID' as const, paymentMode: 'CREDIT' as const },
  { id: 'si-003', date: '2024-03-16', invoiceNo: 'INV-2024-003', customer: 'Global IT Solutions', gstin: '07AABCG5678H1ZP', itemCount: 7, taxableAmount: 54508, cgst: 0, sgst: 0, igst: 9812, totalTax: 9812, grandTotal: 64320, paymentStatus: 'PARTIAL' as const, paymentMode: 'PARTIAL' as const },
  { id: 'si-004', date: '2024-03-15', invoiceNo: 'INV-2024-004', customer: 'Priya Computers', gstin: '27AAACP1234Q1ZA', itemCount: 3, taxableAmount: 10678, cgst: 962, sgst: 962, igst: 0, totalTax: 1924, grandTotal: 12602, paymentStatus: 'PAID' as const, paymentMode: 'CASH' as const },
  { id: 'si-005', date: '2024-03-14', invoiceNo: 'INV-2024-005', customer: 'Ramesh Electronics', gstin: '27AADCR4849M1ZV', itemCount: 5, taxableAmount: 33008, cgst: 2971, sgst: 2971, igst: 0, totalTax: 5942, grandTotal: 38950, paymentStatus: 'UNPAID' as const, paymentMode: 'CREDIT' as const },
  { id: 'si-006', date: '2024-03-13', invoiceNo: 'INV-2024-006', customer: 'Priya Computers', gstin: '27AAACP1234Q1ZA', itemCount: 1, taxableAmount: 4000, cgst: 360, sgst: 360, igst: 0, totalTax: 720, grandTotal: 4720, paymentStatus: 'PAID' as const, paymentMode: 'CASH' as const },
  { id: 'si-007', date: '2024-03-12', invoiceNo: 'INV-2024-007', customer: 'Global IT Solutions', gstin: '07AABCG5678H1ZP', itemCount: 6, taxableAmount: 44220, cgst: 0, sgst: 0, igst: 7960, totalTax: 7960, grandTotal: 52180, paymentStatus: 'UNPAID' as const, paymentMode: 'CREDIT' as const },
  { id: 'si-008', date: '2024-03-10', invoiceNo: 'INV-2024-008', customer: 'Ramesh Electronics', gstin: '27AADCR4849M1ZV', itemCount: 3, taxableAmount: 20508, cgst: 1846, sgst: 1846, igst: 0, totalTax: 3692, grandTotal: 24200, paymentStatus: 'PAID' as const, paymentMode: 'CASH' as const },
];

// ─── GST Sales Register ───────────────────────────────────────────────────────
export const mockGSTSales = [
  { id: 'gs-001', date: '2024-03-18', invoiceNo: 'INV-2024-001', customerGstin: '27AADCR4849M1ZV', customer: 'Ramesh Electronics', t0: 0, t5: 0, t12: 2542, t18: 21560, t28: 0, cgst: 2169, sgst: 2169, igst: 0, total: 28440 },
  { id: 'gs-002', date: '2024-03-17', invoiceNo: 'INV-2024-002', customerGstin: '07AABCG5678H1ZP', customer: 'Global IT Solutions', t0: 0, t5: 1271, t12: 0, t18: 12102, t28: 0, cgst: 0, sgst: 0, igst: 2407, total: 15780 },
  { id: 'gs-003', date: '2024-03-16', invoiceNo: 'INV-2024-003', customerGstin: '07AABCG5678H1ZP', customer: 'Global IT Solutions', t0: 0, t5: 0, t12: 6780, t18: 47728, t28: 0, cgst: 0, sgst: 0, igst: 9812, total: 64320 },
  { id: 'gs-004', date: '2024-03-15', invoiceNo: 'INV-2024-004', customerGstin: '27AAACP1234Q1ZA', customer: 'Priya Computers', t0: 0, t5: 0, t12: 3390, t18: 7288, t28: 0, cgst: 962, sgst: 962, igst: 0, total: 12602 },
  { id: 'gs-005', date: '2024-03-14', invoiceNo: 'INV-2024-005', customerGstin: '27AADCR4849M1ZV', customer: 'Ramesh Electronics', t0: 0, t5: 0, t12: 0, t18: 33008, t28: 0, cgst: 2971, sgst: 2971, igst: 0, total: 38950 },
  { id: 'gs-006', date: '2024-03-12', invoiceNo: 'INV-2024-007', customerGstin: '07AABCG5678H1ZP', customer: 'Global IT Solutions', t0: 0, t5: 0, t12: 5085, t18: 39135, t28: 0, cgst: 0, sgst: 0, igst: 7960, total: 52180 },
  { id: 'gs-007', date: '2024-03-10', invoiceNo: 'INV-2024-008', customerGstin: '27AADCR4849M1ZV', customer: 'Ramesh Electronics', t0: 0, t5: 0, t12: 4237, t18: 16271, t28: 0, cgst: 1846, sgst: 1846, igst: 0, total: 24200 },
];

// ─── Outstanding Invoices ─────────────────────────────────────────────────────
export const mockOutstanding = [
  { id: 'oi-001', customer: 'Global IT Solutions', gstin: '07AABCG5678H1ZP', invoiceNo: 'INV-2024-002', invoiceDate: '2024-03-17', dueDate: '2024-04-16', invoiceAmount: 15780, paid: 0, balance: 15780, agingDays: 14, agingBucket: '0-30' as const },
  { id: 'oi-002', customer: 'Global IT Solutions', gstin: '07AABCG5678H1ZP', invoiceNo: 'INV-2024-003', invoiceDate: '2024-03-16', dueDate: '2024-04-15', invoiceAmount: 64320, paid: 30000, balance: 34320, agingDays: 15, agingBucket: '0-30' as const },
  { id: 'oi-003', customer: 'Ramesh Electronics', gstin: '27AADCR4849M1ZV', invoiceNo: 'INV-2024-005', invoiceDate: '2024-03-14', dueDate: '2024-04-13', invoiceAmount: 38950, paid: 0, balance: 38950, agingDays: 17, agingBucket: '0-30' as const },
  { id: 'oi-004', customer: 'Global IT Solutions', gstin: '07AABCG5678H1ZP', invoiceNo: 'INV-2024-007', invoiceDate: '2024-03-12', dueDate: '2024-04-11', invoiceAmount: 52180, paid: 0, balance: 52180, agingDays: 19, agingBucket: '0-30' as const },
  { id: 'oi-005', customer: 'Priya Computers', gstin: '27AAACP1234Q1ZA', invoiceNo: 'INV-2024-015', invoiceDate: '2024-02-14', dueDate: '2024-03-15', invoiceAmount: 24800, paid: 10000, balance: 14800, agingDays: 47, agingBucket: '31-60' as const },
  { id: 'oi-006', customer: 'Ramesh Electronics', gstin: '27AADCR4849M1ZV', invoiceNo: 'INV-2024-018', invoiceDate: '2024-02-10', dueDate: '2024-03-11', invoiceAmount: 42600, paid: 0, balance: 42600, agingDays: 51, agingBucket: '31-60' as const },
  { id: 'oi-007', customer: 'Priya Computers', gstin: '27AAACP1234Q1ZA', invoiceNo: 'INV-2024-009', invoiceDate: '2024-01-12', dueDate: '2024-02-11', invoiceAmount: 18400, paid: 6000, balance: 13400, agingDays: 79, agingBucket: '61-90' as const },
  { id: 'oi-008', customer: 'Kumar Enterprises', gstin: '19AABCK1234P1ZX', invoiceNo: 'INV-2023-142', invoiceDate: '2023-12-01', dueDate: '2023-12-31', invoiceAmount: 67800, paid: 20000, balance: 47800, agingDays: 110, agingBucket: '90+' as const },
  { id: 'oi-009', customer: 'Bharat Infotech', gstin: '24AABCB5678Q1ZR', invoiceNo: 'INV-2023-128', invoiceDate: '2023-11-15', dueDate: '2023-12-15', invoiceAmount: 31200, paid: 0, balance: 31200, agingDays: 126, agingBucket: '90+' as const },
];

// ─── Day Book ─────────────────────────────────────────────────────────────────
export const mockDayBook = [
  { id: 'db-001', time: '09:22', voucherType: 'Purchase', voucherNo: 'PINV-2024-001', party: 'TechSupply Co.', narration: '10 items purchased', debit: 134319, credit: 0, group: 'Purchase' as const },
  { id: 'db-002', time: '10:45', voucherType: 'Sales', voucherNo: 'INV-2024-001', party: 'Ramesh Electronics', narration: '4 items sold', debit: 0, credit: 28440, group: 'Sales' as const },
  { id: 'db-003', time: '11:30', voucherType: 'Sales', voucherNo: 'INV-2024-002', party: 'Global IT Solutions', narration: '2 items sold — credit', debit: 0, credit: 15780, group: 'Sales' as const },
  { id: 'db-004', time: '12:10', voucherType: 'Stock Adjustment', voucherNo: 'ADJ-2024-001', party: '—', narration: 'Damage write-off: Mouse x3', debit: 2550, credit: 0, group: 'Adjustment' as const },
  { id: 'db-005', time: '14:05', voucherType: 'Sales', voucherNo: 'INV-2024-003', party: 'Priya Computers', narration: '3 items sold', debit: 0, credit: 12602, group: 'Sales' as const },
  { id: 'db-006', time: '15:20', voucherType: 'Purchase Return', voucherNo: 'PRTN-2024-001', party: 'NexGen Components', narration: '2 items returned', debit: 0, credit: 13680, group: 'Purchase Return' as const },
  { id: 'db-007', time: '16:00', voucherType: 'Stock Transfer', voucherNo: 'TRF-2024-001', party: 'North Branch → Main', narration: 'Transfer: SSD x10', debit: 0, credit: 0, group: 'Transfer' as const },
];

// ─── Party Ledger ─────────────────────────────────────────────────────────────
export const mockPartyLedger = [
  { id: 'pl-000', date: '2024-04-01', voucherType: 'Opening Balance', voucherNo: '—', debit: 0, credit: 0, balance: 28400, narration: 'Opening balance' },
  { id: 'pl-001', date: '2024-04-05', voucherType: 'Sales', voucherNo: 'INV-2024-021', debit: 28440, credit: 0, balance: 56840, narration: '4 items sold' },
  { id: 'pl-002', date: '2024-04-08', voucherType: 'Payment', voucherNo: 'PMT-2024-012', debit: 0, credit: 28440, balance: 28400, narration: 'Payment received — NEFT' },
  { id: 'pl-003', date: '2024-04-14', voucherType: 'Sales', voucherNo: 'INV-2024-032', debit: 38950, credit: 0, balance: 67350, narration: '5 items sold' },
  { id: 'pl-004', date: '2024-04-18', voucherType: 'Sales Return', voucherNo: 'SRTN-2024-003', debit: 0, credit: 8840, balance: 58510, narration: 'Return: Mouse x2, Keyboard x1' },
  { id: 'pl-005', date: '2024-04-25', voucherType: 'Payment', voucherNo: 'PMT-2024-023', debit: 0, credit: 20000, balance: 38510, narration: 'Partial payment — cheque' },
  { id: 'pl-006', date: '2024-05-02', voucherType: 'Sales', voucherNo: 'INV-2024-048', debit: 24200, credit: 0, balance: 62710, narration: '3 items sold' },
  { id: 'pl-007', date: '2024-05-10', voucherType: 'Payment', voucherNo: 'PMT-2024-031', debit: 0, credit: 38950, balance: 23760, narration: 'Full payment — NEFT' },
  { id: 'pl-008', date: '2024-05-18', voucherType: 'Sales', voucherNo: 'INV-2024-063', debit: 52180, credit: 0, balance: 75940, narration: '6 items sold' },
];

// ─── Customer Summary ─────────────────────────────────────────────────────────
export const mockCustomerSummary = [
  { id: 'pty-001', name: 'Ramesh Electronics', gstin: '27AADCR4849M1ZV', totalInvoices: 12, totalAmount: 342800, totalPaid: 280400, balanceDue: 62400 },
  { id: 'pty-003', name: 'Global IT Solutions', gstin: '07AABCG5678H1ZP', totalInvoices: 8, totalAmount: 284600, totalPaid: 182500, balanceDue: 102100 },
  { id: 'pty-004', name: 'Priya Computers', gstin: '27AAACP1234Q1ZA', totalInvoices: 9, totalAmount: 168300, totalPaid: 140100, balanceDue: 28200 },
  { id: 'pty-007', name: 'Kumar Enterprises', gstin: '19AABCK1234P1ZX', totalInvoices: 5, totalAmount: 128400, totalPaid: 80600, balanceDue: 47800 },
  { id: 'pty-008', name: 'Bharat Infotech', gstin: '24AABCB5678Q1ZR', totalInvoices: 4, totalAmount: 86200, totalPaid: 56000, balanceDue: 31200 },
];
