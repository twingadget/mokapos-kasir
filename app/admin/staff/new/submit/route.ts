import bcrypt from "bcryptjs";
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
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("password_confirmation") ?? "");
    const role = String(formData.get("role") ?? "kasir");

    if (name === "") {
        const response = NextResponse.redirect(new URL("/admin/staff/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama staff wajib diisi." });
    }

    if (email === "") {
        const response = NextResponse.redirect(new URL("/admin/staff/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Email wajib diisi." });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        const response = NextResponse.redirect(new URL("/admin/staff/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Format email tidak valid." });
    }

    if (!["kasir", "waiter", "manager"].includes(role)) {
        const response = NextResponse.redirect(new URL("/admin/staff/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Role staff tidak valid." });
    }

    if (password.length < 6) {
        const response = NextResponse.redirect(new URL("/admin/staff/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Password minimal 6 karakter." });
    }

    if (password !== passwordConfirmation) {
        const response = NextResponse.redirect(new URL("/admin/staff/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Konfirmasi password tidak sama." });
    }

    const existing = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
    });

    if (existing) {
        const response = NextResponse.redirect(new URL("/admin/staff/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Email sudah digunakan." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
        data: {
            name,
            email,
            password: passwordHash,
            role: role as "kasir" | "waiter" | "manager",
            emailVerifiedAt: new Date(),
        },
    });

    const response = NextResponse.redirect(new URL("/admin/staff", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Berhasil menyimpan staff." });
}
