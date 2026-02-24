import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { clearSession, readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const sessionUser = readSessionUser(request);
    if (!sessionUser) {
        return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const password = String(formData.get("password") ?? "");

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, password: true },
    });

    if (!user) {
        return clearSession(NextResponse.redirect(new URL("/login", request.url), { status: 303 }));
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
        const response = NextResponse.redirect(new URL("/profile", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Password tidak sesuai." });
    }

    await prisma.user.delete({
        where: { id: user.id },
    });

    return clearSession(NextResponse.redirect(new URL("/login", request.url), { status: 303 }));
}
