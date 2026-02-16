<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\View\View;

class CashierController extends Controller
{
    public function index(): View
    {
        $cashiers = User::query()
            ->whereIn('role', [User::ROLE_KASIR, User::ROLE_WAITER, User::ROLE_MANAGER])
            ->orderBy('name')
            ->paginate(15);

        return view('admin.cashiers.index', [
            'cashiers' => $cashiers,
        ]);
    }

    public function create(): View
    {
        return view('admin.cashiers.create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'role' => ['required', 'in:'.User::ROLE_KASIR.','.User::ROLE_WAITER.','.User::ROLE_MANAGER],
        ]);

        User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'email_verified_at' => now(),
        ]);

        return redirect()->route('admin.cashiers.index')->with('success', 'Berhasil menyimpan staff.');
    }

    public function edit(User $cashier): View
    {
        $this->ensureStaff($cashier);

        return view('admin.cashiers.edit', [
            'cashier' => $cashier,
        ]);
    }

    public function update(Request $request, User $cashier): RedirectResponse
    {
        $this->ensureStaff($cashier);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,'.$cashier->id],
            'password' => ['nullable', 'string', 'min:6', 'confirmed'],
            'role' => ['required', 'in:'.User::ROLE_KASIR.','.User::ROLE_WAITER.','.User::ROLE_MANAGER],
        ]);

        $cashier->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ]);

        if (! empty($validated['password'])) {
            $cashier->update([
                'password' => Hash::make($validated['password']),
            ]);
        }

        return redirect()->route('admin.cashiers.index')->with('success', 'Berhasil menyimpan staff.');
    }

    public function destroy(User $cashier): RedirectResponse
    {
        $this->ensureStaff($cashier);

        $cashier->delete();

        return redirect()->route('admin.cashiers.index')->with('success', 'Staff berhasil dihapus.');
    }

    private function ensureStaff(User $user): void
    {
        abort_unless(in_array($user->role, [User::ROLE_KASIR, User::ROLE_WAITER, User::ROLE_MANAGER], true), 404);
    }
}
