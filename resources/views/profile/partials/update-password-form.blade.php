<section x-data="{ passwordConfirmOpen: false, showCurrentPassword: false, showNewPassword: false, showConfirmPassword: false }">
    <header>
        <h2 class="font-display text-xl font-bold text-moka-ink">Ubah Password</h2>
        <p class="mt-1 text-sm text-moka-muted">Gunakan password panjang dan unik untuk keamanan akun.</p>
    </header>

    <form x-ref="passwordForm" method="post" action="{{ route('password.update') }}" class="mt-6 grid gap-4" @submit.prevent="passwordConfirmOpen = true">
        @csrf
        @method('put')

        <div>
            <x-input-label for="update_password_current_password" :value="'Password Saat Ini'" />
            <div class="relative">
                <x-text-input
                    id="update_password_current_password"
                    name="current_password"
                    x-bind:type="showCurrentPassword ? 'text' : 'password'"
                    class="mt-1 block w-full pr-12"
                    autocomplete="current-password"
                />
                <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-moka-muted transition hover:text-moka-primary"
                    @click="showCurrentPassword = !showCurrentPassword"
                    :aria-label="showCurrentPassword ? 'Sembunyikan password saat ini' : 'Tampilkan password saat ini'"
                >
                    <svg x-show="!showCurrentPassword" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg x-show="showCurrentPassword" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M17.94 17.94A10.94 10.94 0 0112 19C5 19 1 12 1 12a21.77 21.77 0 015.06-6.94" />
                        <path d="M9.9 4.24A10.94 10.94 0 0112 5c7 0 11 7 11 7a21.86 21.86 0 01-3.17 4.49" />
                        <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                </button>
            </div>
            <x-input-error :messages="$errors->updatePassword->get('current_password')" />
        </div>

        <div>
            <x-input-label for="update_password_password" :value="'Password Baru'" />
            <div class="relative">
                <x-text-input
                    id="update_password_password"
                    name="password"
                    x-bind:type="showNewPassword ? 'text' : 'password'"
                    class="mt-1 block w-full pr-12"
                    autocomplete="new-password"
                />
                <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-moka-muted transition hover:text-moka-primary"
                    @click="showNewPassword = !showNewPassword"
                    :aria-label="showNewPassword ? 'Sembunyikan password baru' : 'Tampilkan password baru'"
                >
                    <svg x-show="!showNewPassword" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg x-show="showNewPassword" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M17.94 17.94A10.94 10.94 0 0112 19C5 19 1 12 1 12a21.77 21.77 0 015.06-6.94" />
                        <path d="M9.9 4.24A10.94 10.94 0 0112 5c7 0 11 7 11 7a21.86 21.86 0 01-3.17 4.49" />
                        <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                </button>
            </div>
            <x-input-error :messages="$errors->updatePassword->get('password')" />
        </div>

        <div>
            <x-input-label for="update_password_password_confirmation" :value="'Konfirmasi Password Baru'" />
            <div class="relative">
                <x-text-input
                    id="update_password_password_confirmation"
                    name="password_confirmation"
                    x-bind:type="showConfirmPassword ? 'text' : 'password'"
                    class="mt-1 block w-full pr-12"
                    autocomplete="new-password"
                />
                <button
                    type="button"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-moka-muted transition hover:text-moka-primary"
                    @click="showConfirmPassword = !showConfirmPassword"
                    :aria-label="showConfirmPassword ? 'Sembunyikan konfirmasi password baru' : 'Tampilkan konfirmasi password baru'"
                >
                    <svg x-show="!showConfirmPassword" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                    <svg x-show="showConfirmPassword" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                        <path d="M17.94 17.94A10.94 10.94 0 0112 19C5 19 1 12 1 12a21.77 21.77 0 015.06-6.94" />
                        <path d="M9.9 4.24A10.94 10.94 0 0112 5c7 0 11 7 11 7a21.86 21.86 0 01-3.17 4.49" />
                        <path d="M14.12 14.12a3 3 0 01-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                </button>
            </div>
            <x-input-error :messages="$errors->updatePassword->get('password_confirmation')" />
        </div>

        <div class="flex items-center gap-3">
            <button type="submit" class="moka-btn">Simpan</button>

            @if (session('status') === 'password-updated')
                <p
                    x-data="{ show: true }"
                    x-show="show"
                    x-transition
                    x-init="setTimeout(() => show = false, 1800)"
                    class="text-sm text-moka-muted"
                >Password diperbarui.</p>
            @endif
        </div>
    </form>

    <x-ui.modal name="passwordConfirmOpen" maxWidth="md">
        <div class="moka-modal-content">
            <div class="moka-modal-header">
                <div>
                    <h3 class="moka-modal-title">Konfirmasi Password</h3>
                    <p class="moka-modal-subtitle">Ubah password akun sekarang?</p>
                </div>
                <button type="button" class="moka-modal-close" @click="passwordConfirmOpen = false" aria-label="Tutup popup">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M6 6l12 12M18 6l-12 12" stroke-width="1.8" stroke-linecap="round"></path>
                    </svg>
                </button>
            </div>

            <div class="moka-modal-footer">
                <button type="button" class="moka-btn-secondary" @click="passwordConfirmOpen = false">Batal</button>
                <button type="button" class="moka-btn" @click="$refs.passwordForm.submit()">Simpan</button>
            </div>
        </div>
    </x-ui.modal>
</section>
