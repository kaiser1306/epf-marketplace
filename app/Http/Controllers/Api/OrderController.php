<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Services\CouponService;
use App\Services\OrderStatusService;
use App\Support\PublicStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'shipping_address' => ['required', 'string', 'max:500'],
            'shipping_city' => ['required', 'string', 'max:120'],
            'shipping_postal_code' => ['required', 'string', 'max:32'],
            'shipping_phone' => ['required', 'string', 'max:32'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'coupon_code' => ['nullable', 'string', 'max:40'],
        ]);

        $user = $request->user();

        $order = DB::transaction(function () use ($user, $data) {
            $cart = $user->cartItems()->with('product')->lockForUpdate()->get();

            if ($cart->isEmpty()) {
                abort(422, __('Panier vide.'));
            }

            foreach ($cart as $item) {
                $product = Product::query()->whereKey($item->product_id)->lockForUpdate()->first();
                if (! $product || $product->status !== 'published') {
                    abort(422, __('Un produit du panier n\'est plus disponible.'));
                }
                if ($item->quantity > $product->quantity) {
                    abort(422, __('Stock insuffisant pour :title.', ['title' => $product->title]));
                }
            }

            $orderNumber = $this->uniqueOrderNumber();

            $order = Order::query()->create([
                'user_id' => $user->id,
                'order_number' => $orderNumber,
                'total_amount' => 0,
                'discount_amount' => 0,
                'shipping_cost' => 0,
                'status' => 'pending',
                'shipping_address' => $data['shipping_address'],
                'shipping_city' => $data['shipping_city'],
                'shipping_postal_code' => $data['shipping_postal_code'],
                'shipping_phone' => $data['shipping_phone'],
                'notes' => $data['notes'] ?? null,
            ]);

            $total = '0.00';

            foreach ($cart as $item) {
                $product = Product::query()->whereKey($item->product_id)->lockForUpdate()->firstOrFail();
                $unit = $product->effectivePrice();
                $sub = bcmul($unit, (string) $item->quantity, 2);
                $total = bcadd($total, $sub, 2);

                OrderItem::query()->create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'seller_id' => $product->user_id,
                    'quantity' => $item->quantity,
                    'unit_price' => $unit,
                    'subtotal' => $sub,
                    'status' => 'pending',
                ]);

                $product->decrement('quantity', $item->quantity);
                $product->increment('sales_count', $item->quantity);
                $product->refresh();
                if ((int) $product->quantity <= 0) {
                    $product->forceFill(['status' => 'sold'])->save();
                }
            }

            $couponPayload = CouponService::validateAndComputeDiscount(
                $data['coupon_code'] ?? null,
                $total
            );

            $discount = $couponPayload['discount'];
            $final = bcsub($total, $discount, 2);

            $order->update([
                'total_amount' => $final,
                'discount_amount' => $discount,
                'coupon_id' => $couponPayload['coupon']?->id,
            ]);

            if ($couponPayload['coupon'] !== null) {
                $couponPayload['coupon']->increment('times_used');
            }

            $user->cartItems()->delete();

            return $order->fresh(['items.product', 'items.seller', 'coupon:id,code']);
        });

        return response()->json([
            'order' => $this->orderDetailPayload($order),
            'message' => __('Commande créée.'),
        ], 201);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorizeOrderAccess($request->user(), $order);

        $order->load(['items.product', 'items.seller:id,name', 'coupon:id,code']);

        return response()->json($this->orderDetailPayload($order));
    }

    public function myOrders(Request $request): JsonResponse
    {
        $query = $request->user()->orders()->orderByDesc('id');

        if ($request->filled('status')) {
            $request->validate([
                'status' => ['string', Rule::in(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])],
            ]);
            $query->where('status', $request->string('status'));
        }

        $perPage = min(max($request->integer('per_page', 12), 1), 100);
        $paginator = $query->withCount('items')->paginate($perPage);

        $paginator->through(fn (Order $o) => [
            'id' => $o->id,
            'order_number' => $o->order_number,
            'total_amount' => $o->total_amount,
            'status' => $o->status,
            'item_count' => $o->items_count,
            'created_at' => $o->created_at?->toIso8601String(),
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

    public function sellerOrders(Request $request): JsonResponse
    {
        if (! in_array($request->user()->role, ['seller', 'admin'], true)) {
            abort(403);
        }

        $sellerId = $request->user()->id;

        $query = Order::query()
            ->whereHas('items', fn ($q) => $q->where('seller_id', $sellerId))
            ->with([
                'buyer:id,name,phone',
                'items' => fn ($q) => $q->where('seller_id', $sellerId)->with('product:id,title'),
            ])
            ->orderByDesc('id');

        if ($request->filled('status')) {
            $request->validate([
                'status' => ['string', Rule::in(['pending', 'confirmed', 'shipped', 'delivered'])],
            ]);
            $query->where('status', $request->string('status'));
        }

        $perPage = min(max($request->integer('per_page', 12), 1), 100);
        $paginator = $query->paginate($perPage);

        $paginator->through(function (Order $order) use ($sellerId) {
            $items = $order->items->filter(fn (OrderItem $i) => (int) $i->seller_id === (int) $sellerId);
            $total = $items->sum(fn (OrderItem $i) => (float) $i->subtotal);

            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'buyer' => $order->buyer ? [
                    'id' => $order->buyer->id,
                    'name' => $order->buyer->name,
                    'phone' => $order->buyer->phone,
                ] : null,
                'items' => $items->map(fn (OrderItem $i) => [
                    'product' => $i->product ? ['title' => $i->product->title] : null,
                    'quantity' => $i->quantity,
                    'status' => $i->status,
                ]),
                'total_amount' => number_format($total, 2, '.', ''),
                'status' => $order->status,
                'created_at' => $order->created_at?->toIso8601String(),
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

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'string', Rule::in(['confirmed', 'shipped', 'delivered', 'cancelled'])],
        ]);

        $user = $request->user();
        $newStatus = $data['status'];

        if ($user->role === 'admin') {
            $order->items()->update(['status' => $newStatus]);
            $updates = ['status' => $newStatus];
            if ($newStatus === 'shipped') {
                $updates['shipped_at'] = $order->shipped_at ?? now();
            }
            if ($newStatus === 'delivered') {
                $updates['delivered_at'] = $order->delivered_at ?? now();
            }
            $order->update($updates);
        } else {
            if (! in_array($user->role, ['seller'], true)) {
                abort(403);
            }

            $items = $order->items()->where('seller_id', $user->id)->get();

            if ($items->isEmpty()) {
                abort(403);
            }

            foreach ($items as $item) {
                if ($newStatus === 'cancelled') {
                    abort(422, __('Annulation via ce point de terminaison non autorisée.'));
                }
                if (! OrderStatusService::canTransitionItem($item->status, $newStatus)) {
                    abort(422, __('Transition de statut invalide.'));
                }
                $item->update(['status' => $newStatus]);
            }

            $order->refresh()->load('items');
            OrderStatusService::syncOrderFromItems($order);
        }

        $order->refresh()->load(['items.product', 'items.seller']);

        return response()->json([
            'order' => $this->orderDetailPayload($order),
            'message' => __('Statut mis à jour.'),
        ]);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($order->user_id !== $user->id) {
            abort(403);
        }

        if ($order->status !== 'pending') {
            abort(422, __('Seules les commandes en attente peuvent être annulées.'));
        }

        $order->loadMissing('items');

        DB::transaction(function () use ($order) {
            foreach ($order->items as $item) {
                $product = $item->product;
                if ($product) {
                    $product->increment('quantity', $item->quantity);
                    $product->decrement('sales_count', $item->quantity);
                    $product->refresh();
                    if ($product->status === 'sold' && $product->quantity > 0) {
                        $product->forceFill(['status' => 'published'])->save();
                    }
                }
                $item->update(['status' => 'cancelled']);
            }

            $order->update(['status' => 'cancelled']);
        });

        $order->refresh()->load(['items.product', 'items.seller']);

        return response()->json([
            'order' => $this->orderDetailPayload($order),
            'message' => __('Commande annulée.'),
        ]);
    }

    private function uniqueOrderNumber(): string
    {
        do {
            $number = 'ORDER-'.strtoupper(Str::random(8));
        } while (Order::query()->where('order_number', $number)->exists());

        return $number;
    }

    private function authorizeOrderAccess($user, Order $order): void
    {
        if ($order->user_id === $user->id) {
            return;
        }

        if ($user->role === 'admin') {
            return;
        }

        if ($order->items()->where('seller_id', $user->id)->exists()) {
            return;
        }

        abort(403);
    }

    /**
     * @return array<string, mixed>
     */
    private function orderDetailPayload(Order $order): array
    {
        return [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'total_amount' => $order->total_amount,
            'discount_amount' => $order->discount_amount,
            'coupon' => $order->relationLoaded('coupon') && $order->coupon
                ? ['code' => $order->coupon->code]
                : null,
            'shipping_cost' => $order->shipping_cost,
            'status' => $order->status,
            'shipping_address' => $order->shipping_address,
            'shipping_city' => $order->shipping_city,
            'shipping_postal_code' => $order->shipping_postal_code,
            'items' => $order->items->map(fn (OrderItem $i) => [
                'id' => $i->id,
                'product' => $i->product ? [
                    'id' => $i->product->id,
                    'title' => $i->product->title,
                    'price' => $i->product->price,
                    'image' => PublicStorage::url($i->product->image),
                ] : null,
                'seller' => $i->seller ? [
                    'id' => $i->seller->id,
                    'name' => $i->seller->name,
                ] : null,
                'quantity' => $i->quantity,
                'unit_price' => $i->unit_price,
                'subtotal' => $i->subtotal,
                'status' => $i->status,
            ]),
            'created_at' => $order->created_at?->toIso8601String(),
            'shipped_at' => $order->shipped_at?->toIso8601String(),
            'delivered_at' => $order->delivered_at?->toIso8601String(),
        ];
    }
}
