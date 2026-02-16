@php
    $canManage = auth()->user()->isAdmin();
@endphp

<x-app-layout>
    <x-slot name="header">
        <div>
            <h1 class="font-display text-2xl font-bold text-moka-ink">Metode Pembayaran</h1>
            <p class="text-sm text-moka-muted">Konfigurasi metode pembayaran aktif untuk checkout kasir.</p>
        </div>
        @if($canManage)
            <a href="{{ route('admin.payment-methods.create') }}" class="moka-btn">Tambah Metode</a>
        @endif
    </x-slot>

    <div x-data="{
        deleteOpen: false,
        deleteLabel: '',
        deleteForm: null,
        openDelete(form, label) {
            this.deleteForm = form;
            this.deleteLabel = label;
            this.deleteOpen = true;
        },
        confirmDelete() {
            if (this.deleteForm) {
                this.deleteForm.submit();
            }
        }
    }" class="space-y-4">
        <x-ui.card padding="p-0 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="moka-table moka-table-mobile">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>Kode</th>
                            <th>Status</th>
                            @if($canManage)
                                <th class="text-center">Aksi</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($paymentMethods as $paymentMethod)
                            <tr>
                                <td class="font-semibold">{{ $paymentMethod->name }}</td>
                                <td class="uppercase text-moka-muted">{{ $paymentMethod->code }}</td>
                                <td>
                                    <x-ui.badge :variant="$paymentMethod->is_active ? 'success' : 'warning'">
                                        {{ $paymentMethod->is_active ? 'Aktif' : 'Nonaktif' }}
                                    </x-ui.badge>
                                </td>
                                @if($canManage)
                                    <td class="text-center">
                                        <a href="{{ route('admin.payment-methods.edit', $paymentMethod) }}" class="text-sm font-semibold text-moka-primary hover:text-moka-ink">Edit</a>
                                        <form action="{{ route('admin.payment-methods.destroy', $paymentMethod) }}" method="POST" class="inline-block" x-ref="deleteForm{{ $paymentMethod->id }}">
                                            @csrf
                                            @method('DELETE')
                                            <button type="button" class="ml-3 text-sm font-semibold text-red-600 hover:text-red-700" @click.prevent="openDelete($refs.deleteForm{{ $paymentMethod->id }}, @js($paymentMethod->name))">Hapus</button>
                                        </form>
                                    </td>
                                @endif
                            </tr>
                        @empty
                            <tr>
                                <td colspan="{{ $canManage ? 4 : 3 }}" class="py-10 text-center text-sm text-moka-muted">Belum ada metode pembayaran.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </x-ui.card>

        @if($canManage)
            <x-ui.modal name="deleteOpen" maxWidth="md">
                <div class="moka-modal-content">
                    <div class="moka-modal-header">
                        <div>
                            <h3 class="moka-modal-title">Konfirmasi Hapus</h3>
                            <p class="moka-modal-subtitle">Hapus <span class="font-semibold" x-text="deleteLabel"></span>?</p>
                        </div>
                        <button type="button" class="moka-modal-close" @click="deleteOpen = false" aria-label="Tutup popup">
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M6 6l12 12M18 6l-12 12" stroke-width="1.8" stroke-linecap="round"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="moka-modal-footer">
                        <button type="button" class="moka-btn-secondary" @click="deleteOpen = false">Batal</button>
                        <button type="button" class="moka-btn-danger" @click="confirmDelete()">Hapus</button>
                    </div>
                </div>
            </x-ui.modal>
        @endif
    </div>

    <div class="mt-4">
        {{ $paymentMethods->links() }}
    </div>
</x-app-layout>
