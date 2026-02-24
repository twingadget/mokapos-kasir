import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import StaffForm from "@/components/StaffForm";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

type AdminStaffEditPageProps = {
    params: Promise<{ id: string }>;
};

export default async function AdminStaffEditPage({ params }: AdminStaffEditPageProps) {
    const user = await requireServerSessionUser(["admin", "manager"]);
    const routeParams = await params;
    const id = Number(routeParams.id);

    if (!Number.isInteger(id) || id <= 0) {
        notFound();
    }

    const staff = await prisma.user.findUnique({
        where: { id },
    });

    if (!staff || !["kasir", "waiter", "manager"].includes(staff.role)) {
        notFound();
    }

    return (
        <AppShell user={user} active="admin.staff">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl font-bold text-moka-ink">Edit Staff</h1>
                    <p className="text-sm text-moka-muted">Perbarui informasi akun kasir, waiter, atau manager.</p>
                </div>
                <Link href="/admin/staff" className="moka-btn-secondary">
                    Kembali
                </Link>
            </div>

            <div className="soft-card p-5">
                <StaffForm
                    action={`/admin/staff/${staff.id}/edit/submit`}
                    submitLabel="Simpan"
                    cancelHref="/admin/staff"
                    isEdit
                    initial={{
                        name: staff.name,
                        email: staff.email,
                        role: staff.role === "waiter" || staff.role === "manager" ? staff.role : "kasir",
                    }}
                />
            </div>
        </AppShell>
    );
}
