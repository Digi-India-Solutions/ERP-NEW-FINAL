import { useEffect } from 'react';
import type { TransferDetailDTO } from '@/api/types';

export const TRANSFER_STATUS_STYLES: Record<TransferDetailDTO['status'], string> = {
	PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
	APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
	COMPLETED: 'bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]',
	REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

interface TransferDetailModalProps {
	open: boolean;
	loading: boolean;
	transfer: TransferDetailDTO | null;
	onClose: () => void;
}

export default function TransferDetailModal({ open, loading, transfer, onClose }: TransferDetailModalProps) {
	useEffect(() => {
		if (!open) return;

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') onClose();
		};

		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
			<button
				type="button"
				aria-label="Close transfer details"
				className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
				onClick={onClose}
			/>

			<div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl border border-[#e2e8f0] bg-white shadow-2xl">
				<div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] px-5 py-4">
					<div>
						<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stock Transfer Details</p>
						<h2 className="mt-1 text-lg font-bold text-[#1e293b]">{transfer?.transferNumber || 'Transfer'}</h2>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
						aria-label="Close"
					>
						<i className="ri-close-line text-lg" />
					</button>
				</div>

				<div className="max-h-[80vh] overflow-y-auto p-5">
					{loading ? (
						<div className="flex items-center gap-2 py-10 text-sm text-slate-500">
							<i className="ri-loader-4-line animate-spin" /> Loading transfer details...
						</div>
					) : transfer ? (
						<>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
								<InfoCard label="Date" value={new Date(transfer.transferDate).toLocaleDateString()} />
								<InfoCard label="From" value={transfer.fromWarehouse || 'Unknown'} />
								<InfoCard label="To" value={transfer.toWarehouse || 'Unknown'} />
								<InfoCard label="Created By" value={transfer.createdByName || 'Unknown User'} />
							</div>

							<div className="mt-4 flex flex-wrap items-center gap-2">
								<span className={`text-xs px-2 py-1 rounded-full border font-medium ${TRANSFER_STATUS_STYLES[transfer.status]}`}>
									{transfer.status}
								</span>
								<span className="text-xs text-slate-400">{transfer.items.length} item(s)</span>
							</div>

							<div className="mt-5 overflow-hidden rounded-xl border border-[#e2e8f0]">
								<table className="w-full text-sm">
									<thead className="bg-slate-50">
										<tr>
											<th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Item</th>
											<th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Code</th>
											<th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Qty</th>
										</tr>
									</thead>
									<tbody>
										{transfer.items.length > 0 ? transfer.items.map((item) => (
											<tr key={item.id} className="border-t border-slate-100">
												<td className="px-4 py-3 font-medium text-slate-700">{item.itemName || 'Unknown Item'}</td>
												<td className="px-4 py-3 text-slate-500">{item.itemCode || '—'}</td>
												<td className="px-4 py-3 text-right font-medium text-slate-700">{item.quantity}</td>
											</tr>
										)) : (
											<tr>
												<td colSpan={3} className="px-4 py-6 text-center text-slate-500">No transfer items found.</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>

							{transfer.notes && (
								<div className="mt-4 rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
									<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Notes</p>
									<p className="mt-1 text-sm text-slate-600">{transfer.notes}</p>
								</div>
							)}
						</>
					) : (
						<div className="py-10 text-sm text-slate-500">Unable to load selected transfer details.</div>
					)}
				</div>
			</div>
		</div>
	);
}

function InfoCard({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4">
			<p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
			<p className="mt-1 text-sm font-semibold text-slate-700">{value}</p>
		</div>
	);
}
