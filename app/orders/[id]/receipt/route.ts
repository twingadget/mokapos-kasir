import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { canViewOrder, isOrderInActiveCashierSession } from "@/lib/services/order-access";
import { prisma } from "@/lib/prisma";
import { renderReceiptPage } from "@/lib/templates/receipt";

type Context = {
    params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: Context): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const params = await context.params;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return new NextResponse("Not Found", { status: 404 });
    }

    const order = await prisma.order.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                },
            },
            items: {
                include: {
                    addons: true,
                },
                orderBy: { id: "asc" },
            },
        },
    });

    if (!order || order.status !== OrderStatus.PAID) {
        return new NextResponse("Not Found", { status: 404 });
    }

    if (!canViewOrder(user, order)) {
        return new NextResponse("Forbidden", { status: 403 });
    }

    if (!isOrderInActiveCashierSession(user, order)) {
        return NextResponse.redirect(new URL("/pos/history", request.url), { status: 303 });
    }

    const autoPrint = request.nextUrl.searchParams.get("autoprint") === "1";
    const html = renderReceiptPage({
        user,
        order: {
            id: order.id,
            invoiceNo: order.invoiceNo,
            orderedAt: order.orderedAt,
            paymentMethod: order.paymentMethod,
            subtotal: Number(order.subtotal),
            discountType: order.discountType,
            discountValue: Number(order.discountValue),
            tax: Number(order.tax),
            service: Number(order.service),
            total: Number(order.total),
            cashReceived: order.cashReceived === null ? null : Number(order.cashReceived),
            change: order.change === null ? null : Number(order.change),
            userName: order.user?.name ?? "-",
            items: order.items.map((item) => ({
                nameSnapshot: item.nameSnapshot,
                qty: item.qty,
                price: Number(item.price),
                lineTotal: Number(item.lineTotal),
                notes: item.notes,
                addons: item.addons.map((addon) => ({
                    nameSnapshot: addon.nameSnapshot,
                    price: Number(addon.price),
                })),
            })),
        },
        autoPrint,
    });

    return new NextResponse(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}
