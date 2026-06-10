<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;

final class RatingService
{
    public static function syncProduct(int $productId): void
    {
        $product = Product::query()->find($productId);
        if (! $product) {
            return;
        }

        $stats = Review::query()
            ->where('product_id', $productId)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as cnt')
            ->first();

        $product->forceFill([
            'rating' => round((float) ($stats->avg_rating ?? 0), 2),
            'total_reviews' => (int) ($stats->cnt ?? 0),
        ])->save();

        self::syncSeller((int) $product->user_id);
    }

    public static function syncSeller(int $sellerId): void
    {
        $stats = Review::query()
            ->where('seller_id', $sellerId)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as cnt')
            ->first();

        User::query()->whereKey($sellerId)->update([
            'rating' => round((float) ($stats->avg_rating ?? 0), 2),
            'total_reviews' => (int) ($stats->cnt ?? 0),
        ]);
    }
}
