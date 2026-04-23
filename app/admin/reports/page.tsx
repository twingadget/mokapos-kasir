import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import ConfirmModalAction from "@/components/ConfirmModalAction";
import Pagination from "@/components/Pagination";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/format";
import { canDeleteOpenBillOrder, displayInvoice } from "@/lib/services/order-access";
import { getReportData, resolveDateRange } from "@/lib/services/reports";
import { requireServerSessionUser } from "@/lib/server-auth";

type ReportsPageProps = {
    searchParams: Promise<{
        from?: string;
        to?: string;
        page?: string;
    }>;
};

export default async function AdminReportsPage({ searchParams }: ReportsPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const params = await searchParams;
    const range = resolveDateRange({ from: params.from, to: params.to });
    const report = await getReportData(range);

    const isAdmin = user.role === "admin";
    const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
    const perPage = 20;
    const totalRows = report.orders.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / perPage));
    const currentPage = Math.min(page, totalPages);
    const pagedOrders = report.orders.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <AppShell user={user} active="admin.reports">
            <div className="mb-5">
                <h1 className="font-display text-2xl font-bold text-moka-ink">Laporan Penjualan</h1>
                <p className="text-sm text-moka-muted">Pantau omzet, transaksi, dan produk terlaris.</p>
            </div>

            <div className="soft-card p-5">
                <form method="GET" action="/admin/reports" className="grid gap-3 md:grid-cols-4">
                    <div>
                        <label htmlFor="from" className="moka-label">
                            Dari Tanggal
                        </label>
                        <input id="from" name="from" type="date" defaultValue={range.from} className="moka-input" />
                    </div>
                    <div>
                        <label htmlFor="to" className="moka-label">
                            Sampai Tanggal
                        </label>
                        <input id="to" name="to" type="date" defaultValue={range.to} className="moka-input" />
                    </div>
                    <div className="flex flex-col gap-2 md:col-span-2 sm:flex-row sm:items-end sm:justify-end">
                        <button type="submit" className="moka-btn">
                            Terapkan Filter
                        </button>
                        {isAdmin ? (
                            <Link href={`/admin/reports/export?from=${range.from}&to=${range.to}`} className="moka-btn-secondary">
                                Export CSV
                            </Link>
                        ) : null}
                    </div>
                </form>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="soft-card p-5">
                    <p className="text-xs uppercase tracking-wide text-moka-muted">Total Omzet</p>
                    <p className="mt-2 font-display text-3xl font-bold text-moka-primary text-money">{formatCurrency(report.totalOmzet)}</p>
                </div>
                <div className="soft-card p-5">
                    <p className="text-xs uppercase tracking-wide text-moka-muted">Jumlah Transaksi</p>
                    <p className="mt-2 font-display text-3xl font-bold text-moka-primary text-money">{formatNumber(report.transactionCount)}</p>
                </div>
                <div className="soft-card p-5">
                    <p className="text-xs uppercase tracking-wide text-moka-muted">Laba Kotor</p>
                    <p className="mt-2 font-display text-3xl font-bold text-moka-primary text-money">{formatCurrency(report.grossProfit)}</p>
                </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="soft-card overflow-hidden p-0">
                    <div className="border-b border-moka-line px-5 py-4">
                        <h2 className="font-display text-lg font-bold text-moka-ink">Breakdown Metode Bayar</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="moka-table moka-table-mobile">
                            <thead>
                                <tr>
                                    <th>Metode</th>
                                    <th>Transaksi</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.breakdown.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-sm text-moka-muted">
                                            Belum ada transaksi.
                                        </td>
                                    </tr>
                                ) : (
                                    report.breakdown.map((item) => (
                                        <tr key={item.payment_method}>
                                            <td className="font-semibold">{item.payment_method}</td>
                                            <td className="text-money">{formatNumber(item.transaksi)}</td>
                                            <td className="text-money">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="soft-card overflow-hidden p-0">
                    <div className="border-b border-moka-line px-5 py-4">
                        <h2 className="font-display text-lg font-bold text-moka-ink">Top 4 Menu</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="moka-table moka-table-mobile">
                            <thead>
                                <tr>
                                    <th>Menu</th>
                                    <th>Qty</th>
                                    <th>Modal</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {report.topItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-sm text-moka-muted">
                                            Belum ada data.
                                        </td>
                                    </tr>
                                ) : (
                                    report.topItems.map((item) => (
                                        <tr key={item.name_snapshot}>
                                            <td className="font-semibold">{item.name_snapshot}</td>
                                            <td className="text-money">{formatNumber(item.qty)}</td>
                                            <td className="text-money">{formatCurrency(item.modal)}</td>
                                            <td className="text-money">{formatCurrency(item.total)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-4 soft-card overflow-hidden p-0">
                <div className="border-b border-moka-line px-5 py-4">
                    <h2 className="font-display text-lg font-bold text-moka-ink">Daftar Transaksi</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="moka-table moka-table-mobile">
                        <thead>
                            <tr>
                                <th>Invoice</th>
                                <th>Waktu</th>
                                <th>Kasir</th>
                                <th>Waiter</th>
                                <th>Tempat</th>
                                <th>Status</th>
                                <th>Metode</th>
                                <th>Total</th>
                                <th>Modal</th>
                                <th>Laba</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-10 text-center text-sm text-moka-muted">
                                        Belum ada transaksi pada rentang tanggal ini.
                                    </td>
                                </tr>
                            ) : (
                                pagedOrders.map((order) => {
                                    const isDraft = order.status === OrderStatus.OPEN_BILL || order.status === OrderStatus.WAITING;
                                    const statusVariant = order.status === OrderStatus.PAID ? "success" : isDraft ? "warning" : "danger";

                                    return (
                                        <tr key={order.id}>
                                            <td className="font-semibold">{displayInvoice(order)}</td>
                                            <td>{formatDateTime(order.orderedAt)}</td>
                                            <td>{order.userName}</td>
                                            <td>{order.waiterName ?? "-"}</td>
                                            <td>
                                                <div className="min-w-[140px]">
                                                    <p>{order.customerPlaceLabel ?? "-"}</p>
                                                    {order.orderNote ? <p className="mt-1 text-xs text-moka-muted">Catatan: {order.orderNote}</p> : null}
                                                </div>
                                            </td>
                                            <td>
                                                <Badge variant={statusVariant}>{order.status}</Badge>
                                            </td>
                                            <td>{isDraft ? "-" : order.paymentMethod}</td>
                                            <td className="text-money">{formatCurrency(order.total)}</td>
                                            <td className="text-money">{formatCurrency(order.orderCost)}</td>
                                            <td className="text-money">{formatCurrency(order.orderProfit)}</td>
                                            <td className="text-center">
                                                <div className="inline-flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-moka-line text-moka-primary transition hover:border-moka-primary hover:bg-moka-soft/70"
                                                        title="Detail"
                                                        aria-label="Detail"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                            <path d="M10 3C5 3 1.73 7.11.46 9.07a1.63 1.63 0 000 1.86C1.73 12.89 5 17 10 17s8.27-4.11 9.54-6.07a1.63 1.63 0 000-1.86C18.27 7.11 15 3 10 3zm0 11a4 4 0 110-8 4 4 0 010 8z" />
                                                        </svg>
                                                    </Link>
                                                    {order.status === OrderStatus.PAID ? (
                                                        <Link
                                                            href={`/orders/${order.id}/receipt`}
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-moka-line text-moka-primary transition hover:border-moka-primary hover:bg-moka-soft/70"
                                                            title="Cetak Ulang"
                                                            aria-label="Cetak Ulang"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                <path d="M5 3a2 2 0 00-2 2v2h2V5h10v2h2V5a2 2 0 00-2-2H5z" />
                                                                <path d="M3 8a2 2 0 00-2 2v3a2 2 0 002 2h2v2h10v-2h2a2 2 0 002-2v-3a2 2 0 00-2-2H3zm4 7v-3h6v3H7zm8-4a1 1 0 100-2 1 1 0 000 2z" />
                                                            </svg>
                                                        </Link>
                                                    ) : null}
                                                    {isAdmin && order.status === OrderStatus.WAITING ? (
                                                        <form id={`void-report-order-${order.id}`} method="POST" action={`/admin/orders/${order.id}/void`}>
                                                            <ConfirmModalAction
                                                                formId={`void-report-order-${order.id}`}
                                                                title="Batalkan Pesanan"
                                                                subtitle="Batalkan pesanan ini sebelum diproses?"
                                                                confirmLabel="Ya, Batalkan"
                                                                cancelLabel="Tidak"
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#A84D4D] text-[#FF9B9B] transition hover:border-[#C05D5D] hover:bg-[#321B1B]"
                                                                ariaLabel="Batalkan"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path d="M6 6l12 12M18 6l-12 12" strokeWidth="2" strokeLinecap="round" />
                                                                </svg>
                                                            </ConfirmModalAction>
                                                        </form>
                                                    ) : null}
                                                    {canDeleteOpenBillOrder(user, order) ? (
                                                        <form id={`delete-report-order-${order.id}`} method="POST" action={`/admin/orders/${order.id}/delete`}>
                                                            <ConfirmModalAction
                                                                formId={`delete-report-order-${order.id}`}
                                                                title="Hapus Open Bill"
                                                                subtitle="Hapus open bill ini secara permanen? Stok produk akan dikembalikan."
                                                                confirmLabel="Ya, Hapus"
                                                                cancelLabel="Tidak"
                                                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#A84D4D] text-[#FF9B9B] transition hover:border-[#C05D5D] hover:bg-[#321B1B]"
                                                                ariaLabel="Hapus open bill"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                                    <path d="M9 3h6" strokeWidth="2" strokeLinecap="round" />
                                                                    <path d="M4 7h16" strokeWidth="2" strokeLinecap="round" />
                                                                    <path d="M7 7l1 13a1 1 0 001 1h6a1 1 0 001-1l1-13" strokeWidth="2" strokeLinecap="round" />
                                                                    <path d="M10 11v5M14 11v5" strokeWidth="2" strokeLinecap="round" />
                                                                </svg>
                                                            </ConfirmModalAction>
                                                        </form>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination
                basePath="/admin/reports"
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalRows}
                perPage={perPage}
                query={{
                    from: range.from,
                    to: range.to,
                }}
            />
        </AppShell>
    );
}
