<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::query()
            ->withCount(['products as products_count' => fn ($q) => $q->where('status', 'published')])
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'description', 'icon']);

        $data = $categories->map(fn (Category $c) => [
            'id' => $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'description' => $c->description,
            'icon' => $c->icon,
            'products_count' => $c->products_count,
        ]);

        return response()->json($data);
    }

    public function show(Category $category): JsonResponse
    {
        $category->loadCount(['products as products_count' => fn ($q) => $q->where('status', 'published')]);

        $recent = Product::query()
            ->published()
            ->where('category_id', $category->id)
            ->orderByDesc('id')
            ->limit(10)
            ->get(['id', 'title', 'price', 'image']);

        return response()->json([
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
            'icon' => $category->icon,
            'products_count' => $category->products_count,
            'recent_products' => $recent->map(fn (Product $p) => [
                'id' => $p->id,
                'title' => $p->title,
                'price' => $p->price,
                'image' => PublicStorage::url($p->image),
            ]),
        ]);
    }
}
