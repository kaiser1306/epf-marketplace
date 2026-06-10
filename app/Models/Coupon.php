<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'code',
    'type',
    'value',
    'usage_limit',
    'times_used',
    'min_order_total',
    'starts_at',
    'ends_at',
    'is_active',
])]
class Coupon extends Model
{
    protected static function booted(): void
    {
        static::saving(function (Coupon $coupon): void {
            $coupon->code = mb_strtoupper(trim($coupon->code));
        });
    }

    protected function casts(): array
    {
        return [
            'value' => 'decimal:2',
            'min_order_total' => 'decimal:2',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function isCurrentlyValid(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = now();
        if ($this->starts_at && $now->lt($this->starts_at)) {
            return false;
        }
        if ($this->ends_at && $now->gt($this->ends_at)) {
            return false;
        }

        if ($this->usage_limit !== null && $this->times_used >= $this->usage_limit) {
            return false;
        }

        return true;
    }
}
