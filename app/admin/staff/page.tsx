import Link from "next/link";
import type { Role } from "@prisma/client";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import ConfirmModalAction from "@/components/ConfirmModalAction";
import Pagination from "@/components/Pagination";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminStaffPageProps = {
    searchParams: Promise<{
        page?: string;
    }>;
};

function formatDateOnly(date: Date): string {
    return new Intl.DateTimeFormat("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

function rolePresentation(role: Role): { label: string; variant: "primary" | "warning" | "success" } {
    if (role === "waiter") {
        return { label: "Waiter", variant: "warning" };
    }
    if (role === "manager") {
        return { label: "Manager", variant: "success" };
    }
    return { label: "Kasir", variant: "primary" };
}

export default async function AdminStaffPage({ searchParams }: AdminStaffPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
    const perPage = 15;
    const skip = (page - 1) * perPage;

    const staffRoles: Array<"kasir" | "waiter" | "manager"> = ["kasir", "waiter", "manager"];
    const where = {
        role: {
            in: staffRoles,
        },
    };

    const [totalRows, staff] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
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
        <AppShell user={user} active="admin.staff">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Kelola Staff</h1>
                    <p className="text-sm text-moka-muted">Tambah, ubah, dan hapus akun kasir, waiter, dan manager.</p>
                </div>
                {canManage ? (
                    <Link href="/admin/staff/new" className="moka-btn">
                        Tambah Staff
                    </Link>
                ) : null}
            </div>

            <div className="soft-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="moka-table moka-table-mobile">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Role</th>
                                <th>Email</th>
                                <th>Dibuat</th>
                                {canManage ? <th className="text-center">Aksi</th> : null}
                            </tr>
                        </thead>
                        <tbody>
                            {staff.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 5 : 4} className="py-10 text-center text-sm text-moka-muted">
                                        Belum ada staff.
                                    </td>
                                </tr>
                            ) : (
                                staff.map((item) => {
                                    const role = rolePresentation(item.role);
                                    return (
                                        <tr key={item.id}>
                                            <td className="font-semibold">{item.name}</td>
                                            <td>
                                                <Badge variant={role.variant}>{role.label}</Badge>
                                            </td>
                                            <td className="text-moka-muted">{item.email}</td>
                                            <td>{formatDateOnly(item.createdAt)}</td>
                                            {canManage ? (
                                                <td>
                                                    <div className="flex items-center justify-center gap-3">
                                                        <Link
                                                            href={`/admin/staff/${item.id}/edit`}
                                                            className="text-sm font-semibold text-moka-primary hover:text-moka-ink"
                                                        >
                                                            Edit
                                                        </Link>
                                                        <form id={`delete-staff-${item.id}`} method="POST" action={`/admin/staff/${item.id}/delete`}>
                                                            <ConfirmModalAction
                                                                formId={`delete-staff-${item.id}`}
                                                                title="Konfirmasi Hapus"
                                                                subtitle={`Hapus ${item.name}?`}
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
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination basePath="/admin/staff" currentPage={currentPage} totalPages={totalPages} totalItems={totalRows} perPage={perPage} />
        </AppShell>
    );
}
