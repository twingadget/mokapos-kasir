import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { SESSION_COOKIE } from "@/lib/constants";
import { readSessionUserFromToken, type SessionUser } from "@/lib/auth";

export async function getServerSessionUser(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    return readSessionUserFromToken(cookieStore.get(SESSION_COOKIE)?.value);
}

export async function requireServerSessionUser(allowedRoles?: Role[]): Promise<SessionUser> {
    const user = await getServerSessionUser();
    if (!user) {
        redirect("/login");
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        redirect("/");
    }

    return user;
}
