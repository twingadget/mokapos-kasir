<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class OrderController extends Controller
{
    public function index(Request $request): View
    {
        $search = trim((string) $request->query('q', ''));

        $perPage = (string) $request->query('per_page', '10');
        $allowedPerPage = ['10', '25', '50', '100', 'all'];
        if (! in_array($perPage, $allowedPerPage, true)) {
            $perPage = '10';
        }

        $exactDate = $this->extractDateFromSearch($search);
        $searchMonth = $this->extractMonthFromSearch($search);
        $searchYear = $this->extractYearFromSearch($search);

        $ordersQuery = Order::query()
            ->with([
                'user:id,name,email',
                'waiter:id,name,email',
                'items:id,order_id,product_id,cost_price,qty,line_cost_total',
                'items.product:id,cost_price',
            ])
            ->when($search !== '', function ($query) use ($search, $exactDate, $searchMonth, $searchYear): void {
                $query->where(function ($searchQuery) use ($search, $exactDate, $searchMonth, $searchYear): void {
                    $searchQuery
                        ->where('invoice_no', 'like', "%{$search}%")
                        ->orWhere('payment_method', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                        ->orWhere('notes', 'like', "%{$search}%")
                        ->orWhereRaw('CAST(id AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(subtotal AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(discount_value AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(tax AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(service AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(total AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(cash_received AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('CAST(`change` AS CHAR) LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('DATE_FORMAT(ordered_at, "%d-%m-%Y") LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('DATE_FORMAT(ordered_at, "%d/%m/%Y") LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('DATE_FORMAT(ordered_at, "%Y-%m-%d") LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('DATE_FORMAT(ordered_at, "%d %b %Y") LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('DATE_FORMAT(ordered_at, "%d %M %Y") LIKE ?', ["%{$search}%"])
                        ->orWhereRaw('DATE_FORMAT(ordered_at, "%H:%i") LIKE ?', ["%{$search}%"])
                        ->orWhereHas('items', function ($itemQuery) use ($search): void {
                            $itemQuery
                                ->where('name_snapshot', 'like', "%{$search}%")
                                ->orWhereRaw('CAST(price AS CHAR) LIKE ?', ["%{$search}%"])
                                ->orWhereRaw('CAST(cost_price AS CHAR) LIKE ?', ["%{$search}%"])
                                ->orWhereRaw('CAST(line_total AS CHAR) LIKE ?', ["%{$search}%"])
                                ->orWhereRaw('CAST(line_cost_total AS CHAR) LIKE ?', ["%{$search}%"]);
                        })
                        ->orWhereHas('user', function ($userQuery) use ($search): void {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        })
                        ->orWhereHas('waiter', function ($waiterQuery) use ($search): void {
                            $waiterQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        });

                    if ($exactDate !== null) {
                        $searchQuery->orWhereDate('ordered_at', $exactDate);
                    }

                    if ($searchMonth !== null && $searchYear !== null) {
                        $searchQuery->orWhere(function ($dateQuery) use ($searchMonth, $searchYear): void {
                            $dateQuery
                                ->whereMonth('ordered_at', $searchMonth)
                                ->whereYear('ordered_at', $searchYear);
                        });
                    } elseif ($searchMonth !== null) {
                        $searchQuery->orWhereMonth('ordered_at', $searchMonth);
                    } elseif ($searchYear !== null) {
                        $searchQuery->orWhereYear('ordered_at', $searchYear);
                    }
                });
            })
            ->orderByRaw("CASE WHEN status = 'WAITING' THEN 0 WHEN status = 'OPEN_BILL' THEN 1 WHEN status = 'PAID' THEN 2 ELSE 3 END")
            ->orderByDesc('ordered_at');

        if ($perPage === 'all') {
            $totalRows = (clone $ordersQuery)->count();
            $orders = $ordersQuery
                ->paginate(max($totalRows, 1))
                ->withQueryString();
        } else {
            $orders = $ordersQuery
                ->paginate((int) $perPage)
                ->withQueryString();
        }

        return view('admin.orders.index', [
            'orders' => $orders,
            'search' => $search,
            'perPage' => $perPage,
        ]);
    }

    private function extractDateFromSearch(string $search): ?string
    {
        if ($search === '') {
            return null;
        }

        if (preg_match('/\b(\d{2}[\/-]\d{2}[\/-]\d{4}|\d{4}-\d{2}-\d{2})\b/', $search, $matches) !== 1) {
            return null;
        }

        $token = $matches[1];

        $formats = ['d-m-Y', 'd/m/Y', 'Y-m-d'];
        foreach ($formats as $format) {
            try {
                $date = Carbon::createFromFormat($format, $token);

                if ($date instanceof Carbon && $date->format($format) === $token) {
                    return $date->toDateString();
                }
            } catch (\Throwable $exception) {
                continue;
            }
        }

        return null;
    }

    private function extractMonthFromSearch(string $search): ?int
    {
        if ($search === '') {
            return null;
        }

        $monthMap = [
            'januari' => 1, 'january' => 1, 'jan' => 1,
            'februari' => 2, 'february' => 2, 'feb' => 2,
            'maret' => 3, 'march' => 3, 'mar' => 3,
            'april' => 4, 'apr' => 4,
            'mei' => 5, 'may' => 5,
            'juni' => 6, 'june' => 6, 'jun' => 6,
            'juli' => 7, 'july' => 7, 'jul' => 7,
            'agustus' => 8, 'august' => 8, 'agu' => 8, 'aug' => 8,
            'september' => 9, 'sep' => 9,
            'oktober' => 10, 'october' => 10, 'okt' => 10, 'oct' => 10,
            'november' => 11, 'nov' => 11,
            'desember' => 12, 'december' => 12, 'des' => 12, 'dec' => 12,
        ];

        $normalizedSearch = mb_strtolower($search);
        foreach ($monthMap as $keyword => $monthNumber) {
            if (preg_match('/\b'.preg_quote($keyword, '/').'\b/u', $normalizedSearch) === 1) {
                return $monthNumber;
            }
        }

        return null;
    }

    private function extractYearFromSearch(string $search): ?int
    {
        if (preg_match('/\b(?:19|20)\d{2}\b/', $search, $matches) === 1) {
            return (int) $matches[0];
        }

        return null;
    }

    public function show(Order $order): View
    {
        $order->load(['items.addons', 'user']);

        return view('admin.orders.show', [
            'order' => $order,
        ]);
    }

    public function void(Order $order): RedirectResponse
    {
        $this->authorize('void', $order);

        DB::transaction(function () use ($order): void {
            $order->loadMissing('items.product');

            if ($order->status === 'VOID') {
                return;
            }

            foreach ($order->items as $item) {
                if (! $item->product || ! $item->product->track_stock) {
                    continue;
                }

                $item->product->increment('stock_qty', $item->qty);
            }

            $order->update([
                'status' => 'VOID',
                'payment_method' => 'CANCELED',
            ]);
        });

        return back()->with('success', 'Pesanan berhasil dibatalkan.');
    }
}
