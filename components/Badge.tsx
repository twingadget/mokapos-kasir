type BadgeVariant = "success" | "warning" | "danger" | "primary" | "default";

type BadgeProps = {
    variant?: BadgeVariant;
    children: React.ReactNode;
    className?: string;
};

function variantClass(variant: BadgeVariant): string {
    if (variant === "success") {
        return "bg-emerald-100 text-emerald-700";
    }
    if (variant === "warning") {
        return "bg-amber-100 text-amber-700";
    }
    if (variant === "danger") {
        return "bg-red-100 text-red-700";
    }
    if (variant === "primary") {
        return "bg-moka-soft text-moka-primary border border-moka-line";
    }
    return "bg-[#252525] text-moka-muted border border-moka-line";
}

export default function Badge({ variant = "default", children, className = "" }: BadgeProps) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClass(variant)} ${className}`.trim()}>
            {children}
        </span>
    );
}
