import AppShell from "@/components/AppShell";
import ProfileForms from "@/components/ProfileForms";
import { prisma } from "@/lib/prisma";
import { requireServerSessionUser } from "@/lib/server-auth";

export default async function ProfilePage() {
    const sessionUser = await requireServerSessionUser();

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
        },
    });

    if (!user) {
        return null;
    }

    return (
        <AppShell user={sessionUser} active="">
            <div className="mb-5">
                <h1 className="font-display text-2xl font-bold text-moka-ink">Pengaturan Profil</h1>
                <p className="text-sm text-moka-muted">Kelola data akun dan keamanan login.</p>
            </div>

            <ProfileForms role={user.role} name={user.name} email={user.email} />
        </AppShell>
    );
}
