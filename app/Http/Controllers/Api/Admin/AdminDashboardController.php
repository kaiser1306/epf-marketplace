<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        return response()->json([
            'users_count' => User::query()->count(),
            'products_count' => Product::query()->withTrashed()->count(),
            'orders_count' => Order::query()->count(),
            'total_revenue' => Order::query()
                ->whereNotIn('status', ['cancelled'])
                ->sum('total_amount'),
        ]);
    }
}
