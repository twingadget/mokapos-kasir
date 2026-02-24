import bcrypt from "bcryptjs";
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
    const currentPassword = String(formData.get("current_password") ?? "");
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(formData.get("password_confirmation") ?? "");

    if (!currentPassword || !password || password !== passwordConfirmation || password.length < 6) {
        const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Validasi perubahan password gagal." });
    }

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, password: true },
    });

    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
        const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Password saat ini tidak sesuai." });
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            password: await bcrypt.hash(password, 10),
        },
    });

    const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Password diperbarui." });
}
