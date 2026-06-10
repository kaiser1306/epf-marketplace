<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SellerController extends Controller
{
    public function show(User $user): JsonResponse
    {
        if (! in_array($user->role, ['seller', 'admin'], true)) {
            abort(404);
        }

        $productsCount = $user->products()->where('status', 'published')->count();

        $recent = Product::query()
            ->published()
            ->where('user_id', $user->id)
            ->orderByDesc('id')
            ->limit(8)
            ->get(['id', 'title', 'price', 'image']);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'bio' => $user->bio,
            'profile_image' => PublicStorage::url($user->profile_image),
            'phone' => $user->phone,
            'city' => $user->city,
            'rating' => $user->rating,
            'total_reviews' => $user->total_reviews,
            'created_at' => $user->created_at?->toIso8601String(),
            'products_count' => $productsCount,
            'recent_products' => $recent->map(fn (Product $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'price' => $p->price,
                'image' => PublicStorage::url($p->image),
            ]),
        ]);
    }

    public function products(Request $request, User $user): JsonResponse
    {
        if (! in_array($user->role, ['seller', 'admin'], true)) {
            abort(404);
        }

        $query = Product::query()
            ->published()
            ->where('user_id', $user->id);

        $sort = $request->string('sort', 'newest')->toString();
        if ($sort === 'popular') {
            $query->orderByDesc('sales_count')->orderByDesc('id');
        } else {
            $query->orderByDesc('id');
        }

        $perPage = min(max($request->integer('per_page', 12), 1), 100);
        $paginator = $query->paginate($perPage);

        $paginator->through(fn (Product $p) => [
            'id' => $p->id,
            'title' => $p->title,
            'price' => $p->price,
            'image' => PublicStorage::url($p->image),
            'rating' => $p->rating,
            'quantity' => $p->quantity,
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

    public function reviews(Request $request, User $user): JsonResponse
    {
        if (! in_array($user->role, ['seller', 'admin'], true)) {
            abort(404);
        }

        $query = Review::query()
            ->where('seller_id', $user->id)
            ->with(['buyer:id,name', 'product:id,title'])
            ->orderByDesc('id');

        $perPage = min(max($request->integer('per_page', 15), 1), 100);
        $paginator = $query->paginate($perPage);

        $paginator->through(fn (Review $r) => [
            'id' => $r->id,
            'rating' => $r->rating,
            'comment' => $r->comment,
            'buyer' => $r->buyer ? ['name' => $r->buyer->name] : null,
            'product' => $r->product ? ['title' => $r->product->title] : null,
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
}
