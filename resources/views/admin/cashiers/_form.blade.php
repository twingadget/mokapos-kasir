@php
    $isEdit = isset($cashier);
@endphp

<div class="space-y-4" x-data="{ showPassword: false, showPasswordConfirmation: false }">
    <div>
        <x-input-label for="name" :value="'Nama Staff'" />
        <x-text-input id="name" name="name" type="text" class="mt-1 block w-full" :value="old('name', $cashier->name ?? '')" required autofocus />
        <x-input-error :messages="$errors->get('name')" class="mt-1" />
    </div>

    <div>
        <x-input-label for="role" :value="'Role'" />
        <select id="role" name="role" class="moka-select mt-1 block w-full" required>
            <option value="{{ \App\Models\User::ROLE_KASIR }}" @selected(old('role', $cashier->role ?? \App\Models\User::ROLE_KASIR) === \App\Models\User::ROLE_KASIR)>Kasir</option>
            <option value="{{ \App\Models\User::ROLE_WAITER }}" @selected(old('role', $cashier->role ?? \App\Models\User::ROLE_KASIR) === \App\Models\User::ROLE_WAITER)>Waiter</option>
            <option value="{{ \App\Models\User::ROLE_MANAGER }}" @selected(old('role', $cashier->role ?? \App\Models\User::ROLE_KASIR) === \App\Models\User::ROLE_MANAGER)>Manager</option>
        </select>
        <x-input-error :messages="$errors->get('role')" class="mt-1" />
    </div>

    <div>
        <x-input-label for="email" :value="'Email'" />
        <x-text-input id="email" name="email" type="email" class="mt-1 block w-full" :value="old('email', $cashier->email ?? '')" required autocomplete="username" />
        <x-input-error :messages="$errors->get('email')" class="mt-1" />
    </div>

    <div>
        <x-input-label for="password" :value="'Password'" />
        <div class="relative mt-1">
            <x-text-input
                id="password"
                name="password"
                :type="'password'"
                x-bind:type="showPassword ? 'text' : 'password'"
                class="block w-full pr-11"
                :required="!$isEdit"
                autocomplete="new-password"
            />
            <button
                type="button"
                class="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-moka-muted transition hover:text-moka-ink"
                @click="showPassword = !showPassword"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Lihat password'"
            >
                <svg x-show="!showPassword" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                    <circle cx="12" cy="12" r="3" stroke-width="1.8"></circle>
                </svg>
                <svg x-show="showPassword" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3l18 18" stroke-width="1.8" stroke-linecap="round"></path>
                    <path d="M10.6 10.6a2 2 0 002.8 2.8" stroke-width="1.8" stroke-linecap="round"></path>
                    <path d="M9.9 5.1A11.2 11.2 0 0112 5c6.5 0 10 7 10 7a17.8 17.8 0 01-4.2 4.8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M6.3 6.3C3.8 8.1 2 12 2 12s3.5 6 10 6c1.4 0 2.6-.2 3.8-.6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </button>
        </div>
        @if($isEdit)
            <p class="moka-helper mt-1">Kosongkan jika tidak ingin mengubah password.</p>
        @endif
        <x-input-error :messages="$errors->get('password')" class="mt-1" />
    </div>

    <div>
        <x-input-label for="password_confirmation" :value="'Konfirmasi Password'" />
        <div class="relative mt-1">
            <x-text-input
                id="password_confirmation"
                name="password_confirmation"
                :type="'password'"
                x-bind:type="showPasswordConfirmation ? 'text' : 'password'"
                class="block w-full pr-11"
                :required="!$isEdit"
                autocomplete="new-password"
            />
            <button
                type="button"
                class="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-moka-muted transition hover:text-moka-ink"
                @click="showPasswordConfirmation = !showPasswordConfirmation"
                :aria-label="showPasswordConfirmation ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'"
            >
                <svg x-show="!showPasswordConfirmation" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                    <circle cx="12" cy="12" r="3" stroke-width="1.8"></circle>
                </svg>
                <svg x-show="showPasswordConfirmation" x-cloak class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M3 3l18 18" stroke-width="1.8" stroke-linecap="round"></path>
                    <path d="M10.6 10.6a2 2 0 002.8 2.8" stroke-width="1.8" stroke-linecap="round"></path>
                    <path d="M9.9 5.1A11.2 11.2 0 0112 5c6.5 0 10 7 10 7a17.8 17.8 0 01-4.2 4.8" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M6.3 6.3C3.8 8.1 2 12 2 12s3.5 6 10 6c1.4 0 2.6-.2 3.8-.6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            </button>
        </div>
        <x-input-error :messages="$errors->get('password_confirmation')" class="mt-1" />
    </div>
</div>
