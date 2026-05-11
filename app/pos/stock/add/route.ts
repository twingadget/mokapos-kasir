import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";

function resolveRedirectTarget(request: NextRequest): URL {
    const fallback = new URL("/pos/stock", request.url);
    const referer = request.headers.get("referer");

    if (!referer) {
        return fallback;
    }

    try {
        const refererUrl = new URL(referer);
        const requestUrl = new URL(request.url);

        if (refererUrl.origin !== requestUrl.origin) {
            return fallback;
        }

        if (refererUrl.pathname === "/pos/stock") {
            return new URL(`${refererUrl.pathname}${refererUrl.search}`, request.url);
        }
    } catch {
        return fallback;
    }

    return fallback;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user || user.role !== "kasir") {
        return NextResponse.redirect(new URL("/", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const productId = Number.parseInt(String(formData.get("product_id") ?? ""), 10);
    const qty = Number.parseInt(String(formData.get("qty") ?? ""), 10);
    const redirectTarget = resolveRedirectTarget(request);

    if (!Number.isInteger(productId) || productId <= 0 || !Number.isInteger(qty) || qty <= 0) {
        const response = NextResponse.redirect(redirectTarget, { status: 303 });
        return withFlash(response, { type: "error", message: "Produk dan jumlah stok harus diisi dengan angka positif." });
    }

    const product = await prisma.product.findFirst({
        where: {
            id: productId,
            isActive: true,
            trackStock: true,
            category: {
                isActive: true,
            },
        },
        select: {
            id: true,
            name: true,
        },
    });

    if (!product) {
        const response = NextResponse.redirect(redirectTarget, { status: 303 });
        return withFlash(response, { type: "error", message: "Produk stok tidak ditemukan atau sudah tidak aktif." });
    }

    await prisma.product.update({
        where: { id: product.id },
        data: {
            stockQty: {
                increment: qty,
            },
        },
    });

    const response = NextResponse.redirect(redirectTarget, { status: 303 });
    return withFlash(response, { type: "success", message: `Stok ${product.name} berhasil ditambah ${qty}.` });
}
