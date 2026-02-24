import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminPaymentMethodEditPageProps = {
    params: Promise<{ id: string }>;
};

export default async function AdminPaymentMethodEditPage({ params }: AdminPaymentMethodEditPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const routeParams = await params;
    const id = Number(routeParams.id);

    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }

    const paymentMethod = await prisma.paymentMethod.findUnique({
        where: { id },
    });

    if (!paymentMethod) {
        notFound();
    }

    return (
        <AppShell user={user} active="admin.payment-methods">
            <div className="mb-5">
                <h1 className="font-display text-2xl font-bold text-moka-ink">Edit Metode Pembayaran</h1>
                <p className="text-sm text-moka-muted">Perbarui nama, kode, dan status metode pembayaran.</p>
            </div>

            <div className="soft-card p-5">
                <form method="POST" action={`/admin/payment-methods/${paymentMethod.id}/edit/submit`} className="grid gap-4">
                    <div>
                        <label htmlFor="name" className="moka-label">
                            Nama Metode
                        </label>
                        <input id="name" name="name" type="text" required defaultValue={paymentMethod.name} className="moka-input" />
                    </div>
                    <div>
                        <label htmlFor="code" className="moka-label">
                            Kode (cash/qris/debit/ewallet)
                        </label>
                        <input id="code" name="code" type="text" required defaultValue={paymentMethod.code} className="moka-input uppercase" />
                    </div>
                    <label className="inline-flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="is_active"
                            defaultChecked={paymentMethod.isActive}
                            className="rounded border-moka-line text-moka-primary focus:ring-moka-primary/40"
                        />
                        <span className="text-sm text-moka-muted">Metode aktif</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/admin/payment-methods" className="moka-btn-secondary">
                            Batal
                        </Link>
                        <button type="submit" className="moka-btn">
                            Simpan Perubahan
                        </button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}
