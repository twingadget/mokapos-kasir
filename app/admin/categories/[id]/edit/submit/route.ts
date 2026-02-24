import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";

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
        return NextResponse.redirect(new URL("/admin/categories", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const isActive = formData.get("is_active") !== null;

    const category = await prisma.category.findUnique({
        where: { id },
        select: { id: true },
    });

    if (!category) {
        const response = NextResponse.redirect(new URL("/admin/categories", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Kategori tidak ditemukan." });
    }

    if (name === "") {
        const response = NextResponse.redirect(new URL(`/admin/categories/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama kategori wajib diisi." });
    }

    const duplicate = await prisma.category.findFirst({
        where: {
            name,
            id: { not: id },
        },
        select: { id: true },
    });

    if (duplicate) {
        const response = NextResponse.redirect(new URL(`/admin/categories/${id}/edit`, request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama kategori sudah digunakan." });
    }

    await prisma.category.update({
        where: { id },
        data: {
            name,
            isActive,
        },
    });

    const response = NextResponse.redirect(new URL("/admin/categories", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Berhasil menyimpan kategori." });
}
