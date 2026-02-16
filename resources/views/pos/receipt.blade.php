<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Receipt {{ $order->invoice_no }}</title>
    <link rel="icon" type="image/png" href="{{ asset('logo.png') }}">
    <style>
        :root {
            color-scheme: dark;
        }

        body {
            margin: 0;
            min-height: 100vh;
            padding: 24px;
            color: #f5f5f5;
            font-family: "Sora", Arial, sans-serif;
            background-color: #0f0f0f;
            background-image:
                radial-gradient(120% 68% at 50% -18%, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.08) 36%, rgba(212, 175, 55, 0) 72%),
                radial-gradient(56% 38% at 12% 8%, rgba(199, 155, 46, 0.12) 0%, rgba(199, 155, 46, 0.04) 42%, rgba(199, 155, 46, 0) 80%),
                radial-gradient(56% 38% at 88% 10%, rgba(212, 175, 55, 0.12) 0%, rgba(212, 175, 55, 0.04) 42%, rgba(212, 175, 55, 0) 80%),
                linear-gradient(180deg, #0f0f0f 0%, #121212 58%, #0f0f0f 100%);
        }

        .receipt-shell {
            max-width: 420px;
            margin: 0 auto;
            border: 1px solid #dfd3c3;
            border-radius: 16px;
            background: #fff;
            box-shadow: 0 20px 38px -24px rgba(111, 78, 55, 0.5);
            overflow: hidden;
        }

        .receipt-head {
            padding: 16px;
            border-bottom: 1px dashed #d4c6b3;
            text-align: center;
        }

        .receipt-head img {
            width: 40px;
            height: 40px;
            border-radius: 12px;
            object-fit: cover;
            border: 1px solid #e7ded2;
        }

        .brand-title {
            margin: 8px 0 0;
            font-size: 18px;
            font-weight: 700;
            color: #2a2018;
        }

        .brand-subtitle {
            margin: 2px 0 0;
            font-size: 12px;
            color: #766454;
        }

        .receipt-body {
            padding: 16px;
            font-size: 13px;
            color: #2a2018;
        }

        .mono {
            font-family: "Courier New", Courier, monospace;
        }

        .line {
            border-top: 1px dashed #d4c6b3;
            margin: 10px 0;
        }

        .row {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            margin: 4px 0;
        }

        .row span:first-child,
        .row span:last-child {
            color: #2a2018;
        }

        .sub-row {
            font-size: 12px;
        }

        .sub-row span {
            color: #5f5043 !important;
        }

        .item-note {
            font-size: 12px;
            color: #5f5043;
        }

        .total-row {
            margin-top: 6px;
            font-size: 16px;
            font-weight: 700;
        }

        .total-row span {
            color: #2a2018 !important;
        }

        .footer-note {
            margin: 0;
            text-align: center;
            font-size: 12px;
            color: #2a2018;
        }

        .actions {
            max-width: 420px;
            margin: 12px auto 0;
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 42px;
            padding: 0 16px;
            border-radius: 999px;
            border: 1px solid #4b3a23;
            background: #1a1a1a;
            color: #f5f5f5;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .btn:hover {
            border-color: #c79b2e;
            background: #222;
        }

        .btn-primary {
            border-color: #c79b2e;
            background: #d4af37;
            color: #1a1408;
        }

        .btn-primary:hover {
            background: #c79b2e;
        }

        @media print {
            @page {
                size: 80mm auto;
                margin: 0;
            }

            :root {
                color-scheme: light;
            }

            body {
                background: #fff;
                color: #111;
                padding: 0;
            }

            .receipt-shell {
                max-width: 80mm;
                border: 0;
                border-radius: 0;
                box-shadow: none;
                background: #fff;
            }

            .receipt-head,
            .line {
                border-color: #ccc;
            }

            .brand-title,
            .row span:last-child,
            .total-row span {
                color: #111 !important;
            }

            .brand-subtitle,
            .row span:first-child,
            .sub-row span,
            .item-note,
            .footer-note {
                color: #444 !important;
            }

            .actions {
                display: none !important;
            }
        }
    </style>
</head>
<body>
    <div class="receipt-shell">
        <header class="receipt-head">
            <img src="{{ asset('logo.png') }}" alt="Logo">
            <h2 class="brand-title">Moka POS</h2>
            <p class="brand-subtitle">Solvix Bar</p>
        </header>
        <section class="receipt-body mono">
            <div class="row"><span>Invoice</span><strong>{{ $order->invoice_no }}</strong></div>
            <div class="row"><span>Tanggal</span><span>{{ optional($order->ordered_at)->format('d-m-Y H:i') }}</span></div>
            <div class="row"><span>Kasir</span><span>{{ $order->user?->name }}</span></div>
            <div class="row"><span>Bayar</span><span>{{ $order->payment_method }}</span></div>

            <div class="line"></div>

            @foreach($order->items as $item)
                <div style="margin-bottom:8px;">
                    <div class="row">
                        <span>{{ $item->name_snapshot }}</span>
                    </div>
                    <div class="row">
                        <span>{{ $item->qty }} x Rp {{ number_format((float) $item->price, 0, ',', '.') }}</span>
                        <span>Rp {{ number_format((float) $item->line_total, 0, ',', '.') }}</span>
                    </div>
                    @foreach($item->addons as $addon)
                        <div class="row sub-row">
                            <span>+ {{ $addon->name_snapshot }}</span>
                            <span>Rp {{ number_format((float) $addon->price, 0, ',', '.') }}</span>
                        </div>
                    @endforeach
                    @if($item->notes)
                        <div class="item-note">Catatan: {{ $item->notes }}</div>
                    @endif
                </div>
            @endforeach

            <div class="line"></div>

            <div class="row"><span>Subtotal</span><span>Rp {{ number_format((float) $order->subtotal, 0, ',', '.') }}</span></div>
            <div class="row"><span>Diskon</span><span>{{ $order->discount_type === 'percent' ? number_format((float) $order->discount_value, 2, ',', '.').'%' : 'Rp '.number_format((float) $order->discount_value, 0, ',', '.') }}</span></div>
            <div class="row"><span>Pajak</span><span>Rp {{ number_format((float) $order->tax, 0, ',', '.') }}</span></div>
            <div class="row"><span>Service</span><span>Rp {{ number_format((float) $order->service, 0, ',', '.') }}</span></div>
            <div class="row total-row">
                <span>TOTAL</span>
                <span>Rp {{ number_format((float) $order->total, 0, ',', '.') }}</span>
            </div>
            @if($order->cash_received !== null)
                <div class="row"><span>Cash</span><span>Rp {{ number_format((float) $order->cash_received, 0, ',', '.') }}</span></div>
                <div class="row"><span>Kembalian</span><span>Rp {{ number_format((float) $order->change, 0, ',', '.') }}</span></div>
            @endif

            <div class="line"></div>
            <p class="footer-note">Terima kasih, selamat menikmati.</p>
        </section>
    </div>

    <div class="actions">
        <button type="button" class="btn btn-primary" onclick="window.print()">Print</button>
        @if(auth()->user()->canAccessAdminPanel())
            <a href="{{ route('admin.orders.show', $order) }}" class="btn">Kembali ke Detail</a>
        @else
            <a href="{{ route('pos.history') }}" class="btn">Kembali ke Riwayat</a>
            <a href="{{ route('pos.index') }}" class="btn">Kembali ke POS</a>
        @endif
    </div>

    @if($autoPrint)
        <script>
            window.addEventListener('load', () => {
                window.print();
            });
        </script>
    @endif
</body>
</html>
