import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { canViewOrder, displayInvoice } from "@/lib/services/order-access";
import { requireServerSessionUser } from "@/lib/server-auth";

type PosOrderDetailPageProps = {
    params: Promise<{ id: string }>;
};

function discountLabel(order: { discountType: string; discountValue: number }): string {
    if (order.discountType === "percent") {
        return `${new Intl.NumberFormat("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(order.discountValue)}%`;
    }

    return formatCurrency(order.discountValue);
}

export default async function PosOrderDetailPage({ params }: PosOrderDetailPageProps) {
    const user = await requireServerSessionUser(["kasir"]);
    const routeParams = await params;
    const id = Number(routeParams.id);

    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: {
                select: { id: true, name: true, email: true },
            },
            waiter: {
                select: { id: true, name: true, email: true },
            },
            items: {
                include: {
                    addons: true,
                },
                orderBy: { id: "asc" },
            },
        },
    });

    if (!order) {
        notFound();
    }

    if (!canViewOrder(user, order)) {
        redirect("/pos/history");
    }

    return (
        <AppShell user={user} active="pos.history">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Detail Transaksi</h1>
                    <p className="text-sm text-moka-muted">
                        {displayInvoice(order)} - {formatDateTime(order.orderedAt)}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link href="/pos/history" className="moka-btn-secondary">
                        Kembali ke Riwayat
                    </Link>
                    {order.status === OrderStatus.PAID ? (
                        <Link href={`/orders/${order.id}/receipt`} className="moka-btn-secondary">
                            Cetak Ulang
                        </Link>
                    ) : null}
                </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                <div className="soft-card overflow-hidden p-0">
                    <div className="border-b border-moka-line px-5 py-4">
                        <h2 className="font-display text-lg font-bold text-moka-ink">Item Pesanan</h2>
                    </div>
                    <div className="divide-y divide-moka-line">
                        {order.items.length === 0 ? (
                            <p className="px-5 py-8 text-center text-sm text-moka-muted">Item transaksi kosong.</p>
                        ) : (
                            order.items.map((item) => (
                                <div key={item.id} className="px-5 py-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-moka-ink">{item.nameSnapshot}</p>
                                            <p className="text-xs text-moka-muted text-money">
                                                {item.qty} x {formatCurrency(Number(item.price))}
                                            </p>
                                            {item.notes ? <p className="mt-1 text-xs text-moka-muted">Catatan: {item.notes}</p> : null}
                                            {item.addons.length > 0 ? (
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {item.addons.map((addon) => (
                                                        <Badge key={addon.id}>
                                                            {addon.nameSnapshot} (+{formatCurrency(Number(addon.price))})
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                        <p className="font-semibold text-moka-ink text-money">{formatCurrency(Number(item.lineTotal))}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="soft-card">
                    <dl className="space-y-2 text-sm text-moka-muted">
                        <div className="flex items-center justify-between">
                            <dt>Kasir</dt>
                            <dd className="font-semibold text-moka-ink">{order.user?.name ?? "-"}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt>Status</dt>
                            <dd>
                                <Badge
                                    variant={
                                        order.status === OrderStatus.PAID ? "success" : order.status === OrderStatus.OPEN_BILL ? "warning" : "danger"
                                    }
                                >
                                    {order.status}
                                </Badge>
                            </dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt>Metode Bayar</dt>
                            <dd className="font-semibold text-moka-ink">{order.status === OrderStatus.OPEN_BILL ? "-" : order.paymentMethod}</dd>
                        </div>
                        <hr className="border-moka-line" />
                        <div className="flex items-center justify-between">
                            <dt>Subtotal</dt>
                            <dd className="text-money">{formatCurrency(Number(order.subtotal))}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt>Diskon</dt>
                            <dd className="text-money">
                                {discountLabel({
                                    discountType: order.discountType,
                                    discountValue: Number(order.discountValue),
                                })}
                            </dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt>Pajak</dt>
                            <dd className="text-money">{formatCurrency(Number(order.tax))}</dd>
                        </div>
                        <div className="flex items-center justify-between">
                            <dt>Service</dt>
                            <dd className="text-money">{formatCurrency(Number(order.service))}</dd>
                        </div>
                        <div className="flex items-center justify-between pt-2 text-base font-bold text-moka-ink">
                            <dt>Total</dt>
                            <dd className="text-money">{formatCurrency(Number(order.total))}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AppShell>
    );
}
