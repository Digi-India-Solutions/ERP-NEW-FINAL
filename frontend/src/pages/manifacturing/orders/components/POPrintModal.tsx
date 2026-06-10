import { useMemo } from 'react';
import {
  mockCompany,
  mockWorkOrders,
  mockBOMItems,
  type MockProductionOrder,
} from '@/mocks/masters';
import { formatDateIST } from '@/utils/format';

interface POPrintModalProps {
  po: MockProductionOrder;
  onClose: () => void;
}

const woStatusIcon: Record<string, string> = {
  PENDING: 'ri-time-line',
  IN_PROGRESS: 'ri-loader-4-line',
  COMPLETED: 'ri-check-line',
  ON_HOLD: 'ri-pause-circle-line',
};

export default function POPrintModal({ po, onClose }: POPrintModalProps) {
  const workOrders = useMemo(
    () => mockWorkOrders.filter((wo) => wo.productionOrderId === po.id),
    [po.id],
  );

  const materials = useMemo(
    () => mockBOMItems.filter((bi) => bi.bomId === po.bomId && bi.level > 0),
    [po.bomId],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto py-8"
      onClick={onClose}
    >
      <div
        className="bg-white shadow-2xl w-[800px] max-w-[95vw] mx-auto"
        style={{ minHeight: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Print Area */}
        <div id="po-print-area" className="p-8 print:p-6">
          {/* Header */}
          <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide uppercase">
              Production Order
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {mockCompany.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {mockCompany.address}
            </p>
          </div>

          {/* PO Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">PO Number:</span>
                <span className="font-semibold text-gray-900">
                  {po.poNumber}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Type:</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${
                    po.type === 'MTO'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }`}
                >
                  {po.type}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Priority:</span>
                <span className="font-medium text-gray-800">{po.priority}</span>
              </div>
              {po.salesOrderRef && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Sales Order:</span>
                  <span className="font-medium text-gray-800">
                    {po.salesOrderRef}
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Planned Start:</span>
                <span className="font-medium text-gray-800">
                  {formatDateIST(po.plannedStartDate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Planned End:</span>
                <span className="font-medium text-gray-800">
                  {formatDateIST(po.plannedEndDate)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">BOM Version:</span>
                <span className="font-medium text-gray-800">
                  {po.bomVersion}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Quantity:</span>
                <span className="font-medium text-gray-800">
                  {po.plannedQty} {po.unit}
                </span>
              </div>
            </div>
          </div>

          {/* Product */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6 bg-gray-50/50">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
              Product Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Product Name</p>
                <p className="text-sm font-medium text-gray-900">
                  {po.productName}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Product Code</p>
                <p className="text-sm font-medium text-gray-900">
                  {po.productCode}
                </p>
              </div>
              {po.variantName && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Variant</p>
                  <p className="text-sm font-medium text-gray-900">
                    {po.variantName}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Work Orders Table */}
          {workOrders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Work Orders
              </h3>
              <table className="w-full text-sm border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Stage
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Name
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Work Center
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Machine
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Planned Dates
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">
                      Time (min)
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((wo) => (
                    <tr key={wo.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 font-medium text-gray-800">
                        {wo.stageNumber}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {wo.stageName}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {wo.workCenterName}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {wo.machineName || (
                          <span className="text-gray-400 italic">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-xs">
                        {formatDateIST(wo.plannedStartDate)} &rarr;{' '}
                        {formatDateIST(wo.plannedEndDate)}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-right">
                        {wo.plannedTimeMinutes}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-xs">
                          <i
                            className={
                              woStatusIcon[wo.status] || 'ri-circle-line'
                            }
                          />
                          {wo.status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Material Requirements */}
          {materials.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Material Requirements
              </h3>
              <table className="w-full text-sm border border-gray-200">
                <thead>
                  <tr className="bg-gray-100 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Item
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Code
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">
                      Qty/Unit
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-gray-600">
                      Total Required
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-gray-800">{m.itemName}</td>
                      <td className="px-3 py-2 text-gray-600 text-xs">
                        {m.itemCode}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-right">
                        {m.qtyPerUnit}
                      </td>
                      <td className="px-3 py-2 text-gray-700 text-right font-medium">
                        {(m.qtyPerUnit * po.plannedQty).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {po.notes && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Notes
              </h3>
              <div className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 text-sm text-gray-700 min-h-[60px]">
                {po.notes}
              </div>
            </div>
          )}

          {/* Footer / Signatures */}
          <div className="border-t-2 border-gray-800 pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-6">
                  Prepared By
                </p>
                <div className="border-b border-gray-400 h-8" />
                <p className="text-xs text-gray-500 mt-1">Signature & Date</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-6">
                  Approved By
                </p>
                <div className="border-b border-gray-400 h-8" />
                <p className="text-xs text-gray-500 mt-1">Signature & Date</p>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-[10px] text-gray-400 text-center">
                Printed on{' '}
                {new Date().toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}{' '}
                &middot; {mockCompany.name}
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons — hidden on print */}
        <div className="px-8 pb-6 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap"
          >
            Close
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer whitespace-nowrap flex items-center gap-2"
          >
            <i className="ri-printer-line" />
            Print
          </button>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #po-print-area, #po-print-area * { visibility: visible; }
          #po-print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
