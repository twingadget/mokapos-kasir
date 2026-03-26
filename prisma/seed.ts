import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import productCatalog from "./data/product_catalog.json";

const prisma = new PrismaClient();

type CatalogProduct = {
    name: string;
    sku: string;
    category: string;
    cost_price: number;
    price: number;
    stock_qty: number;
};

function normalizeKey(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

async function buildPublicImageMap(): Promise<Map<string, string>> {
    const publicDir = path.join(process.cwd(), "public");
    const entries = await readdir(publicDir, { withFileTypes: true });
    const map = new Map<string, string>();

    for (const entry of entries) {
        if (!entry.isFile()) {
            continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        if (![".png", ".jpg", ".jpeg", ".webp", ".svg"].includes(ext)) {
            continue;
        }

        const basename = path.basename(entry.name, ext);
        const key = normalizeKey(basename);
        if (key !== "") {
            map.set(key, entry.name);
        }
    }

    return map;
}

function resolveProductImagePath(productName: string, imageMap: Map<string, string>): string | null {
    const aliases: Record<string, string> = {
        absolutevodka: "absolutvodka",
        blueilusionpitcher: "blueilusionbypitcher",
        flaming: "flamming",
        hennessyvsop: "hennesyvsop",
        kratingdaeng: "krantingdaeng",
        marlboroiceburst: "malboroiceburst",
        paketkawa3botol: "paketkawakawa3botol",
        pokagreentea: "pokkagreentea",
    };

    const productKey = normalizeKey(productName);
    const lookupKey = aliases[productKey] ?? productKey;

    return imageMap.get(lookupKey) ?? null;
}

async function seedUsers(): Promise<void> {
    const passwordHash = await bcrypt.hash("password", 10);

    const users = [
        { email: "admin@coffeeshop.test", name: "Admin Bar", role: Role.admin },
        { email: "manager@coffeeshop.test", name: "Manager Bar", role: Role.manager },
        { email: "kasir@coffeeshop.test", name: "Kasir Bar", role: Role.kasir },
        { email: "waiter1@coffeeshop.test", name: "Waiter 1", role: Role.waiter },
        { email: "waiter2@coffeeshop.test", name: "Waiter 2", role: Role.waiter },
    ];

    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            create: {
                email: user.email,
                name: user.name,
                role: user.role,
                password: passwordHash,
                emailVerifiedAt: new Date(),
            },
            update: {
                name: user.name,
                role: user.role,
                password: passwordHash,
                emailVerifiedAt: new Date(),
            },
        });
    }
}

async function seedMasterData(): Promise<void> {
    const catalog = productCatalog as { categories: string[]; products: CatalogProduct[] };
    const imageMap = await buildPublicImageMap();

    await prisma.$transaction(async (tx) => {
        await tx.addon.updateMany({ data: { isActive: false } });
        await tx.category.updateMany({ data: { isActive: false } });
        await tx.product.updateMany({ data: { isActive: false } });

        const categoryMap = new Map<string, number>();

        for (const categoryNameRaw of catalog.categories) {
            const categoryName = String(categoryNameRaw).trim();
            if (!categoryName) {
                continue;
            }

            const category = await tx.category.upsert({
                where: { name: categoryName },
                create: { name: categoryName, isActive: true },
                update: { isActive: true },
            });

            categoryMap.set(category.name, category.id);
        }

        const importedSkus: string[] = [];

        for (const rowRaw of catalog.products) {
            const row = rowRaw as CatalogProduct;
            const sku = String(row.sku ?? "").trim().toUpperCase();
            const name = String(row.name ?? "").trim();
            let categoryName = String(row.category ?? "").trim();

            if (!sku || !name) {
                continue;
            }

            if (!categoryMap.has(categoryName)) {
                if (!categoryName) {
                    categoryName = "Lainnya";
                }

                const category = await tx.category.upsert({
                    where: { name: categoryName },
                    create: { name: categoryName, isActive: true },
                    update: { isActive: true },
                });

                categoryMap.set(category.name, category.id);
            }

            const imagePath = resolveProductImagePath(name, imageMap);

            const product = await tx.product.upsert({
                where: { sku },
                create: {
                    sku,
                    name,
                    categoryId: categoryMap.get(categoryName)!,
                    price: Math.max(0, Number(row.price ?? 0)),
                    costPrice: Math.max(0, Number(row.cost_price ?? 0)),
                    trackStock: true,
                    stockQty: Math.max(0, Number(row.stock_qty ?? 0)),
                    isActive: true,
                    imagePath,
                },
                update: {
                    name,
                    categoryId: categoryMap.get(categoryName)!,
                    price: Math.max(0, Number(row.price ?? 0)),
                    costPrice: Math.max(0, Number(row.cost_price ?? 0)),
                    trackStock: true,
                    stockQty: Math.max(0, Number(row.stock_qty ?? 0)),
                    isActive: true,
                    imagePath,
                },
            });

            await tx.productVariant.deleteMany({ where: { productId: product.id } });
            importedSkus.push(sku);
        }

        if (importedSkus.length > 0) {
            await tx.product.updateMany({
                where: { sku: { notIn: importedSkus } },
                data: { isActive: false },
            });
        }

        const importedCategoryNames = [...categoryMap.keys()];
        if (importedCategoryNames.length > 0) {
            await tx.category.updateMany({
                where: { name: { notIn: importedCategoryNames } },
                data: { isActive: false },
            });
        }
    }, {
        maxWait: 20_000,
        timeout: 120_000,
    });

    const paymentMethods = [
        { code: "cash", name: "Cash" },
        { code: "qris", name: "QRIS" },
        { code: "debit", name: "Debit" },
        { code: "ewallet", name: "E-Wallet" },
    ];

    for (const method of paymentMethods) {
        await prisma.paymentMethod.upsert({
            where: { code: method.code },
            create: {
                code: method.code,
                name: method.name,
                isActive: true,
            },
            update: {
                name: method.name,
                isActive: true,
            },
        });
    }
}

async function main(): Promise<void> {
    await seedUsers();
    await seedMasterData();
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
