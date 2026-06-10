<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class SellerDashboardController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        if (! in_array($request->user()->role, ['seller', 'admin'], true)) {
            abort(403);
        }

        $sellerId = $request->user()->id;

        $itemQuery = OrderItem::query()->where('seller_id', $sellerId);

        $totalSales = (clone $itemQuery)
            ->whereHas('order', fn ($q) => $q->whereIn('status', ['delivered', 'shipped', 'confirmed', 'pending']))
            ->sum('subtotal');

        $totalOrders = Order::query()
            ->whereHas('items', fn ($q) => $q->where('seller_id', $sellerId))
            ->count();

        $pendingOrders = Order::query()
            ->where('status', 'pending')
            ->whereHas('items', fn ($q) => $q->where('seller_id', $sellerId))
            ->count();

        $productsQuery = Product::query()->where('user_id', $sellerId);

        $totalProducts = (clone $productsQuery)->count();
        $activeProducts = (clone $productsQuery)->where('status', 'published')->count();

        $recentOrders = Order::query()
            ->whereHas('items', fn ($q) => $q->where('seller_id', $sellerId))
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'order_number', 'total_amount', 'status', 'created_at']);

        $topProducts = Product::query()
            ->where('user_id', $sellerId)
            ->orderByDesc('sales_count')
            ->limit(5)
            ->get(['title', 'sales_count', 'price']);

        $monthExpr = DB::getDriverName() === 'sqlite'
            ? "strftime('%Y-%m', orders.created_at)"
            : 'DATE_FORMAT(orders.created_at, "%Y-%m")';

        $monthly = OrderItem::query()
            ->selectRaw("{$monthExpr} as month, SUM(order_items.subtotal) as amount")
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('order_items.seller_id', $sellerId)
            ->whereIn('orders.status', ['delivered', 'shipped', 'confirmed'])
            ->groupBy(DB::raw($monthExpr))
            ->orderBy('month')
            ->limit(12)
            ->get();

        return response()->json([
            'total_sales' => $totalSales,
            'total_orders' => $totalOrders,
            'pending_orders' => $pendingOrders,
            'total_products' => $totalProducts,
            'active_products' => $activeProducts,
            'average_rating' => $request->user()->rating,
            'recent_orders' => $recentOrders->map(fn (Order $o) => [
                'order_number' => $o->order_number,
                'total' => $o->total_amount,
                'status' => $o->status,
                'created_at' => $o->created_at?->toIso8601String(),
            ]),
            'top_products' => $topProducts->map(fn (Product $p) => [
                'title' => $p->title,
                'sales_count' => $p->sales_count,
                'revenue' => bcmul((string) $p->price, (string) $p->sales_count, 2),
            ]),
            'monthly_sales' => $monthly->map(fn ($row) => [
                'month' => $row->month,
                'amount' => $row->amount,
            ]),
        ]);
    }

    public function statistics(Request $request): JsonResponse
    {
        if (! in_array($request->user()->role, ['seller', 'admin'], true)) {
            abort(403);
        }

        $request->validate([
            'period' => ['nullable', 'string', Rule::in(['week', 'month', 'year'])],
        ]);

        $sellerId = $request->user()->id;
        $period = $request->string('period', 'month')->toString();

        $since = match ($period) {
            'week' => now()->subWeek(),
            'year' => now()->subYear(),
            default => now()->subMonth(),
        };

        $products = Product::query()->where('user_id', $sellerId);
        $totalViews = (clone $products)->sum('views');

        $ordersCount = Order::query()
            ->where('created_at', '>=', $since)
            ->whereHas('items', fn ($q) => $q->where('seller_id', $sellerId))
            ->count();

        $conversion = $totalViews > 0 ? round(($ordersCount / $totalViews) * 100, 2) : 0.0;

        $avgOrder = OrderItem::query()
            ->where('seller_id', $sellerId)
            ->whereHas('order', fn ($q) => $q->where('created_at', '>=', $since))
            ->selectRaw('AVG(subtotal) as avg_sub')
            ->value('avg_sub');

        return response()->json([
            'total_views' => $totalViews,
            'total_clicks' => (int) round($totalViews * 0.1),
            'conversion_rate' => (float) $conversion,
            'average_order_value' => round((float) ($avgOrder ?? 0), 2),
            'customer_satisfaction' => (float) $request->user()->rating,
            'growth_rate' => 0.0,
        ]);
    }
}
