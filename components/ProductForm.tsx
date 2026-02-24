"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type CategoryOption = {
    id: number;
    name: string;
};

type VariantInput = {
    name: string;
    price: string;
    price_delta: string;
    is_active: boolean;
};

type ProductInitialData = {
    id?: number;
    name: string;
    sku: string;
    categoryId: number;
    price: number;
    costPrice: number;
    trackStock: boolean;
    stockQty: number;
    isActive: boolean;
    imagePath?: string | null;
    variants: VariantInput[];
};

type ProductFormProps = {
    action: string;
    categories: CategoryOption[];
    submitLabel: string;
    initial?: ProductInitialData;
};

function toVariantRow(variant: VariantInput): VariantInput {
    return {
        name: variant.name ?? "",
        price: variant.price ?? "",
        price_delta: variant.price_delta ?? "",
        is_active: variant.is_active ?? true,
    };
}

export default function ProductForm({ action, categories, submitLabel, initial }: ProductFormProps) {
    const [variants, setVariants] = useState<VariantInput[]>(
        initial?.variants && initial.variants.length > 0 ? initial.variants.map((variant) => toVariantRow(variant)) : [],
    );
    const [imagePreview, setImagePreview] = useState<string | null>(initial?.imagePath ? `/${initial.imagePath.replace(/^\/+/, "")}` : null);

    const variantsJson = useMemo(() => JSON.stringify(variants), [variants]);

    const updateVariant = (index: number, patch: Partial<VariantInput>) => {
        setVariants((prev) =>
            prev.map((item, i) =>
                i === index
                    ? {
                          ...item,
                          ...patch,
                      }
                    : item,
            ),
        );
    };

    const removeVariant = (index: number) => {
        setVariants((prev) => prev.filter((_, i) => i !== index));
    };

    const addVariant = () => {
        setVariants((prev) => [...prev, { name: "", price: "", price_delta: "", is_active: true }]);
    };

    return (
        <form method="POST" action={action} encType="multipart/form-data" className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <label htmlFor="name" className="moka-label">
                        Nama Produk
                    </label>
                    <input id="name" name="name" type="text" required defaultValue={initial?.name ?? ""} className="moka-input" />
                </div>
                <div>
                    <label htmlFor="sku" className="moka-label">
                        SKU / Kode
                    </label>
                    <input id="sku" name="sku" type="text" required defaultValue={initial?.sku ?? ""} className="moka-input uppercase" />
                </div>
                <div>
                    <label htmlFor="category_id" className="moka-label">
                        Kategori
                    </label>
                    <select id="category_id" name="category_id" defaultValue={String(initial?.categoryId ?? categories[0]?.id ?? "")} className="moka-select">
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="price" className="moka-label">
                        Harga Dasar
                    </label>
                    <input id="price" name="price" type="number" min="0" step="0.01" required defaultValue={initial?.price ?? 0} className="moka-input" />
                </div>
                <div>
                    <label htmlFor="cost_price" className="moka-label">
                        Harga Modal
                    </label>
                    <input
                        id="cost_price"
                        name="cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        defaultValue={initial?.costPrice ?? 0}
                        className="moka-input"
                    />
                </div>
                <div>
                    <label htmlFor="stock_qty" className="moka-label">
                        Jumlah Stok
                    </label>
                    <input id="stock_qty" name="stock_qty" type="number" min="0" step="1" defaultValue={initial?.stockQty ?? 0} className="moka-input" />
                </div>
                <div>
                    <label htmlFor="image" className="moka-label">
                        Gambar Produk (Upload)
                    </label>
                    <input
                        id="image"
                        name="image"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.svg"
                        className="moka-input h-auto py-2 file:mr-3 file:rounded-full file:border-0 file:bg-moka-soft file:px-4 file:py-2 file:text-sm file:font-semibold file:text-moka-primary"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) {
                                return;
                            }

                            setImagePreview(URL.createObjectURL(file));
                        }}
                    />
                    <p className="mt-1 text-xs text-moka-muted">Format: JPG, JPEG, PNG, WEBP, SVG. File akan otomatis dioptimasi saat upload.</p>
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="track_stock"
                        defaultChecked={initial?.trackStock ?? false}
                        className="rounded border-moka-line text-moka-primary focus:ring-moka-primary/40"
                    />
                    <span className="text-sm text-moka-muted">Produk menggunakan stok</span>
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="is_active"
                        defaultChecked={initial?.isActive ?? true}
                        className="rounded border-moka-line text-moka-primary focus:ring-moka-primary/40"
                    />
                    <span className="text-sm text-moka-muted">Produk aktif</span>
                </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {imagePreview ? (
                    <img src={imagePreview} alt="Preview Gambar" className="h-40 w-full rounded-xl border border-moka-line object-cover" />
                ) : (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-moka-line bg-moka-soft/60 text-sm text-moka-muted">
                        Preview gambar produk
                    </div>
                )}
            </div>

            <input type="hidden" name="variants_json" value={variantsJson} />

            <div className="soft-card bg-moka-soft/35 p-4">
                <div className="mb-3 flex items-center justify-between">
                    <div>
                        <h3 className="font-display text-lg font-bold text-moka-ink">Varian Produk</h3>
                        <p className="text-sm text-moka-muted">Contoh: Small / Medium / Large.</p>
                    </div>
                    <button type="button" className="moka-btn-secondary px-4" onClick={addVariant}>
                        Tambah Varian
                    </button>
                </div>

                <div className="space-y-3">
                    {variants.map((variant, index) => (
                        <div key={index} className="rounded-xl border border-moka-line bg-moka-card p-3">
                            <div className="grid gap-3 md:grid-cols-4">
                                <div>
                                    <label className="moka-label">Nama</label>
                                    <input
                                        type="text"
                                        value={variant.name}
                                        onChange={(event) => updateVariant(index, { name: event.target.value })}
                                        className="moka-input"
                                        placeholder="Small"
                                    />
                                </div>
                                <div>
                                    <label className="moka-label">Harga Final</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={variant.price}
                                        onChange={(event) => updateVariant(index, { price: event.target.value })}
                                        className="moka-input"
                                        placeholder="opsional"
                                    />
                                </div>
                                <div>
                                    <label className="moka-label">Selisih Harga</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={variant.price_delta}
                                        onChange={(event) => updateVariant(index, { price_delta: event.target.value })}
                                        className="moka-input"
                                        placeholder="opsional"
                                    />
                                </div>
                                <div className="flex items-end justify-between gap-3">
                                    <label className="inline-flex items-center gap-2 pb-2">
                                        <input
                                            type="checkbox"
                                            checked={variant.is_active}
                                            onChange={(event) => updateVariant(index, { is_active: event.target.checked })}
                                            className="rounded border-moka-line text-moka-primary focus:ring-moka-primary/40"
                                        />
                                        <span className="text-sm text-moka-muted">Aktif</span>
                                    </label>
                                    <button type="button" className="text-sm font-semibold text-red-600 hover:text-red-700" onClick={() => removeVariant(index)}>
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {variants.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-dashed border-moka-line bg-moka-card px-4 py-6 text-center text-sm text-moka-muted">
                        Belum ada varian. Tambahkan jika produk punya ukuran/opsi.
                    </div>
                ) : null}
            </div>

            <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Link href="/admin/products" className="moka-btn-secondary">
                    Batal
                </Link>
                <button type="submit" className="moka-btn">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
