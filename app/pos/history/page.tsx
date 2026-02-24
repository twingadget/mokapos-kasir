import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import Pagination from "@/components/Pagination";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { displayInvoice } from "@/lib/services/order-access";
import { requireServerSessionUser } from "@/lib/server-auth";

function statusVariant(status: OrderStatus): "success" | "warning" | "danger" {
    if (status === OrderStatus.PAID) {
        return "success";
    }
    if (status === OrderStatus.OPEN_BILL) {
        return "warning";
    }
    return "danger";
}

type PosHistoryPageProps = {
    searchParams: Promise<{
        page?: string;
    }>;
};

export default async function PosHistoryPage({ searchParams }: PosHistoryPageProps) {
    const user = await requireServerSessionUser(["kasir"]);
    const params = await searchParams;
    const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
    const perPage = 20;

    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const ordersRaw = await prisma.order.findMany({
        where: {
            userId: user.id,
            OR: [
                { status: OrderStatus.OPEN_BILL },
                {
                    orderedAt: {
                        gte: start,
                        lte: end,
                    },
                },
            ],
        },
        orderBy: { updatedAt: "desc" },
    });

    const orders = ordersRaw.sort((a, b) => {
        if (a.status === OrderStatus.OPEN_BILL && b.status !== OrderStatus.OPEN_BILL) {
            return -1;
        }
        if (a.status !== OrderStatus.OPEN_BILL && b.status === OrderStatus.OPEN_BILL) {
            return 1;
        }
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
    const totalRows = orders.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
    const currentPage = Math.min(page, totalPages);
    const pagedOrders = orders.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <AppShell user={user} active="pos.history">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Riwayat Transaksi & Open Bill</h1>
                    <p className="text-sm text-moka-muted">Open bill aktif milikmu dan riwayat transaksi hari ini.</p>
                </div>
                <Link href="/pos" className="moka-btn-secondary">
                    Kembali ke POS
                </Link>
            </div>

            <div className="soft-card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="moka-table moka-table-mobile">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Waktu</th>
                                <th>Status</th>
                                <th>Metode</th>
                                <th>Total</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-10 text-center text-sm text-moka-muted">
                                        Belum ada transaksi hari ini.
                                    </td>
                                </tr>
                            ) : (
                                pagedOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="font-semibold">{displayInvoice(order)}</td>
                                        <td>{formatDateTime(order.orderedAt)}</td>
                                        <td>
                                            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                                        </td>
                                        <td>{order.status === OrderStatus.OPEN_BILL ? "-" : order.paymentMethod}</td>
                                        <td className="text-money">{formatCurrency(Number(order.total))}</td>
                                        <td className="text-center">
                                            {order.status === OrderStatus.OPEN_BILL ? (
                                                <>
                                                    <Link href={`/pos?open_bill=${order.id}`} className="text-sm font-semibold text-moka-primary hover:text-moka-ink">
                                                        Lanjut Bayar
                                                    </Link>
                                                    <Link href={`/pos/history/${order.id}`} className="ml-3 text-sm font-semibold text-moka-primary hover:text-moka-ink">
                                                        Detail
                                                    </Link>
                                                </>
                                            ) : (
                                                <>
                                                    <Link href={`/pos/history/${order.id}`} className="text-sm font-semibold text-moka-primary hover:text-moka-ink">
                                                        Detail
                                                    </Link>
                                                    <Link href={`/orders/${order.id}/receipt`} className="ml-3 text-sm font-semibold text-moka-primary hover:text-moka-ink">
                                                        Cetak Ulang
                                                    </Link>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination basePath="/pos/history" currentPage={currentPage} totalPages={totalPages} totalItems={totalRows} perPage={perPage} />
        </AppShell>
    );
}
