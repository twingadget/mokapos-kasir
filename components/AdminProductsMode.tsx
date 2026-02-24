"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Badge from "@/components/Badge";
import ConfirmModalAction from "@/components/ConfirmModalAction";

type ProductListItem = {
    id: number;
    name: string;
    sku: string;
    categoryName: string;
    costPrice: number;
    price: number;
    trackStock: boolean;
    stockQty: number;
    isActive: boolean;
    imagePath: string | null;
    variantsCount: number;
};

type AdminProductsModeProps = {
    products: ProductListItem[];
    canManage: boolean;
    search: string;
    perPage: string;
};

function formatCurrency(value: number): string {
    return `Rp ${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value)}`;
}

function viewButtonClass(active: boolean): string {
    if (active) {
        return "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg bg-moka-primary text-[#1A1408] transition";
    }

    return "inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg text-moka-muted transition hover:bg-moka-soft";
}

function renderStatusBadge(isActive: boolean): ReactNode {
    return <Badge variant={isActive ? "success" : "warning"}>{isActive ? "Aktif" : "Nonaktif"}</Badge>;
}

export default function AdminProductsMode({ products, canManage, search, perPage }: AdminProductsModeProps) {
    const [viewMode, setViewMode] = useState<"table" | "card">("table");

    useEffect(() => {
        const saved = window.localStorage.getItem("admin_products_view_mode");
        if (saved === "card" || saved === "table") {
            setViewMode(saved);
        }
    }, []);

    const setMode = (mode: "table" | "card") => {
        setViewMode(mode);
        window.localStorage.setItem("admin_products_view_mode", mode);
    };

    return (
        <>
            <div className="soft-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-sm font-semibold text-moka-ink">Tampilan daftar produk</p>
                        <p className="text-xs text-moka-muted">Pilih mode tabel atau kartu.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <form method="GET" action="/admin/products" className="flex items-center gap-2">
                            <input type="hidden" name="q" value={search} />
                            <label htmlFor="per_page" className="text-sm font-medium text-moka-muted">
                                Tampilkan
                            </label>
                            <select
                                id="per_page"
                                name="per_page"
                                defaultValue={perPage}
                                className="moka-select h-10 w-[140px]"
                                onChange={(event) => event.currentTarget.form?.requestSubmit()}
                            >
                                <option value="10">10 data</option>
                                <option value="15">15 data</option>
                                <option value="25">25 data</option>
                                <option value="50">50 data</option>
                                <option value="100">100 data</option>
                                <option value="all">Semua</option>
                            </select>
                        </form>

                        <div className="inline-flex rounded-xl border border-moka-line bg-moka-card p-1">
                            <button type="button" className={viewButtonClass(viewMode === "table")} onClick={() => setMode("table")} aria-label="Tampilan tabel">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.8" strokeLinecap="round" />
                                </svg>
                            </button>
                            <button type="button" className={viewButtonClass(viewMode === "card")} onClick={() => setMode("card")} aria-label="Tampilan kartu">
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="4" y="4" width="7" height="7" rx="1.5" strokeWidth="1.8" />
                                    <rect x="13" y="4" width="7" height="7" rx="1.5" strokeWidth="1.8" />
                                    <rect x="4" y="13" width="7" height="7" rx="1.5" strokeWidth="1.8" />
                                    <rect x="13" y="13" width="7" height="7" rx="1.5" strokeWidth="1.8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewMode === "table" ? (
                <div className="soft-card overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="moka-table moka-table-mobile">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>SKU</th>
                                    <th>Kategori</th>
                                    <th>Modal</th>
                                    <th>Harga</th>
                                    <th>Stok</th>
                                    <th>Status</th>
                                    {canManage ? <th className="text-center">Aksi</th> : null}
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 8 : 7} className="py-10 text-center text-sm text-moka-muted">
                                            Belum ada produk.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id}>
                                            <td>
                                                <p className="font-semibold">{product.name}</p>
                                                {product.variantsCount > 0 ? (
                                                    <p className="text-xs text-moka-muted">{product.variantsCount} varian</p>
                                                ) : null}
                                            </td>
                                            <td className="uppercase text-moka-muted">{product.sku}</td>
                                            <td>{product.categoryName}</td>
                                            <td className="text-money">{formatCurrency(product.costPrice)}</td>
                                            <td className="text-money">{formatCurrency(product.price)}</td>
                                            <td>{product.trackStock ? product.stockQty : "Non-stok"}</td>
                                            <td>{renderStatusBadge(product.isActive)}</td>
                                            {canManage ? (
                                                <td className="text-center">
                                                    <div className="inline-flex items-center justify-center gap-3">
                                                        <Link
                                                            href={`/admin/products/${product.id}/edit`}
                                                            className="text-sm font-semibold text-moka-primary hover:text-moka-ink"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <form id={`delete-product-table-${product.id}`} method="POST" action={`/admin/products/${product.id}/delete`}>
                                                            <ConfirmModalAction
                                                                formId={`delete-product-table-${product.id}`}
                                                                title="Konfirmasi Hapus"
                                                                subtitle={`Hapus ${product.name}?`}
                                                                confirmLabel="Hapus"
                                                                className="text-sm font-semibold text-red-600 hover:text-red-700"
                                                            >
                                                                Hapus
                                                            </ConfirmModalAction>
                                                        </form>
                                                    </div>
                                                </td>
                                            ) : null}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {products.length === 0 ? (
                        <div className="soft-card p-5 sm:col-span-2 xl:col-span-3">
                            <p className="text-center text-sm text-moka-muted">Belum ada produk.</p>
                        </div>
                    ) : (
                        products.map((product) => (
                            <div key={product.id} className="soft-card p-5">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="font-display text-lg font-bold text-moka-ink">{product.name}</h3>
                                        <p className="text-xs uppercase tracking-wide text-moka-muted">{product.sku}</p>
                                    </div>
                                    {renderStatusBadge(product.isActive)}
                                </div>

                                {product.imagePath ? (
                                    <img src={`/${product.imagePath.replace(/^\/+/, "")}`} alt={product.name} className="mb-3 h-72 w-full rounded-xl object-cover object-center" />
                                ) : (
                                    <div className="mb-3 flex h-72 items-center justify-center rounded-xl border border-dashed border-moka-line bg-moka-soft/60 text-sm text-moka-muted">
                                        Belum ada gambar
                                    </div>
                                )}

                                <div className="mb-3 flex flex-wrap items-center gap-2">
                                    <Badge variant="primary">{product.categoryName}</Badge>
                                    {product.variantsCount > 0 ? <Badge>{product.variantsCount} Varian</Badge> : null}
                                    {product.trackStock ? <Badge variant="warning">Stok: {product.stockQty}</Badge> : <Badge>Non-stok</Badge>}
                                </div>

                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-display text-xl font-bold text-moka-primary text-money">{formatCurrency(product.price)}</p>
                                        <p className="text-xs text-moka-muted text-money">Modal: {formatCurrency(product.costPrice)}</p>
                                    </div>
                                    {canManage ? (
                                        <div className="flex items-center gap-2">
                                            <Link href={`/admin/products/${product.id}/edit`} className="moka-btn-secondary px-4">
                                                Edit
                                            </Link>
                                            <form id={`delete-product-card-${product.id}`} method="POST" action={`/admin/products/${product.id}/delete`}>
                                                <ConfirmModalAction
                                                    formId={`delete-product-card-${product.id}`}
                                                    title="Konfirmasi Hapus"
                                                    subtitle={`Hapus ${product.name}?`}
                                                    confirmLabel="Hapus"
                                                    className="moka-btn-danger px-4"
                                                >
                                                    Hapus
                                                </ConfirmModalAction>
                                            </form>
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </>
    );
}
