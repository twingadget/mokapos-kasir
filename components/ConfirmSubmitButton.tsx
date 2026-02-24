"use client";

import type { ReactNode } from "react";

type ConfirmSubmitButtonProps = {
    message: string;
    className?: string;
    children: ReactNode;
};

export default function ConfirmSubmitButton({ message, className, children }: ConfirmSubmitButtonProps) {
    return (
        <button
            type="submit"
            className={className}
            onClick={(event) => {
                if (!confirm(message)) {
                    event.preventDefault();
                }
            }}
        >
            {children}
        </button>
    );
}
