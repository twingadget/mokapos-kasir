import type { Role } from "@prisma/client";

export function isAdmin(role: Role): boolean {
    return role === "admin";
}

export function isManager(role: Role): boolean {
    return role === "manager";
}

export function isKasir(role: Role): boolean {
    return role === "kasir";
}

export function isWaiter(role: Role): boolean {
    return role === "waiter";
}

export function canAccessAdminPanel(role: Role): boolean {
    return role === "admin" || role === "manager";
}
