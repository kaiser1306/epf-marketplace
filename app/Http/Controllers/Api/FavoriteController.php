<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Favorite;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FavoriteController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'sort' => ['nullable', 'string', Rule::in(['newest', 'price_low_to_high', 'price_high_to_low'])],
        ]);

        $query = Favorite::query()
            ->where('user_id', $request->user()->id)
            ->with(['product' => fn ($q) => $q->with('seller:id,name')]);

        $sort = $request->string('sort', 'newest')->toString();
        match ($sort) {
            'price_low_to_high' => $query->join('products', 'products.id', '=', 'favorites.product_id')
                ->orderBy('products.price')
                ->select('favorites.*'),
            'price_high_to_low' => $query->join('products', 'products.id', '=', 'favorites.product_id')
                ->orderByDesc('products.price')
                ->select('favorites.*'),
            default => $query->orderByDesc('favorites.id'),
        };

        $perPage = min(max($request->integer('per_page', 12), 1), 100);
        $paginator = $query->paginate($perPage);

        $paginator->through(function (Favorite $f) {
            $p = $f->product;

            return [
                'id' => $p?->id,
                'title' => $p?->title,
                'price' => $p?->price,
                'image' => PublicStorage::url($p?->image),
                'rating' => $p?->rating,
                'seller' => $p && $p->seller ? ['name' => $p->seller->name] : null,
            ];
        });

        return response()->json([
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function add(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
        ]);

        Favorite::query()->firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $data['product_id'],
        ]);

        return response()->json(['message' => __('Ajouté aux favoris.')]);
    }

    public function remove(Request $request, int $product_id): JsonResponse
    {
        Favorite::query()
            ->where('user_id', $request->user()->id)
            ->where('product_id', $product_id)
            ->delete();

        return response()->json(['message' => __('Retiré des favoris.')]);
    }
}
