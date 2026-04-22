"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SessionUser } from "@/lib/auth";
import FlashSessionModal from "@/components/FlashSessionModal";
import { canAccessAdminPanel, canUsePos, isWaiter } from "@/lib/roles";

type AppShellProps = {
    user: SessionUser;
    active: string;
    children: React.ReactNode;
};

type NavItem = {
    href: string;
    label: string;
    activeKey: string;
};

function navClass(isActive: boolean): string {
    return isActive ? "moka-chip moka-chip-active" : "moka-chip";
}

export default function AppShell({ user, active, children }: AppShellProps) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [logoutOpen, setLogoutOpen] = useState(false);

    const navItems = useMemo<NavItem[]>(() => {
        if (user.role === "manager") {
            return [
                { href: "/pos", label: "POS", activeKey: "manager.pos" },
                { href: "/admin/reports", label: "Laporan", activeKey: "admin.reports" },
                { href: "/admin/orders", label: "Order", activeKey: "admin.orders" },
                { href: "/admin/products", label: "Produk", activeKey: "admin.products" },
                { href: "/admin/categories", label: "Kategori", activeKey: "admin.categories" },
                { href: "/admin/payment-methods", label: "Metode Bayar", activeKey: "admin.payment-methods" },
                { href: "/admin/staff", label: "Staff", activeKey: "admin.staff" },
            ];
        }

        if (canAccessAdminPanel(user.role)) {
            return [
                { href: "/admin/reports", label: "Laporan", activeKey: "admin.reports" },
                { href: "/admin/orders", label: "Order", activeKey: "admin.orders" },
                { href: "/admin/products", label: "Produk", activeKey: "admin.products" },
                { href: "/admin/categories", label: "Kategori", activeKey: "admin.categories" },
                { href: "/admin/payment-methods", label: "Metode Bayar", activeKey: "admin.payment-methods" },
                { href: "/admin/staff", label: "Staff", activeKey: "admin.staff" },
            ];
        }

        if (isWaiter(user.role)) {
            return [
                { href: "/waiter", label: "Order", activeKey: "waiter.index" },
                { href: "/waiter/history", label: "Riwayat", activeKey: "waiter.history" },
            ];
        }

        if (canUsePos(user.role)) {
            return [
                { href: "/pos", label: "POS", activeKey: "pos.index" },
                { href: "/pos/history", label: "Riwayat", activeKey: "pos.history" },
            ];
        }

        return [];
    }, [user.role]);

    const isActive = (item: NavItem): boolean => active === item.activeKey;

    return (
        <div className="page-shell">
            <nav className="sticky top-0 z-40 border-b border-moka-line/80 bg-moka-card/90 backdrop-blur-md">
                <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <img src="/logo.png" alt="Moka POS" className="h-10 w-10 rounded-xl border border-moka-line object-cover" />
                        <div className="leading-tight">
                            <p className="font-display text-base font-bold text-moka-ink">Moka Kasir</p>
                            <p className="text-xs text-moka-muted">Bar POS</p>
                        </div>
                    </Link>

                    <div className="hidden items-center gap-2 lg:flex">
                        {navItems.map((item) => (
                            <Link key={item.href} href={item.href} className={navClass(isActive(item))}>
                                {item.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 lg:flex">
                        <Link href="/profile" className="text-sm font-semibold text-moka-muted transition hover:text-moka-ink">
                            Profil
                        </Link>
                        <button type="button" className="moka-btn-danger px-4" onClick={() => setLogoutOpen(true)}>
                            Logout
                        </button>
                    </div>

                    <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-moka-line bg-moka-card lg:hidden"
                        onClick={() => setMobileOpen((prev) => !prev)}
                        aria-label="Menu"
                    >
                        {!mobileOpen ? (
                            <svg className="h-5 w-5 text-moka-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        ) : (
                            <svg className="h-5 w-5 text-moka-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        )}
                    </button>
                </div>

                {mobileOpen ? (
                    <div className="border-t border-moka-line bg-moka-card px-4 py-3 lg:hidden">
                        <div className="grid gap-2">
                            {navItems.map((item) => (
                                <Link
                                    key={`mobile-${item.href}`}
                                    href={item.href}
                                    className={navClass(isActive(item))}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        <div className="mt-4 border-t border-moka-line pt-3">
                            <p className="text-sm font-semibold text-moka-ink">{user.name}</p>
                            <p className="text-xs text-moka-muted">{user.email}</p>
                            <div className="mt-3 flex gap-2">
                                <Link href="/profile" className="moka-btn-secondary w-full" onClick={() => setMobileOpen(false)}>
                                    Profil
                                </Link>
                                <button type="button" className="moka-btn-danger w-full" onClick={() => setLogoutOpen(true)}>
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </nav>

            <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>

            {logoutOpen ? (
                <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                    <div className="absolute inset-0 moka-modal-overlay" onClick={() => setLogoutOpen(false)} />
                    <div className="moka-modal-shell relative z-[2] max-w-md">
                        <div className="moka-modal-content">
                            <div className="moka-modal-header">
                                <div>
                                    <h3 className="moka-modal-title">Konfirmasi Logout</h3>
                                    <p className="moka-modal-subtitle">Yakin ingin keluar dari akun ini?</p>
                                </div>
                                <button type="button" className="moka-modal-close" onClick={() => setLogoutOpen(false)} aria-label="Tutup popup">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>

                            <div className="moka-modal-footer">
                                <button type="button" className="moka-btn-secondary" onClick={() => setLogoutOpen(false)}>
                                    Batal
                                </button>
                                <form method="POST" action="/logout">
                                    <button type="submit" className="moka-btn-danger">
                                        Logout
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            <FlashSessionModal />
        </div>
    );
}
