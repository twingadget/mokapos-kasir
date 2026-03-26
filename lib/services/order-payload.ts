import { OrderValidationError, type OrderItemInput } from "@/lib/services/orders";
import { SERVICE_PLACE_LIMITS, type ServicePlaceZone } from "@/lib/services/order-notes";
import { stringOrNull, toNumber } from "@/lib/format";

type NormalizeOptions = {
    requirePaymentMethod: boolean;
};

export type NormalizedOrderBody = {
    items: OrderItemInput[];
    discountType: "none" | "amount" | "percent";
    discountValue: number;
    taxPercent: number | null;
    service: number;
    openBillId: number | null;
    paymentMethodId: number | null;
    cashReceived: number | null;
    notes: string | null;
    customerPlaceZone: ServicePlaceZone | null;
    customerPlaceNumber: number | null;
};

function fail(field: string, message: string): never {
    throw new OrderValidationError(message, { [field]: [message] });
}

function hasInput(value: unknown): boolean {
    return value !== null && value !== undefined && value !== "";
}

export function normalizeOrderBody(body: unknown, options: NormalizeOptions): NormalizedOrderBody {
    const payload = typeof body === "object" && body !== null ? (body as Record<string, unknown>) : {};
    const rawItems = Array.isArray(payload.items) ? payload.items : [];

    if (rawItems.length === 0) {
        fail("items", "Keranjang masih kosong.");
    }

    const items: OrderItemInput[] = rawItems.map((rawItem, index) => {
        const item = typeof rawItem === "object" && rawItem !== null ? (rawItem as Record<string, unknown>) : {};
        const productId = Number(item.product_id);
        const qty = Number(item.qty);

        if (!Number.isInteger(productId) || productId <= 0) {
            fail(`items.${index}.product_id`, "Produk tidak valid.");
        }

        if (!Number.isInteger(qty) || qty <= 0) {
            fail(`items.${index}.qty`, "Qty tidak valid.");
        }

        const variantRaw = item.variant_id;
        let variantId: number | null = null;
        if (hasInput(variantRaw)) {
            const parsedVariantId = Number(variantRaw);
            if (!Number.isInteger(parsedVariantId) || parsedVariantId <= 0) {
                fail(`items.${index}.variant_id`, "Varian tidak valid.");
            }

            variantId = parsedVariantId;
        }

        if (item.addons !== undefined && item.addons !== null && !Array.isArray(item.addons)) {
            fail(`items.${index}.addons`, "Format add-on tidak valid.");
        }

        const addons: number[] = [];
        if (Array.isArray(item.addons) && item.addons.length > 0) {
            for (const addonRaw of item.addons) {
                const addonId = Number(addonRaw);
                if (!Number.isInteger(addonId) || addonId <= 0) {
                    fail(`items.${index}.addons`, "Add-on tidak valid.");
                }

                addons.push(addonId);
            }
        }

        const notes = stringOrNull(item.notes);
        if (notes && notes.length > 255) {
            fail(`items.${index}.notes`, "Catatan item maksimal 255 karakter.");
        }

        return {
            product_id: productId,
            variant_id: variantId,
            qty,
            addons: [...new Set(addons)],
            notes,
        };
    });

    let discountType: "none" | "amount" | "percent" = "none";
    if (hasInput(payload.discount_type)) {
        const normalizedDiscountType = String(payload.discount_type);
        if (!["none", "amount", "percent"].includes(normalizedDiscountType)) {
            fail("discount_type", "Jenis diskon tidak valid.");
        }

        discountType = normalizedDiscountType as "none" | "amount" | "percent";
    }

    let discountValue = 0;
    if (hasInput(payload.discount_value)) {
        const parsedDiscountValue = Number(payload.discount_value);
        if (!Number.isFinite(parsedDiscountValue) || parsedDiscountValue < 0) {
            fail("discount_value", "Nilai diskon tidak valid.");
        }

        discountValue = parsedDiscountValue;
    }

    let taxPercent: number | null = null;
    if (hasInput(payload.tax_percent)) {
        const parsedTaxPercent = Number(payload.tax_percent);
        if (!Number.isFinite(parsedTaxPercent) || parsedTaxPercent < 0 || parsedTaxPercent > 100) {
            fail("tax_percent", "Persentase pajak harus antara 0 sampai 100.");
        }

        taxPercent = parsedTaxPercent;
    }

    let service = 0;
    if (hasInput(payload.service)) {
        const parsedService = Number(payload.service);
        if (!Number.isFinite(parsedService) || parsedService < 0) {
            fail("service", "Biaya service tidak valid.");
        }

        service = parsedService;
    }

    let openBillId: number | null = null;
    if (hasInput(payload.open_bill_id)) {
        const parsedOpenBillId = Number(payload.open_bill_id);
        if (!Number.isInteger(parsedOpenBillId) || parsedOpenBillId <= 0) {
            fail("open_bill_id", "Open bill tidak valid.");
        }

        openBillId = parsedOpenBillId;
    }

    let paymentMethodId: number | null = null;
    if (hasInput(payload.payment_method_id)) {
        const parsedPaymentMethodId = Number(payload.payment_method_id);
        if (!Number.isInteger(parsedPaymentMethodId) || parsedPaymentMethodId <= 0) {
            fail("payment_method_id", "Metode pembayaran wajib dipilih.");
        }

        paymentMethodId = parsedPaymentMethodId;
    }

    if (options.requirePaymentMethod && paymentMethodId === null) {
        fail("payment_method_id", "Metode pembayaran wajib dipilih.");
    }

    let cashReceived: number | null = null;
    if (hasInput(payload.cash_received)) {
        const parsedCashReceived = Number(payload.cash_received);
        if (!Number.isFinite(parsedCashReceived) || parsedCashReceived < 0) {
            fail("cash_received", "Nominal uang diterima tidak valid.");
        }

        cashReceived = parsedCashReceived;
    }

    const notes = stringOrNull(payload.notes);
    if (notes && notes.length > 500) {
        fail("notes", "Catatan maksimal 500 karakter.");
    }

    let customerPlaceZone: ServicePlaceZone | null = null;
    if (hasInput(payload.customer_place_zone)) {
        const parsedZone = String(payload.customer_place_zone);
        if (!(parsedZone in SERVICE_PLACE_LIMITS)) {
            fail("customer_place_zone", "Ruangan customer tidak valid.");
        }

        customerPlaceZone = parsedZone as ServicePlaceZone;
    }

    let customerPlaceNumber: number | null = null;
    if (hasInput(payload.customer_place_number)) {
        const parsedNumber = Number(payload.customer_place_number);
        if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
            fail("customer_place_number", "Nomor tempat customer tidak valid.");
        }

        customerPlaceNumber = parsedNumber;
    }

    if (customerPlaceZone && customerPlaceNumber === null) {
        fail("customer_place_number", "Nomor tempat customer wajib dipilih.");
    }

    if (!customerPlaceZone && customerPlaceNumber !== null) {
        fail("customer_place_zone", "Ruangan customer wajib dipilih.");
    }

    if (customerPlaceZone && customerPlaceNumber !== null && customerPlaceNumber > SERVICE_PLACE_LIMITS[customerPlaceZone]) {
        fail("customer_place_number", "Nomor tempat customer tidak sesuai dengan ruangan yang dipilih.");
    }

    return {
        items,
        discountType,
        discountValue: toNumber(discountValue, 0),
        taxPercent,
        service: toNumber(service, 0),
        openBillId,
        paymentMethodId,
        cashReceived,
        notes,
        customerPlaceZone,
        customerPlaceNumber,
    };
}
