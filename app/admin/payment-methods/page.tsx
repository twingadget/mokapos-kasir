import Link from "next/link";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import ConfirmModalAction from "@/components/ConfirmModalAction";
import Pagination from "@/components/Pagination";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminPaymentMethodsPageProps = {
    searchParams: Promise<{
        page?: string;
    }>;
};

export default async function AdminPaymentMethodsPage({ searchParams }: AdminPaymentMethodsPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
    const perPage = 15;
    const skip = (page - 1) * perPage;

    const [totalRows, paymentMethods] = await Promise.all([
        prisma.paymentMethod.count(),
        prisma.paymentMethod.findMany({
            orderBy: { name: "asc" },
            skip,
            take: perPage,
        }),
    ]);

    const canManage = user.role === "admin";
    const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
    const currentPage = Math.min(page, totalPages);

    return (
        <AppShell user={user} active="admin.payment-methods">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Metode Pembayaran</h1>
                    <p className="text-sm text-moka-muted">Konfigurasi metode pembayaran aktif untuk checkout kasir.</p>
                </div>
                {canManage ? (
                    <Link href="/admin/payment-methods/new" className="moka-btn">
                        Tambah Metode
                    </Link>
                ) : null}
            </div>

            <div className="soft-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="moka-table moka-table-mobile">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>Kode</th>
                                <th>Status</th>
                                {canManage ? <th className="text-center">Aksi</th> : null}
                            </tr>
                        </thead>
                        <tbody>
                            {paymentMethods.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 4 : 3} className="py-10 text-center text-sm text-moka-muted">
                                        Belum ada metode pembayaran.
                                    </td>
                                </tr>
                            ) : (
                                paymentMethods.map((method) => (
                                    <tr key={method.id}>
                                        <td className="font-semibold">{method.name}</td>
                                        <td className="uppercase text-moka-muted">{method.code}</td>
                                        <td>
                                            <Badge variant={method.isActive ? "success" : "warning"}>
                                                {method.isActive ? "Aktif" : "Nonaktif"}
                                            </Badge>
                                        </td>
                                        {canManage ? (
                                            <td>
                                                <div className="flex items-center justify-center gap-3">
                                                    <Link
                                                        href={`/admin/payment-methods/${method.id}/edit`}
                                                        className="text-sm font-semibold text-moka-primary hover:text-moka-ink"
                                                    >
                                                        Edit
                                                    </Link>
                                                    <form id={`delete-payment-method-${method.id}`} method="POST" action={`/admin/payment-methods/${method.id}/delete`}>
                                                        <ConfirmModalAction
                                                            formId={`delete-payment-method-${method.id}`}
                                                            title="Konfirmasi Hapus"
                                                            subtitle={`Hapus ${method.name}?`}
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

            <Pagination basePath="/admin/payment-methods" currentPage={currentPage} totalPages={totalPages} totalItems={totalRows} perPage={perPage} />
        </AppShell>
    );
}
