import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import ProductForm from "@/components/ProductForm";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminProductEditPageProps = {
    params: Promise<{ id: string }>;
};

export default async function AdminProductEditPage({ params }: AdminProductEditPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const routeParams = await params;
    const id = Number(routeParams.id);

    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }

    const [product, categories] = await Promise.all([
        prisma.product.findUnique({
            where: { id },
            include: {
                variants: {
                    orderBy: { id: "asc" },
                },
            },
        }),
        prisma.category.findMany({
            where: { isActive: true },
            orderBy: { name: "asc" },
        }),
    ]);

    if (!product) {
        notFound();
    }

    return (
        <AppShell user={user} active="admin.products">
            <div className="mb-5">
                <h1 className="font-display text-2xl font-bold text-moka-ink">Edit Produk</h1>
                <p className="text-sm text-moka-muted">Perbarui data menu, varian, stok, dan gambar produk.</p>
            </div>

            <div className="soft-card p-5">
                <ProductForm
                    action={`/admin/products/${product.id}/edit/submit`}
                    categories={categories.map((category) => ({ id: category.id, name: category.name }))}
                    submitLabel="Simpan Perubahan"
                    initial={{
                        id: product.id,
                        name: product.name,
                        sku: product.sku,
                        categoryId: product.categoryId,
                        price: Number(product.price),
                        costPrice: Number(product.costPrice),
                        trackStock: product.trackStock,
                        stockQty: product.stockQty,
                        isActive: product.isActive,
                        imagePath: product.imagePath,
                        variants: product.variants.map((variant) => ({
                            name: variant.name,
                            price: variant.price === null ? "" : String(variant.price),
                            price_delta: variant.priceDelta === null ? "" : String(variant.priceDelta),
                            is_active: variant.isActive,
                        })),
                    }}
                />
            </div>
        </AppShell>
    );
}
