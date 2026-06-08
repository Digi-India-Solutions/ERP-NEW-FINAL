// ─── Gate Pass Types ──────────────────────────────────────────────────────────

export type GatePassType = 'OUTWARD' | 'INWARD';

export type GatePassStatus =
  // OUTWARD statuses
  | 'OPEN' | 'CLOSED' | 'RETURNED' | 'OVERDUE'
  // INWARD statuses
  | 'PENDING' | 'RECEIVED' | 'LINKED';

export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type GatePassPurpose =
  | 'SALE' | 'TRANSFER' | 'RETURN' | 'SAMPLE' | 'OTHER'
  | 'PURCHASE' | 'SALE_RETURN' | 'TRANSFER_IN';

export type LinkedDocType =
  | 'SALES_INVOICE' | 'CHALLAN' | 'TRANSFER' | 'PURCHASE_RETURN'
  | 'GRN' | 'SALE_RETURN' | 'NONE';

export interface GatePassItem {
  itemName: string;
  qty: number;
  unit: string;
  description?: string;
}

export interface MockGatePass {
  id: string;
  gpNumber: string;
  type: GatePassType;
  date: string;
  time: string;
  partyName: string;
  vehicleNumber: string;
  driverName?: string;
  driverPhone?: string;
  securityGuard: string;
  purpose: GatePassPurpose;
  customPurpose?: string;
  isReturnable: boolean;
  expectedReturnDate?: string;
  returnedDate?: string;
  status: GatePassStatus;
  linkedDocType?: LinkedDocType;
  linkedDocNumber?: string;
  authorisedBy: string;
  receivedBy?: string;
  notes?: string;
  items: GatePassItem[];
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  vehicleEntryTime?: string;
  vehicleExitTime?: string;
  guardRemarks?: string;
  rejectionReason?: string;
  isRecreated: boolean;
  originalGPId?: string;
  createdById: string;
  createdByName: string;
  createdBy: string;
  createdAt: string;
}

// ─── Mock Gate Passes ─────────────────────────────────────────────────────────

export const mockGatePasses: MockGatePass[] = [
  {
    id: 'gp-001',
    gpNumber: 'GP-OUT-2026-0001',
    type: 'OUTWARD',
    date: '2026-04-08',
    time: '10:30',
    partyName: 'Ramesh Electronics',
    vehicleNumber: 'MH-12-AB-1234',
    driverName: 'Raju Sharma',
    driverPhone: '9812345670',
    securityGuard: 'Suresh Patil',
    purpose: 'SALE',
    isReturnable: false,
    status: 'CLOSED',
    linkedDocType: 'SALES_INVOICE',
    linkedDocNumber: 'INV-2026-0012',
    authorisedBy: 'Admin User',
    notes: 'Fragile items — handle with care',
    items: [
      { itemName: 'Laptop 15" Core i7', qty: 2, unit: 'Pcs' },
      { itemName: 'Wireless Mouse', qty: 5, unit: 'Pcs' },
    ],
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Suresh Patil',
    verifiedAt: '2026-04-08T10:45:00Z',
    vehicleExitTime: '10:45',
    isRecreated: false,
    createdById: 'usr-001',
    createdByName: 'Admin User',
    createdBy: 'Admin User',
    createdAt: '2026-04-08T10:30:00Z',
  },
  {
    id: 'gp-002',
    gpNumber: 'GP-OUT-2026-0002',
    type: 'OUTWARD',
    date: '2026-04-09',
    time: '14:00',
    partyName: 'TechSupply Co.',
    vehicleNumber: 'MH-14-CD-5678',
    driverName: 'Mohan Das',
    securityGuard: 'Suresh Patil',
    purpose: 'RETURN',
    isReturnable: true,
    expectedReturnDate: '2026-04-15',
    status: 'OPEN',
    authorisedBy: 'Admin User',
    items: [
      { itemName: 'USB-C Hub', qty: 3, unit: 'Pcs', description: 'Defective — return to supplier' },
    ],
    verificationStatus: 'PENDING',
    isRecreated: false,
    createdById: 'usr-001',
    createdByName: 'Admin User',
    createdBy: 'Admin User',
    createdAt: '2026-04-09T14:00:00Z',
  },
  {
    id: 'gp-003',
    gpNumber: 'GP-OUT-2026-0003',
    type: 'OUTWARD',
    date: '2026-04-01',
    time: '09:00',
    partyName: 'Global IT Solutions',
    vehicleNumber: 'DL-01-EF-9012',
    securityGuard: 'Suresh Patil',
    purpose: 'SALE',
    isReturnable: true,
    expectedReturnDate: '2026-04-07',
    status: 'OVERDUE',
    linkedDocType: 'SALES_INVOICE',
    linkedDocNumber: 'INV-2026-0008',
    authorisedBy: 'Admin User',
    items: [
      { itemName: 'Monitor 24"', qty: 1, unit: 'Pcs' },
    ],
    verificationStatus: 'REJECTED',
    verifiedBy: 'Suresh Patil',
    verifiedAt: '2026-04-01T09:30:00Z',
    rejectionReason: 'Vehicle number mismatch — MH-14 vs DL-01',
    isRecreated: false,
    createdById: 'usr-001',
    createdByName: 'Admin User',
    createdBy: 'Admin User',
    createdAt: '2026-04-01T09:00:00Z',
  },
  {
    id: 'gp-004',
    gpNumber: 'GP-IN-2026-0001',
    type: 'INWARD',
    date: '2026-04-09',
    time: '11:15',
    partyName: 'NexGen Components',
    vehicleNumber: 'TN-09-GH-3456',
    driverName: 'Priya Kumar',
    securityGuard: 'Suresh Patil',
    purpose: 'PURCHASE',
    isReturnable: false,
    status: 'LINKED',
    linkedDocType: 'GRN',
    linkedDocNumber: 'GRN-2026-0005',
    authorisedBy: 'Admin User',
    receivedBy: 'Warehouse Manager',
    items: [
      { itemName: 'Mechanical Keyboard RGB', qty: 10, unit: 'Pcs' },
      { itemName: 'HDMI Cable 2m', qty: 20, unit: 'Pcs' },
    ],
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Suresh Patil',
    verifiedAt: '2026-04-09T11:30:00Z',
    vehicleEntryTime: '11:15',
    isRecreated: false,
    createdById: 'usr-001',
    createdByName: 'Admin User',
    createdBy: 'Admin User',
    createdAt: '2026-04-09T11:15:00Z',
  },
  {
    id: 'gp-005',
    gpNumber: 'GP-IN-2026-0002',
    type: 'INWARD',
    date: '2026-04-10',
    time: '08:30',
    partyName: 'Apex Hardware',
    vehicleNumber: 'HR-26-IJ-7890',
    securityGuard: 'Suresh Patil',
    purpose: 'SALE_RETURN',
    isReturnable: false,
    status: 'PENDING',
    authorisedBy: 'Admin User',
    items: [
      { itemName: 'Laptop Bag 15.6"', qty: 2, unit: 'Pcs', description: 'Customer return — damaged zip' },
    ],
    verificationStatus: 'PENDING',
    isRecreated: false,
    createdById: 'usr-001',
    createdByName: 'Admin User',
    createdBy: 'Admin User',
    createdAt: '2026-04-10T08:30:00Z',
  },
  {
    id: 'gp-006',
    gpNumber: 'GP-OUT-2026-0004',
    type: 'OUTWARD',
    date: '2026-04-10',
    time: '16:00',
    partyName: 'Priya Computers',
    vehicleNumber: 'MH-04-KL-2345',
    securityGuard: 'Suresh Patil',
    purpose: 'SALE',
    isReturnable: false,
    status: 'OPEN',
    linkedDocType: 'CHALLAN',
    linkedDocNumber: 'CH-2026-0003',
    authorisedBy: 'Admin User',
    items: [
      { itemName: 'USB-C Hub 7-in-1', qty: 5, unit: 'Pcs' },
    ],
    verificationStatus: 'PENDING',
    isRecreated: false,
    createdById: 'usr-001',
    createdByName: 'Admin User',
    createdBy: 'Admin User',
    createdAt: '2026-04-10T16:00:00Z',
  },
  {
    id: 'gp-007',
    gpNumber: 'GP-OUT-2026-0005',
    type: 'OUTWARD',
    date: '2026-04-10',
    time: '09:00',
    partyName: 'South Depot Transfer',
    vehicleNumber: 'MH-12-MN-6789',
    securityGuard: 'Suresh Patil',
    purpose: 'TRANSFER',
    isReturnable: false,
    status: 'CLOSED',
    linkedDocType: 'TRANSFER',
    linkedDocNumber: 'TRF-2026-0002',
    authorisedBy: 'Admin User',
    items: [
      { itemName: 'Monitor 24" Full HD', qty: 4, unit: 'Pcs' },
      { itemName: 'Keyboard', qty: 4, unit: 'Pcs' },
    ],
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Suresh Patil',
    verifiedAt: '2026-04-10T09:20:00Z',
    vehicleExitTime: '09:20',
    isRecreated: true,
    originalGPId: 'gp-003',
    createdById: 'usr-001',
    createdByName: 'Admin User',
    createdBy: 'Admin User',
    createdAt: '2026-04-10T09:00:00Z',
  },
  {
    id: 'gp-008',
    gpNumber: 'GP-IN-2026-0003',
    type: 'INWARD',
    date: '2026-04-10',
    time: '12:00',
    partyName: 'South Depot Transfer',
    vehicleNumber: 'MH-12-MN-6789',
    securityGuard: 'Suresh Patil',
    purpose: 'TRANSFER_IN',
    isReturnable: false,
    status: 'RECEIVED',
    linkedDocType: 'TRANSFER',
    linkedDocNumber: 'TRF-2026-0002',
    authorisedBy: 'Admin User',
    receivedBy: 'Depot Manager',
    items: [
      { itemName: 'Monitor 24" Full HD', qty: 4, unit: 'Pcs' },
      { itemName: 'Keyboard', qty: 4, unit: 'Pcs' },
    ],
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Suresh Patil',
    verifiedAt: '2026-04-10T12:20:00Z',
    vehicleEntryTime: '12:00',
    isRecreated: false,
    createdById: 'usr-001',
    createdByName: 'Admin User',
    createdBy: 'Admin User',
    createdAt: '2026-04-10T12:00:00Z',
  },
];