import AppShell from "@/components/AppShell";
import ProductForm from "@/components/ProductForm";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

export default async function AdminProductCreatePage() {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
    });

    return (
        <AppShell user={user} active="admin.products">
            <div className="mb-5">
                <h1 className="font-display text-2xl font-bold text-moka-ink">Tambah Produk</h1>
                <p className="text-sm text-moka-muted">Tambahkan menu baru agar otomatis tersedia di POS kasir.</p>
            </div>

            <div className="soft-card p-5">
                <ProductForm action="/admin/products/new/submit" categories={categories.map((category) => ({ id: category.id, name: category.name }))} submitLabel="Simpan Produk" />
            </div>
        </AppShell>
    );
}
