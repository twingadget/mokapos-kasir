import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import Pagination from "@/components/Pagination";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { displayInvoice } from "@/lib/services/order-access";
import { decodeOrderNotes } from "@/lib/services/order-notes";
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

function formatCashierCustomerPlace(notes: string | null): string {
    const place = decodeOrderNotes(notes).servicePlace;
    if (!place) {
        return "-";
    }

    const zoneLabel = place.zone === "Table" ? "Meja" : place.zone;
    return `${zoneLabel} ${place.number}`;
}

type PosHistoryPageProps = {
    searchParams: Promise<{
        page?: string;
    }>;
};

export default async function PosHistoryPage({ searchParams }: PosHistoryPageProps) {
    const user = await requireServerSessionUser(["kasir", "manager"]);
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

    const orders = ordersRaw
        .sort((a, b) => {
            if (a.status === OrderStatus.OPEN_BILL && b.status !== OrderStatus.OPEN_BILL) {
                return -1;
            }
            if (a.status !== OrderStatus.OPEN_BILL && b.status === OrderStatus.OPEN_BILL) {
                return 1;
            }
            return b.updatedAt.getTime() - a.updatedAt.getTime();
        })
        .map((order) => ({
            ...order,
            customerPlaceLabel: formatCashierCustomerPlace(order.notes),
        }));
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
                <div className="space-y-3 p-3 md:hidden">
                    {pagedOrders.length === 0 ? (
                        <div className="rounded-2xl border border-moka-line bg-[#151515] px-4 py-8 text-center text-sm text-moka-muted">
                            Belum ada transaksi hari ini.
                        </div>
                    ) : (
                        pagedOrders.map((order) => (
                            <div key={order.id} className="rounded-2xl border border-moka-line bg-[#151515] px-4 py-3">
                                <div className="space-y-1.5">
                                    <p className="text-sm font-semibold text-moka-ink">
                                        <span className="text-moka-muted">INVOICE:</span> {displayInvoice(order)}
                                    </p>
                                    <p className="text-sm font-semibold text-moka-ink">
                                        <span className="text-moka-muted">TEMPAT:</span> {order.customerPlaceLabel}
                                    </p>
                                </div>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-moka-muted">
                                    <div>
                                        <p className="font-semibold uppercase tracking-wide">Waktu</p>
                                        <p className="mt-1 text-sm text-moka-ink">{formatDateTime(order.orderedAt)}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold uppercase tracking-wide">Metode</p>
                                        <p className="mt-1 text-sm text-moka-ink">{order.status === OrderStatus.OPEN_BILL ? "-" : order.paymentMethod}</p>
                                    </div>
                                    <div>
                                        <p className="font-semibold uppercase tracking-wide">Status</p>
                                        <div className="mt-1">
                                            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold uppercase tracking-wide">Total</p>
                                        <p className="mt-1 text-sm font-semibold text-moka-ink text-money">{formatCurrency(Number(order.total))}</p>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-wrap gap-3 border-t border-moka-line pt-3">
                                    {order.status === OrderStatus.OPEN_BILL ? (
                                        <>
                                            <Link href={`/pos?open_bill=${order.id}`} className="text-sm font-semibold text-moka-primary hover:text-moka-ink">
                                                Lanjut Bayar
                                            </Link>
                                            <Link href={`/pos/history/${order.id}`} className="text-sm font-semibold text-moka-primary hover:text-moka-ink">
                                                Detail
                                            </Link>
                                        </>
                                    ) : (
                                        <>
                                            <Link href={`/pos/history/${order.id}`} className="text-sm font-semibold text-moka-primary hover:text-moka-ink">
                                                Detail
                                            </Link>
                                            <Link href={`/orders/${order.id}/receipt`} className="text-sm font-semibold text-moka-primary hover:text-moka-ink">
                                                Cetak Ulang
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="moka-table">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Waktu</th>
                                <th>Tempat</th>
                                <th>Status</th>
                                <th>Metode</th>
                                <th>Total</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-10 text-center text-sm text-moka-muted">
                                        Belum ada transaksi hari ini.
                                    </td>
                                </tr>
                            ) : (
                                pagedOrders.map((order) => (
                                    <tr key={order.id}>
                                        <td data-label="Invoice" className="font-semibold">
                                            {displayInvoice(order)}
                                        </td>
                                        <td data-label="Waktu">{formatDateTime(order.orderedAt)}</td>
                                        <td data-label="Tempat">{order.customerPlaceLabel}</td>
                                        <td data-label="Status">
                                            <Badge variant={statusVariant(order.status)}>{order.status}</Badge>
                                        </td>
                                        <td data-label="Metode">{order.status === OrderStatus.OPEN_BILL ? "-" : order.paymentMethod}</td>
                                        <td data-label="Total" className="text-money">
                                            {formatCurrency(Number(order.total))}
                                        </td>
                                        <td data-label="Aksi" className="text-center">
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
