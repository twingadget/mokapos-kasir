@php
    $userRole = auth()->user();
    $canUpdateEmail = $userRole->isAdmin();
@endphp

<section x-data="{ profileConfirmOpen: false }">
    <header>
        <h2 class="font-display text-xl font-bold text-moka-ink">Informasi Akun</h2>
        <p class="mt-1 text-sm text-moka-muted">
            {{ $canUpdateEmail ? 'Perbarui nama dan email admin.' : 'Perbarui nama akun.' }}
        </p>
    </header>

    <form id="send-verification" method="post" action="{{ route('verification.send') }}">
        @csrf
    </form>

    <form x-ref="profileForm" method="post" action="{{ route('profile.update') }}" class="mt-6 grid gap-4" @submit.prevent="profileConfirmOpen = true">
        @csrf
        @method('patch')

        <div>
            <x-input-label for="name" :value="'Nama'" />
            <x-text-input id="name" name="name" type="text" class="mt-1 block w-full" :value="old('name', $user->name)" required autofocus autocomplete="name" />
            <x-input-error :messages="$errors->get('name')" />
        </div>

        <div>
            <x-input-label for="email" :value="'Email'" />
            <x-text-input
                id="email"
                name="email"
                type="email"
                class="mt-1 block w-full {{ ! $canUpdateEmail ? 'bg-moka-soft/60 text-moka-ink' : '' }}"
                :value="old('email', $user->email)"
                required
                autocomplete="username"
                @if(! $canUpdateEmail) readonly @endif
            />
            @if(! $canUpdateEmail)
                <p class="mt-2 text-xs text-moka-muted">Email hanya bisa diubah oleh admin.</p>
            @elseif($canUpdateEmail)
                <p class="mt-2 text-xs text-moka-muted">Anda dapat mengganti email login admin di sini.</p>
            @endif
            <x-input-error :messages="$errors->get('email')" />

            @if ($user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail && ! $user->hasVerifiedEmail())
                <div class="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    Email belum terverifikasi.
                    <button form="send-verification" class="font-semibold underline">
                        Kirim ulang verifikasi
                    </button>
                </div>

                @if (session('status') === 'verification-link-sent')
                    <p class="mt-2 text-sm font-medium text-emerald-700">
                        Link verifikasi baru sudah dikirim.
                    </p>
                @endif
            @endif
        </div>

        <div class="flex items-center gap-3">
            <button type="submit" class="moka-btn">Simpan</button>

            @if (session('status') === 'profile-updated')
                <p
                    x-data="{ show: true }"
                    x-show="show"
                    x-transition
                    x-init="setTimeout(() => show = false, 1800)"
                    class="text-sm text-moka-muted"
                >Tersimpan.</p>
            @endif
        </div>
    </form>

    <x-ui.modal name="profileConfirmOpen" maxWidth="md">
        <div class="moka-modal-content">
            <div class="moka-modal-header">
                <div>
                    <h3 class="moka-modal-title">Konfirmasi Simpan</h3>
                    <p class="moka-modal-subtitle">Simpan perubahan informasi akun?</p>
                </div>
                <button type="button" class="moka-modal-close" @click="profileConfirmOpen = false" aria-label="Tutup popup">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M6 6l12 12M18 6l-12 12" stroke-width="1.8" stroke-linecap="round"></path>
                    </svg>
                </button>
            </div>

            <div class="moka-modal-footer">
                <button type="button" class="moka-btn-secondary" @click="profileConfirmOpen = false">Batal</button>
                <button type="button" class="moka-btn" @click="$refs.profileForm.submit()">Simpan</button>
            </div>
        </div>
    </x-ui.modal>
</section>
