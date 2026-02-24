import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma } from "@prisma/client";

export type VariantPayload = {
    name: string;
    price: number | null;
    price_delta: number | null;
    is_active: boolean;
};

export type ProductFormPayload = {
    name: string;
    sku: string;
    categoryId: number;
    price: number;
    costPrice: number;
    trackStock: boolean;
    stockQty: number;
    isActive: boolean;
    variants: VariantPayload[];
};

function parseNumber(value: FormDataEntryValue | null, fallback = 0): number {
    const parsed = Number(value ?? fallback);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseInteger(value: FormDataEntryValue | null, fallback = 0): number {
    const parsed = Number.parseInt(String(value ?? fallback), 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseNullableNumber(value: unknown): number | null {
    if (value === null || value === undefined) {
        return null;
    }

    const text = String(value).trim();
    if (text === "") {
        return null;
    }

    const parsed = Number(text);
    return Number.isFinite(parsed) ? parsed : null;
}

export function parseProductFormData(formData: FormData): ProductFormPayload {
    const name = String(formData.get("name") ?? "").trim();
    const sku = String(formData.get("sku") ?? "").trim().toUpperCase();
    const categoryId = parseInteger(formData.get("category_id"));
    const price = Math.max(0, parseNumber(formData.get("price")));
    const costPrice = Math.max(0, parseNumber(formData.get("cost_price")));
    const trackStock = formData.get("track_stock") !== null;
    const stockQty = trackStock ? Math.max(0, parseInteger(formData.get("stock_qty"))) : 0;
    const isActive = formData.get("is_active") !== null;

    const variantsJsonRaw = String(formData.get("variants_json") ?? "[]");
    let variantsInput: unknown[] = [];
    try {
        const parsed = JSON.parse(variantsJsonRaw);
        variantsInput = Array.isArray(parsed) ? parsed : [];
    } catch {
        variantsInput = [];
    }

    const variants: VariantPayload[] = variantsInput
        .map((raw) => {
            const item = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
            const variantName = String(item.name ?? "").trim();
            if (!variantName) {
                return null;
            }

            return {
                name: variantName,
                price: parseNullableNumber(item.price),
                price_delta: parseNullableNumber(item.price_delta),
                is_active: item.is_active !== false,
            } as VariantPayload;
        })
        .filter((item): item is VariantPayload => item !== null);

    return {
        name,
        sku,
        categoryId,
        price,
        costPrice,
        trackStock,
        stockQty,
        isActive,
        variants,
    };
}

function normalizeImageExtension(fileName: string, mimeType: string): string {
    const ext = path.extname(fileName).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".webp", ".svg"].includes(ext)) {
        return ext === ".jpeg" ? ".jpg" : ext;
    }

    if (mimeType.includes("png")) {
        return ".png";
    }
    if (mimeType.includes("webp")) {
        return ".webp";
    }
    if (mimeType.includes("svg")) {
        return ".svg";
    }

    return ".jpg";
}

export async function saveUploadedProductImage(file: File | null): Promise<string | null> {
    if (!file || file.size === 0) {
        return null;
    }

    const mimeType = (file.type || "").toLowerCase();
    if (!mimeType.startsWith("image/")) {
        return null;
    }

    const ext = normalizeImageExtension(file.name, mimeType);
    const directory = path.join(process.cwd(), "public", "products");
    await mkdir(directory, { recursive: true });

    const fileName = `${randomUUID()}${ext}`;
    const fullPath = path.join(directory, fileName);
    const arrayBuffer = await file.arrayBuffer();
    await writeFile(fullPath, Buffer.from(arrayBuffer));

    return `products/${fileName}`;
}

export async function deleteLocalProductImage(imagePath: string | null): Promise<void> {
    if (!imagePath) {
        return;
    }

    const normalized = imagePath.replace(/^\/+/, "");
    if (!normalized.startsWith("products/")) {
        return;
    }

    const fullPath = path.join(process.cwd(), "public", normalized);
    await unlink(fullPath).catch(() => undefined);
}

export async function syncProductVariants(
    tx: Prisma.TransactionClient,
    productId: number,
    variants: VariantPayload[],
): Promise<void> {
    await tx.productVariant.deleteMany({
        where: {
            productId,
        },
    });

    if (variants.length === 0) {
        return;
    }

    await tx.productVariant.createMany({
        data: variants.map((variant) => ({
            productId,
            name: variant.name,
            price: variant.price,
            priceDelta: variant.price_delta,
            isActive: variant.is_active,
        })),
    });
}
