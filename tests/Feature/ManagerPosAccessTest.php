<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagerPosAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_open_pos_page(): void
    {
        $manager = User::factory()->create([
            'role' => User::ROLE_MANAGER,
        ]);

        $response = $this->actingAs($manager)->get(route('pos.index'));

        $response->assertOk();
        $response->assertSee('Keranjang');
        $response->assertSee('Manager Online');
    }

    public function test_manager_can_save_open_bill_from_pos(): void
    {
        $manager = User::factory()->create([
            'role' => User::ROLE_MANAGER,
        ]);

        $category = Category::factory()->create([
            'is_active' => true,
        ]);

        $product = Product::factory()->create([
            'category_id' => $category->id,
            'is_active' => true,
            'track_stock' => true,
            'stock_qty' => 10,
            'price' => 50000,
            'cost_price' => 20000,
        ]);

        $response = $this->actingAs($manager)->postJson(route('pos.open-bill.save'), [
            'items' => [
                [
                    'product_id' => $product->id,
                    'qty' => 2,
                ],
            ],
            'discount_type' => 'none',
            'discount_value' => 0,
            'service' => 0,
        ]);

        $response->assertOk()->assertJsonStructure(['open_bill_id']);

        $this->assertDatabaseHas('orders', [
            'user_id' => $manager->id,
            'status' => 'OPEN_BILL',
        ]);
    }
}
