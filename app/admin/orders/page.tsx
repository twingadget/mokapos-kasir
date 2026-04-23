import Link from "next/link";
import { OrderStatus } from "@prisma/client";
import AppShell from "@/components/AppShell";
import AutoSubmitSelect from "@/components/AutoSubmitSelect";
import Badge from "@/components/Badge";
import ConfirmModalAction from "@/components/ConfirmModalAction";
import Pagination from "@/components/Pagination";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { decodeOrderNotes, formatServicePlaceLabel } from "@/lib/services/order-notes";
import { canDeleteOpenBillOrder, displayInvoice } from "@/lib/services/order-access";
import { resolveOrderCost } from "@/lib/services/orders";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminOrdersPageProps = {
    searchParams: Promise<{
        q?: string;
        per_page?: string;
        page?: string;
    }>;
};

function normalizeText(value: string): string {
    return value.toLowerCase().trim();
}

function includesText(haystack: string, needle: string): boolean {
    return normalizeText(haystack).includes(normalizeText(needle));
}

function parseDateToken(search: string): Date | null {
    if (!search) {
        return null;
    }

    const match = search.match(/\b(\d{2}[/-]\d{2}[/-]\d{4}|\d{4}-\d{2}-\d{2})\b/);
    if (!match) {
        return null;
    }

    const token = match[1];
    let year = 0;
    let month = 0;
    let day = 0;

    if (/^\d{4}-\d{2}-\d{2}$/.test(token)) {
        const [yy, mm, dd] = token.split("-").map((part) => Number(part));
        year = yy;
        month = mm;
        day = dd;
    } else {
        const parts = token.split(/[/-]/).map((part) => Number(part));
        day = parts[0];
        month = parts[1];
        year = parts[2];
    }

    const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);
    if (Number.isNaN(parsed.getTime())) {
        return null;
    }

    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
        return null;
    }

    return parsed;
}

function extractMonth(search: string): number | null {
    const monthMap: Record<string, number> = {
        januari: 1,
        january: 1,
        jan: 1,
        februari: 2,
        february: 2,
        feb: 2,
        maret: 3,
        march: 3,
        mar: 3,
        april: 4,
        apr: 4,
        mei: 5,
        may: 5,
        juni: 6,
        june: 6,
        jun: 6,
        juli: 7,
        july: 7,
        jul: 7,
        agustus: 8,
        august: 8,
        agu: 8,
        aug: 8,
        september: 9,
        sep: 9,
        oktober: 10,
        october: 10,
        okt: 10,
        oct: 10,
        november: 11,
        nov: 11,
        desember: 12,
        december: 12,
        des: 12,
        dec: 12,
    };

    const normalized = search.toLowerCase();
    for (const [keyword, month] of Object.entries(monthMap)) {
        const regex = new RegExp(`\\b${keyword}\\b`, "i");
        if (regex.test(normalized)) {
            return month;
        }
    }
    return null;
}

function extractYear(search: string): number | null {
    const match = search.match(/\b(?:19|20)\d{2}\b/);
    return match ? Number(match[0]) : null;
}

function sameDate(date: Date, target: Date): boolean {
    return (
        date.getFullYear() === target.getFullYear() &&
        date.getMonth() === target.getMonth() &&
        date.getDate() === target.getDate()
    );
}

function dateVariants(date: Date): string[] {
    const pad = (value: number) => String(value).padStart(2, "0");
    const dd = pad(date.getDate());
    const mm = pad(date.getMonth() + 1);
    const yyyy = String(date.getFullYear());
    const hh = pad(date.getHours());
    const ii = pad(date.getMinutes());
    const shortMonth = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(date);
    const longMonth = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(date);

    return [`${dd}-${mm}-${yyyy}`, `${dd}/${mm}/${yyyy}`, `${yyyy}-${mm}-${dd}`, `${dd} ${shortMonth} ${yyyy}`, `${dd} ${longMonth} ${yyyy}`, `${hh}:${ii}`];
}

function toStatusOrder(status: OrderStatus): number {
    if (status === OrderStatus.WAITING) {
        return 0;
    }
    if (status === OrderStatus.OPEN_BILL) {
        return 1;
    }
    if (status === OrderStatus.PAID) {
        return 2;
    }
    return 3;
}

export default async function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const params = await searchParams;

    const search = String(params.q ?? "").trim();
    const perPageRaw = String(params.per_page ?? "10");
    const allowedPerPage = ["10", "25", "50", "100", "all"];
    const perPage = allowedPerPage.includes(perPageRaw) ? perPageRaw : "10";
    const page = Math.max(1, Number.parseInt(String(params.page ?? "1"), 10) || 1);
    const exactDate = parseDateToken(search);
    const searchMonth = extractMonth(search);
    const searchYear = extractYear(search);

    const ordersRaw = await prisma.order.findMany({
        include: {
            user: {
                select: { name: true, email: true },
            },
            waiter: {
                select: { name: true, email: true },
            },
            items: {
                include: {
                    product: {
                        select: {
                            costPrice: true,
                        },
                    },
                },
            },
        },
        orderBy: { orderedAt: "desc" },
        take: 500,
    });

    const filtered = ordersRaw
        .filter((order) => {
            if (search === "") {
                return true;
            }

            const orderCost = resolveOrderCost(order);
            const decodedNotes = decodeOrderNotes(order.notes);
            const values = [
                order.id.toString(),
                order.invoiceNo,
                order.paymentMethod,
                order.status,
                decodedNotes.note ?? "",
                formatServicePlaceLabel(decodedNotes.servicePlace) ?? "",
                order.user?.name ?? "",
                order.user?.email ?? "",
                order.waiter?.name ?? "",
                order.waiter?.email ?? "",
                Number(order.subtotal).toString(),
                Number(order.discountValue).toString(),
                Number(order.tax).toString(),
                Number(order.service).toString(),
                Number(order.total).toString(),
                Number(order.cashReceived ?? 0).toString(),
                Number(order.change ?? 0).toString(),
                orderCost.toString(),
                formatDateTime(order.orderedAt),
                ...dateVariants(order.orderedAt),
            ];

            if (values.some((value) => includesText(value, search))) {
                return true;
            }

            if (exactDate && sameDate(order.orderedAt, exactDate)) {
                return true;
            }

            if (searchMonth !== null && searchYear !== null) {
                return order.orderedAt.getMonth() + 1 === searchMonth && order.orderedAt.getFullYear() === searchYear;
            }

            if (searchMonth !== null) {
                return order.orderedAt.getMonth() + 1 === searchMonth;
            }

            if (searchYear !== null) {
                return order.orderedAt.getFullYear() === searchYear;
            }

            return false;
        })
        .map((order) => {
            const orderCost = resolveOrderCost(order);
            return {
                id: order.id,
                invoiceNo: order.invoiceNo,
                status: order.status,
                orderedAt: order.orderedAt,
                paymentMethod: order.paymentMethod,
                total: Number(order.total),
                userName: order.status === OrderStatus.WAITING ? "-" : (order.user?.name ?? "-"),
                waiterName: order.waiter?.name ?? "-",
                orderCost,
                orderProfit: Number(order.total) - orderCost,
            };
        })
        .sort((a, b) => {
            const statusCompare = toStatusOrder(a.status) - toStatusOrder(b.status);
            if (statusCompare !== 0) {
                return statusCompare;
            }
            return b.orderedAt.getTime() - a.orderedAt.getTime();
        });

    const totalRows = filtered.length;
    const perPageValue = perPage === "all" ? Math.max(totalRows, 1) : Number(perPage);
    const totalPages = Math.max(1, Math.ceil(totalRows / perPageValue));
    const currentPage = Math.min(page, totalPages);
    const paged = filtered.slice((currentPage - 1) * perPageValue, currentPage * perPageValue);

    return (
        <AppShell user={user} active="admin.orders">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">List Order</h1>
                    <p className="text-sm text-moka-muted">Pantau semua order, cari data cepat, dan lakukan pembatalan bila diperlukan.</p>
                </div>

                <form method="GET" action="/admin/orders" className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                    <input type="hidden" name="per_page" value={perPage} />
                    <div className="relative w-full sm:w-[360px]">
                        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center text-moka-muted">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="m21 21-4.35-4.35" strokeWidth="1.8" strokeLinecap="round" />
                                <circle cx="11" cy="11" r="6" strokeWidth="1.8" />
                            </svg>
                        </span>
                        <input id="q" name="q" type="text" defaultValue={search} className="moka-input appearance-none pl-4 pr-10 text-left" placeholder="cari data" />
                    </div>
                    <button type="submit" className="moka-btn">
                        Cari
                    </button>
                    {search !== "" ? (
                        <Link href={`/admin/orders?per_page=${perPage}`} className="moka-btn-secondary">
                            Reset
                        </Link>
                    ) : null}
                </form>
            </div>

            <div className="soft-card mt-1 overflow-hidden p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-moka-line px-5 py-4">
                    <h2 className="font-display text-lg font-bold text-moka-ink">Data Order</h2>

                    <form method="GET" action="/admin/orders" className="flex items-center gap-2">
                        <input type="hidden" name="q" value={search} />
                        <label htmlFor="per_page" className="text-sm font-medium text-moka-muted">
                            Tampilkan
                        </label>
                        <AutoSubmitSelect
                            id="per_page"
                            name="per_page"
                            defaultValue={perPage}
                            className="moka-select h-10 w-[140px]"
                            options={[
                                { value: "10", label: "10 data" },
                                { value: "25", label: "25 data" },
                                { value: "50", label: "50 data" },
                                { value: "100", label: "100 data" },
                                { value: "all", label: "Semua" },
                            ]}
                        />
                    </form>
                </div>

                <div className="overflow-x-auto">
                    <table className="moka-table moka-table-mobile">
                        <thead>
                            <tr>
                                <th>Invoice / ID</th>
                                <th>Waktu</th>
                                <th>Kasir</th>
                                <th>Waiter</th>
                                <th>Status</th>
                                <th>Metode</th>
                                <th>Total</th>
                                <th>Modal</th>
                                <th>Laba</th>
                                <th className="text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="py-10 text-center text-sm text-moka-muted">
                                        Data order belum ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                paged.map((order) => {
                                    const isDraft = order.status === OrderStatus.OPEN_BILL || order.status === OrderStatus.WAITING;
                                    const statusVariant = order.status === OrderStatus.PAID ? "success" : isDraft ? "warning" : "danger";

                                    return (
                                        <tr key={order.id}>
                                            <td className="font-semibold">{displayInvoice(order)}</td>
                                            <td>{formatDateTime(order.orderedAt)}</td>
                                            <td>{order.userName}</td>
                                            <td>{order.waiterName}</td>
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

                                                    {order.status === OrderStatus.PAID && user.role === "admin" ? (
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

                                                    {user.role === "admin" && order.status === OrderStatus.WAITING ? (
                                                        <form id={`void-order-${order.id}`} method="POST" action={`/admin/orders/${order.id}/void`}>
                                                            <ConfirmModalAction
                                                                formId={`void-order-${order.id}`}
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
                                                        <form id={`delete-order-${order.id}`} method="POST" action={`/admin/orders/${order.id}/delete`}>
                                                            <ConfirmModalAction
                                                                formId={`delete-order-${order.id}`}
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
                basePath="/admin/orders"
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalRows}
                perPage={perPageValue}
                query={{
                    q: search || undefined,
                    per_page: perPage,
                }}
            />
        </AppShell>
    );
}
