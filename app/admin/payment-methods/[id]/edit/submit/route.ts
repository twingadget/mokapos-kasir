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

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim().toLowerCase();
    const isActive = formData.get("is_active") !== null;

    const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!paymentMethod) {
        const response = NextResponse.redirect(new URL("/admin/payment-methods", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Metode bayar tidak ditemukan." });
    }

    if (name === "") {
        const response = NextResponse.redirect(new URL(`/admin/payment-methods/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama metode wajib diisi." });
    }

    if (code === "") {
        const response = NextResponse.redirect(new URL(`/admin/payment-methods/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kode metode wajib diisi." });
    }

    if (!/^[a-z0-9_-]+$/i.test(code)) {
        const response = NextResponse.redirect(new URL(`/admin/payment-methods/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kode metode hanya boleh huruf, angka, dash, atau underscore." });
    }

    const duplicate = await prisma.paymentMethod.findFirst({
        where: {
            code,
            id: { not: id },
        },
        select: { id: true },
    });

    if (duplicate) {
        const response = NextResponse.redirect(new URL(`/admin/payment-methods/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kode metode sudah digunakan." });
    }

    await prisma.paymentMethod.update({
        where: { id },
        data: { name, code, isActive },
    });

    const response = NextResponse.redirect(new URL("/admin/payment-methods", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Berhasil menyimpan add on." });
}
