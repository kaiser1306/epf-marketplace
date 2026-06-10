<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SearchController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => ['required', 'string', 'min:1', 'max:255'],
            'type' => ['nullable', 'string', Rule::in(['products', 'sellers', 'categories', 'all'])],
            'limit' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $limit = $data['limit'] ?? 10;
        $type = $data['type'] ?? 'all';
        $q = '%'.$data['q'].'%';

        $products = collect();
        $sellers = collect();
        $categories = collect();

        if (in_array($type, ['products', 'all'], true)) {
            $products = Product::query()
                ->published()
                ->where(function ($query) use ($q): void {
                    $query->where('title', 'like', $q)->orWhere('description', 'like', $q);
                })
                ->orderByDesc('id')
                ->limit($limit)
                ->get(['id', 'title', 'price', 'image'])
                ->map(fn (Product $p) => [
                    'id' => $p->id,
                    'title' => $p->title,
                    'price' => $p->price,
                    'image' => PublicStorage::url($p->image),
                ]);
        }

        if (in_array($type, ['sellers', 'all'], true)) {
            $sellers = User::query()
                ->whereIn('role', ['seller', 'admin'])
                ->where('name', 'like', $q)
                ->orderByDesc('id')
                ->limit($limit)
                ->get(['id', 'name', 'profile_image', 'rating'])
                ->map(fn (User $u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'profile_image' => PublicStorage::url($u->profile_image),
                    'rating' => $u->rating,
                ]);
        }

        if (in_array($type, ['categories', 'all'], true)) {
            $categories = Category::query()
                ->where(function ($query) use ($q): void {
                    $query->where('name', 'like', $q)->orWhere('slug', 'like', $q);
                })
                ->orderBy('name')
                ->limit($limit)
                ->get(['id', 'name', 'slug'])
                ->map(fn (Category $c) => [
                    'id' => $c->id,
                    'name' => $c->name,
                    'slug' => $c->slug,
                ]);
        }

        return response()->json([
            'products' => $products,
            'sellers' => $sellers,
            'categories' => $categories,
        ]);
    }
}
