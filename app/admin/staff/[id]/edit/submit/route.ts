import bcrypt from "bcryptjs";
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
        return NextResponse.redirect(new URL("/admin/staff", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("password_confirmation") ?? "");
    const role = String(formData.get("role") ?? "kasir");

    const staff = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true },
    });

    if (!staff || !["kasir", "waiter", "manager"].includes(staff.role)) {
        const response = NextResponse.redirect(new URL("/admin/staff", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Staff tidak ditemukan." });
    }

    if (name === "") {
        const response = NextResponse.redirect(new URL(`/admin/staff/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama staff wajib diisi." });
    }

    if (email === "") {
        const response = NextResponse.redirect(new URL(`/admin/staff/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Email wajib diisi." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const response = NextResponse.redirect(new URL(`/admin/staff/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Format email tidak valid." });
    }

    if (!["kasir", "waiter", "manager"].includes(role)) {
        const response = NextResponse.redirect(new URL(`/admin/staff/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Role staff tidak valid." });
    }

    const duplicateEmail = await prisma.user.findFirst({
        where: {
            email,
            id: { not: id },
        },
        select: { id: true },
    });

    if (duplicateEmail) {
        const response = NextResponse.redirect(new URL(`/admin/staff/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Email sudah digunakan." });
    }

    if (password !== "" && password.length < 6) {
        const response = NextResponse.redirect(new URL(`/admin/staff/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Password minimal 6 karakter." });
    }

    if (password !== "" && password !== passwordConfirmation) {
        const response = NextResponse.redirect(new URL(`/admin/staff/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Konfirmasi password tidak sama." });
    }

    const data: Record<string, unknown> = {
        name,
        email,
        role,
    };

    if (password !== "") {
        data.password = await bcrypt.hash(password, 10);
    }

    await prisma.user.update({
        where: { id },
        data,
    });

    const response = NextResponse.redirect(new URL("/admin/staff", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Berhasil menyimpan staff." });
}
