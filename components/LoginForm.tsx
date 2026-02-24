"use client";

import { useEffect, useRef, useState } from "react";

type LoginFormProps = {
    initialError?: string;
    redirect?: string;
};

type AlertTone = "success" | "warning" | "error";

function iconPath(show: boolean) {
    if (!show) {
        return (
            <>
                <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
            </>
        );
    }

    return (
        <>
            <path d="M3 3l18 18" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M10.6 10.6a2 2 0 002.8 2.8" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M9.9 5.1A11.2 11.2 0 0112 5c6.5 0 10 7 10 7a17.8 17.8 0 01-4.2 4.8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M6.3 6.3C3.8 8.1 2 12 2 12s3.5 6 10 6c1.4 0 2.6-.2 3.8-.6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
    );
}

function hasRequiredError(errors: unknown): boolean {
    if (!Array.isArray(errors)) {
        return false;
    }

    return errors.some((message) => /(required|wajib|harus diisi|field is required)/i.test(String(message)));
}

export default function LoginForm({ initialError, redirect }: LoginFormProps) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [remember, setRemember] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [alertOpen, setAlertOpen] = useState(false);
    const [alertTone, setAlertTone] = useState<AlertTone>("success");
    const [alertTitle, setAlertTitle] = useState("");
    const [alertMessage, setAlertMessage] = useState("");
    const [afterCloseHref, setAfterCloseHref] = useState<string | null>(null);

    const closeAlert = () => {
        setAlertOpen(false);

        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        if (afterCloseHref) {
            const href = afterCloseHref;
            setAfterCloseHref(null);
            window.location.href = href;
        }
    };

    const showAlert = (title: string, message: string, tone: AlertTone, options?: { autoCloseMs?: number; href?: string }) => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }

        setAlertTitle(title);
        setAlertMessage(message);
        setAlertTone(tone);
        setAfterCloseHref(options?.href ?? null);
        setAlertOpen(true);

        if (options?.autoCloseMs) {
            closeTimerRef.current = setTimeout(() => {
                closeAlert();
            }, options.autoCloseMs);
        }
    };

    useEffect(() => {
        if (!initialError) {
            return;
        }

        if (initialError === "validation") {
            showAlert("Validasi login", "mohon diisi terlebih dahulu email dan passwordnya!", "warning");
            return;
        }

        showAlert("Login gagal", "username / password belum sesuai, mohon dicek lagi!", "error");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialError]);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            }
        };
    }, []);

    const alertToneClass =
        alertTone === "error" ? "moka-alert-error" : alertTone === "warning" ? "moka-alert-warning" : "moka-alert-success";
    const alertSubtitle =
        alertTone === "error"
            ? "Periksa kembali email dan password."
            : alertTone === "warning"
              ? "Input login belum lengkap."
              : "Proses login berhasil.";

    const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const normalizedEmail = email.trim();
        const normalizedPassword = password.trim();

        if (normalizedEmail === "" && normalizedPassword === "") {
            showAlert("Validasi login", "mohon diisi terlebih dahulu email dan passwordnya!", "warning");
            return;
        }

        if (normalizedEmail === "") {
            showAlert("Validasi login", "mohon isi email terlebih dahulu!", "warning");
            return;
        }

        if (normalizedPassword === "") {
            showAlert("Validasi login", "mohon isi password terlebih dahulu!", "warning");
            return;
        }

        if (!formRef.current) {
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData(formRef.current);
            if (remember) {
                formData.set("remember", "on");
            } else {
                formData.delete("remember");
            }

            const response = await fetch(formRef.current.action, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                },
                body: formData,
                credentials: "same-origin",
            });

            if (response.status === 422) {
                const data = (await response.json().catch(() => ({}))) as {
                    errors?: Record<string, string[]>;
                };

                const emailErrors = data.errors?.email ?? [];
                const passwordErrors = data.errors?.password ?? [];

                if (hasRequiredError(emailErrors) && hasRequiredError(passwordErrors)) {
                    showAlert("Validasi login", "mohon diisi terlebih dahulu email dan passwordnya!", "warning");
                    return;
                }

                if (hasRequiredError(emailErrors)) {
                    showAlert("Validasi login", "mohon isi email terlebih dahulu!", "warning");
                    return;
                }

                if (hasRequiredError(passwordErrors)) {
                    showAlert("Validasi login", "mohon isi password terlebih dahulu!", "warning");
                    return;
                }

                showAlert("Login gagal", "username / password belum sesuai, mohon dicek lagi!", "error");
                return;
            }

            if (response.redirected) {
                showAlert("Login", "berhasil login!", "success", {
                    autoCloseMs: 3000,
                    href: response.url,
                });
                return;
            }

            if (response.ok) {
                showAlert("Login", "berhasil login!", "success", {
                    autoCloseMs: 3000,
                    href: redirect || "/",
                });
                return;
            }

            showAlert("Login gagal", "Terjadi kesalahan saat login. Coba lagi.", "error");
        } catch {
            showAlert("Koneksi gagal", "Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <form ref={formRef} method="POST" action="/login/submit" className="space-y-4" noValidate onSubmit={onSubmit}>
                {redirect ? <input type="hidden" name="redirect" value={redirect} /> : null}

                <div>
                    <label htmlFor="email" className="moka-label">
                        Email
                    </label>
                    <input
                        id="email"
                        className="moka-input mt-1 block w-full"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="username"
                        required
                        autoFocus
                    />
                </div>

                <div>
                    <label htmlFor="password" className="moka-label">
                        Password
                    </label>
                    <div className="relative mt-1">
                        <input
                            id="password"
                            className="moka-input block w-full pr-11"
                            type={showPassword ? "text" : "password"}
                            name="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            autoComplete="current-password"
                            required
                        />
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-moka-muted transition hover:text-moka-ink"
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                {iconPath(showPassword)}
                            </svg>
                        </button>
                    </div>
                </div>

                <label htmlFor="remember_me" className="inline-flex items-center gap-2">
                    <input
                        id="remember_me"
                        type="checkbox"
                        className="rounded border-moka-line text-moka-primary focus:ring-moka-primary/40"
                        name="remember"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                    />
                    <span className="text-sm text-moka-muted">Ingat saya</span>
                </label>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <a className="text-sm font-medium text-moka-primary transition hover:text-moka-ink" href="#">
                        Lupa password?
                    </a>

                    <button type="submit" className="moka-btn w-full justify-center sm:w-auto" disabled={isSubmitting}>
                        {isSubmitting ? "Memproses..." : "Masuk"}
                    </button>
                </div>
            </form>

            {alertOpen ? (
                <div className="fixed inset-0 z-[120]">
                    <div className="absolute inset-0 moka-modal-overlay backdrop-blur-sm" onClick={closeAlert} />
                    <div
                        className="moka-modal-shell absolute w-[calc(100vw-2rem)] overflow-hidden"
                        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", maxWidth: "28rem" }}
                    >
                        <div className="moka-modal-content">
                            <div className="moka-modal-header">
                                <div>
                                    <h3 className="moka-modal-title">{alertTitle}</h3>
                                    <p className="moka-modal-subtitle">{alertSubtitle}</p>
                                </div>
                                <button type="button" className="moka-modal-close" onClick={closeAlert} aria-label="Tutup popup">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>

                            <div className={`moka-modal-alert ${alertToneClass}`}>
                                <p>{alertMessage}</p>
                            </div>

                            <div className="moka-modal-footer">
                                <button type="button" className="moka-btn-secondary" onClick={closeAlert}>
                                    Tutup
                                </button>
                                <button type="button" className="moka-btn" onClick={closeAlert}>
                                    OK
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
