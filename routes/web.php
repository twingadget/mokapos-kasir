<?php

use App\Http\Controllers\Admin\CashierController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\PaymentMethodController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\PosController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WaiterController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (! auth()->check()) {
        return redirect()->route('login');
    }

    if (auth()->user()->canAccessAdminPanel()) {
        return redirect()->route('admin.reports.index');
    }

    if (auth()->user()->isWaiter()) {
        return redirect()->route('waiter.index');
    }

    return redirect()->route('pos.index');
});

Route::get('/dashboard', function () {
    return redirect()->to('/');
})->middleware('auth')->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::middleware(['auth', 'role:kasir'])
    ->prefix('pos')
    ->name('pos.')
    ->group(function () {
        Route::get('/', [PosController::class, 'index'])->name('index');
        Route::get('/waiter-orders', [PosController::class, 'waiterOrders'])->name('waiter-orders');
        Route::post('/open-bill', [PosController::class, 'saveOpenBill'])->name('open-bill.save');
        Route::post('/checkout', [PosController::class, 'checkout'])->name('checkout');
        Route::get('/history', [PosController::class, 'history'])->name('history');
        Route::get('/history/{order}', [PosController::class, 'show'])->name('show');
    });

Route::middleware(['auth', 'role:waiter'])
    ->prefix('waiter')
    ->name('waiter.')
    ->group(function () {
        Route::get('/', [WaiterController::class, 'index'])->name('index');
        Route::post('/orders', [WaiterController::class, 'store'])->name('orders.store');
        Route::get('/history', [WaiterController::class, 'history'])->name('history');
        Route::get('/history/{order}', [WaiterController::class, 'show'])->name('show');
    });

Route::middleware(['auth', 'role:admin|manager|kasir'])->group(function () {
    Route::get('/orders/{order}/receipt', [PosController::class, 'receipt'])->name('orders.receipt');
});

Route::middleware(['auth', 'role:admin|manager'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/', function () {
            return redirect()->route('admin.reports.index');
        })->name('index');

        Route::resource('categories', CategoryController::class)->only(['index', 'create', 'edit']);
        Route::resource('products', ProductController::class)->only(['index', 'create', 'edit']);
        Route::resource('payment-methods', PaymentMethodController::class)->only(['index', 'create', 'edit']);
        Route::resource('staff', CashierController::class)->names('cashiers')->only(['index', 'create', 'edit']);

        Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');

        Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [AdminOrderController::class, 'show'])->name('orders.show');
    });

Route::middleware(['auth', 'role:admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::resource('categories', CategoryController::class)->only(['store', 'update', 'destroy']);
        Route::resource('products', ProductController::class)->only(['store', 'update', 'destroy']);
        Route::resource('payment-methods', PaymentMethodController::class)->only(['store', 'update', 'destroy']);
        Route::resource('staff', CashierController::class)->names('cashiers')->only(['store', 'update', 'destroy']);

        Route::post('/orders/{order}/void', [AdminOrderController::class, 'void'])->name('orders.void');
    });

require __DIR__.'/auth.php';
