<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminRoleMatrixTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_tidak_bisa_crud_master_data_dan_void_order(): void
    {
        $manager = User::factory()->create([
            'role' => User::ROLE_MANAGER,
        ]);

        $category = Category::factory()->create();
        $product = Product::factory()->create([
            'category_id' => $category->id,
        ]);
        $waitingOrder = Order::factory()->create([
            'status' => 'WAITING',
        ]);

        $this->actingAs($manager)
            ->post(route('admin.categories.store'), [])
            ->assertForbidden();

        $this->actingAs($manager)
            ->post(route('admin.products.store'), [])
            ->assertForbidden();

        $this->actingAs($manager)
            ->post(route('admin.payment-methods.store'), [])
            ->assertForbidden();

        $this->actingAs($manager)
            ->post(route('admin.cashiers.store'), [])
            ->assertForbidden();

        $this->actingAs($manager)
            ->put(route('admin.categories.update', $category), [])
            ->assertForbidden();

        $this->actingAs($manager)
            ->delete(route('admin.products.destroy', $product))
            ->assertForbidden();

        $this->actingAs($manager)
            ->post(route('admin.orders.void', $waitingOrder))
            ->assertForbidden();
    }

    public function test_admin_bisa_void_order_waiting_dan_stok_kembali(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);
        $waiter = User::factory()->create([
            'role' => User::ROLE_WAITER,
        ]);
        $category = Category::factory()->create([
            'is_active' => true,
        ]);
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'track_stock' => true,
            'stock_qty' => 5,
            'is_active' => true,
        ]);

        $order = Order::factory()->create([
            'user_id' => $waiter->id,
            'waiter_id' => $waiter->id,
            'status' => 'WAITING',
            'payment_method' => 'WAITING',
            'total' => 50000,
        ]);

        $order->items()->create([
            'product_id' => $product->id,
            'variant_id' => null,
            'name_snapshot' => $product->name,
            'price' => 25000,
            'cost_price' => 12000,
            'qty' => 2,
            'line_total' => 50000,
            'line_cost_total' => 24000,
            'notes' => null,
        ]);

        $product->decrement('stock_qty', 2);

        $response = $this->actingAs($admin)
            ->from(route('admin.orders.index'))
            ->post(route('admin.orders.void', $order));

        $response->assertRedirect(route('admin.orders.index'));

        $this->assertSame('VOID', $order->fresh()->status);
        $this->assertSame('CANCELED', $order->fresh()->payment_method);
        $this->assertSame(5, $product->fresh()->stock_qty);
    }
}
