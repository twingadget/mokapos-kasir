import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { getPosBootstrapData } from "@/lib/services/pos-data";
import { renderPosPage } from "@/lib/templates/pos";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }

    if (user.role !== "waiter") {
        return new NextResponse("Forbidden", { status: 403 });
    }

    const waiterOrder = request.nextUrl.searchParams.get("waiter_order");

    const payload = await getPosBootstrapData({
        userId: user.id,
        mode: "waiter",
        resumeWaiterOrderId: waiterOrder ? Number(waiterOrder) : null,
    });

    const html = renderPosPage({
        mode: "waiter",
        user,
        payload: {
            categories: payload.categories,
            products: payload.products,
            addons: payload.addons,
            paymentMethods: [],
            openBills: [],
            waiterOrders: [],
            resumeOpenBill: null,
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
