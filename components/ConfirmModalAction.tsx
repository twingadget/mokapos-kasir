"use client";

import type { ReactNode } from "react";
import { useState } from "react";

type ConfirmModalActionProps = {
    formId: string;
    title: string;
    subtitle: string;
    confirmLabel: string;
    cancelLabel?: string;
    className?: string;
    ariaLabel?: string;
    children: ReactNode;
};

export default function ConfirmModalAction({
    formId,
    title,
    subtitle,
    confirmLabel,
    cancelLabel = "Batal",
    className,
    ariaLabel,
    children,
}: ConfirmModalActionProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button type="button" className={className} onClick={() => setOpen(true)} aria-label={ariaLabel}>
                {children}
            </button>

            {open ? (
                <div className="fixed inset-0 z-[120]">
                    <div className="absolute inset-0 moka-modal-overlay backdrop-blur-sm" onClick={() => setOpen(false)} />
                    <div
                        className="moka-modal-shell absolute w-[calc(100vw-2rem)] overflow-hidden"
                        style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)", maxWidth: "28rem" }}
                    >
                        <div className="moka-modal-content">
                            <div className="moka-modal-header">
                                <div>
                                    <h3 className="moka-modal-title">{title}</h3>
                                    <p className="moka-modal-subtitle">{subtitle}</p>
                                </div>
                                <button type="button" className="moka-modal-close" onClick={() => setOpen(false)} aria-label="Tutup popup">
                                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <path d="M6 6l12 12M18 6l-12 12" strokeWidth="1.8" strokeLinecap="round" />
                                    </svg>
                                </button>
                            </div>
                            <div className="moka-modal-footer">
                                <button type="button" className="moka-btn-secondary" onClick={() => setOpen(false)}>
                                    {cancelLabel}
                                </button>
                                <button
                                    type="button"
                                    className="moka-btn-danger"
                                    onClick={() => {
                                        setOpen(false);
                                        const form = document.getElementById(formId) as HTMLFormElement | null;
                                        form?.requestSubmit();
                                    }}
                                >
                                    {confirmLabel}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
}
