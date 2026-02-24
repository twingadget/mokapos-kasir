import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const code = String(formData.get("code") ?? "").trim().toLowerCase();
    const isActive = formData.get("is_active") !== null;

    if (name === "") {
        const response = NextResponse.redirect(new URL("/admin/payment-methods/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama metode wajib diisi." });
    }

    if (code === "") {
        const response = NextResponse.redirect(new URL("/admin/payment-methods/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kode metode wajib diisi." });
    }

    if (!/^[a-z0-9_-]+$/i.test(code)) {
        const response = NextResponse.redirect(new URL("/admin/payment-methods/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kode metode hanya boleh huruf, angka, dash, atau underscore." });
    }

    const exists = await prisma.paymentMethod.findUnique({
        where: { code },
        select: { id: true },
    });

    if (exists) {
        const response = NextResponse.redirect(new URL("/admin/payment-methods/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kode metode sudah digunakan." });
    }

    await prisma.paymentMethod.create({
        data: { name, code, isActive },
    });

    const response = NextResponse.redirect(new URL("/admin/payment-methods", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Berhasil menyimpan add on." });
}
