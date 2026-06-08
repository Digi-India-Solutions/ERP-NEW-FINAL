# Inventory & Business Management System

## 1. Project Description
A modern SaaS-style Inventory & Business Management web application inspired by Tally's speed and efficiency. Target users are small-to-medium businesses needing stock, billing, and financial reporting. Core value: fast keyboard-driven data entry with a beautiful, professional interface.

## 2. Page Structure
- `/` — Dashboard (KPIs, charts, recent activity)
- `/inventory` — Inventory list (items, categories, stock levels)
- `/inventory/new` — Add new inventory item
- `/inventory/:id` — Edit inventory item
- `/billing` — Billing list (invoices, purchase orders)
- `/billing/new` — Create new bill/invoice
- `/billing/:id` — View/edit bill
- `/reports` — Reports (P&L, stock, sales summary)
- `/settings` — App settings (company, warehouse, tax rates)
- `/users` — User management (roles, permissions)

## 3. Core Features
- [x] App shell: collapsible sidebar, topbar, breadcrumb navigation
- [ ] Dashboard: KPI cards, sales/stock charts, recent transactions
- [ ] Inventory: CRUD for items, categories, units, reorder levels
- [ ] Billing: Invoice/PO creation with Tally-style keyboard shortcuts
- [ ] Reports: Filterable reports with export
- [ ] Settings: Company profile, warehouses, tax configuration
- [ ] Users: Role-based access management

## 4. Data Model Design
(No backend connected — using mock data for now)

### Items
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique ID |
| code | string | Item code |
| name | string | Item name |
| category | string | Category |
| unit | string | Unit of measure |
| stock | number | Current stock |
| reorderLevel | number | Min stock alert |
| purchaseRate | number | Purchase price |
| saleRate | number | Sale price |

### Bills
| Field | Type | Description |
|-------|------|-------------|
| id | string | Bill number |
| type | string | invoice / purchase |
| date | string | Bill date |
| party | string | Customer/Vendor |
| items | array | Line items |
| total | number | Grand total |
| status | string | draft / saved / paid |

## 5. Backend / Third-party Integration Plan
- Supabase: Not connected (Phase 1 uses mock data; can be added later for persistence)
- Shopify: Not needed
- Stripe: Not needed

## 6. Development Phase Plan

### Phase 1: App Shell + Dashboard (CURRENT)
- Goal: Core layout with sidebar navigation, topbar, and a full Dashboard
- Deliverable: Working navigation, Dashboard with KPIs and charts

### Phase 2: Inventory Module
- Goal: Full inventory list, add/edit item forms with validation
- Deliverable: CRUD item management with search and filters

### Phase 3: Billing Module
- Goal: Invoice/PO creation with Tally keyboard shortcuts
- Deliverable: Multi-tab billing with live calculations

### Phase 4: Reports Module
- Goal: Filterable reports, charts, summary tables
- Deliverable: Stock, sales, and P&L reports

### Phase 5: Settings & Users
- Goal: Company settings, warehouse config, user roles
- Deliverable: Complete settings and user management pages
