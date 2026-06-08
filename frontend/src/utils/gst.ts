export const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface GSTComponents {
  cgst: number;
  sgst: number;
  igst: number;
}

/**
 * Auto-determines CGST/SGST vs IGST based on state codes.
 * Same state → split equally (CGST + SGST). Different state → IGST only.
 */
export const calcGST = (
  taxRate: number,
  taxable: number,
  isSameState: boolean
): GSTComponents => {
  if (isSameState) {
    const half = round2((taxRate / 2 / 100) * taxable);
    return { cgst: half, sgst: half, igst: 0 };
  }
  return { cgst: 0, sgst: 0, igst: round2((taxRate / 100) * taxable) };
};

// export const isSameStateCheck = (partyStateCode: string, companyStateCode: string): boolean =>
//   !!partyStateCode && !!companyStateCode && partyStateCode === companyStateCode;

export function isSameStateCheck(
  supplierStateCode: string,
  companyStateCode: string
): boolean {
  if (!supplierStateCode || !companyStateCode) return true; // default: intra-state
  return supplierStateCode.trim() === companyStateCode.trim();
}

export const GST_RATES = [0, 5, 12, 18, 28] as const;
export type GSTRate = (typeof GST_RATES)[number];

export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra', '28': 'Andhra Pradesh',
  '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep', '32': 'Kerala',
  '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
  '37': 'Andhra Pradesh (new)',
};
