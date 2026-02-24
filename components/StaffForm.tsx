"use client";

import Link from "next/link";
import { useState } from "react";

type StaffFormProps = {
    action: string;
    submitLabel: string;
    cancelHref: string;
    isEdit?: boolean;
    initial?: {
        name: string;
        role: "kasir" | "waiter" | "manager";
        email: string;
    };
};

function EyeIcon({ visible }: { visible: boolean }) {
    return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            {!visible ? (
                <>
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                </>
            ) : (
                <>
                    <path d="M3 3l18 18" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeWidth="1.8" strokeLinecap="round" />
                    <path d="M9.9 5.1A11.2 11.2 0 0112 5c6.5 0 10 7 10 7a17.8 17.8 0 01-4.2 4.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6.3 6.3C3.8 8.1 2 12 2 12s3.5 6 10 6c1.4 0 2.6-.2 3.8-.6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </>
            )}
        </svg>
    );
}

export default function StaffForm({ action, submitLabel, cancelHref, isEdit = false, initial }: StaffFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

    return (
        <form method="POST" action={action} className="space-y-5">
            <div className="space-y-4">
                <div>
                    <label htmlFor="name" className="moka-label">
                        Nama Staff
                    </label>
                    <input id="name" name="name" type="text" className="moka-input mt-1 block w-full" defaultValue={initial?.name ?? ""} required autoFocus />
                </div>

                <div>
                    <label htmlFor="role" className="moka-label">
                        Role
                    </label>
                    <select id="role" name="role" className="moka-select mt-1 block w-full" required defaultValue={initial?.role ?? "kasir"}>
                        <option value="kasir">Kasir</option>
                        <option value="waiter">Waiter</option>
                        <option value="manager">Manager</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="email" className="moka-label">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className="moka-input mt-1 block w-full"
                        defaultValue={initial?.email ?? ""}
                        required
                        autoComplete="username"
                    />
                </div>

                <div>
                    <label htmlFor="password" className="moka-label">
                        Password
                    </label>
                    <div className="relative mt-1">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            className="moka-input block w-full pr-11"
                            required={!isEdit}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-moka-muted transition hover:text-moka-ink"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                        >
                            <EyeIcon visible={showPassword} />
                        </button>
                    </div>
                    {isEdit ? <p className="moka-helper mt-1">Kosongkan jika tidak ingin mengubah password.</p> : null}
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="moka-label">
                        Konfirmasi Password
                    </label>
                    <div className="relative mt-1">
                        <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type={showPasswordConfirmation ? "text" : "password"}
                            className="moka-input block w-full pr-11"
                            required={!isEdit}
                            autoComplete="new-password"
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-moka-muted transition hover:text-moka-ink"
                            onClick={() => setShowPasswordConfirmation((prev) => !prev)}
                            aria-label={showPasswordConfirmation ? "Sembunyikan konfirmasi password" : "Lihat konfirmasi password"}
                        >
                            <EyeIcon visible={showPasswordConfirmation} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Link href={cancelHref} className="moka-btn-secondary">
                    Batal
                </Link>
                <button type="submit" className="moka-btn">
                    {submitLabel}
                </button>
            </div>
        </form>
    );
}
