import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";

type Context = {
    params: Promise<{ id: string }>;
};

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

    let voided = false;

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

        if (!order || order.status !== OrderStatus.WAITING) {
            return;
        }

        for (const item of order.items) {
            if (!item.product || !item.product.trackStock) {
                continue;
            }

            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stockQty: {
                        increment: item.qty,
                    },
                },
            });
        }

        await tx.order.update({
            where: { id: order.id },
            data: {
                status: OrderStatus.VOID,
                paymentMethod: "CANCELED",
            },
        });

        voided = true;
    });

    const referer = request.headers.get("referer");
    const response = NextResponse.redirect(new URL(referer || "/admin/orders", request.url), { status: 303 });

    if (voided) {
        return withFlash(response, { type: "success", message: "Pesanan berhasil dibatalkan." });
    }

    return withFlash(response, { type: "error", message: "Pesanan tidak bisa dibatalkan." });
}
