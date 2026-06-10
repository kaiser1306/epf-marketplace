<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'user_id',
    'coupon_id',
    'order_number',
    'total_amount',
    'discount_amount',
    'shipping_cost',
    'status',
    'shipping_address',
    'shipping_city',
    'shipping_postal_code',
    'shipping_phone',
    'notes',
    'shipped_at',
    'delivered_at',
])]
class Order extends Model
{
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'shipped_at' => 'datetime',
            'delivered_at' => 'datetime',
        ];
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function coupon(): BelongsTo
    {
        return $this->belongsTo(Coupon::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
