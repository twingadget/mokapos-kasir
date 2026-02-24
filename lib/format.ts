const numberFormatter = new Intl.NumberFormat("id-ID");

export function formatCurrency(value: number): string {
    return `Rp ${numberFormatter.format(Number.isFinite(value) ? value : 0)}`;
}

export function formatNumber(value: number): string {
    return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatDateTime(date: Date | string | null | undefined): string {
    if (!date) {
        return "-";
    }

    const value = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(value.getTime())) {
        return "-";
    }

    const pad = (n: number): string => String(n).padStart(2, "0");
    const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    return `${pad(value.getDate())} ${monthShort[value.getMonth()]} ${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

export function toNumber(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function stringOrNull(value: unknown): string | null {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();
    return text === "" ? null : text;
}
