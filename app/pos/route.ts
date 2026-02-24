import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { getPosBootstrapData } from "@/lib/services/pos-data";
import { renderPosPage } from "@/lib/templates/pos";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }

    if (user.role !== "kasir") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const openBill = request.nextUrl.searchParams.get("open_bill");
    const waiterOrder = request.nextUrl.searchParams.get("waiter_order");

    const payload = await getPosBootstrapData({
        userId: user.id,
        mode: "kasir",
        resumeOpenBillId: openBill ? Number(openBill) : null,
        resumeWaiterOrderId: waiterOrder ? Number(waiterOrder) : null,
    });

    const html = renderPosPage({
        mode: "kasir",
        user,
        payload: {
            categories: payload.categories,
            products: payload.products,
            addons: payload.addons,
            paymentMethods: payload.paymentMethods,
            openBills: payload.openBills,
            waiterOrders: payload.waiterOrders,
            resumeOpenBill: payload.resumeOpenBill,
            resumeWaiterOrder: payload.resumeWaiterOrder,
        },
    });

    return new NextResponse(html, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}
