@php
    $canManage = auth()->user()->isAdmin();
@endphp

<x-app-layout>
    <x-slot name="header">
        <div>
            <h1 class="font-display text-2xl font-bold text-moka-ink">Produk Menu</h1>
            <p class="text-sm text-moka-muted">Kelola menu, varian, stok, dan status aktif produk Bar.</p>
        </div>
        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <form method="GET" action="{{ route('admin.products.index') }}" class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <input type="hidden" name="per_page" value="{{ $perPage }}">
                <div class="relative w-full sm:w-[360px]">
                    <span class="pointer-events-none absolute inline-flex items-center text-moka-muted" style="right: 0.75rem; top: 50%; transform: translateY(-50%);">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="m21 21-4.35-4.35" stroke-width="1.8" stroke-linecap="round"></path>
                            <circle cx="11" cy="11" r="6" stroke-width="1.8"></circle>
                        </svg>
                    </span>
                    <input
                        id="q"
                        name="q"
                        type="text"
                        value="{{ $search }}"
                        class="moka-input appearance-none pl-4 pr-10 text-left"
                        placeholder="cari data"
                    >
                </div>
                <button type="submit" class="moka-btn">Cari</button>
                @if($search !== '')
                    <a href="{{ route('admin.products.index', ['per_page' => $perPage]) }}" class="moka-btn-secondary">Reset</a>
                @endif
            </form>

            @if($canManage)
                <a href="{{ route('admin.products.create') }}" class="moka-btn">Tambah Produk</a>
            @endif
        </div>
    </x-slot>

    <div x-data="{
        viewMode: localStorage.getItem('admin_products_view_mode') || 'table',
        deleteOpen: false,
        deleteLabel: '',
        deleteForm: null,
        setView(mode) {
            this.viewMode = mode;
            localStorage.setItem('admin_products_view_mode', mode);
        },
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
        <x-ui.card>
            <div class="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p class="text-sm font-semibold text-moka-ink">Tampilan daftar produk</p>
                    <p class="text-xs text-moka-muted">Pilih mode tabel atau kartu.</p>
                </div>

                <div class="flex flex-wrap items-center gap-3">
                    <form method="GET" action="{{ route('admin.products.index') }}" class="flex items-center gap-2">
                        <input type="hidden" name="q" value="{{ $search }}">
                        <label for="per_page" class="text-sm font-medium text-moka-muted">Tampilkan</label>
                        <select id="per_page" name="per_page" class="moka-select h-10 w-[140px]" onchange="this.form.submit()">
                            <option value="10" @selected((string) $perPage === '10')>10 data</option>
                            <option value="15" @selected((string) $perPage === '15')>15 data</option>
                            <option value="25" @selected((string) $perPage === '25')>25 data</option>
                            <option value="50" @selected((string) $perPage === '50')>50 data</option>
                            <option value="100" @selected((string) $perPage === '100')>100 data</option>
                            <option value="all" @selected((string) $perPage === 'all')>Semua</option>
                        </select>
                    </form>

                    <div class="inline-flex rounded-xl border border-moka-line bg-moka-card p-1">
                        <button type="button" class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg transition" :class="viewMode === 'table' ? 'bg-moka-primary text-[#1A1408]' : 'text-moka-muted hover:bg-moka-soft'" @click="setView('table')" aria-label="Tampilan tabel">
                            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M4 7h16M4 12h16M4 17h16" stroke-width="1.8" stroke-linecap="round"></path>
                            </svg>
                        </button>
                        <button type="button" class="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg transition" :class="viewMode === 'card' ? 'bg-moka-primary text-[#1A1408]' : 'text-moka-muted hover:bg-moka-soft'" @click="setView('card')" aria-label="Tampilan kartu">
                            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="4" y="4" width="7" height="7" rx="1.5" stroke-width="1.8"></rect>
                                <rect x="13" y="4" width="7" height="7" rx="1.5" stroke-width="1.8"></rect>
                                <rect x="4" y="13" width="7" height="7" rx="1.5" stroke-width="1.8"></rect>
                                <rect x="13" y="13" width="7" height="7" rx="1.5" stroke-width="1.8"></rect>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </x-ui.card>

        <x-ui.card x-show="viewMode === 'table'" padding="p-0 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="moka-table moka-table-mobile">
                    <thead>
                        <tr>
                            <th>Nama</th>
                            <th>SKU</th>
                            <th>Kategori</th>
                            <th>Modal</th>
                            <th>Harga</th>
                            <th>Stok</th>
                            <th>Status</th>
                            @if($canManage)
                                <th class="text-center">Aksi</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @forelse ($products as $product)
                            <tr>
                                <td>
                                    <p class="font-semibold">{{ $product->name }}</p>
                                    @if($product->variants->isNotEmpty())
                                        <p class="text-xs text-moka-muted">{{ $product->variants->count() }} varian</p>
                                    @endif
                                </td>
                                <td class="uppercase text-moka-muted">{{ $product->sku }}</td>
                                <td>{{ $product->category?->name ?? '-' }}</td>
                                <td class="text-money">Rp {{ number_format((float) $product->cost_price, 0, ',', '.') }}</td>
                                <td class="text-money">Rp {{ number_format((float) $product->price, 0, ',', '.') }}</td>
                                <td>{{ $product->track_stock ? $product->stock_qty : 'Non-stok' }}</td>
                                <td>
                                    <x-ui.badge :variant="$product->is_active ? 'success' : 'warning'">
                                        {{ $product->is_active ? 'Aktif' : 'Nonaktif' }}
                                    </x-ui.badge>
                                </td>
                                @if($canManage)
                                    <td class="text-center">
                                        <a href="{{ route('admin.products.edit', $product) }}" class="text-sm font-semibold text-moka-primary hover:text-moka-ink">Edit</a>
                                        <form action="{{ route('admin.products.destroy', $product) }}" method="POST" class="inline-block" x-ref="deleteForm{{ $product->id }}">
                                            @csrf
                                            @method('DELETE')
                                            <button type="button" class="ml-3 text-sm font-semibold text-red-600 hover:text-red-700" @click.prevent="openDelete($refs.deleteForm{{ $product->id }}, @js($product->name))">Hapus</button>
                                        </form>
                                    </td>
                                @endif
                            </tr>
                        @empty
                            <tr>
                                <td colspan="{{ $canManage ? 8 : 7 }}" class="py-10 text-center text-sm text-moka-muted">Belum ada produk.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </x-ui.card>

        <div x-show="viewMode === 'card'" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @forelse($products as $product)
                <x-ui.card>
                    <div class="mb-3 flex items-start justify-between gap-3">
                        <div>
                            <h3 class="font-display text-lg font-bold text-moka-ink">{{ $product->name }}</h3>
                            <p class="text-xs uppercase tracking-wide text-moka-muted">{{ $product->sku }}</p>
                        </div>
                        <x-ui.badge :variant="$product->is_active ? 'success' : 'warning'">
                            {{ $product->is_active ? 'Aktif' : 'Nonaktif' }}
                        </x-ui.badge>
                    </div>

                    @if($product->image_url)
                        <img src="{{ $product->image_url }}" alt="{{ $product->name }}" class="mb-3 h-72 w-full rounded-xl object-cover object-center">
                    @else
                        <div class="mb-3 flex h-72 items-center justify-center rounded-xl border border-dashed border-moka-line bg-moka-soft/60 text-sm text-moka-muted">
                            Belum ada gambar
                        </div>
                    @endif

                    <div class="mb-3 flex flex-wrap items-center gap-2">
                        <x-ui.badge variant="primary">{{ $product->category?->name ?? '-' }}</x-ui.badge>
                        @if($product->variants->isNotEmpty())
                            <x-ui.badge>{{ $product->variants->count() }} Varian</x-ui.badge>
                        @endif
                        @if($product->track_stock)
                            <x-ui.badge variant="warning">Stok: {{ $product->stock_qty }}</x-ui.badge>
                        @else
                            <x-ui.badge>Non-stok</x-ui.badge>
                        @endif
                    </div>

                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-display text-xl font-bold text-moka-primary text-money">Rp {{ number_format((float) $product->price, 0, ',', '.') }}</p>
                            <p class="text-xs text-moka-muted text-money">Modal: Rp {{ number_format((float) $product->cost_price, 0, ',', '.') }}</p>
                        </div>
@if($canManage)
                            <div class="flex items-center gap-2">
                                <a href="{{ route('admin.products.edit', $product) }}" class="moka-btn-secondary px-4">Edit</a>
                                <form action="{{ route('admin.products.destroy', $product) }}" method="POST" x-ref="deleteCardForm{{ $product->id }}">
                                    @csrf
                                    @method('DELETE')
                                    <button type="button" class="moka-btn-danger px-4" @click.prevent="openDelete($refs.deleteCardForm{{ $product->id }}, @js($product->name))">Hapus</button>
                                </form>
                            </div>
                        @endif
                    </div>
                </x-ui.card>
            @empty
                <x-ui.card class="sm:col-span-2 xl:col-span-3">
                    <p class="text-center text-sm text-moka-muted">Belum ada produk.</p>
                </x-ui.card>
            @endforelse
        </div>
    </div>

    <div class="mt-4">
        {{ $products->links() }}
    </div>

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
</x-app-layout>


