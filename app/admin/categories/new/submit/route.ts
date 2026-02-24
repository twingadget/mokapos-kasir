import { NextRequest, NextResponse } from "next/server";
import { readSessionUser } from "@/lib/auth";
import { withFlash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest): Promise<NextResponse> {
    const user = readSessionUser(request);
    if (!user || user.role !== "admin") {
        return NextResponse.redirect(new URL("/", request.url), { status: 303 });
    }

    const formData = await request.formData();
    const name = String(formData.get("name") ?? "").trim();
    const isActive = formData.get("is_active") !== null;

    if (name === "") {
        const response = NextResponse.redirect(new URL("/admin/categories/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama kategori wajib diisi." });
    }

    const exists = await prisma.category.findUnique({
        where: { name },
        select: { id: true },
    });

    if (exists) {
        const response = NextResponse.redirect(new URL("/admin/categories/new", request.url), { status: 303 });
        return withFlash(response, { type: "error", message: "Nama kategori sudah digunakan." });
    }

    await prisma.category.create({
        data: { name, isActive },
    });

    const response = NextResponse.redirect(new URL("/admin/categories", request.url), { status: 303 });
    return withFlash(response, { type: "success", message: "Berhasil menyimpan kategori." });
}
