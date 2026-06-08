export const kpiData = [
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '₹4,28,500',
    change: '+12.4%',
    trend: 'up',
    icon: 'ri-money-rupee-circle-line',
    color: 'indigo',
  },
  {
    id: 'orders',
    label: 'Bills This Month',
    value: '342',
    change: '+8.1%',
    trend: 'up',
    icon: 'ri-file-list-3-line',
    color: 'green',
  },
  {
    id: 'stock',
    label: 'Items in Stock',
    value: '1,284',
    change: '-2.3%',
    trend: 'down',
    icon: 'ri-stack-line',
    color: 'amber',
  },
  {
    id: 'lowstock',
    label: 'Low Stock Alerts',
    value: '18',
    change: '+5 new',
    trend: 'down',
    icon: 'ri-alert-line',
    color: 'red',
  },
];

export const salesTrend = [
  { month: 'Oct', sales: 210000, purchase: 146000 },
  { month: 'Nov', sales: 286000, purchase: 198000 },
  { month: 'Dec', sales: 320000, purchase: 226000 },
  { month: 'Jan', sales: 298000, purchase: 210000 },
  { month: 'Feb', sales: 376000, purchase: 258000 },
  { month: 'Mar', sales: 428500, purchase: 302000 },
];

export const topItems = [
  { name: 'Laptop 15"', sold: 142, stock: 38, revenue: 142000 },
  { name: 'Wireless Mouse', sold: 318, stock: 124, revenue: 47700 },
  { name: 'USB-C Hub', sold: 256, stock: 89, revenue: 51200 },
  { name: 'Mechanical Keyboard', sold: 98, stock: 45, revenue: 73500 },
  { name: 'Monitor 24"', sold: 67, stock: 22, revenue: 87100 },
];

export const recentTransactions = [
  { id: 'INV-2024-0342', type: 'Sale', party: 'TechVision Ltd', date: '31 Mar 2026', amount: '₹18,400', status: 'Paid' },
  { id: 'INV-2024-0341', type: 'Sale', party: 'Horizon Traders', date: '31 Mar 2026', amount: '₹6,750', status: 'Pending' },
  { id: 'PO-2024-0128', type: 'Purchase', party: 'Allied Supplies Co.', date: '30 Mar 2026', amount: '₹42,000', status: 'Paid' },
  { id: 'INV-2024-0340', type: 'Sale', party: 'StarMart Retail', date: '30 Mar 2026', amount: '₹9,200', status: 'Paid' },
  { id: 'INV-2024-0339', type: 'Sale', party: 'Blue Ocean Exports', date: '29 Mar 2026', amount: '₹31,500', status: 'Overdue' },
  { id: 'PO-2024-0127', type: 'Purchase', party: 'Prime Electronics', date: '29 Mar 2026', amount: '₹87,300', status: 'Paid' },
  { id: 'INV-2024-0338', type: 'Sale', party: 'NextGen Solutions', date: '28 Mar 2026', amount: '₹14,800', status: 'Pending' },
];

export const lowStockItems = [
  { code: 'ITM-0045', name: 'Monitor 24"', stock: 4, reorder: 10, unit: 'Pcs' },
  { code: 'ITM-0112', name: 'HDMI Cable 2m', stock: 6, reorder: 25, unit: 'Pcs' },
  { code: 'ITM-0078', name: 'Laptop Bag 15"', stock: 3, reorder: 15, unit: 'Pcs' },
  { code: 'ITM-0203', name: 'AA Batteries (Pk)', stock: 8, reorder: 50, unit: 'Pack' },
  { code: 'ITM-0089', name: 'Network Switch 8P', stock: 2, reorder: 5, unit: 'Pcs' },
];

export const stockByCategory = [
  { category: 'Electronics', count: 428 },
  { category: 'Accessories', count: 356 },
  { category: 'Cables', count: 214 },
  { category: 'Storage', count: 186 },
  { category: 'Networking', count: 100 },
];
