<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CartItem;
use App\Models\Product;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = $request->user()
            ->cartItems()
            ->with(['product' => fn ($q) => $q->with('seller:id,name')])
            ->get();

        $payload = $items->map(function (CartItem $item) {
            $p = $item->product;
            $unit = $p ? $p->effectivePrice() : '0';
            $subtotal = bcmul($unit, (string) $item->quantity, 2);

            return [
                'id' => $item->id,
                'product' => $p ? [
                    'id' => $p->id,
                    'title' => $p->title,
                    'price' => $p->price,
                    'effective_price' => $p->effectivePrice(),
                    'is_on_sale' => $p->isFlashSaleActive(),
                    'image' => PublicStorage::url($p->image),
                    'quantity' => $p->quantity,
                ] : null,
                'quantity' => $item->quantity,
                'subtotal' => $subtotal,
                'seller' => $p && $p->seller ? [
                    'id' => $p->seller->id,
                    'name' => $p->seller->name,
                ] : null,
            ];
        });

        $total = $payload->sum(fn (array $row) => (float) $row['subtotal']);

        return response()->json([
            'items' => $payload->values()->all(),
            'total' => number_format($total, 2, '.', ''),
            'item_count' => $items->sum('quantity'),
        ]);
    }

    public function add(Request $request): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['sometimes', 'integer', 'min:1'],
        ]);

        $qty = $data['quantity'] ?? 1;
        $product = Product::query()->findOrFail($data['product_id']);

        if ($product->status !== 'published') {
            abort(422, __('Produit indisponible.'));
        }

        if ($qty > $product->quantity) {
            abort(422, __('Stock insuffisant.'));
        }

        $item = CartItem::query()->firstOrNew([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        $newQty = ($item->exists ? $item->quantity : 0) + $qty;

        if ($newQty > $product->quantity) {
            abort(422, __('Stock insuffisant.'));
        }

        $item->quantity = $newQty;
        $item->price_at_add = $product->effectivePrice();
        $item->save();

        $item->load(['product.seller:id,name']);

        return response()->json([
            'cart_item' => $this->cartItemPayload($item),
            'message' => __('Article ajouté au panier.'),
        ], 201);
    }

    public function updateItem(Request $request, CartItem $cartItem): JsonResponse
    {
        if ($cartItem->user_id !== $request->user()->id) {
            abort(403);
        }

        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = $cartItem->product;
        if (! $product || $data['quantity'] > $product->quantity) {
            abort(422, __('Stock insuffisant.'));
        }

        $cartItem->update([
            'quantity' => $data['quantity'],
            'price_at_add' => $product->effectivePrice(),
        ]);
        $cartItem->load(['product.seller:id,name']);

        return response()->json([
            'cart_item' => $this->cartItemPayload($cartItem),
            'message' => __('Panier mis à jour.'),
        ]);
    }

    public function removeItem(Request $request, CartItem $cartItem): JsonResponse
    {
        if ($cartItem->user_id !== $request->user()->id) {
            abort(403);
        }

        $cartItem->delete();

        return response()->json(['message' => __('Article retiré du panier.')]);
    }

    public function clear(Request $request): JsonResponse
    {
        $request->user()->cartItems()->delete();

        return response()->json(['message' => __('Panier vidé.')]);
    }

    /**
     * @return array<string, mixed>
     */
    private function cartItemPayload(CartItem $item): array
    {
        $p = $item->product;

        return [
            'id' => $item->id,
            'quantity' => $item->quantity,
            'product' => $p ? [
                'id' => $p->id,
                'title' => $p->title,
                'price' => $p->price,
                'effective_price' => $p->effectivePrice(),
                'image' => PublicStorage::url($p->image),
            ] : null,
        ];
    }
}
