import { Role } from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/constants";

function resolveSessionTtlSeconds(): number {
    const value = Number.parseInt(process.env.SESSION_TTL_MINUTES ?? "120", 10);
    if (!Number.isFinite(value) || value <= 0) {
        return 60 * 60 * 2;
    }

    return value * 60;
}

const SESSION_TTL_SECONDS = resolveSessionTtlSeconds();

export type SessionUser = {
    id: number;
    name: string;
    email: string;
    role: Role;
};

type SessionTokenPayload = {
    sub: number;
    name: string;
    email: string;
    role: Role;
    exp: number;
};

function getSecret(): string {
    return process.env.AUTH_SECRET || process.env.APP_KEY || "change-me-in-env";
}

function base64url(value: string): string {
    return Buffer.from(value, "utf8").toString("base64url");
}

function signPayload(payload: string): string {
    return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodeToken(payload: SessionTokenPayload): string {
    const encodedPayload = base64url(JSON.stringify(payload));
    const signature = signPayload(encodedPayload);
    return `${encodedPayload}.${signature}`;
}

function decodeToken(token: string): SessionTokenPayload | null {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) {
        return null;
    }

    const expectedSignature = signPayload(encodedPayload);
    const a = Buffer.from(signature);
    const b = Buffer.from(expectedSignature);

    if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return null;
    }

    try {
        const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as SessionTokenPayload;

        if (
            typeof payload.sub !== "number" ||
            typeof payload.name !== "string" ||
            typeof payload.email !== "string" ||
            typeof payload.role !== "string" ||
            typeof payload.exp !== "number"
        ) {
            return null;
        }

        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return payload;
    } catch {
        return null;
    }
}

export function readSessionUserFromToken(token: string | undefined | null): SessionUser | null {
    if (!token) {
        return null;
    }

    const payload = decodeToken(token);
    if (!payload) {
        return null;
    }

    return {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: payload.role,
    };
}

export function readSessionUser(request: NextRequest): SessionUser | null {
    return readSessionUserFromToken(request.cookies.get(SESSION_COOKIE)?.value);
}

export function sessionHasRole(user: SessionUser | null, roles: Role[]): boolean {
    if (!user) {
        return false;
    }

    return roles.includes(user.role);
}

export function redirectToLogin(request: NextRequest): NextResponse {
    const loginUrl = new URL("/login", request.url);
    if (!request.nextUrl.pathname.startsWith("/login")) {
        loginUrl.searchParams.set("redirect", request.nextUrl.pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
}

export function attachSession(response: NextResponse, user: SessionUser): NextResponse {
    const payload: SessionTokenPayload = {
        sub: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
    };

    response.cookies.set(SESSION_COOKIE, encodeToken(payload), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_TTL_SECONDS,
    });

    return response;
}

export function clearSession(response: NextResponse): NextResponse {
    response.cookies.set(SESSION_COOKIE, "", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 0,
    });

    return response;
}
