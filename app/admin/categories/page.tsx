import Link from "next/link";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import ConfirmModalAction from "@/components/ConfirmModalAction";
import Pagination from "@/components/Pagination";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminCategoriesPageProps = {
    searchParams: Promise<{
        page?: string;
    }>;
};

export default async function AdminCategoriesPage({ searchParams }: AdminCategoriesPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
    const perPage = 15;
    const skip = (page - 1) * perPage;

    const where = { isActive: true };
    const [totalRows, categories] = await Promise.all([
        prisma.category.count({ where }),
        prisma.category.findMany({
            where,
            orderBy: { name: "asc" },
            skip,
            take: perPage,
        }),
    ]);

    const canManage = user.role === "admin";
    const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
    const currentPage = Math.min(page, totalPages);

    return (
        <AppShell user={user} active="admin.categories">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Kategori Menu</h1>
                    <p className="text-sm text-moka-muted">Kelola kategori produk yang akan tampil di POS kasir.</p>
                </div>
                {canManage ? (
                    <Link href="/admin/categories/new" className="moka-btn">
                        Tambah Kategori
                    </Link>
                ) : null}
            </div>

            <div className="soft-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="moka-table moka-table-mobile">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Status</th>
                                {canManage ? <th className="text-center">Aksi</th> : null}
                            </tr>
                        </thead>
                        <tbody>
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 3 : 2} className="py-10 text-center text-sm text-moka-muted">
                                        Belum ada kategori.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id}>
                                        <td className="font-semibold">{category.name}</td>
                                        <td>
                                            <Badge variant={category.isActive ? "success" : "warning"}>
                                                {category.isActive ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </td>
                                        {canManage ? (
                                            <td>
                                                <div className="flex items-center justify-center gap-3">
                                                    <Link
                                                        href={`/admin/categories/${category.id}/edit`}
                                                        className="text-sm font-semibold text-moka-primary hover:text-moka-ink"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <form id={`delete-category-${category.id}`} method="POST" action={`/admin/categories/${category.id}/delete`}>
                                                        <ConfirmModalAction
                                                            formId={`delete-category-${category.id}`}
                                                            title="Konfirmasi Hapus"
                                                            subtitle={`Hapus ${category.name}?`}
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

            <Pagination basePath="/admin/categories" currentPage={currentPage} totalPages={totalPages} totalItems={totalRows} perPage={perPage} />
        </AppShell>
    );
}
