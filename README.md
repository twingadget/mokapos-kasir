# Moka POS Bar

Moka POS Bar is a premium web POS for bars, lounges, and beverage outlets.
It combines fast front-of-house execution with clean management visibility.

## Why This Product Sells
- Premium **Dark + Gold** interface that feels high-end and consistent across login, admin, cashier, and waiter pages.
- Fast transaction UX for busy shifts: keyboard-ready, touch-friendly, responsive.
- Clear separation of duties with role-based access to reduce operational mistakes.
- Real-time profit awareness with revenue, cost, and gross margin in one workflow.

## Role System That Matches Real Operations
### Admin
- Full control over products, categories, stock, payment methods, and staff.
- Full order supervision and cancel/void authority where policy allows.
- Advanced reporting with payment breakdown, top products, margin data, and CSV export.

### Manager (View-Only)
- Can monitor all admin pages and metrics.
- Strictly read-only: no create, update, delete, void, or export actions.

### Cashier
- Own POS station for checkout, payment, and receipt printing.
- Can process orders sent by waiters.
- Can create orders and continue open-bill flows based on permissions.

### Waiter
- Can create customer orders and send them to cashier.
- Has dedicated history to track submitted requests.

## Core POS Capabilities
- Product search by name/SKU and category filtering.
- Variant and add-on support per item.
- Open Bill + Waiting order flows for staged service.
- Multi-payment support: Cash, QRIS, Debit, E-Wallet.
- Thermal receipt output (80mm) with reprint support.
- Daily sequential invoice generation.

## Business Controls & Insight
- Cost price and selling price tracked at product level.
- Cost is propagated into transaction lines for accurate margin reporting.
- Revenue, modal, and gross profit visible in reporting pages.
- Order list with search and pagination controls for fast audit and follow-up.

## Product Quality Highlights
- Laravel 11 architecture with clean Blade + Alpine implementation (no heavy SPA layer).
- Responsive layouts for desktop, tablet, and mobile.
- Optimized image handling for lighter production bandwidth.
- Feature tests included for critical flows (checkout, role access, waiter-to-cashier flow, profile policy).

---

Moka POS Bar is built to look premium, move fast during peak hours, and keep business numbers transparent for daily decisions.