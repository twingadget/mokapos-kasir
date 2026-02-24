import Link from "next/link";
import AppShell from "@/components/AppShell";
import { requireServerSessionUser } from "@/lib/server-auth";

export default async function AdminPaymentMethodCreatePage() {
    const user = await requireServerSessionUser(["admin", "manager"]);

    return (
        <AppShell user={user} active="admin.payment-methods">
            <div className="mb-5">
                <h1 className="font-display text-2xl font-bold text-moka-ink">Tambah Metode Pembayaran</h1>
                <p className="text-sm text-moka-muted">Tambahkan opsi pembayaran baru.</p>
            </div>

            <div className="soft-card p-5">
                <form method="POST" action="/admin/payment-methods/new/submit" className="grid gap-4">
                    <div>
                        <label htmlFor="name" className="moka-label">
                            Nama Metode
                        </label>
                        <input id="name" name="name" type="text" required className="moka-input" />
                    </div>
                    <div>
                        <label htmlFor="code" className="moka-label">
                            Kode (cash/qris/debit/ewallet)
                        </label>
                        <input id="code" name="code" type="text" required className="moka-input uppercase" />
                    </div>
                    <label className="inline-flex items-center gap-2">
                        <input type="checkbox" name="is_active" defaultChecked className="rounded border-moka-line text-moka-primary focus:ring-moka-primary/40" />
                        <span className="text-sm text-moka-muted">Metode aktif</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                        <Link href="/admin/payment-methods" className="moka-btn-secondary">
                            Batal
                        </Link>
                        <button type="submit" className="moka-btn">
                            Simpan Metode
                        </button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
}
