<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Services\RatingService;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ReviewController extends Controller
{
    public function index(Request $request, Product $product): JsonResponse
    {
        $request->validate([
            'sort' => ['nullable', 'string', Rule::in(['newest', 'highest_rated', 'lowest_rated'])],
        ]);

        $query = Review::query()
            ->where('product_id', $product->id)
            ->with('buyer:id,name,profile_image');

        $sort = $request->string('sort', 'newest')->toString();
        match ($sort) {
            'highest_rated' => $query->orderByDesc('rating')->orderByDesc('id'),
            'lowest_rated' => $query->orderBy('rating')->orderByDesc('id'),
            default => $query->orderByDesc('id'),
        };

        $perPage = min(max($request->integer('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        $paginator->through(fn (Review $r) => [
            'id' => $r->id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'buyer' => $r->buyer ? [
                'name' => $r->buyer->name,
                'profile_image' => PublicStorage::url($r->buyer->profile_image),
            ] : null,
            'created_at' => $r->created_at?->toIso8601String(),
        ]);

        return response()->json([
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        if (! $request->user()->hasPurchasedProduct($product->id)) {
            abort(403, __('Vous devez avoir acheté ce produit pour laisser un avis.'));
        }

        $data = $request->validate([
            'rating' => ['required', 'integer', Rule::in([1, 2, 3, 4, 5])],
            'comment' => ['nullable', 'string', 'max:5000'],
        ]);

        $review = Review::query()->updateOrCreate(
            [
                'product_id' => $product->id,
                'buyer_id' => $request->user()->id,
            ],
            [
                'seller_id' => $product->user_id,
                'rating' => $data['rating'],
                'comment' => $data['comment'] ?? null,
            ]
        );

        RatingService::syncProduct($product->id);

        $review->load('buyer:id,name,profile_image');

        return response()->json([
            'review' => [
                'id' => $review->id,
                'rating' => $review->rating,
                'comment' => $review->comment,
                'buyer' => $review->buyer ? [
                    'name' => $review->buyer->name,
                    'profile_image' => PublicStorage::url($review->buyer->profile_image),
                ] : null,
                'created_at' => $review->created_at?->toIso8601String(),
            ],
            'message' => __('Avis enregistré.'),
        ], 201);
    }

    public function destroy(Request $request, Review $review): JsonResponse
    {
        if ($review->buyer_id !== $request->user()->id) {
            abort(403);
        }

        $productId = (int) $review->product_id;
        $review->delete();
        RatingService::syncProduct($productId);

        return response()->json([
            'message' => __('Avis supprimé.'),
        ]);
    }
}
