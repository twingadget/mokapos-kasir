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

    const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
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

    const ok = await bcrypt.compare(password, user.password);
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
