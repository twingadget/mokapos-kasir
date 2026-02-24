import Link from "next/link";
import AppShell from "@/components/AppShell";
import AdminProductsMode from "@/components/AdminProductsMode";
import Pagination from "@/components/Pagination";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminProductsPageProps = {
    searchParams: Promise<{
        q?: string;
        per_page?: string;
        page?: string;
    }>;
};

function includesText(haystack: string, needle: string): boolean {
    return haystack.toLowerCase().includes(needle.toLowerCase());
}

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const params = await searchParams;

    const search = String(params.q ?? "").trim();
    const perPageRaw = String(params.per_page ?? "10");
    const allowedPerPage = ["10", "15", "25", "50", "100", "all"];
    const perPage = allowedPerPage.includes(perPageRaw) ? perPageRaw : "10";
    const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);

    const productsRaw = await prisma.product.findMany({
        where: { isActive: true },
        include: {
            category: {
                select: { id: true, name: true },
            },
            variants: {
                orderBy: { name: "asc" },
            },
        },
        orderBy: { name: "asc" },
        take: 2000,
    });

    const filtered = productsRaw.filter((product) => {
        if (!search) {
            return true;
        }

        const values = [
            product.name,
            product.sku,
            product.category?.name ?? "",
            String(product.price),
            String(product.costPrice),
            String(product.stockQty),
            ...product.variants.map((variant) => variant.name),
        ];

        return values.some((value) => includesText(value, search));
    });

    const totalRows = filtered.length;
    const perPageValue = perPage === "all" ? Math.max(totalRows, 1) : Number(perPage);
    const totalPages = Math.max(1, Math.ceil(totalRows / perPageValue));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * perPageValue, currentPage * perPageValue);

    const canManage = user.role === "admin";

    return (
        <AppShell user={user} active="admin.products">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Produk Menu</h1>
                    <p className="text-sm text-moka-muted">Kelola menu, varian, stok, dan status aktif produk Bar.</p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <form method="GET" action="/admin/products" className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                        <input type="hidden" name="per_page" value={perPage} />
                        <div className="relative w-full sm:w-[360px]">
                            <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center text-moka-muted">
                                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="m21 21-4.35-4.35" strokeWidth="1.8" strokeLinecap="round" />
                                    <circle cx="11" cy="11" r="6" strokeWidth="1.8" />
                                </svg>
                            </span>
                            <input id="q" name="q" type="text" defaultValue={search} className="moka-input appearance-none pl-4 pr-10 text-left" placeholder="cari data" />
                        </div>
                        <button type="submit" className="moka-btn">
                            Cari
                        </button>
                        {search !== "" ? (
                            <Link href={`/admin/products?per_page=${perPage}`} className="moka-btn-secondary">
                                Reset
                            </Link>
                        ) : null}
                    </form>

                    {canManage ? (
                        <Link href="/admin/products/new" className="moka-btn">
                            Tambah Produk
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className="space-y-4">
                <AdminProductsMode
                    products={paged.map((product) => ({
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        categoryName: product.category?.name ?? "-",
                        costPrice: Number(product.costPrice),
                        price: Number(product.price),
                        trackStock: product.trackStock,
                        stockQty: product.stockQty,
                        isActive: product.isActive,
                        imagePath: product.imagePath,
                        variantsCount: product.variants.length,
                    }))}
                    canManage={canManage}
                    search={search}
                    perPage={perPage}
                />
            </div>

            <Pagination
                basePath="/admin/products"
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalRows}
                perPage={perPageValue}
                query={{
                    q: search || undefined,
                    per_page: perPage,
                }}
            />
        </AppShell>
    );
}
