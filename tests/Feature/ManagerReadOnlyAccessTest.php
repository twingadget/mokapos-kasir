<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ManagerReadOnlyAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_open_admin_read_pages(): void
    {
        $manager = User::factory()->create([
            'role' => User::ROLE_MANAGER,
        ]);

        $this->actingAs($manager)
            ->get(route('admin.reports.index'))
            ->assertOk();

        $this->actingAs($manager)
            ->get(route('admin.products.index'))
            ->assertOk();

        $this->actingAs($manager)
            ->get(route('admin.orders.index'))
            ->assertOk();
    }

    public function test_manager_cannot_export_report_csv(): void
    {
        $manager = User::factory()->create([
            'role' => User::ROLE_MANAGER,
        ]);

        $this->actingAs($manager)
            ->get(route('admin.reports.export'))
            ->assertForbidden();
    }


    public function test_admin_can_export_report_csv(): void
    {
        $admin = User::factory()->create([
            'role' => User::ROLE_ADMIN,
        ]);

        $this->actingAs($admin)
            ->get(route('admin.reports.export'))
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=utf-8');
    }

    public function test_manager_cannot_store_products(): void
    {
        $manager = User::factory()->create([
            'role' => User::ROLE_MANAGER,
        ]);

        $this->actingAs($manager)
            ->post(route('admin.products.store'), [])
            ->assertForbidden();
    }
}

