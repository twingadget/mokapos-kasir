import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/format";

export type OrderItemInput = {
    product_id: number;
    variant_id?: number | null;
    qty: number;
    addons?: number[];
    notes?: string | null;
};

export type PersistOrderInput = {
    userId: number;
    targetStatus: OrderStatus;
    items: OrderItemInput[];
    discountType?: "none" | "amount" | "percent";
    discountValue?: number;
    taxPercent?: number | null;
    service?: number;
    openBillId?: number | null;
    paymentMethodId?: number | null;
    cashReceived?: number | null;
    notes?: string | null;
};

export type ValidationIssueMap = Record<string, string[]>;

export class OrderValidationError extends Error {
    readonly issues: ValidationIssueMap;

    constructor(message: string, issues: ValidationIssueMap) {
        super(message);
        this.name = "OrderValidationError";
        this.issues = issues;
    }
}

type ComputedItem = {
    product: {
        id: number;
        name: string;
        price: number;
        costPrice: number;
        trackStock: boolean;
        stockQty: number;
        variants: Array<{ id: number; name: string; price: number | null; priceDelta: number | null }>;
    };
    variant: { id: number; name: string; price: number | null; priceDelta: number | null } | null;
    addons: Array<{ id: number; name: string; price: number }>;
    qty: number;
    price: number;
    costPrice: number;
    lineTotal: number;
    lineCostTotal: number;
    notes: string | null;
};

function validationError(field: string, message: string): never {
    throw new OrderValidationError(message, { [field]: [message] });
}

export function resolveDiscountAmount(subtotal: number, discountType: string, discountValue: number): number {
    if (discountType === "percent") {
        return Math.round((subtotal * Math.min(100, Math.max(0, discountValue)) / 100) * 100) / 100;
    }

    if (discountType === "amount") {
        return Math.round(Math.min(subtotal, Math.max(0, discountValue)) * 100) / 100;
    }

    return 0;
}

export function deriveTaxPercent(order: {
    subtotal: Prisma.Decimal | number;
    discountType: string;
    discountValue: Prisma.Decimal | number;
    tax: Prisma.Decimal | number;
}): number {
    const subtotal = toNumber(order.subtotal);
    const discountAmount = resolveDiscountAmount(subtotal, order.discountType, toNumber(order.discountValue));
    const baseAfterDiscount = Math.round(Math.max(0, subtotal - discountAmount) * 100) / 100;

    if (baseAfterDiscount <= 0) {
        return 10;
    }

    return Math.round(Math.min(100, Math.max(0, (toNumber(order.tax) / baseAfterDiscount) * 100)) * 100) / 100;
}

function nowDateStamp(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

function todayDateString(): string {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function ymdCompact(): string {
    return todayDateString().replace(/-/g, "");
}

function nextOpenBillReference(): string {
    return `OB-${nowDateStamp()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;
}

function nextWaiterReference(): string {
    return `WT-${nowDateStamp()}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0")}`;
}

async function nextInvoiceNumber(tx: Prisma.TransactionClient): Promise<string> {
    const today = todayDateString();
    const [year, month, day] = today.split("-").map((value) => Number(value));
    const dateValue = new Date(year, month - 1, day);

    await tx.invoiceCounter.upsert({
        where: { date: dateValue },
        create: { date: dateValue, lastNumber: 0 },
        update: {},
    });

    const counter = await tx.invoiceCounter.update({
        where: { date: dateValue },
        data: { lastNumber: { increment: 1 } },
        select: { lastNumber: true },
    });

    return `CS-${ymdCompact()}-${String(counter.lastNumber).padStart(4, "0")}`;
}

async function computeValidatedItems(
    tx: Prisma.TransactionClient,
    itemsInput: OrderItemInput[],
    existingQtyByProduct: Record<number, number> = {},
): Promise<{ computedItems: ComputedItem[]; subtotal: number }> {
    const computedItems: ComputedItem[] = [];
    let subtotal = 0;
    const requestedQtyByProduct: Record<number, number> = {};

    for (const item of itemsInput) {
        const productId = Number(item.product_id);
        const qty = Math.max(1, Number.parseInt(String(item.qty), 10) || 1);

        const productRecord = await tx.product.findFirst({
            where: {
                id: productId,
                isActive: true,
                category: { isActive: true },
            },
            include: {
                variants: {
                    where: { isActive: true },
                    orderBy: { name: "asc" },
                },
            },
        });

        if (!productRecord) {
            validationError("items", "Produk tidak ditemukan atau nonaktif.");
        }

        let variant: { id: number; name: string; price: number | null; priceDelta: number | null } | null = null;
        const variantId = item.variant_id ? Number(item.variant_id) : null;
        if (variantId) {
            const variantRecord = productRecord.variants.find((entry) => entry.id === variantId);
            if (!variantRecord) {
                validationError("items", "Varian tidak valid.");
            }

            variant = {
                id: variantRecord.id,
                name: variantRecord.name,
                price: variantRecord.price === null ? null : toNumber(variantRecord.price),
                priceDelta: variantRecord.priceDelta === null ? null : toNumber(variantRecord.priceDelta),
            };
        }

        if (productRecord.variants.length > 0 && !variant) {
            validationError("items", `Varian wajib dipilih untuk produk ${productRecord.name}.`);
        }

        if (productRecord.trackStock) {
            requestedQtyByProduct[productRecord.id] = (requestedQtyByProduct[productRecord.id] ?? 0) + qty;
            const availableStock = productRecord.stockQty + (existingQtyByProduct[productRecord.id] ?? 0);

            if (availableStock < requestedQtyByProduct[productRecord.id]) {
                validationError("items", `Stok tidak cukup untuk ${productRecord.name}.`);
            }
        }

        let basePrice = toNumber(productRecord.price);
        if (variant) {
            if (variant.price !== null) {
                basePrice = variant.price;
            } else if (variant.priceDelta !== null) {
                basePrice = toNumber(productRecord.price) + variant.priceDelta;
            }
        }

        const addonIds = [...new Set((item.addons ?? []).map((value) => Number(value)).filter((value) => Number.isInteger(value) && value > 0))];
        const addons = addonIds.length
            ? await tx.addon.findMany({
                  where: {
                      id: { in: addonIds },
                      isActive: true,
                  },
                  select: { id: true, name: true, price: true },
              })
            : [];

        if (addonIds.length !== addons.length) {
            validationError("items", "Add-on tidak valid.");
        }

        const addonTotal = addons.reduce((sum, addon) => sum + toNumber(addon.price), 0);
        const lineTotal = Math.round((basePrice + addonTotal) * qty * 100) / 100;
        const itemCostPrice = toNumber(productRecord.costPrice);
        const lineCostTotal = Math.round(itemCostPrice * qty * 100) / 100;
        subtotal += lineTotal;

        computedItems.push({
            product: {
                id: productRecord.id,
                name: productRecord.name,
                price: toNumber(productRecord.price),
                costPrice: itemCostPrice,
                trackStock: productRecord.trackStock,
                stockQty: productRecord.stockQty,
                variants: productRecord.variants.map((entry) => ({
                    id: entry.id,
                    name: entry.name,
                    price: entry.price === null ? null : toNumber(entry.price),
                    priceDelta: entry.priceDelta === null ? null : toNumber(entry.priceDelta),
                })),
            },
            variant,
            addons: addons.map((addon) => ({
                id: addon.id,
                name: addon.name,
                price: toNumber(addon.price),
            })),
            qty,
            price: basePrice,
            costPrice: itemCostPrice,
            lineTotal,
            lineCostTotal,
            notes: item.notes ? String(item.notes).trim() : null,
        });
    }

    return { computedItems, subtotal: Math.round(subtotal * 100) / 100 };
}

async function restoreStockFromOrder(
    tx: Prisma.TransactionClient,
    order: {
        items: Array<{ qty: number; productId: number; product: { trackStock: boolean } | null }>;
    },
): Promise<void> {
    for (const item of order.items) {
        if (!item.product || !item.product.trackStock) {
            continue;
        }

        await tx.product.update({
            where: { id: item.productId },
            data: {
                stockQty: {
                    increment: item.qty,
                },
            },
        });
    }
}

async function replaceOrderItems(
    tx: Prisma.TransactionClient,
    orderId: number,
    computedItems: ComputedItem[],
): Promise<void> {
    for (const computed of computedItems) {
        if (computed.product.trackStock) {
            await tx.product.update({
                where: { id: computed.product.id },
                data: {
                    stockQty: {
                        decrement: computed.qty,
                    },
                },
            });
        }

        const nameSnapshot = computed.variant ? `${computed.product.name} - ${computed.variant.name}` : computed.product.name;

        const orderItem = await tx.orderItem.create({
            data: {
                orderId,
                productId: computed.product.id,
                variantId: computed.variant?.id ?? null,
                nameSnapshot,
                price: computed.price,
                costPrice: computed.costPrice,
                qty: computed.qty,
                lineTotal: computed.lineTotal,
                lineCostTotal: computed.lineCostTotal,
                notes: computed.notes,
            },
            select: { id: true },
        });

        if (computed.addons.length > 0) {
            await tx.orderItemAddon.createMany({
                data: computed.addons.map((addon) => ({
                    orderItemId: orderItem.id,
                    addonId: addon.id,
                    nameSnapshot: addon.name,
                    price: addon.price,
                })),
            });
        }
    }
}

export async function persistOrderFromPayload(input: PersistOrderInput): Promise<{ id: number }> {
    if (!Array.isArray(input.items) || input.items.length === 0) {
        validationError("items", "Keranjang masih kosong.");
    }

    const discountType = input.discountType ?? "none";
    const discountValue = toNumber(input.discountValue ?? 0);
    const taxPercentInput = input.taxPercent === null || input.taxPercent === undefined ? null : toNumber(input.taxPercent, 0);
    const service = Math.max(0, toNumber(input.service ?? 0));
    const openBillId = input.openBillId ? Number(input.openBillId) : null;

    return prisma.$transaction(async (tx) => {
        let draftOrder:
            | (Prisma.OrderGetPayload<{
                  include: {
                      items: {
                          include: {
                              product: {
                                  select: {
                                      id: true;
                                      trackStock: true;
                                  };
                              };
                          };
                      };
                  };
              }> & { status: OrderStatus })
            | null = null;

        const existingQtyByProduct: Record<number, number> = {};
        let draftStatus: OrderStatus | null = null;

        if (openBillId) {
            draftOrder = await tx.order.findUnique({
                where: { id: openBillId },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    trackStock: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!draftOrder || !(draftOrder.status === OrderStatus.OPEN_BILL || draftOrder.status === OrderStatus.WAITING)) {
                validationError("open_bill_id", "Open bill tidak ditemukan atau sudah ditutup.");
            }

            draftStatus = draftOrder.status;

            if (draftStatus === OrderStatus.OPEN_BILL && draftOrder.userId !== input.userId) {
                validationError("open_bill_id", "Kamu tidak memiliki akses ke open bill ini.");
            }

            for (const oldItem of draftOrder.items) {
                if (!oldItem.product || !oldItem.product.trackStock) {
                    continue;
                }

                existingQtyByProduct[oldItem.productId] = (existingQtyByProduct[oldItem.productId] ?? 0) + oldItem.qty;
            }
        }

        const { computedItems, subtotal } = await computeValidatedItems(tx, input.items, existingQtyByProduct);

        let normalizedDiscountValue = 0;
        if (discountType === "percent") {
            normalizedDiscountValue = Math.min(100, Math.max(0, discountValue));
        } else if (discountType === "amount") {
            normalizedDiscountValue = Math.min(subtotal, Math.max(0, discountValue));
        }

        const discountAmount = resolveDiscountAmount(subtotal, discountType, normalizedDiscountValue);
        const taxPercent =
            taxPercentInput === null ? (draftOrder ? deriveTaxPercent(draftOrder) : 10) : Math.min(100, Math.max(0, taxPercentInput));
        const baseAfterDiscount = Math.round(Math.max(0, subtotal - discountAmount) * 100) / 100;
        const tax = Math.round(baseAfterDiscount * (taxPercent / 100) * 100) / 100;
        const total = Math.round((baseAfterDiscount + tax + service) * 100) / 100;

        let paymentMethodName = input.targetStatus === OrderStatus.WAITING ? "WAITING" : "OPEN BILL";
        let cashReceived: number | null = null;
        let change: number | null = null;
        let invoiceNo =
            draftOrder?.invoiceNo ?? (input.targetStatus === OrderStatus.WAITING ? nextWaiterReference() : nextOpenBillReference());

        if (input.targetStatus === OrderStatus.PAID) {
            if (!input.paymentMethodId) {
                validationError("payment_method_id", "Metode pembayaran wajib dipilih.");
            }

            const paymentMethod = await tx.paymentMethod.findFirst({
                where: {
                    id: Number(input.paymentMethodId),
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    code: true,
                },
            });

            if (!paymentMethod) {
                validationError("payment_method_id", "Metode pembayaran tidak valid.");
            }

            paymentMethodName = paymentMethod.name;
            cashReceived = input.cashReceived === null || input.cashReceived === undefined ? null : toNumber(input.cashReceived);

            if (paymentMethod.code === "cash") {
                if (cashReceived === null || cashReceived < total) {
                    validationError("cash_received", "Uang diterima kurang dari total pembayaran.");
                }

                cashReceived = Math.round(cashReceived * 100) / 100;
                change = Math.round((cashReceived - total) * 100) / 100;
            } else {
                cashReceived = null;
            }

            invoiceNo = await nextInvoiceNumber(tx);
        }

        const orderedAt = new Date();

        let orderId: number;

        if (draftOrder) {
            await restoreStockFromOrder(tx, draftOrder);
            await tx.orderItem.deleteMany({ where: { orderId: draftOrder.id } });

            const updatePayload: Prisma.OrderUncheckedUpdateInput = {
                invoiceNo,
                status: input.targetStatus,
                subtotal,
                discountType,
                discountValue: normalizedDiscountValue,
                tax,
                service,
                total,
                paymentMethod: paymentMethodName,
                cashReceived,
                change,
                notes: input.notes ? String(input.notes).trim() : null,
                orderedAt,
            };

            if (draftStatus === OrderStatus.WAITING) {
                updatePayload.waiterId = draftOrder.waiterId ?? draftOrder.userId;
                updatePayload.userId = input.userId;
            }

            const updatedOrder = await tx.order.update({
                where: { id: draftOrder.id },
                data: updatePayload,
                select: { id: true },
            });

            orderId = updatedOrder.id;
        } else {
            const createdOrder = await tx.order.create({
                data: {
                    invoiceNo,
                    userId: input.userId,
                    waiterId: input.targetStatus === OrderStatus.WAITING ? input.userId : null,
                    status: input.targetStatus,
                    subtotal,
                    discountType,
                    discountValue: normalizedDiscountValue,
                    tax,
                    service,
                    total,
                    paymentMethod: paymentMethodName,
                    cashReceived,
                    change,
                    notes: input.notes ? String(input.notes).trim() : null,
                    orderedAt,
                },
                select: { id: true },
            });

            orderId = createdOrder.id;
        }

        await replaceOrderItems(tx, orderId, computedItems);

        return { id: orderId };
    });
}

export function resolveOrderCost(order: {
    items: Array<{
        costPrice: Prisma.Decimal | number;
        qty: number;
        lineCostTotal: Prisma.Decimal | number;
        product?: { costPrice: Prisma.Decimal | number } | null;
    }>;
}): number {
    let totalCost = 0;

    for (const item of order.items) {
        const lineCostTotal = toNumber(item.lineCostTotal);
        if (lineCostTotal > 0) {
            totalCost += lineCostTotal;
            continue;
        }

        let unitCost = toNumber(item.costPrice);
        if (unitCost <= 0 && item.product) {
            unitCost = toNumber(item.product.costPrice);
        }

        totalCost += unitCost * item.qty;
    }

    return Math.round(totalCost * 100) / 100;
}
