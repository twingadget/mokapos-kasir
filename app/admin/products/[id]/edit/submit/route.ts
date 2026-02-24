import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { deleteLocalProductImage, parseProductFormData, saveUploadedProductImage, syncProductVariants } from "@/lib/services/product-admin";

type Context = {
    params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: Context): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url), { status: 303 });
    }

    const params = await context.params;
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.redirect(new URL("/admin/products", request.url), { status: 303 });
    }

    const current = await prisma.product.findUnique({
        where: { id },
        select: { id: true, imagePath: true },
    });

    if (!current) {
        const response = NextResponse.redirect(new URL("/admin/products", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Produk tidak ditemukan." });
    }

    const formData = await request.formData();
    const payload = parseProductFormData(formData);

    if (!payload.name || !payload.sku || !payload.categoryId) {
        const response = NextResponse.redirect(new URL(`/admin/products/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama, SKU, dan kategori produk wajib diisi." });
    }

    if (payload.price < 0 || payload.costPrice < 0) {
        const response = NextResponse.redirect(new URL(`/admin/products/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Harga produk tidak valid." });
    }

    const category = await prisma.category.findUnique({
        where: { id: payload.categoryId },
        select: { id: true },
    });

    if (!category) {
        const response = NextResponse.redirect(new URL(`/admin/products/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kategori produk tidak ditemukan." });
    }

    const duplicateSku = await prisma.product.findFirst({
        where: {
            sku: payload.sku,
            id: { not: id },
        },
        select: { id: true },
    });

    if (duplicateSku) {
        const response = NextResponse.redirect(new URL(`/admin/products/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "SKU produk sudah digunakan." });
    }

    const image = formData.get("image");
    const newImagePath = await saveUploadedProductImage(image instanceof File ? image : null);

    await prisma.$transaction(async (tx) => {
        await tx.product.update({
            where: { id },
            data: {
                name: payload.name,
                sku: payload.sku,
                categoryId: payload.categoryId,
                price: payload.price,
                costPrice: payload.costPrice,
                isActive: payload.isActive,
                trackStock: payload.trackStock,
                stockQty: payload.stockQty,
                imagePath: newImagePath ?? current.imagePath,
            },
        });

        await syncProductVariants(tx, id, payload.variants);
    });

    if (newImagePath && current.imagePath) {
        await deleteLocalProductImage(current.imagePath);
    }

    const response = NextResponse.redirect(new URL("/admin/products", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Berhasil menyimpan produk." });
}
