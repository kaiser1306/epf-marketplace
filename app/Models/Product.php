<?php

namespace App\Models;

use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

#[Fillable([
    'user_id',
    'category_id',
    'title',
    'slug',
    'description',
    'price',
    'sale_price',
    'sale_starts_at',
    'sale_ends_at',
    'quantity',
    'image',
    'images',
    'status',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, SoftDeletes;

    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'sale_starts_at' => 'datetime',
            'sale_ends_at' => 'datetime',
            'images' => 'array',
            'views' => 'integer',
            'rating' => 'decimal:2',
            'total_reviews' => 'integer',
            'sales_count' => 'integer',
            'quantity' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Product $product): void {
            if (empty($product->slug)) {
                $product->slug = static::uniqueSlug(Str::slug($product->title));
            }
        });

        static::updating(function (Product $product): void {
            if ($product->isDirty('title') && ! $product->isDirty('slug')) {
                $product->slug = static::uniqueSlug(Str::slug($product->title), $product->id);
            }
        });
    }

    public static function uniqueSlug(string $base, ?int $ignoreId = null): string
    {
        $slug = $base !== '' ? $base : 'product';
        $i = 2;
        while (static::query()
            ->where('slug', $slug)
            ->when($ignoreId !== null, fn (Builder $q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published');
    }

    public function isFlashSaleActive(): bool
    {
        if ($this->sale_price === null) {
            return false;
        }

        $now = now();
        if ($this->sale_starts_at !== null && $now->lt($this->sale_starts_at)) {
            return false;
        }
        if ($this->sale_ends_at !== null && $now->gt($this->sale_ends_at)) {
            return false;
        }

        return true;
    }

    public function effectivePrice(): string
    {
        if ($this->isFlashSaleActive()) {
            return (string) $this->sale_price;
        }

        return (string) $this->price;
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(Favorite::class);
    }
}
