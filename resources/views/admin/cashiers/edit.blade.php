<x-app-layout>
    <x-slot name="header">
        <div>
            <h1 class="font-display text-2xl font-bold text-moka-ink">Edit Staff</h1>
            <p class="text-sm text-moka-muted">Perbarui informasi akun kasir, waiter, atau manager.</p>
        </div>
        <a href="{{ route('admin.cashiers.index') }}" class="moka-btn-secondary">Kembali</a>
    </x-slot>

    <x-ui.card>
        <form method="POST" action="{{ route('admin.cashiers.update', $cashier) }}" class="space-y-5">
            @csrf
            @method('PUT')
            @include('admin.cashiers._form', ['cashier' => $cashier])

            <div class="flex justify-end gap-2">
                <a href="{{ route('admin.cashiers.index') }}" class="moka-btn-secondary">Batal</a>
                <button type="submit" class="moka-btn">Simpan</button>
            </div>
        </form>
    </x-ui.card>
</x-app-layout>
