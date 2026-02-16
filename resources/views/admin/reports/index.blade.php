@php
    $isAdmin = auth()->user()->isAdmin();
@endphp

<x-app-layout>
    <x-slot name="header">
        <div>
            <h1 class="font-display text-2xl font-bold text-moka-ink">Laporan Penjualan</h1>
            <p class="text-sm text-moka-muted">Pantau omzet, transaksi, dan produk terlaris.</p>
        </div>
    </x-slot>

    <x-ui.card>
        <form method="GET" action="{{ route('admin.reports.index') }}" class="grid gap-3 md:grid-cols-4">
            <div>
                <label for="from" class="moka-label">Dari Tanggal</label>
                <input id="from" name="from" type="date" value="{{ $from }}" class="moka-input">
            </div>
            <div>
                <label for="to" class="moka-label">Sampai Tanggal</label>
                <input id="to" name="to" type="date" value="{{ $to }}" class="moka-input">
            </div>
            <div class="md:col-span-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-end">
                <button type="submit" class="moka-btn">Terapkan Filter</button>
                @if($isAdmin)
                    <a href="{{ route('admin.reports.export', ['from' => $from, 'to' => $to]) }}" class="moka-btn-secondary">Export CSV</a>
                @endif
            </div>
        </form>
    </x-ui.card>

    <div class="mt-4 grid gap-4 md:grid-cols-3">
        <x-ui.card>
            <p class="text-xs uppercase tracking-wide text-moka-muted">Total Omzet</p>
            <p class="mt-2 font-display text-3xl font-bold text-moka-primary text-money">Rp {{ number_format($totalOmzet, 0, ',', '.') }}</p>
        </x-ui.card>
        <x-ui.card>
            <p class="text-xs uppercase tracking-wide text-moka-muted">Jumlah Transaksi</p>
            <p class="mt-2 font-display text-3xl font-bold text-moka-primary text-money">{{ number_format($transactionCount, 0, ',', '.') }}</p>
        </x-ui.card>
        <x-ui.card>
            <p class="text-xs uppercase tracking-wide text-moka-muted">Laba Kotor</p>
            <p class="mt-2 font-display text-3xl font-bold text-moka-primary text-money">Rp {{ number_format($grossProfit, 0, ',', '.') }}</p>
        </x-ui.card>
    </div>

    <div class="mt-4 grid gap-4 xl:grid-cols-2">
        <x-ui.card padding="p-0 overflow-hidden">
            <div class="border-b border-moka-line px-5 py-4">
                <h2 class="font-display text-lg font-bold text-moka-ink">Breakdown Metode Bayar</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="moka-table moka-table-mobile">
                    <thead>
                        <tr>
                            <th>Metode</th>
                            <th>Transaksi</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($breakdown as $item)
                            <tr>
                                <td class="font-semibold">{{ $item->payment_method }}</td>
                                <td class="text-money">{{ number_format((int) $item->transaksi, 0, ',', '.') }}</td>
                                <td class="text-money">Rp {{ number_format((float) $item->total, 0, ',', '.') }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="3" class="py-8 text-center text-sm text-moka-muted">Belum ada transaksi.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </x-ui.card>

        <x-ui.card padding="p-0 overflow-hidden">
            <div class="border-b border-moka-line px-5 py-4">
                <h2 class="font-display text-lg font-bold text-moka-ink">Top 4 Menu</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="moka-table moka-table-mobile">
                    <thead>
                        <tr>
                            <th>Menu</th>
                            <th>Qty</th>
                            <th>Modal</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($topItems as $item)
                            <tr>
                                <td class="font-semibold">{{ $item->name_snapshot }}</td>
                                <td class="text-money">{{ number_format((int) $item->qty, 0, ',', '.') }}</td>
                                <td class="text-money">Rp {{ number_format((float) $item->modal, 0, ',', '.') }}</td>
                                <td class="text-money">Rp {{ number_format((float) $item->total, 0, ',', '.') }}</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" class="py-8 text-center text-sm text-moka-muted">Belum ada data.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </div>
        </x-ui.card>
    </div>

    <x-ui.card class="mt-4" padding="p-0 overflow-hidden" x-data="{ cancelOpen: false, cancelTarget: null }">
        <div class="border-b border-moka-line px-5 py-4">
            <h2 class="font-display text-lg font-bold text-moka-ink">Daftar Transaksi</h2>
        </div>
        <div class="overflow-x-auto">
            <table class="moka-table moka-table-mobile">
                <thead>
                    <tr>
                        <th>Invoice</th>
                        <th>Waktu</th>
                        <th>Kasir</th>
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
                            $orderCost = (float) $order->items->sum(fn ($item) => (float) $item->resolved_line_cost_total);
                            $orderProfit = (float) $order->total - $orderCost;
                            $statusVariant = $order->status === 'PAID'
                                ? 'success'
                                : (in_array($order->status, ['OPEN_BILL', 'WAITING'], true) ? 'warning' : 'danger');
                            $isDraft = in_array($order->status, ['OPEN_BILL', 'WAITING'], true);
                        @endphp
                        <tr>
                            <td class="font-semibold">
                                {{ $order->status === 'OPEN_BILL' ? 'Open Bill #'.$order->id : ($order->status === 'WAITING' ? 'Pesanan #'.$order->id : $order->invoice_no) }}
                            </td>
                            <td>{{ optional($order->ordered_at)->format('d M Y H:i') }}</td>
                            <td>{{ $order->user?->name ?? '-' }}</td>
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
                                    @if($order->status === 'PAID')
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
                            <td colspan="9" class="py-10 text-center text-sm text-moka-muted">Belum ada transaksi pada rentang tanggal ini.</td>
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

