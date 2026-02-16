@php
    $isAdmin = auth()->user()->isAdmin();
@endphp

<x-app-layout>
    <x-slot name="header">
        <div>
            <h1 class="font-display text-2xl font-bold text-moka-ink">List Order</h1>
            <p class="text-sm text-moka-muted">Pantau semua order, cari data cepat, dan lakukan pembatalan bila diperlukan.</p>
        </div>

        <form method="GET" action="{{ route('admin.orders.index') }}" class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
                <a href="{{ route('admin.orders.index', ['per_page' => $perPage]) }}" class="moka-btn-secondary">Reset</a>
            @endif
        </form>
    </x-slot>

    <x-ui.card class="mt-1" padding="p-0 overflow-hidden" x-data="{ cancelOpen: false, cancelTarget: null }">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-moka-line px-5 py-4">
            <h2 class="font-display text-lg font-bold text-moka-ink">Data Order</h2>

            <form method="GET" action="{{ route('admin.orders.index') }}" class="flex items-center gap-2">
                <input type="hidden" name="q" value="{{ $search }}">
                <label for="per_page" class="text-sm font-medium text-moka-muted">Tampilkan</label>
                <select id="per_page" name="per_page" class="moka-select h-10 w-[140px]" onchange="this.form.submit()">
                    <option value="10" @selected((string) $perPage === '10')>10 data</option>
                    <option value="25" @selected((string) $perPage === '25')>25 data</option>
                    <option value="50" @selected((string) $perPage === '50')>50 data</option>
                    <option value="100" @selected((string) $perPage === '100')>100 data</option>
                    <option value="all" @selected((string) $perPage === 'all')>Semua</option>
                </select>
            </form>
        </div>

        <div class="overflow-x-auto">
            <table class="moka-table moka-table-mobile">
                <thead>
                    <tr>
                        <th>Invoice / ID</th>
                        <th>Waktu</th>
                        <th>Kasir</th>
                        <th>Waiter</th>
                        <th>Status</th>
                        <th>Metode</th>
                        <th>Total</th>
                        <th>Modal</th>
                        <th>Laba</th>
                        <th class="text-center">Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($orders as $order)
                        @php
                            $isDraft = in_array($order->status, ['OPEN_BILL', 'WAITING'], true);
                            $orderCost = (float) $order->items->sum(fn ($item) => (float) $item->resolved_line_cost_total);
                            $orderProfit = (float) $order->total - $orderCost;
                            $statusVariant = $order->status === 'PAID'
                                ? 'success'
                                : (in_array($order->status, ['OPEN_BILL', 'WAITING'], true) ? 'warning' : 'danger');
                            $cashierName = $order->status === 'WAITING' ? '-' : ($order->user?->name ?? '-');
                        @endphp
                        <tr>
                            <td class="font-semibold">
                                {{ $order->status === 'OPEN_BILL' ? 'Open Bill #'.$order->id : ($order->status === 'WAITING' ? 'Pesanan #'.$order->id : $order->invoice_no) }}
                            </td>
                            <td>{{ optional($order->ordered_at)->format('d M Y H:i') }}</td>
                            <td>{{ $cashierName }}</td>
                            <td>{{ $order->waiter?->name ?? '-' }}</td>
                            <td>
                                <x-ui.badge :variant="$statusVariant">{{ $order->status }}</x-ui.badge>
                            </td>
                            <td>{{ $isDraft ? '-' : $order->payment_method }}</td>
                            <td class="text-money">Rp {{ number_format((float) $order->total, 0, ',', '.') }}</td>
                            <td class="text-money">Rp {{ number_format($orderCost, 0, ',', '.') }}</td>
                            <td class="text-money">Rp {{ number_format($orderProfit, 0, ',', '.') }}</td>
                            <td class="text-center">
                                <div class="inline-flex items-center justify-center gap-2">
                                    <a
                                        href="{{ route('admin.orders.show', $order) }}"
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-moka-line text-moka-primary transition hover:border-moka-primary hover:bg-moka-soft/70"
                                        title="Detail"
                                        aria-label="Detail"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                            <path d="M10 3C5 3 1.73 7.11.46 9.07a1.63 1.63 0 000 1.86C1.73 12.89 5 17 10 17s8.27-4.11 9.54-6.07a1.63 1.63 0 000-1.86C18.27 7.11 15 3 10 3zm0 11a4 4 0 110-8 4 4 0 010 8z"/>
                                        </svg>
                                    </a>

                                    @if($order->status === 'PAID' && $isAdmin)
                                        <a
                                            href="{{ route('orders.receipt', $order) }}"
                                            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-moka-line text-moka-primary transition hover:border-moka-primary hover:bg-moka-soft/70"
                                            title="Cetak Ulang"
                                            aria-label="Cetak Ulang"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                <path d="M5 3a2 2 0 00-2 2v2h2V5h10v2h2V5a2 2 0 00-2-2H5z"/>
                                                <path fill-rule="evenodd" d="M3 8a2 2 0 00-2 2v3a2 2 0 002 2h2v2h10v-2h2a2 2 0 002-2v-3a2 2 0 00-2-2H3zm4 7v-3h6v3H7zm8-4a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
                                            </svg>
                                        </a>
                                    @endif

                                    @can('void', $order)
                                        <button
                                            type="button"
                                            class="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#A84D4D] text-[#FF9B9B] transition hover:border-[#C05D5D] hover:bg-[#321B1B]"
                                            title="Batalkan"
                                            aria-label="Batalkan"
                                            @click="cancelTarget = '{{ route('admin.orders.void', $order) }}'; cancelOpen = true"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                <path d="M6 6l12 12M18 6l-12 12" stroke-width="2" stroke-linecap="round"></path>
                                            </svg>
                                        </button>
                                    @endcan
                                </div>
                            </td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="10" class="py-10 text-center text-sm text-moka-muted">Data order belum ditemukan.</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>
        </div>

        <form x-ref="cancelForm" method="POST" :action="cancelTarget" class="hidden">
            @csrf
        </form>

        <x-ui.modal name="cancelOpen" maxWidth="md">
            <div class="moka-modal-content">
                <div class="moka-modal-header">
                    <div>
                        <h3 class="moka-modal-title">Batalkan Pesanan</h3>
                        <p class="moka-modal-subtitle">Batalkan pesanan ini sebelum diproses?</p>
                    </div>
                    <button type="button" class="moka-modal-close" @click="cancelOpen = false" aria-label="Tutup popup">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M6 6l12 12M18 6l-12 12" stroke-width="1.8" stroke-linecap="round"></path>
                        </svg>
                    </button>
                </div>
                <div class="moka-modal-footer">
                    <button type="button" class="moka-btn-secondary" @click="cancelOpen = false">Tidak</button>
                    <button type="button" class="moka-btn-danger" @click="$refs.cancelForm.submit()">Ya, Batalkan</button>
                </div>
            </div>
        </x-ui.modal>
    </x-ui.card>

    <div class="mt-4">
        {{ $orders->links() }}
    </div>
</x-app-layout>
