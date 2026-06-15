import { useMemo } from 'react';
import { MockCostElement, mockCostElements } from '@/mocks/costing';

interface VarianceDetailSlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  standardCostId: string;
  actualCostId: string;
  poNumber: string;
  productName: string;
  variantName: string | null;
}

interface ElementPair {
  description: string;
  std?: MockCostElement;
  act?: MockCostElement;
}

export default function VarianceDetailSlideOver({
  isOpen,
  onClose,
  standardCostId,
  actualCostId,
  poNumber,
  productName,
  variantName,
}: VarianceDetailSlideOverProps) {
  const stdElements = useMemo(
    () => mockCostElements.filter((e) => e.productionCostId === standardCostId),
    [standardCostId]
  );
  const actElements = useMemo(
    () => mockCostElements.filter((e) => e.productionCostId === actualCostId),
    [actualCostId]
  );

  const materialPairs = useMemo(() => {
    const stdMats = stdElements.filter((e) => e.type === 'MATERIAL');
    const actMats = actElements.filter((e) => e.type === 'MATERIAL');
    const pairs: ElementPair[] = [];
    const actMap = new Map<string, MockCostElement>();
    actMats.forEach((e) => actMap.set(e.description, e));

    stdMats.forEach((se) => {
      const ae = actMap.get(se.description);
      pairs.push({ description: se.description, std: se, act: ae });
      if (ae) actMap.delete(se.description);
    });
    actMap.forEach((ae) => pairs.push({ description: ae.description, act: ae }));
    return pairs;
  }, [stdElements, actElements]);

  const labourPairs = useMemo(() => {
    const stdLabs = stdElements.filter((e) => e.type === 'LABOUR');
    const actLabs = actElements.filter((e) => e.type === 'LABOUR');
    const pairs: ElementPair[] = [];
    const actMap = new Map<string, MockCostElement>();
    actLabs.forEach((e) => actMap.set(e.description, e));

    stdLabs.forEach((se) => {
      const ae = actMap.get(se.description);
      pairs.push({ description: se.description, std: se, act: ae });
      if (ae) actMap.delete(se.description);
    });
    actMap.forEach((ae) => pairs.push({ description: ae.description, act: ae }));
    return pairs;
  }, [stdElements, actElements]);

  const stdOverhead = useMemo(
    () => stdElements.filter((e) => e.type === 'OVERHEAD').reduce((s, e) => s + e.amount, 0),
    [stdElements]
  );
  const actOverhead = useMemo(
    () => actElements.filter((e) => e.type === 'OVERHEAD').reduce((s, e) => s + e.amount, 0),
    [actElements]
  );
  const stdRejection = useMemo(
    () => stdElements.filter((e) => e.type === 'REJECTION').reduce((s, e) => s + e.amount, 0),
    [stdElements]
  );
  const actRejection = useMemo(
    () => actElements.filter((e) => e.type === 'REJECTION').reduce((s, e) => s + e.amount, 0),
    [actElements]
  );

  const ohVar = stdOverhead - actOverhead;
  const rejVar = stdRejection - actRejection;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        role="presentation"
      />
      <div className="fixed inset-y-0 right-0 w-full md:w-[640px] bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Variance Detail</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {poNumber} — {productName}
              {variantName ? ` (${variantName})` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Material Variance Detail */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              Material Variance
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Item</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Std Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Act Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Qty Var</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Std Rate</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Act Rate</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Rate Var</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Amount Var</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {materialPairs.map((pair) => {
                    const stdQty = pair.std?.qty ?? 0;
                    const actQty = pair.act?.qty ?? 0;
                    const stdRate = pair.std?.rate ?? 0;
                    const actRate = pair.act?.rate ?? 0;
                    const stdAmount = pair.std?.amount ?? 0;
                    const actAmount = pair.act?.amount ?? 0;
                    const qtyVar = (stdQty - actQty) * stdRate;
                    const rateVar = (stdRate - actRate) * actQty;
                    const amountVar = stdAmount - actAmount;
                    return (
                      <tr key={pair.description} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900 font-medium">{pair.description}</td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {stdQty > 0 ? `${stdQty} ${pair.std?.unit ?? ''}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {actQty > 0 ? `${actQty} ${pair.act?.unit ?? ''}` : '—'}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${qtyVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {qtyVar !== 0 ? `₹${qtyVar.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {stdRate > 0 ? `₹${stdRate}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {actRate > 0 ? `₹${actRate}` : '—'}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${rateVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {rateVar !== 0 ? `₹${rateVar.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${amountVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {amountVar !== 0 ? `₹${amountVar.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Labour Variance Detail */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Labour Variance
            </h3>
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-500">Stage / Worker</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Std Time</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Act Time</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Time Var</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Std Rate</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Act Rate</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Rate Var</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-500">Amount Var</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {labourPairs.map((pair) => {
                    const stdTime = pair.std?.qty ?? 0;
                    const actTime = pair.act?.qty ?? 0;
                    const stdRate = pair.std?.rate ?? 0;
                    const actRate = pair.act?.rate ?? 0;
                    const stdAmount = pair.std?.amount ?? 0;
                    const actAmount = pair.act?.amount ?? 0;
                    const timeVar = (stdTime - actTime) * stdRate;
                    const rateVar = (stdRate - actRate) * actTime;
                    const amountVar = stdAmount - actAmount;
                    return (
                      <tr key={pair.description} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-900 font-medium">{pair.description}</td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {stdTime > 0 ? `${stdTime} ${pair.std?.unit ?? ''}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {actTime > 0 ? `${actTime} ${pair.act?.unit ?? ''}` : '—'}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${timeVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {timeVar !== 0 ? `₹${timeVar.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {stdRate > 0 ? `₹${stdRate}` : '—'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-600">
                          {actRate > 0 ? `₹${actRate}` : '—'}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${rateVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {rateVar !== 0 ? `₹${rateVar.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                        <td className={`px-3 py-2 text-right font-medium ${amountVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {amountVar !== 0 ? `₹${amountVar.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Overhead & Rejection Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Overhead Variance</h4>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Standard</span>
                <span className="text-gray-900 font-medium">₹{stdOverhead.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Actual</span>
                <span className="text-gray-900 font-medium">₹{actOverhead.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-700 font-medium">Variance</span>
                <span className={`font-semibold ${ohVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {ohVar >= 0 ? '↓' : '↑'} ₹{Math.abs(ohVar).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-xs font-medium text-gray-500 mb-2">Rejection Variance</h4>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Standard</span>
                <span className="text-gray-900 font-medium">₹{stdRejection.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-gray-600">Actual</span>
                <span className="text-gray-900 font-medium">₹{actRejection.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 mt-2">
                <span className="text-gray-700 font-medium">Variance</span>
                <span className={`font-semibold ${rejVar >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {rejVar >= 0 ? '↓' : '↑'} ₹{Math.abs(rejVar).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}