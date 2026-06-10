export function calcAQLSampleSize(totalQty: number): number {
  if (totalQty >= 2 && totalQty <= 8) return 2;
  if (totalQty >= 9 && totalQty <= 15) return 3;
  if (totalQty >= 16 && totalQty <= 25) return 5;
  if (totalQty >= 26 && totalQty <= 50) return 8;
  if (totalQty >= 51 && totalQty <= 90) return 13;
  if (totalQty >= 91 && totalQty <= 150) return 20;
  if (totalQty > 150) return 32;
  return totalQty;
}

export function calcSampleQty(plan: string, total: number): number {
  switch (plan) {
    case 'ALL':
      return total;
    case 'RANDOM_10':
      return Math.ceil(total * 0.1);
    case 'RANDOM_20':
      return Math.ceil(total * 0.2);
    case 'AQL':
      return calcAQLSampleSize(total);
    default:
      return total;
  }
}

export interface MockGRN {
  id: string;
  grnNumber: string;
  supplierId: string;
  supplierName: string;
  date: string;
  warehouseId: string;
  items: {
    itemId: string;
    itemName: string;
    itemCode: string;
    qty: number;
    unit: string;
    batchNumber: string | null;
    lotNumber: string | null;
  }[];
}

export const mockGRNs: MockGRN[] = [
  {
    id: 'grn-011',
    grnNumber: 'GRN-2024-0011',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    date: '2024-04-05',
    warehouseId: 'wh-001',
    items: [
      {
        itemId: 'itm-016',
        itemName: 'Steel Rod 10mm',
        itemCode: 'ITM-0301',
        qty: 200,
        unit: 'Kg',
        batchNumber: 'B-ST-2024-A',
        lotNumber: 'LOT-ST-2404',
      },
    ],
  },
  {
    id: 'grn-002',
    grnNumber: 'GRN-2024-0002',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    date: '2024-03-10',
    warehouseId: 'wh-001',
    items: [
      {
        itemId: 'itm-009',
        itemName: 'SSD 1TB NVMe Samsung',
        itemCode: 'ITM-0200',
        qty: 10,
        unit: 'Pcs',
        batchNumber: null,
        lotNumber: null,
      },
    ],
  },
];

export interface MockInspection {
  id: string;
  inspectionNumber: string;
  type: 'INCOMING' | 'IN_PROCESS' | 'FINAL';
  status: 'PASSED' | 'FAILED' | 'PENDING' | 'IN_PROGRESS';
  triggeredBy: 'AUTO' | 'MANUAL';
  sourceType: 'GRN' | 'PRODUCTION_ORDER' | 'SALES_ORDER';
  sourceId: string;
  sourceNumber: string;
  supplierId?: string | null;
  supplierName?: string | null;
  itemId: string;
  itemName: string;
  itemCode: string | null;
  isVariant: boolean;
  variantName: string | null;
  checklistId: string;
  checklistName: string;
  samplingPlan: 'ALL' | 'RANDOM_10' | 'RANDOM_20' | 'AQL';
  batchNumber: string | null;
  lotNumber: string | null;
  totalQty: number;
  sampleQty: number;
  passedQty: number;
  failedQty: number;
  unit: string;
  inspectorId: string | null;
  inspectorName: string | null;
  scheduledDate: string;
  completedDate: string | null;
  warehouseId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface MockInspectionResult {
  id: string;
  inspectionId: string;
  parameterId: string;
  parameterName: string;
  parameterType: 'PASS_FAIL' | 'NUMERIC' | 'TEXT';
  unit: string | null;
  minValue: number | null;
  maxValue: number | null;
  observedValue: string;
  status: 'PASS' | 'FAIL' | 'NA';
  notes: string | null;
}

export interface MockNCR {
  id: string;
  ncrNumber: string;
  inspectionId: string;
  inspectionNumber: string;
  type: 'INCOMING' | 'IN_PROCESS' | 'FINAL';
  severity: 'MINOR' | 'MAJOR' | 'CRITICAL';
  status: 'OPEN' | 'UNDER_REVIEW' | 'CAPA_RAISED' | 'CAPA_VERIFIED' | 'CLOSED';
  itemId: string;
  itemName: string;
  variantName: string | null;
  sourceNumber: string;
  failedParameters: string[];
  defectDescription: string;
  defectQty: number;
  unit: string;
  dispositionAction:
    | 'REJECT'
    | 'REWORK'
    | 'USE_AS_IS'
    | 'RETURN_TO_SUPPLIER'
    | 'PENDING';
  assignedTo: string | null;
  assignedToName: string | null;
  dueDate: string | null;
  closedDate: string | null;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface MockCAPA {
  id: string;
  capaNumber: string;
  ncrId: string;
  ncrNumber: string;
  type: 'CORRECTIVE' | 'PREVENTIVE';
  rootCause: string;
  rootCauseCategory:
    | 'MATERIAL'
    | 'MACHINE'
    | 'METHOD'
    | 'MANPOWER'
    | 'MEASUREMENT'
    | 'ENVIRONMENT';
  correctiveAction: string;
  preventiveAction: string;
  targetDate: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';
  assignedTo: string;
  assignedToName: string;
  verifiedBy: string | null;
  verifiedDate: string | null;
  effectiveness: 'EFFECTIVE' | 'PARTIALLY_EFFECTIVE' | 'NOT_EFFECTIVE' | null;
  notes: string | null;
  createdAt: string;
}

export const mockInspections: MockInspection[] = [
  {
    id: 'insp-001',
    inspectionNumber: 'INSP-2024-001',
    type: 'INCOMING',
    status: 'PASSED',
    triggeredBy: 'AUTO',
    sourceType: 'GRN',
    sourceId: 'grn-001',
    sourceNumber: 'GRN-2024-0001',
    supplierId: 'pty-002',
    supplierName: 'TechSupply Co.',
    itemId: 'itm-016',
    itemName: 'Steel Rod 10mm',
    itemCode: 'ITM-0301',
    isVariant: false,
    variantName: null,
    checklistId: 'cl-001',
    checklistName: 'Raw Material Incoming Check',
    samplingPlan: 'RANDOM_10',
    batchNumber: 'B-ST-2024-A',
    lotNumber: 'LOT-ST-2404',
    totalQty: 200,
    sampleQty: 20,
    passedQty: 20,
    failedQty: 0,
    unit: 'Kg',
    inspectorId: 'op-004',
    inspectorName: 'Vijay Kumar',
    scheduledDate: '2024-04-05',
    completedDate: '2024-04-05',
    warehouseId: 'wh-001',
    notes: null,
    createdAt: '2024-04-05T09:00:00Z',
  },
  {
    id: 'insp-002',
    inspectionNumber: 'INSP-2024-002',
    type: 'INCOMING',
    status: 'FAILED',
    triggeredBy: 'AUTO',
    sourceType: 'GRN',
    sourceId: 'grn-002',
    sourceNumber: 'GRN-2024-0002',
    supplierId: 'pty-005',
    supplierName: 'NexGen Components',
    itemId: 'itm-009',
    itemName: 'SSD 1TB NVMe',
    itemCode: 'ITM-0200',
    isVariant: false,
    variantName: null,
    checklistId: 'cl-001',
    checklistName: 'Raw Material Incoming Check',
    samplingPlan: 'RANDOM_10',
    batchNumber: null,
    lotNumber: null,
    totalQty: 10,
    sampleQty: 1,
    passedQty: 0,
    failedQty: 1,
    unit: 'Pcs',
    inspectorId: 'op-004',
    inspectorName: 'Vijay Kumar',
    scheduledDate: '2024-03-10',
    completedDate: '2024-03-10',
    warehouseId: 'wh-001',
    notes: 'Surface scratches found on sample unit',
    createdAt: '2024-03-10T10:00:00Z',
  },
  {
    id: 'insp-003',
    inspectionNumber: 'INSP-2024-003',
    type: 'IN_PROCESS',
    status: 'PASSED',
    triggeredBy: 'AUTO',
    sourceType: 'PRODUCTION_ORDER',
    sourceId: 'prod-001',
    sourceNumber: 'PRD-2024-001',
    supplierId: null,
    supplierName: null,
    itemId: 'itm-v001',
    itemName: 'Industrial Pump X-100',
    itemCode: 'ITM-0303-100',
    isVariant: true,
    variantName: 'Pump X-100 (100 LPM)',
    checklistId: 'cl-002',
    checklistName: 'Steel Rod Quality Check',
    samplingPlan: 'ALL',
    batchNumber: null,
    lotNumber: null,
    totalQty: 5,
    sampleQty: 5,
    passedQty: 5,
    failedQty: 0,
    unit: 'Pcs',
    inspectorId: 'op-004',
    inspectorName: 'Vijay Kumar',
    scheduledDate: '2024-04-18',
    completedDate: '2024-04-18',
    warehouseId: null,
    notes: null,
    createdAt: '2024-04-18T14:00:00Z',
  },
  {
    id: 'insp-004',
    inspectionNumber: 'INSP-2024-004',
    type: 'FINAL',
    status: 'PENDING',
    triggeredBy: 'MANUAL',
    sourceType: 'PRODUCTION_ORDER',
    sourceId: 'prod-001',
    sourceNumber: 'PRD-2024-001',
    supplierId: null,
    supplierName: null,
    itemId: 'itm-v001',
    itemName: 'Industrial Pump X-100',
    itemCode: 'ITM-0303-100',
    isVariant: true,
    variantName: 'Pump X-100 (100 LPM)',
    checklistId: 'cl-003',
    checklistName: 'Finished Good Final Inspection',
    samplingPlan: 'RANDOM_20',
    batchNumber: null,
    lotNumber: null,
    totalQty: 5,
    sampleQty: 1,
    passedQty: 0,
    failedQty: 0,
    unit: 'Pcs',
    inspectorId: null,
    inspectorName: null,
    scheduledDate: '2024-04-25',
    completedDate: null,
    warehouseId: null,
    notes: null,
    createdAt: '2024-04-20T08:00:00Z',
  },
];

export const mockInspectionResults: MockInspectionResult[] = [
  {
    id: 'ir-001',
    inspectionId: 'insp-001',
    parameterId: 'qp-001',
    parameterName: 'Visual Inspection',
    parameterType: 'PASS_FAIL',
    unit: null,
    minValue: null,
    maxValue: null,
    observedValue: 'PASS',
    status: 'PASS',
    notes: null,
  },
  {
    id: 'ir-002',
    inspectionId: 'insp-001',
    parameterId: 'qp-003',
    parameterName: 'Weight Check',
    parameterType: 'NUMERIC',
    unit: 'kg',
    minValue: null,
    maxValue: null,
    observedValue: '85.2',
    status: 'PASS',
    notes: null,
  },
  {
    id: 'ir-003',
    inspectionId: 'insp-001',
    parameterId: 'qp-007',
    parameterName: 'Batch Label Check',
    parameterType: 'PASS_FAIL',
    unit: null,
    minValue: null,
    maxValue: null,
    observedValue: 'PASS',
    status: 'PASS',
    notes: null,
  },
];

export let mockNCRs: MockNCR[] = [
  {
    id: 'ncr-001',
    ncrNumber: 'NCR-2024-001',
    inspectionId: 'insp-002',
    inspectionNumber: 'QC-INC-002',
    type: 'INCOMING',
    severity: 'MAJOR',
    status: 'OPEN',
    itemId: 'itm-009',
    itemName: 'SSD 1TB NVMe',
    variantName: null,
    sourceNumber: 'GRN-2024-0002',
    failedParameters: ['Visual Inspection'],
    defectDescription: 'Surface scratches on drive casing',
    defectQty: 1,
    unit: 'Pcs',
    dispositionAction: 'RETURN_TO_SUPPLIER',
    assignedTo: 'op-004',
    assignedToName: 'Vijay Kumar',
    dueDate: '2024-03-17',
    closedDate: null,
    reviewedBy: null,
    reviewedAt: null,
    createdBy: 'Admin User',
    createdAt: '2024-03-10T14:00:00Z',
  },
];

export let mockCAPAs: MockCAPA[] = [
  {
    id: 'capa-001',
    capaNumber: 'CAPA-2024-001',
    ncrId: 'ncr-001',
    ncrNumber: 'NCR-2024-001',
    type: 'CORRECTIVE',
    rootCause: 'Supplier packaging insufficient',
    rootCauseCategory: 'MATERIAL',
    correctiveAction: 'Return defective units to supplier',
    preventiveAction: 'Add visual inspection to incoming checklist',
    targetDate: '2024-03-25',
    status: 'IN_PROGRESS',
    assignedTo: 'op-004',
    assignedToName: 'Vijay Kumar',
    verifiedBy: null,
    verifiedDate: null,
    effectiveness: null,
    notes: null,
    createdAt: '2024-03-11T09:00:00Z',
  },
];
