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

    if (user.role !== "kasir") {
        return NextResponse.json({ message: "Forbidden." }, { status: 403 });
    }

    try {
        const body = (await request.json()) as unknown;
        const normalized = normalizeOrderBody(body, { requirePaymentMethod: true });

        const order = await persistOrderFromPayload({
            userId: user.id,
            targetStatus: OrderStatus.PAID,
            items: normalized.items,
            discountType: normalized.discountType,
            discountValue: normalized.discountValue,
            taxPercent: normalized.taxPercent,
            service: normalized.service,
            openBillId: normalized.openBillId,
            paymentMethodId: normalized.paymentMethodId,
            cashReceived: normalized.cashReceived,
            notes: normalized.notes,
        });

        return NextResponse.json({
            redirect: `/orders/${order.id}/receipt?autoprint=1`,
        });
    } catch (error) {
        if (error instanceof OrderValidationError) {
            return NextResponse.json({ message: error.message, errors: error.issues }, { status: 422 });
        }

        return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
    }
}
