import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function authenticateUser(email: string, password: string): Promise<{
    id: number;
    name: string;
    email: string;
    role: "admin" | "kasir" | "waiter" | "manager";
} | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
        return null;
    }

    const user = await prisma.user.findFirst({
        where: {
            email: {
                equals: normalizedEmail,
                mode: "insensitive",
            },
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true,
        },
    });

    if (!user) {
        return null;
    }

    // Support legacy Laravel bcrypt hashes that use "$2y$" prefix.
    // bcryptjs compares correctly with "$2a$/$2b$", so normalize first.
    const normalizedHash = user.password.startsWith("$2y$")
        ? `$2b$${user.password.slice(4)}`
        : user.password;

    const ok = await bcrypt.compare(password, normalizedHash);
    if (!ok) {
        return null;
    }

    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
    };
}
