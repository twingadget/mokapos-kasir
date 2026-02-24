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

export function displayInvoice(order: { status: OrderStatus; id: number; invoiceNo: string }): string {
    if (order.status === OrderStatus.OPEN_BILL) {
        return `Open Bill #${order.id}`;
    }

    if (order.status === OrderStatus.WAITING) {
        return `Pesanan #${order.id}`;
    }

    return order.invoiceNo;
}
