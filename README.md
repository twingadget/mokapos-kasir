# Moka POS Bar (Next.js + Prisma + PostgreSQL)

Migrasi dari Laravel ke Next.js dengan:
- `Next.js` (App Router)
- `Prisma ORM`
- `PostgreSQL`
- UI, alur POS/waiter/admin, dan aset foto tetap dipertahankan

## 1) Setup

```bash
cp .env.example .env
# lalu isi AUTH_SECRET dan DATABASE_URL sesuai environment
```

Install dependency:

```bash
npm install
```

Jalankan PostgreSQL lokal (opsional, via Docker):

```bash
npm run db:up
```

Generate Prisma client:

```bash
npm run prisma:generate
```

Migrasi schema ke PostgreSQL:

```bash
npm run prisma:migrate -- --name init
```

Seed data demo (user, kategori, produk, metode bayar):

```bash
npm run prisma:seed
```

## 2) Jalankan aplikasi

```bash
npm run dev
```

Default URL:
- `http://localhost:3000`

## 3) Akun demo

Semua password: `password`

- `admin@coffeeshop.test` (admin)
- `manager@coffeeshop.test` (manager, read-only admin pages)
- `kasir@coffeeshop.test` (kasir)
- `waiter1@coffeeshop.test` (waiter)
- `waiter2@coffeeshop.test` (waiter)

## 4) Route utama

- `/login`
- `/pos`
- `/waiter`
- `/admin/reports`
- `/admin/orders`
- `/admin/products`
- `/admin/categories`
- `/admin/payment-methods`
- `/admin/staff`
- `/profile`

## Catatan

- Halaman POS dan waiter tetap menggunakan struktur UI asli agar flow dan tampilan tidak berubah.
- Semua gambar produk tetap dipakai dari folder `public/`.
