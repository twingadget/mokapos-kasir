@php
    $user = auth()->user();
@endphp

<nav x-data="{ open: false, logoutOpen: false }" class="sticky top-0 z-40 border-b border-moka-line/80 bg-moka-card/90 backdrop-blur-md">
    <div class="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="{{ route('dashboard') }}" class="inline-flex items-center gap-3">
            <img src="{{ asset('logo.png') }}" alt="Moka POS" class="h-10 w-10 rounded-xl border border-moka-line object-cover">
            <div class="leading-tight">
                <p class="font-display text-base font-bold text-moka-ink">Moka Kasir</p>
                <p class="text-xs text-moka-muted">Bar POS</p>
            </div>
        </a>

        <div class="hidden items-center gap-2 lg:flex">
            @if($user?->canAccessAdminPanel())
                <a href="{{ route('admin.reports.index') }}" class="{{ request()->routeIs('admin.reports.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Laporan</a>
                <a href="{{ route('admin.orders.index') }}" class="{{ request()->routeIs('admin.orders.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Order</a>
                <a href="{{ route('admin.products.index') }}" class="{{ request()->routeIs('admin.products.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Produk</a>
                <a href="{{ route('admin.categories.index') }}" class="{{ request()->routeIs('admin.categories.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Kategori</a>
                <a href="{{ route('admin.payment-methods.index') }}" class="{{ request()->routeIs('admin.payment-methods.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Metode Bayar</a>
                <a href="{{ route('admin.cashiers.index') }}" class="{{ request()->routeIs('admin.cashiers.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Staff</a>
            @elseif($user?->isWaiter())
                <a href="{{ route('waiter.index') }}" class="{{ request()->routeIs('waiter.index') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Order</a>
                <a href="{{ route('waiter.history') }}" class="{{ request()->routeIs('waiter.history') || request()->routeIs('waiter.show') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Riwayat</a>
            @else
                <a href="{{ route('pos.index') }}" class="{{ request()->routeIs('pos.index') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">POS</a>
                <a href="{{ route('pos.history') }}" class="{{ request()->routeIs('pos.history') || request()->routeIs('pos.show') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Riwayat</a>
            @endif
        </div>

        <div class="hidden items-center gap-3 lg:flex">
            <a href="{{ route('profile.edit') }}" class="text-sm font-semibold text-moka-muted transition hover:text-moka-ink">Profil</a>
            <button type="button" class="moka-btn-danger px-4" @click="logoutOpen = true">Logout</button>
        </div>

        <button type="button" class="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-moka-line bg-moka-card lg:hidden" @click="open = !open" aria-label="Menu">
            <svg x-show="!open" class="h-5 w-5 text-moka-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 7h16M4 12h16M4 17h16" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
            <svg x-show="open" class="h-5 w-5 text-moka-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M6 6l12 12M18 6l-12 12" stroke-width="1.8" stroke-linecap="round"></path>
            </svg>
        </button>
    </div>

    <div x-show="open" x-transition class="border-t border-moka-line bg-moka-card px-4 py-3 lg:hidden">
        <div class="grid gap-2">
            @if($user?->canAccessAdminPanel())
                <a href="{{ route('admin.reports.index') }}" class="{{ request()->routeIs('admin.reports.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Laporan</a>
                <a href="{{ route('admin.orders.index') }}" class="{{ request()->routeIs('admin.orders.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Order</a>
                <a href="{{ route('admin.products.index') }}" class="{{ request()->routeIs('admin.products.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Produk</a>
                <a href="{{ route('admin.categories.index') }}" class="{{ request()->routeIs('admin.categories.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Kategori</a>
                <a href="{{ route('admin.payment-methods.index') }}" class="{{ request()->routeIs('admin.payment-methods.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Metode Bayar</a>
                <a href="{{ route('admin.cashiers.index') }}" class="{{ request()->routeIs('admin.cashiers.*') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Staff</a>
            @elseif($user?->isWaiter())
                <a href="{{ route('waiter.index') }}" class="{{ request()->routeIs('waiter.index') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Order</a>
                <a href="{{ route('waiter.history') }}" class="{{ request()->routeIs('waiter.history') || request()->routeIs('waiter.show') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Riwayat</a>
            @else
                <a href="{{ route('pos.index') }}" class="{{ request()->routeIs('pos.index') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">POS</a>
                <a href="{{ route('pos.history') }}" class="{{ request()->routeIs('pos.history') || request()->routeIs('pos.show') ? 'moka-chip moka-chip-active' : 'moka-chip' }}">Riwayat</a>
            @endif
        </div>

        <div class="mt-4 border-t border-moka-line pt-3">
            <p class="text-sm font-semibold text-moka-ink">{{ $user?->name }}</p>
            <p class="text-xs text-moka-muted">{{ $user?->email }}</p>
            <div class="mt-3 flex gap-2">
                <a href="{{ route('profile.edit') }}" class="moka-btn-secondary w-full">Profil</a>
                <button type="button" class="moka-btn-danger w-full" @click="logoutOpen = true">Logout</button>
            </div>
        </div>
    </div>

    <form x-ref="logoutForm" method="POST" action="{{ route('logout') }}" class="hidden">
        @csrf
    </form>

    <x-ui.modal name="logoutOpen" maxWidth="md">
        <div class="moka-modal-content">
            <div class="moka-modal-header">
                <div>
                    <h3 class="moka-modal-title">Konfirmasi Logout</h3>
                    <p class="moka-modal-subtitle">Yakin ingin keluar dari akun ini?</p>
                </div>
                <button type="button" class="moka-modal-close" @click="logoutOpen = false" aria-label="Tutup popup">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M6 6l12 12M18 6l-12 12" stroke-width="1.8" stroke-linecap="round"></path>
                    </svg>
                </button>
            </div>

            <div class="moka-modal-footer">
                <button type="button" class="moka-btn-secondary" @click="logoutOpen = false">Batal</button>
                <button type="button" class="moka-btn-danger" @click="$refs.logoutForm.submit()">Logout</button>
            </div>
        </div>
    </x-ui.modal>
</nav>


