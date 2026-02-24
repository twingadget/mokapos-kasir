import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireServerSessionUser } from "@/lib/server-auth";

export default async function AdminCategoryCreatePage() {
    const user = await requireServerSessionUser(["admin", "manager"]);

    return (
        <AppShell user={user} active="admin.categories">
            <div className="mb-5">
                <h1 className="font-display text-2xl font-bold text-moka-ink">Tambah Kategori</h1>
                <p className="text-sm text-moka-muted">Buat kategori baru untuk pengelompokan menu.</p>
            </div>

            <div className="soft-card p-5">
                <form method="POST" action="/admin/categories/new/submit" className="grid gap-4">
                    <div>
                        <label htmlFor="name" className="moka-label">
                            Nama Kategori
                        </label>
                        <input id="name" name="name" type="text" required className="moka-input" />
                    </div>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" name="is_active" defaultChecked className="rounded border-moka-line text-moka-primary focus:ring-moka-primary/40" />
                        <span className="text-sm text-moka-muted">Kategori aktif</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/admin/categories" className="moka-btn-secondary">
                            Batal
                        </Link>
                        <button type="submit" className="moka-btn">
                            Simpan Kategori
                        </button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}
