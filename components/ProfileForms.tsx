"use client";

import { useRef, useState } from "react";
import type { Role } from "@prisma/client";

type ProfileFormsProps = {
    role: Role;
    name: string;
    email: string;
};

function EyeIcon({ visible }: { visible: boolean }) {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            {!visible ? (
                <>
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                </>
            ) : (
                <>
                    <path d="M17.94 17.94A10.94 10.94 0 0112 19C5 19 1 12 1 12a21.77 21.77 0 015.06-6.94" />
                    <path d="M9.9 4.24A10.94 10.94 0 0112 5c7 0 11 7 11 7a21.86 21.86 0 01-3.17 4.49" />
                    <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                </>
            )}
        </svg>
    );
}

export default function ProfileForms({ role, name, email }: ProfileFormsProps) {
    const canUpdateEmail = role === "admin";
    const isAdmin = role === "admin";

    const profileFormRef = useRef<HTMLFormElement | null>(null);
    const passwordFormRef = useRef<HTMLFormElement | null>(null);

    const [profileConfirmOpen, setProfileConfirmOpen] = useState(false);
    const [passwordConfirmOpen, setPasswordConfirmOpen] = useState(false);
    const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <div className="grid gap-5">
            <div className="soft-card p-5">
                <header>
                    <h2 className="font-display text-xl font-bold text-moka-ink">Informasi Akun</h2>
                    <p className="mt-1 text-sm text-moka-muted">{canUpdateEmail ? "Perbarui nama dan email admin." : "Perbarui nama akun."}</p>
                </header>

                <form
                    ref={profileFormRef}
                    method="POST"
                    action="/profile/update"
                    className="mt-6 grid gap-4"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setProfileConfirmOpen(true);
                    }}
                >
                    <div>
                        <label htmlFor="name" className="moka-label">
                            Nama
                        </label>
                        <input id="name" name="name" type="text" className="moka-input mt-1 block w-full" defaultValue={name} required autoFocus autoComplete="name" />
                    </div>

                    <div>
                        <label htmlFor="email" className="moka-label">
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            className={`moka-input mt-1 block w-full ${canUpdateEmail ? "" : "bg-moka-soft/60 text-moka-ink"}`}
                            defaultValue={email}
                            required={canUpdateEmail}
                            readOnly={!canUpdateEmail}
                            autoComplete="username"
                        />
                        <p className="mt-2 text-xs text-moka-muted">
                            {canUpdateEmail ? "Anda dapat mengganti email login admin di sini." : "Email hanya bisa diubah oleh admin."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button type="submit" className="moka-btn">
                            Simpan
                        </button>
                    </div>
                </form>
            </div>

            {isAdmin ? (
                <div className="soft-card p-5">
                    <header>
                        <h2 className="font-display text-xl font-bold text-moka-ink">Ubah Password</h2>
                        <p className="mt-1 text-sm text-moka-muted">Gunakan password panjang dan unik untuk keamanan akun.</p>
                    </header>

                    <form
                        ref={passwordFormRef}
                        method="POST"
                        action="/profile/password"
                        className="mt-6 grid gap-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            setPasswordConfirmOpen(true);
                        }}
                    >
                        <div>
                            <label htmlFor="current_password" className="moka-label">
                                Password Saat Ini
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="current_password"
                                    name="current_password"
                                    type={showCurrentPassword ? "text" : "password"}
                                    className="moka-input block w-full pr-12"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-moka-muted transition hover:text-moka-primary"
                                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                                    aria-label={showCurrentPassword ? "Sembunyikan password saat ini" : "Tampilkan password saat ini"}
                                >
                                    <EyeIcon visible={showCurrentPassword} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="moka-label">
                                Password Baru
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type={showNewPassword ? "text" : "password"}
                                    className="moka-input block w-full pr-12"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-moka-muted transition hover:text-moka-primary"
                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                    aria-label={showNewPassword ? "Sembunyikan password baru" : "Tampilkan password baru"}
                                >
                                    <EyeIcon visible={showNewPassword} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password_confirmation" className="moka-label">
                                Konfirmasi Password Baru
                            </label>
                            <div className="relative mt-1">
                                <input
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="moka-input block w-full pr-12"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-moka-muted transition hover:text-moka-primary"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    aria-label={showConfirmPassword ? "Sembunyikan konfirmasi password baru" : "Tampilkan konfirmasi password baru"}
                                >
                                    <EyeIcon visible={showConfirmPassword} />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <button type="submit" className="moka-btn">
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            ) : null}

            {isAdmin ? (
                <div className="soft-card p-5">
                    <section className="space-y-5">
                        <header>
                            <h2 className="font-display text-xl font-bold text-moka-ink">Hapus Akun</h2>
                            <p className="mt-1 text-sm text-moka-muted">Tindakan ini permanen. Semua data akun akan dihapus dan tidak bisa dipulihkan.</p>
                        </header>

                        <button type="button" className="moka-btn-danger" onClick={() => setDeleteAccountOpen(true)}>
                            Hapus Akun
                        </button>
                    </section>
                </div>
            ) : null}

            {profileConfirmOpen ? (
                <div className="fixed inset-0 z-[120]">
                    <div className="absolute inset-0 moka-modal-overlay backdrop-blur-sm" onClick={() => setProfileConfirmOpen(false)} />
                    <div
                        className="moka-modal-shell absolute w-[calc(100vw-2rem)] overflow-hidden"
                        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", maxWidth: "28rem" }}
                    >
                        <div className="moka-modal-content">
                            <div className="moka-modal-header">
                                <div>
                                    <h3 className="moka-modal-title">Konfirmasi Simpan</h3>
                                    <p className="moka-modal-subtitle">Simpan perubahan informasi akun?</p>
                                </div>
                                <button
                                    type="button"
                                    className="moka-modal-close"
                                    onClick={() => setProfileConfirmOpen(false)}
                                    aria-label="Tutup popup"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>

                            <div className="moka-modal-footer">
                                <button type="button" className="moka-btn-secondary" onClick={() => setProfileConfirmOpen(false)}>
                                    Batal
                                </button>
                                <button type="button" className="moka-btn" onClick={() => profileFormRef.current?.requestSubmit()}>
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {isAdmin && passwordConfirmOpen ? (
                <div className="fixed inset-0 z-[120]">
                    <div className="absolute inset-0 moka-modal-overlay backdrop-blur-sm" onClick={() => setPasswordConfirmOpen(false)} />
                    <div
                        className="moka-modal-shell absolute w-[calc(100vw-2rem)] overflow-hidden"
                        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", maxWidth: "28rem" }}
                    >
                        <div className="moka-modal-content">
                            <div className="moka-modal-header">
                                <div>
                                    <h3 className="moka-modal-title">Konfirmasi Password</h3>
                                    <p className="moka-modal-subtitle">Ubah password akun sekarang?</p>
                                </div>
                                <button
                                    type="button"
                                    className="moka-modal-close"
                                    onClick={() => setPasswordConfirmOpen(false)}
                                    aria-label="Tutup popup"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>

                            <div className="moka-modal-footer">
                                <button type="button" className="moka-btn-secondary" onClick={() => setPasswordConfirmOpen(false)}>
                                    Batal
                                </button>
                                <button type="button" className="moka-btn" onClick={() => passwordFormRef.current?.requestSubmit()}>
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}

            {isAdmin && deleteAccountOpen ? (
                <div className="fixed inset-0 z-[120]">
                    <div className="absolute inset-0 moka-modal-overlay backdrop-blur-sm" onClick={() => setDeleteAccountOpen(false)} />
                    <div
                        className="moka-modal-shell absolute w-[calc(100vw-2rem)] overflow-hidden"
                        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", maxWidth: "28rem" }}
                    >
                        <form method="POST" action="/profile/delete" className="moka-modal-content">
                            <div className="moka-modal-header">
                                <div>
                                    <h3 className="moka-modal-title">Yakin ingin menghapus akun?</h3>
                                    <p className="moka-modal-subtitle">Masukkan password untuk konfirmasi penghapusan akun.</p>
                                </div>
                                <button
                                    type="button"
                                    className="moka-modal-close"
                                    onClick={() => setDeleteAccountOpen(false)}
                                    aria-label="Tutup popup"
                                >
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>

                            <div className="mt-4">
                                <label htmlFor="delete_account_password" className="moka-label">
                                    Password
                                </label>
                                <input id="delete_account_password" name="password" type="password" className="moka-input mt-1 block w-full" required />
                            </div>

                            <div className="moka-modal-footer mt-6">
                                <button type="button" className="moka-btn-secondary" onClick={() => setDeleteAccountOpen(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="moka-btn-danger">
                                    Hapus Permanen
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
