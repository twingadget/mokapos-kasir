import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decodeOrderNotes, formatServicePlaceLabel } from "@/lib/services/order-notes";
import { resolveOrderCost } from "@/lib/services/orders";

export type ReportRange = {
    fromDate: Date;
    toDate: Date;
    from: string;
    to: string;
};

function formatDateInput(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function resolveDateRange(input: { from?: string; to?: string }): ReportRange {
    let fromDate = new Date();
    fromDate.setHours(0, 0, 0, 0);

    let toDate = new Date();
    toDate.setHours(23, 59, 59, 999);

    if (input.from) {
        const candidate = new Date(input.from);
        if (!Number.isNaN(candidate.getTime())) {
            candidate.setHours(0, 0, 0, 0);
            fromDate = candidate;
        }
    }

    if (input.to) {
        const candidate = new Date(input.to);
        if (!Number.isNaN(candidate.getTime())) {
            candidate.setHours(23, 59, 59, 999);
            toDate = candidate;
        }
    }

    if (fromDate > toDate) {
        const swapFrom = new Date(toDate);
        swapFrom.setHours(0, 0, 0, 0);

        const swapTo = new Date(fromDate);
        swapTo.setHours(23, 59, 59, 999);

        fromDate = swapFrom;
        toDate = swapTo;
    }

    return {
        fromDate,
        toDate,
        from: formatDateInput(fromDate),
        to: formatDateInput(toDate),
    };
}

export async function getReportData(range: ReportRange): Promise<{
    totalOmzet: number;
    totalModal: number;
    grossProfit: number;
    transactionCount: number;
    breakdown: Array<{
        payment_method: string;
        transaksi: number;
        total: number;
    }>;
    topItems: Array<{
        name_snapshot: string;
        qty: number;
        modal: number;
        total: number;
    }>;
    orders: Array<{
        id: number;
        invoiceNo: string;
        status: OrderStatus;
        orderedAt: Date;
        paymentMethod: string;
        total: number;
        userName: string;
        waiterName: string | null;
        customerPlaceLabel: string | null;
        orderNote: string | null;
        orderCost: number;
        orderProfit: number;
    }>;
}> {
    const paidOrders = await prisma.order.findMany({
        where: {
            status: OrderStatus.PAID,
            orderedAt: {
                gte: range.fromDate,
                lte: range.toDate,
            },
        },
        include: {
            items: {
                include: {
                    product: {
                        select: { costPrice: true },
                    },
                },
            },
            user: {
                select: { name: true },
            },
            waiter: {
                select: { name: true },
            },
        },
    });

    const totalOmzet = paidOrders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalModal = paidOrders.reduce((sum, order) => sum + resolveOrderCost(order), 0);
    const transactionCount = paidOrders.length;
    const grossProfit = totalOmzet - totalModal;

    const breakdownMap = new Map<string, { transaksi: number; total: number }>();
    for (const order of paidOrders) {
        const key = order.paymentMethod;
        const current = breakdownMap.get(key) ?? { transaksi: 0, total: 0 };
        current.transaksi += 1;
        current.total += Number(order.total);
        breakdownMap.set(key, current);
    }
    const breakdown = [...breakdownMap.entries()]
        .map(([paymentMethod, value]) => ({
            payment_method: paymentMethod,
            transaksi: value.transaksi,
            total: value.total,
        }))
        .sort((a, b) => b.total - a.total);

    const topItemMap = new Map<string, { qty: number; modal: number; total: number }>();
    for (const order of paidOrders) {
        for (const item of order.items) {
            const key = item.nameSnapshot;
            const current = topItemMap.get(key) ?? { qty: 0, modal: 0, total: 0 };
            current.qty += item.qty;

            const lineCost = Number(item.lineCostTotal) > 0 ? Number(item.lineCostTotal) : resolveOrderCost({ items: [item] });
            current.modal += lineCost;
            current.total += Number(item.lineTotal);
            topItemMap.set(key, current);
        }
    }
    const topItems = [...topItemMap.entries()]
        .map(([nameSnapshot, value]) => ({
            name_snapshot: nameSnapshot,
            qty: value.qty,
            modal: value.modal,
            total: value.total,
        }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 4);

    const ordersRaw = await prisma.order.findMany({
        where: {
            OR: [
                {
                    orderedAt: {
                        gte: range.fromDate,
                        lte: range.toDate,
                    },
                },
                {
                    status: {
                        in: [OrderStatus.OPEN_BILL, OrderStatus.WAITING],
                    },
                },
            ],
        },
        include: {
            user: {
                select: { name: true },
            },
            waiter: {
                select: { name: true },
            },
            items: {
                include: {
                    product: {
                        select: { costPrice: true },
                    },
                },
            },
        },
        orderBy: { orderedAt: "desc" },
        take: 200,
    });

    const statusOrder = (status: OrderStatus): number => {
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
    };

    const orders = ordersRaw
        .map((order) => {
            const orderCost = resolveOrderCost(order);
            const decodedNotes = decodeOrderNotes(order.notes);
            return {
                id: order.id,
                invoiceNo: order.invoiceNo,
                status: order.status,
                orderedAt: order.orderedAt,
                paymentMethod: order.paymentMethod,
                total: Number(order.total),
                userName: order.user?.name ?? "-",
                waiterName: order.waiter?.name ?? null,
                customerPlaceLabel: formatServicePlaceLabel(decodedNotes.servicePlace),
                orderNote: decodedNotes.note,
                orderCost,
                orderProfit: Number(order.total) - orderCost,
            };
        })
        .sort((a, b) => {
            const statusCompare = statusOrder(a.status) - statusOrder(b.status);
            if (statusCompare !== 0) {
                return statusCompare;
            }
            return b.orderedAt.getTime() - a.orderedAt.getTime();
        });

    return {
        totalOmzet,
        totalModal,
        grossProfit,
        transactionCount,
        breakdown,
        topItems,
        orders,
    };
}

export function buildReportCsv(params: {
    orders: Array<{
        id: number;
        invoiceNo: string;
        orderedAt: Date;
        userName: string;
        waiterName?: string | null;
        customerPlaceLabel?: string | null;
        status: OrderStatus;
        paymentMethod: string;
        total: number;
        orderCost: number;
        orderProfit: number;
    }>;
}): string {
    const header = ["Invoice", "Tanggal", "Kasir", "Waiter", "Tempat", "Status", "Metode", "Total", "Modal", "Laba Kotor"];
    const rows = params.orders.map((order) => [
        order.status === OrderStatus.OPEN_BILL ? `Open Bill #${order.id}` : order.status === OrderStatus.WAITING ? `Pesanan #${order.id}` : order.invoiceNo,
        order.orderedAt.toISOString().replace("T", " ").slice(0, 19),
        order.userName,
        order.waiterName ?? "-",
        order.customerPlaceLabel ?? "-",
        order.status,
        order.status === OrderStatus.OPEN_BILL || order.status === OrderStatus.WAITING ? "-" : order.paymentMethod,
        order.total.toString(),
        order.orderCost.toString(),
        order.orderProfit.toString(),
    ]);

    const toCsvLine = (cells: string[]) =>
        cells
            .map((cell) => {
                const safe = String(cell).replace(/"/g, "\"\"");
                return `"${safe}"`;
            })
            .join(",");

    return [toCsvLine(header), ...rows.map((row) => toCsvLine(row))].join("\n");
}
