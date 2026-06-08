import AppLayout from '@/components/feature/AppLayout';

export default function Inventory() {
  const items = [
    { code: 'ITM-0001', name: 'Laptop 15"', category: 'Electronics', unit: 'Pcs', stock: 38, reorder: 10, purchase: 72000, sale: 86000, status: 'In Stock' },
    { code: 'ITM-0002', name: 'Wireless Mouse', category: 'Accessories', unit: 'Pcs', stock: 124, reorder: 20, purchase: 850, sale: 1200, status: 'In Stock' },
    { code: 'ITM-0003', name: 'USB-C Hub', category: 'Accessories', unit: 'Pcs', stock: 89, reorder: 15, purchase: 1200, sale: 1800, status: 'In Stock' },
    { code: 'ITM-0004', name: 'Mechanical Keyboard', category: 'Accessories', unit: 'Pcs', stock: 45, reorder: 10, purchase: 5500, sale: 7500, status: 'In Stock' },
    { code: 'ITM-0045', name: 'Monitor 24"', category: 'Electronics', unit: 'Pcs', stock: 4, reorder: 10, purchase: 12000, sale: 16000, status: 'Low Stock' },
    { code: 'ITM-0078', name: 'Laptop Bag 15"', category: 'Accessories', unit: 'Pcs', stock: 3, reorder: 15, purchase: 800, sale: 1200, status: 'Low Stock' },
    { code: 'ITM-0112', name: 'HDMI Cable 2m', category: 'Cables', unit: 'Pcs', stock: 6, reorder: 25, purchase: 150, sale: 250, status: 'Low Stock' },
    { code: 'ITM-0150', name: 'Network Switch 8P', category: 'Networking', unit: 'Pcs', stock: 2, reorder: 5, purchase: 3200, sale: 4500, status: 'Low Stock' },
    { code: 'ITM-0200', name: 'SSD 1TB', category: 'Storage', unit: 'Pcs', stock: 67, reorder: 20, purchase: 6500, sale: 8500, status: 'In Stock' },
    { code: 'ITM-0201', name: 'RAM 16GB DDR5', category: 'Electronics', unit: 'Pcs', stock: 54, reorder: 15, purchase: 4800, sale: 6200, status: 'In Stock' },
  ];

  const statusBadge = (s: string) =>
    s === 'In Stock'
      ? 'bg-green-100 text-green-700'
      : s === 'Low Stock'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-red-100 text-red-600';

  return (
    <AppLayout>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#1e293b]">Inventory</h2>
            <p className="text-sm text-[#64748b] mt-0.5">Manage your items, stock levels and pricing</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm" />
              <input
                type="text"
                placeholder="Search items..."
                className="h-9 pl-9 pr-4 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] bg-white focus:outline-none focus:border-[#4f46e5] focus:ring-2 focus:ring-[#4f46e5]/20 w-56"
              />
            </div>
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] font-medium hover:border-[#4f46e5] hover:bg-indigo-50 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-filter-3-line text-[#64748b]" />
              Filter
            </button>
            <button className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap">
              <i className="ri-add-line" />
              Add Item
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#e2e8f0] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {['Code', 'Item Name', 'Category', 'Unit', 'Stock', 'Reorder Lvl', 'Purchase Rate', 'Sale Rate', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.code} className={`border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors cursor-pointer ${idx % 2 === 0 ? '' : 'bg-[#f8fafc]/40'}`}>
                  <td className="px-4 py-3 text-[#64748b] whitespace-nowrap font-mono text-xs">{item.code}</td>
                  <td className="px-4 py-3 font-medium text-[#1e293b] whitespace-nowrap">{item.name}</td>
                  <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{item.category}</td>
                  <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{item.unit}</td>
                  <td className="px-4 py-3 font-semibold text-[#1e293b] whitespace-nowrap">{item.stock}</td>
                  <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{item.reorder}</td>
                  <td className="px-4 py-3 text-[#1e293b] whitespace-nowrap">₹{item.purchase.toLocaleString()}</td>
                  <td className="px-4 py-3 text-[#1e293b] whitespace-nowrap">₹{item.sale.toLocaleString()}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusBadge(item.status)}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-indigo-50 text-[#64748b] hover:text-[#4f46e5] transition-colors cursor-pointer">
                        <i className="ri-edit-line text-sm" />
                      </button>
                      <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-[#64748b] hover:text-red-500 transition-colors cursor-pointer">
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
