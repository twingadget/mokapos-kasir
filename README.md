# Moka POS Bar

A premium web-based POS built for bars and beverage outlets, designed for speed at the cashier desk and clarity for business owners.

## What Makes This POS Stand Out
- **Fast checkout flow** with keyboard-friendly interactions and touch-friendly controls.
- **Modern premium UI** (Dark + Gold) that looks polished on desktop, tablet, and mobile.
- **Role-based operations** so each team member sees only what they need.
- **Manager (view-only) role** can monitor full admin pages without CRUD risk.
- **Real business insight** with revenue, cost, and gross profit tracking in one place.
- **Production-ready architecture** on Laravel 11 + Blade + Alpine (no heavy SPA overhead).

## Built For Real Outlet Operations
### Admin
- Full master-data control: categories, products, pricing, stock, payment methods, and staff.
- Dedicated **Staff** workspace at `/admin/staff` for cashier/waiter/manager account management.
- Admin profile supports both name and email updates.
- Product image upload with automatic optimization/compression for faster load and lower bandwidth.
- Dedicated order list with filtering, search, and quick actions.
- Sales reporting with breakdown by payment method and top products.
- CSV export for external finance workflows.

### Cashier
- Dedicated POS workspace focused on transaction speed.
- Product search by name/code, category filtering, quantity controls, and item notes.
- Open Bill workflow for unpaid tabs.
- Complete payment flow and instant receipt printing.

### Waiter
- Can create and send orders to cashier flow.
- Has its own order history to monitor submitted requests.

## Business Intelligence Included
- Revenue tracking per transaction and date range.
- Cost (modal) tracking from product level down to order level.
- Automatic gross profit calculation.
- Product performance visibility to identify top-selling items quickly.

## Key Product Capabilities
- Invoice generation with daily unique sequence.
- Multi-method payments (Cash, QRIS, Debit, E-Wallet).
- Thermal receipt-ready output (80mm print layout).
- Role-aware access control for safer operations.
- Responsive data presentation, including card-based views on smaller screens.

## Technical Foundation
- Laravel 11
- Blade Templates
- Alpine.js
- Tailwind CSS
- MySQL
- Laravel Breeze Authentication

---

If you need a POS that looks premium, works fast under pressure, and gives owners clear numbers, this project is ready to deliver.
