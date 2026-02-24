import { OrderStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { normalizeOrderBody } from "@/lib/services/order-payload";
import { OrderValidationError, persistOrderFromPayload } from "@/lib/services/orders";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user) {
        return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
    }

    if (user.role !== "waiter") {
        return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    try {
        const body = (await request.json()) as unknown;
        const normalized = normalizeOrderBody(body, { requirePaymentMethod: false });

        const order = await persistOrderFromPayload({
            userId: user.id,
            targetStatus: OrderStatus.WAITING,
            items: normalized.items,
            discountType: normalized.discountType,
            discountValue: normalized.discountValue,
            taxPercent: normalized.taxPercent,
            service: normalized.service,
            openBillId: normalized.openBillId,
            notes: normalized.notes,
        });

        return NextResponse.json({
            order_id: order.id,
            message: "Pesanan berhasil dikirim ke kasir.",
        });
    } catch (error) {
        if (error instanceof OrderValidationError) {
            return NextResponse.json({ message: error.message, errors: error.issues }, { status: 422 });
        }

        return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
    }
}
