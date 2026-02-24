import Link from "next/link";
import AppShell from "@/components/AppShell";
import StaffForm from "@/components/StaffForm";
import { requireServerSessionUser } from "@/lib/server-auth";

export default async function AdminStaffCreatePage() {
    const user = await requireServerSessionUser(["admin", "manager"]);

    return (
        <AppShell user={user} active="admin.staff">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Tambah Staff</h1>
                    <p className="text-sm text-moka-muted">Buat akun kasir, waiter, atau manager baru untuk operasional.</p>
                </div>
                <Link href="/admin/staff" className="moka-btn-secondary">
                    Kembali
                </Link>
            </div>

            <div className="soft-card p-5">
                <StaffForm action="/admin/staff/new/submit" submitLabel="Simpan" cancelHref="/admin/staff" />
            </div>
        </AppShell>
    );
}
