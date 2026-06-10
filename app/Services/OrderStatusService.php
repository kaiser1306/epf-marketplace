<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;

final class OrderStatusService
{
    /**
     * @var array<string, int>
     */
    private const RANK = [
        'pending' => 0,
        'confirmed' => 1,
        'shipped' => 2,
        'delivered' => 3,
        'cancelled' => -1,
    ];

    /**
     * @return list<string>
     */
    private static function rankToStatusOrder(): array
    {
        return ['pending', 'confirmed', 'shipped', 'delivered'];
    }

    public static function syncOrderFromItems(Order $order): void
    {
        $order->loadMissing('items');

        if ($order->items->isEmpty()) {
            return;
        }

        if ($order->items->every(fn (OrderItem $i) => $i->status === 'cancelled')) {
            $order->forceFill(['status' => 'cancelled'])->save();

            return;
        }

        $active = $order->items->filter(fn (OrderItem $i) => $i->status !== 'cancelled');

        $overallRank = $active->map(fn (OrderItem $i) => self::RANK[$i->status] ?? 0)->min();

        $orderStatus = 'pending';
        foreach (self::rankToStatusOrder() as $s) {
            if ((self::RANK[$s] ?? 0) === $overallRank) {
                $orderStatus = $s;
                break;
            }
        }

        $updates = ['status' => $orderStatus];

        if ($orderStatus === 'shipped' && ! $order->shipped_at) {
            $updates['shipped_at'] = now();
        }

        if ($orderStatus === 'delivered' && ! $order->delivered_at) {
            $updates['delivered_at'] = now();
        }

        $order->forceFill($updates)->save();
    }

    public static function canTransitionItem(string $from, string $to): bool
    {
        $allowed = [
            'pending' => ['confirmed'],
            'confirmed' => ['shipped'],
            'shipped' => ['delivered'],
            'delivered' => [],
            'cancelled' => [],
        ];

        return in_array($to, $allowed[$from] ?? [], true);
    }
}
