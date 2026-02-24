import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { deriveTaxPercent } from "@/lib/services/orders";
import { toNumber } from "@/lib/format";

export function resolveProductImageUrl(imagePath: string | null): string | null {
    if (!imagePath) {
        return null;
    }

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
        return imagePath;
    }

    const relative = imagePath.replace(/^\/+/, "");
    return `/${relative}`;
}

function mapResumePayload(order: {
    id: number;
    discountType: string;
    discountValue: unknown;
    subtotal: unknown;
    tax: unknown;
    service: unknown;
    notes: string | null;
    items: Array<{
        productId: number;
        variantId: number | null;
        nameSnapshot: string;
        price: unknown;
        qty: number;
        notes: string | null;
        addons: Array<{
            addonId: number;
            nameSnapshot: string;
            price: unknown;
        }>;
    }>;
}): {
    id: number;
    discount_type: string;
    discount_value: number;
    tax_percent: number;
    service: number;
    notes: string | null;
    items: Array<{
        product_id: number;
        variant_id: number | null;
        name_snapshot: string;
        price: number;
        qty: number;
        notes: string | null;
        addons: Array<{ id: number; name: string; price: number }>;
    }>;
} {
    return {
        id: order.id,
        discount_type: order.discountType,
        discount_value: toNumber(order.discountValue),
        tax_percent: deriveTaxPercent({
            subtotal: toNumber(order.subtotal),
            discountType: order.discountType,
            discountValue: toNumber(order.discountValue),
            tax: toNumber(order.tax),
        }),
        service: toNumber(order.service),
        notes: order.notes,
        items: order.items.map((item) => ({
            product_id: item.productId,
            variant_id: item.variantId,
            name_snapshot: item.nameSnapshot,
            price: toNumber(item.price),
            qty: item.qty,
            notes: item.notes,
            addons: item.addons.map((addon) => ({
                id: addon.addonId,
                name: addon.nameSnapshot,
                price: toNumber(addon.price),
            })),
        })),
    };
}

export async function getPosBootstrapData(params: {
    userId: number;
    mode: "kasir" | "waiter";
    resumeOpenBillId?: number | null;
    resumeWaiterOrderId?: number | null;
}): Promise<{
    categories: Array<{ id: number; name: string }>;
    products: Array<{
        id: number;
        name: string;
        sku: string;
        price: number;
        is_active: boolean;
        track_stock: boolean;
        stock_qty: number;
        category_id: number;
        category_name: string | null;
        image_url: string | null;
        variants: Array<{
            id: number;
            name: string;
            price: number | null;
            price_delta: number | null;
        }>;
    }>;
    addons: Array<{ id: number; name: string; price: number }>;
    paymentMethods: Array<{ id: number; name: string; code: string }>;
    openBills: Array<{ id: number; total: number; updated_at: string }>;
    waiterOrders: Array<{ id: number; total: number; updated_at: string; waiter_name: string }>;
    resumeOpenBill: ReturnType<typeof mapResumePayload> | null;
    resumeWaiterOrder: ReturnType<typeof mapResumePayload> | null;
}> {
    const categories = await prisma.category.findMany({
        where: {
            isActive: true,
            products: {
                some: {
                    isActive: true,
                    category: { isActive: true },
                },
            },
        },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
    });

    const products = await prisma.product.findMany({
        where: {
            isActive: true,
            category: { isActive: true },
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            variants: {
                where: { isActive: true },
                orderBy: { name: "asc" },
            },
        },
        orderBy: { name: "asc" },
    });

    const addons = await prisma.addon.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            price: true,
        },
    });

    const paymentMethods =
        params.mode === "waiter"
            ? []
            : await prisma.paymentMethod.findMany({
                  where: { isActive: true },
                  orderBy: { name: "asc" },
                  select: {
                      id: true,
                      name: true,
                      code: true,
                  },
              });

    const openBills =
        params.mode === "waiter"
            ? []
            : await prisma.order.findMany({
                  where: {
                      status: OrderStatus.OPEN_BILL,
                      userId: params.userId,
                  },
                  orderBy: { updatedAt: "desc" },
                  take: 20,
                  select: {
                      id: true,
                      total: true,
                      updatedAt: true,
                  },
              });

    const waiterOrders =
        params.mode === "waiter"
            ? []
            : await prisma.order.findMany({
                  where: {
                      status: OrderStatus.WAITING,
                  },
                  orderBy: { updatedAt: "desc" },
                  take: 20,
                  select: {
                      id: true,
                      total: true,
                      updatedAt: true,
                      waiter: {
                          select: { name: true },
                      },
                      user: {
                          select: { name: true },
                      },
                  },
              });

    let resumeOpenBill: ReturnType<typeof mapResumePayload> | null = null;
    if (params.resumeOpenBillId && params.mode !== "waiter") {
        const order = await prisma.order.findFirst({
            where: {
                id: params.resumeOpenBillId,
                status: OrderStatus.OPEN_BILL,
                userId: params.userId,
            },
            select: {
                id: true,
                discountType: true,
                discountValue: true,
                subtotal: true,
                tax: true,
                service: true,
                notes: true,
                items: {
                    select: {
                        productId: true,
                        variantId: true,
                        nameSnapshot: true,
                        price: true,
                        qty: true,
                        notes: true,
                        addons: {
                            select: {
                                addonId: true,
                                nameSnapshot: true,
                                price: true,
                            },
                        },
                    },
                },
            },
        });

        resumeOpenBill = order ? mapResumePayload(order) : null;
    }

    let resumeWaiterOrder: ReturnType<typeof mapResumePayload> | null = null;
    if (params.resumeWaiterOrderId) {
        const where =
            params.mode === "waiter"
                ? {
                      id: params.resumeWaiterOrderId,
                      status: OrderStatus.WAITING,
                      waiterId: params.userId,
                  }
                : {
                      id: params.resumeWaiterOrderId,
                      status: OrderStatus.WAITING,
                  };

        const order = await prisma.order.findFirst({
            where,
            select: {
                id: true,
                discountType: true,
                discountValue: true,
                subtotal: true,
                tax: true,
                service: true,
                notes: true,
                items: {
                    select: {
                        productId: true,
                        variantId: true,
                        nameSnapshot: true,
                        price: true,
                        qty: true,
                        notes: true,
                        addons: {
                            select: {
                                addonId: true,
                                nameSnapshot: true,
                                price: true,
                            },
                        },
                    },
                },
            },
        });

        resumeWaiterOrder = order ? mapResumePayload(order) : null;
    }

    return {
        categories: categories.map((category) => ({
            id: category.id,
            name: category.name,
        })),
        products: products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            price: toNumber(product.price),
            is_active: product.isActive,
            track_stock: product.trackStock,
            stock_qty: product.stockQty,
            category_id: product.categoryId,
            category_name: product.category?.name ?? null,
            image_url: resolveProductImageUrl(product.imagePath),
            variants: product.variants.map((variant) => ({
                id: variant.id,
                name: variant.name,
                price: variant.price === null ? null : toNumber(variant.price),
                price_delta: variant.priceDelta === null ? null : toNumber(variant.priceDelta),
            })),
        })),
        addons: addons.map((addon) => ({
            id: addon.id,
            name: addon.name,
            price: toNumber(addon.price),
        })),
        paymentMethods: paymentMethods.map((method) => ({
            id: method.id,
            name: method.name,
            code: method.code,
        })),
        openBills: openBills.map((entry) => ({
            id: entry.id,
            total: toNumber(entry.total),
            updated_at: entry.updatedAt.toISOString(),
        })),
        waiterOrders: waiterOrders.map((entry) => ({
            id: entry.id,
            total: toNumber(entry.total),
            updated_at: entry.updatedAt.toISOString(),
            waiter_name: entry.waiter?.name ?? entry.user?.name ?? "-",
        })),
        resumeOpenBill,
        resumeWaiterOrder,
    };
}
