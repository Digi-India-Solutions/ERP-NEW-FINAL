import { formatINR } from '@/utils/format';

type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ItemDetailData {
  id: string;
  name: string;
  code?: string;
  barcode?: string;
  categoryName?: string;
  unitName?: string;
  brand?: string;
  articleNo?: string;
  hsnCode?: string;
  taxRate?: number;
  purchaseRate: number;
  saleRate: number;
  mrp?: number;
  stock: number;
  minStockLevel?: number;
  isActive: boolean;
  sizeColor?: string;
  // ✅ Manufacturing
  itemType?: string;
  itemGroup?: string;
  drawingNumber?: string;
  specifications?: string;
  productionUnit?: string;
  standardCost?: number;
  supplierLeadTime?: number;
  reorderPoint?: number;
  reorderQty?: number;
  // ✅ Tracking
  enableVariants?: boolean;
  enableBatchTracking?: boolean;
  enableSerialTracking?: boolean;
  requiresIncomingQC?: boolean;
  requiresFinalQC?: boolean;
}
interface ItemDetailProps {
  item: ItemDetailData | null;
  onClose: () => void;
}

function getStockStatus(item: ItemDetailData): StockStatus {
  const stock = Number(item.stock ?? 0);
  const minStockLevel = Number(item.minStockLevel ?? 0);
  if (stock === 0) return 'OUT_OF_STOCK';
  if (stock < minStockLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}

function stockBadge(item: ItemDetailData) {
  const status = getStockStatus(item);
  if (status === 'IN_STOCK')
    return { cls: 'bg-green-100 text-green-700', label: 'In Stock' };
  if (status === 'LOW_STOCK')
    return { cls: 'bg-amber-100 text-amber-700', label: 'Low Stock' };
  return { cls: 'bg-red-100 text-red-600', label: 'Out of Stock' };
}

function InfoBlock({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1.5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[11px] font-medium text-[#0f172a] truncate ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </p>
    </div>
  );
}

function MetricBlock({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded border px-2 py-1.5 ${accent ? 'border-indigo-200 bg-indigo-50' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">
        {label}
      </p>
      <p
        className={`mt-0.5 text-[11px] font-bold truncate ${accent ? 'text-[#4f46e5]' : 'text-[#0f172a]'}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function ItemDetail({ item, onClose }: ItemDetailProps) {
  if (!item) return null;

  const badge = stockBadge(item);

  return (
    <div className="fixed top-[140px] right-6 z-20 w-[410px] rounded-2xl border border-[#dbe4f0] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 bg-[#f8fafc] border-b border-[#e2e8f0]">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-[#64748b]">
            Item Info
          </p>
          <h3 className="mt-0.5 text-sm font-bold text-[#0f172a] truncate">
            {item.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className={`text-[12px] font-semibold px-2 py-0.5 rounded-full ${badge.cls}`}
          >
            {badge.label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-[#64748b] transition-colors cursor-pointer"
            aria-label="Close item information"
          >
            <i className="ri-close-line text-sm" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-3 py-3 space-y-2.5">
        {/* Image */}
        {/* <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2 flex items-center justify-center min-h-[80px]"> 
					{item.imageUrl ? (  */}
        {/* <img
				//			src={item.imageUrl}
				//			alt={item.name}
				//			className="max-w-full max-h-32 object-contain rounded"
				//		/>
				//	) : (
				//		<div className="text-center text-slate-400">
				//			<i className="ri-image-line text-2xl mb-1 block" />
				//			<p className="text-[12px] font-medium">No image</p>
				//		</div>
				//	)}
				//</div>
					 */}

        {/* Identification */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-1.5 px-0.5">
            Identification
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <InfoBlock label="Code" value={item.code || '—'} mono />
            <InfoBlock label="Barcode" value={item.barcode || '—'} mono />
            <InfoBlock label="Category" value={item.categoryName || '—'} />
            <InfoBlock label="Brand" value={item.brand || '—'} />
            <InfoBlock label="Article No" value={item.articleNo || '—'} mono />
            <InfoBlock label="Unit" value={item.unitName || '—'} />
          </div>
        </div>

        {/* Tax & Regulatory */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-1.5 px-0.5">
            Tax & Regulatory
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <InfoBlock label="HSN Code" value={item.hsnCode || '—'} mono />
            <InfoBlock label="GST Rate" value={`${item.taxRate ?? 0}%`} />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-1.5 px-0.5">
            Pricing
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            <MetricBlock
              label="Purchase"
              value={formatINR(item.purchaseRate)}
            />
            <MetricBlock
              label="Sale Price"
              value={formatINR(item.saleRate)}
              accent
            />
            <MetricBlock label="MRP" value={formatINR(item.mrp ?? 0)} />
          </div>
        </div>

        {/* Inventory */}
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-1.5 px-0.5">
            Inventory
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <MetricBlock label="In Stock" value={`${item.stock}`} accent />
            <MetricBlock
              label="Min Level"
              value={`${item.minStockLevel ?? 0}`}
            />
          </div>
        </div>

        {/* Manufacturing */}
        {(item.itemType ||
          item.itemGroup ||
          item.drawingNumber ||
          item.standardCost) && (
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-1.5 px-0.5">
              Manufacturing
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {item.itemType && (
                <InfoBlock label="Item Type" value={item.itemType} />
              )}
              {item.itemGroup && (
                <InfoBlock label="Item Group" value={item.itemGroup} />
              )}
              {item.drawingNumber && (
                <InfoBlock label="Drawing No" value={item.drawingNumber} mono />
              )}
              {item.productionUnit && (
                <InfoBlock
                  label="Production Unit"
                  value={item.productionUnit}
                />
              )}
              {(item.standardCost ?? 0) > 0 && (
                <MetricBlock
                  label="Standard Cost"
                  value={formatINR(item.standardCost ?? 0)}
                />
              )}
              {(item.supplierLeadTime ?? 0) > 0 && (
                <InfoBlock
                  label="Lead Time (days)"
                  value={`${item.supplierLeadTime}`}
                />
              )}
              {(item.reorderPoint ?? 0) > 0 && (
                <InfoBlock
                  label="Reorder Point"
                  value={`${item.reorderPoint}`}
                />
              )}
              {(item.reorderQty ?? 0) > 0 && (
                <InfoBlock label="Reorder Qty" value={`${item.reorderQty}`} />
              )}
            </div>
            {item.specifications && (
              <div className="mt-1.5 rounded border border-[#e2e8f0] bg-[#f8fafc] px-2 py-1.5">
                <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[#94a3b8]">
                  Specifications
                </p>
                <p className="mt-0.5 text-[11px] text-[#0f172a] whitespace-pre-wrap">
                  {item.specifications}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tracking */}
        {(item.enableBatchTracking ||
          item.enableSerialTracking ||
          item.requiresIncomingQC ||
          item.requiresFinalQC ||
          item.enableVariants) && (
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#64748b] mb-1.5 px-0.5">
              Tracking & QC
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.enableVariants && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                  <i className="ri-git-branch-line mr-1" />
                  Variants
                </span>
              )}
              {item.enableBatchTracking && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                  <i className="ri-stack-line mr-1" />
                  Batch Tracking
                </span>
              )}
              {item.enableSerialTracking && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                  <i className="ri-barcode-line mr-1" />
                  Serial Tracking
                </span>
              )}
              {item.requiresIncomingQC && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">
                  <i className="ri-shield-check-line mr-1" />
                  Incoming QC
                </span>
              )}
              {item.requiresFinalQC && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-600">
                  <i className="ri-shield-star-line mr-1" />
                  Final QC
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
