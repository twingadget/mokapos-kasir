import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const sessionUser = readSessionUser(request);
    if (!sessionUser) {
        return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();

    if (!name) {
        const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama wajib diisi." });
    }

    if (sessionUser.role === "admin") {
        if (!email) {
            const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
            return withFlash(response, { type: "error", message: "Email wajib diisi." });
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
            return withFlash(response, { type: "error", message: "Format email tidak valid." });
        }

        const duplicate = await prisma.user.findFirst({
            where: {
                email,
                id: { not: sessionUser.id },
            },
            select: { id: true },
        });

        if (duplicate) {
            const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
            return withFlash(response, { type: "error", message: "Email sudah digunakan." });
        }

        await prisma.user.update({
            where: { id: sessionUser.id },
            data: {
                name,
                email,
            },
        });
    } else {
        await prisma.user.update({
            where: { id: sessionUser.id },
            data: { name },
        });
    }

    const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Profil berhasil diperbarui." });
}
