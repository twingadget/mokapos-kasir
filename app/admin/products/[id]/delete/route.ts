import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { deleteLocalProductImage } from "@/lib/services/product-admin";

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

    try {
        const product = await prisma.product.delete({
            where: { id },
            select: { imagePath: true },
        });
        await deleteLocalProductImage(product.imagePath);
    } catch {
        const response = NextResponse.redirect(new URL("/admin/products", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Produk tidak bisa dihapus." });
    }

    const response = NextResponse.redirect(new URL("/admin/products", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Produk berhasil dihapus." });
}
