import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminCategoryEditPageProps = {
    params: Promise<{ id: string }>;
};

export default async function AdminCategoryEditPage({ params }: AdminCategoryEditPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const routeParams = await params;
    const id = Number(routeParams.id);

    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }

    const category = await prisma.category.findUnique({
        where: { id },
    });

    if (!category) {
        notFound();
    }

    return (
        <AppShell user={user} active="admin.categories">
            <div className="mb-5">
                <h1 className="font-display text-2xl font-bold text-moka-ink">Edit Kategori</h1>
                <p className="text-sm text-moka-muted">Perbarui informasi kategori menu.</p>
            </div>

            <div className="soft-card p-5">
                <form method="POST" action={`/admin/categories/${category.id}/edit/submit`} className="grid gap-4">
                    <div>
                        <label htmlFor="name" className="moka-label">
                            Nama Kategori
                        </label>
                        <input id="name" name="name" type="text" required defaultValue={category.name} className="moka-input" />
                    </div>
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            defaultChecked={category.isActive}
                            className="rounded border-moka-line text-moka-primary focus:ring-moka-primary/40"
                        />
                        <span className="text-sm text-moka-muted">Kategori aktif</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/admin/categories" className="moka-btn-secondary">
                            Batal
                        </Link>
                        <button type="submit" className="moka-btn">
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}
