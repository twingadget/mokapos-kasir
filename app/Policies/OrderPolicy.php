<?php

namespace App\Policies;

use App\Models\Order;
use App\Models\User;

class OrderPolicy
{
    public function view(User $user, Order $order): bool
    {
        if ($user->isAdmin() || $user->isManager()) {
            return true;
        }

        if ($order->user_id === $user->id) {
            return true;
        }

        return $user->isWaiter() && $order->waiter_id === $user->id;
    }

    public function void(User $user, Order $order): bool
    {
        return $user->isAdmin() && $order->status === 'WAITING';
    }
}
