import type { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { attachSession } from "@/lib/auth";
import { canAccessAdminPanel, isWaiter } from "@/lib/roles";
import { authenticateUser } from "@/lib/services/auth";

function isJsonRequest(request: NextRequest): boolean {
    const contentType = request.headers.get("content-type") ?? "";
    const accept = request.headers.get("accept") ?? "";
    return contentType.includes("application/json") || accept.includes("application/json");
}

function safeRedirectPath(input: string | null | undefined): string | null {
    if (!input) {
        return null;
    }

    if (!input.startsWith("/") || input.startsWith("//")) {
        return null;
    }

    return input;
}

function roleHomePath(role: Role): string {
    if (canAccessAdminPanel(role)) {
        return "/admin/reports";
    }

    if (isWaiter(role)) {
        return "/waiter";
    }

    return "/pos";
}

function resolveRedirectTarget(input: string | null | undefined, role: Role): string {
    const safePath = safeRedirectPath(input);
    if (!safePath || safePath === "/") {
        return roleHomePath(role);
    }

    return safePath;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const wantsJson = isJsonRequest(request);
    let email = "";
    let password = "";
    let redirectTarget: string | null = null;

    if ((request.headers.get("content-type") ?? "").includes("application/json")) {
        const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
        email = String(body.email ?? "");
        password = String(body.password ?? "");
        redirectTarget = body.redirect ? String(body.redirect) : null;
    } else {
        const formData = await request.formData();
        email = String(formData.get("email") ?? "");
        password = String(formData.get("password") ?? "");
        redirectTarget = formData.get("redirect") ? String(formData.get("redirect")) : null;
    }

    const errors: Record<string, string[]> = {};
    if (email.trim() === "") {
        errors.email = ["Email wajib diisi."];
    }
    if (password.trim() === "") {
        errors.password = ["Password wajib diisi."];
    }

    if (Object.keys(errors).length > 0) {
        if (wantsJson) {
            return NextResponse.json({ message: "Validasi gagal.", errors }, { status: 422 });
        }

        return NextResponse.redirect(new URL("/login?error=validation", request.url), { status: 303 });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
        if (wantsJson) {
            return NextResponse.json(
                {
                    message: "Autentikasi gagal.",
                    errors: { email: ["Username / password belum sesuai."] },
                },
                { status: 422 },
            );
        }

        return NextResponse.redirect(new URL("/login?error=credentials", request.url), { status: 303 });
    }

    const target = resolveRedirectTarget(redirectTarget, user.role);
    const response = NextResponse.redirect(new URL(target, request.url), { status: 303 });

    return attachSession(response, {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    });
}
