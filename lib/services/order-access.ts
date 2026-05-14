import { OrderStatus } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";

export function canViewOrder(user: SessionUser, order: { userId: number; waiterId: number | null }): boolean {
    if (user.role === "admin" || user.role === "manager") {
        return true;
    }

    if (order.userId === user.id) {
        return true;
    }

    return user.role === "waiter" && order.waiterId === user.id;
}

export function canVoidOrder(user: SessionUser, order: { status: OrderStatus }): boolean {
    return user.role === "admin" && order.status === OrderStatus.WAITING;
}

export function canDeleteOpenBillOrder(user: SessionUser, order: { status: OrderStatus }): boolean {
    void user;
    void order;

    // return user.role === "admin" && order.status === OrderStatus.OPEN_BILL;
    return false;
}

export function resolveCashierSessionStart(user: SessionUser): Date | null {
    if (user.role !== "kasir") {
        return null;
    }

    return new Date(user.sessionStartedAt * 1000);
}

export function isOrderInActiveCashierSession(user: SessionUser, order: { orderedAt: Date }): boolean {
    return isOrderVisibleInCashierHistory(user, {
        orderedAt: order.orderedAt,
        status: OrderStatus.PAID,
    });
}

export function isOrderVisibleInCashierHistory(
    user: SessionUser,
    order: {
        orderedAt: Date;
        status: OrderStatus;
    },
): boolean {
    const sessionStart = resolveCashierSessionStart(user);
    if (!sessionStart) {
        return true;
    }

    if (order.status === OrderStatus.OPEN_BILL || order.status === OrderStatus.WAITING) {
        return true;
    }

    return order.orderedAt.getTime() >= sessionStart.getTime();
}

export function displayInvoice(order: { status: OrderStatus; id: number; invoiceNo: string }): string {
    if (order.status === OrderStatus.OPEN_BILL) {
        return `Open Bill #${order.id}`;
    }

    if (order.status === OrderStatus.WAITING) {
        return `Pesanan #${order.id}`;
    }

    return order.invoiceNo;
}
