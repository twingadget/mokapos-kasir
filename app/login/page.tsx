import LoginForm from "@/components/LoginForm";

type LoginPageProps = {
    searchParams: Promise<{
        error?: string;
        redirect?: string;
    }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams;

    return (
        <div className="page-shell">
            <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
                <div className="bg-blob -left-16 top-16 h-60 w-60 bg-moka-accent/35" />
                <div className="bg-blob -right-16 bottom-12 h-72 w-72 bg-moka-primary/20" />

                <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1.1fr_1fr]">
                    <section className="glass-card hidden p-10 lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-moka-line bg-moka-soft px-4 py-2">
                                <img src="/logo.png" alt="Moka POS" className="h-8 w-8 rounded-lg object-cover" />
                                <span className="font-display text-sm font-semibold text-moka-primary">Moka Kasir</span>
                            </div>
                            <h1 className="font-display text-4xl font-bold leading-tight text-moka-ink">
                                POS Bar yang cepat, rapi, dan nyaman dipakai kasir.
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-relaxed text-moka-muted">
                                Kelola transaksi harian, menu, dan laporan dalam satu tampilan yang clean ala Moka POS.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-moka-line bg-moka-soft/80 p-4 text-xs text-moka-muted">
                            Dibuat untuk operasional outlet harian dengan fokus speed checkout.
                        </div>
                    </section>

                    <section className="glass-card p-6 sm:p-8">
                        <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
                            <img src="/logo.png" alt="Moka POS" className="h-10 w-10 rounded-xl object-cover" />
                            <p className="font-display text-lg font-bold text-moka-primary">Moka Kasir</p>
                        </div>

                        <div className="mb-6">
                            <h1 className="font-display text-2xl font-bold text-moka-ink">Masuk ke Moka Kasir</h1>
                            <p className="mt-1 text-sm text-moka-muted">Gunakan akun admin, manager, atau kasir untuk mulai operasional.</p>
                        </div>

                        <LoginForm initialError={params.error} redirect={params.redirect} />
                    </section>
                </div>
            </div>
        </div>
    );
}
