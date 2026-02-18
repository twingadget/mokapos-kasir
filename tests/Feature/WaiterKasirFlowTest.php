<?php

namespace Tests\Feature;

use App\Models\Addon;
use App\Models\Category;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WaiterKasirFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_waiter_order_muncul_di_kasir_dan_bisa_diproses_ke_paid(): void
    {
        $waiter = User::factory()->create([
            'role' => User::ROLE_WAITER,
        ]);

        $kasir = User::factory()->create([
            'role' => User::ROLE_KASIR,
        ]);

        $category = Category::factory()->create([
            'is_active' => true,
        ]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'price' => 30000,
            'cost_price' => 17000,
            'is_active' => true,
            'track_stock' => true,
            'stock_qty' => 10,
        ]);

        $addon = Addon::factory()->create([
            'price' => 5000,
            'is_active' => true,
        ]);

        $cashMethod = PaymentMethod::factory()->create([
            'name' => 'Cash',
            'code' => 'cash',
            'is_active' => true,
        ]);

        $waiterCreate = $this->actingAs($waiter)->postJson(route('waiter.orders.store'), [
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => 2,
                    'addons' => [$addon->id],
                ],
            ],
            'discount_type' => 'none',
            'discount_value' => 0,
            'service' => 0,
            'notes' => 'table 5',
        ]);

        $waiterCreate->assertOk()->assertJsonStructure(['order_id']);

        $orderId = (int) $waiterCreate->json('order_id');
        $waitingOrder = Order::query()->with('items')->findOrFail($orderId);

        $this->assertSame('WAITING', $waitingOrder->status);
        $this->assertSame($waiter->id, $waitingOrder->user_id);
        $this->assertSame($waiter->id, $waitingOrder->waiter_id);
        $this->assertSame('WAITING', $waitingOrder->payment_method);
        $this->assertMatchesRegularExpression('/^WT-\d{14}-\d{4}$/', $waitingOrder->invoice_no);

        $product->refresh();
        $this->assertSame(8, $product->stock_qty);

        $waiterFeed = $this->actingAs($kasir)->getJson(route('pos.waiter-orders'));

        $waiterFeed
            ->assertOk()
            ->assertJsonFragment([
                'id' => $waitingOrder->id,
                'waiter_name' => $waiter->name,
            ]);

        $checkout = $this->actingAs($kasir)->postJson(route('pos.checkout'), [
            'open_bill_id' => $waitingOrder->id,
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => 3,
                    'addons' => [$addon->id],
                ],
            ],
            'discount_type' => 'none',
            'discount_value' => 0,
            'service' => 0,
            'payment_method_id' => $cashMethod->id,
            'cash_received' => 200000,
        ]);

        $checkout->assertOk()->assertJsonStructure(['redirect']);

        $paidOrder = Order::query()->with('items')->findOrFail($waitingOrder->id);

        $this->assertSame('PAID', $paidOrder->status);
        $this->assertSame($kasir->id, $paidOrder->user_id);
        $this->assertSame($waiter->id, $paidOrder->waiter_id);
        $this->assertMatchesRegularExpression('/^CS-\d{8}-\d{4}$/', $paidOrder->invoice_no);
        $this->assertSame(1, $paidOrder->items->count());
        $this->assertSame(3, (int) $paidOrder->items->first()->qty);

        $product->refresh();
        $this->assertSame(7, $product->stock_qty);
    }
}
