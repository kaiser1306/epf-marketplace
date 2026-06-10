<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Review;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->published()
            ->with(['category:id,name,slug', 'seller:id,name,profile_image,rating']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->integer('category_id'));
        }

        if ($request->filled('seller_id')) {
            $query->where('user_id', $request->integer('seller_id'));
        }

        if ($request->filled('min_price')) {
            $query->where('price', '>=', $request->input('min_price'));
        }

        if ($request->filled('max_price')) {
            $query->where('price', '<=', $request->input('max_price'));
        }

        $search = $request->input('search', $request->input('q'));
        if (is_string($search) && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(function ($qBuilder) use ($term): void {
                $qBuilder->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term);
            });
        }

        $sort = $request->string('sort', 'newest')->toString();
        match ($sort) {
            'popular' => $query->orderByDesc('sales_count')->orderByDesc('id'),
            'cheapest' => $query->orderBy('price')->orderByDesc('id'),
            'most_rated' => $query->orderByDesc('rating')->orderByDesc('total_reviews'),
            default => $query->orderByDesc('id'),
        };

        $perPage = min(max($request->integer('per_page', 12), 1), 100);
        $paginator = $query->paginate($perPage);

        $paginator->through(fn (Product $p) => $this->publicListItem($p));

        return response()->json([
            'data' => $paginator->items(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function topSelling(Request $request): JsonResponse
    {
        $limit = min(max($request->integer('limit', 10), 1), 50);

        $items = Product::query()
            ->published()
            ->with(['category:id,name,slug', 'seller:id,name,profile_image,rating'])
            ->orderByDesc('sales_count')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return response()->json([
            'data' => $items->map(fn (Product $p) => $this->publicListItem($p)),
        ]);
    }

    public function show(Product $product): JsonResponse
    {
        if ($product->status !== 'published') {
            abort(404);
        }

        $product->increment('views');

        $product->load([
            'category:id,name,slug,description,icon',
            'seller:id,name,bio,profile_image,rating,total_reviews,phone,city',
        ]);

        $reviews = Review::query()
            ->where('product_id', $product->id)
            ->with('buyer:id,name,profile_image')
            ->orderByDesc('id')
            ->limit(20)
            ->get();

        return response()->json($this->productDetailPayload($product, $reviews));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'image' => ['required', 'file', 'image', 'max:4096', 'mimes:jpeg,png,jpg,webp,gif'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'image', 'max:4096', 'mimes:jpeg,png,jpg,webp,gif'],
            'status' => ['nullable', 'string', Rule::in(['draft', 'published'])],
            'sale_price' => ['nullable', 'numeric', 'min:0', 'lt:price'],
            'sale_starts_at' => ['nullable', 'date'],
            'sale_ends_at' => ['nullable', 'date', 'after_or_equal:sale_starts_at'],
        ]);

        $mainPath = $request->file('image')->store('products', 'public');
        $extra = [];
        foreach ($request->file('images', []) as $file) {
            $extra[] = $file->store('products', 'public');
        }

        $product = $request->user()->products()->create([
            'category_id' => $data['category_id'],
            'title' => $data['title'],
            'description' => $data['description'],
            'price' => $data['price'],
            'sale_price' => $data['sale_price'] ?? null,
            'sale_starts_at' => $data['sale_starts_at'] ?? null,
            'sale_ends_at' => $data['sale_ends_at'] ?? null,
            'quantity' => $data['quantity'] ?? 1,
            'image' => $mainPath,
            'images' => $extra,
            'status' => $data['status'] ?? 'draft',
        ]);

        $product->load(['category:id,name,slug', 'seller:id,name']);

        return response()->json([
            'product' => $this->sellerProductPayload($product),
            'message' => __('Produit créé.'),
        ], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        if ($product->user_id !== $request->user()->id) {
            abort(403);
        }

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string'],
            'price' => ['sometimes', 'numeric', 'min:0'],
            'quantity' => ['sometimes', 'integer', 'min:0'],
            'category_id' => ['sometimes', 'integer', 'exists:categories,id'],
            'image' => ['sometimes', 'file', 'image', 'max:4096', 'mimes:jpeg,png,jpg,webp,gif'],
            'images' => ['nullable', 'array', 'max:10'],
            'images.*' => ['file', 'image', 'max:4096', 'mimes:jpeg,png,jpg,webp,gif'],
            'status' => ['sometimes', 'string', Rule::in(['draft', 'published', 'sold', 'inactive'])],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'sale_starts_at' => ['nullable', 'date'],
            'sale_ends_at' => ['nullable', 'date', 'after_or_equal:sale_starts_at'],
        ]);

        $newPrice = $data['price'] ?? $product->price;
        if (array_key_exists('sale_price', $data) && $data['sale_price'] !== null && (float) $data['sale_price'] >= (float) $newPrice) {
            abort(422, __('Le prix promo doit être inférieur au prix normal.'));
        }

        if ($request->hasFile('image')) {
            $this->deleteProductImages($product);
            $product->image = $request->file('image')->store('products', 'public');
            $product->images = [];
        }

        if ($request->hasFile('images')) {
            $current = $product->images ?? [];
            foreach ($request->file('images') as $file) {
                $current[] = $file->store('products', 'public');
            }
            $product->images = $current;
        }

        $product->fill([
            'title' => $data['title'] ?? $product->title,
            'description' => $data['description'] ?? $product->description,
            'price' => $data['price'] ?? $product->price,
            'quantity' => $data['quantity'] ?? $product->quantity,
            'category_id' => $data['category_id'] ?? $product->category_id,
            'status' => $data['status'] ?? $product->status,
            'sale_price' => array_key_exists('sale_price', $data) ? $data['sale_price'] : $product->sale_price,
            'sale_starts_at' => array_key_exists('sale_starts_at', $data) ? $data['sale_starts_at'] : $product->sale_starts_at,
            'sale_ends_at' => array_key_exists('sale_ends_at', $data) ? $data['sale_ends_at'] : $product->sale_ends_at,
        ]);
        $product->save();
        $product->load(['category:id,name,slug', 'seller:id,name']);

        return response()->json([
            'product' => $this->sellerProductPayload($product),
            'message' => __('Produit mis à jour.'),
        ]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        if ($product->user_id !== $request->user()->id) {
            abort(403);
        }

        $this->deleteProductImages($product);
        $product->delete();

        return response()->json([
            'message' => __('Produit supprimé.'),
        ]);
    }

    public function myProducts(Request $request): JsonResponse
    {
        $query = $request->user()->products()->with(['category:id,name,slug']);

        if ($request->filled('status')) {
            $request->validate([
                'status' => ['string', Rule::in(['draft', 'published', 'sold'])],
            ]);
            $query->where('status', $request->string('status'));
        }

        $query->orderByDesc('id');

        $perPage = min(max($request->integer('per_page', 12), 1), 100);
        $paginator = $query->paginate($perPage);

        $paginator->through(fn (Product $p) => [
            'id' => $p->id,
            'title' => $p->title,
            'price' => $p->price,
            'image' => PublicStorage::url($p->image),
            'status' => $p->status,
            'quantity' => $p->quantity,
            'views' => $p->views,
            'rating' => $p->rating,
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

    public function isFavorite(Request $request, Product $product): JsonResponse
    {
        $exists = $request->user()->favorites()->where('product_id', $product->id)->exists();

        return response()->json(['is_favorite' => $exists]);
    }

    private function deleteProductImages(Product $product): void
    {
        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }
        foreach ($product->images ?? [] as $path) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function publicListItem(Product $product): array
    {
        return [
            'id' => $product->id,
            'title' => $product->title,
            'price' => $product->price,
            'effective_price' => $product->effectivePrice(),
            'is_on_sale' => $product->isFlashSaleActive(),
            'sale_ends_at' => $product->sale_ends_at?->toIso8601String(),
            'image' => PublicStorage::url($product->image),
            'rating' => $product->rating,
            'sales_count' => $product->sales_count,
            'seller' => $product->seller ? [
                'id' => $product->seller->id,
                'name' => $product->seller->name,
            ] : null,
        ];
    }

    /**
     * @param  Collection<int, Review>  $reviews
     * @return array<string, mixed>
     */
    private function productDetailPayload(Product $product, $reviews): array
    {
        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'description' => $product->description,
            'price' => $product->price,
            'effective_price' => $product->effectivePrice(),
            'is_on_sale' => $product->isFlashSaleActive(),
            'sale_price' => $product->sale_price,
            'sale_starts_at' => $product->sale_starts_at?->toIso8601String(),
            'sale_ends_at' => $product->sale_ends_at?->toIso8601String(),
            'quantity' => $product->quantity,
            'image' => PublicStorage::url($product->image),
            'images' => collect($product->images ?? [])->map(fn (string $p) => PublicStorage::url($p))->filter()->values()->all(),
            'status' => $product->status,
            'views' => $product->views,
            'rating' => $product->rating,
            'total_reviews' => $product->total_reviews,
            'seller' => $product->seller ? [
                'id' => $product->seller->id,
                'name' => $product->seller->name,
                'bio' => $product->seller->bio,
                'profile_image' => PublicStorage::url($product->seller->profile_image),
                'rating' => $product->seller->rating,
                'total_reviews' => $product->seller->total_reviews,
                'phone' => $product->seller->phone,
                'city' => $product->seller->city,
            ] : null,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug,
            ] : null,
            'reviews' => $reviews->map(fn (Review $r) => [
                'id' => $r->id,
                'rating' => $r->rating,
                'comment' => $r->comment,
                'buyer' => $r->buyer ? [
                    'name' => $r->buyer->name,
                    'profile_image' => PublicStorage::url($r->buyer->profile_image),
                ] : null,
                'created_at' => $r->created_at?->toIso8601String(),
            ]),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function sellerProductPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'description' => $product->description,
            'price' => $product->price,
            'effective_price' => $product->effectivePrice(),
            'sale_price' => $product->sale_price,
            'sale_starts_at' => $product->sale_starts_at?->toIso8601String(),
            'sale_ends_at' => $product->sale_ends_at?->toIso8601String(),
            'quantity' => $product->quantity,
            'image' => PublicStorage::url($product->image),
            'images' => collect($product->images ?? [])->map(fn (string $p) => PublicStorage::url($p))->filter()->values()->all(),
            'status' => $product->status,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null,
        ];
    }
}
