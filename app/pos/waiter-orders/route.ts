import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readSessionUser } from "@/lib/auth";
import { toNumber } from "@/lib/format";

export async function GET(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    if (user.role !== "kasir") {
        return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
        where: {
            status: OrderStatus.WAITING,
        },
        include: {
            waiter: {
                select: { name: true },
            },
            user: {
                select: { name: true },
            },
        },
        orderBy: { updatedAt: "desc" },
        take: 20,
    });

    return NextResponse.json({
        orders: orders.map((order) => ({
            id: order.id,
            total: toNumber(order.total),
            updated_at: order.updatedAt.toISOString(),
            waiter_name: order.waiter?.name ?? order.user?.name ?? "-",
        })),
    });
}
