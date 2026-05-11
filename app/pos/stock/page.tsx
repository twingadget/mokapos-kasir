import Link from "next/link";
import AppShell from "@/components/AppShell";
import Pagination from "@/components/Pagination";
import { requireServerSessionUser } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

type PosStockPageProps = {
    searchParams: Promise<{
        q?: string;
        page?: string;
    }>;
};

function includesText(haystack: string, needle: string): boolean {
    return haystack.toLowerCase().includes(needle.toLowerCase());
}

export default async function PosStockPage({ searchParams }: PosStockPageProps) {
    const user = await requireServerSessionUser(["kasir"]);
    const params = await searchParams;
    const search = String(params.q ?? "").trim();
    const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
    const perPage = 20;

    const productsRaw = await prisma.product.findMany({
        where: {
            isActive: true,
            trackStock: true,
            category: {
                isActive: true,
            },
        },
        include: {
            category: {
                select: {
                    name: true,
                },
            },
        },
        orderBy: { name: "asc" },
        take: 1000,
    });

    const filtered = productsRaw.filter((product) => {
        if (!search) {
            return true;
        }

        return [product.name, product.sku, product.category?.name ?? "", String(product.stockQty)].some((value) => includesText(value, search));
    });

    const totalRows = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
    const currentPage = Math.min(page, totalPages);
    const pagedProducts = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <AppShell user={user} active="pos.stock">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Tambah Stok Produk</h1>
                    <p className="text-sm text-moka-muted">Kasir hanya bisa menambahkan stok. Pengurangan stok tetap dikunci agar data operasional tetap aman.</p>
                </div>

                <form method="GET" action="/pos/stock" className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <div className="relative w-full sm:w-[360px]">
                        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center text-moka-muted">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="m21 21-4.35-4.35" strokeWidth="1.8" strokeLinecap="round" />
                                <circle cx="11" cy="11" r="6" strokeWidth="1.8" />
                            </svg>
                        </span>
                        <input id="q" name="q" type="text" defaultValue={search} className="moka-input appearance-none pl-4 pr-10 text-left" placeholder="cari produk stok" />
                    </div>
                    <button type="submit" className="moka-btn">
                        Cari
                    </button>
                    {search !== "" ? (
                        <Link href="/pos/stock" className="moka-btn-secondary">
                            Reset
                        </Link>
                    ) : null}
                </form>
            </div>

            <div className="soft-card mb-4 border border-moka-accent/30 bg-moka-soft/35 p-4">
                <p className="text-sm text-moka-muted">
                    Penambahan stok di halaman ini akan langsung menambah jumlah produk aktif. Semua input hanya menerima angka positif.
                </p>
            </div>

            <div className="soft-card overflow-hidden p-0">
                <div className="space-y-3 p-3 md:hidden">
                    {pagedProducts.length === 0 ? (
                        <div className="rounded-2xl border border-moka-line bg-[#151515] px-4 py-8 text-center text-sm text-moka-muted">
                            Produk stok belum ditemukan.
                        </div>
                    ) : (
                        pagedProducts.map((product) => (
                            <div key={product.id} className="rounded-2xl border border-moka-line bg-[#151515] px-4 py-4">
                                <div className="space-y-1">
                                    <p className="font-semibold text-moka-ink">{product.name}</p>
                                    <p className="text-xs uppercase tracking-wide text-moka-muted">{product.sku}</p>
                                    <p className="text-sm text-moka-muted">Kategori: {product.category?.name ?? "-"}</p>
                                    <p className="text-sm font-semibold text-moka-ink">Stok saat ini: {product.stockQty}</p>
                                </div>

                                <form method="POST" action="/pos/stock/add" className="mt-4 flex flex-col gap-2">
                                    <input type="hidden" name="product_id" value={product.id} />
                                    <label htmlFor={`stock-add-mobile-${product.id}`} className="text-xs font-semibold uppercase tracking-wide text-moka-muted">
                                        Tambah stok
                                    </label>
                                    <input
                                        id={`stock-add-mobile-${product.id}`}
                                        name="qty"
                                        type="number"
                                        min="1"
                                        step="1"
                                        defaultValue="1"
                                        required
                                        className="moka-input"
                                    />
                                    <button type="submit" className="moka-btn">
                                        Simpan Penambahan
                                    </button>
                                </form>
                            </div>
                        ))
                    )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="moka-table">
                        <thead>
                            <tr>
                                <th>Produk</th>
                                <th>SKU</th>
                                <th>Kategori</th>
                                <th>Stok Saat Ini</th>
                                <th>Tambah</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-sm text-moka-muted">
                                        Produk stok belum ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                pagedProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td className="font-semibold">{product.name}</td>
                                        <td className="uppercase text-moka-muted">{product.sku}</td>
                                        <td>{product.category?.name ?? "-"}</td>
                                        <td>{product.stockQty}</td>
                                        <td>
                                            <input
                                                form={`stock-add-${product.id}`}
                                                name="qty"
                                                type="number"
                                                min="1"
                                                step="1"
                                                defaultValue="1"
                                                required
                                                className="moka-input h-11 w-28"
                                            />
                                        </td>
                                        <td className="text-center">
                                            <form id={`stock-add-${product.id}`} method="POST" action="/pos/stock/add" className="inline-flex items-center justify-center">
                                                <input type="hidden" name="product_id" value={product.id} />
                                                <button type="submit" className="moka-btn">
                                                    Tambah Stok
                                                </button>
                                            </form>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination basePath="/pos/stock" currentPage={currentPage} totalPages={totalPages} totalItems={totalRows} perPage={perPage} query={{ q: search || undefined }} />
        </AppShell>
    );
}
