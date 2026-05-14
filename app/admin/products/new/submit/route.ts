import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { parseProductFormData, saveUploadedProductImage, syncProductVariants } from "@/lib/services/product-admin";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const payload = parseProductFormData(formData);

    if (!payload.name || !payload.sku || !payload.categoryId) {
        const response = NextResponse.redirect(new URL("/admin/products/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama, SKU, dan kategori produk wajib diisi." });
    }

    if (payload.price < 0 || payload.costPrice < 0) {
        const response = NextResponse.redirect(new URL("/admin/products/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Harga produk tidak valid." });
    }

    const category = await prisma.category.findUnique({
        where: { id: payload.categoryId },
        select: { id: true },
    });

    if (!category) {
        const response = NextResponse.redirect(new URL("/admin/products/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kategori produk tidak ditemukan." });
    }

    const duplicateSku = await prisma.product.findUnique({
        where: { sku: payload.sku },
        select: { id: true },
    });

    if (duplicateSku) {
        const response = NextResponse.redirect(new URL("/admin/products/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "SKU produk sudah digunakan." });
    }

    const image = formData.get("image");
    let imagePath: string | null = null;
    try {
        imagePath = await saveUploadedProductImage(image instanceof File ? image : null);

        await prisma.$transaction(async (tx) => {
            const product = await tx.product.create({
                data: {
                    name: payload.name,
                    sku: payload.sku,
                    categoryId: payload.categoryId,
                    price: payload.price,
                    costPrice: payload.costPrice,
                    isActive: payload.isActive,
                    trackStock: payload.trackStock,
                    stockQty: payload.stockQty,
                    imagePath,
                },
                select: { id: true },
            });

            await syncProductVariants(tx, product.id, payload.variants);
        });
    } catch {
        const response = NextResponse.redirect(new URL("/admin/products/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Simpan produk gagal. Coba lagi atau gunakan gambar yang lebih ringan." });
    }

    const response = NextResponse.redirect(new URL("/admin/products", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Berhasil menyimpan produk." });
}
