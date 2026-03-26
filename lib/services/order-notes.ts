export type ServicePlaceZone = "Table" | "Sofa" | "VIP";

export type ServicePlace = {
    zone: ServicePlaceZone;
    number: number;
};

export type DecodedOrderNotes = {
    note: string | null;
    servicePlace: ServicePlace | null;
};

const ORDER_NOTES_PREFIX = "__MOKA_ORDER_META__:";

export const SERVICE_PLACE_LIMITS: Record<ServicePlaceZone, number> = {
    Table: 12,
    Sofa: 5,
    VIP: 7,
};

function normalizeNote(value: string | null | undefined): string | null {
    const normalized = typeof value === "string" ? value.trim() : "";
    return normalized === "" ? null : normalized;
}

export function normalizeServicePlace(place: ServicePlace | null | undefined): ServicePlace | null {
    if (!place) {
        return null;
    }

    if (!(place.zone in SERVICE_PLACE_LIMITS)) {
        return null;
    }

    const max = SERVICE_PLACE_LIMITS[place.zone];
    if (!Number.isInteger(place.number) || place.number <= 0 || place.number > max) {
        return null;
    }

    return {
        zone: place.zone,
        number: place.number,
    };
}

export function formatServicePlaceLabel(place: ServicePlace | null | undefined): string | null {
    const normalized = normalizeServicePlace(place);
    if (!normalized) {
        return null;
    }

    return `${normalized.zone} No ${normalized.number}`;
}

export function encodeOrderNotes(input: { note?: string | null; servicePlace?: ServicePlace | null }): string | null {
    const note = normalizeNote(input.note);
    const servicePlace = normalizeServicePlace(input.servicePlace);

    if (!servicePlace) {
        return note;
    }

    return `${ORDER_NOTES_PREFIX}${JSON.stringify({
        note,
        servicePlace,
    })}`;
}

export function decodeOrderNotes(raw: string | null | undefined): DecodedOrderNotes {
    const normalizedRaw = normalizeNote(raw);
    if (!normalizedRaw) {
        return {
            note: null,
            servicePlace: null,
        };
    }

    if (!normalizedRaw.startsWith(ORDER_NOTES_PREFIX)) {
        return {
            note: normalizedRaw,
            servicePlace: null,
        };
    }

    try {
        const parsed = JSON.parse(normalizedRaw.slice(ORDER_NOTES_PREFIX.length)) as {
            note?: string | null;
            servicePlace?: ServicePlace | null;
        };

        return {
            note: normalizeNote(parsed.note),
            servicePlace: normalizeServicePlace(parsed.servicePlace),
        };
    } catch {
        return {
            note: normalizedRaw,
            servicePlace: null,
        };
    }
}
