"use client";

import { useEffect, useState } from "react";

type FlashPayload = {
    type: "success" | "error";
    message: string;
};

function readCookieValue(name: string): string | null {
    if (typeof document === "undefined") {
        return null;
    }

    const raw = document.cookie
        .split(";")
        .map((entry) => entry.trim())
        .find((entry) => entry.startsWith(`${name}=`));

    if (!raw) {
        return null;
    }

    const value = raw.slice(name.length + 1);
    return value || null;
}

function clearCookie(name: string): void {
    if (typeof document === "undefined") {
        return;
    }

    document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

function decodeBase64Url(input: string): string | null {
    try {
        const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized + "===".slice((normalized.length + 3) % 4);
        return atob(padded);
    } catch {
        return null;
    }
}

function readFlashPayload(): FlashPayload | null {
    const encoded = readCookieValue("moka_flash");
    if (!encoded) {
        return null;
    }

    const decoded = decodeBase64Url(encoded);
    if (!decoded) {
        return null;
    }

    try {
        const parsed = JSON.parse(decoded) as Partial<FlashPayload>;
        if ((parsed.type !== "success" && parsed.type !== "error") || typeof parsed.message !== "string" || parsed.message.trim() === "") {
            return null;
        }

        return {
            type: parsed.type,
            message: parsed.message,
        };
    } catch {
        return null;
    }
}

export default function FlashSessionModal() {
    const [flash, setFlash] = useState<FlashPayload | null>(null);

    useEffect(() => {
        const payload = readFlashPayload();
        clearCookie("moka_flash");

        if (!payload) {
            return;
        }

        setFlash(payload);
    }, []);

    if (!flash) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[120]">
            <div className="absolute inset-0 moka-modal-overlay backdrop-blur-sm" onClick={() => setFlash(null)} />
            <div
                className="moka-modal-shell absolute w-[calc(100vw-2rem)] overflow-hidden"
                style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", maxWidth: "28rem" }}
            >
                <div className="moka-modal-content">
                    <div className="moka-modal-header">
                        <div>
                            <h3 className="moka-modal-title">{flash.type === "success" ? "Berhasil" : "Gagal"}</h3>
                            <p className="moka-modal-subtitle">{flash.message}</p>
                        </div>
                        <button type="button" className="moka-modal-close" onClick={() => setFlash(null)} aria-label="Tutup popup">
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
                            </svg>
                        </button>
                    </div>
                    <div className="moka-modal-footer">
                        <button type="button" className={flash.type === "success" ? "moka-btn" : "moka-btn-danger"} onClick={() => setFlash(null)}>
                            OK
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
