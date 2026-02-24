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
        return NextResponse.redirect(new URL("/admin/payment-methods", request.url), { status: 303 });
    }

    try {
        await prisma.paymentMethod.delete({ where: { id } });
    } catch {
        const response = NextResponse.redirect(new URL("/admin/payment-methods", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Metode bayar tidak bisa dihapus." });
    }

    const response = NextResponse.redirect(new URL("/admin/payment-methods", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Metode bayar berhasil dihapus." });
}
