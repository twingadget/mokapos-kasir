import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { restoreStockFromOrder } from "@/lib/services/orders";

type Context = {
    params: Promise<{ id: string }>;
};

function resolveRedirectTarget(request: NextRequest, orderId: number): URL {
    const fallback = new URL("/admin/orders", request.url);
    const referer = request.headers.get("referer");

    if (!referer) {
        return fallback;
    }

    try {
        const refererUrl = new URL(referer);
        const requestUrl = new URL(request.url);
        if (refererUrl.origin !== requestUrl.origin) {
            return fallback;
        }

        if (refererUrl.pathname === `/admin/orders/${orderId}`) {
            return fallback;
        }

        if (refererUrl.pathname.startsWith("/admin/orders") || refererUrl.pathname.startsWith("/admin/reports")) {
            return new URL(`${refererUrl.pathname}${refererUrl.search}`, request.url);
        }
    } catch {
        return fallback;
    }

    return fallback;
}

export async function POST(request: NextRequest, context: Context): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url), { status: 303 });
    }

    const params = await context.params;
    const id = Number(params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.redirect(new URL("/admin/orders", request.url), { status: 303 });
    }

    // Temporary production hide: keep the delete implementation below for quick re-enable later.
    const disabledResponse = NextResponse.redirect(resolveRedirectTarget(request, id), { status: 303 });
    return withFlash(disabledResponse, { type: "error", message: "Fitur hapus open bill sedang disembunyikan sementara." });

    let deleted = false;

    await prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                trackStock: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order || order.status !== OrderStatus.OPEN_BILL) {
            return;
        }

        await restoreStockFromOrder(tx, order);
        await tx.order.delete({ where: { id: order.id } });
        deleted = true;
    });

    const response = NextResponse.redirect(resolveRedirectTarget(request, id), { status: 303 });

    if (deleted) {
        return withFlash(response, { type: "success", message: "Open bill berhasil dihapus." });
    }

    return withFlash(response, { type: "error", message: "Open bill tidak bisa dihapus." });
}
